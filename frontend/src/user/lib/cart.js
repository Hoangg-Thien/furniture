const CART_KEY = 'furniture_cart'
const CART_EXPIRY_KEY = 'furniture_cart_expires_at'
export const CART_TIMEOUT_MS = 5 * 60 * 1000

export function loadCartExpiresAt() {
  return readCart().expiresAt
}

export function getProductStock(product) {
  return Number.isSafeInteger(product?.quantity) && product.quantity >= 0 ? product.quantity : 0
}

export function limitCartToStock(cart, products) {
  const limited = {}
  for (const product of products) {
    const quantity = Math.min(Number.isSafeInteger(cart[product.id]) ? cart[product.id] : 0, getProductStock(product))
    if (quantity > 0) limited[product.id] = quantity
  }
  return Object.keys(cart).length === Object.keys(limited).length
    && Object.entries(limited).every(([id, quantity]) => cart[id] === quantity) ? cart : limited
}

export function loadCart() {
  return readCart().items
}

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { items: {}, expiresAt: 0 }
    const legacy = !Object.hasOwn(saved, 'items')
    const items = legacy ? saved : saved.items
    if (!items || typeof items !== 'object' || Array.isArray(items)) return { items: {}, expiresAt: 0 }
    const cart = Object.fromEntries(Object.entries(items).filter(([id, quantity]) =>
      /^[1-9]\d*$/.test(id) && Number.isSafeInteger(quantity) && quantity > 0
    ))
    if (Object.keys(cart).length === 0) return { items: {}, expiresAt: 0 }
    const now = Date.now()
    const rawExpiry = legacy ? localStorage.getItem(CART_EXPIRY_KEY) : saved.expiresAt
    const expiresAt = legacy && rawExpiry === null ? now + CART_TIMEOUT_MS : Number(rawExpiry)
    if (!Number.isSafeInteger(expiresAt) || Number.isNaN(new Date(expiresAt).getTime()) || expiresAt <= now) {
      saveCart({})
      return { items: {}, expiresAt: 0 }
    }
    // Shortening the policy caps the old deadline once without discarding its items.
    const deadline = Math.min(expiresAt, now + CART_TIMEOUT_MS)
    if (legacy || deadline !== expiresAt) saveCart(cart, deadline)
    return { items: cart, expiresAt: deadline }
  } catch {
    return { items: {}, expiresAt: 0 }
  }
}

export function saveCart(cart, expiresAt = Date.now() + CART_TIMEOUT_MS) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ items: cart, expiresAt: Object.keys(cart).length ? expiresAt : 0 }))
  } catch {
    // Shopping remains available if browser storage is blocked or full.
  }
}
