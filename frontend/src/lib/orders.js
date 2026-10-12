const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

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
  items,
}) {
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
        items,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        order: null,
        error: data.error || 'Đặt hàng thất bại từ hệ thống backend.',
      }
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
