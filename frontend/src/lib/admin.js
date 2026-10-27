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
    console.warn('Lỗi fetchAdminUsers:', err)
    return { users: [], error: err.message }
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
    console.warn('Lỗi fetchAdminCustomers:', err)
    return { customers: [], error: err.message }
  }
}

/**
 * Tải danh sách nhân viên và quản trị viên
 */
export async function fetchAdminStaff() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/staff`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { staff: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.warn('Lỗi fetchAdminStaff:', err)
    return { staff: [], error: err.message }
  }
}

/**
 * Tạo tài khoản nhân viên / quản trị mới
 */
export async function createAdminStaff(staffData) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/staff`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(staffData),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Khóa hoặc Mở khóa tài khoản nhân viên
 */
export async function toggleStaffStatus(userId) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/staff/${userId}/toggle-status`, {
      method: 'PUT',
      headers: getApiHeaders(),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Cập nhật vai trò tài khoản
 */
export async function updateStaffRole(userId, role) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/staff/${userId}/role`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Đặt lại mật khẩu tài khoản
 */
export async function resetStaffPassword(userId, password = '123456') {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/staff/${userId}/reset-password`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Lấy cài đặt hệ thống từ Database
 */
export async function fetchSystemSettings() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/settings`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { settings: data || {}, error: null }
  } catch (err) {
    console.warn('Lỗi fetchSystemSettings, fallback to localStorage:', err)
    const local = localStorage.getItem('funi_system_settings')
    return { settings: local ? JSON.parse(local) : {}, error: err.message }
  }
}

/**
 * Lưu cài đặt hệ thống vào Database & localStorage
 */
export async function saveSystemSettings(settings) {
  const apiBaseUrl = getApiBaseUrl()
  localStorage.setItem('funi_system_settings', JSON.stringify(settings))
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/settings`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(settings),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: true, data: { settings }, offline: true }
  }
}

/**
 * Lấy cấu hình ma trận phân quyền RBAC
 */
export async function fetchPermissionsMatrix() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/permissions`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { matrix: data || {}, error: null }
  } catch (err) {
    const local = localStorage.getItem('funi_permissions_matrix')
    return { matrix: local ? JSON.parse(local) : {}, error: err.message }
  }
}

/**
 * Lưu cấu hình ma trận phân quyền RBAC
 */
export async function savePermissionsMatrix(matrix) {
  const apiBaseUrl = getApiBaseUrl()
  localStorage.setItem('funi_permissions_matrix', JSON.stringify(matrix))
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/permissions`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(matrix),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return { success: true, data }
  } catch (err) {
    return { success: true, offline: true }
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
