const ORDER_MESSAGES = {
  PENDING: ['Đã nhận đơn hàng', 'Đơn hàng đang chờ cửa hàng xác nhận.'],
  CONFIRMED: ['Đơn hàng đã được duyệt', 'Cửa hàng đang chuẩn bị hàng. Xem ngày giao dự kiến trong chi tiết đơn.'],
  SHIPPING: ['Đơn hàng đang vận chuyển', 'Vui lòng chú ý điện thoại để nhận hàng đúng thời hạn.'],
  COMPLETED: ['Đơn hàng đã giao thành công', 'Cảm ơn bạn đã mua sắm tại FuniStore.'],
  CANCELLED: ['Đơn hàng đã được hủy', 'Bạn có thể xem lại đơn hoặc mua lại sản phẩm.'],
}

// shortcut: show only each order's latest status, store server events when a full history is needed.
export function getOrderNotifications(orders) {
  return orders.flatMap(order => {
    const orderId = order?.orderId ?? order?.id
    const status = String(order?.status || '').toUpperCase()
    const message = ORDER_MESSAGES[status]
    if (!orderId || !message) return []
    return [{ id: `order-${orderId}-${status}`, orderId, title: message[0], description: `${order.orderCode || order.orderNumber || `#${orderId}`} · ${message[1]}` }]
  })
}

export function loadReadNotificationIds(key) {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

export function saveReadNotificationIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch { /* Unavailable storage must not prevent reading notifications. */ }
}
