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
    <div className="admin-module-view">
      {/* Toast Alert */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} type="button">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Quản lý hóa đơn &gt; <span>Module 09</span>
          </div>
          <h1 className="admin-page-title">Quản Lý Hóa Đơn &amp; Thanh Toán</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Xuất chứng từ thanh toán chính thức, áp dụng chiết khấu voucher &amp; VAT, quét VietQR động và in hóa đơn bán lẻ.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => {
              fetchInvoices()
              fetchStats()
            }}
            disabled={loading}
            title="Làm mới danh sách và số liệu"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-accent"
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

      {/* KPI Stats Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card card-total">
          <div className="inv-stat-icon" style={{ background: '#EFF6FF', color: '#0284C7' }}>
            <Receipt size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng hóa đơn</span>
            <h3 className="inv-stat-value">{stats.total} <span className="inv-stat-unit">chứng từ</span></h3>
            <span className="inv-stat-sub" style={{ color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> {stats.paidCount} đã thanh toán
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-revenue">
          <div className="inv-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <DollarSign size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Doanh thu thực tế</span>
            <h3 className="inv-stat-value text-emerald">{formatVnd(stats.totalRevenue)}</h3>
            <span className="inv-stat-sub" style={{ color: '#78716C' }}>
              Đã gồm VAT &amp; trừ Voucher
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-vietqr">
          <div className="inv-stat-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <QrCode size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Chuyển khoản VietQR</span>
            <h3 className="inv-stat-value">{stats.bankTransferCount} <span className="inv-stat-unit">giao dịch</span></h3>
            <span className="inv-stat-sub" style={{ color: '#0F766E', fontWeight: 600 }}>
              {stats.total > 0 ? Math.round((stats.bankTransferCount / stats.total) * 100) : 0}% tỷ trọng thanh toán
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-pos">
          <div className="inv-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <CreditCard size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tiền mặt &amp; Quẹt thẻ POS</span>
            <h3 className="inv-stat-value">{stats.cashCount + stats.posCardCount} <span className="inv-stat-unit">hóa đơn</span></h3>
            <span className="inv-stat-sub" style={{ color: '#78716C' }}>
              Tiền mặt: {stats.cashCount} | Quẹt POS: {stats.posCardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Method Tab Bar */}
      <div className="inv-method-tabs-card">
        <div className="inv-method-tabs-wrapper">
          <button
            type="button"
            className={`inv-method-tab ${selectedMethod === 'ALL' ? 'active' : ''}`}
            onClick={() => {
              setSelectedMethod('ALL')
              setPage(0)
            }}
          >
            <span>Tất Cả Phương Thức</span>
            <span className="tab-badge">{stats.total}</span>
          </button>

          <button
            type="button"
            className={`inv-method-tab ${selectedMethod === 'BANK_TRANSFER' ? 'active' : ''}`}
            onClick={() => {
              setSelectedMethod('BANK_TRANSFER')
              setPage(0)
            }}
          >
            <QrCode size={14} />
            <span>Chuyển Khoản VietQR</span>
            <span className="tab-badge">{stats.bankTransferCount}</span>
          </button>

          <button
            type="button"
            className={`inv-method-tab ${selectedMethod === 'CASH' ? 'active' : ''}`}
            onClick={() => {
              setSelectedMethod('CASH')
              setPage(0)
            }}
          >
            <Banknote size={14} />
            <span>Tiền Mặt Tại Quầy</span>
            <span className="tab-badge">{stats.cashCount}</span>
          </button>

          <button
            type="button"
            className={`inv-method-tab ${selectedMethod === 'CREDIT_CARD' ? 'active' : ''}`}
            onClick={() => {
              setSelectedMethod('CREDIT_CARD')
              setPage(0)
            }}
          >
            <CreditCard size={14} />
            <span>Quẹt Thẻ POS</span>
            <span className="tab-badge">{stats.posCardCount}</span>
          </button>
        </div>
      </div>

      {/* Toolbar Tìm Kiếm & Bộ Lọc Nâng Cao */}
      <div className="inv-filter-toolbar">
        <div className="inv-filter-grid">
          {/* Keyword Search */}
          <div className="inv-filter-search">
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm theo Mã hóa đơn (HD-...), Mã đơn (#41), Tên khách, SĐT..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(0)
                  fetchInvoices()
                }
              }}
            />
            {searchKeyword && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setSearchKeyword('')
                  setPage(0)
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Trạng thái thanh toán */}
          <div className="inv-filter-select-group filter-select-group">
            <label>Trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="REFUNDED">Hoàn tiền (REFUNDED)</option>
            </select>
          </div>

          {/* Grouped Date Range */}
          <div className="inv-date-group-box">
            <Calendar size={15} color="#64748B" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(0)
              }}
            />
            <span style={{ color: '#CBD5E1', fontWeight: 700 }}>—</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(0)
              }}
            />
          </div>

          {/* Action buttons */}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ height: '42px', padding: '0 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => {
              setPage(0)
              fetchInvoices()
            }}
            disabled={loading}
          >
            <Search size={15} />
            <span>Lọc Dữ Liệu</span>
          </button>

          {(searchKeyword || selectedMethod !== 'ALL' || selectedStatus !== 'ALL' || fromDate || toDate) && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              style={{ height: '42px', padding: '0 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setSearchKeyword('')
                setSelectedMethod('ALL')
                setSelectedStatus('ALL')
                setFromDate('')
                setToDate('')
                setPage(0)
              }}
            >
              <X size={15} />
              <span>Xóa Lọc</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {(searchKeyword || selectedMethod !== 'ALL' || selectedStatus !== 'ALL' || fromDate || toDate) && (
          <div className="inv-active-chips-row">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đang áp dụng bộ lọc:</span>
            {searchKeyword && (
              <span className="inv-chip">
                <span>Từ khóa: "{searchKeyword}"</span>
                <button type="button" onClick={() => setSearchKeyword('')}><X size={12} /></button>
              </span>
            )}
            {selectedMethod !== 'ALL' && (
              <span className="inv-chip">
                <span>Phương thức: {selectedMethod === 'BANK_TRANSFER' ? 'VietQR' : selectedMethod === 'CASH' ? 'Tiền mặt' : 'Quẹt thẻ POS'}</span>
                <button type="button" onClick={() => setSelectedMethod('ALL')}><X size={12} /></button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inv-chip">
                <span>Trạng thái: {selectedStatus === 'PAID' ? 'Đã thanh toán' : 'Hoàn tiền'}</span>
                <button type="button" onClick={() => setSelectedStatus('ALL')}><X size={12} /></button>
              </span>
            )}
            {fromDate && (
              <span className="inv-chip">
                <span>Từ ngày: {fromDate}</span>
                <button type="button" onClick={() => setFromDate('')}><X size={12} /></button>
              </span>
            )}
            {toDate && (
              <span className="inv-chip">
                <span>Đến ngày: {toDate}</span>
                <button type="button" onClick={() => setToDate('')}><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Invoices Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
              Danh Sách Hóa Đơn &amp; Chứng Từ Bán Lẻ
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Hiển thị {invoices.length} trên tổng số {totalElements} hóa đơn
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
            <span>Hiển thị:</span>
            <select
              className="admin-page-size-select"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                setPageSize(newSize)
                setPage(0)
              }}
            >
              <option value={5}>5 hóa đơn / trang</option>
              <option value={10}>10 hóa đơn / trang</option>
              <option value={20}>20 hóa đơn / trang</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ margin: '16px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Mã Hóa Đơn</th>
                <th style={{ width: '85px' }}>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th style={{ width: '155px' }}>Ngày Xuất</th>
                <th style={{ width: '150px' }}>Hình Thức</th>
                <th style={{ width: '125px' }}>Chiết Khấu</th>
                <th style={{ width: '155px', textAlign: 'right' }}>Tổng Thanh Toán</th>
                <th style={{ width: '145px' }}>Thu Ngân</th>
                <th style={{ width: '170px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang nạp dữ liệu hóa đơn...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <Receipt size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy hóa đơn nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const initials = (inv.customerName || 'K')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={inv.id}>
                      <td>
                        <span
                          className="inv-code-badge"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleViewDetail(inv.id)}
                          title="Bấm để xem & in chi tiết hóa đơn"
                        >
                          <Receipt size={13} color="#0D9488" />
                          <span>{inv.invoiceCode}</span>
                        </span>
                      </td>
                      <td>
                        <span className="inv-order-tag">
                          #{inv.orderId}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="customer-avatar-badge">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.88rem' }}>
                              {inv.customerName}
                            </div>
                            {inv.phone ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                                <Phone size={11} />
                                <span>{inv.phone}</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Chưa có SĐT</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="var(--admin-text-muted)" />
                          <span>{formatDate(inv.paymentDate)}</span>
                        </div>
                      </td>
                      <td>{getMethodBadge(inv.paymentMethod)}</td>
                      <td>
                        {inv.voucherDiscount && Number(inv.voucherDiscount) > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Tag size={10} /> -{formatVnd(inv.voucherDiscount)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>0 đ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="inv-final-price">
                          {formatVnd(inv.finalAmount)}
                        </div>
                        {inv.taxAmount && Number(inv.taxAmount) > 0 && (
                          <div className="inv-tax-sub">Đã gồm VAT 8%</div>
                        )}
                      </td>
                      <td>
                        <div className="inv-staff-badge">
                          <User size={12} color="var(--admin-text-muted)" />
                          <span>{inv.staffName || 'Admin Showroom'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-action-view"
                            title="Xem chi tiết & In hóa đơn bán lẻ"
                            onClick={() => handleViewDetail(inv.id)}
                          >
                            <Eye size={13} />
                            <span>Xem &amp; In</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pdf"
                            title="Tải chứng từ PDF"
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceCode)}
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân Trang Chuẩn */}
        <div className="admin-pagination-footer">
          <div className="pagination-info">
            Hiển thị <strong>{invoices.length}</strong> trên tổng số <strong>{totalElements}</strong> hóa đơn
            (Trang {page + 1} / {Math.max(1, totalPages)})
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              &lt; Trước
            </button>

            {Array.from({ length: totalPages }, (_, idx) => {
              if (
                totalPages > 6 &&
                idx !== 0 &&
                idx !== totalPages - 1 &&
                Math.abs(idx - page) > 1
              ) {
                if (idx === 1 && page > 2) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                if (idx === totalPages - 2 && page < totalPages - 3) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                return null
              }

              return (
                <button
                  type="button"
                  key={idx}
                  className={`page-num-btn ${idx === page ? 'active' : ''}`}
                  onClick={() => setPage(idx)}
                  disabled={loading}
                >
                  {idx + 1}
                </button>
              )
            })}

            <button
              type="button"
              className="page-btn"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LẬP HÓA ĐƠN MỚI TỪ ĐƠN HÀNG */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-card inv-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-icon-badge success" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Lập Hóa Đơn Bán Hàng Mới</h3>
                  <p className="modal-subtitle">Chọn đơn hàng chưa xuất hóa đơn, áp voucher &amp; xác nhận phương thức thanh toán</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
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
                    <div className="inv-loading-box">
                      <RefreshCw size={16} className="spin" /> Đang tải danh sách đơn hàng chưa lập hóa đơn...
                    </div>
                  ) : eligibleOrders.length === 0 ? (
                    <div className="inv-empty-orders">
                      <CheckCircle2 size={24} color="#059669" />
                      <span>Tất cả các đơn hàng hợp lệ hiện đều đã được xuất hóa đơn đầy đủ!</span>
                    </div>
                  ) : (
                    <div className="inv-order-select-grid">
                      <select
                        className="form-input"
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
                        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {formatDate(selectedOrderInfo.orderDate)}
                        </span>
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
                              <th>Sản phẩm nội thất</th>
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
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatVnd(it.amount)}</td>
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
                      <span className="inv-step-badge">2</span> Khuyến mãi, Voucher &amp; Thuế VAT
                    </h4>

                    <div className="inv-calc-controls-row">
                      <div className="inv-voucher-input-group">
                        <label>Mã Voucher / Khuyến mãi:</label>
                        <div className="inv-voucher-field">
                          <Tag size={15} className="inv-field-icon" />
                          <input
                            type="text"
                            placeholder="Nhập mã voucher (vd: TET2026, VIP10...)"
                            value={voucherCodeInput}
                            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          />
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline inv-apply-btn"
                            onClick={() => calculatePreview(selectedOrderId, voucherCodeInput, includeVat)}
                            disabled={calculating}
                          >
                            {calculating ? <RefreshCw size={13} className="spin" /> : 'Áp dụng'}
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
                      <span className="inv-step-badge">3</span> Phương thức thanh toán &amp; Ghi chú
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
                          <QrCode size={20} color="#0284C7" />
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
                          <Banknote size={20} color="#059669" />
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
                          <CreditCard size={20} color="#D97706" />
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
                          <Wallet size={20} color="#7E22CE" />
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
                          <h5><Sparkles size={14} color="var(--admin-accent)" /> Thanh toán VietQR động theo đơn</h5>
                          <p>Số tài khoản: <strong>0312345678</strong> - MB Bank</p>
                          <p>Chủ tài khoản: <strong>SHOWROOM NOI THAT FUNISTORE</strong></p>
                          <p>Số tiền: <strong style={{ color: '#059669' }}>{formatVnd(previewCalculation.finalAmount)}</strong></p>
                          <p>Nội dung: <strong>HD-{selectedOrderId}</strong></p>
                        </div>
                        <img
                          src={`https://img.vietqr.io/image/MB-0312345678-compact.png?amount=${previewCalculation.finalAmount}&addInfo=HD-${selectedOrderId}&accountName=SHOWROOM%20NOI%20THAT%20FUNISTORE`}
                          alt="VietQR"
                          className="inv-vietqr-img"
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label className="form-label">Ghi chú trên hóa đơn (tùy chọn):</label>
                      <textarea
                        rows={2}
                        className="form-input"
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
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={!selectedOrderId || createSubmitting}
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang xuất hóa đơn...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Xuất Hóa Đơn &amp; Ghi Nhận Thanh Toán</span>
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
        <div className="admin-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal-card inv-printable-modal" onClick={(e) => e.stopPropagation()}>
            {/* Top Toolbar (Hidden on print) */}
            <div className="inv-modal-toolbar print-hide">
              <div className="inv-toolbar-left">
                <span className="inv-toolbar-title">
                  <Receipt size={18} color="var(--admin-accent)" />
                  <span>Mẫu In Hóa Đơn Bán Lẻ</span>
                </span>
                <div className="inv-format-toggle">
                  <button
                    type="button"
                    className={`inv-format-btn ${printFormat === 'A4' ? 'active' : ''}`}
                    onClick={() => setPrintFormat('A4')}
                  >
                    Khổ A4 Showroom
                  </button>
                  <button
                    type="button"
                    className={`inv-format-btn ${printFormat === 'K80' ? 'active' : ''}`}
                    onClick={() => setPrintFormat('K80')}
                  >
                    Khổ K80 Giấy Cuộn
                  </button>
                </div>
              </div>

              <div className="inv-toolbar-right">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary inv-print-btn"
                  onClick={handlePrint}
                >
                  <Printer size={15} />
                  <span>In Hóa Đơn</span>
                </button>
                {selectedInvoice && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceCode)}
                  >
                    <Download size={15} />
                    <span>Tải PDF</span>
                  </button>
                )}
                <button
                  type="button"
                  className="modal-close-btn"
                  style={{ width: '34px', height: '34px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Paper Container */}
            <div className="inv-paper-wrapper">
              {detailLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  <RefreshCw size={28} className="spin" color="var(--admin-accent)" />
                  <p style={{ marginTop: '12px' }}>Đang tải chi tiết hóa đơn...</p>
                </div>
              ) : selectedInvoice ? (
                <div id="printable-invoice-paper" className={`inv-paper ${printFormat === 'K80' ? 'inv-paper-k80' : 'inv-paper-a4'}`}>
                  {/* Luxury Watermark Stamp */}
                  <div className="inv-watermark-stamp">
                    ★ ĐÃ THANH TOÁN ★
                  </div>

                  {/* Showroom Brand Header */}
                  <div className="inv-showroom-header">
                    <div className="inv-showroom-logo">
                      <Building size={26} className="inv-logo-icon" />
                      <div>
                        <h2>SHOWROOM NỘI THẤT CAO CẤP FUNISTORE</h2>
                        <p>Thương hiệu nội thất gỗ óc chó &amp; da thật cao cấp - Kiến tạo không gian sống thượng lưu</p>
                      </div>
                    </div>
                    <div className="inv-showroom-meta">
                      <p><strong>Địa chỉ:</strong> 123 Đường Nội Thất, Phường Bến Nghé, Quận 1, TP. HCM</p>
                      <p><strong>Hotline:</strong> 1900 6868 - <strong>MST:</strong> 0312345678</p>
                    </div>
                  </div>

                  <div className="inv-divider"></div>

                  {/* Invoice Document Title */}
                  <div className="inv-doc-title-block">
                    <h1>{printFormat === 'K80' ? 'PHIẾU BÁN LẺ NỘI THẤT' : 'HÓA ĐƠN BÁN HÀNG NỘI THẤT'}</h1>
                    <div className="inv-doc-code">
                      <span>Số chứng từ: <strong>{selectedInvoice.invoiceCode}</strong></span>
                      <span>Mã đơn đặt hàng: <strong>#{selectedInvoice.orderId}</strong></span>
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
                      <p><strong>Thu ngân phụ trách:</strong> {selectedInvoice.staffName || 'Admin Showroom'}</p>
                      <p><strong>Hình thức thanh toán:</strong> {selectedInvoice.paymentMethod}</p>
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
                        <span>TỔNG CỘNG THANH TOÁN:</span>
                        <span className="inv-sum-final-num">{formatVnd(selectedInvoice.finalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warranty & Footer */}
                  <div className="inv-footer-policy">
                    <p className="inv-policy-title">
                      <ShieldCheck size={14} /> CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG FUNISTORE:
                    </p>
                    <p className="inv-policy-content">
                      Đồ nội thất gỗ óc chó tự nhiên được bảo hành khung kết cấu <strong>05 năm</strong>, bảo hành đệm mút &amp; phụ kiện ray trượt <strong>02 năm</strong>.
                      Vui lòng giữ hóa đơn bán hàng này để được hưởng trọn vẹn dịch vụ bảo hành và bảo dưỡng định kỳ.
                    </p>
                    <p className="inv-policy-thanks">
                      ✨ Cảm ơn Quý khách đã tin tưởng và đồng hành cùng Showroom FuniStore! ✨
                    </p>
                  </div>

                  {/* 3-Column Signatures for A4 */}
                  {printFormat === 'A4' && (
                    <div className="inv-signatures-row">
                      <div className="inv-sig-box">
                        <p><strong>Người mua hàng</strong></p>
                        <span>(Ký, ghi rõ họ tên)</span>
                        <div style={{ marginTop: 45, fontWeight: 600 }}>{selectedInvoice.customerName}</div>
                      </div>
                      <div className="inv-sig-box">
                        <p><strong>Nhân viên thu ngân</strong></p>
                        <span>(Ký, ghi rõ họ tên)</span>
                        <div style={{ marginTop: 45, fontWeight: 600 }}>{selectedInvoice.staffName || 'Admin Showroom'}</div>
                      </div>
                      <div className="inv-sig-box">
                        <p><strong>Đại diện Showroom</strong></p>
                        <span>(Ký, đóng dấu)</span>
                        <div style={{ marginTop: 45, fontWeight: 600, color: '#D97706' }}>FUNISTORE SHOWROOM</div>
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
