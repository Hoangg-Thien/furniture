import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Search,
  RefreshCw,
  Eye,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Percent,
  FileText,
  Building,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminInvoiceManagement({ currentUser }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    cashCount: 0,
    bankTransferCount: 0,
    posCardCount: 0,
    eWalletCount: 0,
    paidCount: 0,
    refundedCount: 0
  })

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printFormat, setPrintFormat] = useState('A4') // A4 | K80

  // Eligible orders for creating invoices
  const [eligibleOrders, setEligibleOrders] = useState([])
  const [eligibleLoading, setEligibleLoading] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null)

  // Form inputs for creating invoice
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [includeVat, setIncludeVat] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [notes, setNotes] = useState('')
  const [previewCalculation, setPreviewCalculation] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // Feedback Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load invoices list
  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      if (searchKeyword.trim()) params.append('search', searchKeyword.trim())
      if (selectedMethod && selectedMethod !== 'ALL') params.append('paymentMethod', selectedMethod)
      if (selectedStatus && selectedStatus !== 'ALL') params.append('paymentStatus', selectedStatus)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      params.append('page', page)
      params.append('size', pageSize)

      const res = await fetch(`${baseUrl}/api/admin/invoices?${params.toString()}`, {
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn!')
      const data = await res.json()
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load stats
  const fetchStats = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/counts`, {
        headers: getApiHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Lỗi tải thống kê hóa đơn:', err)
    }
  }

  // Load eligible orders
  const fetchEligibleOrders = async () => {
    setEligibleLoading(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/eligible-orders`, {
        headers: getApiHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setEligibleOrders(data || [])
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn chờ xuất hóa đơn:', err)
    } finally {
      setEligibleLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [page, pageSize, selectedMethod, selectedStatus])

  // Khi chọn 1 đơn hàng trong modal tạo hóa đơn, tự động tải chi tiết và preview tính tiền
  const handleSelectOrder = async (orderId) => {
    setSelectedOrderId(orderId)
    setVoucherCodeInput('')
    setIncludeVat(false)
    setPreviewCalculation(null)

    if (!orderId) {
      setSelectedOrderInfo(null)
      return
    }

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}`, {
        headers: getApiHeaders()
      })
      if (res.ok) {
        const orderData = await res.json()
        setSelectedOrderInfo(orderData)
        // Nếu đơn hàng đã có voucher từ trước, điền sẵn
        if (orderData.voucherCode) {
          setVoucherCodeInput(orderData.voucherCode)
        }
        // Gọi preview calculation
        calculatePreview(orderId, orderData.voucherCode || '', false)
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đơn hàng:', err)
    }
  }

  // Gọi API preview calculation
  const calculatePreview = async (orderId, voucherCode, vat) => {
    if (!orderId) return
    setCalculating(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/preview-calculation`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          orderId: Number(orderId),
          voucherCode: voucherCode ? voucherCode.trim() : null,
          includeVat: vat,
          vatPercent: 8.0
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewCalculation(data)
      }
    } catch (err) {
      console.error('Lỗi tính toán xem trước:', err)
    } finally {
      setCalculating(false)
    }
  }

  // Xem chi tiết hóa đơn
  const handleViewDetail = async (invoiceId) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/${invoiceId}`, {
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể tải chi tiết hóa đơn')
      const data = await res.json()
      setSelectedInvoice(data)
    } catch (err) {
      showToast(err.message, 'error')
      setShowDetailModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // Tải file PDF
  const handleDownloadPdf = async (invoiceId, invoiceCode) => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/${invoiceId}/pdf`, {
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể tải file PDF hóa đơn!')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceCode || 'invoice'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('Đã tải hóa đơn PDF thành công!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Tạo hóa đơn mới
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOrderId) {
      showToast('Vui lòng chọn đơn hàng cần xuất hóa đơn!', 'error')
      return
    }

    setCreateSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const staffUserId = currentUser?.id || null
      const url = staffUserId
        ? `${baseUrl}/api/admin/invoices?staffUserId=${staffUserId}`
        : `${baseUrl}/api/admin/invoices`

      const res = await fetch(url, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          orderId: Number(selectedOrderId),
          paymentMethod: paymentMethod,
          voucherCode: voucherCodeInput ? voucherCodeInput.trim() : null,
          includeVat: includeVat,
          vatPercent: 8.0,
          notes: notes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Xuất hóa đơn thất bại!')
      }

      showToast(`Đã xuất hóa đơn ${data.invoiceCode} thành công!`, 'success')
      setShowCreateModal(false)
      setSelectedOrderId('')
      setSelectedOrderInfo(null)
      setVoucherCodeInput('')
      setNotes('')
      fetchInvoices()
      fetchStats()
      // Mở luôn modal xem và in hóa đơn vừa tạo
      setSelectedInvoice(data)
      setShowDetailModal(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Trigger print
  const handlePrint = () => {
    window.print()
  }

  const formatVnd = (num) => {
    if (num === null || num === undefined) return '0 đ'
    return Number(num).toLocaleString('vi-VN') + ' đ'
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return '---'
    const d = new Date(isoStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodBadge = (method) => {
    switch (method) {
      case 'BANK_TRANSFER':
        return (
          <span className="inv-badge inv-badge-bank">
            <QrCode size={13} /> VietQR
          </span>
        )
      case 'CASH':
        return (
          <span className="inv-badge inv-badge-cash">
            <Banknote size={13} /> Tiền mặt
          </span>
        )
      case 'CREDIT_CARD':
        return (
          <span className="inv-badge inv-badge-card">
            <CreditCard size={13} /> Thẻ POS
          </span>
        )
      case 'VNPAY':
      case 'MOMO':
        return (
          <span className="inv-badge inv-badge-ewallet">
            <Wallet size={13} /> {method}
          </span>
        )
      default:
        return <span className="inv-badge inv-badge-default">{method}</span>
    }
  }

  return (
    <div className="admin-page-container invoice-module-wrapper">
      {/* Toast Alert */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <div className="admin-page-icon-wrapper" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
            <Receipt size={24} color="#fff" />
          </div>
          <div>
            <h1 className="admin-page-title">Quản Lý Hóa Đơn & Thanh Toán</h1>
            <p className="admin-page-subtitle">
              Xuất chứng từ thanh toán chính thức, áp dụng chiết khấu voucher & VAT, quét VietQR động và in hóa đơn bán lẻ
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              fetchInvoices()
              fetchStats()
            }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'admin-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            className="admin-btn admin-btn-primary"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', borderColor: '#0f766e' }}
            onClick={() => {
              fetchEligibleOrders()
              setShowCreateModal(true)
            }}
          >
            <Plus size={16} />
            <span>+ Lập Hóa Đơn Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488' }}>
            <Receipt size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng hóa đơn</span>
            <h3 className="inv-stat-value">{stats.total} <span className="inv-stat-unit">chứng từ</span></h3>
            <span className="inv-stat-sub text-success">
              <CheckCircle2 size={12} /> {stats.paidCount} đã thanh toán
            </span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng doanh thu thực tế</span>
            <h3 className="inv-stat-value text-emerald">{formatVnd(stats.totalRevenue)}</h3>
            <span className="inv-stat-sub text-muted">
              Đã bao gồm VAT & khấu trừ Voucher
            </span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <QrCode size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Chuyển khoản VietQR</span>
            <h3 className="inv-stat-value">{stats.bankTransferCount} <span className="inv-stat-unit">giao dịch</span></h3>
            <span className="inv-stat-sub text-info">
              {stats.total > 0 ? Math.round((stats.bankTransferCount / stats.total) * 100) : 0}% tỷ trọng thanh toán
            </span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <CreditCard size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tiền mặt & Thẻ POS</span>
            <h3 className="inv-stat-value">{stats.cashCount + stats.posCardCount} <span className="inv-stat-unit">hóa đơn</span></h3>
            <span className="inv-stat-sub text-muted">
              Tiền mặt: {stats.cashCount} | POS: {stats.posCardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-row">
          <div className="admin-search-box">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, tên khách, số điện thoại..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            />
            {searchKeyword && (
              <button className="admin-search-clear" onClick={() => { setSearchKeyword(''); fetchInvoices() }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            <label>Phương thức:</label>
            <select
              value={selectedMethod}
              onChange={(e) => { setSelectedMethod(e.target.value); setPage(0) }}
            >
              <option value="ALL">Tất cả phương thức</option>
              <option value="BANK_TRANSFER">Chuyển khoản VietQR</option>
              <option value="CASH">Tiền mặt (Cash)</option>
              <option value="CREDIT_CARD">Quẹt thẻ POS</option>
              <option value="VNPAY">Ví điện tử VNPay</option>
              <option value="MOMO">Ví MoMo</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label>Trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(0) }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="REFUNDED">Hoàn tiền (REFUNDED)</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0) }}
            />
          </div>

          <div className="admin-filter-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0) }}
            />
          </div>

          <button className="admin-btn admin-btn-primary" onClick={() => { setPage(0); fetchInvoices() }}>
            <Search size={14} /> Lọc
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-table-loading">
            <RefreshCw size={28} className="admin-spin" />
            <p>Đang tải danh sách hóa đơn bán lẻ...</p>
          </div>
        ) : error ? (
          <div className="admin-table-empty text-danger">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button className="admin-btn admin-btn-secondary" onClick={fetchInvoices}>Thử lại</button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="admin-table-empty">
            <Receipt size={40} style={{ opacity: 0.3 }} />
            <p>Chưa có hóa đơn bán hàng nào phù hợp với bộ lọc</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Mã hóa đơn</th>
                <th style={{ width: 100 }}>Mã đơn</th>
                <th>Khách hàng</th>
                <th style={{ width: 150 }}>Ngày xuất</th>
                <th style={{ width: 150 }}>Hình thức</th>
                <th style={{ width: 130 }}>Chiết khấu</th>
                <th style={{ width: 140, textAlign: 'right' }}>Tổng thanh toán</th>
                <th style={{ width: 120 }}>Thu ngân</th>
                <th style={{ width: 160, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="inv-table-row">
                  <td>
                    <span className="inv-code-badge">{inv.invoiceCode}</span>
                  </td>
                  <td>
                    <span className="inv-order-tag">#{inv.orderId}</span>
                  </td>
                  <td>
                    <div className="inv-customer-cell">
                      <span className="inv-cust-name">{inv.customerName}</span>
                      <span className="inv-cust-phone"><Phone size={11} /> {inv.phone || 'Chưa có SĐT'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inv-date-cell">
                      <Calendar size={12} /> {formatDate(inv.paymentDate)}
                    </div>
                  </td>
                  <td>{getMethodBadge(inv.paymentMethod)}</td>
                  <td>
                    {inv.voucherDiscount && Number(inv.voucherDiscount) > 0 ? (
                      <span className="inv-discount-pill text-emerald">
                        <Tag size={11} /> -{formatVnd(inv.voucherDiscount)}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.82rem' }}>0 đ</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="inv-final-price">{formatVnd(inv.finalAmount)}</span>
                    {inv.taxAmount && Number(inv.taxAmount) > 0 && (
                      <span className="inv-tax-sub">Đã gồm VAT</span>
                    )}
                  </td>
                  <td>
                    <span className="inv-staff-badge">
                      <User size={11} /> {inv.staffName || 'Admin'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'center' }}>
                      <button
                        className="admin-action-btn admin-btn-view"
                        title="Xem & In hóa đơn bán lẻ"
                        onClick={() => handleViewDetail(inv.id)}
                      >
                        <Eye size={15} />
                        <span>Xem & In</span>
                      </button>
                      <button
                        className="admin-action-btn admin-btn-pdf"
                        title="Tải file PDF"
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceCode)}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Hiển thị {invoices.length} trên tổng số {totalElements} hóa đơn
            </span>
            <div className="admin-pagination-controls">
              <button
                className="admin-pagination-btn"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <span className="admin-pagination-current">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="admin-pagination-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LẬP HÓA ĐƠN MỚI TỪ ĐƠN HÀNG */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card inv-create-modal">
            <div className="admin-modal-header" style={{ borderBottom: '1px solid rgba(13, 148, 136, 0.2)' }}>
              <div className="inv-modal-title">
                <Receipt size={20} className="text-teal" />
                <div>
                  <h3>Lập Hóa Đơn Bán Hàng Mới</h3>
                  <p>Chọn đơn hàng chưa xuất hóa đơn, áp voucher & xác nhận phương thức thanh toán</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit}>
              <div className="admin-modal-body inv-create-body">
                {/* Bước 1: Chọn đơn hàng */}
                <div className="inv-form-section">
                  <h4 className="inv-section-title">
                    <span className="inv-step-badge">1</span> Chọn đơn đặt hàng cần xuất hóa đơn
                  </h4>
                  {eligibleLoading ? (
                    <div className="inv-loading-box"><RefreshCw size={16} className="admin-spin" /> Đang tải danh sách đơn hàng chưa lập hóa đơn...</div>
                  ) : eligibleOrders.length === 0 ? (
                    <div className="inv-empty-orders">
                      <CheckCircle2 size={24} className="text-success" />
                      <span>Tất cả các đơn hàng hợp lệ hiện đều đã được xuất hóa đơn đầy đủ!</span>
                    </div>
                  ) : (
                    <div className="inv-order-select-grid">
                      <select
                        className="admin-form-input inv-order-select"
                        value={selectedOrderId}
                        onChange={(e) => handleSelectOrder(e.target.value)}
                        required
                      >
                        <option value="">-- Bấm để chọn đơn hàng ({eligibleOrders.length} đơn sẵn sàng) --</option>
                        {eligibleOrders.map((ord) => (
                          <option key={ord.orderId} value={ord.orderId}>
                            Đơn #{ord.orderId} - {ord.customerName} ({ord.phone || 'SĐT'}) - {formatVnd(ord.totalAmount)} [{ord.status}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Thông tin preview đơn hàng */}
                  {selectedOrderInfo && (
                    <div className="inv-order-preview-card">
                      <div className="inv-order-preview-header">
                        <div>
                          <strong>Đơn hàng #{selectedOrderInfo.id}</strong>
                          <span className="inv-order-status-tag">{selectedOrderInfo.status}</span>
                        </div>
                        <span className="text-muted"><Calendar size={13} /> {formatDate(selectedOrderInfo.orderDate)}</span>
                      </div>
                      <div className="inv-order-preview-customer">
                        <div><User size={13} /> Khách hàng: <strong>{selectedOrderInfo.customerName}</strong></div>
                        <div><Phone size={13} /> SĐT: {selectedOrderInfo.phone || 'Chưa cung cấp'}</div>
                        <div><MapPin size={13} /> Địa chỉ: {selectedOrderInfo.address || 'Tại showroom'}</div>
                      </div>

                      {/* Items table preview */}
                      <div className="inv-preview-items">
                        <table className="inv-mini-table">
                          <thead>
                            <tr>
                              <th>Sản phẩm</th>
                              <th style={{ width: 70, textAlign: 'center' }}>SL</th>
                              <th style={{ width: 110, textAlign: 'right' }}>Đơn giá</th>
                              <th style={{ width: 120, textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrderInfo.items?.map((it, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div className="inv-mini-item">
                                    {it.imageUrl && <img src={it.imageUrl} alt="" className="inv-mini-thumb" />}
                                    <span>{it.productName}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>{it.quantity} {it.unit}</td>
                                <td style={{ textAlign: 'right' }}>{formatVnd(it.unitPrice)}</td>
                                <td style={{ textAlign: 'right' }} className="fw-600">{formatVnd(it.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bước 2: Chiết khấu, Voucher & Thuế VAT */}
                {selectedOrderId && (
                  <div className="inv-form-section">
                    <h4 className="inv-section-title">
                      <span className="inv-step-badge">2</span> Khuyến mãi, Voucher & Thuế VAT
                    </h4>

                    <div className="inv-calc-controls-row">
                      <div className="inv-voucher-input-group">
                        <label>Mã Voucher / Khuyến mãi:</label>
                        <div className="inv-voucher-field">
                          <Tag size={15} className="inv-field-icon" />
                          <input
                            type="text"
                            placeholder="Nhập mã voucher (vd: VIP10, KHAITRUONG...)"
                            value={voucherCodeInput}
                            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          />
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary inv-apply-btn"
                            onClick={() => calculatePreview(selectedOrderId, voucherCodeInput, includeVat)}
                            disabled={calculating}
                          >
                            {calculating ? <RefreshCw size={13} className="admin-spin" /> : 'Áp dụng'}
                          </button>
                        </div>
                      </div>

                      <div className="inv-vat-toggle-group">
                        <label className="inv-checkbox-label">
                          <input
                            type="checkbox"
                            checked={includeVat}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setIncludeVat(checked)
                              calculatePreview(selectedOrderId, voucherCodeInput, checked)
                            }}
                          />
                          <span className="inv-check-text">
                            <strong>Xuất hóa đơn tài chính VAT (8%)</strong>
                            <small>Áp dụng thuế giá trị gia tăng sau chiết khấu</small>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Feedback Voucher */}
                    {previewCalculation && previewCalculation.voucherMessage && (
                      <div className={`inv-calc-feedback ${previewCalculation.voucherValid ? 'feedback-success' : 'feedback-warning'}`}>
                        {previewCalculation.voucherValid ? <Check size={16} /> : <AlertCircle size={16} />}
                        <span>{previewCalculation.voucherMessage}</span>
                      </div>
                    )}

                    {/* Breakdown Card */}
                    {previewCalculation && (
                      <div className="inv-breakdown-card">
                        <div className="inv-breakdown-row">
                          <span>Tổng tiền hàng niêm yết (Subtotal):</span>
                          <span>{formatVnd(previewCalculation.originalSubtotal)}</span>
                        </div>
                        {previewCalculation.orderDiscount > 0 && (
                          <div className="inv-breakdown-row text-emerald">
                            <span>Chiết khấu đơn hàng:</span>
                            <span>-{formatVnd(previewCalculation.orderDiscount)}</span>
                          </div>
                        )}
                        {previewCalculation.voucherDiscount > 0 && (
                          <div className="inv-breakdown-row text-emerald">
                            <span>Giảm giá Voucher ({previewCalculation.voucherCode}):</span>
                            <span>-{formatVnd(previewCalculation.voucherDiscount)}</span>
                          </div>
                        )}
                        {previewCalculation.vatAmount > 0 && (
                          <div className="inv-breakdown-row">
                            <span>Thuế VAT ({previewCalculation.vatPercent}%):</span>
                            <span>+{formatVnd(previewCalculation.vatAmount)}</span>
                          </div>
                        )}
                        <div className="inv-breakdown-divider"></div>
                        <div className="inv-breakdown-total">
                          <span>TỔNG CỘNG THANH TOÁN:</span>
                          <span className="inv-total-price">{formatVnd(previewCalculation.finalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bước 3: Phương thức thanh toán */}
                {selectedOrderId && (
                  <div className="inv-form-section">
                    <h4 className="inv-section-title">
                      <span className="inv-step-badge">3</span> Phương thức thanh toán & Ghi chú
                    </h4>

                    <div className="inv-payment-methods-grid">
                      <label className={`inv-method-card ${paymentMethod === 'BANK_TRANSFER' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BANK_TRANSFER"
                          checked={paymentMethod === 'BANK_TRANSFER'}
                          onChange={() => setPaymentMethod('BANK_TRANSFER')}
                        />
                        <div className="inv-method-content">
                          <QrCode size={20} className="text-teal" />
                          <div>
                            <strong>Chuyển khoản VietQR</strong>
                            <span>Quét mã QR ngân hàng tự động</span>
                          </div>
                        </div>
                      </label>

                      <label className={`inv-method-card ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={paymentMethod === 'CASH'}
                          onChange={() => setPaymentMethod('CASH')}
                        />
                        <div className="inv-method-content">
                          <Banknote size={20} className="text-emerald" />
                          <div>
                            <strong>Tiền mặt tại quầy</strong>
                            <span>Thanh toán trực tiếp khi nhận hàng</span>
                          </div>
                        </div>
                      </label>

                      <label className={`inv-method-card ${paymentMethod === 'CREDIT_CARD' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CREDIT_CARD"
                          checked={paymentMethod === 'CREDIT_CARD'}
                          onChange={() => setPaymentMethod('CREDIT_CARD')}
                        />
                        <div className="inv-method-content">
                          <CreditCard size={20} className="text-amber" />
                          <div>
                            <strong>Quẹt thẻ qua POS</strong>
                            <span>Thẻ ATM nội địa / Visa / Master</span>
                          </div>
                        </div>
                      </label>

                      <label className={`inv-method-card ${paymentMethod === 'MOMO' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="MOMO"
                          checked={paymentMethod === 'MOMO'}
                          onChange={() => setPaymentMethod('MOMO')}
                        />
                        <div className="inv-method-content">
                          <Wallet size={20} className="text-purple" />
                          <div>
                            <strong>Ví MoMo / VNPay</strong>
                            <span>Cổng thanh toán điện tử</span>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Dynamic QR Demo if Bank Transfer */}
                    {paymentMethod === 'BANK_TRANSFER' && previewCalculation && (
                      <div className="inv-vietqr-box">
                        <div className="inv-vietqr-info">
                          <h5><Sparkles size={14} className="text-teal" /> Thanh toán VietQR động theo đơn</h5>
                          <p>Số tài khoản: <strong>0312345678</strong> - MB Bank</p>
                          <p>Chủ tài khoản: <strong>SHOWROOM NOI THAT CAO CAP</strong></p>
                          <p>Số tiền: <strong className="text-emerald">{formatVnd(previewCalculation.finalAmount)}</strong></p>
                          <p>Nội dung: <strong>HD-{selectedOrderId}</strong></p>
                        </div>
                        <img
                          src={`https://img.vietqr.io/image/MB-0312345678-compact.png?amount=${previewCalculation.finalAmount}&addInfo=HD-${selectedOrderId}&accountName=SHOWROOM%20NOI%20THAT%20CAO%20CAP`}
                          alt="VietQR"
                          className="inv-vietqr-img"
                        />
                      </div>
                    )}

                    <div className="inv-notes-field">
                      <label>Ghi chú trên hóa đơn (tùy chọn):</label>
                      <textarea
                        rows={2}
                        className="admin-form-input"
                        placeholder="Ghi chú giao hàng, chính sách thỏa thuận riêng..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', borderColor: '#0f766e' }}
                  disabled={!selectedOrderId || createSubmitting}
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw size={15} className="admin-spin" />
                      <span>Đang xuất hóa đơn...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Xuất Hóa Đơn & Ghi Nhận Thanh Toán</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHI TIẾT & MẪU IN HÓA ĐƠN BÁN LẺ SHOWROOM (A4 / K80) */}
      {/* ========================================================================= */}
      {showDetailModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card inv-printable-modal">
            {/* Top Toolbar (Hidden on print) */}
            <div className="inv-modal-toolbar print-hide">
              <div className="inv-toolbar-left">
                <span className="inv-toolbar-title">
                  <Receipt size={18} className="text-teal" /> Mẫu In Hóa Đơn Bán Lẻ
                </span>
                <div className="inv-format-toggle">
                  <button
                    className={`inv-format-btn ${printFormat === 'A4' ? 'active' : ''}`}
                    onClick={() => setPrintFormat('A4')}
                  >
                    Khổ A4 Showroom
                  </button>
                  <button
                    className={`inv-format-btn ${printFormat === 'K80' ? 'active' : ''}`}
                    onClick={() => setPrintFormat('K80')}
                  >
                    Khổ K80 Giấy Cuộn
                  </button>
                </div>
              </div>

              <div className="inv-toolbar-right">
                <button
                  className="admin-btn admin-btn-primary inv-print-btn"
                  onClick={handlePrint}
                >
                  <Printer size={15} /> In hóa đơn
                </button>
                {selectedInvoice && (
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceCode)}
                  >
                    <Download size={15} /> Tải PDF
                  </button>
                )}
                <button
                  className="admin-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Paper Container */}
            <div className="inv-paper-wrapper">
              {detailLoading ? (
                <div className="admin-table-loading" style={{ minHeight: 350 }}>
                  <RefreshCw size={28} className="admin-spin" />
                  <p>Đang tải chi tiết hóa đơn...</p>
                </div>
              ) : selectedInvoice ? (
                <div id="printable-invoice-paper" className={`inv-paper ${printFormat === 'K80' ? 'inv-paper-k80' : 'inv-paper-a4'}`}>
                  {/* Showroom Brand Header */}
                  <div className="inv-showroom-header">
                    <div className="inv-showroom-logo">
                      <Building size={24} className="inv-logo-icon" />
                      <div>
                        <h2>SHOWROOM NỘI THẤT CAO CẤP</h2>
                        <p>Kiến tạo không gian sống thượng lưu & đẳng cấp</p>
                      </div>
                    </div>
                    <div className="inv-showroom-meta">
                      <p><strong>Địa chỉ:</strong> 123 Đường Nội Thất, TP. Hồ Chí Minh</p>
                      <p><strong>Hotline:</strong> 1900 6868  -  <strong>MST:</strong> 0312345678</p>
                    </div>
                  </div>

                  <div className="inv-divider"></div>

                  {/* Invoice Document Title */}
                  <div className="inv-doc-title-block">
                    <h1>{printFormat === 'K80' ? 'PHIẾU BÁN LẺ NỘI THẤT' : 'HÓA ĐƠN BÁN HÀNG NỘI THẤT'}</h1>
                    <div className="inv-doc-code">
                      <span>Số: <strong>{selectedInvoice.invoiceCode}</strong></span>
                      <span>Mã đơn gốc: <strong>#{selectedInvoice.orderId}</strong></span>
                    </div>
                  </div>

                  {/* Customer & Staff Info */}
                  <div className="inv-info-grid">
                    <div className="inv-info-col">
                      <p><strong>Khách hàng:</strong> {selectedInvoice.customerName}</p>
                      <p><strong>Số điện thoại:</strong> {selectedInvoice.phone || 'Chưa cung cấp'}</p>
                      <p><strong>Địa chỉ giao:</strong> {selectedInvoice.address || 'Nhận tại showroom'}</p>
                    </div>
                    <div className="inv-info-col inv-info-right">
                      <p><strong>Ngày lập:</strong> {formatDate(selectedInvoice.paymentDate)}</p>
                      <p><strong>Thu ngân:</strong> {selectedInvoice.staffName || 'Admin Showroom'}</p>
                      <p><strong>Phương thức:</strong> {selectedInvoice.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="inv-items-table-container">
                    <table className="inv-paper-table">
                      <thead>
                        <tr>
                          <th style={{ width: 35, textAlign: 'center' }}>STT</th>
                          <th>Tên mặt hàng nội thất</th>
                          <th style={{ width: 50, textAlign: 'center' }}>ĐVT</th>
                          <th style={{ width: 50, textAlign: 'center' }}>SL</th>
                          <th style={{ width: 110, textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ width: 130, textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td>
                              <strong>{item.productName}</strong>
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.unit || 'cái'}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{formatVnd(item.unitPrice)}</td>
                            <td style={{ textAlign: 'right' }}><strong>{formatVnd(item.amount)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Summary */}
                  <div className="inv-summary-container">
                    <div className="inv-summary-left">
                      {selectedInvoice.qrCodeUrl && (
                        <div className="inv-paper-qr-box">
                          <img src={selectedInvoice.qrCodeUrl} alt="VietQR" className="inv-paper-qr-img" />
                          <small>Quét mã VietQR để kiểm tra / thanh toán</small>
                        </div>
                      )}
                      {selectedInvoice.notes && (
                        <div className="inv-paper-notes">
                          <em>* Ghi chú: {selectedInvoice.notes}</em>
                        </div>
                      )}
                    </div>

                    <div className="inv-summary-right">
                      <div className="inv-sum-row">
                        <span>Tổng tiền hàng:</span>
                        <span>{formatVnd(selectedInvoice.subtotalAmount)}</span>
                      </div>
                      {selectedInvoice.voucherDiscount && Number(selectedInvoice.voucherDiscount) > 0 && (
                        <div className="inv-sum-row inv-sum-discount">
                          <span>Chiết khấu Voucher ({selectedInvoice.voucherCode}):</span>
                          <span>-{formatVnd(selectedInvoice.voucherDiscount)}</span>
                        </div>
                      )}
                      {selectedInvoice.taxAmount && Number(selectedInvoice.taxAmount) > 0 && (
                        <div className="inv-sum-row">
                          <span>Thuế VAT (8%):</span>
                          <span>+{formatVnd(selectedInvoice.taxAmount)}</span>
                        </div>
                      )}
                      <div className="inv-sum-divider"></div>
                      <div className="inv-sum-final">
                        <span>TỔNG CỘNG:</span>
                        <span className="inv-sum-final-num">{formatVnd(selectedInvoice.finalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warranty & Footer */}
                  <div className="inv-footer-policy">
                    <p className="inv-policy-title">
                      <ShieldCheck size={14} /> CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG:
                    </p>
                    <p className="inv-policy-content">
                      Đồ nội thất gỗ tự nhiên được bảo hành khung gỗ <strong>05 năm</strong>, bảo hành nệm mút & phụ kiện <strong>02 năm</strong>.
                      Vui lòng giữ hóa đơn bán hàng này để được hưởng trọn vẹn quyền lợi hậu mãi.
                    </p>
                    <p className="inv-policy-thanks">
                      ✨ Cảm ơn Quý khách đã tin tưởng và đồng hành cùng Showroom Nội Thất Cao Cấp! ✨
                    </p>
                  </div>

                  {/* Signature line for A4 */}
                  {printFormat === 'A4' && (
                    <div className="inv-signatures-row">
                      <div className="inv-sig-box">
                        <p><strong>Người mua hàng</strong></p>
                        <span>(Ký, ghi rõ họ tên)</span>
                      </div>
                      <div className="inv-sig-box">
                        <p><strong>Nhân viên thu ngân</strong></p>
                        <span>(Ký, ghi rõ họ tên)</span>
                        <div style={{ marginTop: 40, fontWeight: 600 }}>{selectedInvoice.staffName || 'Admin'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
