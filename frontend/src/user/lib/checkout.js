export function isCheckoutPath(pathname) {
  return pathname.toLowerCase().replace(/\/+$/, '') === '/checkout'
}

export function voucherDiscount(voucher, subtotal) {
  if (subtotal < Number(voucher.minimum_amount || 0)) return 0
  const discount = Math.round(subtotal * Number(voucher.discount_percent || 0) / 100)
  const maximum = Number(voucher.maximum_discount)
  return Math.max(0, Math.min(discount, maximum > 0 ? maximum : subtotal, subtotal))
}

export function findBestEligibleVoucher(vouchers, subtotal) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) return null
  const eligible = vouchers.filter(v => (!v.voucher_type || v.voucher_type === 'ORDER') && Number(v.minimum_amount || 0) <= subtotal)
  if (!eligible.length) return null
  const best = eligible.reduce((prev, v) => voucherDiscount(v, subtotal) > voucherDiscount(prev, subtotal) ? v : prev)
  return voucherDiscount(best, subtotal) > 0 ? best : null
}

export function suggestedVoucher(vouchers, subtotal) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) return null
  // shortcut: suggestions cover order vouchers, check product/VIP eligibility before suggesting those types.
  vouchers = vouchers.filter(v => !v.voucher_type || v.voucher_type === 'ORDER')
  if (!vouchers.length) return null
  const eligible = vouchers.filter(v => Number(v.minimum_amount || 0) <= subtotal)
  if (eligible.length) return eligible.reduce((best, v) => voucherDiscount(v, subtotal) > voucherDiscount(best, subtotal) ? v : best)
  return vouchers.reduce((best, v) => Number(v.minimum_amount) < Number(best.minimum_amount) ? v : best)
}
