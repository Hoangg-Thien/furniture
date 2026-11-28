import { getApiBaseUrl } from './apiConfig.js'

export function getOrderUrl(order) {
  const id = order.orderNumber || order.orderCode || order.orderId || order.id
  return `/order-success?id=${encodeURIComponent(id)}${order.guestToken ? `#token=${encodeURIComponent(order.guestToken)}` : ''}`
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
  checkoutKey,
  voucherId = null,
  discountAmount = 0,
  preferProductDiscounts = false,
  items,
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
        checkoutKey,
        voucherId,
        discountAmount,
        ...(preferProductDiscounts ? { preferProductDiscounts: true } : {}),
        items,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        order: null,
        status: response.status,
        error: data.error || 'Đặt hàng thất bại từ hệ thống backend.',
      }
    }

    if (checkoutKey && (!data?.orderId || !Array.isArray(data.items) || !items.every(requested =>
      data.items.some(saved => String(saved.productId) === String(requested.productId)
        && saved.quantity === requested.quantity && Number.isFinite(saved.unitPrice))))) {
      return { order: null, error: 'Chưa xác nhận được kết quả đặt hàng.' }
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

export async function previewOrder(items, voucherId, signal, preferProductDiscounts = false) {
  const response = await fetch(`${getApiBaseUrl()}/api/orders/preview`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ items, voucherId, ...(preferProductDiscounts ? { preferProductDiscounts: true } : {}) }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Không thể tính tổng đơn hàng. Vui lòng thử lại.')
  if (!Array.isArray(data.items) || !['subtotal', 'discountAmount', 'shippingFee', 'totalAmount'].every(key =>
    typeof data[key] === 'number' && Number.isFinite(data[key]) && data[key] >= 0) || data.discountAmount > data.subtotal) {
    throw new Error('Dữ liệu báo giá không hợp lệ. Vui lòng thử lại.')
  }
  for (const field of ['itemDiscounts', 'productOffers']) {
    if (data[field] != null && (!Array.isArray(data[field]) || !data[field].every(item => item && Number.isSafeInteger(item.productId) && item.productId > 0 && typeof item.label === 'string' &&
      ['originalAmount', 'discountAmount', 'finalAmount'].every(key => typeof item[key] === 'number' && Number.isFinite(item[key]) && item[key] >= 0) && item.discountAmount <= item.originalAmount))) {
      throw new Error('Dữ liệu giảm giá sản phẩm không hợp lệ. Vui lòng thử lại.')
    }
  }
  return data
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
    console.warn('Backend fetchOrders error:', err)
  }

  return { orders: [], error: 'Không tải được đơn hàng mới nhất.' }
}

export async function fetchOrderById(id, guestToken, signal) {
  const apiBaseUrl = getApiBaseUrl()
  let queryId = id
  if (typeof id === 'string' && id.startsWith('FUNI-')) {
    const match = id.match(/(\d+)$/)
    if (match) queryId = parseInt(match[1], 10)
  }
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${queryId}`, {
      signal,
      headers: guestToken ? { 'X-Order-Token': guestToken } : {},
    })
    if (response.ok) {
      const data = await response.json()
      return { order: data.order, items: data.items, error: null }
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('Backend fetchOrderById error:', err)
  }
  return { order: null, items: [], error: 'Không tìm thấy đơn hàng' }
}

export async function cancelOrderApi(id, guestToken) {
  const apiBaseUrl = getApiBaseUrl()
  let queryId = id
  if (typeof id === 'string' && id.startsWith('FUNI-')) {
    const match = id.match(/(\d+)$/)
    if (match) queryId = parseInt(match[1], 10)
  }
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders/${queryId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(guestToken ? { 'X-Order-Token': guestToken } : {}) },
    })
    const data = await response.json()
    if (response.ok) {
      return { success: true, message: data.message || 'Đã hủy đơn thành công' }
    }
    return { success: false, error: data.error || 'Không thể hủy đơn' }
  } catch {
    return { success: false, error: 'Chưa xác nhận được việc hủy đơn. Vui lòng kiểm tra kết nối và tải lại trạng thái đơn hàng.' }
  }
}
