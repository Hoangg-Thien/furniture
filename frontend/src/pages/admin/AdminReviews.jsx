import React, { useState } from 'react'
import {
  Star,
  Search,
  CheckCircle,
  EyeOff,
  Trash2,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react'
import { MOCK_REVIEWS } from './adminMockData'

export default function AdminReviews({ showToast }) {
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [searchTerm, setSearchTerm] = useState('')
  const [starFilter, setStarFilter] = useState('ALL')

  const filteredReviews = reviews.filter((r) => {
    const matchStar = starFilter === 'ALL' || r.rating === Number(starFilter)
    const matchSearch =
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStar && matchSearch
  })

  function handleToggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED'
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    )
    showToast(`Đã ${nextStatus === 'APPROVED' ? 'hiển thị' : 'ẩn'} đánh giá sản phẩm!`)
  }

  function handleDelete(id) {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) {
      setReviews(reviews.filter((r) => r.id !== id))
      showToast('Đã xóa đánh giá.')
    }
  }

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Đánh giá & Phản hồi Khách hàng</h1>
          <p className="admin-page-subtitle">
            Kiểm duyệt bình luận, đánh giá chất lượng sản phẩm nội thất và trải nghiệm lắp ráp tại gia.
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm nội dung đánh giá, tên sản phẩm, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="admin-filter-select"
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 Sao ★★★★★</option>
              <option value="4">4 Sao ★★★★☆</option>
              <option value="3">3 Sao ★★★☆☆</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản Phẩm Đánh Giá</th>
                <th>Khách Hàng</th>
                <th>Điểm Đánh Giá</th>
                <th>Nội Dung Nhận Xét</th>
                <th>Ngày Gửi</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{r.productName}</div>
                  </td>
                  <td>
                    <div style={{ color: '#F59E0B', fontWeight: 500 }}>{r.customerName}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#FBBF24' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < r.rating ? '#FBBF24' : 'none'}
                          stroke={i < r.rating ? '#FBBF24' : 'rgba(255,255,255,0.2)'}
                        />
                      ))}
                      <span style={{ fontSize: '12px', fontWeight: 700, marginLeft: '4px' }}>{r.rating}.0</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '320px', fontSize: '13px', color: 'var(--admin-text-main)', lineHeight: 1.4 }}>
                      "{r.comment}"
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{r.date}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${r.status === 'APPROVED' ? 'success' : 'neutral'}`}>
                      {r.status === 'APPROVED' ? 'Đã Duyệt Hiển Thị' : 'Đang Ẩn'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px' }}
                        title={r.status === 'APPROVED' ? 'Ẩn đánh giá' : 'Hiển thị đánh giá'}
                        onClick={() => handleToggleStatus(r.id, r.status)}
                      >
                        {r.status === 'APPROVED' ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 10px', color: '#EF4444' }}
                        title="Xóa đánh giá"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
