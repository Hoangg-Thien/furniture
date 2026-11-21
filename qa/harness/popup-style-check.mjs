import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mockAdminSession } from './admin-auth.mjs'

// Mock API only; no application data is changed.
const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
page.setDefaultTimeout(10000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.route('https://**', route => route.abort())
await page.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname
  return route.fulfill({ json: path === '/api/products' || path === '/api/admin/promotions' || path === '/api/admin/promotions/vouchers' ? [] : { content: [], totalPages: 1 } })
})
await mockAdminSession(page)
const origin = server.resolvedUrls.local[0]
await fs.mkdir('qa/artifacts/popup-style', { recursive: true })
async function checkPopup(overlay, card) {
  assert.equal(await page.locator(overlay).evaluate(el => getComputedStyle(el).backdropFilter), 'none')
  assert.equal(await page.locator(overlay).evaluate(el => getComputedStyle(el).animationName), 'none')
  assert(await page.locator(card).evaluate(el => el.getBoundingClientRect().width <= innerWidth))
}
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await page.locator('.user-auth-button').click()
    await checkPopup('.auth-modal-overlay', '.auth-modal-card')
    await page.screenshot({ path: `qa/artifacts/popup-style/auth-${width}.png`, animations: 'disabled' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('.auth-modal-card').evaluate(el => getComputedStyle(el).animationName), 'none')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.locator('.auth-modal-close').click()
    await page.locator('.bag-button').click()
    await checkPopup('.cart-layer', '.cart-drawer')
    await page.screenshot({ path: `qa/artifacts/popup-style/cart-${width}.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.cart-layer').count(), 0)
  }
  await page.evaluate(() => localStorage.setItem('furniture_admin_user', JSON.stringify({ role: 'ADMIN', username: 'admin01', accessToken: 'qa-token', apiBaseUrl: 'http://localhost:8080' })))
  await page.goto(new URL('/admin/promotions', origin).href)
  await page.locator('.promotion-page-header .btn-admin-primary').click()
  await checkPopup('.admin-modal-overlay', '.admin-modal-card')
  await page.screenshot({ path: 'qa/artifacts/popup-style/admin-mobile.png', animations: 'disabled' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.admin-modal-card').evaluate(el => getComputedStyle(el).animationName), 'none')
  assert.deepEqual(errors, [])
  console.log('PASS popup styles: desktop/mobile, no blur or fullscreen animation, reduced motion, cart Escape, admin create dialog')
} finally {
  await browser.close()
  await server.close()
}
