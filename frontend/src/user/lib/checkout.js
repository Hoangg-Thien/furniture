export function isCheckoutPath(pathname) {
  return pathname.toLowerCase().replace(/\/+$/, '') === '/checkout'
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
