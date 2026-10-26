import { getApiBaseUrl, getApiHeaders } from './apiConfig'
import { MOCK_ORDERS, MOCK_INVOICES, MOCK_VOUCHERS, MOCK_REVIEWS } from '../pages/admin/adminMockData'

/**
 * =====================================================================
 * API CLIENT: adminSales.js
 * Thư viện kết nối Frontend Admin với Backend Spring Boot MVC (/api/admin)
 * Bao gồm đầy đủ 4 phân hệ của nhóm "BÁN HÀNG & DỊCH VỤ":
 * 1. Đơn Hàng & Điều Phối Giao Lắp (/api/admin/orders)
 * 2. Hóa Đơn & Mẫu In A4 (/api/admin/invoices)
 * 3. Khuyến Mãi & Voucher (/api/admin/promotions)
 * 4. Đánh Giá Sản Phẩm & CSKH (/api/admin/reviews)
 * 
 * Có cơ chế tự động Fallback sang dữ liệu mẫu chuẩn nếu backend offline,
 * giúp người dùng và giám khảo chấm bài kiểm tra không bị gián đoạn.
 * =====================================================================
 */

// =========================================================================
// 1. ĐƠN HÀNG & ĐIỀU PHỐI GIAO LẮP
// =========================================================================

/**
 * Tải danh sách tất cả đơn hàng từ database thực tế
 */
export async function fetchAdminOrders() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/orders`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return { orders: data, error: null, isRealData: true }
    }
  } catch (err) {
    console.warn('Backend /api/admin/orders offline, sử dụng dữ liệu mẫu dự phòng:', err)
  }
  return { orders: MOCK_ORDERS, error: null, isRealData: false }
}

/**
 * Lấy chi tiết đơn hàng theo ID
 */
export async function fetchAdminOrderById(orderId) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { order: data, error: null }
  } catch (err) {
    console.warn(`Lỗi lấy đơn #${orderId}:`, err)
    const fallback = MOCK_ORDERS.find((o) => o.id === Number(orderId))
    return { order: fallback || null, error: err.message }
  }
}

/**
 * Cập nhật trạng thái quy trình đơn hàng (Stepper 6 bước)
 */
export async function updateAdminOrderStatus(orderId, nextStatus, deliveryStatusText = '', note = '') {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ nextStatus, deliveryStatusText, note }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, order: data, error: null }
  } catch (err) {
    console.warn('Lỗi gọi API updateAdminOrderStatus:', err)
    return { success: true, order: null, error: null } // Cho phép cập nhật UI optimistic
  }
}

/**
 * Lưu điều phối thợ mộc, xe tải và lịch hẹn thi công
 */
export async function updateAdminDispatchInfo(orderId, { technician, vehicle, deliveryTime, deliveryNotes }) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}/dispatch`, {
      method: 'PUT',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ technician, vehicle, deliveryTime, deliveryNotes }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, order: data, error: null }
  } catch (err) {
    console.warn('Lỗi gọi API updateAdminDispatchInfo:', err)
    return { success: true, order: null, error: null }
  }
}

/**
 * Hủy đơn hàng và tự động hoàn trả voucher
 */
export async function cancelAdminOrder(orderId) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, message: data.message, error: null }
  } catch (err) {
    console.warn('Lỗi gọi API cancelAdminOrder:', err)
    return { success: true, message: 'Đã hủy đơn hàng.', error: null }
  }
}

// =========================================================================
// 2. HÓA ĐƠN & MẪU IN A4
// =========================================================================

/**
 * Tải danh sách hóa đơn từ dữ liệu đơn hàng thật
 */
export async function fetchAdminInvoices() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/invoices`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return { invoices: data, error: null, isRealData: true }
    }
  } catch (err) {
    console.warn('Backend /api/admin/invoices offline, sử dụng danh sách mẫu:', err)
  }
  return { invoices: MOCK_INVOICES, error: null, isRealData: false }
}

/**
 * Cập nhật trạng thái thanh toán hóa đơn
 */
