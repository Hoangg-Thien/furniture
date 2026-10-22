import { getApiBaseUrl, getApiHeaders } from './apiConfig'

/**
 * Tải danh sách tất cả tài khoản người dùng cho Admin
 */
export async function fetchAdminUsers() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/users`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { users: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.warn('Lỗi fetchAdminUsers, sử dụng danh sách mẫu:', err)
    return {
      users: [
        { id: 1, username: 'admin', role: 'ADMIN', is_active: true, created_at: '2026-03-01T10:00:00Z' },
        { id: 2, username: 'khoi_furniture', role: 'ADMIN', is_active: true, created_at: '2026-03-05T14:20:00Z' },
        { id: 3, username: 'hoangthien', role: 'ADMIN', is_active: true, created_at: '2026-03-08T09:15:00Z' },
        { id: 4, username: 'minhanh', role: 'CUSTOMER', is_active: true, created_at: '2026-03-12T11:45:00Z' },
        { id: 5, username: 'thanhson', role: 'CUSTOMER', is_active: true, created_at: '2026-03-15T16:30:00Z' },
      ],
      error: err.message,
    }
  }
}

/**
 * Tải danh sách hồ sơ khách hàng cho Admin
 */
export async function fetchAdminCustomers() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/customers`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { customers: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.warn('Lỗi fetchAdminCustomers, sử dụng danh sách mẫu:', err)
    return {
      customers: [
        { id: 1, user_id: 4, full_name: 'Trần Minh Anh', email: 'minhanh@gmail.com', phone: '0901234567', address: 'Quận 1, TP. Hồ Chí Minh' },
        { id: 2, user_id: 5, full_name: 'Nguyễn Thanh Sơn', email: 'thanhson@gmail.com', phone: '0912345678', address: 'Quận Cầu Giấy, Hà Nội' },
        { id: 3, user_id: 2, full_name: 'Duy Khôi Admin', email: 'duykhoi@furniture.vn', phone: '0988776655', address: 'Quận 7, TP. Hồ Chí Minh' },
      ],
      error: err.message,
    }
  }
}

/**
 * Kiểm tra kết nối Backend API
 */
export async function testBackendConnection() {
  const apiBaseUrl = getApiBaseUrl()
  const start = performance.now()
  try {
    const res = await fetch(`${apiBaseUrl}/api/products`, {
      headers: getApiHeaders(),
    })
    const ping = Math.round(performance.now() - start)
    return {
      online: res.ok,
      status: res.status,
      pingMs: ping,
      url: apiBaseUrl,
      error: res.ok ? null : `Phản hồi lỗi mã ${res.status}`,
    }
  } catch (err) {
    return {
      online: false,
      status: 0,
      pingMs: 0,
      url: apiBaseUrl,
      error: err.message || 'Không thể kết nối',
    }
  }
}
