import React, { useState } from 'react'
import {
  ShieldCheck,
  Plus,
  Search,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Mail,
  Phone,
  X,
  KeyRound,
  Check,
  Layers,
  Users,
  Building2,
  CheckCircle2,
  Sliders,
} from 'lucide-react'
import { MOCK_STAFF } from './adminMockData'

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

export default function AdminStaff({ showToast, activeRole = 'ADMIN' }) {
  const [activeTab, setActiveTab] = useState('STAFF') // 'STAFF' | 'PERMISSIONS'
  const [staffList, setStaffList] = useState(MOCK_STAFF)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

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
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('SALES')
  const [roleLabel, setRoleLabel] = useState('Nhân viên Bán hàng')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [branch, setBranch] = useState('Showroom Quận 7 - TP.HCM')

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roleLabel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleToggleLock(id, currentStatus, name) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    setStaffList(
      staffList.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    )
    showToast(`Đã ${nextStatus === 'LOCKED' ? 'khóa tài khoản' : 'mở khóa tài khoản'} của ${name}!`)
  }

  function handleCreateStaff(e) {
    e.preventDefault()
    if (!username || !fullName) {
      alert('Vui lòng nhập Username và Họ tên nhân viên!')
      return
    }

    const newStaff = {
      id: Date.now(),
      username: username.trim().toLowerCase(),
      fullName,
      role,
      roleLabel,
      branch,
      email: email || `${username}@furnistore.vn`,
      phone: phone || '0903889922',
      status: 'ACTIVE',
      lastLogin: new Date().toISOString(),
    }

    setStaffList([...staffList, newStaff])
    setCreateModalOpen(false)
    setUsername('')
    setFullName('')
    setEmail('')
    setPhone('')
    showToast(`Đã thêm thành công nhân sự "${fullName}" với vai trò ${roleLabel}!`)
  }

  // Toggle single cell in Permission Matrix
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

  function handleSaveMatrix() {
    showToast('Đã lưu cấu hình ma trận phân quyền Role × Permission vào cơ sở dữ liệu!')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Nhân Sự & Phân Quyền Vai Trò</h1>
          <p className="admin-page-subtitle">
            Cấp quyền tài khoản, phân quyền ma trận 2 chiều (Role × Function) và kiểm soát an toàn bảo mật dữ liệu doanh nghiệp.
          </p>
        </div>

        <div className="admin-hero-actions">
          {(activeRole === 'ADMIN') && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} /> Thêm Nhân Viên Mới
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Toggle: Danh Sách Nhân Viên vs Ma Trận Phân Quyền */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'STAFF' ? 'active' : ''}`}
          onClick={() => setActiveTab('STAFF')}
        >
          <Users size={15} />
          <span>Danh Sách Nhân Viên & Đội Thợ</span>
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
            <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
                <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
                <input
                  type="text"
                  className="admin-filter-input"
                  style={{ width: '100%' }}
                  placeholder="Tìm theo tên nhân viên, username, chức vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
                Đang hoạt động: <strong>{staffList.filter((s) => s.status === 'ACTIVE').length}</strong> / {staffList.length} nhân sự
              </div>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Nhân Viên</th>
                  <th>Tài Khoản (Username)</th>
                  <th>Vai Trò Phân Quyền</th>
                  <th>Chi Nhánh / Kho Phụ Trách</th>
                  <th>Số Điện Thoại</th>
                  <th className="text-center">Trạng Thái</th>
                  <th className="text-center">Thao Tác Bảo Mật</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => {
                  const isActive = s.status === 'ACTIVE'

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
                              color: '#FFF',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {s.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{s.fullName}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <code style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                          @{s.username}
                        </code>
                      </td>

                      <td>
                        <span className="admin-status-badge info" style={{ fontSize: '11.5px' }}>
                          <ShieldCheck size={12} style={{ marginRight: '3px' }} />
                          {s.roleLabel}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '12.5px' }}>{s.branch || 'Showroom Quận 7'}</span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--admin-text-main)' }}>{s.phone}</div>
                      </td>

                      <td className="text-center">
                        <span
                          className={`admin-status-badge ${isActive ? 'success' : 'danger'}`}
                        >
                          <span className="dot" />
                          {isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>

                      <td className="text-center">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className={`admin-btn ${isActive ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                            style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            onClick={() => handleToggleLock(s.id, s.status, s.fullName)}
                            title={isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                          >
                            {isActive ? <Lock size={12} /> : <Unlock size={12} />}
                            <span>{isActive ? 'Khóa' : 'Mở Khóa'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
              <Check size={15} /> Lưu Thay Đổi Phân Quyền
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Chức Năng & Quyền Thao Tác</th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>ADMIN</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Quản trị tối cao</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#2563EB' }}>SALES</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>NV Bán hàng</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#D97706' }}>WAREHOUSE</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Thủ kho</div>
                  </th>
                  <th className="text-center" style={{ width: '15%' }}>
                    <div style={{ fontWeight: 700, color: '#5B6E4E' }}>DISPATCHER</div>
                    <div style={{ fontSize: '10.5px', textTransform: 'none', color: 'var(--admin-text-dim)' }}>Điều phối giao lắp</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((module, mIdx) => (
                  <React.Fragment key={mIdx}>
                    <tr style={{ background: 'var(--admin-bg)' }}>
                      <td colSpan="5" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--admin-primary)', padding: '8px 18px', textTransform: 'uppercase' }}>
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
                              <td key={roleKey} className="text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAdminSupreme} // Admin always has full access
                                  onChange={() => handleToggleMatrixCell(perm.id, roleKey)}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: isAdminSupreme ? 'not-allowed' : 'pointer',
                                    accentColor: 'var(--admin-primary)',
                                  }}
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

      {/* Modal: Create Staff */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Cấp Tài Khoản Nhân Viên Mới</h3>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Họ Và Tên Nhân Viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Lê Thị Kim Thoa"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Tên Đăng Nhập (Username) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: thoa.le"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Vai Trò Phân Quyền (Role) *</label>
                    <select
                      value={role}
                      onChange={(e) => {
                        const val = e.target.value
                        setRole(val)
                        if (val === 'SALES') setRoleLabel('Nhân viên Bán hàng')
                        else if (val === 'WAREHOUSE') setRoleLabel('Thủ kho Nội thất')
                        else if (val === 'DISPATCHER') setRoleLabel('Điều phối Giao lắp')
                        else setRoleLabel('Quản trị viên')
                      }}
                    >
                      <option value="SALES">Nhân viên Bán hàng (Sales)</option>
                      <option value="WAREHOUSE">Thủ kho Nội thất (Warehouse)</option>
                      <option value="DISPATCHER">Điều phối Giao & Lắp (Dispatcher)</option>
                      <option value="ADMIN">Tổng Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Chi Nhánh / Showroom Trực Thuộc</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Số Điện Thoại</label>
                    <input
                      type="text"
                      placeholder="0918..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Công Việc</label>
                    <input
                      type="email"
                      placeholder="thoa.le@furnistore.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Cấp Quyền & Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
