import { useState, useEffect } from 'react'
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Truck,
  Unlock,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminStaffManagement({ currentUser }) {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [activeStaff, setActiveStaff] = useState(null)

  // Forms
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    showPassword: false
  })
  const [createError, setCreateError] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  })
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // ID của admin hiện tại đang đăng nhập
  const currentLoggedInUserId = currentUser?.id || currentUser?.userId || currentUser?.user_id

  // Tải danh sách nhân viên từ Backend
  const loadStaff = async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('size', targetPageSize)

      if (searchKeyword.trim()) {
        params.append('search', searchKeyword.trim())
      }
      if (selectedStatus === 'ACTIVE') {
        params.append('isActive', 'true')
      } else if (selectedStatus === 'INACTIVE') {
        params.append('isActive', 'false')
      }

      const res = await fetch(`${baseUrl}/api/admin/staff?${params.toString()}`, {
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}: Lỗi tải danh sách nhân viên`)
      }

      const data = await res.json()
      setStaffList(data.content || [])
      setPage(data.page || 0)
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Error fetching staff list:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Tự động load khi thay đổi bộ lọc
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStaff(0, pageSize)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchKeyword, selectedStatus, pageSize])

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadStaff(newPage, pageSize)
    }
  }

  // Sinh mật khẩu ngẫu nhiên
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let pass = ''
    for (let i = 0; i < 9; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
  }

  // Xử lý tạo nhân viên mới (Đồng thời tạo User + Staff)
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateError('')

    if (!createForm.username || createForm.username.trim().length < 4) {
      setCreateError('Tên đăng nhập tối thiểu 4 ký tự')
      return
    }
    if (!createForm.password || createForm.password.trim().length < 6) {
      setCreateError('Mật khẩu tối thiểu 6 ký tự')
      return
    }
    if (!createForm.fullName || !createForm.fullName.trim()) {
      setCreateError('Họ và tên nhân viên không được để trống')
      return
    }

    setCreateSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: 'POST',
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          username: createForm.username.trim().toLowerCase(),
          password: createForm.password.trim(),
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim() || null,
          phone: createForm.phone.trim() || null,
          address: createForm.address.trim() || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Tạo nhân viên thất bại')
      }

      showToast(`Đã thêm nhân viên "${data.fullName}" (@${data.username}) thành công!`, 'success')
      setShowCreateModal(false)
      setCreateForm({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        address: '',
        showPassword: false
      })
      loadStaff(0)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Mở modal sửa nhân viên
  const openEditModal = (staff) => {
    setActiveStaff(staff)
    setEditForm({
      fullName: staff.fullName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      address: staff.address || ''
    })
    setEditError('')
    setShowEditModal(true)
  }

  // Xử lý lưu chỉnh sửa thông tin nhân viên
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!activeStaff) return
    setEditError('')

    if (!editForm.fullName || !editForm.fullName.trim()) {
      setEditError('Họ và tên nhân viên không được để trống')
      return
    }

    setEditSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/staff/${activeStaff.id}`, {
        method: 'PUT',
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật nhân viên thất bại')
      }

      showToast('Cập nhật hồ sơ nhân viên thành công!', 'success')
      setShowEditModal(false)
      setActiveStaff(null)
      loadStaff(page)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Mở modal Khóa / Kích hoạt tài khoản nhân viên
  const openToggleConfirm = (staff) => {
    if (currentLoggedInUserId && Number(staff.userId) === Number(currentLoggedInUserId)) {
      showToast('Không được phép tự vô hiệu hóa tài khoản của chính mình!', 'error')
      return
    }
    setActiveStaff(staff)
    setShowToggleModal(true)
  }

  // Xử lý đổi trạng thái hoạt động của nhân viên
  const handleConfirmToggle = async () => {
    if (!activeStaff) return
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/staff/${activeStaff.id}/toggle-status?currentUserId=${currentLoggedInUserId || ''}`, {
        method: 'PUT',
        headers: getApiHeaders({
          'Content-Type': 'application/json',
          'X-Current-User-Id': currentLoggedInUserId ? String(currentLoggedInUserId) : ''
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Thay đổi quyền truy cập thất bại')
      }

      showToast(data.message || 'Thay đổi quyền truy cập nhân viên thành công!', 'success')
      setShowToggleModal(false)
      setActiveStaff(null)
      loadStaff(page)
    } catch (err) {
      showToast(err.message, 'error')
      setShowToggleModal(false)
    }
  }

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="admin-module-view">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Quản trị nhân sự &gt; <span>Module 03</span>
          </div>
          <h1 className="admin-page-title">Quản Lý Đội Ngũ Nhân Viên</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={() => loadStaff(page)} title="Làm mới">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button className="admin-btn admin-btn-accent" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        </div>
      </div>


      {/* Toolbar Tìm kiếm & Bộ Lọc */}
      <div className="admin-card admin-filter-toolbar">
        <div className="filter-grid">
          {/* Keyword search */}
          <div className="filter-search-box" style={{ flex: 1.5, minWidth: '280px' }}>
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm nhân viên theo Họ tên, SĐT, Email, Username..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button className="clear-btn" onClick={() => setSearchKeyword('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="filter-select-group">
            <label>Trạng thái:</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="INACTIVE">Đã khóa / Thôi việc</option>
            </select>
          </div>

          {(searchKeyword || selectedStatus !== 'ALL') && (
            <button
              className="admin-btn admin-btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setSearchKeyword('')
                setSelectedStatus('ALL')
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Dữ Liệu Nhân Viên */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px', whiteSpace: 'nowrap' }}>Mã NV</th>
                <th style={{ minWidth: '180px' }}>Họ và Tên Nhân Viên</th>
                <th style={{ whiteSpace: 'nowrap' }}>Số Điện Thoại</th>
                <th style={{ whiteSpace: 'nowrap' }}>Email Công Vụ</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Đơn Đã Xử Lý</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Phiếu Nhập Kho</th>
                <th style={{ whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && staffList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang tải danh sách nhân viên...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#EF4444' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={20} />
                      <span>Lỗi: {error}</span>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <UserCheck size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const initials = (s.fullName || 'NV')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  const isCurrentSelf = currentLoggedInUserId && Number(s.userId) === Number(currentLoggedInUserId)

                  return (
                    <tr key={s.id} className={isCurrentSelf ? 'current-user-row' : ''}>
                      <td style={{ fontWeight: 700, color: 'var(--admin-accent)', whiteSpace: 'nowrap' }}>
                        S{String(s.id).padStart(2, '0')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="staff-avatar-badge">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.92rem' }}>
                              {s.fullName || 'Nhân viên'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                              @{s.username || 'staff'}
                              {isCurrentSelf && <span className="self-tag" style={{ marginLeft: '6px' }}>Bạn</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {s.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={13} color="var(--admin-text-muted)" />
                            {s.phone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-main)', fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                        {s.email ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={13} color="var(--admin-text-muted)" />
                            {s.email}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span className="staff-metric-pill orders" title="Số đơn hàng nội thất nhân viên này đã duyệt / xử lý">
                          <Package size={13} />
                          {s.handledOrdersCount} đơn
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span className="staff-metric-pill receipts" title="Số phiếu nhập kho từ nhà cung cấp nhân viên này đã lập">
                          <Truck size={13} />
                          {s.receiptsCount} phiếu
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {s.isActive ? (
                          <span className="admin-status-pill active">
                            <span className="status-dot green"></span>
                            Đang làm việc
                          </span>
                        ) : (
                          <span className="admin-status-pill inactive">
                            <span className="status-dot red"></span>
                            Đã tạm khóa
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="table-action-btn edit"
                            onClick={() => openEditModal(s)}
                            title="Chỉnh sửa thông tin hồ sơ nhân viên"
                          >
                            <Edit size={14} />
                            <span>Sửa</span>
                          </button>

                          {s.isActive ? (
                            <button
                              className={`table-action-btn lock ${isCurrentSelf ? 'disabled' : ''}`}
                              onClick={() => openToggleConfirm(s)}
                              disabled={isCurrentSelf}
                              title={isCurrentSelf ? 'Không thể tự khóa tài khoản của chính mình' : 'Thu hồi quyền truy cập (khóa)'}
                            >
                              <Lock size={14} />
                              <span>Khóa</span>
                            </button>
                          ) : (
                            <button
                              className="table-action-btn unlock"
                              onClick={() => openToggleConfirm(s)}
                              title="Cấp lại quyền truy cập cho nhân viên"
                            >
                              <Unlock size={14} />
                              <span>Mở khóa</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân Trang */}
        <div className="admin-pagination-footer">
          <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>
              Hiển thị <strong>{staffList.length}</strong> trên tổng số <strong>{totalElements}</strong> nhân viên
              (Trang {page + 1} / {Math.max(1, totalPages)})
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>Hiển thị:</span>
              <select
                className="admin-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value)
                  setPageSize(newSize)
                  setPage(0)
                  loadStaff(0, newSize)
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>
          </div>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0 || loading}
            >
              &lt; Trang trước
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
                  key={idx}
                  className={`page-num-btn ${idx === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(idx)}
                  disabled={loading}
                >
                  {idx + 1}
                </button>
              )
            })}

            <button
              className="page-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              Trang sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: THÊM NHÂN VIÊN MỚI (TẠO TÀI KHOẢN + HỒ SƠ)
          ==================================================================== */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Thêm Nhân Viên Mới</h3>
                  <p className="modal-subtitle">Tự động khởi tạo tài khoản đăng nhập và hồ sơ nhân sự</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="admin-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {createError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Phần 1: Tài khoản đăng nhập */}
                <div className="form-section-title">
                  <Shield size={16} color="var(--admin-accent)" />
                  <span>1. Tài Khoản Đăng Nhập Hệ Thống</span>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Tên đăng nhập <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: staff_duc, staff_ha..."
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      required
                    />
                    <small className="form-hint">Viết liền không dấu, tối thiểu 4 ký tự.</small>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        Mật khẩu khởi tạo <span className="req">*</span>
                      </label>
                      <button
                        type="button"
                        className="text-action-link"
                        onClick={() => setCreateForm({ ...createForm, password: generateRandomPassword(), showPassword: true })}
                      >
                        Sinh mật khẩu
                      </button>
                    </div>
                    <div className="password-input-wrapper">
                      <input
                        type={createForm.showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Tối thiểu 6 ký tự..."
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setCreateForm({ ...createForm, showPassword: !createForm.showPassword })}
                      >
                        {createForm.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phần 2: Hồ sơ nhân sự */}
                <div className="form-section-title" style={{ marginTop: '16px' }}>
                  <Briefcase size={16} color="var(--admin-accent)" />
                  <span>2. Thông Tin Hồ Sơ Cá Nhân</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Họ và tên nhân viên <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Hoàng Minh Đức, Lê Thị Thu Hà..."
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: 0933444555"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email công vụ</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="VD: duc.hm@noithat.vn"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Địa chỉ cư trú hiện tại..."
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang tạo nhân sự...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Tạo Nhân Viên</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: CHỈNH SỬA HỒ SƠ NHÂN VIÊN
          ==================================================================== */}
      {showEditModal && activeStaff && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Cập Nhật Hồ Sơ Nhân Viên</h3>
                  <p className="modal-subtitle">
                    Mã NV: <strong>S{String(activeStaff.id).padStart(2, '0')}</strong> (@{activeStaff.username})
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body">
                {editError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Họ và tên nhân viên <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email công vụ</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Địa chỉ liên hệ</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu Thay Đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: XÁC NHẬN KHÓA / KÍCH HOẠT NHÂN VIÊN
          ==================================================================== */}
      {showToggleModal && activeStaff && (
        <div className="admin-modal-backdrop" onClick={() => setShowToggleModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`modal-icon-badge ${activeStaff.isActive ? 'danger' : 'success'}`}>
                  {activeStaff.isActive ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    {activeStaff.isActive ? 'Thu Hồi Quyền Truy Cập' : 'Cấp Lại Quyền Truy Cập'}
                  </h3>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowToggleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--admin-text-main)', margin: '0 0 12px 0' }}>
                Bạn có chắc chắn muốn {activeStaff.isActive ? 'tạm khóa quyền truy cập của' : 'mở khóa kích hoạt lại cho'} nhân viên{' '}
                <strong>"{activeStaff.fullName}"</strong> (@{activeStaff.username})?
              </p>
              {activeStaff.isActive ? (
                <div className="modal-alert-warning">
                  Tài khoản bị khóa sẽ không thể đăng nhập vào trang Quản trị để duyệt đơn hoặc lập phiếu. Toàn bộ lịch sử các đơn hàng và phiếu nhập do nhân viên này từng phụ trách vẫn được lưu trữ nguyên vẹn.
                </div>
              ) : (
                <div className="modal-alert-info">
                  Sau khi mở khóa, nhân viên có thể sử dụng tài khoản đăng nhập bình thường để tiếp tục công việc.
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setShowToggleModal(false)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className={`admin-btn ${activeStaff.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                onClick={handleConfirmToggle}
              >
                {activeStaff.isActive ? 'Khóa Quyền Truy Cập' : 'Kích Hoạt Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
