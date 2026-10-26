import React, { useState, useEffect } from 'react'
import {
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Filter,
  Search,
  MapPin,
  Phone,
  FileText,
  X,
  CreditCard,
  User,
  Calendar,
  Wrench,
  AlertTriangle,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Camera,
  Layers,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { MOCK_ORDERS } from './adminMockData'
import AdminPagination from './AdminPagination'
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  updateAdminDispatchInfo,
  cancelAdminOrder,
} from '../../lib/adminSales'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

const STEPPER_STAGES = [
  { key: 'PENDING_CONFIRM', step: 1, label: 'Chờ xác nhận', desc: 'Chờ CSKH duyệt đơn' },
  { key: 'CONFIRMED', step: 2, label: 'Đã duyệt đơn', desc: 'Đã nhận đặt cọc' },
  { key: 'PREPARING', step: 3, label: 'Đang soạn kho', desc: 'Xuất kiện gỗ nguyên đai' },
  { key: 'DELIVERING', step: 4, label: 'Đang giao hàng', desc: 'Xe tải trên đường giao' },
  { key: 'INSTALLING', step: 5, label: 'Đang lắp đặt', desc: 'Thợ thi công tại phòng' },
  { key: 'COMPLETED', step: 6, label: 'Hoàn tất nghiệm thu', desc: 'Khách ký biên bản' },
]

