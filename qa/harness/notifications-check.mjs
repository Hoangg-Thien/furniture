import { mockAdminSession } from './admin-auth.mjs'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    if (!localStorage.getItem('qa_notifications_initialized')) {
      localStorage.setItem('furniture_customer_user', JSON.stringify({ customerId: 4, role: 'CUSTOMER', username: 'notification-test' }))
      localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080', username: 'admin-test' }))
      localStorage.setItem('qa_notifications_initialized', 'yes')
    }
    const timers = new Map()
    let id = 0
    const set = window.setInterval
    const clear = window.clearInterval
    window.setInterval = (callback, delay, ...args) => {
      if (delay !== 30000) return set(callback, delay, ...args)
      timers.set(--id, callback)
      return id
    }
    window.clearInterval = timer => timers.delete(timer) || clear(timer)
    window.tickNotifications = () => timers.forEach(callback => callback())
  })
  const orders = [
    { id: 42, customer_id: 4, status: 'PENDING' },
    { id: 43, customer_id: 4, status: 'COMPLETED' },
    { id: 44, customer_id: 5, status: 'CONFIRMED' },
  ]
  let quantity = 2
  let offline = false
  let notificationRequests = 0
  let activityRequests = 0
  let paginateStock = false
  let checkStockLabels = false
  const activities = []
  const imageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"/>'
  await context.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let body = { content: [] }
    if (path === '/api/orders' || path.startsWith('/api/admin/')) notificationRequests++
    if (path === '/api/admin/notifications/activities') activityRequests++
    if (offline && (path === '/api/orders' || path.startsWith('/api/admin/'))) return route.fulfill({ status: 500, json: { error: 'offline' } })
    if (path === '/api/products') body = [{ id: 9, name: 'Test chair', category: 'Chair', price: 100000, imageUrl, quantity: 10 }]
    else if (path === '/api/orders') body = orders.filter(order => String(order.customer_id) === url.searchParams.get('customerId'))
    else if (/^\/api\/orders\/\d+$/.test(path)) body = { order: { ...orders.find(order => order.id === Number(path.split('/').at(-1))), address: 'Đà Nẵng', approved_at: '2026-11-04T10:00:00+07:00' }, items: [] }
    else if (path === '/api/admin/orders') body = { content: orders.filter(order => !url.searchParams.has('status') || order.status === url.searchParams.get('status')).map(order => ({ ...order, customerName: 'Test customer' })), totalPages: 1, page: 0 }
    else if (/^\/api\/admin\/orders\/\d+$/.test(path)) body = { ...orders.find(order => order.id === Number(path.split('/').at(-1))), customerName: 'Test customer', items: [], subtotal: 100000, finalTotal: 100000 }
    else if (path === '/api/admin/notifications/activities') body = activities
    else if (path === '/api/admin/products') {
      const extraPage = paginateStock && url.searchParams.get('page') === '1'
      const extraProducts = Array.from({ length: 6 }, (_, index) => ({ id: index + 10, name: `Low chair ${index}`, quantity: 1, isActive: true }))
      body = { content: extraPage ? [...extraProducts, { id: 20, name: 'Unknown stock', quantity: null, isActive: false }, { id: 21, name: 'Enough stock', quantity: 5, isActive: true }]
        : [{ id: 9, name: 'Test chair', quantity, unitPrice: 100000, categoryName: 'Chair', isActive: true }], totalPages: paginateStock ? 2 : 1, page: extraPage ? 1 : 0 }
      if (checkStockLabels && !url.searchParams.has('lowStock')) body = {
        content: [0, 1, 4, 5].map(quantity => ({ id: 30 + quantity, name: `Stock boundary ${quantity}`, quantity, unit: 'chiếc', isActive: true })), totalPages: 1, page: 0,
      }
    }
    else if (path === '/api/admin/products/9') body = { id: 9, name: 'Test chair', quantity, sellingPrice: 100000, categoryId: 1, isActive: true, description: 'Test product' }
    else if (path === '/api/admin/categories') body = [{ id: 1, name: 'Chair' }]
    await route.fulfill({ json: body })
  })
  await mockAdminSession(context)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const url = path => new URL(path, server.resolvedUrls.local[0]).href
  const clientBell = count => page.getByRole('button', { name: `Thông báo đơn hàng, ${count} chưa đọc`, exact: true })
  await page.goto(url('/'))
  await clientBell(2).waitFor()
  assert.equal(await page.locator('.header-actions .favorite-shortcut').count(), 0)
  await page.getByRole('button', { name: /Lọc sản phẩm yêu thích/ }).waitFor()
  await clientBell(2).click()
  assert.equal(await page.locator('.client-notification-item').count(), 2)
  await page.locator('.client-notification-item[href$="=42"]').click()
  await page.waitForURL('**/order-success?id=42')
  await page.locator('.order-live-status-pill').waitFor()
  await page.locator('.order-close-btn').click()
  await clientBell(1).waitFor()
  await page.reload()
  await clientBell(1).click()
  await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click()
  await clientBell(0).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#client-notifications-panel').count(), 0)
  assert.equal(await clientBell(0).evaluate(element => element === document.activeElement), true)
  await page.reload()
  await clientBell(0).waitFor()
  orders[0].status = 'SHIPPING'
  await page.evaluate(() => window.tickNotifications())
  await clientBell(1).click()
  await page.locator('.client-notification-item.unread').filter({ hasText: 'đang vận chuyển' }).waitFor()
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/notifications-client-desktop.png', import.meta.url)) })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/notifications-client-mobile.png', import.meta.url)) })
  const bounds = await page.locator('#client-notifications-panel').boundingBox()
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390, 'mobile panel stays inside the viewport')
  await page.keyboard.press('Escape')
  await page.evaluate(() => localStorage.setItem('furniture_customer_user', JSON.stringify({ customerId: 5, role: 'CUSTOMER', username: 'other-customer' })))
  await page.goto(url('/'))
  await clientBell(1).click()
  assert.equal(await page.locator('.client-notification-item').count(), 1)
  assert.equal(await page.locator('.client-notification-item[href$="=44"]').count(), 1)
  await page.keyboard.press('Escape')
  await page.evaluate(() => localStorage.removeItem('furniture_customer_user'))
  notificationRequests = 0
  await page.goto(url('/'))
  await clientBell(0).click()
  await page.getByText('Đăng nhập để nhận thông báo đơn hàng.').waitFor()
  assert.equal(notificationRequests, 0, 'guests must not request orders')
  await page.locator('#client-notifications-panel').getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.locator('.auth-modal-overlay').waitFor()
  console.log('PASS client notifications: status updates, detail link, persistent reads, accounts, guest, keyboard, mobile')

  orders.push({ id: 45, customer_id: 4, status: 'PENDING' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(url('/admin/orders'))
  const adminBell = count => page.getByRole('button', { name: `Thông báo hệ thống, ${count} chưa đọc`, exact: true })
  await adminBell(2).click()
  await page.getByRole('button', { name: 'Đã đọc', exact: true }).click()
  await page.reload()
  await adminBell(0).waitFor()
  for (let repeat = 0; repeat < 2; repeat++) {
    await adminBell(0).click()
    await page.locator('.admin-notif-item').filter({ hasText: 'Đơn hàng #45' }).click()
    await page.getByRole('heading', { name: 'Đơn Đặt Hàng #45', exact: true }).waitFor()
    await page.locator('.admin-modal-backdrop .modal-close-btn').click()
  }
  orders.push({ id: 46, customer_id: 4, status: 'PENDING' })
  await page.evaluate(() => window.tickNotifications())
  await adminBell(1).waitFor()
  quantity = 1
  await page.evaluate(() => window.tickNotifications())
  await adminBell(2).click()
  await page.locator('.admin-notif-item').filter({ hasText: 'Sản phẩm sắp hết hàng' }).click()
  await page.waitForURL('**/admin/products')
  await page.getByText('Cập nhật thông tin cho sản phẩm #9', { exact: true }).waitFor()
  assert.equal(await page.locator('.admin-modal-backdrop input[type="number"]').last().inputValue(), '1')
  await page.locator('.admin-modal-backdrop .modal-close-btn').click()
  quantity = 0
  await page.evaluate(() => window.tickNotifications())
  await adminBell(2).click()
  await page.locator('.admin-notif-item').filter({ hasText: 'Sản phẩm đã hết hàng' }).waitFor()
  await page.keyboard.press('Escape')
  offline = true
  await adminBell(2).click()
  await page.getByText('Chưa tải được thông báo. Vui lòng thử lại.').waitFor()
  offline = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('.admin-notif-list [role="status"]'))
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/notifications-admin.png', import.meta.url)), animations: 'disabled' })
  await page.keyboard.press('Escape')
  orders.find(order => order.id === 45).status = 'CANCELLED'
  await page.evaluate(() => window.tickNotifications())
  await adminBell(3).click()
  await page.locator('.admin-notif-item').filter({ hasText: 'Đơn hàng #45 đã được hủy' }).click()
  await page.getByRole('heading', { name: 'Đơn Đặt Hàng #45', exact: true }).waitFor()
  await page.locator('.admin-modal-backdrop').getByText('Đã hủy đơn', { exact: true }).waitFor()
  await page.locator('.admin-modal-backdrop .modal-close-btn').click()
  await page.reload()
  await adminBell(2).waitFor()
  activities.push({ id: 1, actorUsername: 'content-staff', title: 'Cập nhật sản phẩm #9', module: 'products', recordId: 9, createdAt: '2026-11-10T10:00:00Z' })
  await page.evaluate(() => window.tickNotifications())
  await adminBell(3).click()
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/notifications-admin.png', import.meta.url)), animations: 'disabled' })
  await page.locator('.admin-notif-item').filter({ hasText: 'Nhân viên content-staff' }).click()
  await page.waitForURL('**/admin/products')
  await page.getByText('Cập nhật thông tin cho sản phẩm #9', { exact: true }).waitFor()
  await page.locator('.admin-modal-backdrop .modal-close-btn').click()
  await page.reload()
  await adminBell(2).waitFor()
  await adminBell(2).click()
  assert.equal(await page.locator('.admin-notif-item.unread').filter({ hasText: 'Nhân viên content-staff' }).count(), 0)
  await page.keyboard.press('Escape')
  notificationRequests = 0
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    window.tickNotifications()
  })
  assert.equal(notificationRequests, 0, 'hidden tabs must not poll')
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: false }))
  paginateStock = true
  for (const [index, staffType] of ['SALES', 'WAREHOUSE', 'CONTENT'].entries()) {
    await page.evaluate(user => localStorage.setItem('furniture_admin_user', JSON.stringify(user)), {
      id: 20 + index, role: 'STAFF', staffType, staffId: 20 + index, accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080', username: `${staffType}-staff`,
    })
    activityRequests = 0
    await page.goto(url('/admin/products'))
    await adminBell(staffType === 'CONTENT' ? 7 : 9).click()
    assert.equal(await page.locator('.admin-notif-item').filter({ hasText: /Sản phẩm (đã hết hàng|sắp hết hàng)/ }).count(), 7, `${staffType} sees every low-stock page`)
    assert.equal(await page.locator('.admin-notif-item').filter({ hasText: 'content-staff' }).count(), 0)
    assert.equal(activityRequests, 0, 'staff must not request the admin-only activity feed')
    if (staffType === 'CONTENT') {
      await page.getByRole('button', { name: 'Xem danh sách sản phẩm', exact: true }).waitFor()
      await page.setViewportSize({ width: 390, height: 844 })
      const bounds = await page.locator('#admin-notifications-panel').boundingBox()
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390, 'staff notification panel fits mobile')
      await page.screenshot({ path: fileURLToPath(new URL('../artifacts/notifications-staff-mobile.png', import.meta.url)), animations: 'disabled' })
    }
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  assert.deepEqual(errors, [])
  checkStockLabels = true
  await page.reload({ waitUntil: 'domcontentloaded' })
  for (const [quantity, expected] of [[0, '0 (Đã hết)'], [1, '1 (Sắp hết)'], [4, '4 (Sắp hết)'], [5, '5 chiếc']]) {
    const row = page.locator('.admin-table tbody tr').filter({ hasText: `Stock boundary ${quantity}` })
    await row.waitFor()
    assert.equal((await row.locator('.stock-pill').innerText()).trim(), expected)
    if (quantity === 0) assert.equal(await row.locator('.stock-pill').getAttribute('title'), 'Sản phẩm đã hết hàng')
  }
  assert.deepEqual(errors, [])
  console.log('PASS admin product stock labels: zero is Đã hết, 1–4 are Sắp hết, 5 is normal')
  console.log('PASS admin/staff notifications: activity feed, permissions, all stock pages and staff roles, exact details, persistent reads, retry, keyboard, mobile, hidden tab')
} finally {
  await browser.close()
  await server.close()
}
