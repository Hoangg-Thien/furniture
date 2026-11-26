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
  const sale = { id: 74, code: 'SALE74', program_id: 13, program_name: 'Ưu đãi tháng 11', discount_percent: 50, minimum_amount: 0, maximum_discount: 1000000 }
  const weaker = { ...sale, id: 75, code: 'OTHER', discount_percent: 10, maximum_discount: 2000000 }
  const startDate = new Date(Date.now() - 86400000).toISOString()
  const endDate = new Date(Date.now() + 86400000 * 365).toISOString()
  const program = { id: 13, name: 'Ưu đãi tháng 11', description: 'Ưu đãi tháng 11', status: 'ACTIVE', startDate, endDate, vouchersCount: 2, productDiscountsCount: 0, orderDiscountsCount: 0 }
  const vouchers = [sale, weaker].map(v => ({ id: v.id, promotionProgramId: 13, programName: program.name, code: v.code, discountPercent: v.discount_percent, minimumAmount: v.minimum_amount, maximumDiscount: v.maximum_discount, quantity: 100, usedQuantity: 0, remainingQuantity: 100, status: 'ACTIVE', startDate, endDate, isExpired: false }))
  vouchers.push({ ...vouchers[0], id: 76, code: 'PRODUCT74', voucherType: 'PRODUCT', productId: 7 })
  program.vouchersCount = vouchers.length
  const productDiscounts = []
  const orderDiscounts = []
  vouchers[0].ordersCount = 1
  let automaticPromotion = false
  let automaticType = 'PRODUCT'
  let failValidation = false
  let rejectBest = false
  let holdValidation = false
  let releaseValidation
  let validationStarted
  const quoteRequests = []
  let failVouchers = false
  let failCheck = false
  let invalidCheck = false
  const checks = []
  await page.addInitScript(() => {
    sessionStorage.setItem('furniture_custom_api_url', 'http://localhost:8080')
    sessionStorage.setItem('furniture_cart', JSON.stringify({ items: localStorage.getItem('qa_mixed_basket') ? { 7: 1, 8: 1 } : { 7: 1 }, expiresAt: Date.now() + 300000 }))
    sessionStorage.setItem('furniture_admin_user', JSON.stringify({ userId: 1, role: 'ADMIN', accessToken: 'qa-mock-token', apiBaseUrl: 'http://localhost:8080' }))
  })
  await page.route('https://**', route => route.abort())
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const send = (json, status = 200) => route.fulfill({ json, status })
    if (route.request().method() === 'OPTIONS') return send({})
    if (path === '/api/products') return send([{ ...product, discountPercent: 50, discountedPrice: 600000, soldQuantity: 15, bestSeller: true }, { ...product, id: 8, name: 'Sofa nguyên giá', price: 3000000, soldQuantity: 0, bestSeller: false }])
    if (path === '/api/vouchers/active') return send([weaker, sale, { ...weaker, id: 77, code: 'MINIMUM', minimum_amount: 5000000 }, { ...weaker, id: 78, code: 'VIPONLY', voucher_type: 'VIP' }])
    if (path === '/api/vouchers/validate') {
      if (failValidation) return send({ error: 'Mã mới không hợp lệ' }, 400)
      const body = route.request().postDataJSON()
      if (body.code === 'VIPONLY') return send({ error: 'Voucher chỉ dành cho khách VIP Diamond' }, 400)
      if (holdValidation) {
        holdValidation = false
        await new Promise(resolve => { releaseValidation = resolve; validationStarted() })
      }
      const subtotal = body.items.reduce((sum, item) => sum + (item.productId === 7 ? 1200000 : 3000000) * item.quantity, 0)
      const chosen = body.code === 'OTHER' ? weaker : sale
      const discount = Math.min(subtotal * chosen.discount_percent / 100, chosen.maximum_discount)
      return send({ voucherId: chosen.id, code: chosen.code, discountAmount: discount, discountPercent: chosen.discount_percent, finalTotal: subtotal - discount })
    }
    if (path === '/api/orders/preview') {
      const body = route.request().postDataJSON()
      if (rejectBest && body.voucherId === 74) return send({ error: 'Voucher đã hết lượt sử dụng' }, 400)
      if (body.voucherId === 78) return send({ error: 'Voucher chỉ dành cho khách VIP Diamond' }, 400)
      if (body.voucherId === 77) return send({ error: 'Đơn hàng chưa đạt giá trị tối thiểu 5.000.000₫' }, 400)
      quoteRequests.push(body)
      const selected = body.voucherId === 74 || body.voucherId === 75
      const chosen = body.voucherId === 75 ? weaker : sale
      const items = body.items.map(item => ({ ...item, unitPrice: item.productId === 7 ? 1200000 : 3000000 }))
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const offer = { productId: 7, originalAmount: 1200000, discountAmount: 600000, finalAmount: 600000, label: 'Giảm sản phẩm' }
      const automaticDiscountAmount = automaticPromotion && automaticType === 'PRODUCT' && body.preferProductDiscounts ? 600000 : 0
      const netSubtotal = subtotal - automaticDiscountAmount
      const voucherDiscountAmount = selected ? Math.min(netSubtotal * chosen.discount_percent / 100, chosen.maximum_discount) : 0
      const shippingFee = subtotal >= 2000000 ? 0 : 35000
      return send({ items, subtotal, automaticDiscountAmount, voucherDiscountAmount,
        automaticDiscountLabel: automaticDiscountAmount ? (automaticType === 'ORDER' ? program.name : 'Giảm sản phẩm') : null,
        itemDiscounts: automaticDiscountAmount && automaticType === 'PRODUCT' ? [offer] : [], productOffers: automaticPromotion ? [offer] : [],
        discountAmount: automaticDiscountAmount + voucherDiscountAmount,
        shippingFee, totalAmount: subtotal + shippingFee - automaticDiscountAmount - voucherDiscountAmount,
        voucherId: selected ? chosen.id : null, voucherCode: selected ? chosen.code : null,
        discountLabel: selected ? `Voucher ${chosen.code}` : automaticPromotion ? 'Giảm sản phẩm' : null })
    }
    if (path === '/api/admin/promotions') return send([program, { ...program, id: 2, name: 'Chiến dịch khác', description: 'Giảm giá dịp tân gia', vouchersCount: 0 }])
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
      assert.deepEqual(body, { productId: 7, discountPercent: 50 })
      productDiscounts.push({ id: 1, ...body, productName: product.name, sellingPrice: product.price, discountedPrice: 600000 })
      return send(productDiscounts[0], 201)
    }
    if (path === '/api/admin/promotions/13/order-discounts' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      assert.deepEqual(body, { minimumAmount: 10000000, discountPercent: 5 })
      orderDiscounts.push({ id: 1, ...body })
      return send(orderDiscounts[0], 201)
    }
    if (path === '/api/admin/promotions/13/vouchers' && route.request().method() === 'POST') {
      const voucher = { ...vouchers[0], ...route.request().postDataJSON(), id: Math.max(...vouchers.map(v => v.id)) + 1, ordersCount: 0, archived: false }
      vouchers.push(voucher)
      program.vouchersCount = vouchers.length
      return send(voucher, 201)
    }
    const voucherAction = path.match(/^\/api\/admin\/promotions\/vouchers\/(\d+)(?:\/(replace|orders|status))?$/)
    if (voucherAction) {
      const old = vouchers.find(v => v.id === Number(voucherAction[1]))
      if (voucherAction[2] === 'orders') return send(old.ordersCount ? [{ id: 42, order_date: '2026-11-18T10:00:00', status: 'CANCELLED', total_amount: 635000, discount_amount: 600000 }] : [])
      if (route.request().method() === 'DELETE') {
        const archived = old.usedQuantity > 0 || old.ordersCount > 0
        if (archived) { old.archived = true; old.status = 'INACTIVE' }
        else vouchers.splice(vouchers.indexOf(old), 1)
        return send({ archived, message: archived ? 'Đã lưu trữ voucher' : 'Đã xóa vĩnh viễn voucher chưa từng sử dụng' })
      }
      const body = route.request().postDataJSON()
      if (voucherAction[2] === 'replace') {
        const replacement = { ...old, ...body, id: Math.max(...vouchers.map(v => v.id)) + 1, usedQuantity: 0, ordersCount: 0, archived: false }
        vouchers.push(replacement)
        old.status = 'INACTIVE'
        return send(replacement, 201)
      }
      Object.assign(old, body)
      return send(old)
    }
    if (path === '/api/admin/products') return send({ content: [new URL(route.request().url()).searchParams.get('page') === '1' ? { id: 8, name: 'Sofa trang sau', sellingPrice: 3000000 } : { ...product, sellingPrice: product.price }], totalElements: 2, totalPages: 2 })
    return send({ content: [], totalElements: 0, totalPages: 1 })
  })
  await mockAdminSession(page)
  const origin = server.resolvedUrls.local[0]
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    const price = page.locator('.product-card').first().locator('.product-price-row')
    await price.getByLabel('Giá ưu đãi', { exact: true }).waitFor()
    assert.deepEqual(await price.evaluate(el => [...el.children].map(child => child.tagName)), ['DEL', 'SPAN', 'STRONG'])
    assert.match(await price.locator('del').innerText(), /1.200.000/)
    assert.equal(await price.locator('span').innerText(), '-50%')
    assert.match(await price.locator('strong').innerText(), /600.000/)
    assert.equal(await page.locator('.product-card').nth(1).locator('del, .product-discount-badge').count(), 0)
    assert.match(await page.locator('.product-card').first().locator('.product-sales-row').innerText(), /Bán chạy/)
    assert.match(await page.locator('.product-card').first().locator('.product-sold-count').innerText(), /Đã bán 15/)
    assert.equal(await page.locator('.product-card').nth(1).locator('.product-bestseller').count(), 0)
    assert.match(await page.locator('.product-card').nth(1).locator('.product-sold-count').innerText(), /Đã bán 0/)
    assert(await page.locator('.product-card').first().locator('.product-sales-row').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
    await price.scrollIntoViewIfNeeded()
    assert(await price.evaluate(el => el.scrollWidth <= el.clientWidth + 1))
    await page.screenshot({ path: fileURLToPath(new URL(`product-price-${width}.png`, screenshots)), animations: 'disabled' })
  }
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(new URL('/checkout', origin).href, { waitUntil: 'domcontentloaded' })
    const summary = page.locator('.order-summary-panel')
    await summary.locator('.order-voucher-discount').getByText('Voucher SALE74', { exact: true }).waitFor()
    assert.match(await summary.locator('.order-voucher-discount').innerText(), /Đã tự động chọn ưu đãi tốt nhất/)
    assert.match(await summary.locator('.order-grand-total').innerText(), /635.000/)
    await summary.locator('.checkout-voucher-trigger').click()
    const choices = page.getByRole('dialog', { name: 'Chọn voucher', exact: true })
    await choices.waitFor()
    assert.equal(await choices.locator('.checkout-voucher-option').count(), 4)
    assert(await choices.getByRole('button', { name: 'Chọn voucher MINIMUM', exact: true }).isDisabled())
    assert(await choices.getByRole('button', { name: 'Chọn voucher VIPONLY', exact: true }).isDisabled())
    assert.match(await choices.innerText(), /VIP Diamond/)
    assert.match(await choices.locator('.selected').innerText(), /Ưu đãi tốt nhất/)
    assert.equal(await choices.evaluate(el => getComputedStyle(el, '::backdrop').backdropFilter), 'none')
    assert(await choices.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `popup fits ${width}px`)
    await choices.screenshot({ path: fileURLToPath(new URL(`voucher-choices-${width}.png`, screenshots)), animations: 'disabled' })
    await choices.getByRole('button', { name: 'Chọn voucher OTHER', exact: true }).click()
    await choices.waitFor({ state: 'hidden' })
    await summary.locator('.order-voucher-discount').getByText('Voucher OTHER', { exact: true }).waitFor()
    assert.match(await summary.locator('.order-grand-total').innerText(), /1.115.000/)
    await summary.locator('.checkout-voucher-trigger').click()
    await page.keyboard.press('Escape')
    await choices.waitFor({ state: 'hidden' })
    assert.equal(await summary.locator('.checkout-voucher-trigger').evaluate(el => el === document.activeElement), true, 'closing restores focus')
    await summary.getByRole('button', { name: 'Bỏ chọn', exact: true }).click()
    await summary.locator('.order-grand-total').filter({ hasText: '1.235.000' }).waitFor()
    assert.equal(await summary.locator('.order-voucher-discount').count(), 0, 'removal is respected')
    await summary.screenshot({ path: fileURLToPath(new URL(`summary-${width}.png`, screenshots)), animations: 'disabled' })
    console.log(`PASS checkout ${width}px: auto best voucher, popup, replacement, removal, eligibility and keyboard`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  rejectBest = true
  await page.goto(new URL('/checkout', origin).href)
  await page.locator('.order-voucher-discount').getByText('Voucher OTHER', { exact: true }).waitFor()
  assert.match(await page.locator('.order-grand-total').innerText(), /1.115.000/, 'expired/exhausted best code falls back to the next valid voucher')
  rejectBest = false
  automaticPromotion = true
  automaticType = 'ORDER'
  await page.goto(new URL('/checkout', origin).href)
  const orderOfferSummary = page.locator('.order-summary-panel')
  await orderOfferSummary.locator('.order-voucher-discount').getByText('Voucher SALE74', { exact: true }).waitFor()
  assert.match(await orderOfferSummary.locator('.order-grand-total').innerText(), /635.000/)
  automaticType = 'PRODUCT'
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => localStorage.setItem('qa_mixed_basket', '1'))
  await page.goto(new URL('/checkout', origin).href, { waitUntil: 'domcontentloaded' })
  const switchSummary = page.locator('.order-summary-panel')
  await switchSummary.locator('.order-voucher-discount').getByText('Voucher SALE74', { exact: true }).waitFor()
  assert.match(await switchSummary.locator('.item-offer-badge').innerText(), /600.000/)
  assert.equal(quoteRequests.at(-1).preferProductDiscounts, true)
  await switchSummary.getByRole('textbox', { name: 'Mã giảm giá' }).fill('SALE74')
  await switchSummary.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await switchSummary.locator('.order-voucher-discount').waitFor()
  assert.match(await switchSummary.locator('.item-offer-badge').innerText(), /600.000/)
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /2.600.000/)
  failValidation = true
  await switchSummary.getByRole('textbox', { name: 'Mã giảm giá' }).fill('INVALID')
  await switchSummary.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await switchSummary.getByText('Mã mới không hợp lệ', { exact: true }).waitFor()
  assert.match(await switchSummary.locator('.order-grand-total').innerText(), /2.600.000/, 'invalid replacement keeps the existing voucher')
  failValidation = false
  await switchSummary.getByRole('button', { name: 'Bỏ chọn', exact: true }).click()
  await switchSummary.locator('.order-grand-total').filter({ hasText: '3.600.000' }).waitFor()
  assert.equal(await switchSummary.locator('.order-voucher-discount').count(), 0)

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await switchSummary.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `item savings fit ${width}px`)
  }
  await switchSummary.screenshot({ path: fileURLToPath(new URL('replacement-checkout.png', screenshots)), animations: 'disabled' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  automaticPromotion = false
  await page.goto(new URL('/admin/promotions', origin).href, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Ưu đãi tháng 11', exact: true }).waitFor()
  const search = page.getByRole('searchbox', { name: 'Tìm kiếm chiến dịch' })
  await search.fill('uu dai thang 11')
  assert.equal(await page.locator('.promotion-name-button').count(), 1)
  await search.fill('sale74')
  assert.equal(await page.locator('.promotion-name-button').count(), 1)
  await page.getByRole('button', { name: 'Ưu đãi tháng 11', exact: true }).click()
  await page.getByRole('region', { name: 'Chi tiết chiến dịch' }).getByRole('button', { name: 'Thiết lập ưu đãi', exact: true }).click()
  await page.getByRole('button', { name: /Bậc giảm theo đơn/ }).click()
  await page.getByRole('button', { name: 'Thêm Bậc', exact: true }).click()
  await page.getByRole('cell').filter({ hasText: '10.000.000' }).first().waitFor()
  assert.equal(orderDiscounts.length, 1)
  await page.getByRole('button', { name: /Ưu đãi sản phẩm/ }).click()
  await page.getByLabel('Chọn Sản Phẩm Nội Thất', { exact: true }).selectOption('7')
  await page.locator('#promotion-field-7').fill('50')
  await page.getByRole('button', { name: 'Thêm Giảm Giá', exact: true }).click()
  await page.getByRole('row').filter({ hasText: product.name }).waitFor()
  assert.equal(productDiscounts.length, 1)
  const adminPrice = page.getByRole('dialog').locator('.promotion-product-prices')
  assert.deepEqual(await adminPrice.evaluate(el => [...el.children].map(child => child.tagName)), ['DEL', 'SPAN', 'STRONG'])
  assert.match(await adminPrice.locator('del').innerText(), /1.200.000/)
  assert.equal(await adminPrice.locator('span').innerText(), '-50%')
  assert.match(await adminPrice.locator('strong').innerText(), /600.000/)
  await page.getByRole('dialog').screenshot({ path: fileURLToPath(new URL('admin-product-price.png', screenshots)), animations: 'disabled' })
  await page.getByRole('button', { name: /Quản lý mã voucher/ }).click()
  const voucherPage = page.getByRole('region', { name: 'Quản lý voucher' })
  const voucherList = voucherPage.getByRole('region', { name: 'Danh sách voucher' })
  const voucherDetail = voucherPage.getByRole('region', { name: 'Chi tiết voucher' })
  const voucherRow = code => voucherList.getByRole('row', { name: `Xem chi tiết voucher ${code}` })
  await voucherRow('SALE74').waitFor()
  assert.equal(await page.getByRole('dialog').count(), 0)
  await page.getByRole('columnheader', { name: 'Loại voucher', exact: true }).waitFor()
  await voucherRow('SALE74').getByRole('cell', { name: 'Theo hóa đơn', exact: true }).waitFor()
  await voucherPage.locator('.promotion-voucher-create summary').click()
  assert.equal(await page.getByRole('button', { name: 'Tạo 4 mã thành viên', exact: true }).count(), 0)
  await page.getByLabel('Mã Voucher', { exact: true }).fill('uudaikimcuong')
  await page.getByRole('button', { name: 'Tạo voucher tạm ngưng', exact: true }).click()
  await page.getByText('Đây là mã thành viên mặc định. Hãy nhập mã khác.', { exact: true }).waitFor()
  assert.equal(vouchers.some(voucher => voucher.code === 'UUDAIKIMCUONG'), false)
  await page.getByLabel('Mã Voucher', { exact: true }).fill('NEW74')
  await page.getByRole('button', { name: 'Tạo voucher tạm ngưng', exact: true }).click()
  await voucherRow('NEW74').waitFor()
  assert.deepEqual(await page.locator('#voucher-type option').evaluateAll(options => options.map(option => option.value)), ['ORDER', 'VIP'])
  const saved = vouchers.find(v => v.code === 'NEW74')
  assert.equal(saved.voucherType, 'VIP')
  assert.equal(saved.productId, null)
  assert.equal(saved.status, 'INACTIVE')
  await voucherRow('NEW74').getByRole('cell', { name: 'Theo hạng thành viên', exact: true }).waitFor()
  await voucherRow('PRODUCT74').getByRole('cell', { name: 'Theo sản phẩm', exact: true }).waitFor()
  const oldRow = voucherRow('SALE74')
  await oldRow.click()
  assert.equal(await voucherDetail.getByRole('button', { name: 'Sửa', exact: true }).isDisabled(), true, 'cancelled order history locks editing even when usage is zero')
  await page.getByRole('region', { name: 'L\u1ecbch s\u1eed s\u1eed d\u1ee5ng voucher' }).getByText('#42', { exact: true }).waitFor()
  const newRow = voucherRow('NEW74')
  await newRow.click()
  await voucherDetail.getByTitle('Bật/Tắt mã voucher', { exact: true }).click()
  await newRow.getByText('Đã kích hoạt', { exact: true }).waitFor()
  assert.equal(await voucherDetail.getByRole('button', { name: 'Sửa', exact: true }).isDisabled(), true)
  await voucherDetail.getByTitle('Bật/Tắt mã voucher', { exact: true }).click()
  await newRow.getByText('Tạm ngưng', { exact: true }).waitFor()
  await voucherDetail.getByRole('button', { name: 'Sửa', exact: true }).click()
  await page.locator('#promotion-field-11').fill('15')
  await page.getByRole('button', { name: 'L\u01b0u thay \u0111\u1ed5i', exact: true }).click()
  await newRow.getByText('Gi\u1ea3m 15%', { exact: true }).waitFor()
  await voucherDetail.getByRole('button', { name: 'Tạo mã thay thế', exact: true }).click()
  await page.getByLabel('M\u00e3 Voucher', { exact: true }).fill('VIPREPLACE')
  await voucherPage.locator('.promotion-voucher-form').getByRole('button', { name: 'Tạo mã thay thế', exact: true }).click()
  await voucherRow('VIPREPLACE').waitFor()
  assert.equal(vouchers.find(v => v.code === 'NEW74').status, 'INACTIVE')
  assert.equal(vouchers.find(v => v.code === 'VIPREPLACE').voucherType, 'VIP')
  assert.equal(vouchers.find(v => v.code === 'VIPREPLACE').status, 'INACTIVE')
  await voucherDetail.getByRole('button', { name: 'Xóa vĩnh viễn voucher', exact: true }).click()
  await page.getByRole('dialog').filter({ hasText: 'Xóa vĩnh viễn voucher' }).getByRole('button', { name: 'Hủy bỏ', exact: true }).click()
  assert(vouchers.some(v => v.code === 'NEW74'))
  await voucherDetail.getByRole('button', { name: 'Xóa vĩnh viễn voucher', exact: true }).click()
  await page.getByRole('dialog').filter({ hasText: 'Xóa vĩnh viễn voucher' }).getByRole('button', { name: 'Xác nhận thực hiện', exact: true }).click()
  await newRow.waitFor({ state: 'detached' })
  await oldRow.click()
  await voucherDetail.getByRole('button', { name: 'Lưu trữ voucher', exact: true }).click()
  await page.getByRole('dialog').filter({ hasText: 'Lưu trữ voucher' }).getByRole('button', { name: 'Xác nhận thực hiện', exact: true }).click()
  await oldRow.getByText('Đã lưu trữ', { exact: true }).waitFor()
  await oldRow.scrollIntoViewIfNeeded()
  await voucherPage.screenshot({ path: fileURLToPath(new URL('voucher-lifecycle-admin.png', screenshots)), animations: 'disabled' })
  assert.equal(await voucherDetail.getByRole('button', { name: 'Sửa', exact: true }).isDisabled(), true)
  await page.getByLabel('L\u1ecdc tr\u1ea1ng th\u00e1i voucher', { exact: true }).selectOption('ARCHIVED')
  assert.equal(await page.getByRole('row').filter({ has: page.getByText('VIPREPLACE', { exact: true }) }).count(), 0)
  await page.getByLabel('L\u1ecdc tr\u1ea1ng th\u00e1i voucher', { exact: true }).selectOption('ALL')
  await page.locator('.promotion-check-panel summary').click()
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
  await voucherPage.screenshot({ path: fileURLToPath(new URL('promotions-voucher-admin.png', screenshots)), animations: 'disabled' })
  await page.getByRole('button', { name: 'Chiến dịch', exact: true }).click()
  await search.fill('vipreplace')
  await page.locator('.promotion-row-description').filter({ hasText: 'PRODUCT74 (Theo sản phẩm)' }).waitFor()
  await page.locator('.promotion-row-description').filter({ hasText: 'VIPREPLACE (Theo hạng thành viên)' }).waitFor()
  await page.getByRole('button', { name: 'Ưu đãi tháng 11', exact: true }).waitFor()
  assert.equal(await page.locator('.promotion-name-button').count(), 1, 'New vouchers must be searchable after saving')
  await search.fill('does-not-exist')
  await page.getByRole('heading', { name: 'Không tìm thấy chiến dịch', exact: true }).waitFor()
  await search.fill('sale74')
  failVouchers = true
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await page.getByText('Lỗi tải danh sách khuyến mãi và voucher (HTTP 503)', { exact: true }).waitFor()
  failVouchers = false
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await page.getByRole('button', { name: 'Ưu đãi tháng 11', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.addInitScript(() => {
    sessionStorage.setItem('furniture_admin_user', JSON.stringify({ userId: 2, staffId: 2, role: 'STAFF', staffType: 'SALES', accessToken: 'sales-token', apiBaseUrl: 'http://localhost:8080' }))
  })
  await page.goto(new URL('/admin/promotions', origin).href)
  assert.equal(await page.getByRole('button', { name: 'Tạo chiến dịch', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: 'Thiết lập ưu đãi: Ưu đãi tháng 11', exact: true }).click()
  await page.getByRole('button', { name: /Quản lý mã voucher/ }).click()
  await voucherPage.locator('.promotion-voucher-create summary').click()
  await page.getByLabel('Mã Voucher', { exact: true }).fill('SALESDRAFT')
  await page.getByRole('button', { name: 'Tạo voucher tạm ngưng', exact: true }).click()
  const salesRow = voucherRow('SALESDRAFT')
  await salesRow.click()
  assert.equal(vouchers.find(v => v.code === 'SALESDRAFT').status, 'INACTIVE')
  assert(await voucherDetail.getByTitle('Bật/Tắt mã voucher', { exact: true }).isDisabled())
  assert(await voucherDetail.getByRole('button', { name: 'Sửa', exact: true }).isEnabled())
  assert(await voucherDetail.getByRole('button', { name: 'Tạo mã thay thế', exact: true }).isDisabled())
  assert(await voucherDetail.getByRole('button', { name: 'Xóa vĩnh viễn voucher', exact: true }).isDisabled())
  const productRow = voucherRow('PRODUCT74')
  await productRow.click()
  await voucherDetail.getByTitle('Bật/Tắt mã voucher', { exact: true }).click()
  await productRow.getByText('Tạm ngưng', { exact: true }).waitFor()
  assert.equal(vouchers.find(v => v.code === 'PRODUCT74').status, 'INACTIVE')
  assert(await voucherDetail.getByTitle('Bật/Tắt mã voucher', { exact: true }).isDisabled())
  await page.locator('.promotion-check-panel summary').click()
  const salesCheck = page.getByRole('form', { name: 'Kiểm tra voucher', exact: true })
  await salesCheck.getByLabel('Voucher cần kiểm tra', { exact: true }).selectOption('74')
  await salesCheck.getByLabel('Sản phẩm 1', { exact: true }).selectOption('7')
  await salesCheck.getByRole('button', { name: 'Kiểm tra voucher', exact: true }).click()
  await salesCheck.getByRole('status').waitFor()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.equal(await salesCheck.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `voucher checker fits ${width}px`)
  }
  await voucherPage.screenshot({ path: fileURLToPath(new URL('promotions-voucher-sales-mobile.png', screenshots)), animations: 'disabled' })
  console.log('PASS checkout and voucher lifecycle: inactive creation/replacement, pause before edit, confirmed hard/soft deletion, preserved history, SALES create/edit/pause without activation/deletion, simulation, desktop/mobile')
  assert.deepEqual(errors, [])
} finally { await browser.close(); await server.close() }
