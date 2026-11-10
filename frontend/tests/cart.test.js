import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { loadCart, saveCart, loadCartExpiresAt, CART_TIMEOUT_MS, getProductStock, limitCartToStock } from '../src/user/lib/cart.js'

beforeEach(() => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
afterEach(() => { delete globalThis.localStorage })

test('cart expires exactly at the configured deadline and cannot reappear on reload', t => {
  t.mock.method(Date, 'now', () => 1000000)
  saveCart({ 1: 2 })
  const expiresAt = loadCartExpiresAt()
  assert.equal(expiresAt, Date.now() + CART_TIMEOUT_MS)
  Date.now.mock.mockImplementation(() => expiresAt - 1)
  assert.deepEqual(loadCart(), { 1: 2 })
  assert.equal(loadCartExpiresAt(), expiresAt, 'Reading does not extend the deadline')
  Date.now.mock.mockImplementation(() => expiresAt)
  assert.deepEqual(loadCart(), {})
  assert.deepEqual(JSON.parse(localStorage.getItem('furniture_cart')).items, {})
  assert.equal(loadCartExpiresAt(), 0)
  assert.deepEqual(loadCart(), {})
})

test('user changes renew the deadline, while stock synchronization preserves it', t => {
  t.mock.method(Date, 'now', () => 1000000)
  saveCart({ 1: 2 })
  const originalDeadline = loadCartExpiresAt()
  Date.now.mock.mockImplementation(() => 1000000 + Math.floor(CART_TIMEOUT_MS / 2))
  saveCart({ 1: 1 }, originalDeadline)
  assert.equal(loadCartExpiresAt(), originalDeadline)
  saveCart({ 1: 2 })
  assert.equal(loadCartExpiresAt(), Date.now() + CART_TIMEOUT_MS)
  assert.ok(loadCartExpiresAt() > originalDeadline)
})

test('reducing the timeout keeps an existing cart and caps its old deadline once', t => {
  t.mock.method(Date, 'now', () => 1000000)
  localStorage.setItem('furniture_cart', '{"1":2}')
  localStorage.setItem('furniture_cart_expires_at', String(Date.now() + 30 * 60 * 1000))
  assert.deepEqual(loadCart(), { 1: 2 })
  const deadline = loadCartExpiresAt()
  assert.equal(deadline, Date.now() + CART_TIMEOUT_MS)
  Date.now.mock.mockImplementation(() => 1000000 + 1000)
  assert.deepEqual(loadCart(), { 1: 2 })
  assert.equal(loadCartExpiresAt(), deadline)
})

test('items and their deadline are saved in one atomic storage write', () => {
  const writes = []
  const original = localStorage.setItem
  localStorage.setItem = (key, value) => { writes.push([key, JSON.parse(value)]); original(key, value) }
  const deadline = Date.now() + CART_TIMEOUT_MS
  saveCart({ 1: 2 }, deadline)
  assert.deepEqual(writes, [['furniture_cart', { items: { 1: 2 }, expiresAt: deadline }]])
})

test('legacy carts receive a deadline only once, without losing valid quantities', t => {
  t.mock.method(Date, 'now', () => 1000000)
  localStorage.setItem('furniture_cart', '{"1":2}')
  assert.deepEqual(loadCart(), { 1: 2 })
  const expiresAt = loadCartExpiresAt()
  Date.now.mock.mockImplementation(() => 1000000 + 60 * 1000)
  assert.deepEqual(loadCart(), { 1: 2 })
  assert.equal(loadCartExpiresAt(), expiresAt)
})

test('malformed deadlines cannot keep an abandoned cart alive', () => {
  for (const expiresAt of ['broken', 'Infinity', '-1', '0', '1.5', String(Number.MAX_SAFE_INTEGER)]) {
    localStorage.setItem('furniture_cart', '{"1":2}')
    localStorage.setItem('furniture_cart_expires_at', expiresAt)
    assert.deepEqual(loadCart(), {})
  }
})

test('cart quantities survive reloading from browser storage', () => {
  saveCart({ 1: 2, 6: 3 })
  assert.deepEqual(loadCart(), { 1: 2, 6: 3 })
  saveCart({ 1: 1 })
  assert.deepEqual(loadCart(), { 1: 1 })
})

test('clearing the cart after checkout stays cleared on reload', () => {
  saveCart({ 1: 2 })
  saveCart({})
  assert.deepEqual(loadCart(), {})
})

test('adding, increasing and reordering cannot exceed the available two items', () => {
  const products = [{ id: 1, quantity: 2 }]
  let cart = {}
  for (let i = 0; i < 10; i++) cart = limitCartToStock({ ...cart, 1: (cart[1] || 0) + 1 }, products)
  assert.deepEqual(cart, { 1: 2 })
  assert.deepEqual(limitCartToStock({ 1: cart[1] + 99 }, products), { 1: 2 })
  assert.deepEqual(limitCartToStock({ 1: 1 }, products), { 1: 1 })
  assert.deepEqual(limitCartToStock({ 1: 0 }, products), {})
})

test('saved carts are capped to fresh stock and unavailable products are removed', () => {
  saveCart({ 1: 99, 2: 3, 3: 1, 4: 1 })
  const cart = limitCartToStock(loadCart(), [{ id: 1, quantity: 2 }, { id: 2, quantity: 0 }, { id: 3, quantity: 5 }])
  assert.deepEqual(cart, { 1: 2, 3: 1 })
  assert.equal(limitCartToStock(cart, [{ id: 1, quantity: 2 }, { id: 3, quantity: 5 }]), cart)
  assert.deepEqual(limitCartToStock(cart, [{ id: 1, quantity: 1 }]), { 1: 1 })
})

test('missing or malformed stock never means unlimited availability', () => {
  for (const quantity of [undefined, null, '2', -1, 1.5, Infinity, NaN]) {
    assert.equal(getProductStock({ quantity }), 0)
    assert.deepEqual(limitCartToStock({ 1: 3 }, [{ id: 1, quantity }]), {})
  }
  assert.equal(getProductStock({ quantity: 2 }), 2)
})

test('corrupt storage and invalid cart entries do not break the storefront', () => {
  localStorage.setItem('furniture_cart', '{invalid')
  assert.deepEqual(loadCart(), {})
  localStorage.setItem('furniture_cart', '[1, 2]')
  assert.deepEqual(loadCart(), {})
  saveCart({ 1: 2, 2: -1, 3: '3', 4: 1.5, 5: 0, invalid: 1 })
  assert.deepEqual(loadCart(), { 1: 2 })
})

test('unavailable browser storage does not prevent shopping', () => {
  globalThis.localStorage = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
  }
  assert.deepEqual(loadCart(), {})
  assert.doesNotThrow(() => saveCart({ 1: 2 }))
})

test('a legacy cart remains readable when browser storage rejects writes', () => {
  globalThis.localStorage = {
    getItem: key => key === 'furniture_cart' ? '{"1":2}' : null,
    setItem: () => { throw new Error('full') },
  }
  assert.deepEqual(loadCart(), { 1: 2 })
})
