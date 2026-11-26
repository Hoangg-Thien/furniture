import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { createOrder, previewOrder, fetchOrders, fetchOrderById, cancelOrderApi, getOrderUrl } from '../src/lib/orders.js'
import { getCurrentUser, loginCustomer, setCurrentUser } from '../src/lib/auth.js'
import { clearLegacyBrowserData } from '../src/lib/browserStorage.js'
import { loadProducts } from '../src/lib/products.js'
import { splitSavedAddress } from '../src/user/lib/vietnamLocations.js'
import { getApiBaseUrl } from '../src/lib/apiConfig.js'

const originalFetch = globalThis.fetch
test('blocked browser storage still uses the configured backend', () => {
  globalThis.window = {}
  sessionStorage.getItem = () => { throw new Error('blocked') }
  try { assert.equal(getApiBaseUrl(), 'http://localhost:8080') }
  finally { delete globalThis.window }
})
test('checkout preview uses server totals and supports cancellation and server errors', async () => {
  const controller = new AbortController()
  const quote = { items: [{ productId: 1, quantity: 1, unitPrice: 100000 }], subtotal: 100000, discountAmount: 20000, shippingFee: 35000, totalAmount: 115000, discountLabel: 'Best offer' }
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'http://localhost:8080/api/orders/preview')
    assert.equal(init.signal, controller.signal)
    assert.deepEqual(JSON.parse(init.body), { items: [{ productId: 1, quantity: 1 }], voucherId: null })
    return { ok: true, json: async () => quote }
  }
  assert.deepEqual(await previewOrder([{ productId: 1, quantity: 1 }], null, controller.signal), quote)
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Sold out' }) })
  await assert.rejects(previewOrder([], null), /Sold out/)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...quote, totalAmount: null }) })
  await assert.rejects(previewOrder([], null), /báo giá không hợp lệ/)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...quote, discountAmount: quote.subtotal + 1 }) })
  await assert.rejects(previewOrder([], null), /báo giá không hợp lệ/)
})
beforeEach(() => {
  function storage() {
    return Object.defineProperties({}, {
      getItem: { value(key) { return this[key] ?? null }, writable: true },
      setItem: { value(key, value) { this[key] = String(value) } },
      removeItem: { value(key) { delete this[key] } },
    })
  }
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()
})
afterEach(() => {
  globalThis.fetch = originalFetch
  delete globalThis.localStorage
  delete globalThis.sessionStorage
})

test('explicit product offer choice reaches preview and placement; invalid line discounts are rejected', async () => {
  const items = [{ productId: 1, quantity: 1 }]
  const quote = { items: [{ ...items[0], unitPrice: 100000 }], subtotal: 100000, discountAmount: 50000, shippingFee: 35000, totalAmount: 85000 }
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    assert.equal(body.preferProductDiscounts, true)
    assert.deepEqual(body.items, items)
    return { ok: true, json: async () => url.endsWith('/preview') ? quote : { orderId: 1 } }
  }
  assert.equal((await previewOrder(items, null, undefined, true)).discountAmount, 50000)
  assert.equal((await createOrder({ items, preferProductDiscounts: true })).order.orderId, 1)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...quote, itemDiscounts: [{ productId: 1, originalAmount: 100000, discountAmount: 200000, finalAmount: 0, label: 'Bad' }] }) })
  await assert.rejects(previewOrder(items, null), /giảm giá sản phẩm không hợp lệ/)
})

test('legacy browser data is discarded and account carts are retained', () => {
  for (const key of ['furniture_customer_user', 'furniture_admin_user', 'furniture_logged_in_user', 'furniture_cart',
    'furniture_cart_expires_at', 'furniture_cached_products', 'furniture_custom_api_url', 'funi_last_order',
    'nep_last_order', 'funi_orders_history', 'nep_orders_history', 'funi_admin_active_module', 'funi_notifications_customer_4']) {
    localStorage.setItem(key, 'old')
  }
  localStorage.setItem('furniture_cart:4', 'account cart')
  localStorage.setItem('unrelated', 'keep')
  sessionStorage.setItem('furniture_checkout_guest', 'old checkout')
  sessionStorage.setItem('furniture_checkout_4', 'old checkout')
  assert.equal(getCurrentUser(), null)
  clearLegacyBrowserData()
  assert.deepEqual(Object.keys(localStorage), ['furniture_cart:4', 'unrelated'])
  assert.deepEqual(Object.keys(sessionStorage), [])
})

