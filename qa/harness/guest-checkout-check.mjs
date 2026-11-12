import assert from 'node:assert/strict'
import { chromium } from 'file:///C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { adminApiHeaders } from './admin-auth.mjs'

const origin = 'http://127.0.0.1:18080'
async function sql(query, params = []) {
  const response = await fetch('http://127.0.0.1:15433', { method: 'POST', body: JSON.stringify({ sql: query, params }) })
  const rows = await response.json()
  assert.equal(response.status, 200, JSON.stringify(rows))
  return rows
}
async function api(path, { method = 'GET', body, headers = {}, status = 200 } = {}) {
  const response = await fetch(`${origin}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`)
  return data
}
const admin = await adminApiHeaders()
const [product] = await sql('SELECT id, selling_price, quantity FROM products WHERE is_active = TRUE AND quantity > 5 ORDER BY id LIMIT 1')
const [staff] = await sql('SELECT id FROM staff ORDER BY id LIMIT 1')
const body = {
  fullName: 'QA Guest Receiver', phone: '0901234567', address: '123 Guest Street',
  ward: 'Phường Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh',
  totalAmount: 1, discountAmount: 999999, items: [{ productId: product.id, quantity: 1, unitPrice: 0 }],
}
const create = (extra = {}) => api('/orders', { method: 'POST', body: { ...body, ...extra } })
const tokenHeaders = (order) => ({ 'X-Order-Token': order.guestToken })
await api('/orders', { method: 'POST', body: { ...body, customerId: 1 }, status: 403 })
for (const invalid of [{ fullName: '' }, { phone: 'bad' }, { address: '' }, { city: '' }, { items: [] }]) {
  await api('/orders', { method: 'POST', body: { ...body, ...invalid }, status: 400 })
}
const quote = await api('/orders/preview', { method: 'POST', body })
const first = await create()
const price = Number(product.selling_price)
assert.equal(Number(first.totalAmount), Number(quote.totalAmount))
assert.equal(Number(first.discountAmount), Number(quote.discountAmount))
const second = await create()
const contacts = await sql('SELECT o.id, o.customer_id, o.guest_token_hash, c.user_id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id IN ($1, $2)', [first.orderId, second.orderId])
assert.equal(contacts.length, 2)
assert.notEqual(contacts[0].customer_id, contacts[1].customer_id)
assert(contacts.every(row => row.user_id === null && row.guest_token_hash.length === 64 && row.guest_token_hash !== first.guestToken))
await api(`/orders/${first.orderId}`, { status: 401 })
await api(`/orders/${first.orderId}`, { headers: { 'X-Order-Token': 'forged' }, status: 403 })
await api(`/orders/${first.orderId}`, { headers: tokenHeaders(second), status: 403 })
await api('/orders?customerId=1', { headers: tokenHeaders(first), status: 403 })
const detail = await api(`/orders/${first.orderId}`, { headers: tokenHeaders(first) })
assert.equal(detail.order.full_name, body.fullName)
assert.equal(detail.order.phone, body.phone)
assert.equal(Number(detail.items[0].unit_price), price)
await api(`/orders/${first.orderId}/cancel`, { method: 'POST', headers: tokenHeaders(first) })
await api(`/orders/${first.orderId}/cancel`, { method: 'POST', headers: tokenHeaders(first), status: 400 })
assert.equal((await sql('SELECT quantity FROM products WHERE id = $1', [product.id]))[0].quantity, product.quantity - 1)
await api(`/admin/orders/${second.orderId}/confirm`, { method: 'PUT', headers: admin, body: { staffId: staff.id } })
await api(`/orders/${second.orderId}/cancel`, { method: 'POST', headers: tokenHeaders(second), status: 400 })
await api(`/admin/orders/${second.orderId}/ship`, { method: 'PUT', headers: admin })
await api(`/admin/orders/${second.orderId}/complete`, { method: 'PUT', headers: admin })
const [invoice] = await sql('SELECT id, final_amount FROM invoices WHERE order_id = $1', [second.orderId])
assert.equal(Number(invoice.final_amount), Number(second.totalAmount))
const invoiceDetail = await api(`/admin/invoices/${invoice.id}`, { headers: admin })
assert.equal(invoiceDetail.customerName, body.fullName)
assert.equal(invoiceDetail.phone, body.phone)
assert.equal((await api(`/orders/${second.orderId}`, { headers: tokenHeaders(second) })).order.status, 'COMPLETED')
const customers = await api('/admin/customers?keyword=QA%20Guest%20Receiver', { headers: admin })
assert(customers.content.some(row => row.userId === null && row.fullName === body.fullName))
const account = await api('/auth/register', { method: 'POST', status: 201, body: { username: `guest_regression_${Date.now()}`, password: 'QaPass123!', fullName: 'QA Account' } })
const accountHeaders = { Authorization: `Bearer ${account.accessToken}` }
const accountOrder = await api('/orders', { method: 'POST', headers: accountHeaders, body: { ...body, customerId: account.customerId, userId: account.userId } })
assert.equal(accountOrder.guestToken, null)
await api(`/orders/${accountOrder.orderId}`, { headers: accountHeaders })
assert((await api(`/orders?customerId=${account.customerId}`, { headers: accountHeaders })).some(row => row.id === accountOrder.orderId))
await api(`/orders/${accountOrder.orderId}`, { headers: tokenHeaders(first), status: 403 })
console.log('PASS API: guest identity, validation, server prices, private links, cancellation/stock, admin, invoices, account regression')

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'domcontentloaded' })
  await page.locator('.product-card').first().waitFor()
  await page.getByRole('button', { name: /^Thêm .* vào giỏ hàng$/ }).first().click()
  await page.getByRole('button', { name: /Mở giỏ hàng/ }).click()
  await page.getByRole('button', { name: /Tiếp tục đặt hàng/ }).click()
  await page.locator('#ord-fullName').fill('QA Guest Browser')
  await page.locator('#ord-phone').fill(body.phone)
  await page.locator('#ord-address').fill(body.address)
  await page.locator('#ord-city').selectOption(body.city)
  await page.locator('#ord-district').selectOption(body.district)
  await page.locator('#ord-ward').selectOption(body.ward)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('#ord-fullName').waitFor()
  assert.equal(await page.locator('#ord-fullName').inputValue(), 'QA Guest Browser')
  await page.getByRole('button', { name: /Tiếp theo/ }).click()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Đặt hàng ngay', exact: true }).waitFor()
  assert.equal(await page.locator('.auth-overlay').count(), 0)
  const pending = page.waitForResponse(response => response.url().endsWith('/api/orders') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Đặt hàng ngay', exact: true }).click()
  const createdResponse = await pending
  assert.equal(createdResponse.status(), 200)
  const created = await createdResponse.json()
  await page.getByRole('button', { name: 'Sao chép liên kết đơn hàng' }).waitFor()
  const link = page.url()
  assert.equal(new URLSearchParams(new URL(link).hash.slice(1)).get('token'), created.guestToken)
  assert.equal(await page.evaluate(() => localStorage.getItem('furniture_customer_user')), null)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('QA Guest Browser', { exact: true }).waitFor()
  await page.screenshot({ path: 'qa/artifacts/guest-checkout-mobile.png', animations: 'disabled' })
  const overflow = await page.locator('.order-success-scroll-content').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth,
    wide: [...el.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > el.getBoundingClientRect().right + 1).map(child => [child.tagName, child.className, child.getBoundingClientRect().width]).slice(0, 12) }))
  assert(overflow.scroll <= overflow.width + 1, JSON.stringify(overflow))
  const other = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await other.goto(link, { waitUntil: 'domcontentloaded' })
  await other.getByText('QA Guest Browser', { exact: true }).waitFor()
  await other.screenshot({ path: 'qa/artifacts/guest-checkout-desktop.png', animations: 'disabled' })
  await other.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click()
  await other.locator('.cancel-order-confirm').click()
  await other.getByText('Đơn hàng đã được hủy', { exact: true }).waitFor()
  const invalid = new URL(link)
  invalid.hash = 'token=forged'
  await other.goto(invalid.href, { waitUntil: 'domcontentloaded' })
  await other.getByText('Không thể mở đơn hàng. Vui lòng kiểm tra kết nối và dùng đầy đủ liên kết đơn hàng đã lưu.').waitFor()
  assert.equal(await other.locator('.order-success-modern-container').count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS UI: anonymous checkout, draft refresh, server order, private link on another browser, refresh, mobile, cancellation, invalid link')
} finally {
  await browser.close()
}
