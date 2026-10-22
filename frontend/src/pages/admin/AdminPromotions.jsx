import React, { useState } from 'react'
import {
  Tag,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  X,
  Percent,
} from 'lucide-react'
import { MOCK_VOUCHERS } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminPromotions({ showToast }) {
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Form State
  const [code, setCode] = useState('')
  const [programName, setProgramName] = useState('')
  const [discountPercent, setDiscountPercent] = useState('10')
  const [minimumAmount, setMinimumAmount] = useState('10000000')
  const [maxDiscount, setMaxDiscount] = useState('2000000')
  const [quantity, setQuantity] = useState('50')
  const [endDate, setEndDate] = useState('2026-12-31')

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.programName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleApprove(id, vCode) {
    setVouchers(
      vouchers.map((v) =>
        v.id === id ? { ...v, status: 'ACTIVE', approvalState: 'APPROVED' } : v
      )
    )
    showToast(`Đã duyệt mã voucher "${vCode}" thành công! Khách hàng có thể sử dụng ngay.`)
  }

  function handleTogglePause(id, currentStatus, vCode) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setVouchers(
      vouchers.map((v) => (v.id === id ? { ...v, status: nextStatus } : v))
    )
    showToast(`Đã đổi trạng thái voucher "${vCode}" sang "${nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}".`)
  }

  function handleCreateVoucher(e) {
    e.preventDefault()
    if (!code || !programName) {
      alert('Vui lòng nhập Mã Voucher và Tên chương trình!')
      return
    }

    const newVoucher = {
      id: Date.now(),
      code: code.trim().toUpperCase(),
      programName,
      discountPercent: Number(discountPercent),
      minimumAmount: Number(minimumAmount),
      maximumDiscount: Number(maxDiscount),
      quantity: Number(quantity),
      usedQuantity: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate,
      status: 'ACTIVE',
      approvalState: 'APPROVED',
    }

    setVouchers([newVoucher, ...vouchers])
    setCreateModalOpen(false)
    showToast(`Đã tạo và kích hoạt mã voucher "${newVoucher.code}"!`)
  }

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Khuyến mãi & Kho Voucher</h1>
          <p className="admin-page-subtitle">
            Cấu hình mã giảm giá, mức chiết khấu %, giới hạn đơn hàng tối thiểu và phê duyệt voucher đưa vào hệ thống.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Tạo Voucher Mới
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
                placeholder="Tìm theo mã voucher hoặc tên chương trình..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Chương Trình Khuyến Mãi</th>
                <th>Mức Giảm</th>
                <th>Đơn Tối Thiểu</th>
                <th>Giảm Tối Đa</th>
                <th>Đã Dùng / Tổng Số</th>
                <th>Hạn Dùng</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#F59E0B', fontFamily: 'monospace', fontSize: '14px', background: 'rgba(217,119,6,0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                      {v.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{v.programName}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>
                      {v.discountPercent}%
                    </span>
                  </td>
                  <td>{formatCurrency(v.minimumAmount)}</td>
                  <td>{formatCurrency(v.maximumDiscount)}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{v.usedQuantity}</span> / {v.quantity}
                    <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', marginTop: '4px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round((v.usedQuantity / v.quantity) * 100))}%`,
                          height: '100%',
                          background: '#F59E0B',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{v.endDate}</span>
                  </td>
                  <td>
                    {v.approvalState === 'PENDING_APPROVAL' ? (
                      <span className="admin-badge warning">
                        <Clock size={12} /> Chờ Admin Duyệt
                      </span>
                    ) : v.status === 'ACTIVE' ? (
                      <span className="admin-badge success">
                        <CheckCircle size={12} /> Hoạt Động
                      </span>
                    ) : (
                      <span className="admin-badge danger">
                        <PauseCircle size={12} /> Tạm Ngưng
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {v.approvalState === 'PENDING_APPROVAL' ? (
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleApprove(v.id, v.code)}
                      >
                        <CheckCircle size={14} /> Duyệt Ngay
                      </button>
                    ) : (
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleTogglePause(v.id, v.status, v.code)}
                      >
                        {v.status === 'ACTIVE' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        {v.status === 'ACTIVE' ? ' Tạm Dừng' : ' Kích Hoạt'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Voucher */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Tạo Chương Trình Khuyến Mãi / Voucher</h3>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVoucher}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Mã Voucher (Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: SOFASALE20"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Tỷ Lệ Giảm (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Tên Chương Trình Khuyến Mãi *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Mừng Đại Lễ Giảm Giá Sofa & Bàn Ăn"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Giá Trị Đơn Tối Thiểu (VNĐ) *</label>
                    <input
                      type="number"
                      min="0"
                      step="500000"
                      required
                      value={minimumAmount}
                      onChange={(e) => setMinimumAmount(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Số Tiền Giảm Tối Đa (VNĐ) *</label>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      required
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Tổng Số Lượng Phát Hành *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Ngày Hết Hạn *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Lưu & Phê Duyệt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
