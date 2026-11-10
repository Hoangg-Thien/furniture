import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { loadCart, saveCart, getProductStock, limitCartToStock } from '../src/user/lib/cart.js'

beforeEach(() => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
afterEach(() => { delete globalThis.localStorage })

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
