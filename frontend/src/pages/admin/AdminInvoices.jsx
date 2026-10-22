import React, { useState } from 'react'
import {
  FileText,
  Printer,
  Search,
  CheckCircle,
  Eye,
  Download,
  X,
  CreditCard,
} from 'lucide-react'
import { MOCK_INVOICES } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminInvoices({ showToast }) {
  const [invoices, setInvoices] = useState(MOCK_INVOICES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handlePrint(inv) {
    showToast(`Đang kết nối máy in để in hóa đơn ${inv.invoiceNumber}...`)
    setInvoices(invoices.map((i) => (i.id === inv.id ? { ...i, printed: true } : i)))
  }

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Hóa đơn Bán hàng (Invoices)</h1>
          <p className="admin-page-subtitle">
            Phát hành hóa đơn từ đơn đặt hàng, tính thuế VAT 8%, chiết khấu voucher và in ấn chứng từ bàn giao.
          </p>
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
                placeholder="Tìm số hóa đơn, mã đơn, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Đã phát hành: <strong>{invoices.length}</strong> hóa đơn
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Số Hóa Đơn</th>
                <th>Mã Đơn Hàng</th>
                <th>Khách Hàng & MST</th>
                <th>Tiền Hàng (Trước thuế)</th>
                <th>Thuế VAT (8%)</th>
                <th>Giảm Voucher</th>
                <th>Tổng Thanh Toán</th>
                <th>Thanh Toán</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>{inv.invoiceNumber}</span>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                      {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td>
                    <code style={{ color: '#60A5FA' }}>{inv.orderCode}</code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{inv.customerName}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>
                      {inv.taxCode ? `MST: ${inv.taxCode}` : 'Khách lẻ không lấy MST'}
                    </div>
                  </td>
                  <td>{formatCurrency(inv.subtotal)}</td>
                  <td>{formatCurrency(inv.vatAmount)}</td>
                  <td style={{ color: '#10B981' }}>- {formatCurrency(inv.discountAmount)}</td>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>
                    {formatCurrency(inv.totalPayment)}
                  </td>
                  <td>
                    <span className={`admin-badge ${inv.paymentStatus === 'PAID' ? 'success' : 'warning'}`}>
                      {inv.paymentStatus === 'PAID' ? 'Đã Thanh Toán Đủ' : 'Đã Cọc 50%'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px' }}
                        title="Xem hóa đơn"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px', color: '#F59E0B' }}
                        title="In hóa đơn"
                        onClick={() => handlePrint(inv)}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View & Print Invoice */}
      {selectedInvoice && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">HÓA ĐƠN NỘI THẤT: {selectedInvoice.invoiceNumber}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedInvoice(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ background: '#0B0F17', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#F59E0B' }}>FURNISTORE VIỆT NAM</h2>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Hệ thống Quản lý Kinh doanh Nội thất Cao cấp</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>MST: 0317899222 · Hotline: 1900 8899</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>{selectedInvoice.invoiceNumber}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Ngày: {new Date(selectedInvoice.issueDate).toLocaleDateString('vi-VN')}</div>
                  <div style={{ fontSize: '12px', color: '#60A5FA' }}>Mã đơn: {selectedInvoice.orderCode}</div>
                </div>
              </div>

              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Khách hàng: <strong style={{ color: '#FFF' }}>{selectedInvoice.customerName}</strong></div>
                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Điện thoại: {selectedInvoice.phone}</div>
                {selectedInvoice.taxCode && (
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Mã số thuế doanh nghiệp: {selectedInvoice.taxCode}</div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Hình thức thanh toán: {selectedInvoice.paymentMethod}</div>
              </div>

              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                  <span>Tiền hàng trước thuế:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                  <span>Thuế GTGT (VAT 8%):</span>
                  <span>+ {formatCurrency(selectedInvoice.vatAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                  <span>Giảm giá Voucher:</span>
                  <span>- {formatCurrency(selectedInvoice.discountAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontWeight: 700, fontSize: '18px', borderTop: '1px solid var(--admin-border)', paddingTop: '10px' }}>
                  <span>Tổng tiền thanh toán:</span>
                  <span style={{ color: '#F59E0B' }}>{formatCurrency(selectedInvoice.totalPayment)}</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  handlePrint(selectedInvoice)
                  setSelectedInvoice(null)
                }}
              >
                <Printer size={16} /> In Hóa Đơn & Xuất File
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
