const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

/**
 * Tải danh sách sản phẩm trực tiếp từ Backend API (được lấy từ file sales.sql)
 */
export async function loadProducts() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/products`)
    if (!response.ok) throw new Error(`Product API returned ${response.status}`)

    const rows = await response.json()
    return {
      products: rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category ?? 'Khác',
        price: Number(row.price),
        badge: '',
        image: row.imageUrl || '',
      })),
      error: null,
    }
  } catch (error) {
    return { products: [], error }
  }
}
