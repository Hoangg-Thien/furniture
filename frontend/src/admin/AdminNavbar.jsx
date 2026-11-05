import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Home,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShoppingCart,
  XCircle
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { loadReadNotificationIds, saveReadNotificationIds } from '../lib/notifications.js'
import { canAccessModule, adminRoleLabel } from '../lib/adminPermissions'

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
  const canReadOrders = canAccessModule(currentUser, 'orders')
  const monitorStock = role === 'ADMIN' || currentUser?.staffType === 'WAREHOUSE'
  const storageKey = `funi_notifications_admin_${currentUser?.id ?? currentUser?.userId ?? username}`

  // Trạng thái Dropdown Thông báo
  const [showNotifications, setShowNotifications] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState(false)
  const readNotificationIds = useRef(new Set())

  useEffect(() => {
    readNotificationIds.current = loadReadNotificationIds(storageKey)
    const controller = new AbortController()
    let fetching = false
    const load = async () => {
      if (fetching) return
      fetching = true
      setNotificationsLoading(true)
      setNotificationsError(false)
      try {
        const baseUrl = getApiBaseUrl()
        // shortcut: preview five orders per status, use server events for a full cancellation history.
        const paths = [canReadOrders ? 'orders?status=PENDING&size=5' : null,
          monitorStock ? 'products?lowStock=true&size=5' : null,
          canReadOrders ? 'orders?status=CANCELLED&size=5' : null]
        const responses = await Promise.all(paths.map(path => path ? fetch(`${baseUrl}/api/admin/${path}`, { headers: getApiHeaders(), signal: controller.signal }) : null))
        if (responses.some(response => response && !response.ok)) throw new Error('Unavailable')
        const [orders, products, cancelledOrders] = await Promise.all(responses.map(response => response ? response.json() : { content: [] }))
        const items = [
          ...(orders.content || []).map(order => ({
            id: `order-${order.id}`, title: `Đơn hàng #${order.id} chờ xác nhận`,
            desc: `${order.customerName || 'Khách hàng'} · ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || 0)}`,
            time: order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '',
            icon: ShoppingCart, color: '#376757', bg: '#edf3ef', module: 'orders', recordId: order.id
          })),
          ...(cancelledOrders.content || []).map(order => ({
            id: `cancelled-order-${order.id}`, title: `Đơn hàng #${order.id} đã được hủy`,
            desc: `${order.customerName || 'Khách hàng'} · Bấm để xem chi tiết đơn đã hủy`,
            icon: XCircle, color: '#b42318', bg: '#fef3f2', module: 'orders', recordId: order.id
          })),
          ...(products.content || []).filter(product => Number.isFinite(product.quantity) && product.quantity < 5).map(product => ({
            id: `stock-${product.id}-${product.quantity}`, title: product.quantity === 0 ? 'Sản phẩm đã hết hàng' : 'Sản phẩm sắp hết hàng', desc: `${product.name} · Còn ${product.quantity} sản phẩm`,
            time: 'Bấm để kiểm tra thông tin tồn kho', icon: AlertTriangle, color: '#a28150', bg: '#faf5e9', module: 'products', recordId: product.id
          }))
        ]
        if (!controller.signal.aborted) setNotifications(items.map(item => ({ ...item, unread: !readNotificationIds.current.has(item.id) })))
      } catch {
        if (!controller.signal.aborted) setNotificationsError(true)
      } finally {
        fetching = false
        if (!controller.signal.aborted) setNotificationsLoading(false)
      }
    }
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, 30000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [refreshVersion, storageKey, canReadOrders, monitorStock])

  const notifRef = useRef(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
        notifRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNotifications])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllRead = () => {
    notifications.forEach(item => readNotificationIds.current.add(item.id))
    saveReadNotificationIds(storageKey, readNotificationIds.current)
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNotificationClick = (item) => {
    readNotificationIds.current.add(item.id)
    saveReadNotificationIds(storageKey, readNotificationIds.current)
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    )
    setShowNotifications(false)
    if (onNavigateModule && item.module) {
      if (canAccessModule(currentUser, item.module)) {
        onNavigateModule(item.module, item.recordId)
      }
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
        <button
          type="button"
          className="admin-search-box"
          onClick={onOpenGlobalSearch}
          title="Nhấn để tìm kiếm toàn hệ thống (Ctrl + K)"
        >
          <Search size={16} className="admin-search-icon" />
          <span className="admin-search-placeholder">Tìm kiếm trong không gian làm việc...</span>
          <div className="admin-search-kbd-group">
            <kbd className="admin-search-kbd">Ctrl</kbd>
            <kbd className="admin-search-kbd">K</kbd>
          </div>
        </button>
      </div>

      {/* Điều khiển bên phải */}
      <div className="admin-navbar-actions">
        {/* Chuông Thông Báo */}
        <div className="admin-notif-dropdown-wrapper" ref={notifRef}>
          <button
            type="button"
            className="admin-action-icon-btn admin-notif-bell-btn"
            title="Thông báo hệ thống"
            aria-label={`Thông báo hệ thống, ${unreadCount} chưa đọc`}
            onClick={() => {
              if (!showNotifications) setRefreshVersion(value => value + 1)
              setShowNotifications(value => !value)
            }}
            aria-expanded={showNotifications}
            aria-controls="admin-notifications-panel"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="admin-unread-badge">{unreadCount}</span>
            )}
          </button>

          {/* Hộp Thông Báo Dropdown */}
          {showNotifications && (
            <div className="admin-notif-dropdown" id="admin-notifications-panel" role="region" aria-label="Thông báo hoạt động">
              <div className="admin-notif-header">
                <div>
                  <h4 className="admin-notif-title">Thông Báo Hoạt Động</h4>
                  <span className="admin-notif-count">
                    {notificationsLoading ? 'Đang cập nhật...' : unreadCount > 0 ? `${unreadCount} mục cần chú ý` : 'Đã cập nhật'}
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
                {notificationsError && <div className="admin-search-status" role="status">
                  <p>Chưa tải được thông báo. Vui lòng thử lại.</p>
                  <button type="button" className="admin-btn admin-btn-outline" disabled={notificationsLoading} onClick={() => setRefreshVersion(value => value + 1)}><RefreshCw size={14} /> Thử lại</button>
                </div>}
                {!notificationsLoading && !notificationsError && notifications.length === 0 && <p className="admin-search-status">Không có hoạt động nào cần xử lý.</p>}
                {notifications.map((item) => {
                  const IconComp = item.icon
                  return (
                    <button
                      type="button"
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
                    </button>
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
            <span className="admin-profile-role">
              {adminRoleLabel(currentUser)}
            </span>
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
