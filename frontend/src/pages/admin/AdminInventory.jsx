import React, { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Eye,
  Building2,
  FileCheck,
  AlertCircle,
  X,
} from 'lucide-react'
import { MOCK_GOODS_RECEIPTS, MOCK_SUPPLIERS } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminInventory({ showToast }) {
  const [receipts, setReceipts] = useState(MOCK_GOODS_RECEIPTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Form State
  const [supplierId, setSupplierId] = useState(MOCK_SUPPLIERS[0]?.id || 1)
  const [staffName, setStaffName] = useState('Nguyễn Văn Đạt (Thủ kho)')
  const [itemTitle, setItemTitle] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [notes, setNotes] = useState('')

  const filteredReceipts = receipts.filter(
    (r) =>
      r.receiptCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleConfirmReceipt(id) {
    setReceipts(
      receipts.map((r) => (r.id === id ? { ...r, status: 'CONFIRMED' } : r))
    )
    if (selectedReceipt && selectedReceipt.id === id) {
      setSelectedReceipt({ ...selectedReceipt, status: 'CONFIRMED' })
    }
    showToast(`Đã xác nhận nhập kho thành công cho phiếu #${id}! Tồn kho đã được cộng vào hệ thống.`)
  }

  function handleCreateReceipt(e) {
    e.preventDefault()
    if (!itemTitle || !itemQty || !itemPrice) {
      alert('Vui lòng nhập tên sản phẩm, số lượng và đơn giá nhập!')
      return
    }

    const supplier = MOCK_SUPPLIERS.find((s) => s.id === Number(supplierId))
    const total = Number(itemQty) * Number(itemPrice)

    const newReceipt = {
      id: Date.now(),
      receiptCode: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: supplier?.name || 'Nhà cung cấp nội thất',
      supplierId: Number(supplierId),
      staffName,
      receivedDate: new Date().toISOString(),
      totalCost: total,
      status: 'CONFIRMED',
      notes: notes || 'Nhập kho bổ sung vật tư nội thất chuẩn',
      items: [
        {
          productName: itemTitle,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: Number(itemQty),
          unitCost: Number(itemPrice),
          total,
        },
      ],
    }

    setReceipts([newReceipt, ...receipts])
    setCreateModalOpen(false)
    showToast(`Đã tạo và nhập kho thành công phiếu ${newReceipt.receiptCode}!`)
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Nhập kho Nội thất (Goods Receipt Note)</h1>
          <p className="admin-page-subtitle">
            Lập phiếu nhập kho từ nhà cung cấp gỗ, da thuộc, phụ kiện; kiểm soát giá vốn hàng bán và tăng tồn kho.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Lập Phiếu Nhập Kho Mới
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm mã phiếu nhập kho, tên nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Tổng số phiếu nhập: <strong>{receipts.length}</strong>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Phiếu & Ngày Nhập</th>
                <th>Nhà Cung Cấp Đối Tác</th>
                <th>Thủ Kho Nhận Hàng</th>
                <th>Số Dòng Vật Tư</th>
                <th>Tổng Tiền Vốn</th>
                <th>Trạng Thái Phiếu</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#F59E0B' }}>{r.receiptCode}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>
                      {new Date(r.receivedDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{r.supplierName}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{r.staffName}</span>
                  </td>
                  <td>
                    <span className="admin-badge neutral">{r.items.length} mặt hàng</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>
                    {formatCurrency(r.totalCost)}
                  </td>
                  <td>
                    <span className={`admin-badge ${r.status === 'CONFIRMED' ? 'success' : 'warning'}`}>
                      {r.status === 'CONFIRMED' ? (
                        <>
                          <CheckCircle size={12} /> Đã Nhập Kho
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Chờ Kiểm Hàng
                        </>
                      )}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12.5px' }}
                      onClick={() => setSelectedReceipt(r)}
                    >
                      <Eye size={14} /> Xem Chi Tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Receipt Detail */}
      {selectedReceipt && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Chi Tiết Phiếu Nhập: {selectedReceipt.receiptCode}</h3>
                <span style={{ fontSize: '12.5px', color: 'var(--admin-text-dim)' }}>
                  NCC: {selectedReceipt.supplierName} · Thủ kho: {selectedReceipt.staffName}
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedReceipt(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ background: '#0B0F17', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', fontSize: '13.5px' }}>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>Ghi chú lô hàng: </span>
                <span style={{ color: '#FFF' }}>{selectedReceipt.notes}</span>
              </div>

              <h4 style={{ color: '#FFF', margin: '8px 0 0 0', fontSize: '14.5px' }}>Danh Sách Sản Phẩm / Vật Liệu Nhập:</h4>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên Mặt Hàng / Quy Cách</th>
                      <th>Mã SKU</th>
                      <th>Số Lượng</th>
                      <th>Đơn Giá Nhập</th>
                      <th>Thành Tiền Vốn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#FFF' }}>{it.productName}</td>
                        <td><code style={{ color: '#F59E0B' }}>{it.sku}</code></td>
                        <td><strong>{it.quantity}</strong></td>
                        <td>{formatCurrency(it.unitCost)}</td>
                        <td style={{ fontWeight: 700, color: '#FBBF24' }}>{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
                  Tổng tiền phiếu nhập:{' '}
                  <span style={{ color: '#F59E0B' }}>{formatCurrency(selectedReceipt.totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              {selectedReceipt.status !== 'CONFIRMED' && (
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleConfirmReceipt(selectedReceipt.id)}
                >
                  <FileCheck size={16} /> Xác Nhận Hàng Vào Kho (Cộng Tồn Kho)
                </button>
              )}
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedReceipt(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Receipt */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Lập Phiếu Nhập Kho Nội Thất Mới</h3>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateReceipt}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Chọn Nhà Cung Cấp Đối Tác *</label>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    {MOCK_SUPPLIERS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} - ({s.materialCategory})</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Thủ Kho / Cán Bộ Phụ Trách Kiểm Hàng *</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Tên Sản Phẩm / Vật Liệu Nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Khung Gỗ Óc Chó Sofa L"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Số Lượng Nhập *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="10"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Đơn Giá Nhập (VNĐ) *</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      required
                      placeholder="4500000"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Ghi Chú Kiểm Hàng / Biên Bản Bàn Giao</label>
                  <textarea
                    rows="2"
                    placeholder="Tình trạng tem mác, giấy chứng nhận chất lượng xuất xưởng..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Hoàn Tất Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
