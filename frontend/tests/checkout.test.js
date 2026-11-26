import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCheckoutPath, voucherDiscount, suggestedVoucher, findBestEligibleVoucher } from '../src/user/lib/checkout.js'

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
