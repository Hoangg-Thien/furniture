import React, { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  PackageCheck,
  X,
} from 'lucide-react'
import { MOCK_SUPPLIERS } from './adminMockData'

export default function AdminSuppliers({ showToast }) {
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [materialCategory, setMaterialCategory] = useState('')

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.materialCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleCreateSupplier(e) {
    e.preventDefault()
    if (!name || !phone) {
      alert('Vui lòng nhập tên nhà cung cấp và số điện thoại!')
      return
    }

    const newSup = {
      id: Date.now(),
      name,
      contactPerson,
      phone,
      email,
      address,
      materialCategory: materialCategory || 'Vật tư nội thất tiêu chuẩn',
      totalReceipts: 0,
      status: 'ACTIVE',
    }

    setSuppliers([...suppliers, newSup])
    setCreateModalOpen(false)
    showToast(`Đã thêm đối tác nhà cung cấp "${name}"!`)
  }

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Nhà cung cấp Nội thất</h1>
          <p className="admin-page-subtitle">
            Danh sách đối tác cung ứng gỗ sồi, gỗ óc chó, da thuộc, vải nỉ và phụ kiện ray trượt bản lề Hafele.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Thêm Nhà Cung Cấp
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
                placeholder="Tìm tên nhà cung cấp, vật liệu cung ứng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Đối tác chiến lược: <strong>{suppliers.length}</strong> đơn vị
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên Đơn Vị Cung Cấp</th>
                <th>Người Đại Diện & SĐT</th>
                <th>Nhóm Vật Tư Chính</th>
                <th>Xưởng / Địa Chỉ Kho</th>
                <th>Số Đợt Nhập Hàng</th>
                <th>Trạng Thái Hợp Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{s.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13.5px' }}>{s.contactPerson}</div>
                    <div style={{ fontSize: '12px', color: '#F59E0B' }}>{s.phone}</div>
                  </td>
                  <td>
                    <span className="admin-badge neutral">{s.materialCategory}</span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                      {s.address}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge info">
                      <PackageCheck size={12} /> {s.totalReceipts} đợt
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge success">Đang Cung Ứng</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Supplier */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Thêm Nhà Cung Cấp Đối Tác Mới</h3>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Tên Doanh Nghiệp / Xưởng Sản Xuất *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Công ty TNHH Gỗ Xuất Khẩu Đồng Nai"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Người Đại Diện Liên Hệ *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Cường"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Số Điện Thoại Hotline *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 0903889900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Nhóm Vật Liệu Cung Cấp *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Gỗ Sồi, Gỗ Teak, Da bò Ý..."
                      value={materialCategory}
                      onChange={(e) => setMaterialCategory(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Liên Hệ</label>
                    <input
                      type="email"
                      placeholder="contact@nhacungcap.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Địa Chỉ Kho Bãi / Nhà Xưởng</label>
                  <input
                    type="text"
                    placeholder="VD: KCN Biên Hòa 2, Đồng Nai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Lưu Đối Tác
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
