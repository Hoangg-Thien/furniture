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

  // Computed KPI statistics
  const productStats = useMemo(() => {
    let lowStock = 0
    let active = 0
    let inactive = 0
    products.forEach((p) => {
      if (p.quantity !== undefined && p.quantity < 5) lowStock++
      if (p.isActive !== false) active++
      else inactive++
    })
    return {
      total: totalElements || products.length,
      lowStock,
      active,
      inactive,
      categoryCount: categories.length
    }
  }, [products, totalElements, categories])

  return (
    <div className="admin-module-view">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} type="button">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Kho &amp; Chuỗi Cung Ứng &gt; <span>Quản lý Sản phẩm &amp; Album Ảnh</span>
          </div>
          <h1 className="admin-page-title">Sản Phẩm Nội Thất &amp; Album Đa Góc</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Quản trị kho hàng nội thất cao cấp, đơn giá, kiểm soát tồn kho và thư viện ảnh phối cảnh đa góc.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => fetchProducts(page)}
            disabled={loading}
            title="Làm mới danh sách sản phẩm"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-accent"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>+ Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card card-total">
          <div className="inv-stat-icon" style={{ background: '#EFF6FF', color: '#0284C7' }}>
            <Armchair size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng sản phẩm</span>
            <h3 className="inv-stat-value">{productStats.total} <span className="inv-stat-unit">mẫu</span></h3>
            <span className="inv-stat-sub" style={{ color: '#0284C7', fontWeight: 600 }}>
              <Layers size={13} /> {productStats.categoryCount} danh mục đang quản lý
            </span>
          </div>
        </div>

        <div
          className="inv-stat-card card-pos"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const nextStock = selectedLowStock === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK'
            setSelectedLowStock(nextStock)
            fetchProducts(0, selectedCategory, searchKeyword, nextStock, selectedStatus)
          }}
          title="Bấm để lọc nhanh sản phẩm sắp hết hàng"
        >
          <div className="inv-stat-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Cảnh báo tồn kho thấp</span>
            <h3 className="inv-stat-value" style={{ color: '#DC2626' }}>
              {productStats.lowStock} <span className="inv-stat-unit">sản phẩm</span>
            </h3>
            <span className="inv-stat-sub" style={{ color: '#DC2626', fontWeight: 600 }}>
              {selectedLowStock === 'LOW_STOCK' ? '✓ Đang lọc (< 5 chiếc)' : 'Tồn kho dưới 5 chiếc'}
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-revenue">
          <div className="inv-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Đang mở bán</span>
            <h3 className="inv-stat-value text-emerald">{productStats.active} <span className="inv-stat-unit">sản phẩm</span></h3>
            <span className="inv-stat-sub" style={{ color: '#059669', fontWeight: 600 }}>
              Hiển thị công khai trên website
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-vietqr">
          <div className="inv-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <EyeOff size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tạm ẩn showroom</span>
            <h3 className="inv-stat-value">{productStats.inactive} <span className="inv-stat-unit">mẫu</span></h3>
            <span className="inv-stat-sub" style={{ color: '#78716C' }}>
              Tạm ngưng phân phối
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar Tìm Kiếm & Bộ Lọc Chuẩn */}
      <div className="admin-card inv-filter-toolbar">
        <div className="inv-filter-grid">
          {/* Keyword Search */}
          <div className="inv-filter-search">
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm nội thất, kích thước, vật liệu..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, selectedStatus)
                }
              }}
            />
            {searchKeyword && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setSearchKeyword('')
                  fetchProducts(0, selectedCategory, '', selectedLowStock, selectedStatus)
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="inv-filter-select-group">
            <label>Loại:</label>
            <select
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
          <div className="inv-filter-select-group">
            <label>Tồn kho:</label>
            <select
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
          <div className="inv-filter-select-group">
            <label>Trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, e.target.value)
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang mở bán</option>
              <option value="INACTIVE">Đã tạm ẩn</option>
            </select>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ height: '42px', padding: '0 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, selectedStatus)}
            disabled={loading}
          >
            <Search size={15} />
            <span>Lọc Dữ Liệu</span>
          </button>

          {(searchKeyword || selectedCategory || selectedLowStock !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              style={{ height: '42px', padding: '0 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={handleResetFilters}
            >
              <X size={15} />
              <span>Đặt Lại</span>
            </button>
          )}

          <button
            type="button"
            className="admin-btn admin-btn-outline"
            style={{ height: '42px', padding: '0 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => fetchProducts(page)}
            disabled={loading}
            title="Làm mới bảng"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>

        {/* Active Filter Chips */}
        {(searchKeyword || selectedCategory || selectedLowStock !== 'ALL' || selectedStatus !== 'ALL') && (
          <div className="inv-active-chips-row">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đang áp dụng bộ lọc:</span>
            {searchKeyword && (
              <span className="inv-chip">
                <span>Từ khóa: "{searchKeyword}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('')
                    fetchProducts(0, selectedCategory, '', selectedLowStock, selectedStatus)
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inv-chip">
                <span>Loại: {categories.find((c) => String(c.id) === String(selectedCategory))?.name || selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('')
                    fetchProducts(0, '', searchKeyword, selectedLowStock, selectedStatus)
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedLowStock === 'LOW_STOCK' && (
              <span className="inv-chip" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                <span>⚠️ Sắp hết hàng (&lt; 5)</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLowStock('ALL')
                    fetchProducts(0, selectedCategory, searchKeyword, 'ALL', selectedStatus)
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inv-chip">
                <span>Trạng thái: {selectedStatus === 'ACTIVE' ? 'Đang mở bán' : 'Đã tạm ẩn'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('ALL')
                    fetchProducts(0, selectedCategory, searchKeyword, selectedLowStock, 'ALL')
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
              Kho Hàng &amp; Danh Mục Sản Phẩm Nội Thất
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Hiển thị {products.length} trên tổng số {totalElements} mẫu nội thất
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
            <span>Hiển thị:</span>
            <select
              className="admin-page-size-select"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                setPageSize(newSize)
                setPage(0)
              }}
            >
              <option value={5}>5 sản phẩm / trang</option>
              <option value={10}>10 sản phẩm / trang</option>
              <option value={20}>20 sản phẩm / trang</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ margin: '16px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '65px' }}>ID</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Ảnh</th>
                <th style={{ minWidth: '260px' }}>Tên Sản Phẩm Nội Thất</th>
                <th style={{ width: '150px' }}>Loại Nội Thất</th>
                <th style={{ width: '75px', textAlign: 'center' }}>ĐVT</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Giá Niêm Yết</th>
                <th style={{ width: '135px', textAlign: 'center' }}>Tồn Kho</th>
                <th style={{ width: '125px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ width: '195px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang nạp dữ liệu kho sản phẩm nội thất...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <Armchair size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy sản phẩm nội thất nào phù hợp.</p>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      style={{ marginTop: '12px' }}
                      onClick={handleResetFilters}
                    >
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
                      <td style={{ color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.86rem' }}>
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
                        <span className="product-title-text" style={{ cursor: 'pointer' }} onClick={() => openEditModal(p)}>
                          {p.name}
                        </span>
                        {!isActive && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>
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
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857', fontSize: '0.96rem', whiteSpace: 'nowrap' }}>
                        {formatVND(p.sellingPrice)}
                      </td>

                      {/* Stock Quantity */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isLow ? (
                          <span className="stock-pill low" title="Cảnh báo: Sản phẩm sắp hết hàng!">
                            <AlertTriangle size={12} />
                            <span>{p.quantity} (Sắp hết)</span>
                          </span>
                        ) : (
                          <span className="stock-pill normal">
                            <span>{p.quantity} {p.unit || 'chiếc'}</span>
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          {/* Album ảnh */}
                          <button
                            type="button"
                            className="btn-action-gallery"
                            onClick={() => openGalleryModal(p)}
                            title="Quản lý Album thư viện ảnh đa góc chụp"
                          >
                            <ImageIcon size={13} />
                            <span>Ảnh</span>
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => openEditModal(p)}
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit2 size={13} />
                            <span>Sửa</span>
                          </button>

                          {/* Ẩn / Hiện */}
                          <button
                            type="button"
                            className={`btn-action-toggle ${isActive ? 'active' : ''}`}
                            onClick={() => handleToggleStatus(p)}
                            title={isActive ? 'Tạm ẩn sản phẩm' : 'Mở bán lại sản phẩm'}
                          >
                            {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
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
          <div className="pagination-info">
            Hiển thị <strong>{products.length}</strong> trên tổng số <strong>{totalElements}</strong> sản phẩm
            (Trang {page + 1} / {Math.max(1, totalPages)})
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 0 || loading}
              onClick={() => {
                const prev = page - 1
                setPage(prev)
                fetchProducts(prev)
              }}
            >
              &lt; Trước
            </button>

            {Array.from({ length: totalPages }, (_, idx) => {
              if (
                totalPages > 6 &&
                idx !== 0 &&
                idx !== totalPages - 1 &&
                Math.abs(idx - page) > 1
              ) {
                if (idx === 1 && page > 2) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                if (idx === totalPages - 2 && page < totalPages - 3) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                return null
              }

              return (
                <button
                  type="button"
                  key={idx}
                  className={`page-num-btn ${idx === page ? 'active' : ''}`}
                  onClick={() => {
                    setPage(idx)
                    fetchProducts(idx)
                  }}
                  disabled={loading}
                >
                  {idx + 1}
                </button>
              )
            })}

            <button
              type="button"
              className="page-btn"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => {
                const next = page + 1
                setPage(next)
                fetchProducts(next)
              }}
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
