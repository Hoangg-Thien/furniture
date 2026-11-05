import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import AdminDashboard from './AdminDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminCustomerManagement from './AdminCustomerManagement'
import AdminStaffManagement from './AdminStaffManagement'
import AdminCategoryManagement from './AdminCategoryManagement'
import AdminProductManagement from './AdminProductManagement'
import AdminSupplierManagement from './AdminSupplierManagement'
import AdminPromotionManagement from './AdminPromotionManagement'
import AdminOrderManagement from './AdminOrderManagement'
import AdminInvoiceManagement from './AdminInvoiceManagement'
import AdminReportsManagement from './AdminReportsManagement'
import AdminModulePlaceholder from './AdminModulePlaceholder'
import AdminToastContainer from './AdminToastContainer'
import AdminGlobalSearchModal from './AdminGlobalSearchModal'
import './admin.css'
import './admin-modern.css'
import './AdminCategoryManagement.css'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { setCurrentAdminUser } from '../lib/auth'
import { canAccessModule, defaultAdminModule } from '../lib/adminPermissions'

import { ShieldAlert } from 'lucide-react'

export default function AdminLayout({ currentUser: storedUser, onLogout, onBackToStore }) {
  const [verifiedUser, setVerifiedUser] = useState(null)
  const [sessionError, setSessionError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function refresh() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/admin/session`, { headers: getApiHeaders(), signal: controller.signal })
        if (response.status === 401) { onLogout(); return }
        if (!response.ok) throw new Error('Không thể kiểm tra quyền truy cập. Vui lòng thử lại.')
        const identity = await response.json()
        if (controller.signal.aborted) return
        const user = { ...storedUser, ...identity }
        setCurrentAdminUser(user)
        setVerifiedUser(previous => previous?.role === user.role && previous?.staffType === user.staffType && previous?.staffId === user.staffId ? previous : user)
        setSessionError('')
      } catch (error) {
        if (!controller.signal.aborted) setSessionError(error.message || 'Không thể kết nối máy chủ')
      }
    }
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('admin-session-expired', onLogout)
    return () => {
      controller.abort()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('admin-session-expired', onLogout)
    }
  }, [storedUser.accessToken, attempt])
  if (!verifiedUser || sessionError) return <div className="admin-shell"><div className="admin-card" role={sessionError ? 'alert' : 'status'} style={{ margin: 24 }}>
    <p>{sessionError || 'Đang kiểm tra phiên đăng nhập...'}</p>
    {sessionError && <button className="admin-btn admin-btn-primary" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>}
    {sessionError && <button className="admin-btn admin-btn-outline" onClick={onLogout}>Đăng xuất</button>}
  </div></div>
  return <AdminWorkspace key={`${verifiedUser.role}:${verifiedUser.staffType}`} currentUser={verifiedUser} onLogout={onLogout} onBackToStore={onBackToStore} />
}

function AccessDeniedView({ onGoBack }) {
  return (
    <div className="admin-card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '540px', margin: '40px auto' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <ShieldAlert size={32} />
      </div>
      <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '8px', fontWeight: 700 }}>
        Quyền Truy Cập Bị Giới Hạn
      </h3>
      <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
        Chức năng này dành riêng cho <strong>Quản trị viên (ADMIN)</strong>. Bạn đang đăng nhập với tư cách <strong>Nhân viên (STAFF)</strong>.
      </p>
      <button
        className="admin-btn admin-btn-primary"
        onClick={onGoBack}
        style={{ margin: '0 auto' }}
      >
        Về Bàn Làm Việc Đơn Hàng
      </button>
    </div>
  )
}

function AdminWorkspace({ currentUser, onLogout, onBackToStore }) {
  const role = currentUser.role
  const isStaff = role === 'STAFF'
  const defaultModule = defaultAdminModule(currentUser)

  const getInitialModule = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
      if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '').split('/')[0]
        if (sub && !sub.includes('login')) {
          if (!canAccessModule(currentUser, sub)) {
            return defaultModule
          }
          return sub
        }
      }
      const saved = localStorage.getItem('funi_admin_active_module')
      if (saved) {
        if (!canAccessModule(currentUser, saved)) {
          return defaultModule
        }
        return saved
      }
    }
    return defaultModule
  }

  const [activeModule, setActiveModule] = useState(getInitialModule)
  const [notificationTarget, setNotificationTarget] = useState(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

  const handleSelectModule = (mod, recordId) => {
    if (!canAccessModule(currentUser, mod)) mod = defaultModule
    setNotificationTarget(recordId ? { module: mod, id: recordId } : null)
    setActiveModule(mod)
    try {
      localStorage.setItem('funi_admin_active_module', mod)
      const targetPath = `/admin/${mod}`
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ adminModule: mod }, '', targetPath)
      }
    } catch (e) {}
  }

  // Đồng bộ activeModule khi người dùng bấm Back/Forward của trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      setNotificationTarget(null)
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
      if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '').split('/')[0]
        if (sub) {
            setActiveModule(canAccessModule(currentUser, sub) ? sub : defaultModule)
        }
      } else if (path === '/admin') {
        setActiveModule(defaultModule)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [defaultModule])

  // Giữ URL và nội dung phù hợp với vị trí đã xác thực.
  useEffect(() => {
    if (!canAccessModule(currentUser, activeModule) || window.location.pathname !== `/admin/${activeModule}`) {
      handleSelectModule(canAccessModule(currentUser, activeModule) ? activeModule : defaultModule)
    }
  }, [isStaff, activeModule])

  // Lắng nghe phím tắt Ctrl+K hoặc ⌘+K để mở tìm kiếm toàn hệ thống
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsGlobalSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!canAccessModule(currentUser, activeModule)) return <div className="admin-shell"><div className="admin-card" role="alert" style={{ margin: 24 }}>
    <p>Tài khoản chưa được phân công vị trí hợp lệ. Vui lòng liên hệ quản trị viên.</p>
    <button className="admin-btn admin-btn-outline" onClick={onLogout}>Đăng xuất</button>
  </div></div>

  return (
    <div className="admin-shell">
      {/* Toast Notification Container (Góc trên bên phải) */}
      <AdminToastContainer />

      {/* Backdrop mờ khi mở Sidebar trên Mobile */}
      {isMobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar điều hướng theo phân quyền */}
      <AdminSidebar
        currentUser={currentUser}
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        onBackToStore={onBackToStore}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Vùng nội dung chính */}
      <div className="admin-main">
        {/* Top Navbar */}
        <AdminNavbar
          key={currentUser?.id ?? currentUser?.userId ?? currentUser?.username}
          currentUser={currentUser}
          onLogout={onLogout}
          onBackToStore={onBackToStore}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigateModule={handleSelectModule}
        />

        {/* Dynamic Content */}
        <main className="admin-content-body">
          {activeModule === 'dashboard' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminDashboard onNavigateModule={handleSelectModule} />
            )
          ) : activeModule === 'users' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminUserManagement currentUser={currentUser} />
            )
          ) : activeModule === 'customers' ? (
            <AdminCustomerManagement currentUser={currentUser} />
          ) : activeModule === 'staff' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminStaffManagement currentUser={currentUser} />
            )
          ) : activeModule === 'categories' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminCategoryManagement />
            )
          ) : activeModule === 'products' ? (
            <AdminProductManagement currentUser={currentUser} notificationTarget={notificationTarget?.module === 'products' ? notificationTarget : null} />
          ) : activeModule === 'suppliers' ? (
            <AdminSupplierManagement currentUser={currentUser} />
          ) : activeModule === 'promotions' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminPromotionManagement currentUser={currentUser} />
            )
          ) : activeModule === 'orders' ? (
            <AdminOrderManagement currentUser={currentUser} notificationTarget={notificationTarget?.module === 'orders' ? notificationTarget : null} />
          ) : activeModule === 'invoices' ? (
            <AdminInvoiceManagement currentUser={currentUser} />
          ) : activeModule === 'reports' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminReportsManagement currentUser={currentUser} />
            )
          ) : (
            <AdminModulePlaceholder moduleId={activeModule} />
          )}
        </main>

        {/* Admin Footer */}
        <footer className="admin-system-footer">
          <div className="admin-footer-left">
            <span>FuniStore Workspace</span>
          </div>
          <div className="admin-footer-right">
            <span>&copy; 2026 FuniStore</span>
          </div>
        </footer>
      </div>

      {/* Hộp thoại Tìm kiếm nhanh toàn hệ thống (Ctrl + K) */}
      {isGlobalSearchOpen && <AdminGlobalSearchModal
        currentUser={currentUser}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigateModule={handleSelectModule}
      />}
    </div>
  )
}
