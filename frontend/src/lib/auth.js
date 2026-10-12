const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

const SESSION_USER_KEY = 'furniture_logged_in_user'

/**
 * Lấy thông tin tài khoản hiện đang đăng nhập từ Session LocalStorage
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_USER_KEY)
  }
}

/**
 * Đăng nhập: Gọi trực tiếp Backend API (/api/auth/login)
 * Backend kiểm tra trong bảng "users" và "customers" của sales.sql
 */
export async function loginUser(username, password) {
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

    setCurrentUser(data)
    return { user: data, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

/**
 * Đăng ký tài khoản: Gọi trực tiếp Backend API (/api/auth/register)
 * Backend sẽ lưu thông tin trực tiếp vào bảng "users" và "customers" trong database sales.sql
 */
export async function registerUser({ username, password, fullName, email, phone, address }) {
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

    setCurrentUser(data)
    return { user: data, error: null }
  } catch (err) {
    return {
      user: null,
      error: 'Không thể kết nối đến Backend Server (port 8080). Vui lòng kiểm tra backend.',
    }
  }
}

/**
 * Đăng xuất tài khoản
 */
export function logoutUser() {
  setCurrentUser(null)
}
