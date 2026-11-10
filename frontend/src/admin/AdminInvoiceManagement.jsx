import { useState, useEffect, useRef } from 'react'
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
  Banknote,
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
  Clock
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { productImageUrl } from '../lib/productImages'

export default function AdminInvoiceManagement({ currentUser }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    cashCount: 0,
    paidCount: 0,
    refundedCount: 0
  })

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Invoice views
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printFormat, setPrintFormat] = useState('A4') // A4 | K80

  // Eligible orders for creating invoices
  const [eligibleOrders, setEligibleOrders] = useState([])
  const [eligibleLoading, setEligibleLoading] = useState(false)
  const [eligibleError, setEligibleError] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const orderController = useRef(null)
  const previewController = useRef(null)
  const createHeadingRef = useRef(null)
  const createButtonRef = useRef(null)

  useEffect(() => () => {
    orderController.current?.abort()
    previewController.current?.abort()
  }, [])

  function closeCreate() {
    orderController.current?.abort()
    previewController.current?.abort()
    setCreatingInvoice(false)
    setSelectedOrderId('')
    setSelectedOrderInfo(null)
    setPreviewCalculation(null)
    setVoucherCodeInput('')
    setNotes('')
    setCalculating(false)
    setOrderLoading(false)
    window.requestAnimationFrame(() => createButtonRef.current?.focus())
  }
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null)

  // Form inputs for creating invoice
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
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
    setEligibleError('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/eligible-orders`, {
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể tải đơn hàng để lập hóa đơn. Vui lòng thử lại.')
      const data = await res.json()
      setEligibleOrders(data || [])
    } catch (err) {
      setEligibleError(err.message)
    } finally {
      setEligibleLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [page, pageSize, selectedStatus])

  // Tải chi tiết đơn và giá trị hóa đơn do backend tính.
  const handleSelectOrder = async (orderId) => {
    orderController.current?.abort()
    previewController.current?.abort()
    const controller = new AbortController()
    orderController.current = controller
    setSelectedOrderId(orderId)
    setSelectedOrderInfo(null)
    setVoucherCodeInput('')
    setPreviewCalculation(null)
    setPreviewError('')
    setCalculating(false)
    setOrderLoading(Boolean(orderId))

    if (!orderId) {
      setSelectedOrderInfo(null)
      return
    }

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}`, {
        headers: getApiHeaders(), signal: controller.signal
      })
      if (!res.ok) throw new Error('Không thể tải chi tiết đơn hàng. Vui lòng chọn lại đơn.')
      if (res.ok) {
        const orderData = await res.json()
        if (controller.signal.aborted) return
        setSelectedOrderInfo(orderData)
        // Nếu đơn hàng đã có voucher từ trước, điền sẵn
        if (orderData.voucherCode) {
          setVoucherCodeInput(orderData.voucherCode)
        }
        // Gọi preview calculation
        calculatePreview(orderId, orderData.voucherCode || '', false)
      }
    } catch (err) {
      if (!controller.signal.aborted) setPreviewError(err.message)
    } finally {
      if (!controller.signal.aborted) setOrderLoading(false)
    }
  }

  // Gọi API preview calculation
  const calculatePreview = async (orderId, voucherCode, vat) => {
    if (!orderId) return
    previewController.current?.abort()
    const controller = new AbortController()
    previewController.current = controller
    setCalculating(true)
    setPreviewCalculation(null)
    setPreviewError('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/invoices/preview-calculation`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        signal: controller.signal,
        body: JSON.stringify({
          orderId: Number(orderId),
          voucherCode: voucherCode ? voucherCode.trim() : null,
          includeVat: vat
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể tính tiền hóa đơn. Vui lòng thử lại.')
      if (!controller.signal.aborted) setPreviewCalculation(data)
    } catch (err) {
      if (!controller.signal.aborted) setPreviewError(err.message)
    } finally {
      if (!controller.signal.aborted) setCalculating(false)
    }
  }

  // Xem chi tiết hóa đơn
  const handleViewDetail = async (invoiceId) => {
    setDetailLoading(true)
    setViewingInvoice(true)
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
      setViewingInvoice(false)
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
    if (createSubmitting) return
    if (!selectedOrderId) {
      showToast('Vui lòng chọn đơn hàng cần xuất hóa đơn!', 'error')
      return
    }
    if (orderLoading || calculating || !selectedOrderInfo || !previewCalculation) {
      showToast('Vui lòng chờ tính tiền hóa đơn thành công trước khi xuất.', 'error')
      return
    }

    if (!window.confirm('Xác nhận đã thu đủ số tiền đã chốt của đơn hàng? Hóa đơn sẽ ghi nhận thanh toán thành công.')) return
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
          paymentMethod: 'CASH',
          voucherCode: voucherCodeInput ? voucherCodeInput.trim() : null,
          includeVat: false,
          notes: notes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Xuất hóa đơn thất bại!')
      }

      showToast(`Đã xuất hóa đơn ${data.invoiceCode} thành công!`, 'success')
      setCreatingInvoice(false)
      setSelectedOrderId('')
      setSelectedOrderInfo(null)
      setVoucherCodeInput('')
      setNotes('')
      fetchInvoices()
      fetchStats()
      // Chuyển sang bản xem và in sau khi lưu thành công.
      setSelectedInvoice(data)
      setViewingInvoice(true)
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

  const getMethodBadge = (method) => method === 'CASH'
    ? <span className="inv-badge inv-badge-cash"><Banknote size={13} /> COD — thu tiền khi giao hàng</span>
    : <span className="inv-badge inv-badge-default">Chứng từ cũ: {method}</span>

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

      {!creatingInvoice && !viewingInvoice && <>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Quản lý hóa đơn &gt; <span>Module 09</span>
          </div>
          <h1 className="admin-page-title">Quản Lý Hóa Đơn &amp; Thanh Toán</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Ghi nhận thanh toán COD sau khi giao hàng thành công và thu đủ tiền. Hóa đơn giữ nguyên tổng tiền đã đặt.
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
            ref={createButtonRef}
            onClick={() => {
              fetchEligibleOrders()
              setCreatingInvoice(true)
              window.requestAnimationFrame(() => createHeadingRef.current?.focus())
            }}
          >
            <Plus size={16} />
            <span>+ Lập Hóa Đơn Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="inv-stats-grid inv-invoice-stats">
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
              Tổng tiền các hóa đơn đã thanh toán
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-cod">
          <div className="inv-stat-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <Banknote size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Thanh toán COD</span>
            <h3 className="inv-stat-value">{stats.cashCount} <span className="inv-stat-unit">hóa đơn</span></h3>
            <span className="inv-stat-sub" style={{ color: '#0F766E', fontWeight: 600 }}>
              Thu tiền khi giao hàng
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-legacy">
          <div className="inv-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <AlertCircle size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Chứng từ cũ khác COD</span>
            <h3 className="inv-stat-value">{stats.total - stats.cashCount} <span className="inv-stat-unit">hóa đơn</span></h3>
            <span className="inv-stat-sub" style={{ color: '#78716C' }}>
              Giữ nguyên để đối soát lịch sử thanh toán
            </span>
          </div>
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

          {(searchKeyword || selectedStatus !== 'ALL' || fromDate || toDate) && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              style={{ height: '42px', padding: '0 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setSearchKeyword('')
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
        {(searchKeyword || selectedStatus !== 'ALL' || fromDate || toDate) && (
          <div className="inv-active-chips-row">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đang áp dụng bộ lọc:</span>
            {searchKeyword && (
              <span className="inv-chip">
                <span>Từ khóa: "{searchKeyword}"</span>
                <button type="button" onClick={() => setSearchKeyword('')}><X size={12} /></button>
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
                        {Number(inv.discountAmount || 0) + Number(inv.voucherDiscount || 0) > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Tag size={10} /> -{formatVnd(Number(inv.discountAmount || 0) + Number(inv.voucherDiscount || 0))}
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

      </>}
      {/* ========================================================================= */}
      {/* MODAL 1: LẬP HÓA ĐƠN MỚI TỪ ĐƠN HÀNG */}
      {/* ========================================================================= */}
      {creatingInvoice && (
        <section className="admin-card inv-create-page" aria-labelledby="invoice-create-title">
          <div>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-icon-badge success" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h1 className="modal-title" id="invoice-create-title" ref={createHeadingRef} tabIndex={-1}>Lập Hóa Đơn Bán Hàng Mới</h1>
                  <p className="modal-subtitle">Bổ sung hóa đơn cho đơn đã giao xong, chưa có hóa đơn và đã xác nhận thu đủ tiền</p>
                </div>
              </div>
              <button type="button" className="admin-btn admin-btn-outline" disabled={createSubmitting} onClick={closeCreate}>
                Về danh sách
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit}>
              <div className="inv-create-body">
                {/* Bước 1: Chọn đơn hàng */}
                <div className="inv-form-section">
                  <h4 className="inv-section-title">
                    <span className="inv-step-badge">1</span> Chọn đơn đặt hàng cần xuất hóa đơn
                  </h4>
                  {eligibleLoading ? (
                    <div className="inv-loading-box">
                      <RefreshCw size={16} className="spin" /> Đang tải danh sách đơn hàng chưa lập hóa đơn...
                    </div>
                  ) : eligibleError ? (
                    <div className="inv-calc-feedback feedback-warning" role="alert">{eligibleError} <button type="button" className="admin-btn admin-btn-outline" onClick={fetchEligibleOrders}>Thử lại</button></div>
                  ) : eligibleOrders.length === 0 ? (
                    <div className="inv-empty-orders">
                      <CheckCircle2 size={24} color="#059669" />
                      <span>Chưa có đơn đã hoàn thành cần bổ sung hóa đơn. Đơn mới sẽ được ghi nhận khi xác nhận giao thành công và đã thu đủ tiền.</span>
                    </div>
                  ) : (
                    <div className="inv-order-select-grid">
                      <select
                        className="form-input"
                        aria-label="Đơn hàng cần xuất hóa đơn"
                        disabled={createSubmitting}
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

                  {orderLoading && <p role="status">Đang tải chi tiết đơn hàng...</p>}
                  {previewError && <p className="inv-calc-feedback feedback-warning" role="alert">{previewError}</p>}
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
                                    {it.imageUrl && <img src={productImageUrl(it.imageUrl)} alt="" className="inv-mini-thumb" />}
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
                      <span className="inv-step-badge">2</span> Số tiền đã chốt khi đặt hàng
                    </h4>

                    <p className="inv-calc-feedback feedback-success">Giữ nguyên tổng tiền và giảm giá khi đặt hàng. Không áp thêm voucher hoặc VAT khi lập hóa đơn.</p>
                    <button type="button" className="admin-btn admin-btn-outline"
                      disabled={calculating || orderLoading || createSubmitting || !selectedOrderInfo}
                      onClick={() => calculatePreview(selectedOrderId, voucherCodeInput, false)}>
                      Tải lại số tiền
                    </button>

                    {/* Feedback Voucher */}
                    {calculating && <p role="status">Đang tính tiền hóa đơn...</p>}
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

                    <p className="inv-calc-feedback feedback-success"><Banknote size={18} /> COD — thu tiền mặt khi giao hàng. Chỉ lập hóa đơn sau khi đã thu đủ tiền.</p>

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
                  onClick={closeCreate}
                  disabled={createSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={!selectedOrderId || !selectedOrderInfo || !previewCalculation || orderLoading || calculating || createSubmitting}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHI TIẾT & MẪU IN HÓA ĐƠN BÁN LẺ SHOWROOM (A4 / K80) */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <section className="inv-detail-page" aria-label="Chi tiết và in hóa đơn">
          <div className="inv-printable-modal">
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
                  onClick={() => setViewingInvoice(false)}
                  aria-label="Về danh sách hóa đơn"
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
                      <p><strong>Hình thức thanh toán:</strong> {selectedInvoice.paymentMethod === 'CASH' ? 'COD — thu tiền khi giao hàng' : `Chứng từ cũ: ${selectedInvoice.paymentMethod}`}</p>
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
                      {Number(selectedInvoice.discountAmount) > 0 && (
                        <div className="inv-sum-row inv-sum-discount">
                          <span>Giảm giá khi đặt hàng{selectedInvoice.voucherCode ? ` (${selectedInvoice.voucherCode})` : ''}:</span>
                          <span>-{formatVnd(selectedInvoice.discountAmount)}</span>
                        </div>
                      )}
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
        </section>
      )}
    </div>
  )
}
