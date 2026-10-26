import React, { useState, useEffect } from 'react'
import {
  Menu,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Bell,
  Sparkles,
  LogOut,
  UserCheck,
  Package,
  Truck,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import './admin.css'

// Subpages
import AdminDashboard from './AdminDashboard'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'
import AdminInventory from './AdminInventory'
import AdminPromotions from './AdminPromotions'
import AdminInvoices from './AdminInvoices'
import AdminCustomers from './AdminCustomers'
import AdminStaff from './AdminStaff'
import AdminSuppliers from './AdminSuppliers'
import AdminReviews from './AdminReviews'
import AdminReports from './AdminReports'
import AdminSidebar, { ADMIN_NAV_SECTIONS } from './AdminSidebar'
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_CUSTOMERS } from './adminMockData'
import { getAdminUser, logoutAdminUser } from '../../lib/auth'

const ROLES_INFO = {
  ADMIN: { label: 'Quản Trị Viên Tối Cao', short: 'Admin', color: '#8B5E3C' },
  SALES: { label: 'Nhân Viên Bán Hàng', short: 'Sales', color: '#2563EB' },
  WAREHOUSE: { label: 'Thủ Kho Nội Thất', short: 'Kho', color: '#D97706' },
  DISPATCHER: { label: 'Điều Phối Giao & Lắp', short: 'Điều phối', color: '#5B6E4E' },
}

