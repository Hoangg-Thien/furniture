import React, { useState } from 'react'
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  DollarSign,
  ShoppingBag,
  Eye,
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  Truck,
  Plus,
} from 'lucide-react'
import { MOCK_CUSTOMERS, MOCK_ORDERS } from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminCustomers({ showToast, activeRole = 'ADMIN' }) {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const filteredCustomers = customers.filter((c) => {
    const matchTier = tierFilter === 'ALL' || c.tier === tierFilter
    const matchSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchTier && matchSearch
  })

  // Customer purchase history
  const customerOrders = selectedCustomer
    ? MOCK_ORDERS.filter(
        (o) =>
          o.customerName.toLowerCase().includes(selectedCustomer.fullName.toLowerCase()) ||
          o.phone === selectedCustomer.phone
      )
    : []

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Khách Hàng FurniStore (CRM)</h1>
          <p className="admin-page-subtitle">
            Hồ sơ khách hàng 360 độ, phân hạng thành viên Bạc/Vàng/Kim cương, giá trị vòng đời (LTV) và lịch sử bàn giao nội thất.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Tổng Khách Hàng</span>
            <div className="admin-metric-icon-box blue">
              <Users size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {customers.length} khách
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">+24% tháng này</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Hạng Kim Cương (VIP)</span>
            <div className="admin-metric-icon-box amber">
              <Award size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {customers.filter((c) => c.tier === 'DIAMOND').length} khách VIP
          </div>
          <div className="admin-metric-footer">
            <span style={{ color: 'var(--admin-text-muted)' }}>Chi tiêu &gt; 50 triệu</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Giá Trị Đơn Trung Bình (AOV)</span>
            <div className="admin-metric-icon-box olive">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {formatCurrency(22500000)}
          </div>
          <div className="admin-metric-footer">
            <span style={{ color: 'var(--admin-text-muted)' }}>Đơn trọn gói phòng khách</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Tỷ Lệ Mua Lại (Retention)</span>
            <div className="admin-metric-icon-box amber">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            38.5%
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">Khách quen mua thêm giường/tủ</span>
          </div>
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
                placeholder="Tìm tên khách hàng, số điện thoại, chung cư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                className="admin-filter-select"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="ALL">Tất cả phân hạng thành viên</option>
                <option value="DIAMOND">Kim Cương (Diamond)</option>
                <option value="GOLD">Vàng (Gold)</option>
                <option value="SILVER">Bạc (Silver)</option>
              </select>

              {(searchTerm || tierFilter !== 'ALL') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSearchTerm('')
                    setTierFilter('ALL')
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Số Điện Thoại & Email</th>
                <th>Địa Chỉ Giao Lắp Mặc Định</th>
                <th className="text-right">Tổng Chi Tiêu (LTV)</th>
                <th className="text-center">Số Đơn</th>
                <th className="text-center">Hạng Thành Viên</th>
                <th>Ngày Gia Nhập</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
                          color: '#FFF',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {c.fullName.split(' ').slice(-1)[0]?.slice(0, 2).toUpperCase() || 'KH'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{c.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>Mã: #KH-{c.id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--admin-primary)', fontSize: '12.5px' }}>
                      {c.phone}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                      {c.email}
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
                      title={c.address}
                    >
                      {c.address}
                    </div>
                  </td>

                  <td className="text-right tabular-nums">
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--admin-text-main)' }}>
                      {formatCurrency(c.totalSpent)}
                    </span>
                  </td>

                  <td className="text-center tabular-nums">
                    <span className="admin-status-badge info">{c.orderCount} đơn</span>
                  </td>

                  <td className="text-center">
                    <span
                      className={`admin-status-badge ${
                        c.tier === 'DIAMOND' ? 'warning' : c.tier === 'GOLD' ? 'warning' : 'neutral'
                      }`}
                      style={{
                        background:
                          c.tier === 'DIAMOND'
                            ? 'rgba(217, 119, 6, 0.2)'
                            : c.tier === 'GOLD'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(255, 255, 255, 0.1)',
                        color: c.tier === 'DIAMOND' ? '#D97706' : '#B45309',
                      }}
                    >
                      <Award size={12} style={{ marginRight: '3px' }} />
                      {c.tier === 'DIAMOND' ? 'Kim Cương' : c.tier === 'GOLD' ? 'Vàng' : 'Bạc'}
                    </span>
                  </td>

                  <td style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>
                    {c.joinedDate}
                  </td>

                  <td className="text-center">
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <Eye size={13} /> Hồ Sơ 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================================================
          SLIDE-OVER DRAWER: 360-DEGREE CUSTOMER PROFILE & ORDER HISTORY
         ========================================================================== */}
      {selectedCustomer && (
        <div
          className="admin-modal-backdrop"
          style={{ justifyContent: 'flex-end', padding: 0 }}
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              height: '100vh',
              background: 'var(--admin-surface)',
              borderLeft: '1px solid var(--admin-border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--admin-modal-shadow)',
              animation: 'slide-left 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--admin-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedCustomer.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                    {selectedCustomer.fullName}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Khách hàng #{selectedCustomer.id} · Gia nhập {selectedCustomer.joinedDate}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedCustomer(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Financial LTV Metric Card */}
              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Tổng chi tiêu (LTV):</span>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--admin-primary)', marginTop: '2px' }} className="tabular-nums">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </div>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>Hạng: {selectedCustomer.tier} VIP</span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Số đơn nội thất đã mua:</span>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--admin-text-main)', marginTop: '2px' }} className="tabular-nums">
                    {selectedCustomer.orderCount} đơn hàng
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>0 lần hoàn trả hàng</span>
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                <h4 className="admin-detail-card-title">
                  <MapPin size={16} style={{ color: 'var(--admin-primary)' }} />
                  Địa Chỉ Thi Công & Giao Hàng Đã Lưu:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: 'var(--admin-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '2px' }}>
                      Địa chỉ chính (Nhà riêng):
                    </div>
                    <div>{selectedCustomer.address}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '4px' }}>
                      Đặc điểm: Căn hộ chung cư cao tầng, có thang máy hàng, nhận hàng sau 14h.
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="admin-detail-card" style={{ marginBottom: 0 }}>
                <h4 className="admin-detail-card-title">
                  <ShoppingBag size={16} style={{ color: 'var(--admin-primary)' }} />
                  Lịch Sử Các Đơn Hàng Nội Thất:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customerOrders.length > 0 ? (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          background: 'var(--admin-bg)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                            {ord.orderCode}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                            {ord.items?.length || 1} sản phẩm · {ord.deliveryStatus}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }} className="tabular-nums">
                            {formatCurrency(ord.finalAmount)}
                          </div>
                          <span
                            className={`admin-status-badge ${
                              ord.orderStatus === 'COMPLETED' ? 'success' : 'info'
                            }`}
                            style={{ fontSize: '10px', padding: '1px 6px' }}
                          >
                            {ord.orderStatus === 'COMPLETED' ? 'Đã nghiệm thu' : 'Đang xử lý'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--admin-text-muted)', fontSize: '12.5px' }}>
                      Khách hàng chưa có thêm đơn mua nào khác.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--admin-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedCustomer(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  showToast(`Đang mở giao diện tạo đơn hàng cho khách ${selectedCustomer.fullName}...`)
                }}
              >
                + Lên Đơn Mới Cho Khách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
