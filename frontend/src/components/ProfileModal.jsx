import { X, LogOut, User, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'

export default function ProfileModal({ isOpen, user, onClose, onLogout }) {
  if (!isOpen || !user) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card profile-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
        >
          <X size={20} />
        </button>

        <div className="profile-header">
          <div className="profile-avatar-large">
            {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="profile-name">{user.fullName || user.username}</h2>
            <span className="profile-role-badge">
              <ShieldCheck size={13} /> Khách hàng thành viên
            </span>
          </div>
        </div>

        <div className="profile-details-list">
          <div className="profile-detail-item">
            <span className="detail-label">
              <User size={15} /> Tên đăng nhập:
            </span>
            <span className="detail-value">{user.username}</span>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">
              <Mail size={15} /> Email:
            </span>
            <span className="detail-value">{user.email || '(Chưa cập nhật)'}</span>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">
              <Phone size={15} /> Số điện thoại:
            </span>
            <span className="detail-value">{user.phone || '(Chưa cập nhật)'}</span>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">
              <MapPin size={15} /> Địa chỉ giao hàng:
            </span>
            <span className="detail-value">{user.address || '(Chưa cập nhật)'}</span>
          </div>
        </div>

        {user.isOffline && (
          <div className="auth-alert error" style={{ margin: '14px 0', fontSize: '12px' }}>
            <span>⚠️ Tài khoản này đang lưu tạm offline vì Backend chưa kết nối. Khởi động Spring Boot để lưu vào Database PostgreSQL.</span>
          </div>
        )}

        <div className="profile-actions">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={() => {
              onLogout()
              onClose()
            }}
          >
            <LogOut size={16} />
            <span>Đăng xuất tài khoản</span>
          </button>
          <button
            type="button"
            className="profile-close-btn"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

