import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mockAdminSession } from './admin-auth.mjs'

const server = await createServer({ root: fileURLToPath(new URL('../../frontend', import.meta.url)), server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const screenshots = new URL('../runtime/checkout-voucher/', import.meta.url)
fs.mkdirSync(screenshots, { recursive: true })
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const product = { id: 7, name: 'Ghế bar chân sắt Loft', category: 'Ghế ăn và ghế bar', price: 1200000, quantity: 3, imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }
  const sale = { id: 74, code: 'SALE74', program_id: 13, program_name: 'sale_november', discount_percent: 50, minimum_amount: 0, maximum_discount: 1000000 }
  const weaker = { ...sale, id: 75, code: 'OTHER', discount_percent: 10, maximum_discount: 2000000 }
  const startDate = new Date(Date.now() - 86400000).toISOString()
  const endDate = new Date(Date.now() + 86400000 * 365).toISOString()
  const program = { id: 13, name: 'sale_november', description: 'Ưu đãi tháng 11', status: 'ACTIVE', startDate, endDate, vouchersCount: 2, productDiscountsCount: 0, orderDiscountsCount: 0 }
  const vouchers = [sale, weaker].map(v => ({ id: v.id, promotionProgramId: 13, programName: program.name, code: v.code, discountPercent: v.discount_percent, minimumAmount: v.minimum_amount, maximumDiscount: v.maximum_discount, quantity: 100, usedQuantity: 0, remainingQuantity: 100, status: 'ACTIVE', startDate, endDate, isExpired: false }))
  let failVouchers = false
  await page.addInitScript(() => {
    localStorage.setItem('furniture_custom_api_url', 'http://localhost:8080')
    localStorage.setItem('furniture_cart', JSON.stringify({ items: { 7: 1 }, expiresAt: Date.now() + 300000 }))
    localStorage.setItem('furniture_admin_user', JSON.stringify({ userId: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' }))
  })
  await page.route('https://**', route => route.abort())
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const send = (json, status = 200) => route.fulfill({ json, status })
    if (route.request().method() === 'OPTIONS') return send({})
    if (path === '/api/products') return send([product])
    if (path === '/api/vouchers/active') return send([weaker, sale])
    if (path === '/api/vouchers/validate') return send({ voucherId: 74, code: 'SALE74', discountAmount: 600000, discountPercent: 50, finalTotal: 600000 })
    if (path === '/api/orders/preview') {
      const selected = route.request().postDataJSON().voucherId === 74
      return send({ items: [{ productId: 7, quantity: 1, unitPrice: 1200000 }], subtotal: 1200000, discountAmount: selected ? 600000 : 0,
        shippingFee: 35000, totalAmount: selected ? 635000 : 1235000, voucherId: selected ? 74 : null, voucherCode: selected ? 'SALE74' : null, discountLabel: selected ? 'Voucher SALE74' : null })
    }
    if (path === '/api/admin/promotions') return send([program, { ...program, id: 2, name: 'Chiến dịch khác', vouchersCount: 0 }])
    if (path === '/api/admin/promotions/vouchers') return send(failVouchers ? { error: 'Unavailable' } : vouchers, failVouchers ? 503 : 200)
    if (path === '/api/admin/promotions/13/detail') return send({ program, productDiscounts: [], orderDiscounts: [], vouchers })
    if (path === '/api/admin/promotions/13/vouchers' && route.request().method() === 'POST') {
      const voucher = { ...vouchers[0], ...route.request().postDataJSON(), id: 99 }
      vouchers.push(voucher)
      program.vouchersCount = vouchers.length
      return send(voucher, 201)
    }
    if (path === '/api/admin/products') return send({ content: [], totalElements: 0, totalPages: 1 })
    return send({ content: [], totalElements: 0, totalPages: 1 })
  })
  await mockAdminSession(page)
  const origin = server.resolvedUrls.local[0]
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(new URL('/checkout', origin).href, { waitUntil: 'domcontentloaded' })
    const summary = page.locator('.order-summary-panel')
    await summary.getByText('SALE74', { exact: true }).waitFor()
    assert((await summary.locator('.suggest-info').innerText()).includes('600.000'))
    assert(!(await summary.locator('.suggest-info').innerText()).includes('1.000.000'))
    assert((await summary.locator('.suggest-info').innerText()).includes('sale_november'))
    for (const selector of ['.order-page-body', '.order-summary-panel', '.order-summary-voucher-section', '.voucher-suggest-box']) {
      assert(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${selector} must fit at ${width}px`)
    }
    const badge = await summary.locator('.order-item-qty').boundingBox()
    const image = await summary.locator('.order-item-img-wrap').boundingBox()
    assert(badge.y >= image.y && badge.x + badge.width <= image.x + image.width, 'Quantity badge must not be clipped')
    assert.equal(image.width, image.height)
    const input = await summary.getByRole('textbox', { name: 'Mã giảm giá' }).boundingBox()
    const apply = await summary.getByRole('button', { name: 'Áp dụng', exact: true }).boundingBox()
    assert(input.x + input.width <= apply.x || input.y + input.height <= apply.y, 'Input and button must not overlap')
    await summary.screenshot({ path: fileURLToPath(new URL(`summary-${width}.png`, screenshots)), animations: 'disabled' })
    await summary.getByRole('button', { name: 'Dùng ngay', exact: true }).click()
    await summary.locator('.order-discount-row').getByText('Ưu đãi tốt nhất: Voucher SALE74', { exact: true }).waitFor()
    assert((await summary.locator('.order-grand-total').innerText()).includes('635.000'))
    await summary.getByRole('button', { name: 'Hủy', exact: true }).click()
    await summary.getByRole('button', { name: 'Dùng ngay', exact: true }).waitFor()
    console.log(`PASS checkout ${width}px: layout, visible badge, real savings, campaign name, apply/remove voucher`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(new URL('/admin/promotions', origin).href, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'sale_november', exact: true }).waitFor()
  const search = page.getByRole('searchbox', { name: 'Tìm kiếm chiến dịch' })
  await search.fill('sale74')
  assert.equal(await page.locator('.promotion-name-button').count(), 1)
  await page.getByRole('button', { name: 'sale_november', exact: true }).click()
  await page.getByRole('button', { name: /4\. Kho Voucher/ }).click()
  await page.getByRole('dialog').getByText('SALE74', { exact: true }).waitFor()
  await page.getByLabel('Mã Voucher', { exact: true }).fill('NEW74')
  await page.getByRole('button', { name: /Phát Hành Voucher/ }).click()
  await page.getByRole('dialog').getByText('NEW74', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await search.fill('new74')
  await page.getByRole('button', { name: 'sale_november', exact: true }).waitFor()
  assert.equal(await page.locator('.promotion-name-button').count(), 1, 'New vouchers must be searchable after saving')
  await search.fill('does-not-exist')
  await page.getByRole('heading', { name: 'Không tìm thấy chiến dịch', exact: true }).waitFor()
  await search.fill('sale74')
  failVouchers = true
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await page.getByText('Lỗi tải danh sách khuyến mãi/voucher (HTTP 503)', { exact: true }).waitFor()
  failVouchers = false
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await page.getByRole('button', { name: 'sale_november', exact: true }).waitFor()
  console.log('PASS admin: find/open voucher, create voucher and search its code, no-result state, API error and retry')
  assert.deepEqual(errors, [])
} finally { await browser.close(); await server.close() }
