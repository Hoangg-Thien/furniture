const obsoleteLocalKeys = new Set([
  'furniture_customer_user', 'furniture_admin_user', 'furniture_logged_in_user',
  'furniture_cart', 'furniture_cart_expires_at', 'furniture_cached_products', 'furniture_custom_api_url',
  'funi_last_order', 'nep_last_order', 'funi_orders_history', 'nep_orders_history', 'funi_admin_active_module',
])

export function clearLegacyBrowserData() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (obsoleteLocalKeys.has(key) || key.startsWith('furniture_checkout_') || key.startsWith('funi_notifications_')) {
        localStorage.removeItem(key)
      }
    }
  } catch { /* The app can still run with browser storage disabled. */ }

  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('furniture_checkout_')) sessionStorage.removeItem(key)
    }
  } catch { /* The app can still run with browser storage disabled. */ }
}
