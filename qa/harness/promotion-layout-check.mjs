import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mockAdminSession } from './admin-auth.mjs'

// Isolated API fixtures: this check never writes to the application database.
const origin = process.env.QA_ADMIN_ORIGIN || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
page.setDefaultTimeout(10000)
await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
const errors = []
page.on('pageerror', error => errors.push(error.message))
const program = { id: 1, name: 'Tri ân mùa đông', description: 'Ưu đãi nội thất', startDate: '2026-12-08T00:00:00', endDate: '2026-12-10T23:59:00', status: 'ACTIVE', vouchersCount: 2, productDiscountsCount: 0, orderDiscountsCount: 0 }
const vouchers = ['ORDER', 'VIP'].map((voucherType, index) => ({ id: index + 1, promotionProgramId: 1, code: index ? 'VIPWINTER' : 'TRI92', voucherType, discountPercent: 50, minimumAmount: 0, quantity: 100, usedQuantity: 1, ordersCount: 1, status: index ? 'INACTIVE' : 'ACTIVE', archived: false }))
await page.addInitScript(() => localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, username: 'admin01', role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' })))
await page.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname
  let data = []
  if (path === '/api/admin/promotions') data = [program]
  if (path === '/api/admin/promotions/vouchers') data = vouchers
  if (path === '/api/admin/promotions/1/detail') data = { program, vouchers, productDiscounts: [], orderDiscounts: [] }
  if (path === '/api/admin/products') data = { content: [{ id: 1, name: 'Sofa gỗ sồi', sellingPrice: 10000000 }], totalPages: 1 }
  return route.fulfill({ json: data })
})
await mockAdminSession(page)
await fs.mkdir('qa/artifacts/promotion-layout', { recursive: true })
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto(origin + '/admin/promotions', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Tri ân mùa đông', exact: true }).click()
    await page.getByRole('button', { name: /3\. Voucher VIP/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('.promotion-voucher-table').waitFor()
    assert.equal(await page.locator('.admin-modal-overlay').evaluate(el => getComputedStyle(el).backdropFilter), 'none')
    assert(await dialog.locator('.promotion-voucher-check').isHidden())
    for (const selector of ['.promotion-voucher-discount', '.promotion-voucher-status span']) {
      assert.equal(await dialog.locator(selector).first().evaluate(el => getComputedStyle(el).whiteSpace), 'nowrap')
    }
    assert(await dialog.evaluate(el => el.getBoundingClientRect().right <= innerWidth))
    const scroll = dialog.locator('.promotion-voucher-table-scroll')
    assert(await scroll.evaluate(el => el.clientWidth <= el.closest('.admin-modal-body').clientWidth))
    await scroll.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `qa/artifacts/promotion-layout/${name}.png` })
    await page.getByLabel('Lọc trạng thái voucher').selectOption('INACTIVE')
    assert.equal(await dialog.locator('.promotion-voucher-table tbody tr').count(), 1)
    await dialog.locator('.promotion-check-panel summary').click()
    assert(await dialog.locator('.promotion-voucher-check').isVisible())
    await page.getByLabel('Voucher cần kiểm tra').selectOption('1')
    await page.getByLabel('Sản phẩm 1', { exact: true }).selectOption('1')
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    console.log(`PASS ${name}: no blur, readable badges, contained table, filter, calculator, Escape`)
  }
  assert.deepEqual(errors, [])
} catch (error) {
  console.log(await page.locator("body").innerText(), errors)
  await page.screenshot({ path: "qa/artifacts/promotion-layout/error.png" })
  throw error
} finally {
  await browser.close()
}

