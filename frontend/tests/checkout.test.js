import assert from 'node:assert/strict'
import { beforeEach, afterEach, test } from 'node:test'
import { isCheckoutPath, loadCheckoutDraft, saveCheckoutDraft, clearCheckoutDraft, voucherDiscount, suggestedVoucher, findBestEligibleVoucher } from '../src/user/lib/checkout.js'

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
  for (const voucher_type of ['PRODUCT', 'VIP']) {
    assert.equal(suggestedVoucher([{ ...sale, voucher_type }], 1200000), null)
    assert.equal(suggestedVoucher([{ ...sale, voucher_type }, smaller], 1200000).code, 'OTHER')
  }
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

test('findBestEligibleVoucher selects the best deal for order subtotal and ignores ineligible ones', () => {
  const sale = { id: 1, code: 'SALE10', discount_percent: 10, minimum_amount: 1000000, maximum_discount: 500000 }
  const big = { id: 2, code: 'BIG20', discount_percent: 20, minimum_amount: 2000000, maximum_discount: 1000000 }
  const huge = { id: 3, code: 'HUGE30', discount_percent: 30, minimum_amount: 5000000, maximum_discount: 2000000 }
  const vip = { id: 4, code: 'VIP50', discount_percent: 50, minimum_amount: 0, voucher_type: 'VIP' }

  // Subtotal 1.500.000: only SALE10 is eligible
  assert.equal(findBestEligibleVoucher([sale, big, huge, vip], 1500000)?.code, 'SALE10')
  // Subtotal 3.000.000: both SALE10 and BIG20 eligible, BIG20 gives bigger discount
  assert.equal(findBestEligibleVoucher([sale, big, huge, vip], 3000000)?.code, 'BIG20')
  // Subtotal 500.000: none eligible
  assert.equal(findBestEligibleVoucher([sale, big, huge, vip], 500000), null)
})

test('voucher discount calculates on net subtotal after product discount (Tier 1 + Tier 2 combination)', () => {
  // Sản phẩm A: 10tr giảm 50% còn 5tr. Sản phẩm B: 20tr. Tổng sau Tầng 1 = 25tr.
  const productA_original = 10000000
  const productA_discount = 5000000 // 50%
  const productB_price = 20000000
  const netSubtotal = (productA_original - productA_discount) + productB_price // 25.000.000
  assert.equal(netSubtotal, 25000000)

  // Voucher đơn hàng giảm 5% cho toàn đơn hàng
  const orderVoucher5Percent = { code: 'ORDER5', discount_percent: 5, minimum_amount: 0, maximum_discount: 0, voucher_type: 'ORDER' }
  const discountTier2 = voucherDiscount(orderVoucher5Percent, netSubtotal)
  assert.equal(discountTier2, 1250000) // 5% của 25tr = 1.250.000đ

  // Tổng thanh toán: 25tr - 1.25tr = 23.750.000đ
  const finalTotal = netSubtotal - discountTier2
  assert.equal(finalTotal, 23750000)
})
