import { useState, useEffect } from 'react'
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Flame,
  Layers,
  LineChart,
  Package,
  PackageCheck,
  PackageX,
  PieChart,
  RefreshCw,
  Search,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet
} from 'lucide-react'

export default function AdminReportsManagement({ currentUser }) {
  // Bộ lọc thời gian
  const [dateRangePreset, setDateRangePreset] = useState('30days')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])

  // Trạng thái dữ liệu
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState(null)
  const [revenueTrend, setRevenueTrend] = useState([])
  const [categoryShare, setCategoryShare] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [deadStock, setDeadStock] = useState([])
  const [voucherReport, setVoucherReport] = useState([])
  const [activeTab, setActiveTab] = useState('topSelling') // 'topSelling' | 'deadStock' | 'vouchers'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Đổi preset
  const handlePresetChange = (preset) => {
    setDateRangePreset(preset)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    setToDate(todayStr)

    if (preset === 'today') {
      setFromDate(todayStr)
    } else if (preset === '7days') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      setFromDate(d.toISOString().split('T')[0])
    } else if (preset === '30days') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      setFromDate(d.toISOString().split('T')[0])
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setFromDate(firstDay.toISOString().split('T')[0])
    }
  }

  // Tải dữ liệu từ Backend
  const loadData = async () => {
    setLoading(true)
    try {
      const params = `?fromDate=${fromDate}&toDate=${toDate}`
      
      const [ovRes, trendRes, catRes, topRes, deadRes, voucherRes] = await Promise.all([
        fetch(`/api/admin/statistics/overview${params}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/admin/statistics/revenue-trend${params}`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/admin/statistics/category-share${params}`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/admin/statistics/top-products?limit=6`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/admin/statistics/dead-stock?limit=6`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/admin/statistics/voucher-efficiency`).then((r) => r.ok ? r.json() : [])
      ])

      if (ovRes) setOverview(ovRes)
      if (Array.isArray(trendRes)) setRevenueTrend(trendRes)
      if (Array.isArray(catRes)) setCategoryShare(catRes)
      if (Array.isArray(topRes)) setTopProducts(topRes)
      if (Array.isArray(deadRes)) setDeadStock(deadRes)
      if (Array.isArray(voucherRes)) setVoucherReport(voucherRes)
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fromDate, toDate])

  // Xuất file Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true)
      const res = await fetch(`/api/admin/statistics/export-excel?fromDate=${fromDate}&toDate=${toDate}`)
      if (!res.ok) throw new Error('Không thể tạo file báo cáo Excel')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bao_Cao_Doanh_Thu_${fromDate}_${toDate}.xls`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Có lỗi xảy ra khi xuất file Excel: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  // Định dạng tiền tệ VND
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Tính toán biểu đồ cột xu hướng
  const maxRevenue = Math.max(...revenueTrend.map((p) => Math.max(p.salesRevenue || 0, p.importCost || 0)), 1000000)

  // Màu sắc cho danh mục tròn
  const categoryPalette = ['#0F766E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#64748B']

  return (
    <div className="admin-reports-view">
      {/* Header trang & bộ lọc thời gian */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Bán Hàng & Dòng Tiền &gt; <span>Thống kê & Báo cáo</span>
          </div>
          <h1 className="admin-page-title">Trung Tâm Phân Tích & Báo Cáo Doanh Thu</h1>
        </div>

        {/* Nút hành động */}
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Làm mới số liệu"
          >
            <RefreshCw size={16} className={loading ? 'admin-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            className="admin-btn admin-btn-accent"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất file...' : 'Xuất Báo Cáo Excel'}</span>
          </button>
        </div>
      </div>

      {/* Thanh công cụ chọn khoảng thời gian */}
      <div className="admin-reports-filter-bar">
        <div className="admin-filter-presets">
          <button
            className={`admin-preset-btn ${dateRangePreset === 'today' ? 'active' : ''}`}
            onClick={() => handlePresetChange('today')}
          >
            Hôm nay
          </button>
          <button
            className={`admin-preset-btn ${dateRangePreset === '7days' ? 'active' : ''}`}
            onClick={() => handlePresetChange('7days')}
          >
            7 ngày qua
          </button>
          <button
            className={`admin-preset-btn ${dateRangePreset === '30days' ? 'active' : ''}`}
            onClick={() => handlePresetChange('30days')}
          >
            30 ngày qua
          </button>
          <button
            className={`admin-preset-btn ${dateRangePreset === 'month' ? 'active' : ''}`}
            onClick={() => handlePresetChange('month')}
          >
            Tháng này
          </button>
        </div>

        <div className="admin-custom-dates">
          <div className="admin-date-input-wrap">
            <span className="admin-date-label">Từ ngày:</span>
            <input
              type="date"
              className="admin-input-date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setDateRangePreset('custom')
              }}
            />
          </div>
          <div className="admin-date-input-wrap">
            <span className="admin-date-label">Đến ngày:</span>
            <input
              type="date"
              className="admin-input-date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setDateRangePreset('custom')
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid thẻ KPI số liệu */}
      <div className="admin-kpi-grid">
        {/* Doanh thu */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-title">Doanh Thu Thu Thực Tế</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#ECFDF5', color: '#0F766E' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="admin-kpi-value">{formatCurrency(overview?.totalRevenue)}</div>
          <div className="admin-kpi-sub">
            <span className={overview?.revenueGrowthPercent >= 0 ? 'admin-kpi-trend positive' : 'admin-kpi-trend negative'}>
              {overview?.revenueGrowthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {overview?.revenueGrowthPercent >= 0 ? `+${overview?.revenueGrowthPercent}%` : `${overview?.revenueGrowthPercent}%`}
            </span>
            <span style={{ marginLeft: 6 }}>so với kỳ trước</span>
          </div>
        </div>

        {/* Lợi nhuận gộp */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-title">Lợi Nhuận Gộp (Tạm Tính)</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#0F766E' }}>
            {formatCurrency(overview?.grossProfit)}
          </div>
          <div className="admin-kpi-sub">
            Giá vốn nhập: <strong>{formatCurrency(overview?.totalPurchaseCost)}</strong>
          </div>
        </div>

        {/* Đơn hàng hoàn thành */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-title">Đơn Hàng Hoàn Tất</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="admin-kpi-value">{overview?.completedOrdersCount ?? 0} đơn</div>
          <div className="admin-kpi-sub">
            Tỉ lệ hoàn thành: <strong>{overview?.orderCompletionRate ?? 0}%</strong>
          </div>
        </div>

        {/* Sản phẩm đã bán & cảnh báo tồn */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-title">Sản Phẩm Đã Bán</span>
            <div className="admin-kpi-icon" style={{ backgroundColor: '#FDF2F8', color: '#DB2777' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="admin-kpi-value">{overview?.totalItemsSold ?? 0} món</div>
          <div className="admin-kpi-sub">
            Cảnh báo tồn kho thấp: <strong style={{ color: '#EF4444' }}>{overview?.lowStockProductsCount ?? 0} mã</strong>
          </div>
        </div>
      </div>

      {/* Vùng biểu đồ đôi: Biểu đồ xu hướng và Cơ cấu Danh mục */}
      <div className="admin-reports-charts-row">
        {/* Biểu đồ xu hướng Doanh thu vs Vốn */}
        <div className="admin-chart-box">
          <div className="admin-chart-header">
            <div>
              <h3 className="admin-chart-title">Xu Hướng Doanh Thu & Giá Vốn Hàng Ngày</h3>
              <p className="admin-chart-desc">So sánh doanh thu bán ra với chi phí nhập kho theo ngày</p>
            </div>
            <div className="admin-chart-legend">
              <span className="admin-legend-item">
                <span className="admin-legend-bullet" style={{ backgroundColor: '#0F766E' }}></span> Doanh thu
              </span>
              <span className="admin-legend-item">
                <span className="admin-legend-bullet" style={{ backgroundColor: '#F43F5E' }}></span> Chi phí nhập
              </span>
            </div>
          </div>

          <div className="admin-trend-chart-container">
            {revenueTrend.length === 0 ? (
              <div className="admin-chart-empty">Không có dữ liệu giao dịch trong khoảng thời gian này</div>
            ) : (
              <div className="admin-bars-wrapper">
                {revenueTrend.map((point, idx) => {
                  const revHeight = Math.max((Number(point.salesRevenue || 0) / maxRevenue) * 180, 4)
                  const costHeight = Math.max((Number(point.importCost || 0) / maxRevenue) * 180, 4)

                  return (
                    <div
                      key={idx}
                      className="admin-trend-bar-group"
                      onMouseEnter={() => setHoveredTrendPoint(point)}
                      onMouseLeave={() => setHoveredTrendPoint(null)}
                    >
                      <div className="admin-bars-pair">
                        <div
                          className="admin-bar admin-bar-revenue"
                          style={{ height: `${revHeight}px` }}
                          title={`Doanh thu: ${formatCurrency(point.salesRevenue)}`}
                        ></div>
                        <div
                          className="admin-bar admin-bar-cost"
                          style={{ height: `${costHeight}px` }}
                          title={`Chi phí nhập: ${formatCurrency(point.importCost)}`}
                        ></div>
                      </div>
                      <span className="admin-bar-label">{point.dateLabel}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tooltip khi hover */}
            {hoveredTrendPoint && (
              <div className="admin-trend-tooltip">
                <div className="admin-tooltip-date">{hoveredTrendPoint.dateLabel}</div>
                <div className="admin-tooltip-row">
                  <span>Doanh thu:</span>
                  <strong>{formatCurrency(hoveredTrendPoint.salesRevenue)}</strong>
                </div>
                <div className="admin-tooltip-row">
                  <span>Chi phí nhập:</span>
                  <strong style={{ color: '#F43F5E' }}>{formatCurrency(hoveredTrendPoint.importCost)}</strong>
                </div>
                <div className="admin-tooltip-row">
                  <span>Số đơn hàng:</span>
                  <span>{hoveredTrendPoint.ordersCount || 0} đơn</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Biểu đồ tròn Cơ cấu Doanh thu theo Danh mục */}
        <div className="admin-chart-box admin-donut-box">
          <div className="admin-chart-header">
            <div>
              <h3 className="admin-chart-title">Cơ Cấu Doanh Thu Theo Loại Nội Thất</h3>
              <p className="admin-chart-desc">Tỉ lệ đóng góp doanh số giữa các dòng sản phẩm</p>
            </div>
            <Layers size={18} color="#64748B" />
          </div>

          <div className="admin-donut-content">
            {categoryShare.length === 0 ? (
              <div className="admin-chart-empty">Chưa có số liệu danh mục</div>
            ) : (
              <>
                <div className="admin-donut-progress-list">
                  {categoryShare.map((cat, idx) => {
                    const color = categoryPalette[idx % categoryPalette.length]
                    return (
                      <div key={cat.categoryId || idx} className="admin-cat-share-item">
                        <div className="admin-cat-share-head">
                          <div className="admin-cat-share-name">
                            <span className="admin-legend-bullet" style={{ backgroundColor: color }}></span>
                            <span>{cat.categoryName}</span>
                          </div>
                          <div className="admin-cat-share-vals">
                            <strong>{formatCurrency(cat.totalRevenue)}</strong>
                            <span className="admin-cat-share-pct">{cat.percentage}%</span>
                          </div>
                        </div>
                        <div className="admin-cat-progress-track">
                          <div
                            className="admin-cat-progress-fill"
                            style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: color }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vùng Báo Cáo Chuyên Sâu dạng Tabs */}
      <div className="admin-reports-detail-section">
        <div className="admin-reports-tab-nav">
          <button
            className={`admin-report-tab ${activeTab === 'topSelling' ? 'active' : ''}`}
            onClick={() => setActiveTab('topSelling')}
          >
            <Flame size={16} />
            <span>Top Sản Phẩm Bán Chạy</span>
          </button>
          <button
            className={`admin-report-tab ${activeTab === 'deadStock' ? 'active' : ''}`}
            onClick={() => setActiveTab('deadStock')}
          >
            <PackageX size={16} />
            <span>Hàng Tồn Ứ Đọng (Dead Stock)</span>
          </button>
          <button
            className={`admin-report-tab ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <Tag size={16} />
            <span>Hiệu Quả Khuyến Mãi & Voucher</span>
          </button>
        </div>

        {/* Nội dung Tab 1: Top bán chạy */}
        {activeTab === 'topSelling' && (
          <div className="admin-report-tab-body">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Hạng</th>
                    <th>Sản phẩm nội thất</th>
                    <th style={{ textAlign: 'center' }}>Đơn vị tính</th>
                    <th style={{ textAlign: 'right' }}>Số lượng đã bán</th>
                    <th style={{ textAlign: 'right' }}>Doanh số tích lũy</th>
                    <th style={{ textAlign: 'center' }}>Tồn kho hiện tại</th>
                    <th style={{ textAlign: 'center' }}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        Chưa có dữ liệu sản phẩm bán ra
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, index) => (
                      <tr key={p.productId || index}>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-rank-badge rank-${index + 1}`}>{index + 1}</span>
                        </td>
                        <td>
                          <div className="admin-product-cell">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.productName} className="admin-product-thumb" />
                            ) : (
                              <div className="admin-product-placeholder">
                                <Package size={18} />
                              </div>
                            )}
                            <div>
                              <div className="admin-product-cell-name">{p.productName}</div>
                              <div className="admin-product-cell-id">Mã SP: #{p.productId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{p.unit || 'Chiếc'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0F766E' }}>
                          {p.soldQuantity} {p.unit || ''}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(p.totalRevenue)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={p.currentStock <= 5 ? 'admin-badge admin-badge-danger' : 'admin-badge admin-badge-success'}>
                            {p.currentStock ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="admin-badge admin-badge-primary">Hot Seller</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nội dung Tab 2: Hàng tồn chậm */}
        {activeTab === 'deadStock' && (
          <div className="admin-report-tab-body">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm ứ đọng</th>
                    <th style={{ textAlign: 'center' }}>Đơn vị tính</th>
                    <th style={{ textAlign: 'center' }}>Tồn kho</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá niêm yết</th>
                    <th style={{ textAlign: 'right' }}>Giá trị tồn vốn đọng</th>
                    <th style={{ textAlign: 'center' }}>Số ngày chưa bán</th>
                    <th style={{ textAlign: 'center' }}>Khuyến nghị đề xuất</th>
                  </tr>
                </thead>
                <tbody>
                  {deadStock.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        Kho hàng đang lưu thông rất tốt, không có hàng tồn ứ đọng trên 60 ngày!
                      </td>
                    </tr>
                  ) : (
                    deadStock.map((item, idx) => {
                      const totalDeadValue = (item.currentStock || 0) * Number(item.sellingPrice || 0)
                      return (
                        <tr key={item.productId || idx}>
                          <td>
                            <div className="admin-product-cell">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="admin-product-thumb" />
                              ) : (
                                <div className="admin-product-placeholder">
                                  <Package size={18} />
                                </div>
                              )}
                              <div>
                                <div className="admin-product-cell-name">{item.productName}</div>
                                <div className="admin-product-cell-id">Mã SP: #{item.productId}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.unit || 'Chiếc'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#EF4444' }}>
                            {item.currentStock}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(item.sellingPrice)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#D97706' }}>
                            {formatCurrency(totalDeadValue)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="admin-badge admin-badge-warning">
                              {item.daysSinceLastSold ? `${item.daysSinceLastSold} ngày` : 'Chưa từng bán'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="admin-badge admin-badge-accent">
                              Tạo Voucher giảm giá 15% - 20%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nội dung Tab 3: Hiệu quả khuyến mãi */}
        {activeTab === 'vouchers' && (
          <div className="admin-report-tab-body">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Voucher</th>
                    <th>Chương trình khuyến mãi</th>
                    <th style={{ textAlign: 'center' }}>Mức chiết khấu</th>
                    <th style={{ textAlign: 'center' }}>Đã sử dụng</th>
                    <th style={{ textAlign: 'center' }}>Tổng phát hành</th>
                    <th style={{ textAlign: 'center' }}>Tỉ lệ kích hoạt</th>
                    <th style={{ textAlign: 'right' }}>Tổng ngân sách đã giảm</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherReport.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        Chưa có voucher nào phát sinh lượt sử dụng
                      </td>
                    </tr>
                  ) : (
                    voucherReport.map((v, idx) => {
                      const used = v.usedQuantity || 0
                      const total = v.totalQuantity || 1
                      const pct = Math.round((used / total) * 100)
                      return (
                        <tr key={v.voucherId || idx}>
                          <td>
                            <span className="admin-voucher-code-tag">{v.voucherCode}</span>
                          </td>
                          <td>
                            <strong>{v.programName}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#0F766E' }}>
                            {v.discountPercent}%
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{used}</td>
                          <td style={{ textAlign: 'center' }}>{v.totalQuantity}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="admin-cat-progress-track" style={{ width: 100, margin: '0 auto 4px' }}>
                              <div
                                className="admin-cat-progress-fill"
                                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#3B82F6' }}
                              ></div>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{pct}%</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                            {formatCurrency(v.totalDiscountGiven)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
