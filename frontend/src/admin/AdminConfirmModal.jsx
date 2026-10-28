import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function AdminConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này? Dữ liệu có thể không thể hoàn tác.',
  confirmText = 'Xác nhận thực hiện',
  cancelText = 'Hủy bỏ',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null

  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div
        className="admin-modal-card admin-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div className="admin-confirm-header-content">
            <div className={`admin-confirm-icon-box ${isDanger ? 'danger' : 'warning'}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 className="admin-modal-title">{title}</h3>
          </div>
          <button
            className="admin-modal-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-modal-body">
          <p className="admin-confirm-message">{message}</p>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`admin-btn ${isDanger ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