export default function AdminOrders({ showToast, activeRole = 'ADMIN' }) {
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [loading, setLoading] = useState(false)
  const [isRealData, setIsRealData] = useState(false)
  const [statusTab, setStatusTab] = useState('ALL') // 'ALL' | 'PENDING_CONFIRM' | 'PREPARING' | 'DELIVERING' | 'COMPLETED'
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // Tự động chuyển về trang 1 khi thay đổi bộ lọc tìm kiếm hoặc tab
  useEffect(() => {
    setCurrentPage(1)
  }, [statusTab, searchTerm, paymentFilter])

  // Edit / Dispatch details state inside modal
  const [dispatchTech, setDispatchTech] = useState('')
  const [dispatchVehicle, setDispatchVehicle] = useState('Xe tải 1.5 tấn (29C-881.42 - Tài xế Hùng)')
  const [dispatchTime, setDispatchTime] = useState('14:00 - 16:30 (Chiều nay)')
  const [dispatchNotes, setDispatchNotes] = useState('Chung cư có thang máy hàng, cần đăng ký ban quản lý tòa nhà.')
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  // Tải dữ liệu đơn hàng thực tế từ Backend Spring Boot MVC
  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    const { orders: remoteOrders, isRealData: real } = await fetchAdminOrders()
    if (remoteOrders && remoteOrders.length > 0) {
      setOrders(remoteOrders)
      setIsRealData(real)
      if (real && !silent) {
        showToast('Đã tải danh sách đơn hàng thực tế từ database!')
      }
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Status counts
  const pendingCount = orders.filter((o) => o.orderStatus === 'PENDING_CONFIRM').length
  const preparingCount = orders.filter((o) => o.orderStatus === 'PREPARING').length
  const deliveringCount = orders.filter((o) => o.orderStatus === 'DELIVERING' || o.orderStatus === 'INSTALLING').length
  const completedCount = orders.filter((o) => o.orderStatus === 'COMPLETED').length
  const cancelledCount = orders.filter((o) => o.orderStatus === 'CANCELLED').length

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    let matchTab = true
    if (statusTab === 'DELIVERING') {
      matchTab = o.orderStatus === 'DELIVERING' || o.orderStatus === 'INSTALLING'
    } else if (statusTab !== 'ALL') {
      matchTab = o.orderStatus === statusTab
    }

    const matchSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchPayment =
      paymentFilter === 'ALL' || o.paymentStatus === paymentFilter

    return matchTab && matchSearch && matchPayment
  })

  // Danh sách đơn hàng phân trang theo trang hiện tại
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Open Order Detail Modal
  function handleOpenDetail(order) {
    setSelectedOrder(order)
    setDispatchTech(order.technician || 'Nguyễn Văn Đạt (Thợ trưởng)')
  }

  // Update Status in Stepper Workflow
  async function handleAdvanceStep(orderId, nextStatus, nextDeliveryText) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: nextStatus,
              deliveryStatus: nextDeliveryText || o.deliveryStatus,
              timeline: [
                {
                  time: 'Vừa xong',
                  text: `Cập nhật trạng thái đơn: ${nextDeliveryText || nextStatus}`,
                },
                ...(o.timeline || []),
              ],
            }
          : o
      )
    )

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({
        ...prev,
        orderStatus: nextStatus,
        deliveryStatus: nextDeliveryText || prev.deliveryStatus,
        timeline: [
          {
            time: 'Vừa xong',
            text: `Cập nhật trạng thái đơn: ${nextDeliveryText || nextStatus}`,
          },
          ...(prev.timeline || []),
        ],
      }))
    }

    showToast(`Đã chuyển đơn hàng sang trạng thái: "${nextDeliveryText || nextStatus}"`)

    // Gửi request cập nhật thực tế xuống Backend database
    await updateAdminOrderStatus(orderId, nextStatus, nextDeliveryText)
  }

  // Save Dispatch Info
  async function handleSaveDispatch() {
    if (!selectedOrder) return
    const payload = {
      technician: dispatchTech,
      vehicle: dispatchVehicle,
      deliveryTime: dispatchTime,
      deliveryNotes: dispatchNotes,
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              technician: dispatchTech,
              vehicle: dispatchVehicle,
              deliveryNotes: dispatchNotes,
            }
          : o
      )
    )
    setSelectedOrder((prev) => ({
      ...prev,
      technician: dispatchTech,
      vehicle: dispatchVehicle,
      deliveryNotes: dispatchNotes,
    }))
    showToast(`Đã lưu điều phối thợ "${dispatchTech}" và xe tải thành công!`)

    // Gửi cập nhật điều phối xuống Backend database
    await updateAdminDispatchInfo(selectedOrder.id, payload)
  }

  // Cancel order with safety dialog
  async function handleConfirmCancelOrder() {
    if (!selectedOrder) return
    const orderId = selectedOrder.id
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, orderStatus: 'CANCELLED', deliveryStatus: 'Đã hủy đơn hàng' }
          : o
      )
    )
    setSelectedOrder((prev) => ({
      ...prev,
      orderStatus: 'CANCELLED',
      deliveryStatus: 'Đã hủy đơn hàng',
    }))
    setCancelConfirmOpen(false)
    showToast(`Đã hủy đơn hàng #${selectedOrder.orderCode}. Tồn kho đã được hoàn lại!`)

    // Gửi yêu cầu hủy đơn xuống Backend database
    await cancelAdminOrder(orderId)
  }

  // Print invoice simulator
  function handlePrintOrder(orderCode) {
    showToast(`Đang kết xuất phiếu giao hàng & nghiệm thu A4 cho đơn ${orderCode}...`)
    window.print()
  }

  // Helper to determine active step index in Stepper
  function getStepIndex(status) {
    switch (status) {
      case 'PENDING_CONFIRM':
        return 1
      case 'CONFIRMED':
        return 2
      case 'PREPARING':
        return 3
      case 'DELIVERING':
        return 4
      case 'INSTALLING':
        return 5
      case 'COMPLETED':
        return 6
      default:
        return 1
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-page-title">Quản Lý Đơn Hàng & Điều Phối Giao Lắp</h1>
            {isRealData && (
              <span className="admin-badge admin-badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Database Supabase Live
              </span>
            )}
          </div>
          <p className="admin-page-subtitle">
            Giám sát đơn hàng nội thất, quản lý đặt cọc và điều phối đội thợ thi công lắp ráp tận nơi tại căn hộ khách hàng.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => loadOrders(false)}
            title="Làm mới dữ liệu từ máy chủ"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {loading ? 'Đang tải...' : 'Làm Mới'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => handlePrintOrder('DANH_SACH_GIAO_LAP')}
            title="In lịch trình giao lắp hôm nay"
          >
            <Printer size={15} /> In Lịch Trình Xe Tải
          </button>
        </div>
      </div>

      {/* Status Tab Bar with Badges */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusTab('ALL')}
        >
          <span>Tất cả đơn hàng</span>
          <span className="admin-status-tab-badge">{orders.length}</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'PENDING_CONFIRM' ? 'active' : ''}`}
          onClick={() => setStatusTab('PENDING_CONFIRM')}
        >
          <span>Chờ xác nhận</span>
          <span className="admin-status-tab-badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'PREPARING' ? 'active' : ''}`}
          onClick={() => setStatusTab('PREPARING')}
        >
          <span>Đang soạn kho</span>
          <span className="admin-status-tab-badge">{preparingCount}</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'DELIVERING' ? 'active' : ''}`}
          onClick={() => setStatusTab('DELIVERING')}
        >
          <span>Đang giao & lắp</span>
          <span className="admin-status-tab-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            {deliveringCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setStatusTab('COMPLETED')}
        >
          <span>Hoàn tất nghiệm thu</span>
          <span className="admin-status-tab-badge" style={{ background: '#EDF7ED', color: '#2E7D32' }}>
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'CANCELLED' ? 'active' : ''}`}
          onClick={() => setStatusTab('CANCELLED')}
        >
          <span>Đã hủy</span>
          <span className="admin-status-tab-badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tra cứu theo mã #DH..., tên khách, SĐT, tòa nhà..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Payment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Filter size={15} style={{ color: 'var(--admin-text-dim)' }} />
              <select
                className="admin-filter-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="ALL">Tất cả tình trạng thanh toán</option>
                <option value="DEPOSIT_50">Đã cọc 50% (Chờ thu COD khi lắp)</option>
                <option value="PAID">Đã thanh toán 100%</option>
                <option value="UNPAID">Chưa đặt cọc</option>
              </select>

              {(searchTerm || paymentFilter !== 'ALL' || statusTab !== 'ALL') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSearchTerm('')
                    setPaymentFilter('ALL')
                    setStatusTab('ALL')
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Đơn & Thời Gian</th>
                <th>Khách Hàng & Liên Hệ</th>
                <th>Địa Chỉ & Lưu Ý Giao Lắp</th>
                <th className="text-right">Tổng Tiền</th>
                <th className="text-center">Thanh Toán</th>
                <th className="text-center">Trạng Thái Xử Lý</th>
                <th>Đội Thợ & Xe Giao</th>
                <th className="text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  let statusClass = 'warning'
                  let statusText = 'Chờ xác nhận'

                  if (order.orderStatus === 'COMPLETED') {
                    statusClass = 'success'
                    statusText = 'Đã nghiệm thu'
                  } else if (order.orderStatus === 'DELIVERING' || order.orderStatus === 'INSTALLING') {
                    statusClass = 'info'
                    statusText = order.orderStatus === 'INSTALLING' ? 'Đang lắp đặt' : 'Đang giao xe tải'
                  } else if (order.orderStatus === 'PREPARING') {
                    statusClass = 'warning'
                    statusText = 'Đang soạn kho'
                  } else if (order.orderStatus === 'CANCELLED') {
                    statusClass = 'danger'
                    statusText = 'Đã hủy đơn'
                  }

                  const orderDate = new Date(order.createdAt || '2026-10-22T10:15:00')
                  const formattedDate = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`

                  return (
                    <tr key={order.id}>
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--admin-primary)',
                            fontFamily: 'monospace',
                            fontSize: '13.5px',
                          }}
                        >
                          {order.orderCode}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                          {formattedDate} {orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                          {order.phone}
                        </div>
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
                          title={order.address}
                        >
                          {order.address}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                          Lưu ý: Chung cư có thang máy hàng
                        </div>
                      </td>

                      <td className="text-right tabular-nums">
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          {formatCurrency(order.finalAmount)}
                        </div>
                        {order.discountAmount > 0 && (
                          <div style={{ fontSize: '11px', color: '#10B981' }}>
                            - {formatCurrency(order.discountAmount)} (Voucher)
                          </div>
                        )}
                      </td>

                      <td className="text-center">
                        <span
                          className={`admin-status-badge ${
                            order.paymentStatus === 'PAID'
                              ? 'success'
                              : order.paymentStatus === 'DEPOSIT_50'
                              ? 'warning'
                              : 'danger'
                          }`}
                        >
                          <span className="dot" />
                          {order.paymentStatus === 'PAID'
                            ? 'Đã trả 100%'
                            : order.paymentStatus === 'DEPOSIT_50'
                            ? 'Đã cọc 50%'
                            : 'Chưa thanh toán'}
                        </span>
                        {order.paymentStatus === 'DEPOSIT_50' && (
                          <div style={{ fontSize: '10.5px', color: 'var(--admin-warning)', marginTop: '2px' }}>
                            COD: {formatCurrency(order.finalAmount * 0.5)}
                          </div>
                        )}
                      </td>

                      <td className="text-center">
                        <span className={`admin-status-badge ${statusClass}`}>
                          <span className="dot" />
                          {statusText}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                          {order.deliveryStatus}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px' }}>
                          <Wrench size={13} style={{ color: 'var(--admin-primary)' }} />
                          <span style={{ fontWeight: 500 }}>{order.technician}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                          Hẹn: 14:00 - 16:30 chiều
                        </div>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleOpenDetail(order)}
                        >
                          <Eye size={13} /> Chi Tiết
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang đơn hàng */}
        <AdminPagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 8, 10, 15, 20]}
          itemLabel="đơn hàng"
        />
      </div>

      {/* ==========================================================================
          MODAL: DETAILED ORDER & INSTALLATION WORKFLOW (2-COLUMN 70/30 LAYOUT)
         ========================================================================== */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '1050px', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="admin-modal-header" style={{ padding: '16px 24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 className="admin-modal-title" style={{ fontSize: '18px' }}>
                    Đơn Hàng: {selectedOrder.orderCode}
                  </h3>
                  <span
                    className={`admin-status-badge ${
                      selectedOrder.orderStatus === 'COMPLETED' ? 'success' : 'info'
                    }`}
                  >
                    <span className="dot" /> {selectedOrder.deliveryStatus}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                  Ngày đặt: 22/10/2026 10:15 · Khách hàng: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.phone})
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => handlePrintOrder(selectedOrder.orderCode)}
                  title="In phiếu giao hàng và biên bản nghiệm thu A4"
                >
                  <Printer size={14} /> In Phiếu Giao & Lắp
                </button>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="admin-modal-body" style={{ padding: '24px' }}>
              {/* 1. VISUAL 6-STEP DELIVERY STEPPER */}
              <div className="admin-stepper-wrap">
                {STEPPER_STAGES.map((stg, idx) => {
                  const currentIdx = getStepIndex(selectedOrder.orderStatus)
                  const isCompleted = stg.step < currentIdx
                  const isCurrent = stg.step === currentIdx

                  let stepClass = ''
                  if (isCompleted) stepClass = 'completed'
                  else if (isCurrent) stepClass = 'current'

                  return (
                    <div key={stg.key} className={`admin-stepper-step ${stepClass}`}>
                      {idx < STEPPER_STAGES.length - 1 && (
                        <div className="admin-stepper-line" />
                      )}
                      <div className="admin-stepper-circle">
                        {isCompleted ? '✓' : stg.step}
                      </div>
                      <div className="admin-stepper-label">{stg.label}</div>
                      <div className="admin-stepper-time">{stg.desc}</div>
                    </div>
                  )
                })}
              </div>

              {/* 2. MAIN 2-COLUMN RESPONSIVE LAYOUT (70% LEFT / 30% RIGHT) */}
              <div className="admin-order-detail-grid">
                {/* ===================== LEFT COLUMN (70%) ===================== */}
                <div>
                  {/* Products & Variant Specifications */}
                  <div className="admin-detail-card">
                    <h4 className="admin-detail-card-title">
                      <Layers size={16} style={{ color: 'var(--admin-primary)' }} />
                      Sản Phẩm & Quy Cách Biến Thể Đặt Mua ({selectedOrder.items?.length || 1} món):
                    </h4>

                    <div className="admin-table-container">
                      <table className="admin-data-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Sản Phẩm Nội Thất</th>
                            <th>Quy Cách Biến Thể</th>
                            <th className="text-center">Số Lượng</th>
                            <th className="text-right">Đơn Giá</th>
                            <th className="text-right">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                  {item.productName}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                                  Bảo hành 36 tháng mối nối gỗ
                                </div>
                              </td>
                              <td>
                                <span
                                  className="admin-status-badge info"
                                  style={{ fontSize: '11.5px', padding: '2px 8px' }}
                                >
                                  {item.variant}
                                </span>
                              </td>
                              <td className="text-center tabular-nums" style={{ fontWeight: 600 }}>
                                x{item.quantity} kiện
                              </td>
                              <td className="text-right tabular-nums">
                                {formatCurrency(item.price)}
                              </td>
                              <td
                                className="text-right tabular-nums"
                                style={{ fontWeight: 700, color: 'var(--admin-primary)' }}
                              >
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dispatching: Technician, Truck & Appointment */}
                  <div className="admin-detail-card">
                    <h4 className="admin-detail-card-title">
                      <Truck size={16} style={{ color: 'var(--admin-primary)' }} />
                      Kế Hoạch Điều Phối Giao Hàng & Đội Thợ Thi Công:
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div className="admin-form-group">
                        <label>Đội Thợ Lắp Ráp Phụ Trách *</label>
                        <select
                          value={dispatchTech}
                          onChange={(e) => setDispatchTech(e.target.value)}
                        >
                          <option value="Nguyễn Văn Đạt (Thợ trưởng - 0918.234.567)">
                            Nguyễn Văn Đạt (Thợ trưởng - 0918.234.567)
                          </option>
                          <option value="Trần Quốc Bảo (Thợ mộc bậc 5 - 0903.882.114)">
                            Trần Quốc Bảo (Thợ mộc bậc 5 - 0903.882.114)
                          </option>
                          <option value="Đội 2: Võ Minh Thắng & Lê Văn Hùng">
                            Đội 2: Võ Minh Thắng & Lê Văn Hùng
                          </option>
                        </select>
                      </div>

                      <div className="admin-form-group">
                        <label>Xe Tải Vận Chuyển</label>
                        <select
                          value={dispatchVehicle}
                          onChange={(e) => setDispatchVehicle(e.target.value)}
                        >
                          <option value="Xe tải 1.5 tấn (29C-881.42 - Tài xế Hùng)">
                            Xe tải 1.5 tấn (29C-881.42 - Tài xế Hùng)
                          </option>
                          <option value="Xe tải 2.5 tấn (51D-921.14 - Tài xế Tuấn)">
                            Xe tải 2.5 tấn (51D-921.14 - Tài xế Tuấn)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div className="admin-form-group">
                        <label>Khung Giờ Hẹn Khách Hàng</label>
                        <input
                          type="text"
                          value={dispatchTime}
                          onChange={(e) => setDispatchTime(e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Lưu Ý Khi Lắp Ráp (Thang máy, điện tường)</label>
                        <input
                          type="text"
                          value={dispatchNotes}
                          onChange={(e) => setDispatchNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={handleSaveDispatch}
                      >
                        Lưu Thông Tin Điều Phối
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail & Timeline */}
                  <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                    <h4 className="admin-detail-card-title">
                      <Clock size={16} style={{ color: 'var(--admin-primary)' }} />
                      Nhật Ký Xử Lý & Lịch Sử Đơn Hàng (Audit Trail):
                    </h4>

                    <div className="admin-timeline">
                      {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                        selectedOrder.timeline.map((item, i) => (
                          <div key={i} className="admin-timeline-item">
                            <span className="admin-timeline-dot" />
                            <div className="admin-timeline-time">{item.time}</div>
                            <div className="admin-timeline-text">{item.text}</div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="admin-timeline-item">
                            <span className="admin-timeline-dot" />
                            <div className="admin-timeline-time">14:00 23/10/2026</div>
                            <div className="admin-timeline-text">
                              Xe tải 29C-881.42 đã xuất bến kho Thủ Đức, vận chuyển đến căn hộ khách hàng.
                            </div>
                          </div>
                          <div className="admin-timeline-item">
                            <span className="admin-timeline-dot" />
                            <div className="admin-timeline-time">10:45 22/10/2026</div>
                            <div className="admin-timeline-text">
                              Sales Thu Hà xác nhận đơn hàng sau khi nhận tiền cọc 50% qua VietQR.
                            </div>
                          </div>
                          <div className="admin-timeline-item">
                            <span className="admin-timeline-dot" />
                            <div className="admin-timeline-time">10:15 22/10/2026</div>
                            <div className="admin-timeline-text">
                              Đơn hàng được khởi tạo thành công trên hệ thống FurniStore.
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===================== RIGHT COLUMN (30%) ===================== */}
                <div>
                  {/* Customer Information & Address */}
                  <div className="admin-detail-card">
                    <h4 className="admin-detail-card-title">
                      <User size={16} style={{ color: 'var(--admin-primary)' }} />
                      Thông Tin Khách Hàng:
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--admin-text-main)' }}>
                        {selectedOrder.customerName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-muted)' }}>
                        <Phone size={13} /> {selectedOrder.phone}
                      </div>

                      <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '10px', marginTop: '6px' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--admin-text-dim)', marginBottom: '4px' }}>
                          ĐỊA CHỈ THI CÔNG & LẮP ĐẶT:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--admin-text-main)', lineHeight: 1.4 }}>
                          <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--admin-primary)' }} />
                          <span>{selectedOrder.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary & Deposit Calculator */}
                  <div className="admin-detail-card">
                    <h4 className="admin-detail-card-title">
                      <DollarSign size={16} style={{ color: 'var(--admin-primary)' }} />
                      Tổng Kết Tài Chính & Đặt Cọc:
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                        <span>Tạm tính tiền hàng:</span>
                        <span className="tabular-nums">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>

                      {selectedOrder.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                          <span>Voucher ({selectedOrder.voucherCode}):</span>
                          <span className="tabular-nums">- {formatCurrency(selectedOrder.discountAmount)}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                        <span>Phí vận chuyển xe tải:</span>
                        <span className="tabular-nums">+ 500.000 ₫</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                        <span>Phí lắp đặt chuyên dụng:</span>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Miễn phí</span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--admin-border)',
                          paddingTop: '8px',
                          marginTop: '4px',
                          fontSize: '15px',
                          fontWeight: 700,
                        }}
                      >
                        <span>Tổng thanh toán:</span>
                        <span className="tabular-nums" style={{ color: 'var(--admin-primary)' }}>
                          {formatCurrency(selectedOrder.finalAmount)}
                        </span>
                      </div>

                      {/* Deposit Details */}
                      <div
                        style={{
                          background: 'var(--admin-bg)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          marginTop: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--admin-text-muted)' }}>Đã cọc 50% (VietQR):</span>
                          <span className="tabular-nums" style={{ fontWeight: 600, color: '#10B981' }}>
                            {formatCurrency(selectedOrder.finalAmount * 0.5)}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--admin-warning)',
                            borderTop: '1px dashed var(--admin-border)',
                            paddingTop: '6px',
                          }}
                        >
                          <span>CẦN THU COD TẠI NHÀ:</span>
                          <span className="tabular-nums">
                            {formatCurrency(selectedOrder.finalAmount * 0.5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Handover Photo Upload */}
                  <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                    <h4 className="admin-detail-card-title">
                      <Camera size={16} style={{ color: 'var(--admin-primary)' }} />
                      Hình Ảnh Nghiệm Thu Tại Nhà:
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div
                        style={{
                          border: '2px dashed var(--admin-border)',
                          borderRadius: '8px',
                          padding: '14px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: 'var(--admin-bg)',
                          fontSize: '12px',
                        }}
                        onClick={() => {
                          showToast('Đã tải lên ảnh nghiệm thu hoàn tất tại nhà khách hàng!')
                        }}
                      >
                        <Camera size={20} style={{ color: 'var(--admin-primary)', margin: '0 auto 6px' }} />
                        <div>+ Tải ảnh nghiệm thu thực tế</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                        Thợ chụp sản phẩm hoàn thiện trong không gian phòng khách để kích hoạt bảo hành.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Workflow Action Bar */}
            <div
              className="admin-modal-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'var(--admin-surface)',
              }}
            >
              <div>
                {selectedOrder.orderStatus !== 'CANCELLED' && selectedOrder.orderStatus !== 'COMPLETED' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    Hủy Đơn Hàng
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Đóng
                </button>

                {/* Advance Stepper Buttons based on current state */}
                {selectedOrder.orderStatus === 'PENDING_CONFIRM' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      handleAdvanceStep(
                        selectedOrder.id,
                        'PREPARING',
                        'Đã duyệt đơn và xuất lệnh soạn hàng kho'
                      )
                    }
                  >
                    <CheckCircle2 size={15} /> Xác Nhận Đơn & Soạn Kho
                  </button>
                )}

                {selectedOrder.orderStatus === 'PREPARING' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      handleAdvanceStep(
                        selectedOrder.id,
                        'DELIVERING',
                        'Xe tải 29C-881.42 đang vận chuyển đến khách'
                      )
                    }
                  >
                    <Truck size={15} /> Xuất Kho & Bắt Đầu Giao Xe Tải
                  </button>
                )}

                {selectedOrder.orderStatus === 'DELIVERING' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      handleAdvanceStep(
                        selectedOrder.id,
                        'INSTALLING',
                        'Đội thợ Đạt đang thi công lắp ráp tại phòng'
                      )
                    }
                  >
                    <Wrench size={15} /> Thợ Bắt Đầu Lắp Đặt Tại Nhà
                  </button>
                )}

                {selectedOrder.orderStatus === 'INSTALLING' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)' }}
                    onClick={() =>
                      handleAdvanceStep(
                        selectedOrder.id,
                        'COMPLETED',
                        'Khách hàng đã ký biên bản nghiệm thu hoàn tất'
                      )
                    }
                  >
                    <ShieldCheck size={15} /> Hoàn Tất & Nghiệm Thu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SAFETY DIALOG: CONFIRM CANCEL ORDER
         ========================================================================== */}
      {cancelConfirmOpen && (
        <div className="admin-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setCancelConfirmOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: 'var(--admin-danger-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-danger)' }}>
                <AlertTriangle size={20} />
                <h3 className="admin-modal-title" style={{ color: 'var(--admin-danger)' }}>
                  Xác Nhận Hủy Đơn Hàng?
                </h3>
              </div>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--admin-text-main)', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrder?.orderCode}</strong> của khách hàng <strong>{selectedOrder?.customerName}</strong>?
              </p>
              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12.5px',
                  color: 'var(--admin-text-muted)',
                }}
              >
                Hành động này sẽ:
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Tự động hoàn trả toàn bộ số lượng biến thể về kho.</li>
                  <li>Hủy lịch trình xe tải và thông báo cho đội thợ lắp ráp.</li>
                </ul>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Không, giữ lại đơn
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleConfirmCancelOrder}
              >
                Xác Nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
