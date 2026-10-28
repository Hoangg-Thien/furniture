import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  Calendar,
  UserCheck,
  User,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  Ban
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminOrderManagement({ currentUser }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Status counts for tab bar
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  })

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED
  const [searchKeyword, setSearchKeyword] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Staff list for assigning
  const [staffList, setStaffList] = useState([])

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeOrderDetail, setActiveOrderDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Confirm / Assign Staff Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [orderToConfirm, setOrderToConfirm] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [confirmNotes, setConfirmNotes] = useState('')
  const [submittingConfirm, setSubmittingConfirm] = useState(false)

  // Cancel Modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  // Complete Order confirmation
  const [submittingComplete, setSubmittingComplete] = useState(false)

  // Currency format
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Datetime format
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Fetch status counts
  const fetchStatusCounts = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/counts`, { headers: getApiHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStatusCounts(data)
      }
    } catch (err) {
      console.error('Lỗi nạp số lượng đơn hàng:', err)
    }
  }

  // Fetch staff list for assignment
  const fetchStaff = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/staff?size=100`, { headers: getApiHeaders() })
      if (res.ok) {
        const data = await res.json()
        const list = data?.content || []
        setStaffList(list)
        if (list.length > 0) {
          const myStaff = list.find(s => s.userId === currentUser?.id || s.username === currentUser?.username)
          setSelectedStaffId(myStaff ? myStaff.id : list[0].id)
        }
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách nhân viên:', err)
    }
  }

  // Fetch orders with pagination & filters
  const fetchOrders = async (targetPage = page, targetSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('size', targetSize)

      if (selectedStatus && selectedStatus !== 'ALL') {
        params.append('status', selectedStatus)
      }
      if (searchKeyword.trim()) {
        params.append('search', searchKeyword.trim())
      }
      if (fromDate) {
        params.append('fromDate', fromDate)
      }
      if (toDate) {
        params.append('toDate', toDate)
      }

      const res = await fetch(`${baseUrl}/api/admin/orders?${params.toString()}`, { headers: getApiHeaders() })
      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách đơn hàng (HTTP ${res.status})`)
      }
      const data = await res.json()
      setOrders(data?.content || [])
      setTotalPages(data?.totalPages || 1)
      setTotalElements(data?.totalElements || 0)
      setPage(data?.page || 0)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể kết nối đến máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatusCounts()
    fetchStaff()
  }, [])

  useEffect(() => {
    fetchOrders(0, pageSize)
  }, [selectedStatus])

  // Tự động cập nhật liên tục (polling 5s) để hiển thị ngay các đơn hàng mới từ người dùng
  useEffect(() => {
    const timer = setInterval(() => {
      if (!showConfirmModal && !showCancelModal) {
        fetchStatusCounts()
        fetchOrders(page, pageSize)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [page, pageSize, selectedStatus, searchKeyword, fromDate, toDate, showConfirmModal, showCancelModal])

  // Open Detail Modal
  const handleOpenDetail = async (orderId) => {
    setShowDetailModal(true)
    setLoadingDetail(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}`, { headers: getApiHeaders() })
      if (!res.ok) throw new Error('Không thể tải chi tiết đơn hàng.')
      const data = await res.json()
      setActiveOrderDetail(data)
    } catch (err) {
      showToast(err.message, 'error')
      setShowDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Open Confirm / Assign Modal
  const handleOpenConfirmModal = (order) => {
    setOrderToConfirm(order)
    setConfirmNotes('')
    if (staffList.length > 0) {
      const myStaff = staffList.find(s => s.userId === currentUser?.id || s.username === currentUser?.username)
      setSelectedStaffId(myStaff ? myStaff.id : staffList[0].id)
    }
    setShowConfirmModal(true)
  }

  // Submit Confirm
  const handleSubmitConfirm = async (e) => {
    e.preventDefault()
    if (!selectedStaffId) {
      showToast('Vui lòng chọn nhân viên phụ trách điều phối.', 'error')
      return
    }
    setSubmittingConfirm(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderToConfirm.id}/confirm`, {
        method: 'PUT',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          staffId: Number(selectedStaffId),
          notes: confirmNotes
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Duyệt đơn hàng thất bại.')
      showToast(data.message || 'Đã duyệt đơn hàng thành công!')
      setShowConfirmModal(false)
      fetchStatusCounts()
      fetchOrders(page, pageSize)
      if (showDetailModal && activeOrderDetail?.id === orderToConfirm.id) {
        handleOpenDetail(orderToConfirm.id)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingConfirm(false)
    }
  }

  // Open Cancel Modal
  const handleOpenCancelModal = (order) => {
    setOrderToCancel(order)
    setCancelReason('')
    setShowCancelModal(true)
  }

  // Submit Cancel
  const handleSubmitCancel = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn hàng.', 'error')
      return
    }
    setSubmittingCancel(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderToCancel.id}/cancel`, {
        method: 'PUT',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason: cancelReason })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Hủy đơn hàng thất bại.')
      showToast(data.message || 'Đã hủy đơn hàng và hoàn trả tồn kho thành công!')
      setShowCancelModal(false)
      fetchStatusCounts()
      fetchOrders(page, pageSize)
      if (showDetailModal && activeOrderDetail?.id === orderToCancel.id) {
        handleOpenDetail(orderToCancel.id)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingCancel(false)
    }
  }

  // Complete Order
  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm(`Xác nhận hoàn tất đơn hàng #${orderId} (Khách đã nghiệm thu nội thất thành công)?`)) {
      return
    }
    setSubmittingComplete(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: getApiHeaders()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Hoàn tất đơn hàng thất bại.')
      showToast(data.message || 'Đã hoàn tất đơn hàng thành công!')
      fetchStatusCounts()
      fetchOrders(page, pageSize)
      if (showDetailModal && activeOrderDetail?.id === orderId) {
        handleOpenDetail(orderId)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingComplete(false)
    }
  }

  // Print Order Delivery Slip
  const handlePrintSlip = () => {
    window.print()
  }

  // Helper: Status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="admin-badge admin-badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>Chờ tiếp nhận</span>
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="admin-badge admin-badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={12} />
            <span>Đã duyệt &amp; Gán NV</span>
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="admin-badge admin-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} />
            <span>Giao thành công</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="admin-badge admin-badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Ban size={12} />
            <span>Đã hủy đơn</span>
          </span>
        )
      default:
        return <span className="admin-badge">{status}</span>
    }
  }

  return (
    <div className="admin-module-view">
      {/* Toast Feedback */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Quản lý đơn hàng &gt; <span>Module 08</span>
          </div>
          <h1 className="admin-page-title">Quy Trình Xử Lý &amp; Điều Phối Đơn Hàng</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Theo dõi vòng đời đơn đặt hàng nội thất: Chờ tiếp nhận, Gán nhân viên điều phối, Nghiệm thu giao lắp và Quản lý hoàn trả kho.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => {
              fetchStatusCounts()
              fetchOrders(page)
            }}
            disabled={loading}
            title="Làm mới danh sách và số liệu"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Status Tab Bar */}
      <div className="admin-card order-status-tabs-card" style={{ padding: '8px 12px', marginBottom: '20px' }}>
        <div className="order-status-tabs-wrapper">
          <button
            type="button"
            className={`admin-status-tab ${selectedStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('ALL')}
          >
            <span>Tất Cả Đơn</span>
            <span className="tab-count">{statusCounts.total}</span>
          </button>

          <button
            type="button"
            className={`admin-status-tab tab-pending ${selectedStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('PENDING')}
          >
            <Clock size={14} />
            <span>Chờ Tiếp Nhận</span>
            <span className="tab-count">{statusCounts.pending}</span>
          </button>

          <button
            type="button"
            className={`admin-status-tab tab-confirmed ${selectedStatus === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CONFIRMED')}
          >
            <UserCheck size={14} />
            <span>Đã Duyệt &amp; Gán NV</span>
            <span className="tab-count">{statusCounts.confirmed}</span>
          </button>

          <button
            type="button"
            className={`admin-status-tab tab-completed ${selectedStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('COMPLETED')}
          >
            <CheckCircle2 size={14} />
            <span>Giao Thành Công</span>
            <span className="tab-count">{statusCounts.completed}</span>
          </button>

          <button
            type="button"
            className={`admin-status-tab tab-cancelled ${selectedStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CANCELLED')}
          >
            <Ban size={14} />
            <span>Đã Hủy Đơn</span>
            <span className="tab-count">{statusCounts.cancelled}</span>
          </button>
        </div>
      </div>

      {/* Toolbar Tìm kiếm & Bộ Lọc */}
      <div className="admin-card admin-filter-toolbar">
        <div className="filter-grid" style={{ alignItems: 'flex-end' }}>
          {/* Keyword Search */}
          <div className="filter-search-box" style={{ flex: 1.5, minWidth: '280px' }}>
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm theo Mã đơn (#101), Tên khách hàng, SĐT, Địa chỉ, Mã Voucher..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchOrders(0)
              }}
            />
            {searchKeyword && (
              <button className="clear-btn" onClick={() => setSearchKeyword('')} type="button">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date from */}
          <div className="filter-select-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              className="filter-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div className="filter-select-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              className="filter-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.86rem' }}
            onClick={() => fetchOrders(0)}
            disabled={loading}
          >
            <Search size={15} />
            <span>Lọc Đơn</span>
          </button>

          {(searchKeyword || fromDate || toDate) && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setSearchKeyword('')
                setFromDate('')
                setToDate('')
                fetchOrders(0)
              }}
            >
              <X size={14} />
              <span>Xóa Lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
              Danh Sách Đơn Đặt Hàng Nội Thất
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Hiển thị {orders.length} trên tổng số {totalElements} đơn đặt hàng
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
                fetchOrders(0, newSize)
              }}
            >
              <option value={5}>5 đơn / trang</option>
              <option value={10}>10 đơn / trang</option>
              <option value={20}>20 đơn / trang</option>
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
                <th style={{ width: '85px', textAlign: 'center', whiteSpace: 'nowrap' }}>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th style={{ whiteSpace: 'nowrap' }}>Ngày Đặt</th>
                <th style={{ whiteSpace: 'nowrap' }}>Nhân Viên Phụ Trách</th>
                <th>Sản Phẩm &amp; Voucher</th>
                <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng Thanh Toán</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ width: '180px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang nạp dữ liệu đơn hàng nội thất...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <ShoppingCart size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy đơn đặt hàng nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const initials = (o.customerName || 'K')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={o.id}>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#0284C7',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                          onClick={() => handleOpenDetail(o.id)}
                          title="Xem chi tiết đơn hàng"
                        >
                          #{o.id}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="customer-avatar-badge">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.9rem' }}>
                              {o.customerName}
                            </div>
                            {o.phone ? (
                              <a
                                href={`tel:${o.phone}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--admin-accent)', textDecoration: 'none' }}
                              >
                                <Phone size={11} />
                                <span>{o.phone}</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Chưa có SĐT</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="var(--admin-text-muted)" />
                          <span>{formatDateTime(o.orderDate)}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {o.staffName ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.84rem', color: '#1E293B' }}>
                            <UserCheck size={14} color="#059669" />
                            <span style={{ fontWeight: 600 }}>{o.staffName}</span>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', fontSize: '0.76rem', fontWeight: 600 }}>
                            <Clock size={11} /> Chưa gán NV
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-main)' }}>
                          <div>{o.totalItemsCount} món nội thất</div>
                          {o.voucherCode && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, marginTop: '2px' }}>
                              <Tag size={10} /> {o.voucherCode} (-{formatCurrency(o.discountAmount)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.96rem' }}>
                          {formatCurrency(o.totalAmount)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {renderStatusBadge(o.status)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* Duyệt đơn hàng nếu PENDING */}
                          {o.status === 'PENDING' && (
                            <button
                              type="button"
                              className="table-action-btn unlock"
                              title="Duyệt đơn & Gán nhân viên phụ trách"
                              onClick={() => handleOpenConfirmModal(o)}
                            >
                              <CheckCircle2 size={13} />
                              <span>Duyệt</span>
                            </button>
                          )}

                          {/* Hoàn tất nếu CONFIRMED */}
                          {o.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="table-action-btn edit"
                              title="Xác nhận hoàn tất giao lắp nội thất"
                              onClick={() => handleCompleteOrder(o.id)}
                            >
                              <Truck size={13} />
                              <span>Giao lắp</span>
                            </button>
                          )}

                          {/* Hủy đơn nếu chưa ở trạng thái cuối */}
                          {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className="table-action-btn lock"
                              title="Hủy đơn hàng (Hoàn kho & voucher)"
                              onClick={() => handleOpenCancelModal(o)}
                            >
                              <Ban size={13} />
                              <span>Hủy</span>
                            </button>
                          )}

                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            className="table-action-btn"
                            title="Xem chi tiết đơn hàng"
                            onClick={() => handleOpenDetail(o.id)}
                          >
                            <Eye size={13} />
                            <span>Xem</span>
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
            Hiển thị <strong>{orders.length}</strong> trên tổng số <strong>{totalElements}</strong> đơn đặt hàng
            (Trang {page + 1} / {Math.max(1, totalPages)})
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 0 || loading}
              onClick={() => fetchOrders(page - 1, pageSize)}
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
                  onClick={() => fetchOrders(idx, pageSize)}
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
              onClick={() => fetchOrders(page + 1, pageSize)}
            >
              Sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Chi Tiết Đơn Hàng (Order Detail Drawer) */}
      {showDetailModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                <RefreshCw size={24} className="spin" color="var(--admin-accent)" />
                <p style={{ marginTop: '12px' }}>Đang tải chi tiết đơn hàng...</p>
              </div>
            ) : activeOrderDetail ? (
              <div>
                <div className="admin-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="modal-icon-badge success" style={{ background: '#EFF6FF', color: '#0284C7' }}>
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                          Đơn Đặt Hàng #{activeOrderDetail.id}
                        </h3>
                        {renderStatusBadge(activeOrderDetail.status)}
                      </div>
                      <p className="modal-subtitle" style={{ margin: '4px 0 0' }}>
                        Ngày đặt: {formatDateTime(activeOrderDetail.orderDate)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      onClick={handlePrintSlip}
                      title="In phiếu giao hàng và lắp đặt A4"
                    >
                      <Printer size={14} />
                      <span>In Phiếu Giao</span>
                    </button>
                    <button type="button" className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Customer and Delivery Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} color="var(--admin-accent)" />
                        <span>Thông Tin Khách Hàng</span>
                      </h4>
                      <div style={{ fontSize: '0.92rem', color: '#1E293B', fontWeight: 700 }}>{activeOrderDetail.customerName}</div>
                      <div style={{ fontSize: '0.84rem', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <Phone size={12} />
                        <span>{activeOrderDetail.phone || 'Chưa có SĐT'}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '5px', marginTop: '6px' }}>
                        <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
                        <span>{activeOrderDetail.address || 'Chưa cập nhật địa chỉ giao hàng'}</span>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={15} color="#059669" />
                        <span>Nhân Viên Phụ Trách Điều Phối</span>
                      </h4>
                      {activeOrderDetail.staffName ? (
                        <div>
                          <div style={{ fontSize: '0.92rem', color: '#1E293B', fontWeight: 700 }}>
                            {activeOrderDetail.staffName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            <span>Đang chịu trách nhiệm điều phối &amp; giám sát thi công</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#B45309', fontWeight: 600 }}>
                            Chưa có nhân viên phụ trách
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn-accent"
                            style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.82rem' }}
                            onClick={() => handleOpenConfirmModal(activeOrderDetail)}
                          >
                            <UserCheck size={13} />
                            <span>Gán Nhân Viên Ngay</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#1E293B', fontWeight: 700 }}>
                      Danh Mục Đồ Nội Thất Trong Đơn
                    </h4>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mặt Hàng Nội Thất</th>
                          <th style={{ textAlign: 'center' }}>Đơn Vị</th>
                          <th style={{ textAlign: 'center' }}>Số Lượng</th>
                          <th style={{ textAlign: 'right' }}>Đơn Giá</th>
                          <th style={{ textAlign: 'right' }}>Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrderDetail.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={item.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80'}
                                  alt=""
                                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                />
                                <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                                  {item.productName}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748B' }}>{item.unit || 'cái'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-primary)' }}>
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Summary */}
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: 'auto', width: '340px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#475569' }}>
                      <span>Tổng tiền hàng:</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(activeOrderDetail.subtotal)}</span>
                    </div>

                    {activeOrderDetail.voucherCode && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#C2410C' }}>
                        <span>Voucher ({activeOrderDetail.voucherCode}):</span>
                        <span style={{ fontWeight: 600 }}>-{formatCurrency(activeOrderDetail.discountAmount)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: 'var(--admin-primary)', borderTop: '1px solid #CBD5E1', paddingTop: '10px', marginTop: '4px' }}>
                      <span>Khách cần trả:</span>
                      <span>{formatCurrency(activeOrderDetail.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  {activeOrderDetail.status === 'PENDING' && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-accent"
                      onClick={() => handleOpenConfirmModal(activeOrderDetail)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Duyệt Đơn &amp; Gán Nhân Viên</span>
                    </button>
                  )}

                  {activeOrderDetail.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => handleCompleteOrder(activeOrderDetail.id)}
                      disabled={submittingComplete}
                    >
                      <Truck size={16} />
                      <span>Nghiệm Thu &amp; Hoàn Tất</span>
                    </button>
                  )}

                  {activeOrderDetail.status !== 'COMPLETED' && activeOrderDetail.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                      onClick={() => handleOpenCancelModal(activeOrderDetail)}
                    >
                      <Ban size={16} />
                      <span>Hủy Đơn Hàng</span>
                    </button>
                  )}

                  <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowDetailModal(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 2: Duyệt Đơn & Gán Nhân Viên */}
      {showConfirmModal && orderToConfirm && (
        <div className="admin-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-icon-badge success">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Duyệt Đơn Hàng #{orderToConfirm.id}</h3>
                  <p className="modal-subtitle">Phân công nhân viên phụ trách điều phối &amp; giao lắp</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowConfirmModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitConfirm}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Chọn Nhân Viên Phụ Trách <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {currentUser && staffList.length > 0 && (
                      <button
                        type="button"
                        style={{
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          color: '#16A34A',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                        onClick={() => {
                          const myStaff = staffList.find(s => s.userId === currentUser?.id || s.username === currentUser?.username)
                          if (myStaff) setSelectedStaffId(myStaff.id)
                        }}
                      >
                        ⚡ Tự nhận đơn này
                      </button>
                    )}
                  </div>
                  <select
                    className="form-input"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        #{st.id} - {st.fullName} {st.phone ? `(${st.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi Chú Điều Phối / Giao Lắp</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="VD: Giao vào buổi sáng, căn hộ chung cư tầng 12 có thang hàng..."
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submittingConfirm}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-accent"
                  disabled={submittingConfirm}
                >
                  {submittingConfirm ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Đang duyệt...</span>
                    </>
                  ) : (
                    <span>Xác Nhận &amp; Điều Phối</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Hủy Đơn Hàng (Hoàn kho & voucher) */}
      {showCancelModal && orderToCancel && (
        <div className="admin-modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-icon-badge danger">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#991B1B' }}>Hủy Đơn Hàng #{orderToCancel.id}</h3>
                  <p className="modal-subtitle">Hệ thống sẽ hoàn trả số lượng hàng vào kho</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="modal-alert-error" style={{ lineHeight: 1.5 }}>
                  <strong>Quy tắc hoàn trả tự động:</strong>
                  <br />• Tồn kho của các sản phẩm trong đơn sẽ được tự động cộng hoàn lại vào kho.
                  <br />• Lượt sử dụng Voucher (nếu có) sẽ được khôi phục để khách dùng lần sau.
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Lý Do Hủy Đơn Hàng <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="VD: Khách hàng đổi ý mua mẫu khác, địa chỉ không liên hệ được..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={submittingCancel}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-danger"
                  style={{ background: '#DC2626', color: '#FFFFFF' }}
                  disabled={submittingCancel}
                >
                  {submittingCancel ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Đang hủy...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Hủy Đơn</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
