const CART_KEY = 'furniture_cart'
export const CART_TIMEOUT_MS = 5 * 60 * 1000

export function cartStorageKey(customerId) {
  return customerId == null ? CART_KEY : `${CART_KEY}:${customerId}`
}

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

export function readCart(key = CART_KEY) {
  try {
    const storage = key === CART_KEY ? sessionStorage : localStorage
    const saved = JSON.parse(storage.getItem(key) || '{}')
    const items = saved?.items
    if (!items || typeof items !== 'object' || Array.isArray(items)) return { items: {}, expiresAt: 0 }
    const cart = Object.fromEntries(Object.entries(items).filter(([id, quantity]) =>
      /^[1-9]\d*$/.test(id) && Number.isSafeInteger(quantity) && quantity > 0
    ))
    if (Object.keys(cart).length === 0) return { items: {}, expiresAt: 0 }
    const now = Date.now()
    const expiresAt = Number(saved.expiresAt)
    if (!Number.isSafeInteger(expiresAt) || Number.isNaN(new Date(expiresAt).getTime()) || expiresAt <= now) {
      saveCart({}, 0, key)
      return { items: {}, expiresAt: 0 }
    }
    // Shortening the policy caps the old deadline once without discarding its items.
    const deadline = Math.min(expiresAt, now + CART_TIMEOUT_MS)
    if (deadline !== expiresAt) saveCart(cart, deadline, key)
    return { items: cart, expiresAt: deadline }
  } catch {
    return { items: {}, expiresAt: 0 }
  }
}

export function saveCart(cart, expiresAt = Date.now() + CART_TIMEOUT_MS, key = CART_KEY) {
  try {
    const storage = key === CART_KEY ? sessionStorage : localStorage
    storage.setItem(key, JSON.stringify({ items: cart, expiresAt: Object.keys(cart).length ? expiresAt : 0 }))
  } catch {
    // Shopping remains available if browser storage is blocked or full.
  }
}
