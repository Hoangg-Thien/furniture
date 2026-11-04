import assert from 'node:assert/strict'
import fs from 'node:fs'

async function sql(query, params = []) {
  const response = await fetch('http://127.0.0.1:15433', {
    method: 'POST', body: JSON.stringify({ sql: query, params }),
  })
  const result = await response.json()
  assert.equal(response.status, 200, JSON.stringify(result))
  return result
}

async function api(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`http://127.0.0.1:18080/api${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`)
  return result
}

const [customer] = await sql('SELECT id, address FROM public.customers ORDER BY id LIMIT 1')
const [staff] = await sql('SELECT id FROM public.staff ORDER BY id LIMIT 1')
const [product] = await sql('SELECT id FROM public.products ORDER BY id LIMIT 1')
const destination = '123 Lê Lợi, Đà Nẵng'
try {
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', [destination, customer.id])
  const created = await api('/orders', 'POST', {
    customerId: customer.id, fullName: 'QA shipping', phone: '0901234567', address: '123 Lê Lợi', city: 'Đà Nẵng',
    totalAmount: 100000, items: [{ productId: product.id, quantity: 1, unitPrice: 100000 }],
  })
  const order = { id: created.orderId }
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', ['Hà Nội', customer.id])
  await api(`/admin/orders/${order.id}/ship`, 'PUT', undefined, 409)
  await api(`/admin/orders/${order.id}/complete`, 'PUT', undefined, 409)
  await api(`/admin/orders/${order.id}/confirm`, 'PUT', { staffId: staff.id })
  const approved = await api(`/orders/${order.id}`)
  assert.ok(Number.isFinite(Date.parse(approved.order.approved_at)))
  assert.equal(approved.order.address, destination)
  await api(`/admin/orders/${order.id}/confirm`, 'PUT', { staffId: staff.id }, 409)
  await api(`/admin/orders/${order.id}/complete`, 'PUT', undefined, 409)
  const before = await api('/admin/orders/counts')
  await api(`/admin/orders/${order.id}/ship`, 'PUT')
  await api(`/admin/orders/${order.id}/ship`, 'PUT', undefined, 409)
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', ['Hà Nội', customer.id])
  const shipping = await api(`/orders/${order.id}`)
  assert.equal(shipping.order.status, 'SHIPPING')
  assert.equal(shipping.order.approved_at, approved.order.approved_at)
  assert.equal(shipping.order.address, destination)
  assert.equal(shipping.items.length, 1)
  const history = await api(`/orders?customerId=${customer.id}`)
  assert.equal(history.find(item => item.id === order.id).approved_at, approved.order.approved_at)
  const after = await api('/admin/orders/counts')
  assert.equal(after.shipping, before.shipping + 1)
  assert.equal((await api('/admin/orders?status=SHIPPING')).content.some(item => item.id === order.id), true)
  const migration = fs.readFileSync(new URL('../../backend/src/main/resources/order_shipping.sql', import.meta.url), 'utf8')
  for (const statement of migration.split(';').filter(statement => statement.trim())) await sql(statement)
  assert.equal((await api(`/orders/${order.id}`)).order.approved_at, approved.order.approved_at)
  await api(`/admin/orders/${order.id}/complete`, 'PUT')
  assert.equal((await api(`/orders/${order.id}`)).order.status, 'COMPLETED')
  await api(`/admin/orders/${order.id}/ship`, 'PUT', undefined, 409)
  console.log('PASS shipping API: migration, guarded transitions, approval timestamp, frozen address, list/detail, counts, completion')
} finally {
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', [customer.address, customer.id])
}
