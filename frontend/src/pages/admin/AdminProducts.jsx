import React, { useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react'
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminProducts({ showToast }) {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalMode, setModalMode] = useState(null) // 'VIEW', 'CREATE', 'EDIT'

  // Form State
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState(MOCK_CATEGORIES[0]?.name || '')
  const [formBasePrice, setFormBasePrice] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formDesc, setFormDesc] = useState('')

  // Filter
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  function handleOpenCreate() {
    setFormName('')
    setFormCategory(MOCK_CATEGORIES[0]?.name || '')
    setFormBasePrice('')
    setFormCostPrice('')
    setFormStock('')
    setFormDesc('')
    setModalMode('CREATE')
  }

  function handleSaveProduct(e) {
    e.preventDefault()
    if (!formName || !formBasePrice) {
      alert('Vui lòng điền đủ Tên và Giá bán niêm yết')
      return
    }

    const newProd = {
      id: Date.now(),
      code: `FURN-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: formName,
      category: formCategory,
      basePrice: Number(formBasePrice),
      costPrice: Number(formCostPrice) || Number(formBasePrice) * 0.6,
      totalStock: Number(formStock) || 10,
      status: 'ACTIVE',
      image: '/images/sofa_goc_chu_L.jpg',
      description: formDesc || 'Sản phẩm nội thất thiết kế cao cấp độc quyền từ FurniStore.',
      variants: [
        { id: Date.now() + 1, sku: 'VAR-01', color: 'Tiêu chuẩn', material: 'Gỗ sồi', dimension: 'Tiêu chuẩn', price: Number(formBasePrice), stock: Number(formStock) || 10 }
      ],
    }

    setProducts([newProd, ...products])
    setModalMode(null)
    showToast(`Đã thêm thành công sản phẩm "${formName}"!`)
  }

  function handleDelete(id, name) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      setProducts(products.filter((p) => p.id !== id))
      showToast(`Đã xóa sản phẩm "${name}".`)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Sản phẩm & Biến thể Nội thất</h1>
          <p className="admin-page-subtitle">
            Danh mục sản phẩm, biến thể (kích thước, chất liệu, màu sơn) và kiểm soát tồn kho theo thời gian thực.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm theo tên sản phẩm hoặc mã sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Filter size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <select
                className="admin-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">Tất cả danh mục ({products.length})</option>
                {MOCK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh & Mã</th>
                <th>Tên Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Giá Bán Niêm Yết</th>
                <th>Số Biến Thể</th>
                <th>Tổng Tồn Kho</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: '#1E293B' }}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80' }}
                      />
                      <div>
                        <code style={{ color: '#F59E0B', fontSize: '12px' }}>{p.code}</code>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#FFF' }}>
                    {p.name}
                  </td>
                  <td>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{p.category}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#FBBF24' }}>
                    {formatCurrency(p.basePrice)}
                  </td>
                  <td>
                    <span className="admin-badge info" style={{ fontSize: '11px' }}>
                      <Layers size={12} /> {p.variants?.length || 1} biến thể
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.totalStock < 6 ? 'danger' : 'success'}`}>
                      {p.totalStock} chiếc
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge success">
                      <CheckCircle size={12} /> Đang Bán
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px' }}
                        title="Xem chi tiết biến thể"
                        onClick={() => {
                          setSelectedProduct(p)
                          setModalMode('VIEW')
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px', color: '#EF4444' }}
                        title="Xóa"
                        onClick={() => handleDelete(p.id, p.name)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Details / Variants */}
      {modalMode === 'VIEW' && selectedProduct && (
        <div className="admin-modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Chi Tiết Biến Thể & Kho: {selectedProduct.name}
              </h3>
              <button className="admin-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80' }}
                />
                <div>
                  <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600 }}>{selectedProduct.code} · {selectedProduct.category}</div>
                  <h4 style={{ margin: '4px 0 8px 0', fontSize: '18px', color: '#FFF' }}>{selectedProduct.name}</h4>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                    {selectedProduct.description}
                  </p>
                </div>
              </div>

              <h4 style={{ color: '#FFF', margin: '16px 0 8px 0', fontSize: '15px' }}>
                Danh Sách Biến Thể & Số Lượng Tồn Kho (Product Variants):
              </h4>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã SKU</th>
                      <th>Màu Sắc</th>
                      <th>Chất Liệu</th>
                      <th>Kích Thước</th>
                      <th>Giá Bán</th>
                      <th>Tồn Kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.variants?.map((v) => (
                      <tr key={v.id}>
                        <td><code style={{ color: '#F59E0B' }}>{v.sku}</code></td>
                        <td>{v.color}</td>
                        <td>{v.material}</td>
                        <td>{v.dimension}</td>
                        <td style={{ fontWeight: 700, color: '#FFF' }}>{formatCurrency(v.price)}</td>
                        <td>
                          <span className={`admin-badge ${v.stock < 4 ? 'danger' : 'success'}`}>
                            {v.stock} chiếc
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)}>
                Đóng
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  showToast(`Đã lưu cấu hình biến thể cho "${selectedProduct.name}"!`)
                  setModalMode(null)
                }}
              >
                Cập Nhật Tồn Kho Biến Thể
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Product */}
      {modalMode === 'CREATE' && (
        <div className="admin-modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Thêm Sản Phẩm Nội Thất Mới</h3>
              <button className="admin-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Sofa nỉ phong cách Bắc Âu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Loại / Danh Mục Nội Thất *</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                      {MOCK_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Số Lượng Tồn Kho Khởi Tạo *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="VD: 15"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Giá Bán Niêm Yết (VNĐ) *</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      required
                      placeholder="VD: 12500000"
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Giá Vốn Nhập Kho (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      placeholder="VD: 7500000"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Mô Tả Chi Tiết & Chất Liệu</label>
                  <textarea
                    rows="3"
                    placeholder="Kích thước tiêu chuẩn, chất liệu gỗ sồi tự nhiên, bảo hành..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
