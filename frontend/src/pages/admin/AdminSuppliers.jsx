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
  FileText,
  DollarSign,
  Calendar,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react'
import { MOCK_SUPPLIERS, MOCK_GOODS_RECEIPTS } from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminSuppliers({ showToast, activeRole = 'ADMIN' }) {
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [materialCategory, setMaterialCategory] = useState('Gỗ công nghiệp An Cường MDF/MFC')
  const [taxCode, setTaxCode] = useState('0314899214')
  const [bankInfo, setBankInfo] = useState('Vietcombank - 0071000921482')

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
      email: email || 'contact@nhacungcap.vn',
      address: address || 'Khu công nghiệp Tân Bình, TP.HCM',
      materialCategory: materialCategory || 'Vật tư nội thất tiêu chuẩn',
      totalReceipts: 1,
      totalPurchased: 45000000,
      currentDebt: 0,
      taxCode: taxCode || '0318992211',
      status: 'ACTIVE',
    }

    setSuppliers([...suppliers, newSup])
    setCreateModalOpen(false)
    setName('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setAddress('')
    showToast(`Đã thêm thành công nhà cung cấp đối tác "${name}"!`)
  }

  // Get receipts associated with selected supplier
  const supplierReceipts = selectedSupplier
    ? MOCK_GOODS_RECEIPTS.filter(
        (r) =>
          r.supplierId === selectedSupplier.id ||
          r.supplierName.toLowerCase().includes(selectedSupplier.name.toLowerCase())
      )
    : []

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Nhà Cung Cấp Nội Thất</h1>
          <p className="admin-page-subtitle">
            Danh bạ đối tác cung ứng gỗ sồi, gỗ óc chó, da bò thuộc Ý, vải nỉ và phụ kiện ray trượt giảm chấn cao cấp.
          </p>
        </div>

        <div className="admin-hero-actions">
          {(activeRole === 'ADMIN' || activeRole === 'WAREHOUSE') && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} /> Thêm Nhà Cung Cấp Mới
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm tên đối tác, loại vật liệu gỗ, người liên hệ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Tổng số đối tác chiến lược: <strong>{suppliers.length}</strong> đơn vị
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Tên Đơn Vị Cung Cấp</th>
                <th>Người Đại Diện & Liên Hệ</th>
                <th>Nhóm Vật Liệu Chính</th>
                <th>Địa Chỉ Kho / Xưởng</th>
                <th className="text-center">Số Đợt Nhập</th>
                <th className="text-right">Dư Nợ Hiện Tại</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => {
                const debt = s.currentDebt || 45000000 // demo realistic debt
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        MST: {s.taxCode || '0315892100'} · {s.email}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{s.contactPerson}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-primary)', fontWeight: 600 }}>
                        {s.phone}
                      </div>
                    </td>

                    <td>
                      <span className="admin-status-badge info" style={{ fontSize: '11.5px' }}>
                        {s.materialCategory}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '12.5px',
                        }}
                        title={s.address}
                      >
                        {s.address}
                      </div>
                    </td>

                    <td className="text-center tabular-nums">
                      <span className="admin-status-badge neutral" style={{ fontSize: '11.5px' }}>
                        <PackageCheck size={12} style={{ marginRight: '3px' }} />
                        {s.totalReceipts} đợt
                      </span>
                    </td>

                    <td className="text-right tabular-nums">
                      <span
                        style={{
                          fontWeight: 700,
                          color: debt > 0 ? 'var(--admin-warning)' : '#10B981',
                        }}
                      >
                        {debt > 0 ? formatCurrency(debt) : '0 ₫'}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className="admin-status-badge success">
                        <span className="dot" />
                        Đang hợp tác
                      </span>
                    </td>

                    <td className="text-center">
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => setSelectedSupplier(s)}
                      >
                        <Eye size={13} /> Hồ Sơ Chi Tiết
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================================================
          SLIDE-OVER DRAWER: DETAILED SUPPLIER PROFILE & DEBT HISTORY
         ========================================================================== */}
      {selectedSupplier && (
        <div
          className="admin-modal-backdrop"
          style={{ justifyContent: 'flex-end', padding: 0 }}
          onClick={() => setSelectedSupplier(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100vh',
              background: 'var(--admin-surface)',
              borderLeft: '1px solid var(--admin-border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--admin-modal-shadow)',
              animation: 'slide-left 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--admin-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                  {selectedSupplier.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Hồ sơ đối tác cung ứng vật tư & công nợ
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedSupplier(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Financial & Debt Status Card */}
              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Dư nợ hiện tại:</span>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--admin-warning)', marginTop: '2px' }} className="tabular-nums">
                    {formatCurrency(selectedSupplier.currentDebt || 45000000)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>Hạn thanh toán: 30 ngày</span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Tổng nhập lũy kế:</span>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--admin-primary)', marginTop: '2px' }} className="tabular-nums">
                    {formatCurrency(380000000)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>Đã đối soát 4 kỳ</span>
                </div>
              </div>

              {/* Legal & Contact Info */}
              <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                <h4 className="admin-detail-card-title">
                  <Building2 size={16} style={{ color: 'var(--admin-primary)' }} />
                  Thông Tin Pháp Lý & Xưởng Gia Công:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Người đại diện:</span>
                    <strong>{selectedSupplier.contactPerson}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Hotline:</span>
                    <strong style={{ color: 'var(--admin-primary)' }}>{selectedSupplier.phone}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Email:</span>
                    <span>{selectedSupplier.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Mã số thuế:</span>
                    <code>{selectedSupplier.taxCode || '0314899214'}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Vật tư chính:</span>
                    <span className="admin-status-badge info">{selectedSupplier.materialCategory}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '8px' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Địa chỉ xưởng:</span>
                    <div style={{ marginTop: '2px' }}>{selectedSupplier.address}</div>
                  </div>
                </div>
              </div>

              {/* Recent Goods Receipt Notes (GRN) */}
              <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                <h4 className="admin-detail-card-title">
                  <FileText size={16} style={{ color: 'var(--admin-primary)' }} />
                  Lịch Sử Các Đợt Nhập Hàng Gần Nhất:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {supplierReceipts.length > 0 ? (
                    supplierReceipts.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'var(--admin-bg)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                            {r.receiptCode}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                            {new Date(r.receivedDate).toLocaleDateString('vi-VN')} · {r.items?.length || 1} mặt hàng
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }} className="tabular-nums">
                            {formatCurrency(r.totalCost)}
                          </div>
                          <span className="admin-status-badge success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            Đã nhập kho
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--admin-text-muted)', fontSize: '12.5px' }}>
                      Chưa có phiếu nhập kho nào gần đây.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--admin-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedSupplier(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  showToast(`Đang mở phiếu thanh toán công nợ cho ${selectedSupplier.name}...`)
                }}
              >
                Thanh Toán Công Nợ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: CREATE SUPPLIER MODAL
         ========================================================================== */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
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
                    placeholder="VD: Công ty TNHH Gỗ Xuất Khẩu An Cường"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Người Đại Diện Phụ Trách *</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Nhóm Vật Liệu Cung Cấp Chính *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Gỗ Sồi, Gỗ Teak, Da bò Ý..."
                      value={materialCategory}
                      onChange={(e) => setMaterialCategory(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Liên Hệ Nhận Báo Giá</label>
                    <input
                      type="email"
                      placeholder="contact@nhacungcap.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Địa Chỉ Xưởng / Kho Bãi</label>
                  <input
                    type="text"
                    placeholder="VD: KCN Biên Hòa 2, Tỉnh Đồng Nai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Lưu Đối Tác Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
