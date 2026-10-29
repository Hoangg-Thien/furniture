import { useState, useEffect, useMemo } from 'react'
import {
  FolderTree,
  FolderPlus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Armchair,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminCategoryManagement({ currentUser }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL | ACTIVE | INACTIVE

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null) // null = Create, object = Edit
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Toggle Visibility Modal
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [togglingCategory, setTogglingCategory] = useState(null)
  const [syncProducts, setSyncProducts] = useState(true)
  const [toggling, setToggling] = useState(false)

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Toast Feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const baseUrl = getApiBaseUrl()

  // 1. Tải danh sách categories
  async function fetchCategories(search = searchKeyword, status = selectedStatus) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search?.trim()) params.append('search', search.trim())
      if (status && status !== 'ALL') params.append('status', status)

      const url = `${baseUrl}/api/admin/categories?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể tải danh sách loại nội thất`)
      }
      const data = await res.json()
      setCategories(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories(searchKeyword, selectedStatus)
  }, [selectedStatus])

  function handleSearchSubmit(e) {
    if (e) e.preventDefault()
    fetchCategories(searchKeyword, selectedStatus)
  }

  function handleResetSearch() {
    setSearchKeyword('')
    setSelectedStatus('ALL')
    fetchCategories('', 'ALL')
  }

  // 2. Mở Modal Thêm mới
  function openCreateModal() {
    setEditingCategory(null)
    setFormData({ name: '', description: '', isActive: true })
    setFormError('')
    setShowModal(true)
  }

  // 3. Mở Modal Chỉnh sửa
  function openEditModal(cat) {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      isActive: cat.isActive !== false
    })
    setFormError('')
    setShowModal(true)
  }

  // 4. Submit Lưu (Create hoặc Update)
  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên loại nội thất.')
      return
    }

    if (formData.name.trim().length > 150) {
      setFormError('Tên loại nội thất không được vượt quá 150 ký tự.')
      return
    }

    setSubmitting(true)
    try {
      const isEdit = Boolean(editingCategory)
      const url = isEdit
        ? `${baseUrl}/api/admin/categories/${editingCategory.id}`
        : `${baseUrl}/api/admin/categories`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          isActive: formData.isActive
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác không thành công')
      }

      showToast(
        isEdit
          ? `Đã cập nhật loại nội thất "${data.name}" thành công!`
          : `Đã thêm mới loại nội thất "${data.name}" thành công!`,
        'success'
      )
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 5. Mở Modal Ẩn / Hiện Loại nội thất
  function openToggleVisibility(cat) {
    setTogglingCategory(cat)
    setSyncProducts(true)
    setShowToggleModal(true)
  }

  async function handleToggleSubmit() {
    if (!togglingCategory) return

    setToggling(true)
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/categories/${togglingCategory.id}/toggle-status?syncProducts=${syncProducts}`,
        { method: 'PUT' }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể đổi trạng thái hiển thị')
      }

      showToast(data.message || 'Đã cập nhật trạng thái hiển thị!', 'success')
      setShowToggleModal(false)
      fetchCategories()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setToggling(false)
    }
  }

  // 6. Xử lý Xóa (Delete)
  function openDeleteConfirm(cat) {
    setDeletingCategory(cat)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  async function handleDeleteSubmit() {
    if (!deletingCategory) return

    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`${baseUrl}/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa loại nội thất')
      }

      showToast(`Đã xóa thành công loại nội thất "${deletingCategory.name}"!`, 'success')
      setShowDeleteModal(false)
      fetchCategories()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = categories.length
    const activeCount = categories.filter((c) => c.isActive !== false).length
    const hiddenCount = categories.filter((c) => c.isActive === false).length
    const totalProducts = categories.reduce((sum, c) => sum + Number(c.productCount || 0), 0)
    return { total, activeCount, hiddenCount, totalProducts }
  }, [categories])

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
            <span className="current">Quản lý Loại nội thất</span>
          </div>
          <h1 className="admin-page-title">Danh Mục & Loại Nội Thất</h1>
          <p className="admin-page-desc">
            Cấu trúc phân loại không gian nội thất, điều khiển trạng thái hiển thị/ẩn sản phẩm trên website
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openCreateModal}>
            <FolderPlus size={16} />
            <span>Thêm loại nội thất</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <FolderTree size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng danh mục</span>
            <div className="kpi-value">{stats.total}</div>
            <span className="kpi-sub">Loại nội thất trong CSDL</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
            <Eye size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đang hiển thị</span>
            <div className="kpi-value" style={{ color: '#059669' }}>{stats.activeCount}</div>
            <span className="kpi-sub">Công khai trên trang bán hàng</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <EyeOff size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đã tạm ẩn</span>
            <div className="kpi-value" style={{ color: '#DC2626' }}>{stats.hiddenCount}</div>
            <span className="kpi-sub">Tạm ngưng hiển thị & bán</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <Package size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng mẫu sản phẩm</span>
            <div className="kpi-value">{stats.totalProducts}</div>
            <span className="kpi-sub">Sản phẩm thuộc các danh mục</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar">
        <form onSubmit={handleSearchSubmit} className="admin-search-wrap" style={{ maxWidth: '380px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên loại nội thất (Sofa, Giường, Bàn ăn...)"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button type="button" className="search-clear-btn" onClick={() => setSearchKeyword('')}>
              <X size={14} />
            </button>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Trạng thái:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.84rem', background: '#FFFFFF' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">Tất cả ({stats.total})</option>
            <option value="ACTIVE">Đang hiển thị ({stats.activeCount})</option>
            <option value="INACTIVE">Đã tạm ẩn ({stats.hiddenCount})</option>
          </select>
        </div>

        <div className="filter-actions" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchCategories(searchKeyword, selectedStatus)}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
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
                <th style={{ width: '70px' }}>Mã ID</th>
                <th style={{ minWidth: '220px' }}>Tên loại nội thất</th>
                <th style={{ minWidth: '280px' }}>Mô tả không gian & kiểu dáng</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Sản phẩm trong kho</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Trạng thái hiển thị</th>
                <th style={{ width: '180px', textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-loading-cell">
                    <RefreshCw size={24} className="spin" />
                    <p>Đang tải danh mục loại nội thất...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    <FolderTree size={36} color="var(--admin-text-muted)" />
                    <p>Chưa tìm thấy loại nội thất nào phù hợp</p>
                    {(searchKeyword || selectedStatus !== 'ALL') && (
                      <button className="admin-btn admin-btn-secondary" onClick={handleResetSearch}>
                        Xóa bộ lọc tìm kiếm
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const pCount = Number(cat.productCount || 0)
                  const isActive = cat.isActive !== false

                  return (
                    <tr key={cat.id} className="category-row">
                      {/* ID Badge */}
                      <td>
                        <span className="category-id-badge">
                          #{String(cat.id).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Name & Icon */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className={`category-icon-avatar ${!isActive ? 'grayscale' : ''}`}>
                            <Armchair size={18} />
                          </div>
                          <div>
                            <span className="category-name-text">{cat.name}</span>
                            {!isActive && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                                (Đang ẩn khỏi website)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.86rem', lineHeight: '1.45' }}>
                        {cat.description ? (
                          cat.description
                        ) : (
                          <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Chưa có mô tả không gian</span>
                        )}
                      </td>

                      {/* Product Count */}
                      <td style={{ textAlign: 'center' }}>
                        {pCount > 0 ? (
                          <span className="category-count-badge active" title={`Có ${pCount} sản phẩm liên kết`}>
                            <Package size={13} />
                            <strong>{pCount}</strong> sản phẩm
                          </span>
                        ) : (
                          <span className="category-count-badge empty" title="Chưa có sản phẩm nào thuộc danh mục này">
                            0 sản phẩm
                          </span>
                        )}
                      </td>

                      {/* Active Status Pill */}
                      <td style={{ textAlign: 'center' }}>
                        {isActive ? (
                          <span className="admin-status-pill active" title="Hiển thị công khai trên menu cửa hàng">
                            <span className="status-dot green"></span>
                            Đang hiển thị
                          </span>
                        ) : (
                          <span className="admin-status-pill inactive" title="Đã tạm ẩn khỏi menu cửa hàng">
                            <span className="status-dot red"></span>
                            Đã tạm ẩn
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* Toggle Visibility Button */}
                          <button
                            className={`table-action-btn ${isActive ? 'lock' : 'unlock'}`}
                            onClick={() => openToggleVisibility(cat)}
                            title={isActive ? 'Tạm ẩn loại nội thất và sản phẩm' : 'Bật lại hiển thị công khai'}
                          >
                            {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{isActive ? 'Ẩn' : 'Hiện'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            className="table-action-btn edit"
                            onClick={() => openEditModal(cat)}
                            title="Chỉnh sửa tên và mô tả"
                          >
                            <Edit2 size={14} />
                            <span>Sửa</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            className={`table-action-btn lock ${pCount > 0 ? 'disabled' : ''}`}
                            onClick={() => openDeleteConfirm(cat)}
                            title={
                              pCount > 0
                                ? `Không thể xóa: Đang có ${pCount} sản phẩm. Bạn hãy dùng nút "Ẩn" phía trước!`
                                : 'Xóa loại nội thất này'
                            }
                          >
                            <Trash2 size={14} />
                            <span>Xóa</span>
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

        {/* Footer info */}
        <div className="admin-pagination-footer">
          <span className="pagination-info">
            Hiển thị <strong>{categories.length}</strong> danh mục loại nội thất
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
            * Mẹo: Nếu loại nội thất đang có sản phẩm, bạn có thể dùng nút <strong>"Ẩn"</strong> để ngừng bán tạm thời thay vì xóa.
          </span>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: THÊM MỚI / CHỈNH SỬA LOẠI NỘI THẤT
          ==================================================================== */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  {editingCategory ? <Edit2 size={20} /> : <FolderPlus size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingCategory ? 'Chỉnh Sửa Loại Nội Thất' : 'Thêm Loại Nội Thất Mới'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingCategory
                      ? `Cập nhật thông tin cho danh mục #${editingCategory.id}`
                      : 'Phân loại không gian và nhóm đồ nội thất'}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal-body">
                {formError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Tên loại nội thất <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Sofa & Ghế Thư Giãn, Bàn Ghế Phòng Ăn..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={150}
                    required
                    autoFocus
                  />
                  <small className="form-hint">
                    Tên danh mục là duy nhất trong hệ thống (tối đa 150 ký tự).
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả không gian & phong cách sử dụng</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="VD: Các dòng sofa góc chữ L, sofa văng da và nỉ cao cấp cho không gian phòng khách hiện đại..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <small className="form-hint">
                    Gợi ý mục đích sử dụng và chủng loại để khách hàng dễ lọc trên trang chủ.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                    />
                    <span>Kích hoạt hiển thị công khai ngay trên website</span>
                  </label>
                </div>

                {editingCategory && (
                  <div className="modal-info-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                    <Package size={18} color="var(--admin-accent)" />
                    <div>
                      Hiện có <strong>{editingCategory.productCount || 0} sản phẩm</strong> thuộc loại nội thất này.
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ẨN / HIỆN LOẠI NỘI THẤT & ĐỒNG BỘ ẨN SẢN PHẨM
          ==================================================================== */}
      {showToggleModal && togglingCategory && (
        <div className="admin-modal-backdrop" onClick={() => setShowToggleModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`modal-icon-badge ${togglingCategory.isActive !== false ? 'warning' : 'success'}`}>
                  {togglingCategory.isActive !== false ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    {togglingCategory.isActive !== false
                      ? 'Tạm Ẩn Loại Nội Thất'
                      : 'Hiển Thị Lại Loại Nội Thất'}
                  </h3>
                  <p className="modal-subtitle">Điều khiển trạng thái hiển thị trên giao diện người mua</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowToggleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {togglingCategory.isActive !== false ? (
                <div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.92rem', color: 'var(--admin-text-main)', lineHeight: 1.5 }}>
                    Bạn có chắc chắn muốn <strong>tạm ẩn</strong> loại nội thất{' '}
                    <strong>"{togglingCategory.name}"</strong> khỏi website? Khách hàng sẽ không còn thấy danh mục này trên thanh điều hướng.
                  </p>

                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FCD34D',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={syncProducts}
                        onChange={(e) => setSyncProducts(e.target.checked)}
                        style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#92400E' }}>
                          Đồng thời ẩn tất cả {togglingCategory.productCount || 0} sản phẩm thuộc loại này
                        </strong>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#B45309', lineHeight: 1.4 }}>
                          Các sản phẩm liên kết sẽ được đặt trạng thái ngưng kinh doanh, khách hàng không thể tìm kiếm hoặc thêm vào giỏ hàng.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.92rem', color: 'var(--admin-text-main)', lineHeight: 1.5 }}>
                    Bạn có chắc chắn muốn <strong>kích hoạt hiển thị công khai</strong> lại cho loại nội thất{' '}
                    <strong>"{togglingCategory.name}"</strong>?
                  </p>

                  <div
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={syncProducts}
                        onChange={(e) => setSyncProducts(e.target.checked)}
                        style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#1E40AF' }}>
                          Kích hoạt lại hiển thị cho toàn bộ {togglingCategory.productCount || 0} sản phẩm liên kết
                        </strong>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#2563EB', lineHeight: 1.4 }}>
                          Sản phẩm sẽ tự động xuất hiện trở lại trên danh mục và các trang tìm kiếm.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowToggleModal(false)}
                disabled={toggling}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                className={`admin-btn ${togglingCategory.isActive !== false ? 'admin-btn-primary' : 'admin-btn-primary'}`}
                style={togglingCategory.isActive !== false ? { background: '#D97706', borderColor: '#B45309' } : {}}
                onClick={handleToggleSubmit}
                disabled={toggling}
              >
                {toggling ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>
                    {togglingCategory.isActive !== false ? 'Xác nhận ẩn' : 'Xác nhận hiển thị'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: XÁC NHẬN XÓA LOẠI NỘI THẤT
          ==================================================================== */}
      {showDeleteModal && deletingCategory && (
        <div className="admin-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge danger">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#DC2626' }}>
                    Xác Nhận Xóa Loại Nội Thất
                  </h3>
                  <p className="modal-subtitle">Thao tác này sẽ xóa vĩnh viễn danh mục khỏi hệ thống</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {deleteError && (
                <div className="modal-alert-error">
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              {Number(deletingCategory.productCount) > 0 ? (
                <div className="modal-alert-warning" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>CẢNH BÁO RÀNG BUỘC TOÀN VẸN:</strong>
                    <p style={{ margin: '6px 0 0 0' }}>
                      Loại nội thất <strong>"{deletingCategory.name}"</strong> hiện đang có{' '}
                      <strong>{deletingCategory.productCount} sản phẩm</strong> trong kho hàng.
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                      Hệ thống sẽ <strong>chặn xóa</strong> để bảo vệ dữ liệu sản phẩm. Nếu bạn không muốn bán loại nội thất này nữa, hãy dùng chức năng <strong>"Ẩn loại nội thất"</strong> (nút Ẩn màu cam) thay vì xóa.
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.92rem', color: 'var(--admin-text-main)', margin: 0, lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa loại nội thất{' '}
                  <strong>"{deletingCategory.name}"</strong> (ID: #{deletingCategory.id})?
                </p>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteSubmit}
                disabled={deleting || Number(deletingCategory.productCount) > 0}
                title={Number(deletingCategory.productCount) > 0 ? 'Bị chặn vì còn sản phẩm' : 'Xóa vĩnh viễn'}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
