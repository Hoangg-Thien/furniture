const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

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
  items,
}) {
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
        items,
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
  try {
    const url = customerId
      ? `${apiBaseUrl}/api/orders?customerId=${customerId}`
      : `${apiBaseUrl}/api/orders`
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

  // Fallback từ localStorage nếu backend đang không truy cập được
  try {
    const local = JSON.parse(localStorage.getItem('nep_orders_history') || '[]')
    return { orders: local, error: null }
  } catch (e) {
    return { orders: [], error: null }
  }
}

export async function fetchOrderById(id) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${id}`)
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
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    if (response.ok) {
      return { success: true, message: data.message || 'Đã hủy đơn thành công' }
    }
    return { success: false, error: data.error || 'Không thể hủy đơn' }
  } catch (err) {
    // Cập nhật tạm thời trong localStorage nếu offline
    try {
      const local = JSON.parse(localStorage.getItem('nep_orders_history') || '[]')
      const updated = local.map((o) =>
        (o.id === id || o.orderId === id || o.orderNumber === id)
          ? { ...o, status: 'CANCELLED' }
          : o
      )
      localStorage.setItem('nep_orders_history', JSON.stringify(updated))
      return { success: true, message: 'Đã hủy đơn hàng thành công.' }
    } catch (e) {}
    return { success: false, error: 'Không thể kết nối đến máy chủ.' }
  }
}

export function saveOrderToLocalHistory(order) {
  if (!order) return
  try {
    const current = JSON.parse(localStorage.getItem('nep_orders_history') || '[]')
    const key = order.orderNumber || order.orderId || order.id
    const exists = current.some((o) => (o.orderNumber || o.orderId || o.id) === key)
    if (!exists) {
      const updated = [order, ...current]
      localStorage.setItem('nep_orders_history', JSON.stringify(updated))
    }
  } catch (err) {
    console.error('Cannot save order to local history:', err)
  }
}
