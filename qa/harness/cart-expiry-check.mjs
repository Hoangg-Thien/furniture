import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { CART_TIMEOUT_MS } from '../../frontend/src/user/lib/cart.js'

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
    if (path === '/api/auth/login' && route.request().method() === 'POST') {
      const { username } = route.request().postDataJSON()
      const customerId = username === 'cart-owner' ? 21 : 22
      const customerTier = customerId === 21 ? null : 'VIP_DIAMOND'
      return route.fulfill({ json: { customerId, userId: customerId, username, role: 'CUSTOMER', customerTier, accessToken: username } })
    }
    if (path === '/api/auth/me' && new URL(route.request().url()).searchParams.get('userId') === '21') {
      assert.equal(route.request().headers().authorization, 'Bearer cart-owner')
      return route.fulfill({ json: { userId: 21, customerTier: 'NEW' } })
    }
    if (path === '/api/orders/preview') {
      const items = route.request().postDataJSON().items.map(item => ({ ...item, unitPrice: 100000 }))
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      return route.fulfill({ json: { items, subtotal, discountAmount: 0, shippingFee: 35000, totalAmount: subtotal + 35000 } })
    }
    if (path === '/api/orders' && route.request().method() === 'POST') orderPosts++
    return route.fulfill({ json: path === '/api/products'
      ? [{ id: 1, name: 'Ghế kiểm tra thời hạn', price: 100000, category: 'Ghế', quantity: stock, imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }]
      : [] })
  })
  const url = server.resolvedUrls.local[0]
  const deadline = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_cart')).expiresAt)
  const cart = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_cart')).items)
  const add = page.getByRole('button', { name: 'Thêm Ghế kiểm tra thời hạn vào giỏ hàng', exact: true })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem('furniture_cart', '{"1":1}')
    localStorage.setItem('furniture_cart_expires_at', String(Date.now() + 30 * 60 * 1000))
    localStorage.setItem('furniture_customer_user', JSON.stringify({ customerId: 22, role: 'CUSTOMER', username: 'old-user' }))
    localStorage.setItem('funi_last_order', JSON.stringify({ guestToken: 'old-token' }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [])
  await page.locator('.user-auth-button').click()
  await page.locator('.auth-form input[type="text"]').fill('old-user')
  await page.locator('.auth-form input[type="password"]').fill('old-password')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  const registration = page.locator('.auth-form input[autocomplete="off"]')
  assert.equal(await registration.inputValue(), '')
  assert.equal(await page.locator('.auth-form input[type="password"]').inputValue(), '')
  await registration.fill('unfinished-registration')
  await page.getByRole('button', { name: 'Đóng cửa sổ', exact: true }).click()
  await page.locator('.user-auth-button').click()
  assert.equal(await page.locator('.auth-form input[type="text"]').inputValue(), '')
  await page.getByRole('button', { name: 'Đóng cửa sổ', exact: true }).click()
  await add.click()
  const first = await deadline()
  assert.ok(Math.abs(first - await page.evaluate(() => Date.now()) - CART_TIMEOUT_MS) < 1000)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).waitFor()
  assert.equal(await deadline(), first, 'Reload must preserve the original deadline')
  const idleTime = Math.floor(CART_TIMEOUT_MS / 3)
  await page.clock.fastForward(idleTime)
  await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
  await page.getByRole('button', { name: 'Tăng số lượng Ghế kiểm tra thời hạn', exact: true }).click()
  const renewed = await deadline()
  assert.ok(renewed >= first + idleTime)
  assert.ok(Math.abs(renewed - await page.evaluate(() => Date.now()) - CART_TIMEOUT_MS) < 1000)
  stock = 1
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('furniture_cart'))?.items?.['1'] === 1)
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
  await page.getByText(`Giỏ hàng đã được xóa sau ${CART_TIMEOUT_MS / 60000} phút không cập nhật. Bạn có thể chọn lại sản phẩm.`, { exact: true }).waitFor()
  console.log('PASS expiry: exact deadline, renewal, reload, stock correction, open-tab expiry and mobile notice')

  await page.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await add.click()
  await page.evaluate(() => sessionStorage.setItem('furniture_checkout_guest', JSON.stringify({
    form: { fullName: 'Khách kiểm tra', phone: '0912345678', address: '123 Nguyễn Huệ', city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' }, step: 2,
  })))
  await page.goto(new URL('/checkout', url).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#ord-fullName').waitFor()
  assert.equal(await page.locator('#ord-fullName').inputValue(), '')
  assert.equal(await page.evaluate(() => sessionStorage.getItem('furniture_checkout_guest')), null)
  await page.locator('#ord-fullName').fill('Khách kiểm tra')
  await page.locator('#ord-phone').fill('0912345678')
  await page.locator('#ord-address').fill('123 Nguyễn Huệ')
  await page.locator('#ord-city').selectOption('TP. Hồ Chí Minh')
  await page.locator('#ord-district').selectOption({ index: 1 })
  await page.getByRole('button', { name: /Tiếp theo/ }).click()
  const submit = page.getByRole('button', { name: 'Đặt hàng ngay', exact: true })
  await submit.waitFor()
  const checkoutDeadline = await deadline()
  await page.clock.setSystemTime(new Date(checkoutDeadline + 1))
  await submit.click()
  await page.getByText(`Giỏ hàng đã hết hạn sau ${CART_TIMEOUT_MS / 60000} phút không cập nhật. Vui lòng chọn lại sản phẩm.`).waitFor()
  assert.equal(orderPosts, 0, 'Expired checkout must be rejected even if the timer has not run')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText('Giỏ hàng đang trống hoặc đã hết hạn. Vui lòng quay lại và chọn lại sản phẩm.', { exact: true }).waitFor()
  assert.equal(await submit.isDisabled(), true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForURL(url, { waitUntil: 'domcontentloaded' })
  assert.deepEqual(await cart(), {})
  assert.equal(await deadline(), 0)
  console.log('PASS checkout expiry: stale submission blocked, old shipping draft removed, expired reload stays empty')
  await page.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await add.click()
  const second = await page.context().newPage()
  second.setDefaultTimeout(10000)
  second.on('pageerror', error => errors.push(error.message))
  await second.addInitScript(now => { Date.now = () => now }, await page.evaluate(() => Date.now()))
  await second.goto(url, { waitUntil: 'domcontentloaded' })
  await second.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  async function login(tab, username) {
    await tab.locator('.user-auth-button').click()
    await tab.locator('.auth-form input[type="text"]').fill(username)
    await tab.locator('.auth-form input[type="password"]').fill('test-password')
    await tab.locator('.auth-submit-btn').click()
    await tab.waitForFunction(name => document.querySelector('button.user-logged-box .user-display-name')?.textContent === name, username)
    const welcome = tab.getByRole('dialog', { name: 'Miễn phí giao hàng' })
    if (username === 'cart-owner') {
      await welcome.getByText('3.000.000₫', { exact: true }).waitFor()
      await welcome.getByText('Dưới mức này, phí giao hàng là 35.000₫.', { exact: true }).waitFor()
      if (tab === page) {
        const before = await tab.evaluate(() => window.scrollY)
        assert.equal(await tab.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden')
        await tab.mouse.move(5, 100)
        await tab.mouse.wheel(0, 350)
        await tab.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        assert.equal(await tab.evaluate(() => window.scrollY), before, 'The page must not scroll behind the popup')
      }
      await welcome.getByRole('button', { name: 'Tiếp tục mua sắm' }).click()
    } else {
      assert.equal(await welcome.count(), 0, 'Diamond customers must not see the new customer popup')
    }
    await welcome.waitFor({ state: 'hidden' })
    if (tab === page) {
      assert.notEqual(await tab.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden')
      await tab.mouse.move(5, 100)
      await tab.mouse.wheel(0, 350)
      await tab.waitForFunction(() => window.scrollY > 0)
      await tab.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    }
  }
  await login(page, 'cart-owner')
  await page.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  await add.click()
  await login(second, 'different-user')
  await second.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  await second.locator('button.user-logged-box').click()
  await second.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click()
  await login(second, 'cart-owner')
  await second.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).click()
  await second.getByRole('button', { name: 'Giảm số lượng Ghế kiểm tra thời hạn', exact: true }).click()
  await page.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  await second.getByRole('button', { name: 'Đóng giỏ hàng', exact: true }).click()
  await second.getByRole('button', { name: 'Thêm Ghế kiểm tra thời hạn vào giỏ hàng', exact: true }).click()
  await page.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).waitFor()
  assert.deepEqual(await second.evaluate(() => JSON.parse(localStorage.getItem('furniture_cart:21')).items), { 1: 1 })
  const now = await second.evaluate(() => Date.now())
  await page.close()
  await second.close()
  const reopened = await context.newPage()
  await reopened.addInitScript(now => { Date.now = () => now }, now)
  await reopened.goto(url, { waitUntil: 'domcontentloaded' })
  await reopened.locator('.user-auth-button').waitFor()
  await reopened.getByRole('button', { name: 'Mở giỏ hàng, 0 sản phẩm', exact: true }).waitFor()
  await login(reopened, 'cart-owner')
  await reopened.getByRole('button', { name: 'Mở giỏ hàng, 1 sản phẩm', exact: true }).waitFor()
  console.log('PASS privacy: empty forms, legacy cleanup, guest and account isolation, same-account cart sync and reopen')
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
  await server.close()
}
