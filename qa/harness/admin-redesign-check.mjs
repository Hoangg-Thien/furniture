// UI regression checks use an isolated in-memory API. No application database is modified.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const origin = process.env.QA_ADMIN_ORIGIN || 'http://127.0.0.1:5173'
const artifacts = new URL('../artifacts/admin-redesign/', import.meta.url)
await fs.mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const results = []
let programs = []
let failList = false
let failDetail = false
let delayDetail = false
let showActivity = false
let discounts = []
let orderDiscounts = []
let vouchers = []
const product = { id: 5, name: 'Sofa gỗ sồi', price: 10000000, sellingPrice: 10000000, stockQuantity: 15 }
const past = new Date(Date.now() - 86400000 * 30).toISOString()
const future = new Date(Date.now() + 86400000 * 30).toISOString()
const fixtures = () => Array.from({ length: 13 }, (_, index) => ({
  id: index + 1, name: index === 0 ? 'Ưu đãi mùa mới' : `Bộ sưu tập ${index + 1}`,
  description: 'Ưu đãi nội thất cho không gian sống', startDate: past, endDate: future,
  status: index < 7 ? 'ACTIVE' : index < 10 ? 'DRAFT' : 'INACTIVE',
  productDiscountsCount: index === 0 ? 2 : 0, orderDiscountsCount: index === 0 ? 1 : 0, vouchersCount: index === 0 ? 3 : 0
}))

await page.addInitScript(() => {
  localStorage.setItem('furniture_admin_user', JSON.stringify({ id: 1, username: 'admin01', role: 'ADMIN' }))
})
await page.route('**/api/**', async route => {
  const url = new URL(route.request().url())
  const path = url.pathname
  const method = route.request().method()
  const body = method === 'POST' || method === 'PUT' ? route.request().postDataJSON() : null
  const send = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (method === 'OPTIONS') return send({})
  if (path === '/api/admin/promotions') {
    if (method === 'GET') return send(failList ? { error: 'Unavailable' } : programs, failList ? 503 : 200)
    if (method === 'POST') {
      const created = { ...body, id: 99, productDiscountsCount: 0, orderDiscountsCount: 0, vouchersCount: 0 }
      programs.unshift(created)
      return send(created, 201)
    }
  }
  const detail = path.match(/^\/api\/admin\/promotions\/(\d+)\/detail$/)
  if (detail) {
    if (delayDetail) await new Promise(resolve => setTimeout(resolve, 400))
    return send(failDetail ? { error: 'Unavailable' } : { program: programs.find(p => p.id === Number(detail[1])), productDiscounts: discounts, orderDiscounts, vouchers }, failDetail ? 503 : 200)
  }
  const item = path.match(/^\/api\/admin\/promotions\/(\d+)$/)
  if (item) {
    if (method === 'PUT') Object.assign(programs.find(p => p.id === Number(item[1])), body)
    if (method === 'DELETE') programs = programs.filter(p => p.id !== Number(item[1]))
    return send({ message: 'OK' })
  }
  const status = path.match(/^\/api\/admin\/promotions\/(\d+)\/status$/)
  if (status) { programs.find(p => p.id === Number(status[1])).status = body.status; return send({}) }
  if (/\/product-discounts$/.test(path) && method === 'POST') { discounts.push({ id: 1, ...body, productName: product.name, originalPrice: product.sellingPrice, discountedPrice: 9000000 }); return send({}) }
  if (/\/product-discounts\/\d+$/.test(path) && method === 'DELETE') { discounts = []; return send({}) }
  if (/\/order-discounts$/.test(path) && method === 'POST') { orderDiscounts.push({ id: 1, ...body }); return send({}) }
  if (/\/order-discounts\/\d+$/.test(path) && method === 'DELETE') { orderDiscounts = []; return send({}) }
  if (/\/vouchers$/.test(path) && method === 'POST') { const voucher = { id: 1, ...body, usedCount: 0 }; vouchers.push(voucher); return send(voucher) }
  if (/\/vouchers\/\d+\/status$/.test(path)) { vouchers[0].status = body.status; return send({}) }
  if (/\/vouchers\/\d+$/.test(path) && method === 'DELETE') { vouchers = []; return send({}) }
  if (path === '/api/admin/products') return send({ content: url.searchParams.has('lowStock') ? showActivity ? [{ ...product, quantity: 2 }] : [] : [product], totalElements: 1, totalPages: 1 })
  if (path === '/api/admin/orders' && showActivity && (!url.searchParams.has('status') || url.searchParams.get('status') === 'PENDING')) return send({ content: [{ id: 44, customerName: 'Khách kiểm thử', totalAmount: 10000000, status: 'PENDING', orderDate: past }], totalElements: 1, totalPages: 1 })
  if (path.startsWith('/api/admin/')) return send({ content: [], totalElements: 0, totalPages: 1 })
  return send([])
})

