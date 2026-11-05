import { mockAdminSession } from './admin-auth.mjs'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({
  root: fileURLToPath(new URL('../../frontend', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
})
await server.listen()
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
})
try {
  for (const admin of [true, false]) {
    const testPath = `/__order_refresh_check_${admin ? 'admin' : 'customer'}`
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      const timers = new Map()
      let timerId = 0
      const originalInterval = window.setInterval
      const originalClear = window.clearInterval
      window.setInterval = (callback, delay, ...args) => {
        if (delay !== 4000 && delay !== 5000) return originalInterval(callback, delay, ...args)
        const id = --timerId
        timers.set(id, callback)
        return id
      }
      window.clearInterval = id => timers.delete(id) || originalClear(id)
      window.pollOrders = () => timers.forEach(callback => callback())
      window.orderRequests = []
      window.pendingOrders = []
      const originalFetch = window.fetch
      window.fetch = (url, init) => {
        if (!String(url).includes('/api/')) return originalFetch(url, init)
        if (/\/orders\?/.test(url)) {
          window.orderRequests.push(url)
          return new Promise(resolve => window.pendingOrders.push(resolve))
        }
        return Promise.resolve(new Response(JSON.stringify({ content: [] })))
      }
      window.replyOrders = (body, status = 200) => {
        window.pendingOrders.shift()(new Response(JSON.stringify(body), { status }))
      }
    })
    await page.route(`**${testPath}`, async route => route.fulfill({
      contentType: 'text/html',
      body: await server.transformIndexHtml(testPath, `<div id="root"></div><script type="module">
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import Component from '${admin ? '/src/admin/AdminOrderManagement.jsx' : '/src/user/components/MyOrdersPage.jsx'}';
        window.root = createRoot(document.getElementById('root'));
        window.root.render(React.createElement(Component, {
          currentUser: { customerId: 4 }, onClose() {}
        }));
      </script>`),
    }))
    await page.goto(new URL(testPath, server.resolvedUrls.local[0]).href)
    await page.waitForFunction(() => window.orderRequests.length === 1)
    const order = { id: 42, orderCode: 'REFRESH-42', customerName: 'Refresh test', status: 'PENDING', items: [], totalAmount: 100, total: 100 }
    const body = status => admin
      ? { content: [{ ...order, status }], totalPages: 1, totalElements: 1, page: 0 }
      : [{ ...order, status }]
    await page.evaluate(body => window.replyOrders(body), body('PENDING'))
    const selector = admin ? '.admin-table tbody tr' : '.shopee-order-card'
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('42'), selector)
    await page.evaluate(selector => { window.originalOrder = document.querySelector(selector) }, selector)
    // Typing must not restart the client effect when catalogProducts is omitted.
    if (!admin) await page.locator('.shopee-search-bar input').fill('REFRESH')
    assert.equal(await page.evaluate(() => window.orderRequests.length), 1)
    await page.evaluate(() => window.pollOrders())
    await page.waitForFunction(() => window.orderRequests.length === 2)
    assert.equal(await page.evaluate(() => window.originalOrder.isConnected), true, 'poll must keep existing DOM mounted')
    await page.evaluate(() => window.pollOrders())
    assert.equal(await page.evaluate(() => window.orderRequests.length), 2, 'slow requests must not overlap')
    await page.evaluate(body => window.replyOrders(body), body('COMPLETED'))
    await page.waitForFunction(selector => /HOÀN THÀNH|Giao thành công/.test(document.querySelector(selector)?.textContent), selector)
    assert.equal(await page.evaluate(() => window.originalOrder.isConnected), true)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      window.pollOrders()
    })
    assert.equal(await page.evaluate(() => window.orderRequests.length), 2, 'hidden tabs must not poll')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      window.pollOrders()
    })
    await page.waitForFunction(() => window.orderRequests.length === 3)
    await page.evaluate(() => window.replyOrders({}, 500))
    await page.waitForFunction(admin => admin
      ? document.body.textContent.includes('HTTP 500')
      : !!document.querySelector('[role="status"]'), admin)
    await page.evaluate(() => { window.root.unmount(); window.pollOrders() })
    assert.equal(await page.evaluate(() => window.orderRequests.length), 3, 'unmount must clear polling')
    assert.deepEqual(errors, [])
    console.log(`PASS ${admin ? 'admin orders' : 'customer history'}: background refresh, live status, slow API, hidden tab, errors, cleanup`)
    await page.close()
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    localStorage.setItem('furniture_customer_user', JSON.stringify({ id: 4, customerId: 4, role: 'CUSTOMER', username: 'refresh-test' }))
    localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080', username: 'admin-test' }))
    const timers = new Map()
    let nextId = 0
    const set = window.setInterval
    const clear = window.clearInterval
    window.setInterval = (callback, delay, ...args) => {
      if (delay !== 4000 && delay !== 5000) return set(callback, delay, ...args)
      const id = --nextId
      timers.set(id, callback)
      return id
    }
    window.clearInterval = id => timers.delete(id) || clear(id)
    window.pollOrders = () => timers.forEach(callback => callback())
  })
  let status = 'PENDING'
  const errors = []
  const imageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23ebe7df"/></svg>'
  await context.route('https://**', route => route.fulfill(route.request().resourceType() === 'image'
    ? { contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"/>' }
    : { contentType: 'text/css', body: '' }))
  const item = { product_id: 9, product_name: 'Test chair', image_url: imageUrl, quantity: 1, unit_price: 100000, amount: 100000 }
  const order = () => ({ id: 42, customer_id: 4, customerName: 'Test customer', orderCode: 'FUNI-2026-000042', status, approved_at: status === 'PENDING' ? null : '2026-11-04T10:00:00+07:00', address: '123 Lê Lợi, Đà Nẵng', total_amount: 135000, totalAmount: 135000, items: [item] })
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let body = []
    if (path.endsWith('/confirm')) { status = 'CONFIRMED'; body = { message: 'Confirmed' } }
    else if (path.endsWith('/complete')) { status = 'COMPLETED'; body = { message: 'Completed' } }
    else if (path.endsWith('/ship')) { status = 'SHIPPING'; body = { message: 'Shipping' } }
    else if (path.endsWith('/cancel')) { status = 'CANCELLED'; body = { message: 'Cancelled' } }
    else if (path === '/api/products') body = [{ id: 9, name: 'Test chair', price: 100000, category: 'Chair', imageUrl }]
    else if (path === '/api/admin/staff') body = { content: [{ id: 1, fullName: 'Test staff' }] }
    else if (path.endsWith('/counts')) body = { total: 1, pending: status === 'PENDING' ? 1 : 0, confirmed: status === 'CONFIRMED' ? 1 : 0, shipping: status === 'SHIPPING' ? 1 : 0, completed: status === 'COMPLETED' ? 1 : 0, cancelled: status === 'CANCELLED' ? 1 : 0 }
    else if (path === '/api/admin/orders') body = { content: !new URL(route.request().url()).searchParams.has('status') || new URL(route.request().url()).searchParams.get('status') === status ? [order()] : [], page: 0, totalPages: 1, totalElements: 1 }
    else if (path === '/api/orders') body = [order()]
    else if (path === '/api/orders/42') body = { order: order(), items: [item] }
    await route.fulfill({ json: body })
  })
  await mockAdminSession(context)
  const client = await context.newPage()
  const admin = await context.newPage()
  for (const page of [client, admin]) {
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text()) })
  }
  const url = path => new URL(path, server.resolvedUrls.local[0]).href
  const clientStatus = expected => client.waitForFunction(expected => document.querySelector('.shopee-order-status-badge')?.textContent.includes(expected), expected)
  await client.goto(url('/orders'))
  await clientStatus('CHỜ XÁC NHẬN')
  assert.equal(await client.locator('.product-card, .hero, .shopee-orders-overlay').count(), 0)
  assert.equal(await client.locator('main[role="dialog"]').count(), 0)
  await client.reload()
  await clientStatus('CHỜ XÁC NHẬN')
  await admin.goto(url('/admin/orders'))
  await admin.getByTitle('Duyệt đơn & Gán nhân viên phụ trách').click()
  await admin.getByRole('button', { name: 'Xác Nhận & Điều Phối' }).click()
  await admin.getByTitle('Bắt đầu vận chuyển').waitFor()
  await client.evaluate(() => window.pollOrders())
  await clientStatus('ĐÃ DUYỆT')
  await client.getByRole('button', { name: /^Chờ xác nhận/ }).click()
  assert.equal(await client.locator('.shopee-order-card').count(), 0)
  await client.getByRole('button', { name: /^Đã duyệt/ }).click()
  await client.locator('.shopee-order-card').waitFor()
  assert.equal(await client.getByRole('button', { name: 'Hủy Đơn Hàng', exact: true }).count(), 0)
  await client.getByRole('button', { name: 'Xem Chi Tiết' }).click()
  await client.locator('.order-live-status-pill').filter({ hasText: 'ĐÃ DUYỆT' }).waitFor()
  await client.locator('.order-close-btn').click()
  assert.equal(new URL(client.url()).pathname, '/orders')
  admin.once('dialog', dialog => dialog.accept())
  await admin.getByTitle('Bắt đầu vận chuyển').click()
  await admin.getByTitle('Xác nhận hoàn tất giao lắp nội thất').waitFor()
  await client.getByRole('button', { name: /^Tất cả/ }).click()
  await client.evaluate(() => window.pollOrders())
  await clientStatus('ĐANG VẬN CHUYỂN')
  await client.getByRole('button', { name: /^Vận chuyển/ }).click()
  await client.locator('.order-shipping-info').filter({ hasText: '6/11/2026 – 7/11/2026' }).waitFor()
  await client.screenshot({ path: fileURLToPath(new URL('../artifacts/orders-page-desktop.png', import.meta.url)), fullPage: true })
  await client.setViewportSize({ width: 390, height: 844 })
  await client.screenshot({ path: fileURLToPath(new URL('../artifacts/orders-page-mobile.png', import.meta.url)), fullPage: true })
  assert.equal(await client.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile must not overflow horizontally')
  assert.equal(await client.locator('.order-shipping-note').evaluate(element => getComputedStyle(element).color), 'rgb(180, 35, 24)')
  await client.reload()
  await clientStatus('ĐANG VẬN CHUYỂN')
  await client.locator('.order-shipping-info').filter({ hasText: '6/11/2026 – 7/11/2026' }).waitFor()
  admin.once('dialog', dialog => dialog.accept())
  await admin.getByTitle('Xác nhận hoàn tất giao lắp nội thất').click()
  await admin.locator('.admin-table tbody').filter({ hasText: 'Giao thành công' }).waitFor()
  await client.getByRole('button', { name: /^Tất cả/ }).click()
  await client.evaluate(() => window.pollOrders())
  await clientStatus('HOÀN THÀNH')
  await client.getByRole('button', { name: 'Về cửa hàng', exact: true }).click()
  await client.locator('.hero').waitFor()
  await client.goBack()
  await clientStatus('HOÀN THÀNH')
  await client.goForward()
  await client.locator('.hero').waitFor()
  status = 'PENDING'
  await client.goto(url('/orders'))
  await clientStatus('CHỜ XÁC NHẬN')
  await client.getByRole('button', { name: 'Hủy Đơn Hàng', exact: true }).click()
  await client.locator('.cancel-order-confirm').click()
  await clientStatus('ĐÃ HỦY')
  await admin.evaluate(() => window.pollOrders())
  await admin.locator('.admin-table tbody').filter({ hasText: 'Đã hủy' }).waitFor()
  await client.getByRole('button', { name: 'Mua Lại', exact: true }).click()
  await client.locator('.cart-item').waitFor()
  assert.equal(new URL(client.url()).pathname, '/')
  await client.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await client.locator('.user-logged-box').click()
  assert.equal(await client.getByRole('menuitem', { name: 'Lịch sử đơn hàng' }).getAttribute('href'), '/orders')
  await client.getByRole('menuitem', { name: 'Lịch sử đơn hàng' }).click()
  await clientStatus('ĐÃ HỦY')
  assert.equal(new URL(client.url()).pathname, '/orders')
  assert.deepEqual(errors, [])
  await context.close()
  const guest = await browser.newPage()
  let guestOrderRequests = 0
  guest.on('request', request => { if (request.url().includes('/api/orders')) guestOrderRequests++ })
  await guest.route('**/api/**', route => route.fulfill({ json: [] }))
  await guest.goto(url('/orders'))
  await guest.getByText('Đăng nhập để xem và theo dõi đơn hàng của bạn.').waitFor()
  assert.equal(guestOrderRequests, 0)
  await guest.close()
  console.log('PASS /orders: direct URL, reload, admin confirm/complete, tabs, detail, cancellation, reorder, Back/Forward, mobile, guest')
} finally {
  await browser.close()
  await server.close()
}
