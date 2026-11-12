export function isCheckoutPath(pathname) {
  return pathname.toLowerCase().replace(/\/+$/, '') === '/checkout'
}

export function voucherDiscount(voucher, subtotal) {
  if (subtotal < Number(voucher.minimum_amount || 0)) return 0
  const discount = Math.round(subtotal * Number(voucher.discount_percent || 0) / 100)
  const maximum = Number(voucher.maximum_discount)
  return Math.max(0, Math.min(discount, maximum > 0 ? maximum : subtotal, subtotal))
}

export function suggestedVoucher(vouchers, subtotal) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) return null
  const eligible = vouchers.filter(v => Number(v.minimum_amount || 0) <= subtotal)
  if (eligible.length) return eligible.reduce((best, v) => voucherDiscount(v, subtotal) > voucherDiscount(best, subtotal) ? v : best)
  return vouchers.reduce((best, v) => Number(v.minimum_amount) < Number(best.minimum_amount) ? v : best)
}

const draftKey = (customerId) => `furniture_checkout_${customerId || 'guest'}`
const FORM_FIELDS = ['fullName', 'phone', 'address', 'ward', 'district', 'city']

export function loadCheckoutDraft(customerId) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey(customerId)) || 'null')
    if (!draft || !draft.form || Array.isArray(draft.form) || typeof draft.form !== 'object') return null
    const form = Object.fromEntries(FORM_FIELDS
      .filter((field) => typeof draft.form[field] === 'string')
      .map((field) => [field, draft.form[field]]))
    return { form, step: draft.step === 2 ? 2 : 1, useDefaultAccountInfo: draft.useDefaultAccountInfo === true }
  } catch {
    return null
  }
}

export function saveCheckoutDraft(customerId, draft) {
  try {
    sessionStorage.setItem(draftKey(customerId), JSON.stringify(draft))
  } catch { /* Checkout remains usable when browser storage is unavailable. */ }
}

export function clearCheckoutDraft(customerId) {
  try {
    sessionStorage.removeItem(draftKey(customerId))
  } catch { /* Nothing to clear if browser storage is unavailable. */ }
}
