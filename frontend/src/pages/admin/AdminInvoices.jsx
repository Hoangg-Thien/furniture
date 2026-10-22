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
  QrCode,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { MOCK_INVOICES } from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminInvoices({ showToast, activeRole = 'ADMIN' }) {
  const [invoices, setInvoices] = useState(MOCK_INVOICES)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchPayment =
      paymentFilter === 'ALL' || inv.paymentStatus === paymentFilter

    return matchSearch && matchPayment
  })

  function handlePrintInvoice(inv) {
    showToast(`Đang kết xuất bản in A4 cho hóa đơn #${inv.invoiceNumber}...`)
    window.print()
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Hóa Đơn & Chứng Từ Giao Lắp</h1>
          <p className="admin-page-subtitle">
            Hóa đơn bán lẻ & GTGT nội thất, tích hợp mã VietQR thanh toán tự động và mẫu in A4 chuẩn biên bản bàn giao.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              showToast('Đang kết xuất toàn bộ danh sách hóa đơn ra file Excel...')
            }}
          >
            <Download size={15} /> Xuất Báo Cáo Thuế
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm số hóa đơn (HD-...), mã đơn, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                className="admin-filter-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="ALL">Tất cả tình trạng thanh toán</option>
                <option value="PAID">Đã thanh toán 100%</option>
                <option value="DEPOSIT_50">Đã cọc 50% (Chờ thu COD)</option>
                <option value="UNPAID">Chưa thanh toán</option>
              </select>

              {(searchTerm || paymentFilter !== 'ALL') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSearchTerm('')
                    setPaymentFilter('ALL')
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Số Hóa Đơn</th>
                <th>Mã Đơn Hàng</th>
                <th>Khách Hàng & MST</th>
                <th className="text-right">Tiền Hàng (Trước thuế)</th>
                <th className="text-right">Thuế VAT (8%)</th>
                <th className="text-right">Giảm Voucher</th>
                <th className="text-right">Tổng Thanh Toán</th>
                <th className="text-center">Thanh Toán</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                      {inv.invoiceNumber}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                      {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>

                  <td>
                    <code style={{ color: 'var(--admin-primary)' }}>{inv.orderCode}</code>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{inv.customerName}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>
                      {inv.taxCode ? `MST: ${inv.taxCode}` : 'Khách lẻ không lấy MST'}
                    </div>
                  </td>

                  <td className="text-right tabular-nums">
                    {formatCurrency(inv.subtotal)}
                  </td>

                  <td className="text-right tabular-nums">
                    {formatCurrency(inv.vatAmount)}
                  </td>

                  <td className="text-right tabular-nums" style={{ color: '#10B981' }}>
                    {inv.discountAmount > 0 ? `- ${formatCurrency(inv.discountAmount)}` : '0 ₫'}
                  </td>

                  <td className="text-right tabular-nums">
                    <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--admin-text-main)' }}>
                      {formatCurrency(inv.finalAmount)}
                    </div>
                  </td>

                  <td className="text-center">
                    <span
                      className={`admin-status-badge ${
                        inv.paymentStatus === 'PAID'
                          ? 'success'
                          : inv.paymentStatus === 'DEPOSIT_50'
                          ? 'warning'
                          : 'danger'
                      }`}
                    >
                      <span className="dot" />
                      {inv.paymentStatus === 'PAID'
                        ? 'Đã trả đủ'
                        : inv.paymentStatus === 'DEPOSIT_50'
                        ? 'Đã cọc 50%'
                        : 'Chưa thanh toán'}
                    </span>
                  </td>

                  <td className="text-center">
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <Eye size={13} /> Mẫu In A4
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================================================
          MODAL: PROFESSIONAL A4 INVOICE & HANDOVER PREVIEW WITH VIETQR
         ========================================================================== */}
      {selectedInvoice && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '850px', maxHeight: '92vh', background: '#FFF', color: '#1E1B18' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Actions */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid #E8E4DD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8F7F4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: '#8B5E3C' }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#26211E' }}>
                  Xem Trước Bản In Hóa Đơn & Nghiệm Thu A4
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  style={{ background: '#8B5E3C', padding: '6px 14px', fontSize: '12.5px' }}
                >
                  <Printer size={14} /> In Hóa Đơn A4 (Ctrl + P)
                </button>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedInvoice(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet Container */}
            <div style={{ padding: '36px 44px', background: '#FFF', color: '#26211E', fontSize: '13px', lineHeight: 1.5 }}>
              {/* Company Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #8B5E3C', paddingBottom: '18px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8B5E3C', letterSpacing: '-0.02em' }}>
                    FURNISTORE
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
                    CÔNG TY CỔ PHẦN THIẾT KẾ & SẢN XUẤT NỘI THẤT FURNISTORE
                  </div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    Mã số thuế: 0314899214 · Hotline CSKH & Kỹ thuật: 1900.6868
                  </div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    Showroom chính: 142 Nguyễn Thị Thập, P. Tân Hưng, Quận 7, TP. Hồ Chí Minh
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#8B5E3C' }}>
                    HÓA ĐƠN BÁN HÀNG
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                    KÈM BIÊN BẢN NGHIỆM THU
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
                    Số: {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: '#777' }}>
                    Ngày lập: {new Date(selectedInvoice.issueDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Customer & Order Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '22px' }}>
                <div style={{ background: '#F8F7F4', padding: '14px 18px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#8B5E3C', marginBottom: '6px' }}>
                    THÔNG TIN KHÁCH HÀNG:
                  </div>
                  <div>Họ tên khách hàng: <strong>{selectedInvoice.customerName}</strong></div>
                  <div>Số điện thoại: <strong>0918.234.567</strong></div>
                  <div>Địa chỉ giao lắp: <strong>Can ho 14.02, Toa Landmark 3, Vinhomes Central Park, TP.HCM</strong></div>
                  <div>Mã số thuế doanh nghiệp: {selectedInvoice.taxCode || 'Không đăng ký'}</div>
                </div>

                <div style={{ background: '#F8F7F4', padding: '14px 18px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#8B5E3C', marginBottom: '6px' }}>
                    THÔNG TIN GIAO LẮP:
                  </div>
                  <div>Đơn hàng liên kết: <strong>#{selectedInvoice.orderCode}</strong></div>
                  <div>Kỹ thuật viên lắp ráp: <strong>Nguyễn Văn Đạt (Thợ trưởng)</strong></div>
                  <div>Phương tiện: <strong>Xe tải 1.5 tấn (29C-881.42)</strong></div>
                  <div>Thời hạn bảo hành: <strong>36 tháng khung gỗ</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#F4EFEA', borderBottom: '1px solid #DDD' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '12px' }}>STT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '12px' }}>Sản Phẩm & Quy Cách Biến Thể</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '12px' }}>ĐVT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '12px' }}>SL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px' }}>Đơn Giá (₫)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px' }}>Thành Tiền (₫)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #EEE' }}>
                    <td style={{ padding: '10px' }}>1</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600 }}>Sofa da bò Milan góc chữ L</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>Quy cách: Da bò Ý màu Nâu Cognac / 280 x 180 cm</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>Bộ</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>1</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>32.000.000</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>32.000.000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #EEE' }}>
                    <td style={{ padding: '10px' }}>2</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600 }}>Bàn trà tròn đôi mặt đá Ceramic</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>Quy cách: Đá trắng vân mây / Khung thép mạ vàng Champagne</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>Bộ</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>1</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>8.500.000</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>8.500.000</td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Calculation & VietQR Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'flex-start' }}>
                {/* VietQR Code Box */}
                <div style={{ border: '1px dashed #B07D52', borderRadius: '10px', padding: '14px', background: '#FBF9F6', display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '90px', height: '90px', background: '#FFF', border: '1px solid #DDD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={70} style={{ color: '#26211E' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#8B5E3C' }}>QUÉT VIETQR THANH TOÁN</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Ngân hàng: <strong>Vietcombank</strong></div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Số TK: <strong>0071000921482</strong></div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Chủ TK: <strong>CTY CP NOI THAT FURNISTORE</strong></div>
                    <div style={{ fontSize: '11px', color: '#8B5E3C', fontWeight: 600, marginTop: '2px' }}>Cú pháp: {selectedInvoice.orderCode}</div>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Tổng tiền hàng (chưa thuế):</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Thuế GTGT (VAT 8%):</span>
                    <span>+ {formatCurrency(selectedInvoice.vatAmount)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E7D32' }}>
                      <span>Chiết khấu Voucher tri ân:</span>
                      <span>- {formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Phí vận chuyển & lắp ráp chuyên dụng:</span>
                    <span style={{ color: '#2E7D32', fontWeight: 600 }}>Miễn phí</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', color: '#8B5E3C', borderTop: '2px solid #8B5E3C', paddingTop: '6px', marginTop: '4px' }}>
                    <span>TỔNG GIÁ TRỊ HÓA ĐƠN:</span>
                    <span>{formatCurrency(selectedInvoice.finalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E7D32', fontWeight: 600 }}>
                    <span>Đã thanh toán tiền cọc 50%:</span>
                    <span>{formatCurrency(selectedInvoice.finalAmount * 0.5)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700, fontSize: '13.5px', borderTop: '1px dashed #DDD', paddingTop: '4px' }}>
                    <span>SỐ TIỀN THU COD KHI BÀN GIAO:</span>
                    <span>{formatCurrency(selectedInvoice.finalAmount * 0.5)}</span>
                  </div>
                </div>
              </div>

              {/* Handover & Acceptance Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #EEE' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>NGƯỜI LẬP HÓA ĐƠN</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '55px' }} />
                  <div style={{ fontWeight: 600 }}>Lê Thị Thu Hà</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700 }}>KỸ THUẬT VIÊN GIAO LẮP</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>(Đã kiểm tra chất lượng tại phòng)</div>
                  <div style={{ height: '55px' }} />
                  <div style={{ fontWeight: 600 }}>Nguyễn Văn Đạt</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700 }}>KHÁCH HÀNG NGHIỆM THU</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>(Đã nhận đủ hàng, không trầy xước)</div>
                  <div style={{ height: '55px' }} />
                  <div style={{ fontWeight: 600 }}>{selectedInvoice.customerName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
