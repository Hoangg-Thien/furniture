import fs from 'node:fs'
const base = 'http://127.0.0.1:18080'
const out = new URL('../artifacts/api-results.json', import.meta.url)
const results = []
async function sql(query, params = []) {
  const r = await fetch('http://127.0.0.1:15433', { method: 'POST', body: JSON.stringify({ sql: query, params }) })
  const data = await r.json()
  if (!r.ok) throw Error(JSON.stringify(data))
  return data
}
async function request(method, route, body) {
  const r = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const text = await r.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  return { status: r.status, data, contentType: r.headers.get('content-type') }
}
async function test(name, run) {
  try {
    const evidence = await run()
    results.push({ name, pass: evidence.pass, ...evidence })
  } catch (e) { results.push({ name, pass: false, harnessError: e.message }) }
  fs.writeFileSync(out, JSON.stringify(results, null, 2))
  const r = results.at(-1)
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${name}${r.status ? ` (${r.status})` : ''}`)
}
async function check(name, method, route, body, expected = [200], verify = () => true) {
  let response
  await test(name, async () => {
    response = await request(method, route, body)
    return { pass: expected.includes(response.status) && verify(response.data), method, route, status: response.status,
      expected, response: typeof response.data === 'string' ? response.data.slice(0, 160) : response.data }
  })
  return response?.data
}
const suffix = Date.now().toString().slice(-8)
const password = 'QaPass123!'
// Basic reads across every backend module.
for (const route of ['/api/products', '/api/vouchers/active', '/api/admin/users', '/api/admin/customers',
  '/api/admin/staff', '/api/admin/categories', '/api/admin/products', '/api/admin/suppliers',
  '/api/admin/promotions', '/api/admin/promotions/vouchers', '/api/admin/orders', '/api/admin/orders/counts',
  '/api/admin/invoices', '/api/admin/invoices/counts', '/api/admin/invoices/eligible-orders',
  '/api/admin/statistics/overview', '/api/admin/statistics/revenue-trend', '/api/admin/statistics/category-share',
  '/api/admin/statistics/top-products', '/api/admin/statistics/dead-stock', '/api/admin/statistics/voucher-efficiency',
  '/api/admin/statistics/export-excel', '/api/admin/customers/export']) {
  await check(`Smoke ${route}`, 'GET', route)
}
await check('SECURITY anonymous admin read must be denied', 'GET', '/api/admin/users', undefined, [401, 403])
await check('SECURITY anonymous all orders must be denied', 'GET', '/api/orders', undefined, [401, 403])
await check('Registration short password', 'POST', '/api/auth/register', { username: 'qatest', password: '1', fullName: 'QA' }, [400])
await check('Registration missing full name', 'POST', '/api/auth/register', { username: 'qatest', password }, [400])
const user = await check('Registration valid', 'POST', '/api/auth/register', { username: `qa${suffix}`, password, fullName: 'QA Customer', email: `qa${suffix}@example.test`, phone: '0901234567', address: 'QA Address' }, [201])
if (!user?.customerId) throw Error('Cannot create QA customer; inspect api-results.json')
fs.writeFileSync(new URL('../artifacts/fixtures.json', import.meta.url), JSON.stringify({ user, password }, null, 2))
await check('Registration duplicate username', 'POST', '/api/auth/register', { username: user.username, password, fullName: 'QA' }, [400])
await check('Login valid by username', 'POST', '/api/auth/login', { username: user.username, password }, [200], d => d.userId === user.userId)
await check('Login valid by email', 'POST', '/api/auth/login', { username: user.email, password }, [200])
await check('Login wrong password', 'POST', '/api/auth/login', { username: user.username, password: 'wrong-password' }, [401])
await check('Login empty body', 'POST', '/api/auth/login', {}, [400])
await check('Profile read', 'GET', `/api/auth/me?userId=${user.userId}`)
await check('SECURITY anonymous profile update must be denied', 'PUT', `/api/auth/update/${user.userId}`, { fullName: 'QA changed without login' }, [401, 403])
await check('Profile incorrect current password', 'PUT', `/api/auth/update/${user.userId}`, { currentPassword: 'wrong', newPassword: 'NewPass123' }, [401])
await check('Profile update valid', 'PUT', `/api/auth/update/${user.userId}`, { fullName: 'QA Updated', phone: '0901234567', address: 'QA Address 2' })
const category = await check('Category create', 'POST', '/api/admin/categories', { name: `QA category ${suffix}`, description: 'QA', isActive: true }, [201])
await check('Category duplicate rejected', 'POST', '/api/admin/categories', { name: category.name }, [400])
await check('Category update', 'PUT', `/api/admin/categories/${category.id}`, { name: category.name, description: 'Updated QA', isActive: true })
const product = await check('Product create', 'POST', '/api/admin/products', { name: `QA chair ${suffix}`, categoryId: category.id, unit: 'cai', sellingPrice: 100000, quantity: 10, isActive: true }, [201])
const pid = product.id
await check('Product detail', 'GET', `/api/admin/products/${pid}`)
await check('Product invalid category', 'POST', '/api/admin/products', { name: 'QA bad', categoryId: 999999, unit: 'cai', sellingPrice: 1, quantity: 1 }, [400])
await check('Product negative price', 'POST', '/api/admin/products', { name: 'QA bad', categoryId: category.id, unit: 'cai', sellingPrice: -1, quantity: 1 }, [400])
await check('Category with products cannot delete', 'DELETE', `/api/admin/categories/${category.id}`, undefined, [400, 409])
await check('Product search', 'GET', `/api/admin/products?search=${suffix}`, undefined, [200], d => d.content.some(p => p.id === pid))
await check('Product edit', 'PUT', `/api/admin/products/${pid}`, { name: product.name, categoryId: category.id, unit: 'cai', sellingPrice: 100000, quantity: 10, isActive: true })
const images = await check('Image add URL', 'POST', `/api/admin/products/${pid}/images/url`, { imageUrl: 'https://example.test/qa.png' })
const iid = images?.[0]?.id
if (iid) {
  await check('Image primary', 'PUT', `/api/admin/products/${pid}/images/${iid}/set-primary`)
  await check('Image delete', 'DELETE', `/api/admin/products/${pid}/images/${iid}`)
}
await check('Image non-existent primary must reject', 'PUT', `/api/admin/products/${pid}/images/999999/set-primary`, undefined, [400, 404])
const supplier = await check('Supplier create', 'POST', '/api/admin/suppliers', { name: `QA supplier ${suffix}`, phone: '0901234567', email: 'qa@example.test', address: 'QA' }, [201])
await check('Supplier edit', 'PUT', `/api/admin/suppliers/${supplier.id}`, { name: supplier.name, phone: '0901234567', address: 'QA updated' })
await check('Supplier invalid phone', 'POST', '/api/admin/suppliers', { name: 'QA bad phone', phone: 'abc' }, [400])
const staffRows = await sql('SELECT id FROM staff ORDER BY id LIMIT 1')
const staffId = staffRows[0].id
const stock = async () => Number((await sql('SELECT quantity FROM products WHERE id=$1', [pid]))[0].quantity)
const receipt = await check('Receipt completed create', 'POST', `/api/admin/suppliers/${supplier.id}/receipts`, { staffId, status: 'COMPLETED', items: [{ productId: pid, quantity: 3, unitPrice: 50000 }] }, [201])
await test('Receipt adds stock once', async () => ({ pass: await stock() === 13, actualStock: await stock(), expectedStock: 13 }))
await check('Receipt history', 'GET', `/api/admin/suppliers/${supplier.id}/receipts`)
await check('Receipt items', 'GET', `/api/admin/suppliers/${supplier.id}/receipts/${receipt.receiptId}/items`)
await check('Receipt same completed status', 'PATCH', `/api/admin/suppliers/${supplier.id}/receipts/${receipt.receiptId}/status`, { status: 'COMPLETED' })
await test('Receipt duplicate completion cannot add stock twice', async () => ({ pass: await stock() === 13, actualStock: await stock(), expectedStock: 13 }))
await check('Supplier with receipts cannot delete', 'DELETE', `/api/admin/suppliers/${supplier.id}`, undefined, [409])
const program = await check('Promotion create', 'POST', '/api/admin/promotions', { name: `QA promo ${suffix}`, startDate: '2026-01-01T00:00:00', endDate: '2027-12-31T23:59:59', status: 'ACTIVE' }, [201])
await check('Promotion detail', 'GET', `/api/admin/promotions/${program.id}/detail`)
const voucher = await check('Voucher create', 'POST', `/api/admin/promotions/${program.id}/vouchers`, { code: `QA${suffix}`, discountPercent: 10, minimumAmount: 0, maximumDiscount: 50000, quantity: 10, startDate: '2026-01-01T00:00:00', endDate: '2027-12-31T23:59:59', status: 'ACTIVE' }, [201])
await check('Voucher valid calculation', 'POST', '/api/vouchers/validate', { code: voucher.code, subtotal: 100000 }, [200], d => Number(d.discountAmount) === 10000)
await check('Voucher invalid code', 'POST', '/api/vouchers/validate', { code: 'DOES-NOT-EXIST-QA', subtotal: 100000 }, [400])
const future = await check('Future voucher create', 'POST', `/api/admin/promotions/${program.id}/vouchers`, { code: `QAFUT${suffix}`, discountPercent: 10, minimumAmount: 0, maximumDiscount: 50000, quantity: 10, startDate: '2030-01-01T00:00:00', endDate: '2030-12-31T23:59:59', status: 'ACTIVE' }, [201])
await check('Future voucher must be rejected', 'POST', '/api/vouchers/validate', { code: future.code, subtotal: 100000 }, [400])
await check('Future voucher must not appear as active', 'GET', '/api/vouchers/active', undefined, [200], d => !d.some(v => v.code === future.code))
const orderBody = { customerId: user.customerId, userId: user.userId, fullName: 'QA Recipient', phone: '0901234567', address: 'QA Shipping', city: 'QA City', items: [{ productId: pid, quantity: 1, unitPrice: 100000 }] }
await check('Order empty cart rejected', 'POST', '/api/orders', { ...orderBody, items: [] }, [400])
const order = await check('Order create normal', 'POST', '/api/orders', orderBody, [200], d => Number(d.totalAmount) === 135000)
await check('Order read detail', 'GET', `/api/orders/${order.orderId}`)
await check('Order list customer', 'GET', `/api/orders?customerId=${user.customerId}`)
const beforeCancel = await stock()
await check('Order admin cancel', 'PUT', `/api/admin/orders/${order.orderId}/cancel`, { reason: 'QA cancel' })
await test('Cancel cannot create extra inventory', async () => ({ pass: await stock() === beforeCancel, actualStock: await stock(), expectedStock: beforeCancel, beforeCreateStock: 13 }))
await check('Order cancel twice blocked', 'PUT', `/api/admin/orders/${order.orderId}/cancel`, { reason: 'QA twice' }, [400, 409])
const flowOrder = await check('Order for confirm and complete', 'POST', '/api/orders', orderBody)
await check('Order complete pending blocked', 'PUT', `/api/admin/orders/${flowOrder.orderId}/complete`, undefined, [400, 409])
await check('Order confirm', 'PUT', `/api/admin/orders/${flowOrder.orderId}/confirm`, { staffId })
await check('Order confirm twice blocked', 'PUT', `/api/admin/orders/${flowOrder.orderId}/confirm`, { staffId }, [400, 409])
await check('Order complete confirmed', 'PUT', `/api/admin/orders/${flowOrder.orderId}/complete`)
await check('Order cancel completed blocked', 'PUT', `/api/admin/orders/${flowOrder.orderId}/cancel`, { reason: 'QA' }, [400, 409])
const cheap = await check('SECURITY order total cannot be overridden to 1', 'POST', '/api/orders', { ...orderBody, totalAmount: 1 }, [400, 422], d => d.orderId === undefined)
await check('SECURITY order product unit price cannot be zero', 'POST', '/api/orders', { ...orderBody, items: [{ productId: pid, quantity: 1, unitPrice: 0 }] }, [400, 422])
await check('Order only zero quantity must reject', 'POST', '/api/orders', { ...orderBody, items: [{ productId: pid, quantity: 0, unitPrice: 100000 }] }, [400, 422])
await check('Order exceeds inventory must reject', 'POST', '/api/orders', { ...orderBody, items: [{ productId: pid, quantity: 999999, unitPrice: 100000 }] }, [400, 409, 422])
await check('Order unknown product should return client error', 'POST', '/api/orders', { ...orderBody, items: [{ productId: 99999999, quantity: 1, unitPrice: 100000 }] }, [400, 404, 422])
await check('Order cannot apply arbitrary discount', 'POST', '/api/orders', { ...orderBody, discountAmount: 9999999 }, [400, 422])
const used = async () => Number((await sql('SELECT used_quantity FROM vouchers WHERE id=$1', [voucher.id]))[0].used_quantity)
const vo = await check('Order with voucher', 'POST', '/api/orders', { ...orderBody, voucherId: voucher.id, discountAmount: 10000, totalAmount: 125000 })
const usedBefore = await used()
await check('Order customer cancel', 'POST', `/api/orders/${vo.orderId}/cancel`)
await test('Customer cancellation releases voucher use', async () => ({ pass: await used() === usedBefore - 1, actualUsed: await used(), expectedUsed: usedBefore - 1 }))
await check('Invoice preview', 'POST', '/api/admin/invoices/preview-calculation', { orderId: flowOrder.orderId, includeVat: false })
const invoice = await check('Invoice create', 'POST', '/api/admin/invoices', { orderId: flowOrder.orderId, paymentMethod: 'CASH', includeVat: false, staffId }, [201])
if (invoice?.id) {
  await check('Invoice detail', 'GET', `/api/admin/invoices/${invoice.id}`)
  await check('Invoice PDF download', 'GET', `/api/admin/invoices/${invoice.id}/pdf`, undefined, [200], d => typeof d === 'string' && d.startsWith('%PDF'))
  await check('Invoice duplicate rejected', 'POST', '/api/admin/invoices', { orderId: flowOrder.orderId, paymentMethod: 'CASH', includeVat: false, staffId }, [409, 400])
  await test('Invoice retains shipping fee', async () => ({ pass: Number(invoice.finalAmount) === 135000, orderTotal: 135000, invoiceTotal: invoice.finalAmount }))
}
await check('Invoice negative VAT must reject', 'POST', '/api/admin/invoices/preview-calculation', { orderId: flowOrder.orderId, includeVat: true, vatPercent: -10 }, [400, 422])
const staff = await check('Staff create', 'POST', '/api/admin/staff', { username: `qastaff${suffix}`, password, fullName: 'QA Staff', email: `qastaff${suffix}@example.test`, phone: '0901234567', address: 'QA' }, [201])
await check('Staff update', 'PUT', `/api/admin/staff/${staff.id}`, { fullName: 'QA Staff updated', email: `qastaff${suffix}@example.test`, phone: '0901234567', address: 'QA' })
await check('Staff toggle inactive', 'PUT', `/api/admin/staff/${staff.id}/toggle-status`)
await check('Inactive staff login blocked', 'POST', '/api/auth/login', { username: `qastaff${suffix}`, password }, [403])
const admin = await check('User create ADMIN', 'POST', '/api/admin/users', { username: `qaadmin${suffix}`, password, role: 'ADMIN' }, [201])
await check('SECURITY anonymous reset admin password denied', 'PUT', `/api/admin/users/${admin.id}/reset-password`, { newPassword: 'ResetQA123!' }, [401, 403])
await check('User deactivate', 'PUT', `/api/admin/users/${admin.id}/toggle-status`)
await check('Customer detail admin', 'GET', `/api/admin/customers/${user.customerId}`)
await check('Customer update admin', 'PUT', `/api/admin/customers/${user.customerId}`, { fullName: 'QA Admin edited', email: user.email, phone: '0901234567', address: 'QA' })
for (const mod of ['users', 'customers', 'staff', 'products', 'orders', 'invoices']) {
  await check(`Pagination ${mod} size zero handled`, 'GET', `/api/admin/${mod}?size=0`, undefined, [200, 400])
  await check(`Pagination ${mod} negative page handled`, 'GET', `/api/admin/${mod}?page=-1`, undefined, [200, 400])
}
fs.writeFileSync(new URL('../artifacts/fixtures.json', import.meta.url), JSON.stringify({ user, password, category, product, supplier, receipt, staff, program, voucher, order: flowOrder, invoice }, null, 2))
console.log(JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length }))
