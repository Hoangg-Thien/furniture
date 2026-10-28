import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Armchair,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  Star,
  Link,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminProductManagement({ currentUser }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLowStock, setSelectedLowStock] = useState('ALL') // ALL | LOW_STOCK
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL | ACTIVE | INACTIVE
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null = create, obj = edit
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    unit: 'Bộ',
    sellingPrice: '',
    quantity: '10',
    description: '',
    imageUrl: '',
    isActive: true
  })
  const [productFormError, setProductFormError] = useState('')
  const [submittingProduct, setSubmittingProduct] = useState(false)

  // Gallery Modal
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [activeGalleryProduct, setActiveGalleryProduct] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
  const fileInputRef = useRef(null)

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const baseUrl = getApiBaseUrl()

  // 1. Tải danh mục nội thất để populate dropdown
  async function fetchCategories() {
    try {
      const res = await fetch(`${baseUrl}/api/admin/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data || [])
      }
    } catch (err) {
      console.warn('Không thể tải danh mục:', err)
    }
  }

  // 2. Tải danh sách sản phẩm
  async function fetchProducts(
    p = page,
    catId = selectedCategory,
    kw = searchKeyword,
    lowStock = selectedLowStock,
    status = selectedStatus
  ) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('page', p)
      params.append('size', pageSize)

      if (catId) params.append('categoryId', catId)
      if (kw?.trim()) params.append('search', kw.trim())
      if (lowStock === 'LOW_STOCK') params.append('lowStock', 'true')
      if (status && status !== 'ALL') params.append('status', status)

      const res = await fetch(`${baseUrl}/api/admin/products?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể tải danh sách sản phẩm`)
      }
      const data = await res.json()
      setProducts(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
      setPage(data.page || 0)
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchProducts(0)
  }, [])

  // Xử lý filter
  function handleFilterSubmit(e) {
    if (e) e.preventDefault()
    setPage(0)
    fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, selectedStatus)
  }

  function handleResetFilters() {
    setSearchKeyword('')
    setSelectedCategory('')
    setSelectedLowStock('ALL')
    setSelectedStatus('ALL')
    setPage(0)
    fetchProducts(0, '', '', 'ALL', 'ALL')
  }

  // 3. Mở Modal Thêm mới sản phẩm
  function openCreateModal() {
    setEditingProduct(null)
    setProductForm({
      name: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      unit: 'Bộ',
      sellingPrice: '',
      quantity: '10',
      description: '',
      imageUrl: '',
      isActive: true
    })
    setProductFormError('')
    setShowProductModal(true)
  }

  // 4. Mở Modal Sửa sản phẩm
  function openEditModal(prod) {
    setEditingProduct(prod)
    setProductForm({
      name: prod.name || '',
      categoryId: String(prod.categoryId || ''),
      unit: prod.unit || 'Bộ',
      sellingPrice: prod.sellingPrice ? String(prod.sellingPrice) : '',
      quantity: prod.quantity !== undefined ? String(prod.quantity) : '0',
      description: '',
      imageUrl: prod.imageUrl || '',
      isActive: prod.isActive !== false
    })
    setProductFormError('')
    setShowProductModal(true)

    // Tải thêm description chi tiết
    fetch(`${baseUrl}/api/admin/products/${prod.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail) => {
        if (detail) {
          setProductForm((prev) => ({
            ...prev,
            description: detail.description || ''
          }))
        }
      })
      .catch((err) => console.warn(err))
  }

  // 5. Submit Tạo / Cập nhật sản phẩm
  async function handleProductSubmit(e) {
    e.preventDefault()
    setProductFormError('')

    if (!productForm.name.trim()) {
      setProductFormError('Vui lòng nhập tên sản phẩm nội thất.')
      return
    }

    if (!productForm.categoryId) {
      setProductFormError('Vui lòng chọn loại nội thất.')
      return
    }

    const priceNum = parseFloat(productForm.sellingPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setProductFormError('Giá bán phải là số hợp lệ và lớn hơn hoặc bằng 0.')
      return
    }

    const qtyNum = parseInt(productForm.quantity, 10)
    if (isNaN(qtyNum) || qtyNum < 0) {
      setProductFormError('Số lượng tồn kho phải lớn hơn hoặc bằng 0.')
      return
    }

    setSubmittingProduct(true)
    try {
      const isEdit = Boolean(editingProduct)
      const url = isEdit
        ? `${baseUrl}/api/admin/products/${editingProduct.id}`
        : `${baseUrl}/api/admin/products`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name.trim(),
          categoryId: parseInt(productForm.categoryId, 10),
          unit: productForm.unit.trim(),
          sellingPrice: priceNum,
          quantity: qtyNum,
          description: productForm.description.trim() || null,
          imageUrl: productForm.imageUrl.trim() || null,
          isActive: productForm.isActive
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Lưu sản phẩm thất bại')
      }

      showToast(
        isEdit
          ? `Đã cập nhật sản phẩm "${data.name}" thành công!`
          : `Đã thêm mới sản phẩm "${data.name}" thành công!`,
        'success'
      )
      setShowProductModal(false)
      fetchProducts(page)
    } catch (err) {
      setProductFormError(err.message)
    } finally {
      setSubmittingProduct(false)
    }
  }

  // 6. Đổi trạng thái Ẩn / Hiện bán
  async function handleToggleStatus(prod) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/products/${prod.id}/toggle-status`, {
        method: 'PUT'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi đổi trạng thái')

      showToast(data.message, 'success')
      fetchProducts(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // 7. Mở Modal Quản lý Album ảnh
  async function openGalleryModal(prod) {
    setActiveGalleryProduct(prod)
    setShowGalleryModal(true)
    setGalleryLoading(true)
    setNewImageUrl('')

    try {
      const res = await fetch(`${baseUrl}/api/admin/products/${prod.id}`)
      if (res.ok) {
        const detail = await res.json()
        setGalleryImages(detail.images || [])
      }
    } catch (err) {
      console.warn(err)
    } finally {
      setGalleryLoading(false)
    }
  }

  // 8. Upload files ảnh
  async function handleFileUpload(e) {
    const files = e.target.files
    if (!files || files.length === 0 || !activeGalleryProduct) return

    setUploadingFiles(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const res = await fetch(`${baseUrl}/api/admin/products/${activeGalleryProduct.id}/images`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload ảnh thất bại')

      setGalleryImages(data || [])
      showToast(`Đã tải lên ${files.length} ảnh vào album!`, 'success')
      fetchProducts(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 9. Thêm ảnh bằng URL trực tiếp
  async function handleAddImageUrl(e) {
    e.preventDefault()
    if (!newImageUrl.trim() || !activeGalleryProduct) return

    setAddingUrl(true)
    try {
      const res = await fetch(`${baseUrl}/api/admin/products/${activeGalleryProduct.id}/images/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: newImageUrl.trim() })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Thêm link ảnh thất bại')

      setGalleryImages(data || [])
      setNewImageUrl('')
      showToast('Đã thêm liên kết ảnh mới vào album!', 'success')
      fetchProducts(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setAddingUrl(false)
    }
  }

  // 10. Đặt làm ảnh đại diện chính (Primary)
  async function handleSetPrimary(imageId) {
    if (!activeGalleryProduct) return
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/products/${activeGalleryProduct.id}/images/${imageId}/set-primary`,
        { method: 'PUT' }
      )
      if (!res.ok) throw new Error('Không thể đổi ảnh chính')

      // Cập nhật lại list ảnh cục bộ
      setGalleryImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === imageId
        }))
      )
      showToast('Đã đặt làm ảnh đại diện chính!', 'success')
      fetchProducts(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // 11. Xóa ảnh khỏi album
  async function handleDeleteImage(imageId) {
    if (!activeGalleryProduct) return
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/products/${activeGalleryProduct.id}/images/${imageId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Không thể xóa ảnh')

      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId))
      showToast('Đã xóa ảnh khỏi album', 'success')
      fetchProducts(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Định dạng tiền tệ VNĐ
  function formatVND(amount) {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumbs">
            <span>Trang chủ</span>
            <span className="crumb-sep">/</span>
            <span>Kho & Chuỗi Cung Ứng</span>
            <span className="crumb-sep">/</span>
            <span className="current">Quản lý Sản phẩm & Album Ảnh</span>
          </div>
          <h1 className="admin-page-title">Sản Phẩm Nội Thất & Album Đa Góc</h1>
          <p className="admin-page-desc">
            Quản trị kho hàng nội thất cao cấp, đơn giá, kiểm soát tồn kho và thư viện ảnh phối cảnh đa góc
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Thêm sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        {/* Search */}
        <form onSubmit={handleFilterSubmit} className="admin-search-wrap" style={{ minWidth: '280px', flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên sản phẩm, kích thước..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button type="button" className="search-clear-btn" onClick={() => setSearchKeyword('')}>
              <X size={14} />
            </button>
          )}
        </form>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Loại:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.84rem', background: '#FFFFFF' }}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              fetchProducts(0, e.target.value, searchKeyword, selectedLowStock, selectedStatus)
            }}
          >
            <option value="">Tất cả loại ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Tồn kho:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.84rem', background: '#FFFFFF' }}
            value={selectedLowStock}
            onChange={(e) => {
              setSelectedLowStock(e.target.value)
              fetchProducts(0, selectedCategory, searchKeyword, e.target.value, selectedStatus)
            }}
          >
            <option value="ALL">Tất cả mức tồn</option>
            <option value="LOW_STOCK">⚠️ Sắp hết hàng (&lt; 5)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Trạng thái:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.84rem', background: '#FFFFFF' }}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, e.target.value)
            }}
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang mở bán</option>
            <option value="INACTIVE">Đã tạm ẩn</option>
          </select>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={handleResetFilters}
          title="Xóa toàn bộ bộ lọc"
        >
          <span>Đặt lại</span>
        </button>

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => fetchProducts(page)}
          disabled={loading}
          title="Làm mới bảng"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="admin-table-card">
        {error && (
          <div className="admin-alert-banner error" style={{ margin: '16px 20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Ảnh</th>
                <th style={{ minWidth: '240px' }}>Tên sản phẩm nội thất</th>
                <th style={{ width: '150px' }}>Loại nội thất</th>
                <th style={{ width: '80px', textAlign: 'center' }}>ĐVT</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Giá niêm yết</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Tồn kho</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ width: '190px', textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-loading-cell">
                    <RefreshCw size={24} className="spin" />
                    <p>Đang tải danh sách sản phẩm nội thất...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-empty-cell">
                    <Armchair size={36} color="var(--admin-text-muted)" />
                    <p>Không tìm thấy sản phẩm nội thất nào phù hợp</p>
                    <button className="admin-btn admin-btn-secondary" onClick={handleResetFilters}>
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.quantity !== undefined && p.quantity < 5
                  const isActive = p.isActive !== false

                  return (
                    <tr key={p.id}>
                      {/* ID */}
                      <td style={{ color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                        #{p.id}
                      </td>

                      {/* Thumbnail Image */}
                      <td style={{ textAlign: 'center' }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="product-thumb-img"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className="product-thumb-placeholder"
                          style={{ display: p.imageUrl ? 'none' : 'flex' }}
                        >
                          <Armchair size={18} />
                        </div>
                      </td>

                      {/* Name */}
                      <td>
                        <span className="product-title-text">{p.name}</span>
                        {!isActive && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                            (Tạm ẩn khỏi showroom)
                          </span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className="product-cat-pill">
                          {p.categoryName || 'Chưa phân loại'}
                        </span>
                      </td>

                      {/* Unit */}
                      <td style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                        {p.unit || 'Bộ'}
                      </td>

                      {/* Selling Price */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-accent)', fontSize: '0.94rem' }}>
                        {formatVND(p.sellingPrice)}
                      </td>

                      {/* Stock Quantity */}
                      <td style={{ textAlign: 'center' }}>
                        {isLow ? (
                          <span className="stock-pill low" title="Cảnh báo: Sản phẩm sắp hết hàng!">
                            <AlertTriangle size={12} />
                            <strong>{p.quantity}</strong> (Sắp hết)
                          </span>
                        ) : (
                          <span className="stock-pill normal">
                            <strong>{p.quantity}</strong> {p.unit || 'chiếc'}
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td style={{ textAlign: 'center' }}>
                        {isActive ? (
                          <span className="admin-status-pill active">
                            <span className="status-dot green"></span>
                            Đang bán
                          </span>
                        ) : (
                          <span className="admin-status-pill inactive">
                            <span className="status-dot red"></span>
                            Tạm ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* Album ảnh */}
                          <button
                            className="table-action-btn edit"
                            style={{ borderColor: '#60A5FA', color: '#2563EB', background: '#EFF6FF' }}
                            onClick={() => openGalleryModal(p)}
                            title="Quản lý Album thư viện ảnh đa góc chụp"
                          >
                            <ImageIcon size={14} />
                            <span>Ảnh</span>
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            className="table-action-btn edit"
                            onClick={() => openEditModal(p)}
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit2 size={14} />
                            <span>Sửa</span>
                          </button>

                          {/* Ẩn / Hiện */}
                          <button
                            className={`table-action-btn ${isActive ? 'lock' : 'unlock'}`}
                            onClick={() => handleToggleStatus(p)}
                            title={isActive ? 'Tạm ẩn sản phẩm' : 'Mở bán lại sản phẩm'}
                          >
                            {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{isActive ? 'Ẩn' : 'Hiện'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="admin-pagination-footer">
          <span className="pagination-info">
            Hiển thị <strong>{products.length}</strong> trên tổng số <strong>{totalElements}</strong> sản phẩm
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => {
                const prev = page - 1
                setPage(prev)
                fetchProducts(prev)
              }}
              disabled={page <= 0 || loading}
            >
              &lt; Trước
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let pageNum = page - 2 + idx
              if (pageNum < 0) pageNum = idx
              if (pageNum >= totalPages) return null

              return (
                <button
                  key={pageNum}
                  className={`page-num-btn ${pageNum === page ? 'active' : ''}`}
                  onClick={() => {
                    setPage(pageNum)
                    fetchProducts(pageNum)
                  }}
                  disabled={loading}
                >
                  {pageNum + 1}
                </button>
              )
            })}

            <button
              className="page-btn"
              onClick={() => {
                const next = page + 1
                setPage(next)
                fetchProducts(next)
              }}
              disabled={page >= totalPages - 1 || loading}
            >
              Sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: THÊM MỚI / CHỈNH SỬA SẢN PHẨM NỘI THẤT
          ==================================================================== */}
      {showProductModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="admin-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <Armchair size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingProduct ? 'Chỉnh Sửa Sản Phẩm Nội Thất' : 'Thêm Sản Phẩm Nội Thất Mới'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingProduct ? `Cập nhật thông tin cho sản phẩm #${editingProduct.id}` : 'Nhập thông tin sản phẩm và định giá'}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowProductModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="admin-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {productFormError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{productFormError}</span>
                  </div>
                )}

                {/* Tên sản phẩm */}
                <div className="form-group">
                  <label className="form-label">
                    Tên sản phẩm nội thất <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Sofa Da Bò Ý Nhập Khẩu Góc Chữ L, Bàn Ăn Gỗ Sồi Bắc Âu 6 Ghế..."
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-grid-2">
                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">
                      Loại nội thất <span className="req">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn loại nội thất --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="form-group">
                    <label className="form-label">Đơn vị tính</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: Bộ, Chiếc, Cái, Bộ 6 ghế..."
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  {/* Selling Price */}
                  <div className="form-group">
                    <label className="form-label">
                      Giá niêm yết (VNĐ) <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      step="1000"
                      className="form-input"
                      placeholder="VD: 15500000"
                      value={productForm.sellingPrice}
                      onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                      required
                    />
                    <small className="form-hint">
                      {productForm.sellingPrice ? formatVND(productForm.sellingPrice) : 'Nhập đơn giá bán chính thức'}
                    </small>
                  </div>

                  {/* Stock Quantity */}
                  <div className="form-group">
                    <label className="form-label">
                      Số lượng tồn kho ban đầu <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="VD: 10"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required
                    />
                    <small className="form-hint">Dưới 5 chiếc hệ thống sẽ tự động kích hoạt cảnh báo sắp hết.</small>
                  </div>
                </div>

                {/* Default Image URL */}
                <div className="form-group">
                  <label className="form-label">Đường dẫn ảnh đại diện chính (URL)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/sofa-leather.jpg (hoặc tải album ảnh sau)"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  />
                  <small className="form-hint">Bạn cũng có thể tải nhiều ảnh trực tiếp qua chức năng "Album ảnh" bên ngoài.</small>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Mô tả sản phẩm, thông số kích thước & vật liệu</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="VD: Kích thước: Dài 280 x Rộng 160 x Cao 85cm. Chất liệu: Da bò nguyên tấm nhập khẩu Ý, khung gỗ thông đã qua sấy chống mối mọt, đệm mút cao cấp D40 đàn hồi cao..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                {/* Active Checkbox */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Kích hoạt mở bán công khai ngay trên website</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowProductModal(false)}
                  disabled={submittingProduct}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submittingProduct}
                >
                  {submittingProduct ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Lưu cập nhật' : 'Tạo sản phẩm'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: QUẢN LÝ THƯ VIỆN ALBUM ẢNH ĐA GÓC CHỤP (GALLERY MODAL)
          ==================================================================== */}
      {showGalleryModal && activeGalleryProduct && (
        <div className="admin-modal-backdrop" onClick={() => setShowGalleryModal(false)}>
          <div className="admin-modal-card large" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Album Hình Ảnh Đa Góc Chụp</h3>
                  <p className="modal-subtitle">
                    Sản phẩm: <strong>{activeGalleryProduct.name}</strong> (#{activeGalleryProduct.id})
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowGalleryModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Box tải ảnh lên */}
              <div className="gallery-upload-zone">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={32} color="var(--admin-accent)" />
                  <strong style={{ fontSize: '0.94rem', color: 'var(--admin-primary)' }}>
                    Tải nhiều ảnh từ máy tính (Phối cảnh, chất liệu, bản vẽ kích thước...)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                    Hỗ trợ định dạng JPG, PNG, WEBP. Chọn nhiều ảnh cùng lúc.
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    style={{ marginTop: '6px' }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={uploadingFiles}
                  >
                    {uploadingFiles ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        <span>Đang tải ảnh lên máy chủ...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={15} />
                        <span>Chọn tệp ảnh từ máy tính</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hoặc thêm bằng URL */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--admin-border)', width: '100%' }}>
                  <form onSubmit={handleAddImageUrl} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Hoặc dán đường link URL ảnh trực tiếp (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="admin-btn admin-btn-secondary"
                      disabled={addingUrl || !newImageUrl.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {addingUrl ? <RefreshCw size={14} className="spin" /> : <Link size={14} />}
                      <span>Thêm URL</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Lưới các ảnh trong album */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--admin-primary)' }}>
                    Các góc ảnh hiện có ({galleryImages.length} ảnh):
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                    * Nhấp vào biểu tượng ngôi sao ⭐ để chọn làm ảnh đại diện chính.
                  </span>
                </div>

                {galleryLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-muted)' }}>
                    <RefreshCw size={24} className="spin" />
                    <p style={{ marginTop: '8px', fontSize: '0.86rem' }}>Đang tải album ảnh...</p>
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div className="gallery-empty-state">
                    <ImageIcon size={36} color="var(--admin-text-muted)" />
                    <p>Chưa có hình ảnh nào trong album sản phẩm này.</p>
                  </div>
                ) : (
                  <div className="gallery-grid">
                    {galleryImages.map((img) => (
                      <div key={img.id} className={`gallery-item-card ${img.isPrimary ? 'primary' : ''}`}>
                        <img src={img.imageUrl} alt="Góc chụp" className="gallery-img" />

                        {/* Primary Badge */}
                        {img.isPrimary && (
                          <div className="primary-photo-badge" title="Ảnh đại diện chính">
                            <Star size={12} fill="#FFFFFF" />
                            <span>Ảnh chính</span>
                          </div>
                        )}

                        {/* Action Overlay */}
                        <div className="gallery-item-actions">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              className="gallery-action-btn make-primary"
                              onClick={() => handleSetPrimary(img.id)}
                              title="Đặt làm ảnh đại diện chính"
                            >
                              <Star size={13} />
                              <span>Chọn ảnh chính</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="gallery-action-btn delete"
                            onClick={() => handleDeleteImage(img.id)}
                            title="Xóa ảnh này khỏi album"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowGalleryModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
