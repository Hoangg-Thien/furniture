import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { adminApiHeaders } from './admin-auth.mjs'

const base = 'http://127.0.0.1:18080'
const results = []
async function sql(query, params = []) {
  const response = await fetch('http://127.0.0.1:15433', { method: 'POST', body: JSON.stringify({ sql: query, params }) })
  assert.equal(response.status, 200)
  return response.json()
}
async function api(path, { method = 'GET', body, token, admin = false, status = 200 } = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(admin ? await adminApiHeaders() : token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json()
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`)
  return data
}
async function check(name, run) { await run(); results.push(name); console.log('PASS:', name) }
const suffix = Date.now()
const staff = {}
const tokens = {}
try {
  await check('Anonymous administrative and shared private APIs are denied', async () => {
    for (const path of ['/api/admin/products', '/api/auth/users', '/api/vouchers/admin/all', '/api/orders?customerId=1']) await api(path, { status: 401 })
  })
  await check('Admin assigns each position and login/session returns its actual identity', async () => {
    for (const staffType of ['SALES', 'WAREHOUSE', 'CONTENT']) {
      const username = `perm_${staffType.toLowerCase()}_${suffix}`
      staff[staffType] = await api('/api/admin/staff', { admin: true, method: 'POST', status: 201, body: { username, password: 'QaPass123!', fullName: `QA ${staffType}`, staffType } })
      assert.equal(staff[staffType].staffType, staffType)
      const login = await api('/api/auth/admin/login', { method: 'POST', body: { username, password: 'QaPass123!' } })
      tokens[staffType] = login.accessToken
      assert.equal(login.staffType, staffType)
      const session = await api('/api/auth/admin/session', { token: login.accessToken })
      assert.equal(session.staffId, staff[staffType].id)
      assert.equal(session.staffType, staffType)
    }
    await api('/api/admin/staff', { admin: true, method: 'POST', status: 400, body: { username: `invalid_${suffix}`, password: 'QaPass123!', fullName: 'Invalid', staffType: 'ADMIN' } })
  })
  const categories = await api('/api/admin/categories', { admin: true })
  const product = await api('/api/admin/products', { admin: true, method: 'POST', status: 201, body: { name: `Permission chair ${suffix}`, categoryId: categories[0].id, sellingPrice: 100000, quantity: 5, unit: 'cai', isActive: true } })
  await check('Product writes, prices, stock and administrative modules follow the role matrix', async () => {
    for (const position of Object.keys(tokens)) {
      await api('/api/admin/products', { token: tokens[position] })
      await api(`/api/admin/products/${product.id}`, { token: tokens[position], method: 'PUT', body: { ...product, sellingPrice: 1, quantity: 999 }, status: 403 })
      await api('/api/admin/products', { token: tokens[position], method: 'POST', body: {}, status: 403 })
      for (const path of ['/api/admin/users', '/api/admin/staff', '/api/admin/promotions', '/api/admin/statistics/overview']) await api(path, { token: tokens[position], status: 403 })
    }
    await api('/api/admin/suppliers', { token: tokens.SALES, status: 403 })
    await api('/api/admin/orders', { token: tokens.CONTENT, status: 403 })
    await api('/api/orders?customerId=1', { token: tokens.CONTENT, status: 403 })
    for (const operation of ['confirm', 'cancel', 'ship', 'complete']) await api(`/api/admin/orders/1/${operation}`, { token: tokens.WAREHOUSE, method: 'PUT', body: { staffId: staff.SALES.id }, status: 403 })
    await api('/api/admin/orders', { token: tokens.WAREHOUSE })
    await api('/api/admin/customers', { token: tokens.SALES })
  })
  await check('Content updates only content, including rejection of smuggled fields', async () => {
    await api(`/api/admin/products/${product.id}/content`, { token: tokens.CONTENT, method: 'PUT', body: { name: 'Updated chair', description: 'Updated content' } })
    for (const field of ['sellingPrice', 'quantity', 'categoryId', 'isActive', 'unit']) await api(`/api/admin/products/${product.id}/content`, { token: tokens.CONTENT, method: 'PUT', status: 400, body: { name: 'Forbidden', [field]: 0 } })
    const current = await api(`/api/admin/products/${product.id}`, { admin: true })
    assert.equal(current.name, 'Updated chair')
    assert.equal(current.sellingPrice, 100000)
    assert.equal(current.quantity, 5)
    await api(`/api/admin/products/${product.id}/content`, { token: tokens.SALES, method: 'PUT', body: { name: 'Forbidden' }, status: 403 })
  })
  await check('Warehouse receives stock and cannot impersonate the recorded employee', async () => {
    const supplier = await api('/api/admin/suppliers', { token: tokens.WAREHOUSE, method: 'POST', status: 201, body: { name: `QA warehouse supplier ${suffix}` } })
    const receipt = await api(`/api/admin/suppliers/${supplier.id}/receipts`, { token: tokens.WAREHOUSE, method: 'POST', status: 201, body: { staffId: staff.SALES.id, status: 'COMPLETED', items: [{ productId: product.id, quantity: 2, unitPrice: 50000 }] } })
    const [record] = await sql('SELECT staff_id FROM purchase_receipts WHERE id = $1', [receipt.receiptId])
    assert.equal(record.staff_id, staff.WAREHOUSE.id)
    const current = await api(`/api/admin/products/${product.id}`, { admin: true })
    assert.equal(current.quantity, 7)
    assert.equal(current.sellingPrice, 100000)
    await api(`/api/admin/suppliers/${supplier.id}`, { token: tokens.WAREHOUSE, method: 'DELETE', status: 403 })
  })
  await check('Customer session and order ownership prevent shared API bypasses', async () => {
    const customer = await api('/api/auth/register', { method: 'POST', status: 201, body: { username: `perm_customer_${suffix}`, password: 'QaPass123!', fullName: 'Permission customer' } })
    const other = await api('/api/auth/register', { method: 'POST', status: 201, body: { username: `perm_other_${suffix}`, password: 'QaPass123!', fullName: 'Other customer' } })
    const orderBody = { userId: customer.userId, customerId: customer.customerId, fullName: 'Permission customer', phone: '0901234567', address: '123 QA', items: [{ productId: product.id, quantity: 1, unitPrice: 100000 }] }
    await api('/api/orders', { token: other.accessToken, method: 'POST', body: orderBody, status: 403 })
    const order = await api('/api/orders', { token: customer.accessToken, method: 'POST', body: orderBody })
    await api(`/api/orders/${order.orderId}`, { token: customer.accessToken })
    await api(`/api/orders/${order.orderId}`, { token: other.accessToken, status: 403 })
    await api(`/api/orders/${order.orderId}/cancel`, { token: other.accessToken, method: 'POST', status: 403 })
    await api(`/api/orders?customerId=${customer.customerId}`, { token: other.accessToken, status: 403 })
    await api(`/api/auth/update/${customer.userId}`, { token: other.accessToken, method: 'PUT', body: { fullName: 'Forbidden' }, status: 403 })
    await api('/api/admin/users', { token: customer.accessToken, status: 403 })
    await api(`/api/admin/orders/${order.orderId}/confirm`, { token: tokens.SALES, method: 'PUT', body: { staffId: staff.WAREHOUSE.id } })
    const [record] = await sql('SELECT staff_id FROM orders WHERE id = $1', [order.orderId])
    assert.equal(record.staff_id, staff.SALES.id)
  })
  await check('Changing position and locking accounts affect already-issued tokens', async () => {
    const content = staff.CONTENT
    await api(`/api/admin/staff/${content.id}`, { admin: true, method: 'PUT', body: { fullName: content.fullName, staffType: 'WAREHOUSE' } })
    await api(`/api/admin/products/${product.id}/content`, { token: tokens.CONTENT, method: 'PUT', body: { name: 'Forbidden' }, status: 403 })
    await api('/api/admin/suppliers', { token: tokens.CONTENT })
    await api(`/api/admin/staff/${content.id}/toggle-status`, { admin: true, method: 'PUT' })
    await api('/api/admin/products', { token: tokens.CONTENT, status: 401 })
    await api('/api/auth/admin/logout', { token: tokens.SALES, method: 'POST' })
    await api('/api/admin/products', { token: tokens.SALES, status: 401 })
  })
  await check('Password reset revokes old sessions and allows login with the new password', async () => {
    await api(`/api/admin/users/${staff.WAREHOUSE.userId}/reset-password`, { admin: true, method: 'PUT', body: { newPassword: 'QaReset456!' } })
    await api('/api/admin/products', { token: tokens.WAREHOUSE, status: 401 })
    const login = await api('/api/auth/admin/login', { method: 'POST', body: { username: staff.WAREHOUSE.username, password: 'QaReset456!' } })
    await api('/api/admin/suppliers', { token: login.accessToken })
  })
  await fs.writeFile(new URL('../artifacts/permissions-api-results.json', import.meta.url), JSON.stringify({ passed: results.length, results, database: 'isolated PGlite on 127.0.0.1:15432' }, null, 2))
  console.log(`ALL ${results.length} PERMISSION API CHECKS PASSED`)
} catch (error) { console.error(error); process.exitCode = 1 }
