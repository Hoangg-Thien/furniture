import { getApiBaseUrl } from './apiConfig'

export const SESSION_CLIENT_KEY = 'furniture_client_user'
export const SESSION_ADMIN_KEY = 'furniture_admin_user'
const LEGACY_USER_KEY = 'furniture_logged_in_user'

/**
 * Tự động di chuyển dữ liệu phiên cũ nếu có và đảm bảo tách biệt rõ ràng
 */
function sanitizeSessions() {
  try {
    const rawLegacy = localStorage.getItem(LEGACY_USER_KEY)
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy)
      if (parsed.role === 'ADMIN' || parsed.role === 'STAFF') {
        if (!localStorage.getItem(SESSION_ADMIN_KEY)) {
          localStorage.setItem(SESSION_ADMIN_KEY, rawLegacy)
        }
      } else if (parsed.role === 'CUSTOMER') {
        if (!localStorage.getItem(SESSION_CLIENT_KEY)) {
          localStorage.setItem(SESSION_CLIENT_KEY, rawLegacy)
        }
      }
      localStorage.removeItem(LEGACY_USER_KEY)
    }
  } catch {
    // Bỏ qua lỗi parse
  }
}

/**
 * Lấy tài khoản khách hàng hiện tại (Chỉ chấp nhận role = CUSTOMER)
 */
export function getClientUser() {
  sanitizeSessions()
  try {
    const raw = localStorage.getItem(SESSION_CLIENT_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    // Client CHỈ chấp nhận khách hàng, nếu là ADMIN/STAFF thì tự động xóa và trả về null
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      localStorage.removeItem(SESSION_CLIENT_KEY)
      return null
    }
    return user
  } catch {
    return null
  }
}

export function setClientUser(user) {
  if (user) {
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      console.warn('Không thể gán tài khoản Quản trị viên (Admin) vào phiên mua sắm của Khách hàng!')
      localStorage.removeItem(SESSION_CLIENT_KEY)
      return
    }
    localStorage.setItem(SESSION_CLIENT_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_CLIENT_KEY)
  }
}

/**
 * Lấy tài khoản Quản trị viên hiện tại (ADMIN hoặc STAFF)
 */
export function getAdminUser() {
  sanitizeSessions()
  try {
    const raw = localStorage.getItem(SESSION_ADMIN_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      return user
    }
    return null
  } catch {
    return null
  }
}

export function setAdminUser(user) {
  if (user) {
    localStorage.setItem(SESSION_ADMIN_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_ADMIN_KEY)
  }
}

/**
 * Hàm lấy user theo ngữ cảnh trang (tương thích ngược)
 */
export function getCurrentUser() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return getAdminUser()
  }
  return getClientUser()
}

export function setCurrentUser(user) {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    setAdminUser(user)
  } else {
    setClientUser(user)
  }
}

/**
 * Đăng nhập tài khoản qua Backend API (/api/auth/login hoặc /api/auth/admin/login)
 * options:
 *   - requireAdmin: true (dành cho trang Admin Portal, chỉ xác thực trên bảng admins)
 *   - mặc định: dành cho trang Client, chỉ xác thực trên bảng users/customers
 */
export async function loginUser(username, password, options = {}) {
  const apiBaseUrl = getApiBaseUrl()
  const isAdmin = options.requireAdmin === true
  const portal = isAdmin ? 'ADMIN' : 'CLIENT'

  try {
    const endpoint = isAdmin ? `${apiBaseUrl}/api/auth/admin/login` : `${apiBaseUrl}/api/auth/login`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, portal }),
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        user: null,
        error: data.error || (isAdmin ? 'Tên đăng nhập hoặc mật khẩu không chính xác' : 'Email hoặc mật khẩu không chính xác'),
      }
    }

    if (isAdmin) {
      setAdminUser(data)
    } else {
      setClientUser(data)
    }
    return { user: data, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

/**
 * Đăng ký tài khoản khách hàng mới
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

    setClientUser(data)
    return { user: data, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

/**
 * Đăng xuất
 */
export function logoutClientUser() {
  setClientUser(null)
  try {
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {}
}

export function logoutAdminUser() {
  setAdminUser(null)
  try {
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {}
}

export function logoutUser() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    logoutAdminUser()
  } else {
    logoutClientUser()
  }
}

/**
 * Cập nhật thông tin tài khoản
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

    if (data.role === 'ADMIN' || data.role === 'STAFF') {
      setAdminUser(data)
    } else {
      setClientUser(data)
    }
    return { user: data, error: null }
  } catch {
    return { user: null, error: 'Không thể kết nối đến Backend Server (port 8080).' }
  }
}

