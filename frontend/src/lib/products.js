export const demoProducts = [
  {
    id: 1,
    name: 'Sofa Mây Đan',
    category: 'Ghế & sofa',
    price: 12800000,
    oldPrice: 14900000,
    badge: 'Bán chạy',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 2,
    name: 'Ghế thư giãn Lúa',
    category: 'Ghế & sofa',
    price: 6750000,
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 3,
    name: 'Bàn trà Sồi Tròn',
    category: 'Bàn',
    price: 4200000,
    oldPrice: 4900000,
    badge: '',
    image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 4,
    name: 'Đèn bàn Nắng Mai',
    category: 'Đèn',
    price: 1850000,
    badge: 'Bán chạy',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 5,
    name: 'Ghế ăn Gỗ Cong',
    category: 'Ghế & sofa',
    price: 2950000,
    badge: '',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 6,
    name: 'Bàn bên Mộc',
    category: 'Bàn',
    price: 2350000,
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=900&q=85&sat=-25',
  },
  {
    id: 7,
    name: 'Bình gốm Đất',
    category: 'Trang trí',
    price: 890000,
    badge: '',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 8,
    name: 'Đèn thả Mây',
    category: 'Đèn',
    price: 3150000,
    badge: '',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85&sat=-40',
  },
]

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

export async function loadProducts() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/products`)
    if (!response.ok) throw new Error(`Product API returned ${response.status}`)

    const rows = await response.json()
    return {
      products: rows.map((row, index) => ({
        id: row.id,
        name: row.name,
        category: row.category ?? 'Khác',
        price: Number(row.price),
        badge: '',
        image: row.imageUrl || demoProducts[index % demoProducts.length].image,
      })),
      error: null,
    }
  } catch (error) {
    return { products: demoProducts, error }
  }
}
