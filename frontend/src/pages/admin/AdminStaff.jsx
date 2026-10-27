import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Plus,
  Search,
  Lock,
  Unlock,
  KeyRound,
  Check,
  Users,
  Sliders,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  X,
  AlertCircle,
} from 'lucide-react'
import {
  fetchAdminStaff,
  createAdminStaff,
  toggleStaffStatus,
  updateStaffRole,
  resetStaffPassword,
  fetchPermissionsMatrix,
  savePermissionsMatrix,
} from '../../lib/admin'

const PERMISSION_MODULES = [
  {
    category: 'Tài Chính & Báo Cáo',
    permissions: [
      { id: 'view_financial_reports', label: 'Xem doanh thu & lợi nhuận gộp', roles: ['ADMIN'] },
      { id: 'export_tax_reports', label: 'Xuất báo cáo thuế & hóa đơn A4', roles: ['ADMIN', 'SALES'] },
    ],
  },
  {
    category: 'Sản Phẩm & Ma Trận Biến Thể',
    permissions: [
      { id: 'create_edit_products', label: 'Thêm & Chỉnh sửa sản phẩm/biến thể', roles: ['ADMIN'] },
      { id: 'view_product_specs', label: 'Xem thông số quy cách gỗ/da/kích thước', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'DISPATCHER'] },
      { id: 'manage_categories', label: 'Quản lý cây danh mục nội thất', roles: ['ADMIN'] },
    ],
  },
  {
    category: 'Đơn Hàng & Điều Phối Giao Lắp',
    permissions: [
      { id: 'create_edit_orders', label: 'Lên đơn mới & Áp dụng voucher', roles: ['ADMIN', 'SALES'] },
      { id: 'assign_dispatch', label: 'Phân công đội thợ & xe tải giao lắp', roles: ['ADMIN', 'DISPATCHER'] },
      { id: 'confirm_completion', label: 'Ký nghiệm thu hoàn tất bàn giao', roles: ['ADMIN', 'DISPATCHER'] },
      { id: 'cancel_orders', label: 'Quyền hủy đơn hàng (hoàn kho)', roles: ['ADMIN'] },
    ],
  },
  {
    category: 'Quản Lý Kho & Nhập Hàng (GRN)',
    permissions: [
      { id: 'create_grn', label: 'Lập phiếu nhập kho từ nhà cung cấp', roles: ['ADMIN', 'WAREHOUSE'] },
      { id: 'approve_grn', label: 'Xác nhận nhập kho chính thức (tăng tồn)', roles: ['ADMIN', 'WAREHOUSE'] },
      { id: 'view_supplier_debts', label: 'Xem công nợ đối tác cung ứng gỗ', roles: ['ADMIN', 'WAREHOUSE'] },
    ],
  },
  {
    category: 'Khách Hàng & Đánh Giá',
    permissions: [
      { id: 'view_customers', label: 'Xem thông tin khách & địa chỉ giao', roles: ['ADMIN', 'SALES', 'DISPATCHER'] },
      { id: 'moderate_reviews', label: 'Kiểm duyệt & ẩn/hiện đánh giá sao', roles: ['ADMIN', 'SALES'] },
    ],
  },
  {
    category: 'Quản Trị Hệ Thống',
    permissions: [
      { id: 'manage_staff_roles', label: 'Cấp tài khoản & gán quyền nhân viên', roles: ['ADMIN'] },
      { id: 'system_settings', label: 'Cài đặt cấu hình kết nối API & Showroom', roles: ['ADMIN'] },
    ],
  },
]

function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Tổng Quản Trị Viên'
    case 'STAFF':
      return 'Nhân Viên Nội Bộ'
    case 'SALES':
      return 'Nhân Viên Bán Hàng'
    case 'WAREHOUSE':
      return 'Thủ Kho'
    case 'DISPATCHER':
      return 'Điều Phối & Thợ Lắp'
    default:
      return role || 'Nhân Viên'
  }
}

