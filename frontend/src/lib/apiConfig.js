/**
 * Quản lý Base URL kết nối đến máy chủ Backend Spring Boot
 * - Tự động ưu tiên cấu hình do người dùng lưu trong localStorage (furniture_custom_api_url)
 * - Tiếp theo lấy từ VITE_API_BASE_URL (ngrok URL)
 * - Fallback mặc định: https://lionel-noisome-rurally.ngrok-free.dev
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('furniture_custom_api_url')
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '')
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }

  // Fallback mặc định về ngrok link của bạn
  return 'https://lionel-noisome-rurally.ngrok-free.dev'
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
 * Trả về headers tiêu chuẩn cho các API request (tự động đính kèm ngrok-skip-browser-warning để tránh trang cảnh báo của ngrok free)
 */
export function getApiHeaders(extraHeaders = {}) {
  return {
    'ngrok-skip-browser-warning': 'true',
    ...extraHeaders,
  }
}

// Tự động can thiệp vào fetch toàn cục để đảm bảo mọi request tới ngrok luôn có header ngrok-skip-browser-warning
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async function (resource, init = {}) {
    try {
      const url = typeof resource === 'string' ? resource : resource?.url || ''
      if (url.includes('ngrok') || url.includes('loca.lt')) {
        const headers = new Headers(init?.headers || (typeof resource === 'object' && resource?.headers) || {})
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', 'true')
        }
        return originalFetch(resource, { ...init, headers })
      }
    } catch {
      // Bỏ qua nếu có lỗi xử lý header, tiếp tục gọi fetch gốc
    }
    return originalFetch(resource, init)
  }
}
