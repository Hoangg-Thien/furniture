import assert from 'node:assert/strict'
import { mockAdminSession } from './admin-auth.mjs'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  const requests = []
  let mode = 'failure'
  let releaseLogin
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/admin/login') {
      const body = route.request().postDataJSON()
      requests.push(body)
      if (mode === 'failure') {
        await new Promise(resolve => { releaseLogin = resolve })
        return route.fulfill({ status: 401, json: { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' } })
      }
      return route.fulfill({ json: { user: { userId: 1, username: body.username, fullName: mode === 'STAFF' ? 'Nguyễn Văn An' : null, role: mode }, accessToken: 'qa-mock-token', staffType: mode === 'STAFF' ? 'SALES' : '' } })
    }
    if (path === '/api/products') return route.fulfill({ json: [{ id: 1, name: 'Sofa kiểm tra', price: 1000000, quantity: 5, imageUrl: '/vite.svg' }] })
    return route.fulfill({ json: path === '/api/admin/categories' ? [] : { content: [], total: 0, totalPages: 1 } })
  })
  await mockAdminSession(page)
  const origin = server.resolvedUrls.local[0]
  await page.goto(new URL('/admin', origin).href)
  await page.getByRole('heading', { name: 'Chào mừng trở lại.' }).waitFor()
  assert.equal(await page.locator('.admin-quick-fill-section, .quick-fill-btn').count(), 0)
  assert.equal(await page.getByText('Tài khoản thực hành').count(), 0)
  assert.equal(await page.locator('#admin-username').inputValue(), '')
  assert.equal(await page.locator('#admin-password').inputValue(), '')
  assert.equal(await page.locator('.admin-login-card').textContent().then(text => /admin01|staff01|123456/.test(text)), false)
  assert.equal(await page.locator('#admin-username').evaluate(element => element === document.activeElement), true)
  assert.equal(await page.locator('.admin-login-wrapper').evaluate(element => getComputedStyle(element).filter), 'none')
  assert.equal(await page.locator('.admin-login-card').evaluate(element => getComputedStyle(element).backdropFilter), 'none')
  await page.screenshot({ path: fileURLToPath(new URL('../artifacts/admin-login-desktop.png', import.meta.url)), fullPage: true })
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no overflow at ${width}px`)
    if (width === 390) await page.screenshot({ path: fileURLToPath(new URL('../artifacts/admin-login-mobile.png', import.meta.url)), fullPage: true })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Vui lòng nhập đầy đủ' }).waitFor()
  assert.equal(requests.length, 0)
  await page.getByLabel('Tên đăng nhập hoặc email', { exact: true }).fill(' admin01 ')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click()
  assert.equal(await page.locator('#admin-password').getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click()
  assert.equal(await page.locator('#admin-password').getAttribute('type'), 'password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('button', { name: 'Đang đăng nhập...' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Đang đăng nhập...' }).isDisabled(), true)
  assert.deepEqual(requests[0], { username: 'admin01', password: 'wrong-password' })
  releaseLogin()
  await page.getByRole('alert').filter({ hasText: 'không chính xác' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Đăng nhập', exact: true }).isEnabled(), true)
  mode = 'CUSTOMER'
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.evaluate(() => sessionStorage.getItem('furniture_admin_user')), null)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.clock.install()
  for (const role of ['ADMIN', 'STAFF']) {
    mode = role
    await page.locator('#admin-username').fill(role === 'ADMIN' ? 'admin01' : 'staff01')
    await page.locator('#admin-password').fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.locator('.admin-navbar').waitFor()
    const profile = page.locator('.admin-profile-pill')
    assert.equal(await profile.locator('.admin-profile-name').textContent(), role === 'ADMIN' ? 'admin01' : 'staff01')
    assert.equal(await profile.getAttribute('title'), role === 'STAFF' ? 'Tên đăng nhập: staff01\nHọ tên: Nguyễn Văn An' : 'Tên đăng nhập: admin01')
    if (role === 'STAFF') await profile.getByText('Nguyễn Văn An', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_admin_user')).role), role)
    await page.evaluate(() => sessionStorage.setItem('furniture_customer_user', JSON.stringify({ role: 'CUSTOMER', customerId: 8, username: 'old-customer', fullName: 'Lưu Gia Huy' })))
    await page.reload()
    await page.locator('.admin-navbar').waitFor()
    for (const selector of ['.admin-store-link-btn', '.admin-navbar button[title="Xem Cửa hàng FuniStore"]']) {
      await page.locator(selector).click()
      await page.locator('.site-header').waitFor()
      assert.equal(new URL(page.url()).pathname, '/')
      const notice = page.locator('.admin-store-notice')
      assert.equal(await notice.count(), 1)
      assert.match(await notice.innerText(), role === 'ADMIN' ? /vai trò admin/ : /vai trò nhân viên/)
      assert.equal(await page.getByText('Lưu Gia Huy', { exact: true }).count(), 0)
      assert.equal(await page.locator('.bag-button, .user-auth-button').count(), 0)
      await page.locator('.quick-add').first().waitFor()
      assert(await page.locator('.quick-add').first().isDisabled())
      {
        await page.clock.fastForward(6000)
        assert(await notice.isVisible(), 'admin notice remains after the old timeout')
        await page.reload()
        await page.locator('.site-header').waitFor()
        assert(await notice.isVisible(), 'admin notice survives reload')
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(() => window.scrollTo(0, 500))
          const position = await notice.evaluate(element => {
            const rect = element.getBoundingClientRect()
            return { fixed: getComputedStyle(element).position, right: innerWidth - rect.right, bottom: innerHeight - rect.bottom, left: rect.left }
          })
          assert.equal(position.fixed, 'fixed')
          assert.equal(position.right, 24)
          assert.equal(position.bottom, 24)
          assert(position.left >= 0)
        }
        await page.setViewportSize({ width: 1440, height: 1000 })
      }
      assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_admin_user')).role), role)
      assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_customer_user')).fullName), 'Lưu Gia Huy')
      await page.goto(new URL('/checkout', origin).href)
      await page.locator('.site-header').waitFor()
      assert.equal(await page.locator('#ord-fullName, .cart-layer').count(), 0)
      await page.locator('.site-header a[href="/admin"]').click()
      await page.locator('.admin-navbar').waitFor()
    }
    await page.goto(new URL('/', origin).href)
    await page.getByText('Lưu Gia Huy', { exact: true }).waitFor()
    assert.equal(await page.locator('.admin-store-notice').count(), 0)
    await page.locator('.quick-add').first().waitFor()
    assert(await page.locator('.quick-add').first().isEnabled(), 'customer can shop again after admin session ends')
    await page.evaluate(() => sessionStorage.removeItem('furniture_customer_user'))
    await page.reload()
    await page.locator('.user-auth-button').waitFor()
    assert.equal(await page.locator('.admin-store-notice').count(), 0)
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('furniture_admin_user')).role), role)
    await page.locator('.user-auth-button').click()
    await page.locator('.auth-modal-card').waitFor()
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
    await page.getByPlaceholder('Ví dụ: Nguyễn Văn An').waitFor()
    await page.evaluate(() => sessionStorage.removeItem('furniture_admin_user'))
    await page.goto(new URL('/admin', origin).href)
    await page.getByRole('heading', { name: 'Chào mừng trở lại.' }).waitFor()
  }
  await page.getByRole('button', { name: 'Về cửa hàng', exact: true }).click()
  await page.locator('.site-header').waitFor()
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(await page.getByText('Bạn đang xem cửa hàng với vai trò admin.', { exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS admin login and read-only storefront: ADMIN/STAFF identity, persistent notice, no shopping or checkout, retained customer session restored after admin exit')
} finally {
  await browser.close()
  await server.close()
}
