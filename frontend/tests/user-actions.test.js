import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { createOrder, fetchOrders, fetchOrderById, getLocalOrders, cancelOrderApi, saveOrderToLocalHistory, getOrderUrl } from '../src/lib/orders.js'
import { getCurrentUser } from '../src/lib/auth.js'
import { loadProducts } from '../src/lib/products.js'
import { splitSavedAddress } from '../src/user/lib/vietnamLocations.js'

const originalFetch = globalThis.fetch
beforeEach(() => {
  const values = new Map()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
})
afterEach(() => {
  globalThis.fetch = originalFetch
  delete globalThis.localStorage
})

test('legacy customer session survives repeated reads after migration', () => {
  const user = { userId: 12, customerId: 4, role: 'CUSTOMER' }
  localStorage.setItem('furniture_logged_in_user', JSON.stringify(user))
  assert.deepEqual(getCurrentUser(), user)
  assert.deepEqual(getCurrentUser(), user)
  assert.equal(localStorage.getItem('furniture_logged_in_user'), null)
})

test('storefront rejects an admin session', () => {
  localStorage.setItem('furniture_logged_in_user', JSON.stringify({ role: 'ADMIN' }))
  assert.equal(getCurrentUser(), null)
  assert.equal(localStorage.getItem('furniture_customer_user'), null)
})

test('order history never requests all system orders without a customer', async () => {
  globalThis.fetch = () => assert.fail('Unexpected request for all orders')
  const result = await fetchOrders(null)
  assert.deepEqual(result.orders, [])
  assert.ok(result.error)
})

test('guest creation works without account IDs and retains the server result', async () => {
  const order = { orderId: 42, guestToken: 'secret', totalAmount: 35010 }
  globalThis.fetch = async (url, init) => {
    assert.match(url, /\/api\/orders$/)
    const payload = JSON.parse(init.body)
    assert.equal(payload.customerId, null)
    assert.equal(payload.userId, null)
    assert.equal(payload.fullName, 'Guest')
    return { ok: true, json: async () => order }
  }
  assert.deepEqual(await createOrder({ customerId: null, userId: null, fullName: 'Guest', items: [{ productId: 1, quantity: 1 }] }), { order, error: null })
})

test('guest links keep credentials in the fragment and send them only in the order header', async () => {
  const order = { orderNumber: 'FUNI-2026-000042', guestToken: 'secret' }
  assert.equal(getOrderUrl(order), '/order-success?id=FUNI-2026-000042#token=secret')
  assert.equal(getOrderUrl({ id: 42 }), '/order-success?id=42')
  globalThis.fetch = async (url, init) => {
    assert.doesNotMatch(url, /secret/)
    assert.equal(init.headers['X-Order-Token'], 'secret')
    return { ok: true, json: async () => ({ order: { id: 42 }, items: [] }) }
  }
  assert.equal((await fetchOrderById(order.orderNumber, order.guestToken)).order.id, 42)
  assert.equal((await cancelOrderApi(order.orderNumber, order.guestToken)).success, true)
  assert.deepEqual(getLocalOrders(null), [])
})

test('an empty server history stays empty instead of resurrecting cached orders', async () => {
  saveOrderToLocalHistory({ id: 42, customerId: 4 })
  globalThis.fetch = async (url) => {
    assert.match(url, /\?customerId=4$/)
    return { ok: true, json: async () => [] }
  }
  assert.deepEqual(await fetchOrders(4), { orders: [], error: null })
})

test('offline history excludes other customers and old orders with unknown owners', async () => {
  localStorage.setItem('funi_orders_history', JSON.stringify([
    { id: 1, customerId: 4 }, { id: 2, customer_id: 5 }, { id: 3 },
  ]))
  globalThis.fetch = async () => { throw new Error('offline') }
  const result = await fetchOrders(4)
  assert.deepEqual(result.orders.map((order) => order.id), [1])
  assert.ok(result.error)
  assert.deepEqual(getLocalOrders(null), [])
})

test('saving history combines both old keys and updates existing orders', () => {
  localStorage.setItem('funi_orders_history', JSON.stringify([{ id: 1, customerId: 4 }]))
  localStorage.setItem('nep_orders_history', JSON.stringify([{ id: 2, customer_id: 4 }]))
  saveOrderToLocalHistory({ orderNumber: 'FUNI-2026-000001', customerId: 4, status: 'CONFIRMED' })
  const orders = getLocalOrders(4)
  assert.equal(orders.length, 2)
  assert.equal(orders[0].status, 'CONFIRMED')
  assert.equal(localStorage.getItem('funi_orders_history'), localStorage.getItem('nep_orders_history'))
})

test('a corrupt history key does not hide valid data in another key', () => {
  localStorage.setItem('funi_orders_history', '{invalid')
  localStorage.setItem('nep_orders_history', JSON.stringify([{ id: 42, customerId: 4 }]))
  assert.equal(getLocalOrders(4).length, 1)
})

test('offline cancellation reports failure and keeps the cached status', async () => {
  saveOrderToLocalHistory({ id: 42, customerId: 4, status: 'PENDING' })
  globalThis.fetch = async () => { throw new Error('offline') }
  const result = await cancelOrderApi(42)
  assert.equal(result.success, false)
  assert.equal(getLocalOrders(4)[0].status, 'PENDING')
})

test('successful cancellation updates history and the last-order snapshot', async () => {
  const order = { id: 42, customerId: 4, status: 'PENDING' }
  saveOrderToLocalHistory(order)
  localStorage.setItem('funi_last_order', JSON.stringify(order))
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) })
  assert.equal((await cancelOrderApi('FUNI-2026-000042')).success, true)
  assert.equal(getLocalOrders(4)[0].status, 'CANCELLED')
  assert.equal(JSON.parse(localStorage.getItem('funi_last_order')).status, 'CANCELLED')
})

test('a server rejection does not change local order status', async () => {
  saveOrderToLocalHistory({ id: 42, customerId: 4, status: 'CONFIRMED' })
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Already processed' }) })
  assert.equal((await cancelOrderApi(42)).success, false)
  assert.equal(getLocalOrders(4)[0].status, 'CONFIRMED')
})

test('an empty product catalog does not show cached or demo products', async () => {
  localStorage.setItem('furniture_cached_products', JSON.stringify([{ id: 42 }]))
  globalThis.fetch = async () => ({ ok: true, json: async () => [] })
  assert.deepEqual(await loadProducts(), { products: [], error: null })
  assert.equal(localStorage.getItem('furniture_cached_products'), '[]')
})

test('saved address separates street from existing administrative selections', () => {
  assert.deepEqual(splitSavedAddress('123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'), {
    address: '123 Nguyễn Huệ', ward: 'Phường Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh',
  })
})

test('editing a street does not duplicate city and district in the address', () => {
  const saved = splitSavedAddress('123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh')
  const edited = ['456 Nguyễn Huệ', saved.ward, saved.district, saved.city].filter(Boolean).join(', ')
  assert.equal(edited, '456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh')
})

test('unknown address text is preserved without assuming a delivery city', () => {
  assert.deepEqual(splitSavedAddress('123 Đường A, Địa chỉ chưa chuẩn hóa'), {
    address: '123 Đường A, Địa chỉ chưa chuẩn hóa', ward: '', district: '', city: '',
  })
})
