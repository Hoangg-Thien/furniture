const CART_KEY = 'furniture_cart'

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
