import React, { useState } from 'react'
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Filter,
  Search,
  UserCheck,
  MapPin,
  Phone,
  FileText,
  X,
  CreditCard,
} from 'lucide-react'
import { MOCK_ORDERS } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminOrders({ showToast }) {
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter
    const matchSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm)
    return matchStatus && matchSearch
  })

  function handleUpdateStatus(orderId, newStatus, newDeliveryText) {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            deliveryStatus: newDeliveryText || o.deliveryStatus,
          }
        }
        return o
      })
    )
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        orderStatus: newStatus,
        deliveryStatus: newDeliveryText || selectedOrder.deliveryStatus,
      })
    }
    showToast(`Đã cập nhật trạng thái đơn ${orderId} sang "${newStatus}"!`)
  }

  function handleAssignTechnician(orderId, techName) {
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, technician: techName } : o))
    )
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, technician: techName })
    }
    showToast(`Đã phân công thợ "${techName}" phụ trách đơn hàng!`)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Đơn hàng & Điều phối Giao Lắp</h1>
          <p className="admin-page-subtitle">
            Theo dõi đơn đặt hàng nội thất, trạng thái đặt cọc và phân công kỹ thuật viên lắp ráp tại nhà khách hàng.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '380px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm theo mã đơn, tên khách, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Filter size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái ({orders.length})</option>
                <option value="PENDING_CONFIRM">Chờ xác nhận</option>
                <option value="PREPARING">Đang soạn kho</option>
                <option value="DELIVERING">Đang vận chuyển & lắp ráp</option>
                <option value="COMPLETED">Đã hoàn tất & nghiệm thu</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn & Ngày Đặt</th>
                <th>Khách Hàng & Liên Hệ</th>
                <th>Địa Chỉ Giao Lắp</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái Xử Lý</th>
                <th>Kỹ Thuật Viên Lắp Đặt</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                let badgeClass = 'neutral'
                let badgeLabel = order.orderStatus
                if (order.orderStatus === 'COMPLETED') { badgeClass = 'success'; badgeLabel = 'Đã Nghiệm Thu' }
                else if (order.orderStatus === 'DELIVERING') { badgeClass = 'info'; badgeLabel = 'Đang Giao Lắp' }
                else if (order.orderStatus === 'PREPARING') { badgeClass = 'warning'; badgeLabel = 'Đang Soạn Kho' }
                else if (order.orderStatus === 'PENDING_CONFIRM') { badgeClass = 'neutral'; badgeLabel = 'Chờ Xác Nhận' }
                else if (order.orderStatus === 'CANCELLED') { badgeClass = 'danger'; badgeLabel = 'Đã Hủy' }

                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#F59E0B' }}>{order.orderCode}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFF' }}>{order.customerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{order.phone}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }} title={order.address}>
                        {order.address}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#FFF' }}>
                      {formatCurrency(order.finalAmount)}
                      {order.discountAmount > 0 && (
                        <div style={{ fontSize: '11px', color: '#10B981' }}>- {formatCurrency(order.discountAmount)} (Voucher)</div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'DEPOSIT_50' ? 'warning' : 'danger'}`}>
                        {order.paymentStatus === 'PAID' ? 'Đã Thanh Toán Đủ' : order.paymentStatus === 'DEPOSIT_50' ? 'Đã Cọc 50%' : 'Chưa Trả'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '4px' }}>
                        {order.deliveryStatus}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: order.technician !== 'Chưa phân công' ? '#60A5FA' : '#94A3B8' }}>
                        {order.technician}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px' }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye size={14} /> Chi Tiết
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View & Update Order */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Chi Tiết Đơn Hàng: {selectedOrder.orderCode}</h3>
                <span style={{ fontSize: '12.5px', color: 'var(--admin-text-dim)' }}>
                  Khách hàng: {selectedOrder.customerName} · SĐT: {selectedOrder.phone}
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Address card */}
              <div style={{ background: '#0B0F17', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                  <MapPin size={16} /> Địa Chỉ Giao Hàng & Thi Công Lắp Đặt:
                </div>
                <div style={{ fontSize: '14px', color: '#FFF' }}>{selectedOrder.address}</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)', marginTop: '4px' }}>
                  Phương thức thanh toán: <strong>{selectedOrder.paymentMethod}</strong>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#FFF' }}>Danh Sách Sản Phẩm Đặt Mua:</h4>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Sản Phẩm Nội Thất</th>
                        <th>Biến Thể Đã Chọn</th>
                        <th>SL</th>
                        <th>Đơn Giá</th>
                        <th>Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: '#FFF' }}>{item.productName}</td>
                          <td><span className="admin-badge neutral">{item.variant}</span></td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td style={{ fontWeight: 700, color: '#FBBF24' }}>{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                    <span>Tổng tiền hàng:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                      <span>Giảm giá Voucher ({selectedOrder.voucherCode}):</span>
                      <span>- {formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontWeight: 700, fontSize: '15px', borderTop: '1px solid var(--admin-border)', paddingTop: '6px' }}>
                    <span>Tổng thanh toán:</span>
                    <span style={{ color: '#F59E0B' }}>{formatCurrency(selectedOrder.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Actions */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#FFF' }}>Cập Nhật Trạng Thái Xử Lý Đơn:</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING', 'Đã xuất kho, đang đóng gói')}
                  >
                    <Clock size={14} /> Soạn Hàng Trong Kho
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    style={{ color: '#60A5FA', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERING', 'Xe tải đang trên đường vận chuyển & giao lắp')}
                  >
                    <Truck size={14} /> Điều Phối Giao Lắp
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED', 'Khách hàng đã ký nghiệm thu hoàn tất')}
                  >
                    <CheckCircle2 size={14} /> Hoàn Tất & Nghiệm Thu
                  </button>
                </div>
              </div>

              {/* Assign Technician */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Phân công thợ phụ trách:</span>
                <select
                  className="admin-filter-select"
                  value={selectedOrder.technician}
                  onChange={(e) => handleAssignTechnician(selectedOrder.id, e.target.value)}
                >
                  <option value="Chưa phân công">Chưa phân công</option>
                  <option value="Nguyễn Văn Đạt (Thợ trưởng)">Nguyễn Văn Đạt (Thợ trưởng)</option>
                  <option value="Trần Quốc Bảo">Trần Quốc Bảo</option>
                  <option value="Võ Minh Thắng & Lê Văn Hùng">Võ Minh Thắng & Lê Văn Hùng</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
