import React, { useState, useEffect } from 'react'
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
  RefreshCw,
  Database,
} from 'lucide-react'
import {
  MOCK_DASHBOARD_STATS,
  MOCK_REVENUE_CHART,
  MOCK_CATEGORY_SHARE,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
} from './adminMockData'
import { fetchDashboardOverview, fetchDashboardPeriodStats } from '../../lib/dashboard'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0)

export default function AdminDashboard({ onNavigate, showToast, activeRole = 'ADMIN' }) {
  const [timePeriod, setTimePeriod] = useState('MONTH') // 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [activeChartTab, setActiveChartTab] = useState('REVENUE') // 'REVENUE' | 'PROFIT'
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [overviewData, setOverviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadOverview = async () => {
    setRefreshing(true)
    const { data } = await fetchDashboardOverview()
    if (data) {
      setOverviewData(data)
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadOverview()
  }, [])

  // Dynamic values based on timePeriod (lấy dữ liệu thật từ Supabase nếu có, fallback về mock)
  const periodStats = overviewData?.periodStats?.[timePeriod] || {
    revenue: overviewData?.stats?.totalRevenue ?? MOCK_DASHBOARD_STATS.totalRevenue,
    growth: overviewData?.stats?.revenueGrowth ?? MOCK_DASHBOARD_STATS.revenueGrowth,
    orders: overviewData?.stats?.totalOrders ?? MOCK_DASHBOARD_STATS.totalOrders,
    ordersGrowth: overviewData?.stats?.ordersGrowth ?? MOCK_DASHBOARD_STATS.ordersGrowth,
    pendingDeliveries: overviewData?.stats?.pendingDeliveries ?? MOCK_DASHBOARD_STATS.pendingDeliveries,
    lowStock: overviewData?.stats?.lowStockAlerts ?? 5,
  }

  // Dữ liệu biểu đồ 6 tháng (Doanh thu - Giá vốn - Lãi gộp)
  const chartItems = overviewData?.revenueChart?.length
    ? overviewData.revenueChart
    : MOCK_REVENUE_CHART

  // Tỷ trọng doanh thu theo danh mục
  const categoryShareList = overviewData?.categoryShare?.length
    ? overviewData.categoryShare
    : MOCK_CATEGORY_SHARE

  // Đơn hàng gần đây
  const recentOrdersList = overviewData?.recentOrders?.length
    ? overviewData.recentOrders
    : MOCK_ORDERS

  // Biến thể tồn kho thấp
  const lowStockProducts = overviewData?.lowStockProducts?.length
    ? overviewData.lowStockProducts
    : MOCK_PRODUCTS.filter((p) => p.totalStock < 6)

  // Tính maxVal cho biểu đồ cột động
  const maxVal = Math.max(
    ...chartItems.map((i) => Math.max(Number(i.revenue || 0), Number(i.cost || 0), Number(i.profit || 0))),
    100000000
  )

  return (
    <div>
      {/* Page Hero with Welcome & Time Filter */}
      <div className="admin-page-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>Tổng quan Kinh doanh FurniStore</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22C55E',
                fontSize: '11.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
              Dữ liệu Supabase Live
            </span>
          </div>
          <p className="admin-page-subtitle">
            Hệ thống chỉ số bán lẻ nội thất, tiến độ điều phối đội thợ giao lắp và kiểm soát tồn kho thời gian thực từ Database Supabase.
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

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={loadOverview}
            disabled={refreshing}
            title="Đồng bộ lại số liệu mới nhất từ database"
          >
            <RefreshCw size={14} className={refreshing ? 'admin-spin' : ''} />
            {refreshing ? 'Đang nạp...' : 'Làm mới'}
          </button>

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
              <strong>Lịch điều phối hôm nay:</strong> Có <strong>{periodStats.pendingDeliveries || 4} đơn hàng</strong> cần sắp xếp đội thợ giao và lắp ráp căn hộ tại khu vực TP.HCM.
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
            <span className={`trend-badge ${periodStats.growth >= 0 ? 'up' : 'down'}`}>
              <TrendingUp size={11} /> {periodStats.growth >= 0 ? '+' : ''}{periodStats.growth}%
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
            <span className={`trend-badge ${periodStats.ordersGrowth >= 0 ? 'up' : 'down'}`}>
              <TrendingUp size={11} /> {periodStats.ordersGrowth >= 0 ? '+' : ''}{periodStats.ordersGrowth}%
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>
              {overviewData?.stats?.totalCustomers ? `${overviewData.stats.totalCustomers} khách hàng` : '8 đơn chờ duyệt'}
            </span>
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
              <Clock size={11} style={{ marginRight: '3px' }} /> Đang xử lý điều phối
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
            {lowStockProducts.length} sản phẩm
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge down">
              <ShieldAlert size={11} /> Mức tồn thấp
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
                Số liệu theo dõi từ Database Supabase (Đơn vị: VNĐ)
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
            {chartItems.map((item, idx) => {
              const revHeight = Math.max(Math.round(((item.revenue || 0) / maxVal) * 140), 6)
              const costHeight = Math.max(Math.round(((item.cost || 0) / maxVal) * 140), 4)
              const profitHeight = Math.max(Math.round(((item.profit || 0) / maxVal) * 140), 6)

              return (
                <div key={item.month || idx} className="admin-bar-group" title={`${item.month}: Doanh thu ${formatCurrency(item.revenue)}`}>
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
            {/* SVG Donut Circle - render hoàn toàn động */}
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
              {(() => {
                const colors = ['#8B5E3C', '#D97706', '#5B6E4E', '#2563EB', '#A8A199', '#7C3AED', '#EC4899']
                let cumulativeOffset = 25
                return categoryShareList.map((cat, idx) => {
                  const pct = Math.max(Number(cat.percentage || 0), 1)
                  const dash = `${pct} ${100 - pct}`
                  const offset = cumulativeOffset
                  cumulativeOffset -= pct

                  return (
                    <circle
                      key={cat.category || idx}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="3.4"
                      strokeDasharray={dash}
                      strokeDashoffset={offset}
                    />
                  )
                })
              })()}
            </svg>

            {/* Legend list */}
            <div className="admin-donut-legend">
              {categoryShareList.map((cat, idx) => {
                const colors = ['#8B5E3C', '#D97706', '#5B6E4E', '#2563EB', '#A8A199', '#7C3AED', '#EC4899']
                return (
                  <div key={cat.category || idx} className="admin-legend-item">
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
                        title={cat.category}
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
            Đơn Đặt Hàng & Điều Phối Giao Lắp Gần Đây (Supabase Database)
          </h2>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => onNavigate('/admin/orders')}
          >
            Xem Tất Cả Đơn Hàng <ChevronRight size={14} />
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
              {recentOrdersList.slice(0, 5).map((order) => {
                let statusType = 'warning'
                let statusLabel = 'Chờ xác nhận'

                const st = (order.orderStatus || '').toUpperCase()
                if (st === 'COMPLETED') {
                  statusType = 'success'
                  statusLabel = 'Hoàn tất nghiệm thu'
                } else if (st === 'DELIVERING' || st === 'CONFIRMED') {
                  statusType = 'info'
                  statusLabel = 'Đã duyệt / Giao & lắp'
                } else if (st === 'CANCELLED') {
                  statusType = 'danger'
                  statusLabel = 'Đã hủy'
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
                        {order.orderCode || `ORD-${String(order.id).padStart(4, '0')}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName || 'Khách hàng'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {order.phone || 'Chưa có SĐT'}
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
                        {order.address || 'Giao tại TP. Hồ Chí Minh'}
                      </div>
                    </td>
                    <td className="text-right tabular-nums" style={{ fontWeight: 700 }}>
                      {formatCurrency(order.finalAmount || order.totalAmount)}
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
                          : 'Chờ thanh toán'}
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
                        <span>{order.technician || 'Đội thợ FurniCare'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        {order.deliveryStatus || 'Chờ điều phối'}
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
            Cảnh Báo Sản Phẩm Tồn Kho Thấp Nhất (Theo Database Supabase)
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
                <th>Mã SKU / Mã SP</th>
                <th>Tên Sản Phẩm</th>
                <th>Phân Loại Danh Mục</th>
                <th className="text-right">Giá Vốn Nhập (Ước Tính)</th>
                <th className="text-right">Giá Bán Niêm Yết</th>
                <th className="text-center">Mức Tồn Thực Tế</th>
                <th className="text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => {
                const stock = p.totalStock ?? p.quantity ?? 0
                return (
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
                        {p.code || `FURN-SP-${String(p.id).padStart(2, '0')}`}
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
                      {formatCurrency(p.costPrice || (p.selling_price ? Math.round(p.selling_price * 0.65) : 0))}
                    </td>
                    <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                      {formatCurrency(p.basePrice || p.selling_price)}
                    </td>
                    <td className="text-center">
                      <span className={`admin-status-badge ${stock <= 10 ? 'danger' : 'warning'}`}>
                        <span className="dot" />
                        Chỉ còn {stock} cái
                      </span>
                      <div className="admin-stock-bar" style={{ margin: '4px auto 0' }}>
                        <div
                          className="admin-stock-fill low"
                          style={{ width: `${Math.min((stock / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => {
                          showToast(`Đã thêm mã "${p.code || p.name}" vào bản nháp phiếu nhập kho GRN!`)
                          onNavigate('/admin/inventory')
                        }}
                      >
                        Nhập Thêm
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
