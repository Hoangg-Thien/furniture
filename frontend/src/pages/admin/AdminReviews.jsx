import React, { useState } from 'react'
import {
  Star,
  Search,
  CheckCircle,
  EyeOff,
  Trash2,
  MessageSquare,
  ThumbsUp,
  Image as ImageIcon,
  X,
  Send,
  Eye,
  Filter,
} from 'lucide-react'
import { MOCK_REVIEWS } from './adminMockData'

export default function AdminReviews({ showToast, activeRole = 'ADMIN' }) {
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [searchTerm, setSearchTerm] = useState('')
  const [starFilter, setStarFilter] = useState('ALL')
  const [selectedPhoto, setSelectedPhoto] = useState(null) // Lightbox zoom photo
  const [replyingReview, setReplyingReview] = useState(null)
  const [replyText, setReplyText] = useState('')

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
    showToast(`Đã ${nextStatus === 'APPROVED' ? 'cho phép hiển thị' : 'ẩn'} đánh giá sản phẩm trên sàn bán lẻ!`)
  }

  function handleDelete(id) {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) {
      setReviews(reviews.filter((r) => r.id !== id))
      showToast('Đã xóa đánh giá.')
    }
  }

  function handleSaveReply(reviewId) {
    if (!replyText.trim()) return
    setReviews(
      reviews.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              storeReply: {
                author: 'FurniStore Chăm Sóc Khách Hàng',
                date: 'Hôm nay',
                content: replyText.trim(),
              },
            }
          : r
      )
    )
    setReplyingReview(null)
    setReplyText('')
    showToast('Đã gửi phản hồi chính thức của cửa hàng tới khách hàng!')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Đánh Giá & Phản Hồi Khách Hàng</h1>
          <p className="admin-page-subtitle">
            Kiểm duyệt chất lượng sản phẩm nội thất, hình ảnh nghiệm thu thực tế tại gia và tương tác chăm sóc khách hàng.
          </p>
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
                placeholder="Tìm nội dung đánh giá, tên sản phẩm, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                className="admin-filter-select"
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
              >
                <option value="ALL">Tất cả số sao</option>
                <option value="5">5 Sao ★★★★★</option>
                <option value="4">4 Sao ★★★★☆</option>
                <option value="3">3 Sao ★★★☆☆</option>
                <option value="2">1 - 2 Sao ★☆☆☆☆</option>
              </select>

              {(searchTerm || starFilter !== 'ALL') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSearchTerm('')
                    setStarFilter('ALL')
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Sản Phẩm Đánh Giá</th>
                <th>Khách Hàng & Thời Gian</th>
                <th className="text-center">Điểm Đánh Giá</th>
                <th>Nội Dung Nhận Xét & Ảnh Feedback</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r) => {
                const isApproved = r.status === 'APPROVED'

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                        {r.productName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                        Mã đơn liên kết: #DH-202610
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                        {r.date}
                      </div>
                    </td>

                    <td className="text-center">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i < r.rating ? '#F59E0B' : 'transparent'}
                            stroke="#F59E0B"
                          />
                        ))}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', lineHeight: 1.4, color: 'var(--admin-text-main)' }}>
                        "{r.comment}"
                      </div>

                      {/* Photo Feedback Thumbnails */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid var(--admin-border)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedPhoto('/images/sofa_goc_chu_L.jpg')}
                          title="Click xem ảnh thực tế tại nhà khách"
                        >
                          <img
                            src="/images/sofa_goc_chu_L.jpg"
                            alt="Feedback"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </div>

                      {/* Store Reply View */}
                      {r.storeReply && (
                        <div
                          style={{
                            marginTop: '8px',
                            background: 'var(--admin-bg)',
                            borderLeft: '3px solid var(--admin-primary)',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          <strong style={{ color: 'var(--admin-primary)' }}>Phản hồi từ FurniStore:</strong> {r.storeReply.content}
                        </div>
                      )}
                    </td>

                    <td className="text-center">
                      <span
                        className={`admin-status-badge ${isApproved ? 'success' : 'neutral'}`}
                      >
                        <span className="dot" />
                        {isApproved ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                    </td>

                    <td className="text-center">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          onClick={() => {
                            setReplyingReview(r)
                            setReplyText(r.storeReply?.content || '')
                          }}
                          title="Phản hồi khách hàng"
                        >
                          <MessageSquare size={13} /> Trả Lời
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11.5px',
                            color: isApproved ? 'var(--admin-warning)' : '#10B981',
                          }}
                          onClick={() => handleToggleStatus(r.id, r.status)}
                          title={isApproved ? 'Ẩn khỏi website' : 'Cho phép hiển thị'}
                        >
                          {isApproved ? 'Ẩn' : 'Hiện'}
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          onClick={() => handleDelete(r.id)}
                          title="Xóa đánh giá"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div
            style={{
              maxWidth: '680px',
              background: 'transparent',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="admin-modal-close"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#FFF',
              }}
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={20} />
            </button>
            <img
              src={selectedPhoto}
              alt="Zoomed feedback"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}

      {/* Modal: Store Official Reply */}
      {replyingReview && (
        <div className="admin-modal-backdrop" onClick={() => setReplyingReview(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Phản Hồi Đánh Giá Khách Hàng</h3>
              <button className="admin-modal-close" onClick={() => setReplyingReview(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
                <div>Khách hàng: <strong>{replyingReview.customerName}</strong></div>
                <div>Sản phẩm: <strong>{replyingReview.productName}</strong></div>
                <div style={{ marginTop: '4px', color: 'var(--admin-text-muted)' }}>"{replyingReview.comment}"</div>
              </div>

              <div className="admin-form-group">
                <label>Nội Dung Phản Hồi Của Cửa Hàng (FurniStore CSKH):</label>
                <textarea
                  rows="4"
                  placeholder="Cảm ơn quý khách đã tin tưởng và ủng hộ sản phẩm nội thất FurniStore..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setReplyingReview(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => handleSaveReply(replyingReview.id)}
              >
                <Send size={14} /> Gửi Phản Hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
