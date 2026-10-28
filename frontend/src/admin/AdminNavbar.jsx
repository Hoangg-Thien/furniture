import React, { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ExternalLink,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Tag,
  User,
  X
} from 'lucide-react'

export default function AdminNavbar({
  currentUser,
  onLogout,
  onBackToStore,
  onOpenGlobalSearch,
  onToggleMobileSidebar,
  onNavigateModule
}) {
  const username = currentUser?.username || 'Admin'
  const role = currentUser?.role || 'ADMIN'

  // Trạng thái Dropdown Thông báo
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Đơn đặt hàng mới #101',
      desc: 'Khách hàng Nguyễn Văn An vừa đặt Sofa Da Ý Chữ L + Bàn Trà',
      time: '10 phút trước',
      icon: ShoppingCart,
      color: '#3B82F6',
      bg: '#EFF6FF',
      module: 'orders',
      unread: true
    },
    {
      id: 2,
      title: 'Cảnh báo tồn kho thấp',
      desc: 'Bàn Ăn Gỗ Sồi Bắc Âu 6 Ghế chỉ còn 2 bộ trong kho showroom',
      time: '45 phút trước',
      icon: AlertTriangle,
      color: '#EF4444',
      bg: '#FEF2F2',
      module: 'products',
      unread: true
    },
    {
      id: 3,
      title: 'Hiệu quả Voucher TET2026',
      desc: 'Chiến dịch Tết 2026 đã đạt 85% hạn mức sử dụng (42/50 mã)',
      time: '2 giờ trước',
      icon: Tag,
      color: '#D97706',
      bg: '#FEF3C7',
      module: 'promotions',
      unread: true
    }
  ])

  const notifRef = useRef(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNotificationClick = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    )
    setShowNotifications(false)
    if (onNavigateModule && item.module) {
      onNavigateModule(item.module)
    }
  }

  return (
    <header className="admin-navbar">
      {/* Nút Hamburger cho Tablet/Mobile */}
      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-hamburger-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Mở Menu điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Ô Tìm Kiếm Nhanh (Click hoặc Ctrl + K) */}
        <div
          className="admin-search-box"
          onClick={onOpenGlobalSearch}
          title="Nhấn để tìm kiếm toàn hệ thống (Ctrl + K)"
        >
          <Search size={16} color="var(--admin-text-muted)" />
          <input
            type="text"
            readOnly
            placeholder="Tìm nhanh đơn hàng (#101), SĐT khách, tên sản phẩm..."
          />
          <kbd className="admin-search-kbd">Ctrl K</kbd>
        </div>
      </div>

      {/* Điều khiển bên phải */}
      <div className="admin-navbar-actions">
        {/* Chuông Thông Báo */}
        <div className="admin-notif-dropdown-wrapper" ref={notifRef}>
          <button
            type="button"
            className="admin-action-icon-btn admin-notif-bell-btn"
            title="Thông báo hệ thống"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="admin-unread-badge">{unreadCount}</span>
            )}
          </button>

          {/* Hộp Thông Báo Dropdown */}
          {showNotifications && (
            <div className="admin-notif-dropdown">
              <div className="admin-notif-header">
                <div>
                  <h4 className="admin-notif-title">Thông Báo Hoạt Động</h4>
                  <span className="admin-notif-count">
                    {unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Đã đọc hết'}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="admin-mark-read-btn"
                    onClick={handleMarkAllRead}
                    title="Đánh dấu đã đọc tất cả"
                  >
                    <CheckCheck size={14} />
                    <span>Đã đọc</span>
                  </button>
                )}
              </div>

              <div className="admin-notif-list">
                {notifications.map((item) => {
                  const IconComp = item.icon
                  return (
                    <div
                      key={item.id}
                      className={`admin-notif-item ${item.unread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div
                        className="admin-notif-item-icon"
                        style={{ backgroundColor: item.bg, color: item.color }}
                      >
                        <IconComp size={16} />
                      </div>
                      <div className="admin-notif-item-body">
                        <div className="admin-notif-item-title">{item.title}</div>
                        <div className="admin-notif-item-desc">{item.desc}</div>
                        <div className="admin-notif-item-time">{item.time}</div>
                      </div>
                      {item.unread && <span className="admin-notif-dot"></span>}
                    </div>
                  )
                })}
              </div>

              <div className="admin-notif-footer">
                <button
                  type="button"
                  className="admin-notif-view-all"
                  onClick={() => {
                    setShowNotifications(false)
                    if (onNavigateModule) onNavigateModule('orders')
                  }}
                >
                  Xem danh sách đơn hàng mới
                </button>
              </div>
            </div>
          )}
        </div>

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
          type="button"
          className="admin-action-icon-btn"
          title="Xem Cửa hàng FuniStore"
          onClick={onBackToStore}
        >
          <Home size={16} />
        </button>

        {/* Logout */}
        <button
          type="button"
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
