import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { isCheckoutPath, loadCheckoutDraft, saveCheckoutDraft, clearCheckoutDraft } from '../src/lib/checkout.js'

beforeEach(() => {
  const values = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
})
afterEach(() => { delete globalThis.sessionStorage })

test('checkout URL is recognized on refresh and browser navigation', () => {
  assert.equal(isCheckoutPath('/checkout'), true)
  assert.equal(isCheckoutPath('/checkout/'), true)
  assert.equal(isCheckoutPath('/'), false)
  assert.equal(isCheckoutPath('/checkout-invalid'), false)
})

test('shipping details and confirmation step survive reloading the draft', () => {
  const draft = {
    form: { fullName: 'Nguyễn An', phone: '0901234567', address: '123 Nguyễn Huệ', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé' },
    step: 2,
    useDefaultAccountInfo: false,
  }
  saveCheckoutDraft(4, draft)
  assert.deepEqual(loadCheckoutDraft(4), draft)
  assert.equal(loadCheckoutDraft(5), null)
  assert.equal(loadCheckoutDraft(null), null)
})

test('successful checkout clears the draft without affecting another customer', () => {
  saveCheckoutDraft(4, { form: { fullName: 'An' }, step: 1 })
  saveCheckoutDraft(5, { form: { fullName: 'Bình' }, step: 1 })
  clearCheckoutDraft(4)
  assert.equal(loadCheckoutDraft(4), null)
  assert.equal(loadCheckoutDraft(5).form.fullName, 'Bình')
})

test('invalid drafts cannot restore success or overwrite shipping fields with objects', () => {
  sessionStorage.setItem('furniture_checkout_4', '{invalid')
  assert.equal(loadCheckoutDraft(4), null)
  saveCheckoutDraft(4, { form: { fullName: {}, phone: '0901234567', total: 1 }, step: 3 })
  assert.deepEqual(loadCheckoutDraft(4), { form: { phone: '0901234567' }, step: 1, useDefaultAccountInfo: false })
})

test('blocked browser storage does not crash checkout', () => {
  globalThis.sessionStorage = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
    removeItem: () => { throw new Error('blocked') },
  }
  assert.equal(loadCheckoutDraft(4), null)
  assert.doesNotThrow(() => saveCheckoutDraft(4, { form: {}, step: 1 }))
  assert.doesNotThrow(() => clearCheckoutDraft(4))
})
