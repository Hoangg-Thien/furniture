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
  const [pageSize] = useState(10)
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
      const res = await fetch(`${baseUrl}/api/admin/staff?pageSize=100`, { headers: getApiHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStaffList(data?.content || [])
        if (data?.content?.length > 0) {
          setSelectedStaffId(data.content[0].id)
        }
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách nhân viên:', err)
    }
  }

  // Fetch orders with pagination & filters
  const fetchOrders = async (targetPage = page) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('size', pageSize)

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
    fetchOrders(0)
  }, [selectedStatus])

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
      setSelectedStaffId(staffList[0].id)
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Duyệt đơn hàng thất bại.')
      showToast(data.message || 'Đã duyệt đơn hàng thành công!')
      setShowConfirmModal(false)
      fetchStatusCounts()
      fetchOrders(page)
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hủy đơn hàng thất bại.')
      showToast(data.message || 'Đã hủy đơn hàng và hoàn trả tồn kho thành công!')
      setShowCancelModal(false)
      fetchStatusCounts()
      fetchOrders(page)
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hoàn tất đơn hàng thất bại.')
      showToast(data.message || 'Đã hoàn tất đơn hàng thành công!')
      fetchStatusCounts()
      fetchOrders(page)
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

  return (
    <div className="admin-order-management">
      {/* Toast Feedback */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <div className="admin-page-icon-wrapper" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <ShoppingCart size={24} className="text-white" />
          </div>
          <div>
            <div className="admin-breadcrumb">Trang chủ &gt; Quản lý đơn hàng (Module 08)</div>
            <h1 className="admin-page-title">Quy Trình Xử Lý &amp; Điều Phối Đơn Hàng</h1>
            <p className="admin-page-subtitle">
              Theo dõi vòng đời đơn đặt hàng nội thất: Chờ xác nhận, Gán nhân viên điều phối, Nghiệm thu bàn giao và Hoàn trả kho khi hủy đơn.
            </p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="btn-admin btn-admin-secondary" onClick={() => fetchOrders(page)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Status Tab Bar */}
      <div className="admin-card" style={{ padding: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', minWidth: '600px' }}>
          <button
            className={`admin-status-tab ${selectedStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('ALL')}
          >
            <span>Tất Cả Đơn</span>
            <span className="tab-count">{statusCounts.total}</span>
          </button>

          <button
            className={`admin-status-tab ${selectedStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('PENDING')}
            style={selectedStatus === 'PENDING' ? { borderColor: '#f59e0b', color: '#b45309' } : {}}
          >
            <span>Chờ Xác Nhận</span>
            <span className="tab-count" style={{ background: '#fef3c7', color: '#b45309' }}>
              {statusCounts.pending}
            </span>
          </button>

          <button
            className={`admin-status-tab ${selectedStatus === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CONFIRMED')}
          >
            <span>Đã Duyệt &amp; Điều Phối</span>
            <span className="tab-count" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              {statusCounts.confirmed}
            </span>
          </button>

          <button
            className={`admin-status-tab ${selectedStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('COMPLETED')}
          >
            <span>Hoàn Tất Giao Lắp</span>
            <span className="tab-count" style={{ background: '#ecfdf5', color: '#059669' }}>
              {statusCounts.completed}
            </span>
          </button>

          <button
            className={`admin-status-tab ${selectedStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CANCELLED')}
          >
            <span>Đã Hủy Đơn</span>
            <span className="tab-count" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {statusCounts.cancelled}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm mã đơn (#101), Tên khách hàng, SĐT, Địa chỉ, Mã Voucher..."
              className="admin-form-input"
              style={{ paddingLeft: '38px', width: '100%' }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchOrders(0)
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Từ:</span>
              <input
                type="date"
                className="admin-form-input"
                style={{ width: '135px', padding: '0.4rem 0.5rem' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Đến:</span>
              <input
                type="date"
                className="admin-form-input"
                style={{ width: '135px', padding: '0.4rem 0.5rem' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-admin btn-admin-primary" onClick={() => fetchOrders(0)} disabled={loading}>
            <Search size={16} />
            <span>Lọc Đơn</span>
          </button>

          {(searchKeyword || fromDate || toDate) && (
            <button
              className="btn-admin btn-admin-secondary"
              onClick={() => {
                setSearchKeyword('')
                setFromDate('')
                setToDate('')
                fetchOrders(0)
              }}
            >
              <X size={15} /> Xóa Lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
              Danh Sách Đơn Đặt Hàng Nội Thất
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiển thị {orders.length} trên tổng số {totalElements} đơn đặt hàng
            </span>
          </div>
        </div>

        {error && (
          <div style={{ margin: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Ngày Đặt</th>
                <th>Nhân Viên Phụ Trách</th>
                <th>Sản Phẩm &amp; Voucher</th>
                <th style={{ textAlign: 'right' }}>Tổng Thanh Toán</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
                      <RefreshCw size={20} className="animate-spin text-blue-600" />
                      <span>Đang nạp dữ liệu đơn hàng nội thất...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingCart size={40} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy đơn đặt hàng nào phù hợp với bộ lọc</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  let badgeStyle = { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }
                  let badgeText = o.status
                  if (o.status === 'PENDING') {
                    badgeStyle = { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
                    badgeText = 'Chờ tiếp nhận'
                  } else if (o.status === 'CONFIRMED') {
                    badgeStyle = { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                    badgeText = 'Đã duyệt & Gán NV'
                  } else if (o.status === 'COMPLETED') {
                    badgeStyle = { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
                    badgeText = 'Giao thành công'
                  } else if (o.status === 'CANCELLED') {
                    badgeStyle = { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
                    badgeText = 'Đã hủy đơn'
                  }

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td style={{ textAlign: 'center' }}>
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0284c7',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                          }}
                          onClick={() => handleOpenDetail(o.id)}
                          title="Xem chi tiết đơn hàng"
                        >
                          #{o.id}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                            {o.customerName}
                          </span>
                          {o.phone ? (
                            <a
                              href={`tel:${o.phone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none' }}
                            >
                              <Phone size={11} /> {o.phone}
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chưa cập nhật SĐT</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} className="text-slate-400" />
                          <span>{formatDateTime(o.orderDate)}</span>
                        </div>
                      </td>
                      <td>
                        {o.staffName ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#1e293b' }}>
                            <UserCheck size={14} className="text-emerald-600" />
                            <span style={{ fontWeight: 500 }}>{o.staffName}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> Chưa gán NV
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                          <div>{o.totalItemsCount} món nội thất</div>
                          {o.voucherCode && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.1rem 0.4rem', background: '#ffedd5', color: '#c2410c', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                              <Tag size={10} /> {o.voucherCode} (-{formatCurrency(o.discountAmount)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem' }}>
                          {formatCurrency(o.totalAmount)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-block',
                            ...badgeStyle
                          }}
                        >
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          {/* Duyệt đơn hàng nếu PENDING */}
                          {o.status === 'PENDING' && (
                            <button
                              className="btn-action"
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                              title="Duyệt đơn & Gán nhân viên phụ trách"
                              onClick={() => handleOpenConfirmModal(o)}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {/* Hoàn tất nếu CONFIRMED */}
                          {o.status === 'CONFIRMED' && (
                            <button
                              className="btn-action"
                              style={{ background: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe' }}
                              title="Xác nhận hoàn tất giao lắp nội thất"
                              onClick={() => handleCompleteOrder(o.id)}
                            >
                              <Truck size={15} />
                            </button>
                          )}

                          {/* Hủy đơn nếu chưa ở trạng thái cuối */}
                          {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                            <button
                              className="btn-action btn-action-danger"
                              title="Hủy đơn hàng (Hoàn kho & voucher)"
                              onClick={() => handleOpenCancelModal(o)}
                            >
                              <Ban size={15} />
                            </button>
                          )}

                          {/* Xem chi tiết */}
                          <button
                            className="btn-action"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                            title="Xem chi tiết đơn hàng"
                            onClick={() => handleOpenDetail(o.id)}
                          >
                            <Eye size={15} />
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

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Trang {page + 1} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn-admin btn-admin-secondary btn-sm"
                disabled={page <= 0}
                onClick={() => fetchOrders(page - 1)}
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                className="btn-admin btn-admin-secondary btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => fetchOrders(page + 1)}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Chi Tiết Đơn Hàng (Order Detail Drawer) */}
      {showDetailModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '820px' }}>
            {loadingDetail ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin text-blue-600 mb-2" />
                <p>Đang tải chi tiết đơn hàng...</p>
              </div>
            ) : activeOrderDetail ? (
              <div>
                <div className="admin-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>
                          Đơn Đặt Hàng #{activeOrderDetail.id}
                        </h3>
                        <span
                          style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              activeOrderDetail.status === 'COMPLETED'
                                ? '#ecfdf5'
                                : activeOrderDetail.status === 'CONFIRMED'
                                ? '#eff6ff'
                                : activeOrderDetail.status === 'PENDING'
                                ? '#fffbeb'
                                : '#fef2f2',
                            color:
                              activeOrderDetail.status === 'COMPLETED'
                                ? '#047857'
                                : activeOrderDetail.status === 'CONFIRMED'
                                ? '#1d4ed8'
                                : activeOrderDetail.status === 'PENDING'
                                ? '#b45309'
                                : '#b91c1c'
                          }}
                        >
                          {activeOrderDetail.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Ngày đặt: {formatDateTime(activeOrderDetail.orderDate)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn-admin btn-admin-secondary btn-sm"
                      onClick={handlePrintSlip}
                      title="In phiếu giao hàng và lắp đặt A4"
                    >
                      <Printer size={14} /> In Phiếu Giao
                    </button>
                    <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Customer and Delivery Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={15} /> Thông Tin Khách Hàng
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{activeOrderDetail.customerName}</div>
                      <div style={{ fontSize: '0.82rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                        <Phone size={12} /> {activeOrderDetail.phone || 'Chưa có SĐT'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginTop: '4px' }}>
                        <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                        <span>{activeOrderDetail.address || 'Chưa cập nhật địa chỉ'}</span>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <UserCheck size={15} /> Nhân Viên Phụ Trách Điều Phối
                      </h4>
                      {activeOrderDetail.staffName ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                            {activeOrderDetail.staffName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '2px' }}>
                            ● Đang chịu trách nhiệm điều phối &amp; giám sát thi công
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 500 }}>
                            Chưa có nhân viên phụ trách
                          </div>
                          <button
                            className="btn-admin btn-admin-primary btn-sm"
                            style={{ marginTop: '6px' }}
                            onClick={() => {
                              handleOpenConfirmModal(activeOrderDetail)
                            }}
                          >
                            <UserCheck size={13} /> Gán Nhân Viên Ngay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#1e293b' }}>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <img
                                  src={item.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80'}
                                  alt=""
                                  style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                                  {item.productName}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748b' }}>{item.unit || 'cái'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Summary */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginLeft: 'auto', width: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                      <span>Tổng tiền hàng:</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(activeOrderDetail.subtotal)}</span>
                    </div>

                    {activeOrderDetail.voucherCode && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#c2410c' }}>
                        <span>Voucher ({activeOrderDetail.voucherCode}):</span>
                        <span style={{ fontWeight: 600 }}>-{formatCurrency(activeOrderDetail.discountAmount)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: '#15803d', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                      <span>Khách cần trả:</span>
                      <span>{formatCurrency(activeOrderDetail.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  {activeOrderDetail.status === 'PENDING' && (
                    <button
                      className="btn-admin btn-admin-primary"
                      onClick={() => handleOpenConfirmModal(activeOrderDetail)}
                    >
                      <CheckCircle2 size={16} /> Duyệt Đơn &amp; Gán Nhân Viên
                    </button>
                  )}

                  {activeOrderDetail.status === 'CONFIRMED' && (
                    <button
                      className="btn-admin btn-admin-primary"
                      onClick={() => handleCompleteOrder(activeOrderDetail.id)}
                      disabled={submittingComplete}
                    >
                      <Truck size={16} /> Nghiệm Thu &amp; Hoàn Tất
                    </button>
                  )}

                  {activeOrderDetail.status !== 'COMPLETED' && activeOrderDetail.status !== 'CANCELLED' && (
                    <button
                      className="btn-admin btn-admin-danger"
                      onClick={() => handleOpenCancelModal(activeOrderDetail)}
                    >
                      <Ban size={16} /> Hủy Đơn Hàng
                    </button>
                  )}

                  <button className="btn-admin btn-admin-secondary" onClick={() => setShowDetailModal(false)}>
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
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title">Duyệt Đơn Hàng #{orderToConfirm.id}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Phân công nhân viên phụ trách điều phối &amp; giao lắp</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowConfirmModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitConfirm}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Chọn Nhân Viên Phụ Trách <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="admin-form-input"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        #{st.id} - {st.fullName} ({st.role || 'Nhân viên kinh doanh/kho'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Ghi Chú Điều Phối / Giao Lắp</label>
                  <textarea
                    rows="3"
                    className="admin-form-input"
                    placeholder="VD: Giao vào buổi sáng, căn hộ chung cư tầng 12 có thang hàng..."
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submittingConfirm}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={submittingConfirm}
                >
                  {submittingConfirm ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
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
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '460px' }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ color: '#991b1b' }}>Hủy Đơn Hàng #{orderToCancel.id}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Hệ thống sẽ hoàn trả số lượng hàng vào kho</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowCancelModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.4 }}>
                  <strong>Quy tắc hoàn trả:</strong>
                  <br />• Tồn kho của các sản phẩm trong đơn sẽ được tự động cộng lại vào kho.
                  <br />• Lượt sử dụng Voucher (nếu có) sẽ được khôi phục để khách dùng lần sau.
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Lý Do Hủy Đơn Hàng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows="3"
                    className="admin-form-input"
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
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={submittingCancel}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-danger"
                  disabled={submittingCancel}
                >
                  {submittingCancel ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
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
