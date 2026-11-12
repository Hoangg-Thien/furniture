import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { isCheckoutPath, loadCheckoutDraft, saveCheckoutDraft, clearCheckoutDraft, voucherDiscount, suggestedVoucher } from '../src/user/lib/checkout.js'

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

test('voucher suggestion shows actual savings instead of the cap and chooses the biggest saving', () => {
  const sale = { code: 'SALE74', discount_percent: 50, minimum_amount: 0, maximum_discount: 1000000 }
  const smaller = { code: 'OTHER', discount_percent: 10, minimum_amount: 0, maximum_discount: 2000000 }
  const branded = { code: 'FUNI500K', discount_percent: 10, minimum_amount: 5000000, maximum_discount: 500000 }
  assert.equal(voucherDiscount(sale, 1200000), 600000)
  assert.equal(voucherDiscount(sale, 5000000), 1000000)
  assert.equal(voucherDiscount(branded, 1200000), 0)
  assert.equal(suggestedVoucher([smaller, sale], 1200000).code, 'SALE74')
  assert.equal(suggestedVoucher([branded, sale], 5000000).code, 'SALE74')
  assert.equal(voucherDiscount({ ...sale, maximum_discount: null }, 1200000), 600000)
  assert.equal(voucherDiscount({ ...sale, maximum_discount: 0 }, 1200000), 600000)
  assert.equal(suggestedVoucher([], 1200000), null)
  assert.equal(suggestedVoucher(null, 1200000), null)
  assert.equal(suggestedVoucher([branded, { ...sale, minimum_amount: 2000000 }], 1000000).code, 'SALE74')
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

test('guest draft survives refresh separately from account drafts and clears after success', () => {
  saveCheckoutDraft(null, { form: { fullName: 'Guest', phone: '0901234567' }, step: 2, useDefaultAccountInfo: false })
  saveCheckoutDraft(4, { form: { fullName: 'Account' }, step: 1 })
  assert.equal(loadCheckoutDraft(undefined).form.fullName, 'Guest')
  assert.equal(loadCheckoutDraft(null).step, 2)
  clearCheckoutDraft(null)
  assert.equal(loadCheckoutDraft(null), null)
  assert.equal(loadCheckoutDraft(4).form.fullName, 'Account')
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
