import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { loadCart, saveCart } from '../src/lib/cart.js'

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