export default function AdminStaff({ showToast, activeRole = 'ADMIN', currentPath = '/admin/staff' }) {
  const [activeTab, setActiveTab] = useState(
    currentPath === '/admin/roles-permissions' ? 'PERMISSIONS' : 'STAFF'
  )
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [resetModalUser, setResetModalUser] = useState(null)
  const [newPassword, setNewPassword] = useState('123456')

  // Permissions Matrix State: Map of permissionId -> Array of Roles
  const [matrixState, setMatrixState] = useState(() => {
    const initial = {}
    PERMISSION_MODULES.forEach((mod) => {
      mod.permissions.forEach((p) => {
        initial[p.id] = [...p.roles]
      })
    })
    return initial
  })

  // Create Staff Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('123456')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('STAFF')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [branch, setBranch] = useState('Showroom Quận 7 - TP.HCM')
  const [submitting, setSubmitting] = useState(false)

  // Load Real Staff from Supabase Database
  async function loadStaffData() {
    setLoading(true)
    const { staff } = await fetchAdminStaff()
    if (Array.isArray(staff)) {
      const formatted = staff.map((s) => ({
        id: s.user_id || s.id,
        username: s.username,
        fullName: s.full_name || s.fullName || s.username,
        role: s.role,
        roleLabel: getRoleLabel(s.role),
        email: s.email || `${s.username}@furniture.com`,
        phone: s.phone || 'Chưa cập nhật',
        branch: s.address || 'Showroom Quận 7',
        status: s.is_active ? 'ACTIVE' : 'LOCKED',
        createdAt: s.created_at,
      }))
      setStaffList(formatted)
    } else {
      setStaffList([])
    }
    setLoading(false)
  }

  // Load Saved Permissions Matrix
  async function loadPermissions() {
    const { matrix } = await fetchPermissionsMatrix()
    if (matrix && Object.keys(matrix).length > 0) {
      setMatrixState((prev) => ({
        ...prev,
        ...matrix,
      }))
    }
  }

  useEffect(() => {
    loadStaffData()
    loadPermissions()
  }, [])

  useEffect(() => {
    if (currentPath === '/admin/roles-permissions') {
      setActiveTab('PERMISSIONS')
    }
  }, [currentPath])

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roleLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleToggleLock(id, currentStatus, name) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    // Optimistic UI update
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    )

    const res = await toggleStaffStatus(id)
    if (res.success) {
      showToast(`Đã ${nextStatus === 'LOCKED' ? 'khóa tài khoản' : 'mở khóa tài khoản'} của ${name}!`)
    } else {
      showToast(`Lỗi: ${res.error || 'Không thể đổi trạng thái tài khoản'}`, 'error')
      loadStaffData()
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!resetModalUser) return
    const res = await resetStaffPassword(resetModalUser.id, newPassword)
    if (res.success) {
      showToast(`Đã đặt lại mật khẩu cho tài khoản @${resetModalUser.username}!`)
      setResetModalUser(null)
      setNewPassword('123456')
    } else {
      showToast(`Lỗi reset mật khẩu: ${res.error}`, 'error')
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault()
    if (!username.trim() || !fullName.trim()) {
      showToast('Vui lòng nhập Username và Họ tên nhân viên!', 'error')
      return
    }

    setSubmitting(true)
    const payload = {
      username: username.trim().toLowerCase(),
      password: password.trim() || '123456',
      fullName: fullName.trim(),
      email: email.trim() || `${username.trim().toLowerCase()}@furniture.com`,
      phone: phone.trim() || '0903889922',
      address: branch.trim(),
      role: role.trim(),
    }

    const res = await createAdminStaff(payload)
    setSubmitting(false)

    if (res.success) {
      showToast(`Đã tạo thành công tài khoản "${fullName}" với vai trò ${getRoleLabel(role)}!`)
      setCreateModalOpen(false)
      setUsername('')
      setPassword('123456')
      setFullName('')
      setEmail('')
      setPhone('')
      loadStaffData()
    } else {
      showToast(`Lỗi tạo nhân viên: ${res.error}`, 'error')
    }
  }

  function handleToggleMatrixCell(permId, targetRole) {
    setMatrixState((prev) => {
      const currentRoles = prev[permId] || []
      const exists = currentRoles.includes(targetRole)
      const updatedRoles = exists
        ? currentRoles.filter((r) => r !== targetRole)
        : [...currentRoles, targetRole]

      return {
        ...prev,
        [permId]: updatedRoles,
      }
    })
  }

  async function handleSaveMatrix() {
    const res = await savePermissionsMatrix(matrixState)
    if (res.success) {
      showToast('Đã lưu cấu hình ma trận phân quyền Role × Permission vào cơ sở dữ liệu!')
    } else {
      showToast('Đã lưu vào bộ nhớ cục bộ!', 'info')
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Tài Khoản & Phân Quyền (RBAC)</h1>
          <p className="admin-page-subtitle">
            Cấp tài khoản nhân sự từ cơ sở dữ liệu Supabase, phân quyền chức năng 2 chiều (Role × Function) và kiểm soát an toàn bảo mật.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={loadStaffData}
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw size={15} className={loading ? 'admin-spin' : ''} /> Làm mới
          </button>
          {activeRole === 'ADMIN' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} /> Cấp Tài Khoản Mới
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'STAFF' ? 'active' : ''}`}
          onClick={() => setActiveTab('STAFF')}
        >
          <Users size={15} />
          <span>Danh Sách Nhân Viên & Ban Quản Trị</span>
          <span className="admin-status-tab-badge">{staffList.length}</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'PERMISSIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('PERMISSIONS')}
        >
          <Sliders size={15} />
          <span>Ma Trận Phân Quyền (Role × Permission)</span>
        </button>
      </div>

      {/* TAB 1: STAFF LIST TABLE */}
      {activeTab === 'STAFF' && (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', maxWidth: '420px' }}>
                <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
                <input
                  type="text"
                  className="admin-filter-input"
                  style={{ width: '100%' }}
                  placeholder="Tìm theo tên, username, chức vụ, chi nhánh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
                Đang hoạt động:{' '}
                <strong style={{ color: '#16A34A' }}>
                  {staffList.filter((s) => s.status === 'ACTIVE').length}
                </strong>{' '}
                / {staffList.length} tài khoản
              </div>
            </div>
          </div>

          <div className="admin-table-container">
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-dim)' }}>
                <RefreshCw size={24} className="admin-spin" style={{ margin: '0 auto 12px' }} />
                <div>Đang tải danh sách tài khoản từ Supabase...</div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--admin-text-dim)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                  {searchTerm ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nhân sự nào trong Database'}
                </div>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>
                  {searchTerm ? 'Vui lòng thử từ khóa tìm kiếm khác.' : 'Bấm nút "Cấp Tài Khoản Mới" để tạo tài khoản nhân viên.'}
                </p>
              </div>
            ) : (
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Nhân Sự</th>
                    <th>Tài Khoản (Username)</th>
                    <th>Vai Trò Phân Quyền</th>
                    <th>Chi Nhánh / Địa Chỉ</th>
                    <th>Số Điện Thoại</th>
                    <th className="text-center">Trạng Thái</th>
                    <th className="text-center">Bảo Mật & Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const isActive = s.status === 'ACTIVE'
                    const isAdmin = s.role === 'ADMIN'

                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: isAdmin
                                  ? 'linear-gradient(135deg, #B45309 0%, #78350F 100%)'
                                  : 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
                                color: '#FFF',
                                fontWeight: 700,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {(s.fullName || s.username).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                {s.fullName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                                {s.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <code style={{ fontWeight: 700, color: 'var(--admin-primary)', background: 'var(--admin-card-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                            @{s.username}
                          </code>
                        </td>

                        <td>
                          <span className={`admin-status-badge ${isAdmin ? 'warning' : 'info'}`} style={{ fontSize: '12px' }}>
                            <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                            {s.roleLabel}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--admin-text-main)' }}>
                            {s.branch}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '12.5px', color: 'var(--admin-text-main)' }}>{s.phone}</div>
                        </td>

                        <td className="text-center">
                          <span className={`admin-status-badge ${isActive ? 'success' : 'danger'}`}>
                            <span className="dot" />
                            {isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>

                        <td className="text-center">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className={`admin-btn ${isActive ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                              style={{ padding: '5px 10px', fontSize: '11.5px' }}
                              onClick={() => handleToggleLock(s.id, s.status, s.fullName)}
                              title={isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                            >
                              {isActive ? <Lock size={12} /> : <Unlock size={12} />}
                              <span>{isActive ? 'Khóa' : 'Mở'}</span>
                            </button>

                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '11.5px' }}
                              onClick={() => setResetModalUser(s)}
                              title="Đặt lại mật khẩu cho tài khoản này"
                            >
                              <KeyRound size={12} />
                              <span>Reset MK</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROLE × PERMISSION MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">
                <Sliders size={17} style={{ color: 'var(--admin-primary)' }} />
                Ma Trận Phân Quyền Chức Năng Theo Vai Trò (RBAC Grid)
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px', display: 'block' }}>
                Tích chọn để cấp hoặc thu hồi quyền truy cập và thao tác dữ liệu theo thời gian thực
              </span>
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSaveMatrix}
            >
              <Check size={15} /> Lưu Cấu Hình Phân Quyền
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Chức Năng & Quyền Thao Tác</th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>ADMIN</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Tổng Quản Trị</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#2563EB' }}>SALES</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>NV Bán Hàng</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#D97706' }}>WAREHOUSE</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Thủ Kho</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#5B6E4E' }}>DISPATCHER</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Điều Phối Giao Lắp</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((module, mIdx) => (
                  <React.Fragment key={mIdx}>
                    <tr style={{ background: 'var(--admin-bg)' }}>
                      <td colSpan="5" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--admin-primary)', padding: '10px 18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {module.category}
                      </td>
                    </tr>

                    {module.permissions.map((perm) => {
                      const activeRoles = matrixState[perm.id] || []

                      return (
                        <tr key={perm.id}>
                          <td style={{ paddingLeft: '28px' }}>
                            <div style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>
                              {perm.label}
                            </div>
                            <code style={{ fontSize: '10.5px', color: 'var(--admin-text-dim)' }}>
                              {perm.id}
                            </code>
                          </td>

                          {['ADMIN', 'SALES', 'WAREHOUSE', 'DISPATCHER'].map((roleKey) => {
                            const isChecked = activeRoles.includes(roleKey)
                            const isAdminSupreme = roleKey === 'ADMIN'

                            return (
                              <td key={roleKey} className="text-center" style={{ verticalAlign: 'middle' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAdminSupreme}
                                  onChange={() => handleToggleMatrixCell(perm.id, roleKey)}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--admin-primary)',
                                    cursor: isAdminSupreme ? 'not-allowed' : 'pointer',
                                  }}
                                  title={isAdminSupreme ? 'ADMIN mặc định toàn quyền tối cao' : `Cấp quyền ${perm.id} cho ${roleKey}`}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE STAFF ACCOUNT */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Cấp Tài Khoản Nhân Viên / Quản Trị Mới</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="admin-form-label">Tên Đăng Nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="ví dụ: hung_sales, loan_kho..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                    Tên đăng nhập viết liền không dấu, dùng để đăng nhập hệ thống nội bộ.
                  </div>
                </div>

                <div>
                  <label className="admin-form-label">Mật Khẩu Khởi Tạo *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="Mặc định: 123456"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="ví dụ: Nguyễn Hoàng Long"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Vai Trò Phân Quyền *</label>
                  <select
                    className="admin-form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="STAFF">Nhân Viên Nội Bộ (STAFF)</option>
                    <option value="ADMIN">Tổng Quản Trị Viên (ADMIN)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="admin-form-label">Email Công Vụ</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      placeholder="nhanvien@furniture.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Số Điện Thoại</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="0901xxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-form-label">Chi Nhánh / Kho Phụ Trách</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="ví dụ: Showroom Quận 7, Kho Bình Tân..."
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn-primary"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {resetModalUser && (
        <div className="admin-modal-backdrop" onClick={() => setResetModalUser(null)}>
          <div className="admin-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Đặt Lại Mật Khẩu Tài Khoản</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResetModalUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13.5px', color: 'var(--admin-text-main)' }}>
                  Bạn đang đặt lại mật khẩu cho nhân sự: <strong>{resetModalUser.fullName}</strong> (<code>@{resetModalUser.username}</code>)
                </div>

                <div>
                  <label className="admin-form-label">Mật khẩu mới</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setResetModalUser(null)}
                >
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Xác Nhận Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
