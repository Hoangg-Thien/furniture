import assert from 'node:assert/strict'
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
    if (path === '/api/auth/login') {
      const body = route.request().postDataJSON()
      requests.push(body)
      if (mode === 'failure') {
        await new Promise(resolve => { releaseLogin = resolve })
        return route.fulfill({ status: 401, json: { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' } })
      }
      return route.fulfill({ json: { id: 1, username: body.username, role: mode } })
    }
    return route.fulfill({ json: path === '/api/products' || path === '/api/admin/categories' ? [] : { content: [], total: 0, totalPages: 1 } })
  })
  const origin = server.resolvedUrls.local[0]
  await page.goto(new URL('/admin', origin).href)
  await page.getByRole('heading', { name: 'Chào mừng trở lại.' }).waitFor()
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
  await page.locator('.admin-quick-fill-section summary').click()
  await page.getByRole('button', { name: /Nhân viên/ }).click()
  assert.equal(await page.locator('#admin-username').inputValue(), 'staff01')
  assert.equal(await page.locator('#admin-password').inputValue(), '123456')
  mode = 'CUSTOMER'
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('furniture_admin_user')), null)
  for (const role of ['ADMIN', 'STAFF']) {
    mode = role
    await page.locator('#admin-username').fill(role === 'ADMIN' ? 'admin01' : 'staff01')
    await page.locator('#admin-password').fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.locator('.admin-navbar').waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('furniture_admin_user')).role), role)
    await page.evaluate(() => localStorage.removeItem('furniture_admin_user'))
    await page.goto(new URL('/admin', origin).href)
    await page.getByRole('heading', { name: 'Chào mừng trở lại.' }).waitFor()
  }
  await page.getByRole('button', { name: 'Về cửa hàng', exact: true }).click()
  await page.locator('.site-header').waitFor()
  assert.equal(new URL(page.url()).pathname, '/')
  assert.deepEqual(errors, [])
  console.log('PASS admin login: desktop/mobile, validation, password toggle, loading/error, demo, role checks, ADMIN/STAFF login, back navigation')
} finally {
  await browser.close()
  await server.close()
}