test('a customer session exists only in the current tab and logout clears notification state', () => {
  const user = { userId: 12, customerId: 4, role: 'CUSTOMER' }
  setCurrentUser(user)
  assert.deepEqual(getCurrentUser(), user)
  assert.equal(localStorage.getItem('furniture_customer_user'), null)
  sessionStorage.setItem('funi_notifications_customer_4', '[]')
  setCurrentUser(null)
  assert.deepEqual(Object.keys(sessionStorage), [])
})

test('closing login before its response cannot save an old session', async () => {
  const controller = new AbortController()
  globalThis.fetch = async () => ({ ok: true, json: async () => {
    controller.abort()
    return { role: 'CUSTOMER', customerId: 4 }
  } })
  await loginCustomer('test', 'secret', controller.signal)
  assert.equal(getCurrentUser(), null)
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
})

test('order history never restores legacy orders, even when the server is offline', async () => {
  localStorage.setItem('funi_orders_history', JSON.stringify([{ id: 42, customerId: 4 }]))
  globalThis.fetch = async (url) => {
    assert.match(url, /\?customerId=4$/)
    return { ok: true, json: async () => [] }
  }
  assert.deepEqual(await fetchOrders(4), { orders: [], error: null })
  globalThis.fetch = async () => { throw new Error('offline') }
  const result = await fetchOrders(4)
  assert.deepEqual(result.orders, [])
  assert.ok(result.error)
})

test('cancellation reports the server result without keeping a local order copy', async () => {
  globalThis.fetch = async () => { throw new Error('offline') }
  assert.equal((await cancelOrderApi(42)).success, false)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) })
  assert.equal((await cancelOrderApi('FUNI-2026-000042')).success, true)
  assert.deepEqual(Object.keys(localStorage), [])
})

test('an empty product catalog does not show cached or demo products', async () => {
  localStorage.setItem('furniture_cached_products', JSON.stringify([{ id: 42 }]))
  globalThis.fetch = async () => ({ ok: true, json: async () => [] })
  assert.deepEqual(await loadProducts(), { products: [], error: null })
  assert.equal(localStorage.getItem('furniture_cached_products'), '[{"id":42}]')
})

test('catalog carries live inventory, including sold-out products', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => [
    { id: 1, name: 'Sofa', price: 100, quantity: 2, discountPercent: 50, discountedPrice: 50, soldQuantity: 15, bestSeller: true },
    { id: 2, name: 'Chair', price: 100, quantity: 0 },
    { id: 3, name: 'Unknown', price: 100 },
  ] })
  const result = await loadProducts()
  assert.equal(result.error, null)
  assert.deepEqual(result.products.map(product => product.quantity), [2, 0, null])
  assert.equal(result.products[0].price, 100)
  assert.equal(result.products[0].discountPercent, 50)
  assert.equal(result.products[0].discountedPrice, 50)
  assert.equal(result.products[0].soldQuantity, 15)
  assert.equal(result.products[0].bestSeller, true)
  assert.equal(result.products[1].soldQuantity, null)
  assert.equal(result.products[1].bestSeller, false)
})

test('an offline catalog does not pass old cached inventory off as current', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => [
    { id: 42, name: 'Sofa', quantity: 99, discountPercent: 50, discountedPrice: 50, soldQuantity: 15, bestSeller: true },
  ] })
  await loadProducts()
  assert.deepEqual(Object.keys(localStorage), [])
  globalThis.fetch = async () => { throw new Error('offline') }
  const result = await loadProducts()
  assert.ok(result.error)
  assert.equal(result.products[0].quantity, null)
  assert.equal(result.products[0].discountPercent, null)
  assert.equal(result.products[0].discountedPrice, null)
  assert.equal(result.products[0].soldQuantity, null)
  assert.equal(result.products[0].bestSeller, false)
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
