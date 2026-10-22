import React, { useState } from 'react'
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Package,
  Layers,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Wrench,
  ExternalLink,
} from 'lucide-react'
import {
  MOCK_DASHBOARD_STATS,
  MOCK_REVENUE_CHART,
  MOCK_CATEGORY_SHARE,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
} from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminDashboard({ onNavigate, showToast, activeRole = 'ADMIN' }) {
  const [timePeriod, setTimePeriod] = useState('MONTH') // 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [activeChartTab, setActiveChartTab] = useState('REVENUE') // 'REVENUE' | 'PROFIT'
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Filter low stock variants
  const lowStockProducts = MOCK_PRODUCTS.filter((p) => p.totalStock < 6)

  // Dynamic values based on timePeriod
  const periodStats = {
    TODAY: {
      revenue: 148650000,
      growth: 14.2,
      orders: 28,
      ordersGrowth: 8.5,
      pendingDeliveries: 4,
      lowStock: 5,
    },
    WEEK: {
      revenue: 298400000,
      growth: 16.8,
      orders: 68,
      ordersGrowth: 11.2,
      pendingDeliveries: 7,
      lowStock: 5,
    },
    MONTH: {
      revenue: MOCK_DASHBOARD_STATS.totalRevenue,
      growth: MOCK_DASHBOARD_STATS.revenueGrowth,
      orders: MOCK_DASHBOARD_STATS.totalOrders,
      ordersGrowth: MOCK_DASHBOARD_STATS.ordersGrowth,
      pendingDeliveries: MOCK_DASHBOARD_STATS.pendingDeliveries,
      lowStock: 5,
    },
    YEAR: {
      revenue: 2245000000,
      growth: 22.4,
      orders: 740,
      ordersGrowth: 19.5,
      pendingDeliveries: 12,
      lowStock: 5,
    },
  }[timePeriod]

  return (
    <div>
      {/* Page Hero with Welcome & Time Filter */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Tổng quan Kinh doanh FurniStore</h1>
          <p className="admin-page-subtitle">
            Hệ thống chỉ số bán lẻ nội thất, tiến độ điều phối đội thợ giao lắp và kiểm soát tồn kho thời gian thực.
          </p>
        </div>

        {/* Time Period Filter Tabs & Primary Actions */}
        <div className="admin-hero-actions">
          <div className="admin-chart-tabs" style={{ marginRight: '6px' }}>
            <button
              type="button"
              className={`admin-chart-tab ${timePeriod === 'TODAY' ? 'active' : ''}`}
              onClick={() => setTimePeriod('TODAY')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className={`admin-chart-tab ${timePeriod === 'WEEK' ? 'active' : ''}`}
              onClick={() => setTimePeriod('WEEK')}
            >
              Tuần này
            </button>
            <button
              type="button"
              className={`admin-chart-tab ${timePeriod === 'MONTH' ? 'active' : ''}`}
              onClick={() => setTimePeriod('MONTH')}
            >
              Tháng 10/2026
            </button>
            <button
              type="button"
              className={`admin-chart-tab ${timePeriod === 'YEAR' ? 'active' : ''}`}
              onClick={() => setTimePeriod('YEAR')}
            >
              Năm 2026
            </button>
          </div>

          {(activeRole === 'ADMIN' || activeRole === 'WAREHOUSE') && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => onNavigate('/admin/inventory')}
            >
              <Package size={15} /> Lập Phiếu GRN
            </button>
          )}

          {(activeRole === 'ADMIN' || activeRole === 'SALES') && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => onNavigate('/admin/products')}
            >
              <ShoppingBag size={15} /> Thêm Sản Phẩm
            </button>
          )}
        </div>
      </div>

      {/* Role Context Notification Banner */}
      {!bannerDismissed && (
        <div
          className="admin-role-banner warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--admin-primary-soft)',
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-text-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={18} style={{ color: 'var(--admin-primary)' }} />
            <span>
              <strong>Lịch điều phối hôm nay:</strong> Có <strong>4 đơn hàng</strong> cần sắp xếp đội thợ giao và lắp ráp căn hộ tại khu vực TP.HCM trước 17:00.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              style={{ padding: '5px 12px', fontSize: '12.5px' }}
              onClick={() => onNavigate('/admin/orders')}
            >
              Xem & Phân Công Thợ <ArrowRight size={13} />
            </button>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--admin-text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              onClick={() => setBannerDismissed(true)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 4 Hero KPI Metric Cards */}
      <div className="admin-metrics-grid">
        {/* Metric 1: Revenue */}
        <div
          className="admin-metric-card"
          onClick={() => onNavigate('/admin/reports')}
          title="Xem chi tiết doanh thu"
        >
          <div className="admin-metric-header">
            <span className="admin-metric-title">Doanh Thu Thuần</span>
            <div className="admin-metric-icon-box amber">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {formatCurrency(periodStats.revenue)}
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">
              <TrendingUp size={11} /> +{periodStats.growth}%
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>so với cùng kỳ</span>
          </div>
        </div>

        {/* Metric 2: New Orders */}
        <div
          className="admin-metric-card"
          onClick={() => onNavigate('/admin/orders')}
          title="Xem danh sách đơn đặt hàng"
        >
          <div className="admin-metric-header">
            <span className="admin-metric-title">Tổng Đơn Hàng</span>
            <div className="admin-metric-icon-box blue">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {periodStats.orders} đơn
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">
              <TrendingUp size={11} /> +{periodStats.ordersGrowth}%
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>8 đơn chờ duyệt</span>
          </div>
        </div>

        {/* Metric 3: Delivery & Installation */}
        <div
          className="admin-metric-card"
          onClick={() => onNavigate('/admin/orders')}
          title="Xem tiến độ điều phối giao lắp"
        >
          <div className="admin-metric-header">
            <span className="admin-metric-title">Đơn Cần Giao & Lắp</span>
            <div className="admin-metric-icon-box olive">
              <Truck size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {periodStats.pendingDeliveries} căn hộ
          </div>
          <div className="admin-metric-footer">
            <span
              className="admin-status-badge info"
              style={{ padding: '2px 8px', fontSize: '11px' }}
            >
              <Clock size={11} style={{ marginRight: '3px' }} /> 2 thợ đang thi công
            </span>
          </div>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div
          className="admin-metric-card"
          onClick={() => onNavigate('/admin/inventory')}
          title="Xem tồn kho biến thể"
        >
          <div className="admin-metric-header">
            <span className="admin-metric-title">Cảnh Báo Tồn Kho</span>
            <div className="admin-metric-icon-box rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums" style={{ color: 'var(--admin-danger)' }}>
            {lowStockProducts.length} biến thể
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge down">
              <ShieldAlert size={11} /> Tồn &lt; 5 cái
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>cần tạo GRN nhập</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Visual Performance */}
      <div className="admin-charts-grid">
        {/* Chart 1: Revenue vs Cost vs Profit */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h2 className="admin-chart-title">
                Diễn Biến Doanh Thu & Lợi Nhuận Gộp Nội Thất
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                Số liệu 6 tháng gần nhất (Đơn vị: Triệu VNĐ)
              </div>
            </div>

            <div className="admin-chart-tabs">
              <button
                type="button"
                className={`admin-chart-tab ${activeChartTab === 'REVENUE' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('REVENUE')}
              >
                Doanh thu vs Vốn
              </button>
              <button
                type="button"
                className={`admin-chart-tab ${activeChartTab === 'PROFIT' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('PROFIT')}
              >
                Lợi nhuận gộp
              </button>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="admin-bars-wrapper">
            {MOCK_REVENUE_CHART.map((item) => {
              const maxVal = 500000000
              const revHeight = Math.round((item.revenue / maxVal) * 140)
              const costHeight = Math.round((item.cost / maxVal) * 140)
              const profitHeight = Math.round((item.profit / maxVal) * 140)

              return (
                <div key={item.month} className="admin-bar-group" title={`${item.month}: Doanh thu ${formatCurrency(item.revenue)}`}>
                  <div className="admin-bar-track">
                    {activeChartTab === 'REVENUE' ? (
                      <>
                        <div
                          className="admin-bar-fill revenue"
                          style={{ height: `${revHeight}px` }}
                          title={`Doanh thu: ${formatCurrency(item.revenue)}`}
                        />
                        <div
                          className="admin-bar-fill cost"
                          style={{ height: `${costHeight}px` }}
                          title={`Giá vốn: ${formatCurrency(item.cost)}`}
                        />
                      </>
                    ) : (
                      <div
                        className="admin-bar-fill"
                        style={{
                          height: `${profitHeight}px`,
                          width: '24px',
                          background: 'linear-gradient(180deg, #5B6E4E 0%, #3F4D36 100%)',
                        }}
                        title={`Lãi gộp: ${formatCurrency(item.profit)}`}
                      />
                    )}
                  </div>
                  <span className="admin-bar-label">{item.month}</span>
                </div>
              )
            })}
          </div>

          {/* Chart Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              paddingTop: '14px',
              borderTop: '1px solid var(--admin-border)',
              fontSize: '12px',
              color: 'var(--admin-text-muted)',
            }}
          >
            {activeChartTab === 'REVENUE' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--admin-primary)', borderRadius: '2px' }} />
                  <span>Doanh thu thuần</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                  <span>Chi phí vốn nhập hàng (COGS)</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: '#5B6E4E', borderRadius: '2px' }} />
                <span>Lợi nhuận gộp thuần</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Category Share (Donut) */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h2 className="admin-chart-title">Doanh Thu Theo Danh Mục</h2>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Tỷ trọng %</span>
          </div>

          <div className="admin-donut-wrapper">
            {/* SVG Donut Circle */}
            <svg className="admin-donut-svg" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="var(--admin-border)"
                strokeWidth="3.2"
              />
              {/* Sofa (38%) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#8B5E3C"
                strokeWidth="3.4"
                strokeDasharray="38 62"
                strokeDashoffset="25"
              />
              {/* Bed (26%) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#D97706"
                strokeWidth="3.4"
                strokeDasharray="26 74"
                strokeDashoffset="-13"
              />
              {/* Table (19%) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#5B6E4E"
                strokeWidth="3.4"
                strokeDasharray="19 81"
                strokeDashoffset="-39"
              />
              {/* Cabinet (11%) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.4"
                strokeDasharray="11 89"
                strokeDashoffset="-58"
              />
              {/* Other (6%) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#A8A199"
                strokeWidth="3.4"
                strokeDasharray="6 94"
                strokeDashoffset="-69"
              />
            </svg>

            {/* Legend list */}
            <div className="admin-donut-legend">
              {MOCK_CATEGORY_SHARE.map((cat, idx) => {
                const colors = ['#8B5E3C', '#D97706', '#5B6E4E', '#2563EB', '#A8A199']
                return (
                  <div key={cat.category} className="admin-legend-item">
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <span
                        className="admin-legend-dot"
                        style={{ background: colors[idx % colors.length] }}
                      />
                      <span
                        style={{
                          color: 'var(--admin-text-main)',
                          fontSize: '12.5px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '160px',
                        }}
                      >
                        {cat.category}
                      </span>
                    </div>
                    <span
                      className="tabular-nums"
                      style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}
                    >
                      {cat.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Delivery Tracking */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">
            <Truck size={17} style={{ color: 'var(--admin-primary)' }} />
            Đơn Đặt Hàng & Điều Phối Giao Lắp Gần Đây
          </h2>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => onNavigate('/admin/orders')}
          >
            Xem Tất Cả 142 Đơn <ChevronRight size={14} />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Địa Chỉ Giao & Lắp Đặt</th>
                <th className="text-right">Tổng Tiền</th>
                <th className="text-center">Thanh Toán</th>
                <th className="text-center">Trạng Thái Đơn</th>
                <th>Tiến Độ & Thợ Phụ Trách</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.slice(0, 4).map((order) => {
                let statusType = 'warning'
                let statusLabel = 'Chờ xác nhận'

                if (order.orderStatus === 'COMPLETED') {
                  statusType = 'success'
                  statusLabel = 'Hoàn tất nghiệm thu'
                } else if (order.orderStatus === 'DELIVERING') {
                  statusType = 'info'
                  statusLabel = 'Đang giao & lắp'
                } else if (order.orderStatus === 'PREPARING') {
                  statusType = 'warning'
                  statusLabel = 'Đang soạn kho'
                }

                return (
                  <tr key={order.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--admin-primary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {order.orderCode}
                      </span>
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
                          maxWidth: '240px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '12.5px',
                        }}
                        title={order.address}
                      >
                        {order.address}
                      </div>
                    </td>
                    <td className="text-right tabular-nums" style={{ fontWeight: 700 }}>
                      {formatCurrency(order.finalAmount)}
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
                          ? 'Đã trả đủ'
                          : order.paymentStatus === 'DEPOSIT_50'
                          ? 'Đã cọc 50%'
                          : 'Chờ cọc'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`admin-status-badge ${statusType}`}>
                        <span className="dot" />
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px' }}>
                        <Wrench size={13} style={{ color: 'var(--admin-primary)' }} />
                        <span>{order.technician}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        {order.deliveryStatus}
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => onNavigate('/admin/orders')}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Urgent Low Stock Alerts Widget */}
      <div className="admin-panel" style={{ border: '1px solid rgba(185, 28, 28, 0.25)' }}>
        <div
          className="admin-panel-header"
          style={{ background: 'var(--admin-danger-soft)' }}
        >
          <h2 className="admin-panel-title" style={{ color: 'var(--admin-danger)' }}>
            <AlertTriangle size={17} />
            Cảnh Báo Biến Thể Tồn Kho Thấp Dưới Ngưỡng An Toàn (&lt; 5 chiếc)
          </h2>
          <button
            className="admin-btn admin-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
              boxShadow: 'none',
              fontSize: '12.5px',
            }}
            onClick={() => onNavigate('/admin/inventory')}
          >
            <Package size={14} /> Lập Phiếu Nhập Kho GRN
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã SKU / Biến Thể</th>
                <th>Tên Sản Phẩm</th>
                <th>Phân Loại Danh Mục</th>
                <th className="text-right">Giá Vốn Nhập</th>
                <th className="text-right">Giá Bán Niêm Yết</th>
                <th className="text-center">Mức Tồn Thực Tế</th>
                <th className="text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code
                      style={{
                        color: 'var(--admin-primary)',
                        fontWeight: 700,
                        background: 'var(--admin-surface-hover)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {p.code}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                      {p.description}
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className="text-right tabular-nums">
                    {formatCurrency(p.costPrice)}
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatCurrency(p.basePrice)}
                  </td>
                  <td className="text-center">
                    <span className="admin-status-badge danger">
                      <span className="dot" />
                      Chỉ còn {p.totalStock} cái
                    </span>
                    <div className="admin-stock-bar" style={{ margin: '4px auto 0' }}>
                      <div
                        className="admin-stock-fill low"
                        style={{ width: `${(p.totalStock / 20) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        showToast(`Đã thêm mã "${p.code}" vào bản nháp phiếu nhập kho GRN!`)
                        onNavigate('/admin/inventory')
                      }}
                    >
                      Nhập Thêm
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
