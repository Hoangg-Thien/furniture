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
  vouchers.push({ ...vouchers[0], id: 76, code: 'PRODUCT74', voucherType: 'PRODUCT', productId: 7 })
  program.vouchersCount = vouchers.length
  const productDiscounts = []
  const orderDiscounts = []
  let automaticPromotion = false
  let failValidation = false
  let holdValidation = false
  let releaseValidation
  let validationStarted
  const quoteRequests = []
  let failVouchers = false
  let failCheck = false
  let invalidCheck = false
  const checks = []
  await page.addInitScript(() => {
    localStorage.setItem('furniture_custom_api_url', 'http://localhost:8080')
    localStorage.setItem('furniture_cart', JSON.stringify({ items: localStorage.getItem('qa_mixed_basket') ? { 7: 1, 8: 1 } : { 7: 1 }, expiresAt: Date.now() + 300000 }))
    localStorage.setItem('furniture_admin_user', JSON.stringify({ userId: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' }))
  })
  await page.route('https://**', route => route.abort())
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const send = (json, status = 200) => route.fulfill({ json, status })
    if (route.request().method() === 'OPTIONS') return send({})
    if (path === '/api/products') return send([product, { ...product, id: 8, name: 'Sofa nguyên giá', price: 3000000 }])
    if (path === '/api/vouchers/active') return send([weaker, sale])
    if (path === '/api/vouchers/validate') {
      if (failValidation) return send({ error: 'Mã mới không hợp lệ' }, 400)
      const body = route.request().postDataJSON()
      if (holdValidation) {
        holdValidation = false
        await new Promise(resolve => { releaseValidation = resolve; validationStarted() })
      }
      const subtotal = body.items.reduce((sum, item) => sum + (item.productId === 7 ? 1200000 : 3000000) * item.quantity, 0)
      const discount = Math.min(subtotal * 0.5, 1000000)
      return send({ voucherId: 74, code: 'SALE74', discountAmount: discount, discountPercent: 50, finalTotal: subtotal - discount })
    }
    if (path === '/api/orders/preview') {
      const body = route.request().postDataJSON()
      quoteRequests.push(body)
      const selected = body.voucherId === 74
      const items = body.items.map(item => ({ ...item, unitPrice: item.productId === 7 ? 1200000 : 3000000 }))
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const offer = { productId: 7, originalAmount: 1200000, discountAmount: 600000, finalAmount: 600000, label: 'Giảm sản phẩm' }
      const automaticDiscountAmount = automaticPromotion && !selected ? 600000 : 0
      const voucherDiscountAmount = selected ? Math.min(subtotal * 0.5, 1000000) : 0
      const shippingFee = subtotal >= 2000000 ? 0 : 35000
      return send({ items, subtotal, automaticDiscountAmount, voucherDiscountAmount,
        automaticDiscountLabel: automaticDiscountAmount ? 'Giảm sản phẩm' : null,
        itemDiscounts: automaticDiscountAmount ? [offer] : [], productOffers: automaticPromotion ? [offer] : [],
        discountAmount: automaticDiscountAmount + voucherDiscountAmount,
        shippingFee, totalAmount: subtotal + shippingFee - automaticDiscountAmount - voucherDiscountAmount,
        voucherId: selected ? 74 : null, voucherCode: selected ? 'SALE74' : null,
        discountLabel: selected ? 'Voucher SALE74' : automaticPromotion ? 'Giảm sản phẩm' : null })
    }
    if (path === '/api/admin/promotions') return send([program, { ...program, id: 2, name: 'Chiến dịch khác', vouchersCount: 0 }])
    if (path === '/api/admin/promotions/vouchers') return send(failVouchers ? { error: 'Unavailable' } : vouchers, failVouchers ? 503 : 200)
    if (path === '/api/admin/promotions/13/detail') return send({ program, productDiscounts, orderDiscounts, vouchers })
    if (/^\/api\/admin\/promotions\/vouchers\/\d+\/check$/.test(path)) {
      checks.push(route.request().postDataJSON())
      if (invalidCheck) return send({})
      if (failCheck) return send({ error: 'Giỏ hàng không có sản phẩm áp dụng voucher này' }, 400)
      return send({ code: 'SALE74', subtotal: 1200000, discountAmount: 600000, finalTotal: 600000 })
    }
    if (path === '/api/admin/promotions/13/product-discounts' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      assert.deepEqual(body, { productId: 7, discountPercent: 10 })
      productDiscounts.push({ id: 1, ...body, productName: product.name, originalPrice: product.price, discountedPrice: 1080000 })
      return send(productDiscounts[0], 201)
    }
    if (path === '/api/admin/promotions/13/order-discounts' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      assert.deepEqual(body, { minimumAmount: 10000000, discountPercent: 5 })
      orderDiscounts.push({ id: 1, ...body })
      return send(orderDiscounts[0], 201)
    }
    if (path === '/api/admin/promotions/13/vouchers' && route.request().method() === 'POST') {
      const voucher = { ...vouchers[0], ...route.request().postDataJSON(), id: 99 + vouchers.length }
      vouchers.push(voucher)
      program.vouchersCount = vouchers.length
      return send(voucher, 201)
    }
    if (path === '/api/admin/products') return send({ content: [new URL(route.request().url()).searchParams.get('page') === '1' ? { id: 8, name: 'Sofa trang sau', sellingPrice: 3000000 } : { ...product, sellingPrice: product.price }], totalElements: 2, totalPages: 2 })
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
    await summary.locator('.order-discount-row').getByText('Voucher SALE74', { exact: true }).waitFor()
    assert((await summary.locator('.order-grand-total').innerText()).includes('635.000'))
    await summary.getByRole('button', { name: 'Hủy', exact: true }).click()
    await summary.getByRole('button', { name: 'Dùng ngay', exact: true }).waitFor()
    console.log(`PASS checkout ${width}px: layout, visible badge, real savings, campaign name, apply/remove voucher`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  automaticPromotion = true
  await page.evaluate(() => localStorage.setItem('qa_mixed_basket', '1'))
  await page.goto(new URL('/checkout', origin).href, { waitUntil: 'domcontentloaded' })
  const switchSummary = page.locator('.order-summary-panel')
  await switchSummary.locator('.order-grand-total').filter({ hasText: '3.600.000' }).waitFor()
  const discounted = switchSummary.locator('.order-summary-item').filter({ hasText: product.name })
  const normal = switchSummary.locator('.order-summary-item').filter({ hasText: 'Sofa nguyên giá' })
  assert.match(await discounted.locator('del').innerText(), /1.200.000/)
  assert.match(await discounted.locator('.item-offer-badge').innerText(), /600.000/)
  assert.equal(await normal.locator('del, .item-offer-badge').count(), 0, 'full-price product remains undiscounted')
  await switchSummary.getByRole('textbox', { name: 'Mã giảm giá' }).fill('SALE74')
  await switchSummary.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await switchSummary.getByRole('status').filter({ hasText: 'Đã chuyển sang áp dụng mã giảm giá toàn đơn hàng' }).waitFor()
  assert.equal(await switchSummary.locator('.order-automatic-discount, .item-offer-badge').count(), 0)
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /3.200.000/)
  failValidation = true
  await switchSummary.getByRole('textbox', { name: 'Mã giảm giá' }).fill('INVALID')
  await switchSummary.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await switchSummary.getByText('Mã mới không hợp lệ', { exact: true }).waitFor()
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /3.200.000/, 'invalid replacement keeps the existing voucher')
  failValidation = false
  const oldValidationStarted = new Promise(resolve => { validationStarted = resolve })
  holdValidation = true
  await switchSummary.getByRole('textbox', { name: 'Mã giảm giá' }).fill('SALE74')
  await switchSummary.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await oldValidationStarted
  await switchSummary.getByRole('button', { name: /Dùng ưu đãi sản phẩm/ }).click()
  await switchSummary.getByRole('status').filter({ hasText: 'Đã chuyển sang áp dụng ưu đãi sản phẩm' }).waitFor()
  assert.equal(quoteRequests.at(-1).preferProductDiscounts, true)
  assert.equal(quoteRequests.at(-1).voucherId, null)
  assert.equal(await switchSummary.locator('.order-voucher-discount').count(), 0)
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /3.600.000/)
  releaseValidation()
  await page.waitForTimeout(100)
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /3.600.000/, 'late voucher validation cannot undo a newer product selection')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await switchSummary.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `item savings fit ${width}px`)
  }
  await switchSummary.screenshot({ path: fileURLToPath(new URL('replacement-checkout.png', screenshots)), animations: 'disabled' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  automaticPromotion = false
  await page.goto(new URL('/admin/promotions', origin).href, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'sale_november', exact: true }).waitFor()
  const search = page.getByRole('searchbox', { name: 'Tìm kiếm chiến dịch' })
  await search.fill('sale74')
  assert.equal(await page.locator('.promotion-name-button').count(), 1)
  await page.getByRole('button', { name: 'sale_november', exact: true }).click()
  await page.getByRole('button', { name: /1\. Giảm theo đơn hàng/ }).click()
  await page.getByRole('button', { name: 'Thêm Bậc', exact: true }).click()
  await page.getByRole('cell').filter({ hasText: '10.000.000' }).first().waitFor()
  assert.equal(orderDiscounts.length, 1)
  await page.getByRole('button', { name: /2\. Giảm theo sản phẩm/ }).click()
  await page.getByLabel('Chọn Sản Phẩm Nội Thất', { exact: true }).selectOption('7')
  await page.getByRole('button', { name: 'Thêm Giảm Giá', exact: true }).click()
  await page.getByRole('row').filter({ hasText: product.name }).waitFor()
  assert.equal(productDiscounts.length, 1)
  await page.getByRole('button', { name: /3\. Voucher VIP/ }).click()
  await page.getByRole('dialog').getByText('SALE74', { exact: true }).waitFor()
  await page.getByRole('columnheader', { name: 'Loại voucher', exact: true }).waitFor()
  await page.getByRole('row').filter({ has: page.getByText('SALE74', { exact: true }) }).getByRole('cell', { name: 'Theo giá trị đơn hàng', exact: true }).waitFor()
  await page.getByLabel('Mã Voucher', { exact: true }).fill('NEW74')
  await page.getByRole('button', { name: /Phát Hành Voucher/ }).click()
  await page.getByRole('dialog').getByText('NEW74', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Loại voucher', { exact: true }).count(), 0, 'new voucher codes are VIP only')
  const saved = vouchers.find(v => v.code === 'NEW74')
  assert.equal(saved.voucherType, 'VIP')
  assert.equal(saved.productId, null)
  await page.getByRole('row').filter({ has: page.getByText('NEW74', { exact: true }) }).getByRole('cell', { name: 'Dành riêng khách VIP', exact: true }).waitFor()
  await page.getByRole('row').filter({ has: page.getByText('PRODUCT74', { exact: true }) }).getByRole('cell', { name: 'Theo sản phẩm', exact: true }).waitFor()
  const checker = page.getByRole('form', { name: 'Kiểm tra voucher', exact: true })
  await checker.getByLabel('Voucher cần kiểm tra', { exact: true }).selectOption('74')
  await checker.getByLabel('Sản phẩm 1', { exact: true }).selectOption('7')
  assert.equal(await checker.getByLabel('Sản phẩm 1', { exact: true }).getByRole('option', { name: /Sofa trang sau/ }).count(), 1, 'product picker loads beyond the first page')
  await checker.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await checker.getByRole('status').waitFor()
  assert.match(await checker.getByRole('status').innerText(), /600.000/)
  assert.deepEqual(checks.at(-1), { customerId: null, items: [{ productId: 7, quantity: 1 }] })
  await checker.getByLabel('Số lượng 1', { exact: true }).fill('2')
  assert.equal(await checker.getByRole('status').count(), 0, 'changing the basket clears outdated savings')
  failCheck = true
  await checker.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await checker.getByRole('alert').waitFor()
  failCheck = false
  invalidCheck = true
  await checker.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await checker.getByRole('alert').filter({ hasText: 'Kết quả kiểm tra voucher không hợp lệ' }).waitFor()
  invalidCheck = false
  await checker.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await checker.getByRole('status').waitFor()
  await page.getByRole('dialog').screenshot({ path: fileURLToPath(new URL('promotions-voucher-admin.png', screenshots)), animations: 'disabled' })
  await page.keyboard.press('Escape')
  await search.fill('new74')
  await page.locator('.promotion-row-description').filter({ hasText: 'PRODUCT74 (Theo sản phẩm)' }).waitFor()
  await page.locator('.promotion-row-description').filter({ hasText: 'NEW74 (Dành riêng khách VIP)' }).waitFor()
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
  await page.keyboard.press('Escape')
  await page.addInitScript(() => {
    localStorage.setItem('furniture_admin_user', JSON.stringify({ userId: 2, staffId: 2, role: 'STAFF', staffType: 'SALES', accessToken: 'sales-token', apiBaseUrl: 'http://localhost:8080' }))
  })
  await page.goto(new URL('/admin/promotions', origin).href)
  assert.equal(await page.getByRole('button', { name: 'Tạo chiến dịch', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: 'sale_november', exact: true }).click()
  await page.getByRole('button', { name: /3\. Voucher VIP/ }).click()
  assert.equal(await page.getByLabel('Loại voucher', { exact: true }).count(), 0, 'sales cannot create vouchers')
  const salesCheck = page.getByRole('form', { name: 'Kiểm tra voucher', exact: true })
  await salesCheck.getByLabel('Voucher cần kiểm tra', { exact: true }).selectOption('74')
  await salesCheck.getByLabel('Sản phẩm 1', { exact: true }).selectOption('7')
  await salesCheck.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await salesCheck.getByRole('status').waitFor()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await salesCheck.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `voucher checker fits ${width}px`)
  }
  await page.getByRole('dialog').screenshot({ path: fileURLToPath(new URL('promotions-voucher-sales-mobile.png', screenshots)), animations: 'disabled' })
  console.log('PASS client: per-item prices, mixed basket, automatic replacement both directions, invalid/late code protection; promotions: three groups, automatic order/product discounts, new VIP codes, legacy codes preserved, product selection across pages, exact-money check/errors/retry, sales read/check only, mobile, search')
  assert.deepEqual(errors, [])
} finally { await browser.close(); await server.close() }
