import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.pending = []
    window.calls = []
    const timers = new Map()
    const interval = window.setInterval
    const clear = window.clearInterval
    window.setInterval = (fn, delay) => {
      if (delay !== 3500) return interval(fn, delay)
      const id = -Math.random()
      timers.set(id, fn)
      return id
    }
    window.clearInterval = id => timers.delete(id) || clear(id)
    window.tickOrders = () => timers.forEach(fn => fn())
    const fetch = window.fetch
    window.fetch = (url, init = {}) => {
      if (String(url).includes('/api/orders/42') || /\/api\/admin\/products\?/.test(url)) {
        const request = { url, signal: init.signal }
        window.calls.push(request)
        return new Promise(resolve => window.pending.push({ ...request, resolve }))
      }
      if (String(url).includes('/api/')) return Promise.resolve(new Response('[]'))
      return fetch(url, init)
    }
    window.reply = (index, data) => window.pending[index].resolve(new Response(JSON.stringify(data)))
  })
  for (const [name, component, props] of [
    ['order', '/src/user/components/OrderReviewPage.jsx', { initialOrder: { id: 42, orderNumber: 'FUNI-2026-000042', status: 'PENDING', items: [] }, cartItems: [], cart: {}, subtotal: 0 }],
    ['products', '/src/admin/AdminProductManagement.jsx', { currentUser: { role: 'ADMIN' } }],
  ]) {
    const routePath = `/__audit_${name}`
    await page.route(`**${routePath}`, async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml(routePath, `
      <div id="root"></div><script type="module">
      import React from 'react'; import {createRoot} from 'react-dom/client'; import Component from '${component}';
      window.root = createRoot(document.getElementById('root')); window.root.render(React.createElement(Component, ${JSON.stringify(props)}));
      </script>`) }))
    await page.goto(new URL(routePath, server.resolvedUrls.local[0]).href, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.calls.length === 1)
    if (name === 'order') {
      await page.evaluate(() => { window.tickOrders(); window.tickOrders() })
      assert.equal(await page.evaluate(() => window.calls.length), 1, 'slow status requests must not overlap')
      await page.evaluate(() => window.reply(0, { order: { status: 'CONFIRMED' }, items: [] }))
      await page.waitForFunction(() => window.calls.length === 2)
      await page.evaluate(() => window.reply(1, { order: { status: 'CONFIRMED' }, items: [] }))
      await page.waitForFunction(() => !document.querySelector('.spin-anim'))
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); window.tickOrders() })
      assert.equal(await page.evaluate(() => window.calls.length), 2)
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); window.tickOrders() })
      await page.waitForFunction(() => window.calls.length === 3)
      await page.evaluate(() => window.reply(2, { order: { status: 'COMPLETED' }, items: [] }))
      await page.waitForFunction(() => document.body.textContent.includes('Đơn hàng hoàn tất thành công!'))
      await page.evaluate(() => window.tickOrders())
      assert.equal(await page.evaluate(() => window.calls.length), 3, 'terminal orders must stop polling')
      console.log('PASS success page: slow API, hidden tab, terminal order stops polling')
    } else {
      await page.getByPlaceholder('Tìm theo tên sản phẩm nội thất, kích thước, vật liệu...').fill('new')
      await page.getByPlaceholder('Tìm theo tên sản phẩm nội thất, kích thước, vật liệu...').press('Enter')
      await page.waitForFunction(() => window.calls.length === 2)
      assert.equal(await page.evaluate(() => window.calls[0].signal.aborted), true)
      const product = { id: 2, name: 'Newest result', categoryName: 'Test', sellingPrice: 100, quantity: 5, isActive: true }
      await page.evaluate(product => window.reply(1, { content: [product], totalPages: 1, totalElements: 1, page: 0 }), product)
      await page.getByText('Newest result', { exact: true }).waitFor()
      await page.evaluate(() => window.reply(0, { content: [], totalPages: 1, totalElements: 0, page: 0 }))
      await page.waitForTimeout(80)
      assert.equal(await page.getByText('Newest result', { exact: true }).count(), 1, 'old response must not erase new results')
      await page.getByPlaceholder('Tìm theo tên sản phẩm nội thất, kích thước, vật liệu...').press('Enter')
      await page.waitForFunction(() => window.calls.length === 3)
      await page.evaluate(() => window.root.unmount())
      assert.equal(await page.evaluate(() => window.calls.at(-1).signal.aborted), true)
      console.log('PASS product list: cancels old requests, ignores stale responses, aborts on unmount')
    }
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
  await server.close()
}
