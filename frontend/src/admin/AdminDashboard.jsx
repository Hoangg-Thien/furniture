import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Package, RefreshCw, ShoppingCart, Wallet } from 'lucide-react'
import AdminDataTable from './AdminDataTable'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import './AdminDashboard.css'

const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const statuses = {
  PENDING: ['Chờ duyệt', 'warning'],
  CONFIRMED: ['Đã duyệt', 'info'],
  SHIPPING: ['Đang giao', 'info'],
  COMPLETED: ['Hoàn tất', 'success'],
  CANCELLED: ['Đã hủy', 'danger'],
}

export default function AdminDashboard({ onNavigateModule }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setState({ loading: true, error: '', data: null })
      try {
        const today = new Date(Date.now() + 7 * 60 * 60 * 1000)
        const toDate = today.toISOString().slice(0, 10)
        today.setUTCDate(today.getUTCDate() - 29)
        const fromDate = today.toISOString().slice(0, 10)
        const paths = [
          `/api/admin/statistics/overview?fromDate=${fromDate}&toDate=${toDate}`,
          '/api/admin/orders?page=0&size=5',
          '/api/admin/products?lowStock=true&status=ACTIVE&page=0&size=5',
        ]
        const [overview, orders, products] = await Promise.all(paths.map(async path => {
          const response = await fetch(`${getApiBaseUrl()}${path}`, { headers: getApiHeaders(), signal: controller.signal })
          if (!response.ok) throw new Error('Không tải được Dashboard. Vui lòng kiểm tra kết nối và quyền truy cập rồi thử lại.')
          return response.json()
        }))
        if (!overview || !['totalRevenue', 'completedOrdersCount', 'totalItemsSold', 'lowStockProductsCount']
          .every(key => Number.isFinite(overview[key]) && overview[key] >= 0)
          || !Array.isArray(orders?.content) || !Array.isArray(products?.content)) {
          throw new Error('Dữ liệu Dashboard không hợp lệ. Vui lòng thử lại.')
        }
        if (!controller.signal.aborted) setState({ loading: false, error: '', data: { overview, orders: orders.content, products: products.content, fromDate, toDate } })
      } catch (error) {
        if (!controller.signal.aborted) setState({ loading: false, error: error.message || 'Không thể kết nối máy chủ.', data: null })
      }
    }
    load()
    return () => controller.abort()
  }, [attempt])

  const { loading, error, data } = state
  const metrics = data ? [
    { title: 'Doanh thu đã thu', value: money(data.overview.totalRevenue), note: 'Từ hóa đơn đã thanh toán', icon: Wallet, module: 'reports' },
    { title: 'Đơn hàng hoàn tất', value: `${data.overview.completedOrdersCount} đơn`, note: 'Đơn đặt trong 30 ngày gần nhất', icon: ShoppingCart, module: 'orders' },
    { title: 'Sản phẩm đã bán', value: `${data.overview.totalItemsSold} món`, note: 'Từ các đơn đã hoàn tất trong kỳ', icon: Package, module: 'reports' },
    { title: 'Tồn kho thấp', value: `${data.overview.lowStockProductsCount} sản phẩm`, note: 'Đang bán, tồn kho hiện tại dưới 5, gồm cả đã hết', icon: AlertTriangle, module: 'products' },
  ] : []

  const columns = [
    { key: 'id', label: 'Mã đơn', render: id => <strong>#{id}</strong> },
    { key: 'customerName', label: 'Khách hàng', render: (name, order) => <div><strong>{name}</strong><div className="dashboard-muted">{order.phone || 'Chưa có số điện thoại'}</div></div> },
    { key: 'totalItemsCount', label: 'Số món' },
    { key: 'totalAmount', label: 'Tổng thanh toán', render: money },
    { key: 'status', label: 'Trạng thái', render: status => {
      const [label, color] = statuses[status] || [status, 'info']
      return <span className={`admin-badge admin-badge-${color}`}>{label}</span>
    } },
    { key: 'orderDate', label: 'Ngày đặt (GMT+7)', render: date => date?.replace('T', ' ').slice(0, 16) || '—' },
  ]

  return (
    <div className="admin-dashboard-view" aria-busy={loading}>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">Hệ thống quản trị &gt; <span>Tổng quan hoạt động</span></div>
          <h1 className="admin-page-title">Tổng quan kinh doanh</h1>
          <p className="admin-page-subtitle">Theo dõi doanh thu, đơn hàng và tồn kho của FuniStore.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-btn admin-btn-outline" disabled={loading} onClick={() => setAttempt(value => value + 1)}>
            <RefreshCw size={16} className={loading ? 'admin-spin' : ''} /> Làm mới
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => onNavigateModule('reports')}>
            Xem báo cáo <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {loading && <div className="admin-card" role="status">Đang tải Dashboard...</div>}
      {error && <div className="admin-card" role="alert">
        <p>{error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
      </div>}

      {data && <>
        <p className="dashboard-muted">30 ngày gần nhất: {data.fromDate.split('-').reverse().join('/')} – {data.toDate.split('-').reverse().join('/')}. Cảnh báo kho thể hiện số lượng hiện tại.</p>
        <div className="admin-stats-grid">
          {metrics.map(({ title, value, note, icon: Icon, module }) => (
            <button type="button" className="admin-stat-card dashboard-metric" key={title} onClick={() => onNavigateModule(module)}>
              <div className="stat-card-header"><span className="stat-card-title">{title}</span><Icon size={19} /></div>
              <div className="stat-card-value">{value}</div>
              <div className="stat-card-footer">{note}</div>
            </button>
          ))}
        </div>

        <div className="dashboard-grid">
          <section className="admin-card" aria-labelledby="dashboard-orders-title">
            <div className="dashboard-panel-heading">
              <h2 id="dashboard-orders-title">Đơn hàng mới nhất</h2>
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => onNavigateModule('orders')}>Xem tất cả đơn</button>
            </div>
            <p className="dashboard-muted">5 đơn mới nhất, bao gồm khách có tài khoản và khách vãng lai.</p>
            <div className="dashboard-orders-table" role="region" aria-label="Bảng đơn hàng mới nhất, cuộn ngang để xem đầy đủ" tabIndex={0}>
              <AdminDataTable columns={columns} data={data.orders} emptyMessage="Chưa có đơn hàng nào." />
            </div>
          </section>

          <section className="admin-card" aria-labelledby="dashboard-stock-title">
            <div className="dashboard-panel-heading">
              <h2 id="dashboard-stock-title"><AlertTriangle size={18} /> Sản phẩm tồn kho thấp</h2>
            </div>
            <p className="dashboard-muted">Tối đa 5 sản phẩm đang bán có tồn kho dưới 5.</p>
            {data.products.length === 0 ? <p className="dashboard-empty">Không có sản phẩm đang bán nào tồn dưới 5.</p> : (
              <ul className="dashboard-stock-list">
                {data.products.map(product => <li key={product.id}>
                  <div><strong>{product.name}</strong><span className="dashboard-muted">{product.categoryName || 'Chưa có danh mục'}</span></div>
                  <div className="dashboard-stock-quantity"><strong>{product.quantity === 0 ? 'Đã hết' : `Còn ${product.quantity} ${product.unit || 'món'}`}</strong><span>{money(product.sellingPrice)}</span></div>
                </li>)}
              </ul>
            )}
            <div className="dashboard-stock-actions">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => onNavigateModule('products')}>Quản lý sản phẩm</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => onNavigateModule('suppliers')}>Nhập hàng</button>
            </div>
          </section>
        </div>
      </>}
    </div>
  )
}
