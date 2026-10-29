import { useState, useEffect, useTransition } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Filter,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Unlock,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminUserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedRole, setSelectedRole] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [activeUser, setActiveUser] = useState(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    role: 'STAFF',
    showPassword: false
  })
  const [createError, setCreateError] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [resetPasswordVal, setResetPasswordVal] = useState('')
  const [showResetPass, setShowResetPass] = useState(true)
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetCopied, setResetCopied] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Lấy ID của admin hiện tại đang đăng nhập
  const currentLoggedInUserId = currentUser?.id || currentUser?.userId || currentUser?.user_id

  // Tải danh sách tài khoản từ Backend
  const loadUsers = async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('size', targetPageSize)

      if (searchKeyword.trim()) {
        params.append('keyword', searchKeyword.trim())
      }
      if (selectedRole !== 'ALL') {
        params.append('role', selectedRole)
      }
      if (selectedStatus === 'ACTIVE') {
        params.append('isActive', 'true')
      } else if (selectedStatus === 'INACTIVE') {
        params.append('isActive', 'false')
      }

      const res = await fetch(`${baseUrl}/api/admin/users?${params.toString()}`, {
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}: Không thể tải danh sách tài khoản`)
      }

      const data = await res.json()
      setUsers(data.content || [])
      setPage(data.page || 0)
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Error fetching admin users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load danh sách mỗi khi thay đổi bộ lọc hoặc trang
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(0, pageSize)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchKeyword, selectedRole, selectedStatus, pageSize])

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadUsers(newPage, pageSize)
    }
  }

  // Sinh mật khẩu ngẫu nhiên an toàn
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
  }

  // Xử lý tạo tài khoản mới
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

    setCreateSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: getApiHeaders({
          'Content-Type': 'application/json',
          'X-Current-User-Id': currentLoggedInUserId ? String(currentLoggedInUserId) : ''
        }),
        body: JSON.stringify({
          username: createForm.username.trim(),
          password: createForm.password.trim(),
          role: createForm.role
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Tạo tài khoản thất bại')
      }

      showToast(`Đã tạo tài khoản "${data.username}" (${data.role}) thành công!`, 'success')
      setShowCreateModal(false)
      setCreateForm({
        username: '',
        password: '',
        role: 'STAFF',
        showPassword: false
      })
      loadUsers(0)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Mở modal xác nhận Khóa / Kích hoạt
  const openToggleConfirm = (user) => {
    if (currentLoggedInUserId && Number(user.id) === Number(currentLoggedInUserId)) {
      showToast('Không được phép tự vô hiệu hóa tài khoản của chính mình!', 'error')
      return
    }
    setActiveUser(user)
    setShowToggleModal(true)
  }

  // Thực hiện đổi trạng thái hoạt động (Active / Inactive)
  const handleConfirmToggle = async () => {
    if (!activeUser) return
    try {
      const baseUrl = getApiBaseUrl()
      const queryParam = currentLoggedInUserId ? `?currentUserId=${currentLoggedInUserId}` : ''
      const customHeaders = { 'Content-Type': 'application/json' }
      if (currentLoggedInUserId) {
        customHeaders['X-Current-User-Id'] = String(currentLoggedInUserId)
      }
      const res = await fetch(`${baseUrl}/api/admin/users/${activeUser.id}/toggle-status${queryParam}`, {
        method: 'PUT',
        headers: getApiHeaders(customHeaders)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái thất bại')
      }

      showToast(data.message || 'Thay đổi trạng thái tài khoản thành công!', 'success')
      setShowToggleModal(false)
      setActiveUser(null)
      loadUsers(page)
    } catch (err) {
      showToast(err.message, 'error')
      setShowToggleModal(false)
    }
  }

  // Mở modal Reset Password
  const openResetPasswordModal = (user) => {
    setActiveUser(user)
    setResetPasswordVal(generateRandomPassword())
    setShowResetPass(true)
    setResetCopied(false)
    setShowResetModal(true)
  }

  // Thực hiện Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (!activeUser) return
    if (!resetPasswordVal || resetPasswordVal.trim().length < 6) {
      showToast('Mật khẩu mới tối thiểu 6 ký tự', 'error')
      return
    }

    setResetSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const resetHeaders = { 'Content-Type': 'application/json' }
      if (currentLoggedInUserId) {
        resetHeaders['X-Current-User-Id'] = String(currentLoggedInUserId)
      }
      const res = await fetch(`${baseUrl}/api/admin/users/${activeUser.id}/reset-password`, {
        method: 'PUT',
        headers: getApiHeaders(resetHeaders),
        body: JSON.stringify({
          newPassword: resetPasswordVal.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại')
      }

      showToast(`Đã đổi mật khẩu cho "${activeUser.username}" thành công!`, 'success')
      setShowResetModal(false)
      setActiveUser(null)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResetSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setResetCopied(true)
    setTimeout(() => setResetCopied(false), 2000)
  }

  // Format ngày tạo
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
            Trang chủ &gt; Quản lý tài khoản & Phân quyền &gt; <span>Module 01</span>
          </div>
          <h1 className="admin-page-title">Quản Lý Tài Khoản & Phân Quyền</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={() => loadUsers(page)} title="Tải lại danh sách">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button className="admin-btn admin-btn-accent" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>


      {/* Toolbar Tìm kiếm & Bộ Lọc */}
      <div className="admin-card admin-filter-toolbar">
        <div className="filter-grid">
          {/* Search box */}
          <div className="filter-search-box">
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đăng nhập (username)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button className="clear-btn" onClick={() => setSearchKeyword('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="filter-select-group">
            <label>Vai trò:</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
              <option value="STAFF">STAFF (Nhân viên)</option>
              <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-group">
            <label>Trạng thái:</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã bị tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Tài Khoản */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th>Tên Đăng Nhập</th>
                <th>Vai Trò (Role)</th>
                <th>Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang tải danh sách tài khoản từ hệ thống...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#EF4444' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={20} />
                      <span>Lỗi: {error}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <Users size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentSelf = currentLoggedInUserId && Number(u.id) === Number(currentLoggedInUserId)

                  return (
                    <tr key={u.id} className={isCurrentSelf ? 'current-user-row' : ''}>
                      <td style={{ fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                        #{u.id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.94rem' }}>
                            {u.username}
                          </span>
                          {isCurrentSelf && (
                            <span className="self-tag" title="Tài khoản bạn đang sử dụng">
                              Bạn (Đang đăng nhập)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {u.role === 'ADMIN' ? (
                          <span className="user-role-badge admin">
                            <Shield size={13} />
                            ADMIN
                          </span>
                        ) : u.role === 'STAFF' ? (
                          <span className="user-role-badge staff">
                            <UserCheck size={13} />
                            STAFF
                          </span>
                        ) : (
                          <span className="user-role-badge customer">
                            <Users size={13} />
                            CUSTOMER
                          </span>
                        )}
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="admin-status-pill active">
                            <span className="status-dot green"></span>
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="admin-status-pill inactive">
                            <span className="status-dot red"></span>
                            Đã bị tạm khóa
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.84rem' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {/* Nút Đổi mật khẩu */}
                          <button
                            className="table-action-btn edit"
                            onClick={() => openResetPasswordModal(u)}
                            title="Đặt lại mật khẩu cho tài khoản này"
                          >
                            <Key size={14} />
                            <span>Đổi MK</span>
                          </button>

                          {/* Nút Khóa / Mở khóa */}
                          {u.isActive ? (
                            <button
                              className={`table-action-btn lock ${isCurrentSelf ? 'disabled' : ''}`}
                              onClick={() => openToggleConfirm(u)}
                              disabled={isCurrentSelf}
                              title={isCurrentSelf ? 'Không thể tự khóa tài khoản của chính mình' : 'Tạm khóa tài khoản này'}
                            >
                              <Lock size={14} />
                              <span>Khóa</span>
                            </button>
                          ) : (
                            <button
                              className="table-action-btn unlock"
                              onClick={() => openToggleConfirm(u)}
                              title="Mở khóa và kích hoạt tài khoản"
                            >
                              <Unlock size={14} />
                              <span>Kích hoạt</span>
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
              Hiển thị <strong>{users.length}</strong> trên tổng số <strong>{totalElements}</strong> tài khoản
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
                  loadUsers(0, newSize)
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
          MODAL 1: TẠO TÀI KHOẢN MỚI
          ==================================================================== */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Tạo Tài Khoản Mới</h3>
                  <p className="modal-subtitle">Cấp tài khoản cho Quản trị viên phụ tá hoặc Nhân viên nội bộ</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="admin-modal-body">
                {createError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Tên đăng nhập <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: staff_hung, admin_phu..."
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    autoFocus
                    required
                  />
                  <small className="form-hint">Tối thiểu 4 ký tự, viết liền không dấu, không khoảng trắng.</small>
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
                      Sinh mật khẩu ngẫu nhiên
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={createForm.showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Nhập mật khẩu an toàn..."
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
                  <small className="form-hint">Tối thiểu 6 ký tự, sẽ được băm tự động bằng BCrypt/SHA-256 an toàn.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Vai trò (Role) <span className="req">*</span>
                  </label>
                  <div className="role-radio-group">
                    <label className={`role-radio-card ${createForm.role === 'STAFF' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="createRole"
                        value="STAFF"
                        checked={createForm.role === 'STAFF'}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      />
                      <div className="radio-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={16} color="#0284C7" />
                          <strong>STAFF (Nhân viên)</strong>
                        </div>
                        <span>Quản lý đơn hàng, kho sản phẩm, danh mục và chăm sóc khách hàng.</span>
                      </div>
                    </label>

                    <label className={`role-radio-card ${createForm.role === 'ADMIN' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="createRole"
                        value="ADMIN"
                        checked={createForm.role === 'ADMIN'}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      />
                      <div className="radio-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={16} color="#D97706" />
                          <strong>ADMIN (Quản trị viên)</strong>
                        </div>
                        <span>Toàn quyền cao nhất: Quản trị tài khoản, nhân sự, báo cáo doanh thu tài chính.</span>
                      </div>
                    </label>
                  </div>
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
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Tạo Tài Khoản</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: RESET PASSWORD CHO USER
          ==================================================================== */}
      {showResetModal && activeUser && (
        <div className="admin-modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge warning">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Đặt Lại Mật Khẩu</h3>
                  <p className="modal-subtitle">
                    Tài khoản: <strong>{activeUser.username}</strong> ({activeUser.role})
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="admin-modal-body">
                <div className="modal-info-box">
                  Mật khẩu mới sẽ thay thế mật khẩu cũ ngay lập tức. Hãy sao chép và gửi cho nhân viên/người dùng sau khi cập nhật.
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Mật khẩu mới <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      className="text-action-link"
                      onClick={() => setResetPasswordVal(generateRandomPassword())}
                    >
                      Sinh ngẫu nhiên
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showResetPass ? 'text' : 'password'}
                      className="form-input"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => copyToClipboard(resetPasswordVal)}
                      title="Sao chép mật khẩu"
                    >
                      {resetCopied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                    </button>
                  </div>
                  {resetCopied && (
                    <small style={{ color: '#10B981', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                      ✓ Đã sao chép mật khẩu vào bộ nhớ tạm!
                    </small>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={resetSubmitting}
                >
                  {resetSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Lưu Mật Khẩu Mới</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: XÁC NHẬN KHÓA / KÍCH HOẠT TÀI KHOẢN
          ==================================================================== */}
      {showToggleModal && activeUser && (
        <div className="admin-modal-backdrop" onClick={() => setShowToggleModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`modal-icon-badge ${activeUser.isActive ? 'danger' : 'success'}`}>
                  {activeUser.isActive ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    {activeUser.isActive ? 'Xác Nhận Tạm Khóa Tài Khoản' : 'Kích Hoạt Lại Tài Khoản'}
                  </h3>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowToggleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--admin-text-main)', margin: '0 0 12px 0' }}>
                Bạn có chắc chắn muốn {activeUser.isActive ? 'tạm khóa' : 'mở khóa kích hoạt lại'} tài khoản{' '}
                <strong>"{activeUser.username}"</strong> (Vai trò: <strong>{activeUser.role}</strong>)?
              </p>
              {activeUser.isActive ? (
                <div className="modal-alert-warning">
                  Tài khoản bị tạm khóa sẽ lập tức bị từ chối khi đăng nhập vào hệ thống cửa hàng và trang quản trị.
                </div>
              ) : (
                <div className="modal-alert-info">
                  Sau khi kích hoạt, người dùng có thể sử dụng tên đăng nhập và mật khẩu hiện tại để đăng nhập bình thường.
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
                className={`admin-btn ${activeUser.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                onClick={handleConfirmToggle}
              >
                {activeUser.isActive ? 'Khóa Tài Khoản' : 'Kích Hoạt Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
