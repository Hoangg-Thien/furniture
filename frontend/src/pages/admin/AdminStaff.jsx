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
} from 'lucide-react'
import { MOCK_STAFF } from './adminMockData'

export default function AdminStaff({ showToast }) {
  const [staffList, setStaffList] = useState(MOCK_STAFF)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Form State
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('STAFF')
  const [roleLabel, setRoleLabel] = useState('Nhân viên Kinh doanh')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

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
      email: email || `${username}@furnistore.vn`,
      phone: phone || '0900000000',
      status: 'ACTIVE',
      lastLogin: new Date().toISOString(),
    }

    setStaffList([...staffList, newStaff])
    setCreateModalOpen(false)
    showToast(`Đã thêm thành công nhân viên "${fullName}" với vai trò ${roleLabel}!`)
  }

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Nhân sự & Phân quyền Role</h1>
          <p className="admin-page-subtitle">
            Cấp tài khoản, phân quyền vai trò (Admin, Nhân viên bán hàng, Thủ kho, Thợ giao lắp) và kiểm soát bảo mật.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Thêm Nhân Viên Mới
          </button>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm nhân viên theo tên, username, vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Đang hoạt động: <strong>{staffList.filter((s) => s.status === 'ACTIVE').length}</strong> nhân sự
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ Tên & Username</th>
                <th>Vai Trò (Role)</th>
                <th>Chức Danh Nghiệp Vụ</th>
                <th>Liên Hệ</th>
                <th>Lần Đăng Nhập Cuối</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{s.fullName}</div>
                    <code style={{ fontSize: '12px', color: '#F59E0B' }}>@{s.username}</code>
                  </td>
                  <td>
                    <span className={`admin-badge ${s.role === 'ADMIN' ? 'warning' : 'info'}`}>
                      <ShieldCheck size={12} /> {s.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--admin-text-main)' }}>{s.roleLabel}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{s.phone}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{s.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>
                      {new Date(s.lastLogin).toLocaleDateString('vi-VN')} {new Date(s.lastLogin).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${s.status === 'ACTIVE' ? 'success' : 'danger'}`}>
                      {s.status === 'ACTIVE' ? 'Đang Hoạt Động' : 'Đã Khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {s.role !== 'ADMIN' && (
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', color: s.status === 'ACTIVE' ? '#F87171' : '#34D399' }}
                        onClick={() => handleToggleLock(s.id, s.status, s.fullName)}
                      >
                        {s.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                        {s.status === 'ACTIVE' ? ' Khóa TK' : ' Mở Khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Staff */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Cấp Tài Khoản Nhân Viên Mới</h3>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Tên Đăng Nhập (Username) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: minhtri_sales"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Họ và Tên Nhân Viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Lê Minh Trí"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Quyền Hạn Hệ Thống (Role) *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="STAFF">STAFF (Nhân viên)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Chức Danh Nghiệp Vụ *</label>
                    <select value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)}>
                      <option value="Nhân viên Kinh doanh">Nhân viên Kinh doanh & Tư vấn</option>
                      <option value="Thủ kho & Quản lý Kho">Thủ kho & Quản lý Kho</option>
                      <option value="Kỹ thuật viên Giao lắp">Kỹ thuật viên Giao lắp tại nhà</option>
                      <option value="Kế toán nội bộ">Kế toán nội bộ</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Số Điện Thoại</label>
                    <input
                      type="text"
                      placeholder="0901234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Công Ty</label>
                    <input
                      type="email"
                      placeholder="minhtri@furnistore.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
