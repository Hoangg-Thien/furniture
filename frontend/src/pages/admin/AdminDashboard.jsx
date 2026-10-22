import React from 'react'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  MOCK_DASHBOARD_STATS,
  MOCK_REVENUE_CHART,
  MOCK_CATEGORY_SHARE,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
} from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminDashboard({ onNavigate, showToast }) {
  // Lấy các sản phẩm có tồn kho thấp (< 6)
  const lowStockProducts = MOCK_PRODUCTS.filter((p) => p.totalStock < 6)

  return (
    <div>
      {/* Hero Welcome */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Tổng quan Kinh doanh FurniStore</h1>
          <p className="admin-page-subtitle">
            Báo cáo hiệu suất bán hàng, tình trạng giao lắp nội thất và cảnh báo tồn kho thời gian thực.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => onNavigate('/admin/inventory')}
          >
            <Package size={16} /> Lập Phiếu Nhập Kho
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => onNavigate('/admin/products')}
          >
            <ShoppingBag size={16} /> Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Doanh Thu Tháng Này</span>
            <div className="admin-metric-icon-box amber">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="admin-metric-value">{formatCurrency(MOCK_DASHBOARD_STATS.totalRevenue)}</div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">
              <TrendingUp size={12} /> +{MOCK_DASHBOARD_STATS.revenueGrowth}%
            </span>
            <span style={{ color: 'var(--admin-text-dim)' }}>so với tháng trước</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Tổng Đơn Đặt Hàng</span>
            <div className="admin-metric-icon-box blue">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="admin-metric-value">{MOCK_DASHBOARD_STATS.totalOrders} đơn</div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">
              <TrendingUp size={12} /> +{MOCK_DASHBOARD_STATS.ordersGrowth}%
            </span>
            <span style={{ color: 'var(--admin-text-dim)' }}>tỷ lệ chuyển đổi tốt</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Đang Giao Lắp Tại Nhà</span>
            <div className="admin-metric-icon-box emerald">
              <Truck size={20} />
            </div>
          </div>
          <div className="admin-metric-value">{MOCK_DASHBOARD_STATS.pendingDeliveries} căn hộ</div>
          <div className="admin-metric-footer">
            <span className="admin-badge info" style={{ padding: '2px 8px', fontSize: '11px' }}>
              <Clock size={12} /> 4 thợ đang thi công
            </span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Cảnh Báo Tồn Kho</span>
            <div className="admin-metric-icon-box rose">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="admin-metric-value">{lowStockProducts.length} mặt hàng</div>
          <div className="admin-metric-footer">
            <span className="trend-badge down">
              <AlertTriangle size={12} /> Cần nhập thêm
            </span>
            <span style={{ color: 'var(--admin-text-dim)' }}>dưới 6 cái</span>
          </div>
        </div>
      </div>

      {/* Grid: Revenue Trend & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Revenue Performance Chart simulation */}
        <div className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">
              <TrendingUp size={18} style={{ color: '#F59E0B' }} />
              Diễn Biến Doanh Thu & Lợi Nhuận Gộp (6 Tháng)
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Đơn vị: Triệu VNĐ</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {MOCK_REVENUE_CHART.map((item) => {
                const max = 500000000
                const revPct = Math.min(100, Math.round((item.revenue / max) * 100))
                const profitPct = Math.min(100, Math.round((item.profit / max) * 100))
                return (
                  <div key={item.month}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#FFF' }}>{item.month}</span>
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                        {formatCurrency(item.revenue)} · Lãi: {formatCurrency(item.profit)}
                      </span>
                    </div>
                    {/* Double Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                      <div style={{ width: `${revPct}%`, background: 'linear-gradient(90deg, #D97706, #F59E0B)', borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category Share */}
        <div className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">
              <Layers size={18} style={{ color: '#10B981' }} />
              Cơ Cấu Doanh Thu Theo Nhóm Nội Thất
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Tỷ trọng %</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {MOCK_CATEGORY_SHARE.map((cat) => (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--admin-text-main)', fontWeight: 500 }}>{cat.category}</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>{cat.percentage}% ({formatCurrency(cat.revenue)})</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${cat.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Delivery Tracking */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">
            <Truck size={18} style={{ color: '#60A5FA' }} />
            Đơn Đặt Hàng & Tiến Độ Giao Lắp Gần Đây
          </h2>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => onNavigate('/admin/orders')}
          >
            Xem Tất Cả Đơn Hàng <ChevronRight size={14} />
          </button>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Địa Chỉ Giao Lắp</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái Đơn</th>
                <th>Kỹ Thuật Viên Phụ Trách</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.slice(0, 4).map((order) => {
                let badgeClass = 'neutral'
                let badgeText = order.orderStatus
                if (order.orderStatus === 'COMPLETED') { badgeClass = 'success'; badgeText = 'Đã Nghiệm Thu' }
                else if (order.orderStatus === 'DELIVERING') { badgeClass = 'info'; badgeText = 'Đang Giao Lắp' }
                else if (order.orderStatus === 'PREPARING') { badgeClass = 'warning'; badgeText = 'Đang Soạn Hàng' }
                else if (order.orderStatus === 'PENDING_CONFIRM') { badgeClass = 'neutral'; badgeText = 'Chờ Xác Nhận' }

                return (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#F59E0B' }}>{order.orderCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{order.phone}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                        {order.address}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#FFF' }}>
                      {formatCurrency(order.finalAmount)}
                    </td>
                    <td>
                      <span className={`admin-badge ${order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'DEPOSIT_50' ? 'warning' : 'danger'}`}>
                        {order.paymentStatus === 'PAID' ? 'Đã Thanh Toán' : order.paymentStatus === 'DEPOSIT_50' ? 'Đã Cọc 50%' : 'Chưa Trả'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--admin-text-muted)' }}>
                      {order.technician}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Inventory Alert Panel */}
      <div className="admin-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div className="admin-panel-header" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          <h2 className="admin-panel-title" style={{ color: '#F87171' }}>
            <ShieldAlert size={18} />
            Cảnh Báo Hàng Sắp Hết Trong Kho (Tồn kho &lt; 6 chiếc)
          </h2>
          <button
            className="admin-btn admin-btn-primary"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', boxShadow: 'none' }}
            onClick={() => onNavigate('/admin/inventory')}
          >
            Lập Đề Xuất Nhập Thêm Hàng
          </button>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã SKU / SP</th>
                <th>Tên Mặt Hàng</th>
                <th>Danh Mục</th>
                <th>Giá Vốn Nhập</th>
                <th>Giá Bán Niêm Yết</th>
                <th>Tồn Kho Hiện Tại</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td><code style={{ color: '#FBBF24' }}>{p.code}</code></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{formatCurrency(p.costPrice)}</td>
                  <td>{formatCurrency(p.basePrice)}</td>
                  <td>
                    <span className="admin-badge danger">
                      Chỉ còn {p.totalStock} cái
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        showToast(`Đã thêm ${p.name} vào phiếu nhập hàng dự thảo!`)
                      }}
                    >
                      Nhập Hàng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