const check = async (name, action) => { await action(); results.push(name); console.log('PASS', name) }
const shot = name => page.screenshot({ path: new URL(name + '.png', artifacts).pathname.replace(/^\/(\w:)/, '$1'), fullPage: !name.includes('create') && !name.includes('vouchers'), animations: 'disabled', caret: 'hide' })
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
const openCreate = () => page.getByRole('button', { name: 'Tạo chiến dịch', exact: true }).click()

try {
  await page.goto(origin + '/admin/promotions')
  await page.getByRole('heading', { name: 'Ưu đãi đầu tiên, khởi đầu mới' }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await check('Empty state and desktop layout', async () => { await noOverflow(); assert.equal(await page.locator('.admin-stat-card').count(), 4); await shot('desktop-empty') })
  await check('Notifications show real API activity and remember read items', async () => {
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
    await page.getByText('Không có hoạt động nào cần xử lý.').waitFor()
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
    showActivity = true
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
    await page.locator('.admin-notif-item').first().waitFor()
    assert.equal(await page.locator('.admin-notif-item').count(), 2)
    await page.getByTitle('Đánh dấu đã đọc tất cả').click()
    assert.equal(await page.locator('.admin-unread-badge').count(), 0)
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
    await page.getByText('Đã cập nhật', { exact: true }).waitFor()
    assert.equal(await page.locator('.admin-unread-badge').count(), 0)
    await page.getByRole('button', { name: 'Thông báo hệ thống' }).click()
  })
  await check('Create form, keyboard dismissal, focus restoration', async () => {
    await openCreate()
    await page.getByRole('dialog').waitFor()
    await page.getByLabel(/Tên Chiến Dịch/).fill('Ưu đãi kiểm thử')
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert(await page.getByRole('button', { name: 'Tạo chiến dịch', exact: true }).evaluate(el => el === document.activeElement))
  })
  await check('Create and save campaign', async () => {
    await openCreate()
    await page.getByLabel(/Tên Chiến Dịch/).fill('Ưu đãi kiểm thử')
    await page.getByRole('dialog').getByRole('button', { name: 'Tạo chiến dịch', exact: true }).click()
    await page.getByRole('button', { name: 'Ưu đãi kiểm thử', exact: true }).waitFor()
    assert.equal(programs.length, 1)
  })
  programs = fixtures()
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await page.getByRole('button', { name: 'Ưu đãi mùa mới', exact: true }).waitFor()
  await check('Populated table and pagination', async () => {
    assert.equal(await page.locator('.promotion-name-button').count(), 10)
    await shot('desktop-data')
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
    assert.equal(await page.locator('.promotion-name-button').count(), 3)
    await page.getByRole('button', { name: 'Trang trước', exact: true }).click()
  })
  await check('Vietnamese accent-insensitive live search and reset', async () => {
    await page.getByLabel('Tìm kiếm chiến dịch', { exact: true }).fill('uu dai mua moi')
    assert.equal(await page.locator('.promotion-name-button').count(), 1)
    await page.getByLabel('Tìm kiếm chiến dịch', { exact: true }).fill('zzzz')
    await page.getByRole('heading', { name: 'Không tìm thấy chiến dịch' }).waitFor()
    await page.locator('.promotion-empty').getByRole('button', { name: 'Xóa bộ lọc' }).click()
    assert.equal(await page.locator('.promotion-name-button').count(), 10)
  })
  await check('Status, time filters, KPI totals stay stable', async () => {
    await page.locator('.promotion-status-tabs').getByRole('button', { name: /Bản nháp/ }).click()
    assert.equal(await page.locator('.promotion-name-button').count(), 3)
    assert.equal((await page.locator('.stat-card-value').first().innerText()).trim(), '13')
    await page.getByLabel('Lọc theo thời gian').selectOption('UPCOMING')
    await page.getByRole('heading', { name: 'Không tìm thấy chiến dịch' }).waitFor()
    await page.locator('.promotion-clear-filter').click()
  })
  await check('Edit campaign and toggle status', async () => {
    await page.getByRole('button', { name: 'Chỉnh sửa: Ưu đãi mùa mới', exact: true }).click()
    await page.getByLabel(/Tên Chiến Dịch/).fill('Ưu đãi mùa mới cập nhật')
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await page.getByRole('button', { name: 'Ưu đãi mùa mới cập nhật', exact: true }).waitFor()
    await page.locator('.promotion-status-badge').first().click()
    await page.waitForFunction(() => document.querySelector('.promotion-status-badge')?.textContent === 'Tạm dừng')
    assert.equal(programs[0].status, 'INACTIVE')
  })
  await check('Detail loading, all four tabs and discount writes', async () => {
    delayDetail = true
    await page.getByRole('button', { name: 'Ưu đãi mùa mới cập nhật', exact: true }).click()
    await page.getByText('Đang tải cấu hình chiến dịch...').waitFor()
    await page.locator('.promotion-detail-tabs').waitFor()
    delayDetail = false
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).first().focus()
    await page.keyboard.press('Shift+Tab')
    assert(await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).last().evaluate(el => el === document.activeElement))
    await page.getByRole('button', { name: /2. SP Giảm Giá/ }).click()
    await page.getByRole('dialog').locator('form').getByRole('button').click()
    await page.getByRole('dialog').getByText(product.name, { exact: true }).waitFor()
    assert.equal(discounts.length, 1)
    await page.getByRole('button', { name: /3. Bậc Đơn Hàng/ }).click()
    await page.getByRole('dialog').locator('form').getByRole('button').click()
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"] tbody tr').length > 0)
    assert.equal(orderDiscounts.length, 1)
    await page.getByRole('button', { name: /4. Kho Voucher/ }).click()
    await page.getByLabel('Mã Voucher', { exact: true }).fill('MODERN10')
    await page.getByRole('button', { name: /Phát Hành Voucher/ }).click()
    await page.getByRole('dialog').getByText('MODERN10', { exact: true }).waitFor()
    assert.equal(vouchers.length, 1)
    await shot('desktop-vouchers')
    await page.keyboard.press('Escape')
  })
  await check('Delete requires explicit confirmation', async () => {
    await page.getByRole('button', { name: 'Xóa: Ưu đãi mùa mới cập nhật', exact: true }).click()
    assert.equal(programs.length, 13)
    await page.getByRole('button', { name: 'Xác Nhận Xóa', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(programs.length, 12)
  })
  await check('Global search uses configured backend', async () => {
    await page.keyboard.press('Control+k')
    await page.locator('.admin-global-search-input').fill('Sofa')
    await page.locator('.admin-search-result-row').first().waitFor()
    await page.locator('.admin-modal-backdrop').click({ position: { x: 2, y: 2 } })
  })
  await check('Detail API failure shows recoverable dialog', async () => {
    failDetail = true
    await page.locator('.promotion-name-button').first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Thử lại' }).waitFor()
    failDetail = false
    await page.getByRole('dialog').getByRole('button', { name: 'Thử lại' }).click()
    await page.locator('.promotion-detail-tabs').waitFor()
    await page.keyboard.press('Escape')
  })
  await check('Mobile navigation, forms and table scrolling', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await noOverflow()
    await page.getByRole('button', { name: 'Mở Menu điều hướng' }).click()
    await page.locator('.admin-sidebar.mobile-open').waitFor()
    await page.getByRole('button', { name: 'Khuyến mãi & voucher', exact: true }).click()
    assert.equal(await page.locator('.admin-sidebar.mobile-open').count(), 0)
    await openCreate()
    await page.getByRole('dialog').waitFor()
    await noOverflow()
    await shot('mobile-create')
    await page.keyboard.press('Escape')
    await shot('mobile-data')
    await page.locator('.promotion-name-button').first().click()
    await page.getByRole('button', { name: /4. Kho Voucher/ }).click()
    await noOverflow()
    await shot('mobile-vouchers')
    await page.keyboard.press('Escape')
  })
  await check('Empty mobile state and 320px minimum width', async () => {
    programs = []
    await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
    await page.getByRole('heading', { name: 'Ưu đãi đầu tiên, khởi đầu mới' }).waitFor()
    await noOverflow()
    await shot('mobile-empty')
    await page.setViewportSize({ width: 320, height: 740 })
    await noOverflow()
  })
  await check('List API error and retry', async () => {
    failList = true
    await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Ưu đãi đầu tiên, khởi đầu mới' }).count(), 0)
    failList = false
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await page.getByRole('heading', { name: 'Ưu đãi đầu tiên, khởi đầu mới' }).waitFor()
  })
  assert.deepEqual(errors, [])
  await fs.writeFile(new URL('results.json', artifacts), JSON.stringify({ passed: results.length, results, errors, api: 'isolated browser route mocks' }, null, 2))
  console.log('ALL CHECKS PASSED:', results.length)
} catch (error) {
  await shot('failure')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
