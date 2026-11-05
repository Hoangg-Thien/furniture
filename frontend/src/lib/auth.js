import { getApiBaseUrl } from './apiConfig.js'

const SESSION_CUSTOMER_KEY = 'furniture_customer_user'
const SESSION_ADMIN_KEY = 'furniture_admin_user'
const LEGACY_SESSION_KEY = 'furniture_logged_in_user'

/**
 * ====================================================================
 * PHÂN HỆ KHÁCH HÀNG (STOREFRONT CLIENT)
 * Chỉ cho phép tài khoản có vai trò 'CUSTOMER' đăng nhập tại Cửa hàng.
 * Tuyệt đối không cho tài khoản ADMIN hoặc STAFF hiển thị tại đây.
 * ====================================================================
 */

/**
 * Lấy thông tin tài khoản Khách hàng từ localStorage
 */
export function getCurrentUser() {
  try {
    // 1. Kiểm tra session khách hàng chuẩn
    let raw = localStorage.getItem(SESSION_CUSTOMER_KEY)
    
    // 2. Migration từ legacy key nếu có
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SESSION_KEY)
    }

    if (!raw) return null
    const user = JSON.parse(raw)

    // QUAN TRỌNG: Nếu tài khoản trong session KHÔNG PHẢI là CUSTOMER (vd: staff01, admin01),
    // lập tức xóa bỏ để tránh hiển thị sai trên giao diện Cửa hàng!
    if (!user || user.role !== 'CUSTOMER') {
      localStorage.removeItem(SESSION_CUSTOMER_KEY)
      localStorage.removeItem(LEGACY_SESSION_KEY)
      return null
    }

    localStorage.setItem(SESSION_CUSTOMER_KEY, JSON.stringify(user))
    localStorage.removeItem(LEGACY_SESSION_KEY)
    return user
  } catch {
    return null
  }
}

export function setCurrentUser(user) {
  if (user && user.role === 'CUSTOMER') {
    localStorage.setItem(SESSION_CUSTOMER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_CUSTOMER_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
  }
}

export function logoutUser() {
  const user = getCurrentUser()
  if (user?.accessToken && user.apiBaseUrl) fetch(`${user.apiBaseUrl}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${user.accessToken}` } }).catch(() => {})
  setCurrentUser(null)
}

/**
 * Đăng nhập dành riêng cho Khách hàng tại Cửa hàng (Storefront)
 * Chặn tài khoản ADMIN / STAFF không cho đăng nhập tại modal mua sắm
 */
export async function loginCustomer(username, password) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()
    if (!response.ok) {
      return { user: null, error: data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác' }
    }

    // Tại Cửa hàng: Chỉ cho phép tài khoản Khách hàng (CUSTOMER).
    // Bất kỳ tài khoản nào khác đều coi là không chính xác để bảo mật tuyệt đối.
    if (data.role !== 'CUSTOMER') {
      return {
        user: null,
        error: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      }
    }

    const user = { ...data, apiBaseUrl }
    setCurrentUser(user)
    return { user, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

// Alias cho backwards compatibility
export const loginUser = loginCustomer

/**
 * Đăng ký tài khoản Khách hàng
 */
export async function registerUser({ username, password, fullName, email, phone, address }) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullName, email, phone, address }),
    })

    const data = await response.json()
    if (!response.ok) {
      return { user: null, error: data.error || 'Đăng ký tài khoản thất bại' }
    }

    const user = { ...data, apiBaseUrl }
    setCurrentUser(user)
    return { user, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

/**
 * Cập nhật thông tin tài khoản Khách hàng
 */
export async function updateProfile(userId, { fullName, email, phone, address, currentPassword, newPassword }) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/update/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, address, currentPassword, newPassword }),
    })

    const data = await response.json()
    if (!response.ok) {
      return { user: null, error: data.error || 'Cập nhật thất bại' }
    }

    const user = { ...data, apiBaseUrl }
    setCurrentUser(user)
    return { user, error: null }
  } catch {
    return { user: null, error: 'Không thể kết nối đến Backend Server (port 8080).' }
  }
}


/**
 * ====================================================================
 * PHÂN HỆ QUẢN TRỊ (ADMIN & STAFF PORTAL)
 * Hoàn toàn tách biệt khỏi phiên làm việc mua sắm của Khách hàng.
 * ====================================================================
 */

/**
 * Lấy thông tin tài khoản Quản trị / Nhân viên đang đăng nhập
 */
export function getCurrentAdminUser() {
  try {
    const raw = localStorage.getItem(SESSION_ADMIN_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    if (user?.accessToken && (user.role === 'ADMIN' || user.role === 'STAFF')) {
      return user
    }
    localStorage.removeItem(SESSION_ADMIN_KEY)
    return null
  } catch {
    return null
  }
}

export function setCurrentAdminUser(user) {
  if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
    localStorage.setItem(SESSION_ADMIN_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_ADMIN_KEY)
  }
}

export function logoutAdminUser() {
  const user = getCurrentAdminUser()
  if (user?.accessToken && user.apiBaseUrl) {
    fetch(`${user.apiBaseUrl}/api/auth/admin/logout`, { method: 'POST', headers: { Authorization: `Bearer ${user.accessToken}` } }).catch(() => {})
  }
  setCurrentAdminUser(null)
}

/**
 * Đăng nhập dành riêng cho Trang Quản Trị (/admin)
 */
export async function loginAdmin(username, password) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()
    const data = { ...result.user, accessToken: result.accessToken, staffType: result.staffType, apiBaseUrl }
    if (!response.ok) {
      return { user: null, error: result.error || 'Tên đăng nhập hoặc mật khẩu không chính xác' }
    }

    // Tại Trang Quản trị: Chỉ cho phép ADMIN hoặc STAFF.
    if (!data.accessToken || (data.role !== 'ADMIN' && data.role !== 'STAFF')) {
      return {
        user: null,
        error: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      }
    }

    setCurrentAdminUser(data)
    return { user: data, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}