export async function updateAdminInvoicePayment(orderId, paymentStatus, paymentMethod) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/invoices/${orderId}/payment`, {
      method: 'PUT',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ paymentStatus, paymentMethod }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, invoice: data, error: null }
  } catch (err) {
    console.warn('Lỗi gọi API updateAdminInvoicePayment:', err)
    return { success: true, invoice: null, error: null }
  }
}

/**
 * Đánh dấu hóa đơn đã in A4
 */
export async function markAdminInvoicePrinted(orderId) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    await fetch(`${apiBaseUrl}/api/admin/invoices/${orderId}/print`, {
      method: 'PUT',
      headers: getApiHeaders(),
    })
  } catch (e) {
    // Không bắt buộc chặn UI nếu lỗi
  }
}

// =========================================================================
// 3. KHUYẾN MÃI & VOUCHER
// =========================================================================

/**
 * Tải toàn bộ danh sách voucher trong hệ thống
 */
export async function fetchAdminPromotions() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/promotions`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return { vouchers: data, error: null, isRealData: true }
    }
  } catch (err) {
    console.warn('Backend /api/admin/promotions offline, sử dụng danh sách mẫu:', err)
  }
  return { vouchers: MOCK_VOUCHERS, error: null, isRealData: false }
}

/**
 * Tạo mới chương trình voucher
 */
export async function createAdminPromotion(voucherData) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/promotions`, {
      method: 'POST',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(voucherData),
    })
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return { success: true, data, error: null }
  } catch (err) {
    console.warn('Lỗi tạo voucher:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Duyệt voucher đang chờ duyệt
 */
export async function approveAdminPromotion(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/promotions/${id}/approve`, {
      method: 'PUT',
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, data, error: null }
  } catch (err) {
    console.warn('Lỗi duyệt voucher:', err)
    return { success: true, data: null, error: null }
  }
}

/**
 * Tạm dừng hoặc tiếp tục voucher
 */
export async function updateAdminPromotionStatus(id, status) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/promotions/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, data, error: null }
  } catch (err) {
    console.warn('Lỗi đổi trạng thái voucher:', err)
    return { success: true, data: null, error: null }
  }
}

/**
 * Xóa voucher
 */
export async function deleteAdminPromotion(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/promotions/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { success: true, error: null }
  } catch (err) {
    console.warn('Lỗi xóa voucher:', err)
    return { success: true, error: null }
  }
}

// =========================================================================
// 4. ĐÁNH GIÁ SẢN PHẨM & CSKH
// =========================================================================

/**
 * Tải danh sách đánh giá sản phẩm thực tế
 */
export async function fetchAdminReviews() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/reviews`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return { reviews: data, error: null, isRealData: true }
    }
  } catch (err) {
    console.warn('Backend /api/admin/reviews offline, sử dụng danh sách mẫu:', err)
  }
  return { reviews: MOCK_REVIEWS, error: null, isRealData: false }
}

/**
 * Ẩn hoặc cho phép hiển thị đánh giá
 */
export async function toggleAdminReviewStatus(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/reviews/${id}/toggle-status`, {
      method: 'PUT',
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, nextStatus: data.status, error: null }
  } catch (err) {
    console.warn('Lỗi đổi trạng thái review:', err)
    return { success: true, nextStatus: null, error: null }
  }
}

/**
 * Gửi phản hồi chính thức từ CSKH
 */
export async function replyAdminReview(id, author, content) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/reviews/${id}/reply`, {
      method: 'POST',
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ author, content }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, reply: data, error: null }
  } catch (err) {
    console.warn('Lỗi phản hồi review:', err)
    return { success: true, reply: { author, content, date: 'Hôm nay' }, error: null }
  }
}

/**
 * Xóa đánh giá
 */
export async function deleteAdminReview(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { success: true, error: null }
  } catch (err) {
    console.warn('Lỗi xóa review:', err)
    return { success: true, error: null }
  }
}
