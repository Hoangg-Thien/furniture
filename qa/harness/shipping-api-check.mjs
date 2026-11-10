import { adminApiHeaders } from './admin-auth.mjs'
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
    method, headers: { 'Content-Type': 'application/json', ...await adminApiHeaders() }, body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`)
  return result
}

const [customer] = await sql('SELECT id, address FROM public.customers ORDER BY id LIMIT 1')
const [staff] = await sql('SELECT id FROM public.staff ORDER BY id LIMIT 1')
const [product] = await sql('SELECT id FROM public.products ORDER BY id LIMIT 1')
const destination = '123 Lê Lợi, Hải Châu, Đà Nẵng'
try {
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', [destination, customer.id])
  const created = await api('/orders', 'POST', {
    customerId: customer.id, fullName: 'QA shipping', phone: '0901234567', address: '123 Lê Lợi', district: 'Hải Châu', city: 'Đà Nẵng',
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
  // A failed invoice insert must roll back delivery completion as well.
  await sql(`ALTER TABLE public.invoices ADD CONSTRAINT qa_reject_invoice CHECK (order_id <> ${Number(order.id)}) NOT VALID`)
  try {
    await api(`/admin/orders/${order.id}/complete`, 'PUT', undefined, 500)
    assert.equal((await api(`/orders/${order.id}`)).order.status, 'SHIPPING')
    assert.equal((await sql('SELECT id FROM public.invoices WHERE order_id = $1', [order.id])).length, 0)
  } finally {
    await sql('ALTER TABLE public.invoices DROP CONSTRAINT qa_reject_invoice')
  }
  await api(`/admin/orders/${order.id}/complete`, 'PUT')
  const [invoice] = await sql('SELECT * FROM public.invoices WHERE order_id = $1', [order.id])
  assert.ok(invoice)
  assert.equal(Number(invoice.final_amount), Number(created.totalAmount))
  assert.equal(invoice.payment_status, 'PAID')
  assert.equal(invoice.payment_method, 'CASH')
  await api(`/admin/orders/${order.id}/complete`, 'PUT', undefined, 409)
  assert.equal((await sql('SELECT id FROM public.invoices WHERE order_id = $1', [order.id])).length, 1)
  // Recover a historical completed order without reapplying its expired voucher.
  const historical = await api('/orders', 'POST', {
    customerId: customer.id, fullName: 'QA invoice', phone: '0901234567', address: '123 Le Loi', district: 'Quận 1', city: 'HCM',
    totalAmount: 100000, items: [{ productId: product.id, quantity: 1, unitPrice: 100000 }],
  })
  await api('/admin/invoices', 'POST', { orderId: historical.orderId, paymentMethod: 'CASH' }, 400)
  const [voucher] = await sql('SELECT id, code, used_quantity FROM public.vouchers ORDER BY id LIMIT 1')
  await sql("UPDATE public.orders SET status = 'COMPLETED', staff_id = $2, total_amount = 90000, discount_amount = 10000, voucher_id = $3 WHERE id = $1", [historical.orderId, staff.id, voucher.id])
  await sql("UPDATE public.vouchers SET end_date = CURRENT_TIMESTAMP - INTERVAL '1 day' WHERE id = $1", [voucher.id])
  for (const paymentMethod of ['BANK_TRANSFER', 'CREDIT_CARD', 'VNPAY', 'MOMO']) {
    await api('/admin/invoices', 'POST', { orderId: historical.orderId, paymentMethod, voucherCode: voucher.code, includeVat: false }, 400)
  }
  assert.equal((await sql('SELECT id FROM public.invoices WHERE order_id = $1', [historical.orderId])).length, 0)
  const recovered = await api('/admin/invoices', 'POST', { orderId: historical.orderId, paymentMethod: 'CASH', voucherCode: voucher.code, includeVat: false }, 201)
  assert.equal(recovered.qrCodeUrl, null)
  assert.equal(Number(recovered.finalAmount), 90000)
  assert.equal(Number(recovered.discountAmount), 10000)
  assert.equal(Number(recovered.voucherDiscount), 0)
  const [unchangedVoucher] = await sql('SELECT used_quantity FROM public.vouchers WHERE id = $1', [voucher.id])
  assert.equal(unchangedVoucher.used_quantity, voucher.used_quantity)
  await api('/admin/invoices', 'POST', { orderId: historical.orderId, paymentMethod: 'CASH', voucherCode: voucher.code }, 400)
  const totals = await api('/admin/invoices/counts')
  const overview = await api('/admin/statistics/overview?fromDate=2000-01-01&toDate=2100-01-01')
  const [paid] = await sql("SELECT COALESCE(SUM(final_amount), 0) AS total FROM public.invoices WHERE payment_status = 'PAID'")
  assert.equal(Number(totals.totalRevenue), Number(paid.total))
  assert.equal(Number(overview.totalRevenue), Number(paid.total))
  assert.equal((await api(`/orders/${order.id}`)).order.status, 'COMPLETED')
  await api(`/admin/orders/${order.id}/ship`, 'PUT', undefined, 409)
  console.log('PASS shipping API: migration, guarded transitions, approval timestamp, frozen address, list/detail, counts, completion, atomic COD invoice, duplicate protection, historical recovery, expired voucher, paid revenue')
} finally {
  await sql('UPDATE public.customers SET address = $1 WHERE id = $2', [customer.address, customer.id])
}