export default function AdminLayout({ currentPath, onNavigate, currentUser: propUser }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Thông tin người dùng hiện tại lấy từ phiên đăng nhập Supabase
  const user = propUser || getAdminUser()
  const displayUsername = user?.username || 'admin'
  const rawDisplayName = user?.fullName || user?.username || 'Quản Trị Viên'
  // Rút gọn tên hiển thị loại bỏ phần ngoặc dài dòng (vd: 'Tổng Quản Trị Viên (Admin)' -> 'Quản Trị Viên')
  const displayName = rawDisplayName.includes('Admin') ? 'Quản Trị Viên' : rawDisplayName.replace(/\s*\(.*?\)/g, '').trim()
  const roleName = user?.role || 'ADMIN'
  const roleShort = ROLES_INFO[roleName]?.short || roleName
  const avatarInitials = (user?.username || 'AD').slice(0, 2).toUpperCase()

  // Theme Management (Default Light #F8F7F4 as requested)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('furnistore_theme') || 'light'
    } catch {
      return 'light'
    }
  })

  // Role Simulation Switcher
  const [activeRole, setActiveRole] = useState(() => {
    try {
      return localStorage.getItem('furnistore_active_role') || 'ADMIN'
    } catch {
      return 'ADMIN'
    }
  })

  // Global Search Modal (Ctrl+K)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')

  // Notifications Dropdown
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'delivery',
      title: 'Đơn hàng cần xếp lịch giao lắp',
      desc: 'Có 4 đơn hàng hẹn giao chiều nay (tòa Landmark 3, Vinhomes).',
      time: '15 phút trước',
      unread: true,
      link: '/admin/orders',
    },
    {
      id: 2,
      type: 'stock',
      title: 'Cảnh báo tồn kho biến thể thấp',
      desc: 'Bàn trà tròn đôi Ceramic (SKU: TABL-03) chỉ còn 2 chiếc.',
      time: '1 giờ trước',
      unread: true,
      link: '/admin/inventory',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Đã nhận đặt cọc 50%',
      desc: 'Khách hàng Trần Minh Triết thanh toán 19.500.000 ₫ qua VietQR.',
      time: '2 giờ trước',
      unread: false,
      link: '/admin/orders',
    },
  ])

  useEffect(() => {
    try {
      localStorage.setItem('furnistore_theme', theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem('furnistore_active_role', activeRole)
    } catch {}
  }, [activeRole])

  // Listen to Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchModalOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false)
        setNotifDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    showToast(`Đã chuyển sang giao diện ${next === 'dark' ? 'Dark Mode (Tối)' : 'Light Mode (Trắng ngà)'}`)
  }

  function handleRoleChange(e) {
    const newRole = e.target.value
    setActiveRole(newRole)
    showToast(`Đã chuyển sang vai trò: ${ROLES_INFO[newRole]?.label}`)
  }

  function showToast(msg) {
    setToastMessage(msg)
    window.clearTimeout(window.__adminToastTimer)
    window.__adminToastTimer = window.setTimeout(() => setToastMessage(''), 3800)
  }

  // Find active label for breadcrumbs
  let currentNavLabel = 'Dashboard Thống Kê'
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path === currentPath) {
        currentNavLabel = item.label
        break
      }
    }
  }

  // Search results calculation
  const searchResults = {
    orders: MOCK_ORDERS.filter(
      (o) =>
        globalSearchTerm &&
        (o.orderCode.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          o.customerName.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    ).slice(0, 3),
    products: MOCK_PRODUCTS.filter(
      (p) =>
        globalSearchTerm &&
        (p.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    ).slice(0, 3),
    customers: MOCK_CUSTOMERS.filter(
      (c) =>
        globalSearchTerm &&
        (c.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          c.phone.includes(globalSearchTerm))
    ).slice(0, 3),
  }

  const hasAnyResults =
    searchResults.orders.length > 0 ||
    searchResults.products.length > 0 ||
    searchResults.customers.length > 0

  // Render Subpage
  function renderSubpage() {
    switch (currentPath) {
      case '/admin':
      case '/admin/':
      case '/admin/dashboard':
        return (
          <AdminDashboard
            onNavigate={onNavigate}
            showToast={showToast}
            activeRole={activeRole}
          />
        )
      case '/admin/reports':
        return <AdminReports showToast={showToast} />
      case '/admin/products':
      case '/admin/categories':
        return (
          <AdminProducts
            showToast={showToast}
            activeRole={activeRole}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        )
      case '/admin/orders':
        return <AdminOrders showToast={showToast} activeRole={activeRole} />
      case '/admin/inventory':
        return <AdminInventory showToast={showToast} activeRole={activeRole} />
      case '/admin/promotions':
        return <AdminPromotions showToast={showToast} activeRole={activeRole} />
      case '/admin/invoices':
        return <AdminInvoices showToast={showToast} activeRole={activeRole} />
      case '/admin/customers':
        return <AdminCustomers showToast={showToast} activeRole={activeRole} />
      case '/admin/staff':
      case '/admin/roles-permissions':
        return <AdminStaff showToast={showToast} activeRole={activeRole} />
      case '/admin/suppliers':
        return <AdminSuppliers showToast={showToast} activeRole={activeRole} />
      case '/admin/reviews':
        return <AdminReviews showToast={showToast} activeRole={activeRole} />
      default:
        return (
          <AdminDashboard
            onNavigate={onNavigate}
            showToast={showToast}
            activeRole={activeRole}
          />
        )
    }
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className={`admin-app-root ${theme === 'dark' ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      {/* Sidebar with role filtering */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        currentUserRole={activeRole}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="admin-main-wrap">
        {/* Top Header Bar */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumbs */}
            <div className="admin-breadcrumbs">
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate('/admin/dashboard')}
              >
                FURNISTORE
              </span>
              <ChevronRight size={12} />
              <span className="active">{currentNavLabel}</span>
            </div>

            {/* Global Search Trigger (Ctrl+K) */}
            <button
              type="button"
              className="admin-search-trigger"
              onClick={() => setSearchModalOpen(true)}
              title="Tìm kiếm toàn cục (Ctrl + K)"
            >
              <Search size={13} />
              <span>Tìm kiếm...</span>
              <span className="admin-kbd-shortcut">Ctrl+K</span>
            </button>
          </div>

          <div className="admin-header-right">
            {/* Quick Role Switcher */}
            <div className="admin-role-selector" title="Chuyển đổi góc nhìn phân quyền (RBAC)">
              <UserCheck size={13} style={{ color: ROLES_INFO[activeRole]?.color }} />
              <select value={activeRole} onChange={handleRoleChange}>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Bán hàng</option>
                <option value="WAREHOUSE">Thủ kho</option>
                <option value="DISPATCHER">Điều phối</option>
              </select>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="admin-icon-btn"
              onClick={toggleTheme}
              title={`Chuyển sang ${theme === 'light' ? 'Chế độ Tối (Dark mode)' : 'Chế độ Sáng (Light mode)'}`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Thông báo hệ thống"
              >
                <Bell size={16} />
                {unreadCount > 0 && <span className="admin-bell-badge" />}
              </button>

              {notifDropdownOpen && (
                <div className="admin-dropdown-menu">
                  <div className="admin-dropdown-header">
                    <span>Thông Báo Mới ({unreadCount})</span>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--admin-primary)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setNotifications(notifications.map((n) => ({ ...n, unread: false })))
                      }}
                    >
                      Đã đọc tất cả
                    </button>
                  </div>

                  <div className="admin-notification-list">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`admin-notification-item ${notif.unread ? 'unread' : ''}`}
                        onClick={() => {
                          onNavigate(notif.link)
                          setNotifDropdownOpen(false)
                        }}
                      >
                        <div style={{ marginTop: '2px' }}>
                          {notif.type === 'delivery' && (
                            <Truck size={15} style={{ color: '#5B6E4E' }} />
                          )}
                          {notif.type === 'stock' && (
                            <AlertTriangle size={15} style={{ color: '#D97706' }} />
                          )}
                          {notif.type === 'payment' && (
                            <CheckCircle2 size={15} style={{ color: '#2563EB' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                            {notif.title}
                          </div>
                          <div style={{ color: 'var(--admin-text-muted)', fontSize: '11.5px', marginTop: '2px' }}>
                            {notif.desc}
                          </div>
                          <div style={{ color: 'var(--admin-text-dim)', fontSize: '10.5px', marginTop: '4px' }}>
                            {notif.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar & Logout */}
            <div className="admin-user-profile" title={`Tài khoản: ${displayUsername} (${displayName})`}>
              <div
                className="admin-avatar"
                style={{
                  background: 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '11px',
                  width: '30px',
                  height: '30px',
                }}
              >
                {avatarInitials}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name" title={displayName} style={{ fontSize: '12px' }}>
                  {displayName}
                </span>
                <span className="admin-user-role" style={{ fontSize: '10px' }}>
                  @{displayUsername}
                </span>
              </div>
              <button
                type="button"
                title="Đăng xuất khỏi tài khoản Quản trị"
                style={{
                  background: 'var(--admin-danger-soft)',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  color: 'var(--admin-danger)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  marginLeft: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                }}
                onClick={() => {
                  logoutAdminUser()
                  onNavigate('/admin')
                }}
              >
                <LogOut size={12} />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-workspace">
          {renderSubpage()}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      {searchModalOpen && (
        <div
          className="admin-global-search-modal"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="admin-global-search-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-search-input-wrap">
              <Search size={18} style={{ color: 'var(--admin-primary)' }} />
              <input
                autoFocus
                type="text"
                placeholder="Nhập mã đơn (#DH-8901), tên sản phẩm (Sofa...), hoặc SĐT khách..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
              />
              <span className="admin-kbd-shortcut">ESC để đóng</span>
            </div>

            <div className="admin-search-results-list">
              {!globalSearchTerm && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                  Gõ từ khóa để tra cứu tức thì mã đơn hàng, sản phẩm hoặc danh bạ khách hàng.
                </div>
              )}

              {globalSearchTerm && !hasAnyResults && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                  Không tìm thấy kết quả nào phù hợp với "{globalSearchTerm}".
                </div>
              )}

              {/* Order Results */}
              {searchResults.orders.length > 0 && (
                <div>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-dim)', textTransform: 'uppercase' }}>
                    Đơn hàng & Giao lắp
                  </div>
                  {searchResults.orders.map((o) => (
                    <div
                      key={o.id}
                      className="admin-search-item"
                      onClick={() => {
                        onNavigate('/admin/orders')
                        setSearchModalOpen(false)
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{o.orderCode} - {o.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{o.phone} | {o.deliveryAddress}</div>
                      </div>
                      <span className="admin-status-badge info">{o.orderStatus}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Results */}
              {searchResults.products.length > 0 && (
                <div>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-dim)', textTransform: 'uppercase', marginTop: '6px' }}>
                    Sản phẩm nội thất
                  </div>
                  {searchResults.products.map((p) => (
                    <div
                      key={p.id}
                      className="admin-search-item"
                      onClick={() => {
                        onNavigate('/admin/products')
                        setSearchModalOpen(false)
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Mã: {p.code} | {p.category}</div>
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--admin-primary)' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Results */}
              {searchResults.customers.length > 0 && (
                <div>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-dim)', textTransform: 'uppercase', marginTop: '6px' }}>
                    Khách hàng
                  </div>
                  {searchResults.customers.map((c) => (
                    <div
                      key={c.id}
                      className="admin-search-item"
                      onClick={() => {
                        onNavigate('/admin/customers')
                        setSearchModalOpen(false)
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>SĐT: {c.phone} | {c.email}</div>
                      </div>
                      <span className="admin-status-badge success">{c.tier || 'Thành viên'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div className="admin-toast">
          <Sparkles size={16} style={{ color: 'var(--admin-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
