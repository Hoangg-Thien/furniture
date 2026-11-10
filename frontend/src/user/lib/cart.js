const CART_KEY = 'furniture_cart'

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
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) =>
      /^[1-9]\d*$/.test(id) && Number.isSafeInteger(quantity) && quantity > 0
    ))
  } catch {
    return {}
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    // Shopping remains available if browser storage is blocked or full.
  }
}
