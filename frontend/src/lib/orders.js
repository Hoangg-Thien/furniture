import { getApiBaseUrl } from './apiConfig.js'

const HISTORY_KEYS = ['funi_orders_history', 'nep_orders_history']
const LAST_ORDER_KEYS = ['funi_last_order', 'nep_last_order']

function orderKey(order) {
  const value = order.orderId ?? order.id ?? order.orderCode ?? order.orderNumber
  return String(value ?? '').replace(/^FUNI-\d{4}-0*/, '')
}

function readStoredOrders() {
  const orders = new Map()
  for (const key of [...HISTORY_KEYS, ...LAST_ORDER_KEYS]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null')
      const list = HISTORY_KEYS.includes(key) ? value : [value]
      if (!Array.isArray(list)) continue
      for (const order of list) {
        if (order && orderKey(order) && !orders.has(orderKey(order))) {
          orders.set(orderKey(order), order)
        }
      }
    } catch { /* Ignore an invalid cache entry. */ }
  }
  return [...orders.values()]
}

export function getLocalOrders(customerId) {
  if (!customerId) return []
  return readStoredOrders().filter((order) =>
    String(order.customerId ?? order.customer_id ?? '') === String(customerId)
  )
}

function cacheCancelledOrder(id) {
  try {
    const key = orderKey({ id })
    const updated = readStoredOrders().map((order) =>
      orderKey(order) === key ? { ...order, status: 'CANCELLED' } : order
    )
    for (const historyKey of HISTORY_KEYS) {
      localStorage.setItem(historyKey, JSON.stringify(updated))
    }
    for (const lastKey of LAST_ORDER_KEYS) {
      const last = JSON.parse(localStorage.getItem(lastKey) || 'null')
      if (last && orderKey(last) === key) {
        localStorage.setItem(lastKey, JSON.stringify({ ...last, status: 'CANCELLED' }))
      }
    }
  } catch { /* A cache failure must not change a successful server response. */ }
}

/**
 * Gửi yêu cầu đặt hàng tới Backend API (/api/orders)
 * Dữ liệu sẽ được lưu trực tiếp vào bảng "orders" và "order_items" trong cơ sở dữ liệu Supabase PostgreSQL
 */
export async function createOrder({
  customerId,
  userId,
  fullName,
  phone,
  address,
  ward,
  district,
  city,
  totalAmount,
  voucherId = null,
  discountAmount = 0,
  items,
  paymentMethod = 'COD',
}) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        userId,
        fullName,
        phone,
        address,
        ward,
        district,
        city,
        totalAmount,
        voucherId,
        discountAmount,
        items,
        paymentMethod,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        order: null,
        error: data.error || 'Đặt hàng thất bại từ hệ thống backend.',
      }
    }

    return {
      order: data,
      error: null,
    }
  } catch (err) {
    console.error('Lỗi khi gọi API đặt hàng:', err)
    return {
      order: null,
      error: 'Không thể kết nối đến máy chủ backend (port 8080). Vui lòng đảm bảo backend đang chạy.',
    }
  }
}

export async function fetchOrders(customerId) {
  if (!customerId) return { orders: [], error: 'Vui lòng đăng nhập để xem đơn hàng.' }
  const apiBaseUrl = getApiBaseUrl()
  try {
    const url = `${apiBaseUrl}/api/orders?customerId=${encodeURIComponent(customerId)}`
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        return { orders: data, error: null }
      }
    }
  } catch (err) {
    console.warn('Backend fetchOrders error, reading local fallback:', err)
  }

  return { orders: getLocalOrders(customerId), error: 'Không tải được đơn hàng mới nhất. Đang hiển thị dữ liệu đã lưu trên thiết bị.' }
}

export async function fetchOrderById(id) {
  const apiBaseUrl = getApiBaseUrl()
  let queryId = id
  if (typeof id === 'string' && id.startsWith('FUNI-')) {
    const match = id.match(/(\d+)$/)
    if (match) queryId = parseInt(match[1], 10)
  }
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${queryId}`)
    if (response.ok) {
      const data = await response.json()
      return { order: data.order, items: data.items, error: null }
    }
  } catch (err) {
    console.warn('Backend fetchOrderById error:', err)
  }
  return { order: null, items: [], error: 'Không tìm thấy đơn hàng' }
}

export async function cancelOrderApi(id) {
  const apiBaseUrl = getApiBaseUrl()
  let queryId = id
  if (typeof id === 'string' && id.startsWith('FUNI-')) {
    const match = id.match(/(\d+)$/)
    if (match) queryId = parseInt(match[1], 10)
  }
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${queryId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    if (response.ok) {
      cacheCancelledOrder(id)
      return { success: true, message: data.message || 'Đã hủy đơn thành công' }
    }
    return { success: false, error: data.error || 'Không thể hủy đơn' }
  } catch {
    return { success: false, error: 'Chưa xác nhận được việc hủy đơn. Vui lòng kiểm tra kết nối và tải lại trạng thái đơn hàng.' }
  }
}

export function saveOrderToLocalHistory(order) {
  if (!order) return
  try {
    const current = readStoredOrders()
    const updated = [order, ...current.filter((item) => orderKey(item) !== orderKey(order))]
    for (const key of HISTORY_KEYS) {
      localStorage.setItem(key, JSON.stringify(updated))
    }
  } catch (err) {
    console.error('Cannot save order to local history:', err)
  }
}
