const CART_KEY = 'furniture_cart'
const CART_EXPIRY_KEY = 'furniture_cart_expires_at'
export const CART_TIMEOUT_MS = 5 * 60 * 1000
export function loadCartExpiresAt() {
  try {
    const expiresAt = Number(localStorage.getItem(CART_EXPIRY_KEY))
    return Number.isSafeInteger(expiresAt) && expiresAt > 0 && expiresAt <= Date.now() + CART_TIMEOUT_MS ? expiresAt : 0
  } catch {
    return 0
  }
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
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    const cart = Object.fromEntries(Object.entries(saved).filter(([id, quantity]) =>
      /^[1-9]\d*$/.test(id) && Number.isSafeInteger(quantity) && quantity > 0
    ))
    if (Object.keys(cart).length === 0) return {}
    // Existing carts receive their first deadline once, when this version loads them.
    if (localStorage.getItem(CART_EXPIRY_KEY) === null) {
      saveCart(cart)
      return cart
    }
    if (loadCartExpiresAt() <= Date.now()) {
      saveCart({})
      return {}
    }
    return cart
  } catch {
    return {}
  }
}

export function saveCart(cart, expiresAt = Date.now() + CART_TIMEOUT_MS) {
  try {
    localStorage.setItem(CART_EXPIRY_KEY, String(Object.keys(cart).length ? expiresAt : 0))
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    // Shopping remains available if browser storage is blocked or full.
  }
}
