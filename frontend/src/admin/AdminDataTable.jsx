import React from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  PackageOpen
} from 'lucide-react'

export default function AdminDataTable({
  columns = [],
  data = [],
  keyField = 'id',
  loading = false,
  emptyMessage = 'Không tìm thấy dữ liệu nội thất nào phù hợp',
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  bulkActions,
  sortField,
  sortOrder = 'asc',
  onSort,
  pagination
}) {
  const isAllSelected = data.length > 0 && data.every((row) => selectedIds.includes(row[keyField]))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleToggleAll = () => {
    if (isAllSelected) {
      if (onSelectAll) onSelectAll([])
    } else {
      const allIds = data.map((row) => row[keyField])
      if (onSelectAll) onSelectAll(allIds)
    }
  }

  const handleToggleRow = (id) => {
    if (onSelectRow) onSelectRow(id)
  }

  return (
    <div className="admin-datatable-wrapper">
      {/* Floating Bulk Action Bar when rows are selected */}
      {selectable && selectedIds.length > 0 && (
        <div className="admin-bulk-action-bar">
          <div className="admin-bulk-selected-count">
            Đã chọn <strong>{selectedIds.length}</strong> mục
          </div>
          <div className="admin-bulk-actions-group">
            {bulkActions}
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-secondary"
              onClick={() => onSelectAll && onSelectAll([])}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="admin-table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 44, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={isAllSelected}
                    ref={(el) => el && (el.indeterminate = isSomeSelected)}
                    onChange={handleToggleAll}
                    disabled={loading || data.length === 0}
                    aria-label="Chọn tất cả"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortField === col.key
                const alignStyle = col.align ? { textAlign: col.align } : {}
                const widthStyle = col.width ? { width: col.width } : {}

                return (
                  <th
                    key={col.key}
                    style={{ ...alignStyle, ...widthStyle }}
                    className={col.sortable ? 'sortable-header' : ''}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div
                      className="admin-th-content"
                      style={col.align === 'right' ? { justifyContent: 'flex-end' } : col.align === 'center' ? { justifyContent: 'center' } : {}}
                    >
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="sort-icon">
                          {isSorted ? (
                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-neutral" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div className="admin-table-loading">
                    <div className="admin-spinner"></div>
                    <span>Đang nạp dữ liệu từ hệ thống...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div className="admin-table-empty">
                    <div className="admin-empty-icon-box">
                      <PackageOpen size={36} />
                    </div>
                    <h4>Không có dữ liệu</h4>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowId = row[keyField] ?? idx
                const isSelected = selectedIds.includes(rowId)

                return (
                  <tr key={rowId} className={isSelected ? 'row-selected' : ''}>
                    {selectable && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(rowId)}
                          aria-label={`Chọn dòng ${rowId}`}
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const alignStyle = col.align ? { textAlign: col.align } : {}
                      const cellValue = row[col.key]

                      return (
                        <td key={col.key} style={alignStyle}>
                          {col.render ? col.render(cellValue, row, idx) : (cellValue ?? '—')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="admin-pagination-bar">
          <div className="admin-pagination-info">
            Hiển thị từ{' '}
            <strong>
              {pagination.totalItems === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.pageSize + 1}
            </strong>{' '}
            đến{' '}
            <strong>
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems || 0
              )}
            </strong>{' '}
            trên tổng số <strong>{pagination.totalItems || 0}</strong> bản ghi
          </div>

          <div className="admin-pagination-controls">
            {/* Page Size Selector */}
            {pagination.onPageSizeChange && (
              <div className="admin-page-size-selector">
                <span>Dòng/trang:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}

            {/* Previous Button */}
            <button
              type="button"
              className="admin-page-btn"
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            <span className="admin-page-current">
              Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages || 1}
            </span>

            {/* Next Button */}
            <button
              type="button"
              className="admin-page-btn"
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
