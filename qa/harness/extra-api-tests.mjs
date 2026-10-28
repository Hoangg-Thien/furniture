import fs from 'node:fs'
const f = JSON.parse(fs.readFileSync(new URL('../artifacts/fixtures.json', import.meta.url)))
const results = []
const base = 'http://127.0.0.1:18080'
async function sql(query, params = []) {
  const r = await fetch('http://127.0.0.1:15433', { method: 'POST', body: JSON.stringify({ sql: query, params }) })
  const data = await r.json()
  if (!r.ok) throw Error(JSON.stringify(data))
  return data
}
async function req(method, route, body) {
  const r = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  let data; const text = await r.text(); try { data = JSON.parse(text) } catch { data = text }
  return { status: r.status, data }
}
function record(name, pass, evidence = {}) {
  results.push({ name, pass, ...evidence })
  fs.writeFileSync(new URL('../artifacts/extra-api-results.json', import.meta.url), JSON.stringify(results, null, 2))
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`)
}
async function check(name, method, route, body, statuses = [200]) {
  const r = await req(method, route, body)
  record(name, statuses.includes(r.status), { method, route, status: r.status, response: r.data })
  return r.data
}
const suffix = Date.now().toString().slice(-8)
const { product: p, category: c, supplier: s, receipt, voucher: v, program: prog, user } = f
await check('Category detail', 'GET', `/api/admin/categories/${c.id}`)
await check('Category toggle hide with products', 'PUT', `/api/admin/categories/${c.id}/toggle-status`)
let catalog = await req('GET', '/api/products')
record('Hidden category products hidden from storefront', !catalog.data.some(x => x.id === p.id))
await check('Category toggle activate', 'PUT', `/api/admin/categories/${c.id}/toggle-status`)
await check('Product toggle hide', 'PUT', `/api/admin/products/${p.id}/toggle-status`)
catalog = await req('GET', '/api/products')
record('Hidden product removed from catalog', !catalog.data.some(x => x.id === p.id))
await check('Product toggle show', 'PUT', `/api/admin/products/${p.id}/toggle-status`)
const emptyCat = await check('Category empty create', 'POST', '/api/admin/categories', { name: `QA empty ${suffix}` }, [201])
await check('Category empty delete', 'DELETE', `/api/admin/categories/${emptyCat.id}`)
const emptySup = await check('Supplier empty create', 'POST', '/api/admin/suppliers', { name: `QA empty ${suffix}` }, [201])
await check('Supplier empty delete', 'DELETE', `/api/admin/suppliers/${emptySup.id}`)
await check('Promotion edit', 'PUT', `/api/admin/promotions/${prog.id}`, { name: prog.name, startDate: '2026-01-01T00:00:00', endDate: '2027-12-31T23:59:59', status: 'ACTIVE', description: 'QA edited' })
const pd = await check('Promotion product discount create', 'POST', `/api/admin/promotions/${prog.id}/product-discounts`, { productId: p.id, discountPercent: 20 }, [201])
const od = await check('Promotion order discount create', 'POST', `/api/admin/promotions/${prog.id}/order-discounts`, { minimumAmount: 0, discountPercent: 10 }, [201])
const orderBody = { userId: user.userId, customerId: user.customerId, fullName: 'QA Receiver First', phone: '0901234567', address: 'QA first shipping address', items: [{ productId: p.id, quantity: 1, unitPrice: 100000 }] }
const a = await check('Order for shipping and promotion verification', 'POST', '/api/orders', orderBody)
const aFirst = (await req('GET', `/api/orders/${a.orderId}`)).data
record('Order stores recipient full name', aFirst.order.full_name === orderBody.fullName, { expected: orderBody.fullName, actual: aFirst.order.full_name })
await check('Order second shipping address', 'POST', '/api/orders', { ...orderBody, address: 'QA second shipping address', phone: '0912345678' })
const aAgain = (await req('GET', `/api/orders/${a.orderId}`)).data
record('Earlier order shipping address remains unchanged', aAgain.order.address === aFirst.order.address, { before: aFirst.order.address, after: aAgain.order.address })
const calc = (await req('POST', '/api/admin/invoices/preview-calculation', { orderId: a.orderId, includeVat: false })).data
record('Invoice applies configured product and order promotions', Number(calc.orderDiscount) > 0 || Number(calc.finalAmount) < 135000, { calc, expectedProductDiscount: '20%', expectedOrderDiscount: '10%', reference: 'doc_kehoach/09_QUAN_LY_HOA_DON.md B2-B4' })
await check('Promotion product discount delete', 'DELETE', `/api/admin/promotions/${prog.id}/product-discounts/${pd.id}`)
await check('Promotion order discount delete', 'DELETE', `/api/admin/promotions/${prog.id}/order-discounts/${od.id}`)
await check('Voucher status inactive', 'PUT', `/api/admin/promotions/vouchers/${v.id}/status?status=INACTIVE`)
await check('Inactive voucher validation rejected', 'POST', '/api/vouchers/validate', { code: v.code, subtotal: 100000 }, [400])
await check('Voucher approve', 'PUT', `/api/vouchers/${v.id}/approve`)
await check('Voucher reject', 'PUT', `/api/vouchers/${v.id}/reject`)
await check('Voucher approve again', 'PUT', `/api/vouchers/${v.id}/approve`)
const newV = await check('Public voucher create draft', 'POST', '/api/vouchers', { code: `QADRAFT${suffix}`, discountPercent: 10, quantity: 10, minimumAmount: 0, maximumDiscount: 50000, startDate: '2026-01-01 00:00:00', endDate: '2027-12-31 23:59:59', autoApprove: false }, [201])
await check('Draft voucher validation rejected', 'POST', '/api/vouchers/validate', { code: newV.code, subtotal: 100000 }, [400])
await sql('UPDATE vouchers SET used_quantity=quantity WHERE id=$1', [v.id])
await check('Exhausted voucher validation rejected', 'POST', '/api/vouchers/validate', { code: v.code, subtotal: 100000 }, [400])
const exhausted = await req('POST', '/api/orders', { ...orderBody, voucherId: v.id, discountAmount: 10000 })
record('Order rejects exhausted voucher even bypassing validation', [400, 409, 422].includes(exhausted.status), { ...exhausted })
await sql('UPDATE vouchers SET used_quantity=0 WHERE id=$1', [v.id])
const guest = await req('POST', '/api/orders', { ...orderBody, customerId: null, userId: null, address: 'QA guest' })
const guestCustomer = guest.data.orderId ? (await sql('SELECT customer_id FROM orders WHERE id=$1', [guest.data.orderId]))[0].customer_id : null
record('Order without identity must not use first customer', [400, 401, 403].includes(guest.status), { ...guest, actualCustomerId: guestCustomer })
const dup = await req('POST', '/api/orders', { ...orderBody, items: [{ productId: p.id, quantity: 1, unitPrice: 100000 }, { productId: p.id, quantity: 2, unitPrice: 100000 }] })
const dupRow = (await sql('SELECT SUM(quantity) AS qty, SUM(amount) AS amount FROM order_items WHERE order_id=$1', [dup.data.orderId]))[0]
record('Duplicate product rows preserve total quantity', Number(dupRow.qty) === 3 || [400, 422].includes(dup.status), { ...dup, storedItems: dupRow, expectedQty: 3 })
const before = Number((await sql('SELECT quantity FROM products WHERE id=$1', [p.id]))[0].quantity)
await check('Receipt completed can be reverted (probe)', 'PATCH', `/api/admin/suppliers/${s.id}/receipts/${receipt.receiptId}/status`, { status: 'PENDING' })
await check('Receipt reverted then completed (probe)', 'PATCH', `/api/admin/suppliers/${s.id}/receipts/${receipt.receiptId}/status`, { status: 'COMPLETED' })
const after = Number((await sql('SELECT quantity FROM products WHERE id=$1', [p.id]))[0].quantity)
record('Receipt status round trip cannot inflate stock', before === after, { before, after, repeatedAddition: after - before })
const invalidReceipt = await req('POST', `/api/admin/suppliers/${s.id}/receipts`, { staffId: 1, status: 'COMPLETED', items: [{ productId: p.id, quantity: 0, unitPrice: 50000 }] })
record('Receipt rejects all zero quantity items', [400, 422].includes(invalidReceipt.status), invalidReceipt)
const revenue = (await req('GET', '/api/admin/statistics/category-share?fromDate=2040-01-01&toDate=2040-01-02')).data
record('Category revenue obeys date range with no orders', revenue.every(x => Number(x.totalRevenue) === 0), { revenue })
// Verify actual file serving, including a valid PNG and a disallowed HTML upload.
const form = new FormData()
form.append('files', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'qa.png')
const upload = await fetch(`${base}/api/admin/products/${p.id}/images`, { method: 'POST', body: form })
const uploadData = await upload.json()
record('Upload valid PNG', upload.ok, { status: upload.status, data: uploadData })
const uploadedPath = uploadData.find?.(x => x.imageUrl?.startsWith('/uploads'))?.imageUrl
if (uploadedPath) {
  const img = await fetch(base + uploadedPath)
  record('Uploaded image URL is served', img.ok && img.headers.get('content-type')?.includes('image'), { path: uploadedPath, status: img.status, type: img.headers.get('content-type') })
}
const html = new FormData()
html.append('files', new Blob(['<!doctype html><title>QA upload type probe</title>'], { type: 'text/html' }), 'qa.html')
const bad = await fetch(`${base}/api/admin/products/${p.id}/images`, { method: 'POST', body: html })
record('Image upload rejects HTML files', [400, 415, 422].includes(bad.status), { status: bad.status, response: await bad.json() })
const emptyProg = await check('Empty promotion create', 'POST', '/api/admin/promotions', { name: `QA deletable ${suffix}`, startDate: '2026-01-01T00:00:00', endDate: '2027-12-31T23:59:59', status: 'DRAFT' }, [201])
await check('Empty promotion delete', 'DELETE', `/api/admin/promotions/${emptyProg.id}`)
const adminCreatedCustomer = await check('Admin creates CUSTOMER account', 'POST', '/api/admin/users', { username: `qacustomer${suffix}`, password: 'QaPass123!', role: 'CUSTOMER' }, [201])
const customerLogin = await check('Admin-created CUSTOMER can login', 'POST', '/api/auth/login', { username: adminCreatedCustomer.username, password: 'QaPass123!' })
record('Admin-created CUSTOMER has linked customer profile', customerLogin.customerId != null, { customerId: customerLogin.customerId, userId: customerLogin.userId })
const adminHashLogin = await req('POST', '/api/auth/login', { username: user.username, password: (await import('node:crypto')).createHash('sha256').update(f.password).digest('hex') })
record('Stored password hash must not be accepted as password', adminHashLogin.status === 401, { status: adminHashLogin.status, authenticatedAs: adminHashLogin.data.username })
console.log(JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length }))
