import { Bell, Home, LogOut, Search, User } from 'lucide-react'

export default function AdminNavbar({ currentUser, onLogout, onBackToStore }) {
  const username = currentUser?.username || 'Admin'
  const role = currentUser?.role || 'ADMIN'

  return (
    <header className="admin-navbar">
      {/* Search Input */}
      <div className="admin-search-box">
        <Search size={16} color="var(--admin-text-muted)" />
        <input 
          type="text" 
          placeholder="Tìm nhanh đơn hàng (#101), SĐT khách, tên sản phẩm..." 
        />
      </div>

      {/* Right Controls */}
      <div className="admin-navbar-actions">
        {/* Notification Bell */}
        <button className="admin-action-icon-btn" title="Thông báo hệ thống">
          <Bell size={18} />
          <span className="admin-unread-dot"></span>
        </button>

        {/* Profile Pill */}
        <div className="admin-profile-pill">
          <div className="admin-profile-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="admin-profile-info">
            <span className="admin-profile-name">{username}</span>
            <span className="admin-profile-role">{role}</span>
          </div>
        </div>

        {/* Về trang cửa hàng */}
        <button 
          className="admin-action-icon-btn" 
          title="Xem Cửa hàng FuniStore"
          onClick={onBackToStore}
        >
          <Home size={16} />
        </button>

        {/* Logout */}
        <button 
          className="admin-action-icon-btn admin-logout-btn" 
          title="Đăng xuất Quản trị"
          onClick={onLogout}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
