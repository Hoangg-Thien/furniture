import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * =====================================================================
 * COMPONENT: AdminPagination
 * Thanh phân trang chuẩn thiết kế FurniStore Luxury Admin.
 * Hỗ trợ chuyển trang, chọn số lượng hiển thị trên trang và hiển thị tổng số mục.
 * =====================================================================
 */
export default function AdminPagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 8,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 8, 10, 15, 20],
  itemLabel = 'mục',
}) {
  if (totalItems <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const startItem = (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  // Tạo danh sách số trang hiển thị (hỗ trợ hiển thị thông minh khi nhiều trang)
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="admin-pagination-bar">
      {/* Thông tin số lượng hiển thị */}
      <div className="admin-pagination-info">
        Hiển thị <span className="font-semibold text-main">{startItem} - {endItem}</span> trong tổng số{' '}
        <span className="font-semibold text-main">{totalItems}</span> {itemLabel}
      </div>

      {/* Điều khiển phân trang */}
      <div className="admin-pagination-controls">
        {/* Lựa chọn số mục mỗi trang */}
        {onPageSizeChange && (
          <div className="admin-pagination-pagesize">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1) // Reset về trang 1 khi đổi size
              }}
              className="admin-pagination-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nút lùi trang */}
        <button
          type="button"
          className="admin-pagination-nav-btn"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
          <span>Trước</span>
        </button>

        {/* Danh sách các nút số trang */}
        <div className="admin-pagination-numbers">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="admin-pagination-dots">
                  ...
                </span>
              )
            }
            const isActive = p === safeCurrentPage
            return (
              <button
                key={p}
                type="button"
                className={`admin-pagination-num-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Nút tiến trang */}
        <button
          type="button"
          className="admin-pagination-nav-btn"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          title="Trang kế tiếp"
        >
          <span>Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
