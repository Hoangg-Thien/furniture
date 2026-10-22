import React from 'react'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  PieChart,
  ArrowUpRight,
  Download,
  Calendar,
} from 'lucide-react'
import {
  MOCK_REVENUE_CHART,
  MOCK_CATEGORY_SHARE,
  MOCK_PRODUCTS,
  MOCK_DASHBOARD_STATS,
} from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminReports({ showToast }) {
  const total6MonthRevenue = MOCK_REVENUE_CHART.reduce((s, i) => s + i.revenue, 0)
  const total6MonthCost = MOCK_REVENUE_CHART.reduce((s, i) => s + i.cost, 0)
  const total6MonthProfit = MOCK_REVENUE_CHART.reduce((s, i) => s + i.profit, 0)

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Báo cáo & Thống kê Tài chính Nội thất</h1>
          <p className="admin-page-subtitle">
            Phân tích chuyên sâu doanh thu, chi phí giá vốn (COGS), lợi nhuận gộp và vòng quay hàng tồn kho.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => showToast('Đang kết xuất báo cáo tài chính dạng Excel (XLSX)...')}
          >
            <Download size={16} /> Xuất Báo Cáo Excel
          </button>
        </div>
      </div>

      {/* Highlights */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Doanh Thu 6 Tháng Gần Nhất</span>
            <div className="admin-metric-icon-box amber"><DollarSign size={20} /></div>
          </div>
          <div className="admin-metric-value">{formatCurrency(total6MonthRevenue)}</div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">+18.4% tăng trưởng</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Chi Phí Vốn Nhập Kho (COGS)</span>
            <div className="admin-metric-icon-box blue"><Package size={20} /></div>
          </div>
          <div className="admin-metric-value">{formatCurrency(total6MonthCost)}</div>
          <div className="admin-metric-footer">
            <span style={{ color: 'var(--admin-text-dim)' }}>Chiếm 56% doanh thu</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Lợi Nhuận Gộp Ước Tính</span>
            <div className="admin-metric-icon-box emerald"><TrendingUp size={20} /></div>
          </div>
          <div className="admin-metric-value">{formatCurrency(total6MonthProfit)}</div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">Biên lợi nhuận gộp ~44%</span>
          </div>
        </div>
      </div>

      {/* Detailed Monthly Table */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">
            <BarChart3 size={18} style={{ color: '#F59E0B' }} />
            Bảng Kê Chi Tiết Doanh Thu & Lợi Nhuận Theo Từng Tháng
          </h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tháng Thống Kê</th>
                <th>Doanh Thu Bán Lẻ</th>
                <th>Chi Phí Nhập Hàng</th>
                <th>Lợi Nhuận Gộp</th>
                <th>Biên Lợi Nhuận (%)</th>
                <th>Đánh Giá Hiệu Suất</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REVENUE_CHART.map((m) => {
                const margin = Math.round((m.profit / m.revenue) * 100)
                return (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600, color: '#FFF' }}>{m.month} / 2026</td>
                    <td style={{ fontWeight: 700, color: '#FBBF24' }}>{formatCurrency(m.revenue)}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{formatCurrency(m.cost)}</td>
                    <td style={{ fontWeight: 700, color: '#34D399' }}>{formatCurrency(m.profit)}</td>
                    <td>
                      <span className="admin-badge success">{margin}%</span>
                    </td>
                    <td>
                      <span className="admin-badge info">Đạt Chỉ Tiêu Doanh Số</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">
            <Layers size={18} style={{ color: '#60A5FA' }} />
            Top 5 Mẫu Nội Thất Bán Chạy Nhất FurniStore
          </h2>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Xếp Hạng</th>
                <th>Sản Phẩm</th>
                <th>Nhóm Danh Mục</th>
                <th>Giá Bán</th>
                <th>Số Lượng Bán Ra</th>
                <th>Doanh Thu Đóng Góp</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.slice(0, 5).map((p, idx) => (
                <tr key={p.id}>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : 'rgba(255,255,255,0.08)',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}>
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#FFF' }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td style={{ fontWeight: 700, color: '#FBBF24' }}>{formatCurrency(p.basePrice)}</td>
                  <td><strong>{32 - idx * 4}</strong> bộ</td>
                  <td style={{ fontWeight: 700, color: '#34D399' }}>
                    {formatCurrency(p.basePrice * (32 - idx * 4))}
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
