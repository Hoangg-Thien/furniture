import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Users
} from 'lucide-react'

export default function AdminDashboard({ onNavigateModule }) {
  const [liveStats, setLiveStats] = useState(null)

  useEffect(() => {
    fetch('/api/admin/statistics/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setLiveStats(data)
      })
      .catch(() => {})
  }, [])

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const kpis = [
    {
      title: 'Doanh thu tích lũy',
      value: liveStats?.totalRevenue !== undefined ? formatCurrency(liveStats.totalRevenue) : '452.800.000 ₫',
      sub: liveStats?.revenueGrowthPercent !== undefined 
        ? `${liveStats.revenueGrowthPercent >= 0 ? '+' : ''}${liveStats.revenueGrowthPercent}% so với kỳ trước`
        : '+14.2% so với tháng trước',
      positive: liveStats?.revenueGrowthPercent !== undefined ? liveStats.revenueGrowthPercent >= 0 : true,
      icon: DollarSign,
      bg: '#FEF3C7',
      color: '#D97706',
      targetModule: 'reports'
    },
    {
      title: 'Đơn hàng hoàn tất',
      value: liveStats?.completedOrdersCount !== undefined ? `${liveStats.completedOrdersCount} đơn` : '12 đơn',
      sub: liveStats?.orderCompletionRate !== undefined 
        ? `Tỉ lệ hoàn thành: ${liveStats.orderCompletionRate}%` 
        : 'Cần nhân viên xác nhận ngay',
      positive: true,
      icon: ShoppingCart,
      bg: '#EFF6FF',
      color: '#3B82F6',
      targetModule: 'orders'
    },
    {
      title: 'Sản phẩm đã xuất bán',
      value: liveStats?.totalItemsSold !== undefined ? `${liveStats.totalItemsSold} món` : '184 món',
      sub: liveStats?.grossProfit !== undefined 
        ? `Lợi nhuận gộp: ${formatCurrency(liveStats.grossProfit)}` 
        : 'Sofa chiếm 42% doanh số',
      positive: true,
      icon: Package,
      bg: '#ECFDF5',
      color: '#10B981',
      targetModule: 'products'
    },
    {
      title: 'Cảnh báo kho tồn thấp',
      value: liveStats?.lowStockProductsCount !== undefined ? `${String(liveStats.lowStockProductsCount).padStart(2, '0')} sản phẩm` : '05 sản phẩm',
      sub: 'Số lượng trong kho < 5 cái',
      positive: false,
      icon: AlertTriangle,
      bg: '#FEF2F2',
      color: '#EF4444',
      targetModule: 'products'
    }
  ]

  const recentOrders = [
    { id: '#101', customer: 'Nguyễn Văn An', phone: '0901 234 567', items: 'Sofa Da Ý Chữ L + Bàn Trà', total: '28.500.000 ₫', status: 'PENDING', statusLabel: 'Chờ duyệt', time: '10 phút trước' },
    { id: '#100', customer: 'Trần Thị Mai', phone: '0912 888 999', items: 'Bộ Bàn Ăn Gỗ Sồi 6 Ghế', total: '14.800.000 ₫', status: 'CONFIRMED', statusLabel: 'Đã duyệt', time: '2 giờ trước' },
    { id: '#099', customer: 'Lê Hoàng Long', phone: '0988 111 222', items: 'Giường Ngủ Bọc Nỉ King', total: '18.200.000 ₫', status: 'COMPLETED', statusLabel: 'Đã giao', time: 'Hôm qua' },
  ]

  const lowStockItems = [
    { name: 'Bàn Ăn Gỗ Sồi Bắc Âu 6G', category: 'Bàn ghế phòng ăn', stock: 2, price: '14.800.000 ₫' },
    { name: 'Tủ Quần Áo Cánh Kính Đèn LED', category: 'Nội thất phòng ngủ', stock: 3, price: '22.000.000 ₫' },
    { name: 'Kệ Tivi Gỗ Óc Chó Tự Nhiên', category: 'Nội thất phòng khách', stock: 4, price: '9.500.000 ₫' },
  ]

  return (
    <div className="admin-dashboard-view">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Hệ thống quản trị &gt; <span>Tổng quan hoạt động</span>
          </div>
          <h1 className="admin-page-title">Bảng Điều Khiển Kinh Doanh Showroom</h1>
        </div>
        <div className="admin-header-actions">
          <button 
            className="admin-btn admin-btn-accent"
            onClick={() => onNavigateModule('products')}
          >
            <Plus size={16} />
            <span>Thêm sản phẩm</span>
          </button>
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => onNavigateModule('orders')}
          >
            <ShoppingCart size={16} />
            <span>Xem đơn đặt hàng</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        {kpis.map((kpi, idx) => {
          const IconComp = kpi.icon
          return (
            <div 
              key={idx} 
              className="admin-kpi-card" 
              style={{ cursor: kpi.targetModule ? 'pointer' : 'default' }}
              onClick={() => kpi.targetModule && onNavigateModule(kpi.targetModule)}
            >
              <div className="admin-kpi-info">
                <h4>{kpi.title}</h4>
                <div className="admin-kpi-value">{kpi.value}</div>
                <div className={`admin-kpi-sub ${kpi.positive ? 'positive' : ''}`}>{kpi.sub}</div>
              </div>
              <div className="admin-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                <IconComp size={22} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Orders & Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Orders */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
              Đơn Đặt Hàng Mới Nhất
            </h3>
            <button 
              className="admin-btn admin-btn-outline" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => onNavigateModule('orders')}
            >
              Xem tất cả đơn
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm nội thất</th>
                  <th>Tổng thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>{order.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customer}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>{order.phone}</div>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.items}
                    </td>
                    <td style={{ fontWeight: 700 }}>{order.total}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${order.status === 'PENDING' ? 'warning' : order.status === 'CONFIRMED' ? 'info' : 'success'}`}>
                        {order.statusLabel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock alert box */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>Sản Phẩm Sắp Hết Kho</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowStockItems.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '12px', 
                  border: '1px solid var(--admin-border)', 
                  borderRadius: 'var(--admin-radius-sm)', 
                  background: 'var(--admin-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{item.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.9rem' }}>Còn: {item.stock} cái</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-accent)', fontWeight: 600 }}>{item.price}</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="admin-btn admin-btn-outline" 
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            onClick={() => onNavigateModule('suppliers')}
          >
            <span>Nhập hàng từ nhà cung cấp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
