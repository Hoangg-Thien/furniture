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
    window.calls = []
    const originalFetch = window.fetch
    window.fetch = (url, init = {}) => {
      if (!String(url).includes('/api/admin/customers')) return originalFetch(url, init)
      // Deliberately resolve aborted requests too: stale responses must never touch state.
      return new Promise(resolve => window.calls.push({ url: String(url), init, resolve }))
    }
    window.reply = (index, data, status = 200) => window.calls[index].resolve(new Response(JSON.stringify(data), { status }))
  })
  await page.route('**/__customer_race', async route => route.fulfill({ contentType: 'text/html', body: await server.transformIndexHtml('/__customer_race', `
    <div id="root"></div><script type="module">
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import Component from '/src/admin/AdminCustomerManagement.jsx';
    window.root = createRoot(document.getElementById('root')); window.root.render(React.createElement(Component));
    </script>`) }))
  await page.goto(new URL('/__customer_race', server.resolvedUrls.local[0]).href)
  await page.waitForFunction(() => window.calls.length === 1)
  const customers = [1, 2].map(id => ({ id, fullName: `Customer ${id}`, customerTier: 'NEW', completedOrders: 0, totalOrders: 0, totalSpent: 0 }))
  const list = { content: customers, page: 0, totalPages: 1, totalElements: 2 }
  await page.evaluate(data => window.reply(0, data), list)
  const edit = id => page.locator('tr').filter({ hasText: `Customer ${id}` }).getByRole('button', { name: 'Sửa', exact: true })
  const close = () => page.locator('.modal-close-btn').click()
  const nameInput = () => page.locator('.drawer-form input').first()
  const detail = id => ({ ...customers[id - 1], phone: `090000000${id}`, email: `c${id}@example.test`, address: `Street ${id}`, orders: [], cartItems: [] })

  await edit(1).click()
  await page.waitForFunction(() => window.calls.length === 2)
  await close()
  await edit(2).click()
  await page.waitForFunction(() => window.calls.length === 3)
  await page.evaluate(data => window.reply(2, data), detail(2))
  await nameInput().waitFor()
  await page.evaluate(data => window.reply(1, data), detail(1))
  await page.waitForTimeout(80)
  assert.equal(await nameInput().inputValue(), 'Customer 2')
  assert.equal(await page.evaluate(() => window.calls[1].init.signal.aborted), true)
  console.log('PASS late customer 1 response cannot overwrite customer 2 form')

  await page.getByRole('button', { name: 'Lưu Thông Tin Khách Hàng' }).click()
  await page.waitForFunction(() => window.calls.length === 4)
  assert.match(await page.evaluate(() => window.calls[3].url), /\/customers\/2$/)
  assert.equal(await page.evaluate(() => JSON.parse(window.calls[3].init.body).fullName), 'Customer 2')
  await close()
  await edit(1).click()
  await page.waitForFunction(() => window.calls.length === 5)
  await page.evaluate(data => window.reply(4, data), detail(1))
  await nameInput().waitFor()
  await page.evaluate(() => window.reply(3, {}))
  await page.waitForTimeout(80)
  assert.equal(await nameInput().inputValue(), 'Customer 1')
  assert.equal(await page.locator('.customer-meta-box').textContent().then(text => text.includes('undefined')), false)
  console.log('PASS save uses matching ID and cannot update another open profile')

  await close()
  await edit(2).click()
  await page.waitForFunction(() => window.calls.length === 6)
  await page.evaluate(() => window.reply(5, { error: 'offline' }, 500))
  await page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor()
  assert.equal(await page.locator('.drawer-form').count(), 0)
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.waitForFunction(() => window.calls.length === 7)
  await page.evaluate(data => window.reply(6, data), detail(2))
  await nameInput().waitFor()
  console.log('PASS failed details hide stale form and retry recovers')
  await close()

  const search = page.locator('input').first()
  await search.fill('first')
  await page.waitForFunction(() => window.calls.length === 8)
  await search.fill('second')
  await page.waitForFunction(() => window.calls.length === 9)
  await page.evaluate(data => window.reply(8, data), list)
  await page.getByText('Customer 2', { exact: true }).first().waitFor()
  await page.evaluate(() => window.reply(7, { content: [], totalPages: 0, totalElements: 0 }))
  await page.waitForTimeout(80)
  assert.equal(await page.getByText('Customer 2', { exact: true }).count(), 1)
  await search.fill('pending')
  await page.waitForFunction(() => window.calls.length === 10)
  await page.evaluate(() => window.root.unmount())
  assert.equal(await page.evaluate(() => window.calls[9].init.signal.aborted), true)
  assert.deepEqual(errors, [])
  console.log('PASS stale list ignored, pending request aborted on unmount; no JS errors')
} finally {
  await browser.close()
  await server.close()
}
