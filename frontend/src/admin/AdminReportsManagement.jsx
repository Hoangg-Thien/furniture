import { useState, useEffect } from 'react'
import { adminErrorMessage } from './adminDisplay'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { productImageUrl } from '../lib/productImages'
import { formatProductUnit } from '../lib/productUnits.js'
import {
  Download,
  Flame,
  Layers,
  Package,
  PackageCheck,
  PackageX,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'

function reportDate(now, daysAgo = 0) {
  const date = new Date(now + 7 * 60 * 60 * 1000)
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

const reportPeriods = {
  quarter: 'Theo quý', month: 'Theo tháng', year: 'Theo năm',
  today: 'Hôm nay', '7days': '7 ngày qua', '30days': '30 ngày qua', custom: 'Tùy chọn ngày'
}

function currentReportFilters() {
  const [year, month] = reportDate(Date.now()).split('-')
  return { preset: 'quarter', year, month, quarter: String(Math.ceil(Number(month) / 3)) }
}

function reportRange(filters, now = Date.now()) {
  const { preset, year, month, quarter } = filters
  if (preset === 'custom') return { preset, fromDate: filters.fromDate, toDate: filters.toDate, label: 'Khoảng ngày tùy chọn' }

  const toDate = reportDate(now)
  const rollingStarts = {
    today: toDate,
    '7days': reportDate(now, 6),
    '30days': reportDate(now, 29)
  }
  if (rollingStarts[preset]) return { preset, fromDate: rollingStarts[preset], toDate, label: reportPeriods[preset] }
  if (!/^\d{4}$/.test(year) || Number(year) < 1900) return null

  const calendarPeriods = {
    quarter: { first: Number(quarter) * 3 - 2, last: Number(quarter) * 3, label: `Quý ${quarter}/${year}` },
    month: { first: Number(month), last: Number(month), label: `Tháng ${Number(month)}/${year}` },
    year: { first: 1, last: 12, label: `Năm ${year}` }
  }
  const { first, last, label } = calendarPeriods[preset]
  const fromDate = `${year}-${String(first).padStart(2, '0')}-01`
  const periodEnd = new Date(Date.UTC(Number(year), last, 0)).toISOString().slice(0, 10)
  return { preset, fromDate, toDate: fromDate <= toDate && toDate < periodEnd ? toDate : periodEnd, label }
}

function groupCalendarTrend(points, fromDate, toDate, monthsPerGroup) {
  if (!points.length) return points
  const firstMonth = Number(fromDate.slice(5, 7))
  const lastMonth = Number(toDate.slice(5, 7))
  const groups = Array.from({ length: Math.ceil((lastMonth - firstMonth + 1) / monthsPerGroup) }, (_, index) => ({
    dateLabel: monthsPerGroup === 3 ? `Quý ${index + 1}` : `Tháng ${firstMonth + index}`,
    salesRevenue: 0, importCost: 0, ordersCount: 0
  }))

  for (const point of points) {
    const month = Number(String(point.dateLabel ?? '').split('/')[1])
    const group = groups[Math.floor((month - firstMonth) / monthsPerGroup)]
    if (!group) continue
    group.salesRevenue += Number(point.salesRevenue || 0)
    group.importCost += Number(point.importCost || 0)
    group.ordersCount += Number(point.ordersCount || 0)
  }
  return groups
}

const displayReportDate = date => date.split('-').reverse().join('/')

export default function AdminReportsManagement() {
  // Bộ lọc thời gian
  const [filters, setFilters] = useState(currentReportFilters)
  const [{ preset: dateRangePreset, fromDate, toDate, label: reportLabel }, setDateRange] = useState(() => reportRange(filters))
  const draftRange = reportRange(filters)
  const invalidRange = !draftRange?.fromDate || !draftRange.toDate || draftRange.fromDate > draftRange.toDate
  const showsYear = ['quarter', 'month', 'year'].includes(filters.preset)

  // Trạng thái dữ liệu
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [overview, setOverview] = useState(null)
  const [revenueTrend, setRevenueTrend] = useState([])
  const [categoryShare, setCategoryShare] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topProductLimit, setTopProductLimit] = useState(5)
  const [showAllTopProducts, setShowAllTopProducts] = useState(false)
  const [topPage, setTopPage] = useState(0)
  const visibleTopProducts = showAllTopProducts ? topProducts : topProducts.slice(0, topProductLimit)
  const topPageCount = Math.max(1, Math.ceil(visibleTopProducts.length / 10))
  const [deadStock, setDeadStock] = useState([])
  const [deadStockPage, setDeadStockPage] = useState(0)
  const deadStockPageCount = Math.max(1, Math.ceil(deadStock.length / 10))
  const [voucherReport, setVoucherReport] = useState([])
  const [activeTab, setActiveTab] = useState('topSelling') // 'topSelling' | 'deadStock' | 'vouchers'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null)
  const [exporting, setExporting] = useState(false)

  const updateFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }))

  function applyReportFilters(event) {
    event.preventDefault()
    if (invalidRange) return
    setDateRange(reportRange(filters))
    setAttempt(value => value + 1)
  }

  // Tải dữ liệu từ Backend
  useEffect(() => {
    const controller = new AbortController()
    async function loadData() {
      setLoading(true)
      setError('')
      setHoveredTrendPoint(null)
      try {
        const params = `?fromDate=${fromDate}&toDate=${toDate}`
        // Older running backends interpret limit=0 as the default five rows.
        const paths = [`overview${params}`, `revenue-trend${params}`, `category-share${params}`,
          'top-products?limit=2147483647', 'dead-stock?limit=2147483647', 'voucher-efficiency']
        const [ovRes, trendRes, catRes, topRes, deadRes, voucherRes] = await Promise.all(paths.map(async path => {
          const response = await fetch(`${getApiBaseUrl()}/api/admin/statistics/${path}`, {
            headers: getApiHeaders(), signal: controller.signal
          })
          if (!response.ok) throw new Error('Không tải được báo cáo. Vui lòng kiểm tra kết nối và quyền truy cập rồi thử lại.')
          return response.json()
        }))
        if (!ovRes || typeof ovRes !== 'object' || !Number.isFinite(ovRes.totalRevenue)
            || ![trendRes, catRes, topRes, deadRes, voucherRes].every(Array.isArray)) {
          throw new Error('Dữ liệu báo cáo không hợp lệ. Vui lòng thử lại.')
        }
        if (controller.signal.aborted) return
        setOverview(ovRes)
        setRevenueTrend(trendRes)
        setCategoryShare(catRes)
        setTopProducts(topRes)
        setTopPage(0)
        setDeadStock(deadRes)
        setDeadStockPage(0)
        setVoucherReport(voucherRes)
      } catch (err) {
        if (!controller.signal.aborted) setError(adminErrorMessage(err, 'Không thể kết nối máy chủ.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadData()
    return () => controller.abort()
  }, [fromDate, toDate, attempt])

  // Xuất file Excel
  const handleExportExcel = async () => {
    if (invalidRange) return
    try {
      setExporting(true)
      const res = await fetch(`${getApiBaseUrl()}/api/admin/statistics/export-excel?fromDate=${fromDate}&toDate=${toDate}`, { headers: getApiHeaders() })
      if (!res.ok) throw new Error('Không thể tạo tệp báo cáo Excel')
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
      alert('Không thể xuất báo cáo Excel. ' + adminErrorMessage(err))
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
  const isQuarter = dateRangePreset === 'quarter'
  const isYear = dateRangePreset === 'year'
  const groupedTrend = isQuarter || isYear
  const trendPoints = groupedTrend ? groupCalendarTrend(revenueTrend, fromDate, toDate, isYear ? 3 : 1) : revenueTrend
  const maxRevenue = Math.max(...trendPoints.map((point) => Math.max(point.salesRevenue || 0, point.importCost || 0)), 1000000)

  // Màu sắc cho danh mục tròn
  const categoryPalette = ['#0F766E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#64748B']

  return (
    <div className="admin-reports-view" aria-busy={loading}>
      {/* Header trang & bộ lọc thời gian */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Bán Hàng & Dòng Tiền &gt; <span>Thống kê & Báo cáo</span>
          </div>
          <h1 className="admin-page-title">Trung tâm phân tích & báo cáo doanh thu</h1>
        </div>

        {/* Nút hành động */}
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setAttempt(value => value + 1)}
            disabled={loading || invalidRange}
            title="Làm mới số liệu"
          >
            <RefreshCw size={16} className={loading ? 'admin-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            className="admin-btn admin-btn-accent"
            onClick={handleExportExcel}
            disabled={exporting || loading || invalidRange || !!error}
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất tệp...' : 'Xuất báo cáo Excel'}</span>
          </button>
        </div>
      </div>

      {/* Thanh công cụ chọn khoảng thời gian */}
      <form className="admin-reports-filter-bar" aria-label="Bộ lọc kỳ báo cáo" onSubmit={applyReportFilters}>
        <div className="admin-report-period-controls">
          <div className="admin-report-period-field">
            <label htmlFor="reports-period">Kỳ báo cáo</label>
            <select id="reports-period" value={filters.preset} onChange={event => {
              const preset = event.target.value
              setFilters(current => ({ ...current, preset,
                ...(preset === 'custom' && { fromDate: current.fromDate ?? fromDate, toDate: current.toDate ?? toDate })
              }))
            }}>
              {Object.entries(reportPeriods).map(([preset, label]) => <option key={preset} value={preset}>{label}</option>)}
            </select>
          </div>
          {showsYear && <div className="admin-report-period-field">
            <label htmlFor="reports-year">Năm</label>
            <input id="reports-year" className="admin-report-year" type="number" min="1900" max="9999" step="1" required value={filters.year} onChange={event => updateFilter('year', event.target.value)} />
          </div>}
          {filters.preset === 'quarter' && <div className="admin-report-period-field">
            <label htmlFor="reports-quarter">Quý</label>
            <select id="reports-quarter" value={filters.quarter} onChange={event => updateFilter('quarter', event.target.value)}>
              {[1, 2, 3, 4].map(quarter => <option key={quarter} value={quarter}>Quý {quarter}</option>)}
            </select>
          </div>}
          {filters.preset === 'month' && <div className="admin-report-period-field">
            <label htmlFor="reports-month">Tháng</label>
            <select id="reports-month" value={filters.month} onChange={event => updateFilter('month', event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                <option key={month} value={String(month).padStart(2, '0')}>Tháng {month}</option>
              ))}
            </select>
          </div>}
          {filters.preset === 'custom' && <>
            <div className="admin-report-period-field">
              <label htmlFor="reports-from-date">Từ ngày</label>
              <input id="reports-from-date" type="date" required max={filters.toDate} value={filters.fromDate} onChange={event => updateFilter('fromDate', event.target.value)} />
            </div>
            <div className="admin-report-period-field">
              <label htmlFor="reports-to-date">Đến ngày</label>
              <input id="reports-to-date" type="date" required min={filters.fromDate} value={filters.toDate} onChange={event => updateFilter('toDate', event.target.value)} />
            </div>
          </>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={invalidRange}>Xem báo cáo</button>
        </div>
        {invalidRange && <p className="admin-report-period-error" role="alert">{showsYear
          ? 'Vui lòng nhập năm từ 1900 đến 9999.'
          : 'Vui lòng chọn đủ ngày và đảm bảo ngày bắt đầu không sau ngày kết thúc.'}</p>}
        <div className="admin-report-period-caption" role="status">
          <div>
            <span>Kỳ đang xem</span>
            <strong>{reportLabel}</strong>
          </div>
          <span>{displayReportDate(fromDate)} – {displayReportDate(toDate)}</span>
        </div>
      </form>

      {loading ? <p role="status">Đang tải báo cáo...</p>
        : error ? <div role="alert"><p>{error}</p><button className="admin-btn admin-btn-secondary" onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div>
        : <>
      <div className="admin-reports-charts-row">
        <section className="admin-reports-summary" aria-label="Thông tin thống kê">
          <div className="admin-kpi-grid">
            {/* Doanh thu */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-title">Doanh thu thực tế</span>
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
                <span className="admin-kpi-title">Chênh lệch thu / nhập hàng</span>
                <div className="admin-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="admin-kpi-value" style={{ color: '#0F766E' }}>
                {formatCurrency(overview?.grossProfit)}
              </div>
              <div className="admin-kpi-sub">
                Chi phí nhập kho trong kỳ: <span>{formatCurrency(overview?.totalPurchaseCost)}</span>
              </div>
            </div>

            {/* Đơn hàng hoàn thành */}
            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-title">Đơn hàng hoàn tất</span>
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
                <span className="admin-kpi-title">Sản phẩm đã bán</span>
                <div className="admin-kpi-icon" style={{ backgroundColor: '#FDF2F8', color: '#DB2777' }}>
                  <Package size={20} />
                </div>
              </div>
              <div className="admin-kpi-value">{overview?.totalItemsSold ?? 0} món</div>
              <div className="admin-kpi-sub">
                Cảnh báo tồn kho thấp: <span style={{ color: '#EF4444' }}>{overview?.lowStockProductsCount ?? 0} mã</span>
              </div>
            </div>
          </div>
          <div className="admin-chart-box admin-donut-box">
            <div className="admin-chart-header">
              <div>
                <h3 className="admin-chart-title">Cơ cấu doanh thu theo loại nội thất</h3>
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
                              <span>{formatCurrency(cat.totalRevenue)}</span>
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
        </section>
        <section className="admin-chart-box admin-reports-trend" aria-labelledby="reports-trend-title">
          <div className="admin-chart-header">
            <div>
              <h3 className="admin-chart-title" id="reports-trend-title">Doanh thu và chi phí nhập kho</h3>
              <p className="admin-chart-desc">{isYear ? 'Tổng hợp theo quý trong năm' : isQuarter ? 'Tổng hợp theo tháng trong quý' : 'Tổng hợp theo ngày'}, dựa trên ngày thanh toán và ngày lập phiếu nhập kho.</p>
            </div>
            <div className="admin-chart-legend">
              <span className="admin-legend-item">
                <span className="admin-legend-bullet admin-legend-revenue"></span> Doanh thu
              </span>
              <span className="admin-legend-item">
                <span className="admin-legend-bullet admin-legend-cost"></span> Chi phí nhập
              </span>
            </div>
          </div>

          <div className="admin-trend-chart-container">
            {trendPoints.length === 0 ? (
              <div className="admin-chart-empty">Không có dữ liệu giao dịch trong khoảng thời gian này</div>
            ) : (
              <div className={`admin-bars-wrapper${groupedTrend ? ' admin-bars-calendar' : ''}`}>
                {trendPoints.map((point, idx) => {
                  const revHeight = Math.max((Number(point.salesRevenue || 0) / maxRevenue) * 100, 0)
                  const costHeight = Math.max((Number(point.importCost || 0) / maxRevenue) * 100, 0)

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
                          style={{ height: `${revHeight}%` }}
                          title={`Doanh thu: ${formatCurrency(point.salesRevenue)}`}
                        ></div>
                        <div
                          className="admin-bar admin-bar-cost"
                          style={{ height: `${costHeight}%` }}
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
                  <span>{formatCurrency(hoveredTrendPoint.salesRevenue)}</span>
                </div>
                <div className="admin-tooltip-row">
                  <span>Chi phí nhập:</span>
                  <span style={{ color: '#F43F5E' }}>{formatCurrency(hoveredTrendPoint.importCost)}</span>
                </div>
                <div className="admin-tooltip-row">
                  <span>Số đơn hàng:</span>
                  <span>{hoveredTrendPoint.ordersCount || 0} đơn</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Vùng Báo Cáo Chuyên Sâu dạng Tabs */}
      <div className="admin-reports-detail-section">
        <p>Số liệu bán chạy và hiệu quả voucher được tính tích lũy. Tồn kho lấy theo số lượng hiện tại.</p>
        <div className="admin-reports-tab-nav">
          <button
            className={`admin-report-tab ${activeTab === 'topSelling' ? 'active' : ''}`}
            onClick={() => setActiveTab('topSelling')}
          >
            <Flame size={16} />
            <span>Sản phẩm bán chạy</span>
          </button>
          <button
            className={`admin-report-tab ${activeTab === 'deadStock' ? 'active' : ''}`}
            onClick={() => setActiveTab('deadStock')}
          >
            <PackageX size={16} />
            <span>Hàng tồn lâu ngày</span>
          </button>
          <button
            className={`admin-report-tab ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <Tag size={16} />
            <span>Hiệu quả khuyến mãi & voucher</span>
          </button>
        </div>

        {/* Nội dung Tab 1: Top bán chạy */}
        {activeTab === 'topSelling' && (
          <div className="admin-report-tab-body">
            <div className="admin-report-product-toolbar">
              <div className="admin-report-product-caption">
                <strong>{showAllTopProducts ? 'Tất cả sản phẩm' : `${topProductLimit} sản phẩm bán chạy nhất`}</strong>
                <span>{showAllTopProducts ? 'Bao gồm sản phẩm chưa phát sinh bán hàng' : 'Xếp hạng theo số lượng đã bán'}</span>
              </div>
              <div className="admin-report-product-options" role="group" aria-label="Số sản phẩm hiển thị">
                {[5, 10, 20].map(limit => <button key={limit} type="button"
                  aria-pressed={!showAllTopProducts && topProductLimit === limit}
                  onClick={() => { setTopProductLimit(limit); setShowAllTopProducts(false); setTopPage(0) }}>{limit} sản phẩm</button>)}
                <button type="button" aria-pressed={showAllTopProducts} onClick={() => { setShowAllTopProducts(true); setTopPage(0) }}>Tất cả</button>
              </div>
            </div>
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
                  {visibleTopProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        Chưa có dữ liệu sản phẩm bán ra
                      </td>
                    </tr>
                  ) : (
                    visibleTopProducts.slice(topPage * 10, (topPage + 1) * 10).map((p, index) => (
                      <tr key={p.productId || index}>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-rank-badge rank-${topPage * 10 + index + 1}`}>{topPage * 10 + index + 1}</span>
                        </td>
                        <td>
                          <div className="admin-product-cell">
                            {p.imageUrl ? (
                              <img src={productImageUrl(p.imageUrl)} alt={p.productName} className="admin-product-thumb" />
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
                        <td style={{ textAlign: 'center' }}>{formatProductUnit(p.unit)}</td>
                        <td style={{ textAlign: 'right', color: '#0F766E' }}>
                          {p.soldQuantity ?? 0} {formatProductUnit(p.unit)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(p.totalRevenue)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={p.currentStock <= 5 ? 'admin-badge admin-badge-danger' : 'admin-badge admin-badge-success'}>
                            {p.currentStock ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="admin-badge admin-badge-primary">{p.soldQuantity > 0 ? 'Đã bán' : 'Chưa bán'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'topSelling' && visibleTopProducts.length > 0 && <nav aria-label="Phân trang sản phẩm báo cáo" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 16 }}>
          <span>{visibleTopProducts.length} sản phẩm · Trang {topPage + 1}/{topPageCount}</span>
          <button type="button" className="admin-btn admin-btn-outline" disabled={topPage === 0 || loading} onClick={() => setTopPage(value => value - 1)}>Trước</button>
          <button type="button" className="admin-btn admin-btn-outline" disabled={topPage + 1 >= topPageCount || loading} onClick={() => setTopPage(value => value + 1)}>Sau</button>
        </nav>}

        {/* Nội dung Tab 2: Hàng tồn chậm */}
        {activeTab === 'deadStock' && (
          <div className="admin-report-tab-body">
            <div className="admin-report-product-toolbar">
              <div className="admin-report-product-caption">
                <span>{deadStock.length} sản phẩm còn tồn kho · {deadStock.filter(item => item.daysSinceLastSold == null).length} sản phẩm chưa từng bán</span>
                <span>Hiển thị toàn bộ sản phẩm đang bán còn tồn kho, ưu tiên sản phẩm chưa từng bán.</span>
              </div>
            </div>
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
                        Không có sản phẩm đang bán còn tồn kho.
                      </td>
                    </tr>
                  ) : (
                    deadStock.slice(deadStockPage * 10, (deadStockPage + 1) * 10).map((item, idx) => {
                      const totalDeadValue = (item.currentStock || 0) * Number(item.sellingPrice || 0)
                      return (
                        <tr key={item.productId || idx}>
                          <td>
                            <div className="admin-product-cell">
                              {item.imageUrl ? (
                                <img src={productImageUrl(item.imageUrl)} alt={item.productName} className="admin-product-thumb" />
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
                          <td style={{ textAlign: 'center' }}>{formatProductUnit(item.unit)}</td>
                          <td style={{ textAlign: 'center', color: '#EF4444' }}>
                            {item.currentStock}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(item.sellingPrice)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#D97706' }}>
                            {formatCurrency(totalDeadValue)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="admin-badge admin-badge-warning">
                              {item.daysSinceLastSold == null ? 'Chưa từng bán' : `${item.daysSinceLastSold} ngày`}
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

        {activeTab === 'deadStock' && deadStock.length > 0 && <nav aria-label="Phân trang hàng tồn ứ đọng" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 16 }}>
          <span>{deadStock.length} sản phẩm · Trang {deadStockPage + 1}/{deadStockPageCount}</span>
          <button type="button" className="admin-btn admin-btn-outline" disabled={deadStockPage === 0 || loading} onClick={() => setDeadStockPage(value => value - 1)}>Trước</button>
          <button type="button" className="admin-btn admin-btn-outline" disabled={deadStockPage + 1 >= deadStockPageCount || loading} onClick={() => setDeadStockPage(value => value + 1)}>Sau</button>
        </nav>}

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
                          <td style={{ textAlign: 'center', color: '#0F766E' }}>
                            {v.discountPercent}%
                          </td>
                          <td style={{ textAlign: 'center' }}>{used}</td>
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
                          <td style={{ textAlign: 'right', color: '#EF4444' }}>
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
      </>}
    </div>
  )
}
