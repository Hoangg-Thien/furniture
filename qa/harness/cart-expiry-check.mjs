import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  let stock = 3
  let orderPosts = 0
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-11-10T12:00:00+07:00') })
  await page.context().route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.context().route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/orders' && route.request().method() === 'POST') orderPosts++
    return route.fulfill({ json: path === '/api/products'
      ? [{ id: 1, name: 'Ghế kiểm tra thời hạn', price: 100000, category: 'Ghế', quantity: stock, imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }]
      : [] })
  })
  const url = server.resolvedUrls.local[0]
  const deadline = () => page.evaluate(() => Number(localStorage.getItem('furniture_cart_expires_at')))
  const cart = () => page.evaluate(() => JSON.parse(localStorage.getItem('furniture_cart')))
  const add = page.getByRole('button', { name: 'Thêm Ghế kiểm tra thời hạn vào giỏ hàng', exact: true })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await add.click()
  const first = await deadline()
  assert.ok(Math.abs(first - await page.evaluate(() => Date.now()) - 30 * 60 * 1000) < 1000)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).waitFor()
  assert.equal(await deadline(), first, 'Reload must preserve the original deadline')
  await page.clock.fastForward(5 * 60 * 1000)
  await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
  await page.getByRole('button', { name: 'Tăng số lượng Ghế kiểm tra thời hạn', exact: true }).click()
  const renewed = await deadline()
  assert.ok(renewed >= first + 5 * 60 * 1000)
  assert.ok(Math.abs(renewed - await page.evaluate(() => Date.now()) - 30 * 60 * 1000) < 1000)
  stock = 1
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('furniture_cart'))?.['1'] === 1)
  assert.equal(await deadline(), renewed, 'Stock correction must not count as user activity')
  await page.setViewportSize({ width: 390, height: 844 })
  const notice = page.locator('.cart-drawer .cart-expiry-notice')
  await notice.waitFor()
  const bounds = await notice.boundingBox()
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390)
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/cart-expiry-mobile.png', import.meta.url)), animations: 'disabled' })
  const remaining = renewed - await page.evaluate(() => Date.now())
  await page.clock.fastForward(remaining - 1000)
  assert.deepEqual(await cart(), { 1: 1 })
  await page.clock.fastForward(1000)
  await page.getByRole('heading', { name: 'Giỏ hàng đang trống', exact: true }).waitFor()
  assert.deepEqual(await cart(), {})
  await page.getByText('Giỏ hàng đã được xóa sau 30 phút không cập nhật. Bạn có thể chọn lại sản phẩm.', { exact: true }).waitFor()
  console.log('PASS expiry: exact deadline, renewal, reload, stock correction, open-tab expiry and mobile notice')

  await page.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await add.click()
  await page.evaluate(() => sessionStorage.setItem('furniture_checkout_guest', JSON.stringify({
    form: { fullName: 'Khách kiểm tra', phone: '0912345678', address: '123 Nguyễn Huệ', city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' }, step: 2,
  })))
  await page.goto(new URL('/checkout', url).href, { waitUntil: 'domcontentloaded' })
  const submit = page.getByRole('button', { name: 'Đặt hàng ngay', exact: true })
  await submit.waitFor()
  const checkoutDeadline = await deadline()
  await page.clock.setSystemTime(new Date(checkoutDeadline + 1))
  await submit.click()
  await page.getByText('Giỏ hàng đã hết hạn sau 30 phút không cập nhật. Vui lòng chọn lại sản phẩm.').waitFor()
  assert.equal(orderPosts, 0, 'Expired checkout must be rejected even if the timer has not run')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText('Giỏ hàng đang trống hoặc đã hết hạn. Vui lòng quay lại và chọn lại sản phẩm.', { exact: true }).waitFor()
  assert.equal(await submit.isDisabled(), true)
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_checkout_guest')).form.fullName), 'Khách kiểm tra')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForURL(url, { waitUntil: 'domcontentloaded' })
  assert.deepEqual(await cart(), {})
  assert.equal(await deadline(), 0)
  console.log('PASS checkout expiry: stale submission blocked, suspended tab checked on focus, draft preserved, expired reload stays empty')
  await page.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await add.click()
  const second = await page.context().newPage()
  second.setDefaultTimeout(10000)
  second.on('pageerror', error => errors.push(error.message))
  await second.addInitScript(now => { Date.now = () => now }, await page.evaluate(() => Date.now()))
  await second.goto(url, { waitUntil: 'domcontentloaded' })
  await second.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).click()
  await second.getByRole('button', { name: 'Giảm số lượng Ghế kiểm tra thời hạn', exact: true }).click()
  await page.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  await second.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await second.getByRole('button', { name: 'Thêm Ghế kiểm tra thời hạn vào giỏ hàng', exact: true }).click()
  await page.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).waitFor()
  assert.equal(await deadline(), await second.evaluate(() => Number(localStorage.getItem('furniture_cart_expires_at'))))
  await second.close()
  console.log('PASS multiple tabs: removals and renewed cart synchronize without reviving stale items')
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
  await server.close()
}
