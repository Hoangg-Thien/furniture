import { getApiBaseUrl } from './apiConfig'

const CACHE_KEY = 'furniture_cached_products'

/**
 * Tải danh sách sản phẩm từ Backend API với cơ chế tự động cache và fallback
 */
export async function loadProducts() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}/api/products`)
    if (!response.ok) throw new Error(`Product API returned ${response.status}`)

    const rows = await response.json()
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped = rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category ?? 'Khác',
        price: Number(row.price),
        badge: '',
        image: row.imageUrl || '',
      }))

      // Lưu vào cache để nếu mạng chập chờn thì app vẫn luôn hiển thị sản phẩm
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
      } catch {
        // Bỏ qua lỗi quota
      }

      return { products: mapped, error: null }
    }
    throw new Error('Danh sách sản phẩm trống')
  } catch (error) {
    console.warn('Lỗi kết nối Backend products, đang kiểm tra cache...', error)

    // Fallback 1: Lấy từ cache localStorage nếu đã từng tải thành công
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { products: parsed, error }
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Fallback 2: Danh sách mặc định từ hệ thống để giao diện không bao giờ bị trắng trơn
    return {
      products: DEFAULT_PRODUCTS,
      error,
    }
  }
}

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Sofa góc chữ L vải bọc Milan', category: 'Sofa và ghế thư giãn', price: 14500000, badge: '', image: '/images/sofa_goc_chu_L.jpg' },
  { id: 2, name: 'Sofa băng 3 chỗ da PU Oslo', category: 'Sofa và ghế thư giãn', price: 9800000, badge: '', image: '/images/sofa_bang3.jpg' },
  { id: 3, name: 'Ghế thư giãn bập bênh Relax', category: 'Sofa và ghế thư giãn', price: 4200000, badge: '', image: '/images/ghe-thu-gian.jpg' },
  { id: 4, name: 'Bàn ăn gỗ cao su 6 chỗ Nordic', category: 'Bàn ăn', price: 6500000, badge: '', image: '/images/ban_an_6_cho.jpg' },
  { id: 5, name: 'Bàn ăn mặt đá ceramic 4 chỗ Venus', category: 'Bàn ăn', price: 7800000, badge: '', image: '/images/ban_an_mat_da.jpg' },
  { id: 6, name: 'Ghế ăn gỗ sồi đệm bọc Luna', category: 'Ghế ăn và ghế bar', price: 850000, badge: '', image: '/images/ghe_an_go_soi.jpg' },
  { id: 7, name: 'Ghế bar chân sắt Loft', category: 'Ghế ăn và ghế bar', price: 1200000, badge: '', image: '/images/ghe_bar.jpg' },
  { id: 8, name: 'Giường ngủ gỗ sồi 1m8 Hana', category: 'Giường ngủ', price: 8900000, badge: '', image: '/images/giuong_go_soi.jpg' },
  { id: 9, name: 'Giường bọc nệm 1m6 Royal', category: 'Giường ngủ', price: 7200000, badge: '', image: '/images/giuong_boc_nem.jpg' },
  { id: 10, name: 'Tủ quần áo 3 cánh gỗ MDF Alice', category: 'Tủ quần áo và tủ giày', price: 6800000, badge: '', image: '/images/tu_mdf.jpg' },
  { id: 11, name: 'Tủ giày thông minh 5 tầng', category: 'Tủ quần áo và tủ giày', price: 2400000, badge: '', image: '/images/tu_5_tang.jpg' },
  { id: 12, name: 'Bàn làm việc chân sắt 1m2 Office', category: 'Bàn và ghế văn phòng', price: 1900000, badge: '', image: '/images/ban_sat_office.jpg' },
  { id: 13, name: 'Ghế công thái học Ergo', category: 'Bàn và ghế văn phòng', price: 3600000, badge: '', image: '/images/ghe_ergo.jpg' },
  { id: 14, name: 'Kệ sách gỗ 5 tầng Bookie', category: 'Kệ sách và kệ tivi', price: 2100000, badge: '', image: '/images/ke_5_tang.jpg' },
  { id: 15, name: 'Kệ tivi gỗ óc chó 1m8 Nova', category: 'Kệ sách và kệ tivi', price: 3200000, badge: '', image: '/images/ke_nova.jpg' },
  { id: 16, name: 'Đèn chùm pha lê 8 bóng', category: 'Đèn trang trí', price: 5400000, badge: '', image: '/images/den_8_bong.jpg' },
  { id: 17, name: 'Đèn sàn thông trụ Arc', category: 'Đèn trang trí', price: 1350000, badge: '', image: '/images/den_tru_erc.jpg' },
  { id: 18, name: 'Thảm lông ngắn phòng khách 2x3m', category: 'Thảm và rèm cửa', price: 2800000, badge: '', image: '/images/tham_long_ngan.jpg' },
  { id: 19, name: 'Rèm cửa vải chống nắng 2.4m', category: 'Thảm và rèm cửa', price: 1650000, badge: '', image: '/images/rem_chong_nang.jpg' },
  { id: 20, name: 'Nệm cao su non 1m6 Dreamy', category: 'Nệm và phụ kiện giường', price: 5900000, badge: '', image: '/images/nem_cao_su.jpg' },
]
