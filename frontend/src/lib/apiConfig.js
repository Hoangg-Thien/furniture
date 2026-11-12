/**
 * Quản lý Base URL kết nối đến máy chủ Backend Spring Boot
 * - Tự động ưu tiên cấu hình do người dùng lưu trong localStorage (furniture_custom_api_url)
 * - Tiếp theo lấy từ biến môi trường VITE_API_BASE_URL (.env)
 * - Fallback mặc định: http://localhost:8080
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('furniture_custom_api_url')
      // Nếu trong localStorage lưu link ngrok cũ, tự động xóa để chuyển về localhost theo yêu cầu
      if (custom && custom.includes('ngrok')) {
        localStorage.removeItem('furniture_custom_api_url')
      } else if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, '')
      }
    } catch { /* Browser storage may be blocked; use the configured backend. */ }
  }

  const envUrl = import.meta.env?.VITE_API_BASE_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }

  // Mặc định kết nối trực tiếp Backend Localhost cổng 8080
  return 'http://localhost:8080'
}

export function setCustomApiBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('furniture_custom_api_url', url.trim().replace(/\/+$/, ''))
    } else {
      localStorage.removeItem('furniture_custom_api_url')
    }
  }
}

/**
 * Trả về headers tiêu chuẩn cho các API request (tự động đính kèm ngrok-skip-browser-warning để tránh trang cảnh báo nếu dùng ngrok sau này)
 */
export function getApiHeaders(extraHeaders = {}) {
  return {
    'ngrok-skip-browser-warning': 'true',
    ...extraHeaders,
  }
}

// Tự động can thiệp vào fetch toàn cục để đảm bảo mọi request tới ngrok luôn có header ngrok-skip-browser-warning khi dùng ngrok
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async function (resource, init = {}) {
    let target
    let authenticatedAdminRequest = false
    let customerRequest = false
    try { target = new URL(typeof resource === 'string' || resource instanceof URL ? resource : resource.url, window.location.href) } catch {}
    if (target) {
      const api = new URL(getApiBaseUrl(), window.location.href)
      const apiPath = target.pathname.slice(api.pathname.replace(/\/$/, '').length)
      customerRequest = /^\/api\/(orders(?:\/|$)|auth\/(me|update\/))/.test(apiPath)
      if (target.origin === api.origin && target.pathname.startsWith(api.pathname.replace(/\/$/, '') + '/api/')
          && (customerRequest || apiPath.startsWith('/api/admin/') || apiPath.startsWith('/api/auth/admin/')
            || /^\/api\/auth\/(users|customers)$/.test(apiPath) || apiPath.startsWith('/api/vouchers'))) {
        let user
        try { user = JSON.parse(localStorage.getItem(customerRequest ? 'furniture_customer_user' : 'furniture_admin_user') || 'null') } catch {}
        if (user?.accessToken && user.apiBaseUrl === getApiBaseUrl()) {
          const headers = new Headers(init?.headers || (typeof resource === 'object' && resource?.headers) || {})
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${user.accessToken}`)
          init = { ...init, headers }
          authenticatedAdminRequest = !customerRequest
        }
      } else customerRequest = false
    }
    try {
      const url = typeof resource === 'string' ? resource : resource?.url || ''
      if (url.includes('ngrok') || url.includes('loca.lt')) {
        const headers = new Headers(init?.headers || (typeof resource === 'object' && resource?.headers) || {})
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', 'true')
        }
        init = { ...init, headers }
      }
    } catch {
      // Bỏ qua nếu có lỗi xử lý header, tiếp tục gọi fetch gốc
    }
    const response = await originalFetch(resource, init)
    if (authenticatedAdminRequest && response.status === 401 && target?.pathname.includes('/api/admin/')) {
      window.dispatchEvent(new Event('admin-session-expired'))
    }
    if (customerRequest && response.status === 401) window.dispatchEvent(new Event('customer-session-expired'))
    return response
  }
}
