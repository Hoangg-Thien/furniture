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

import { ShieldAlert } from 'lucide-react'

// Danh sách các module mà Nhân viên (STAFF) được phép thao tác
const STAFF_ALLOWED_MODULES = ['orders', 'invoices', 'customers', 'products', 'suppliers']

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

export default function AdminLayout({ currentUser, onLogout, onBackToStore }) {
  const role = currentUser?.role?.toUpperCase() || 'ADMIN'
  const isStaff = role === 'STAFF'
  const defaultModule = isStaff ? 'orders' : 'dashboard'

  const getInitialModule = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
      if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '').split('/')[0]
        if (sub && !sub.includes('login')) {
          if (isStaff && !STAFF_ALLOWED_MODULES.includes(sub)) {
            return 'orders'
          }
          return sub
        }
      }
      const saved = localStorage.getItem('funi_admin_active_module')
      if (saved) {
        if (isStaff && !STAFF_ALLOWED_MODULES.includes(saved)) {
          return 'orders'
        }
        return saved
      }
    }
    return defaultModule
  }

  const [activeModule, setActiveModule] = useState(getInitialModule)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

  const handleSelectModule = (mod) => {
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
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
      if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '').split('/')[0]
        if (sub) {
          setActiveModule(sub)
        }
      } else if (path === '/admin') {
        setActiveModule(defaultModule)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [defaultModule])

  // Nếu tài khoản là nhân viên nhưng cố tình vào các module cấm, tự chuyển hướng về 'orders'
  useEffect(() => {
    if (isStaff && !STAFF_ALLOWED_MODULES.includes(activeModule)) {
      handleSelectModule('orders')
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
              <AdminCategoryManagement currentUser={currentUser} />
            )
          ) : activeModule === 'products' ? (
            <AdminProductManagement currentUser={currentUser} />
          ) : activeModule === 'suppliers' ? (
            <AdminSupplierManagement currentUser={currentUser} />
          ) : activeModule === 'promotions' ? (
            isStaff ? (
              <AccessDeniedView onGoBack={() => handleSelectModule('orders')} />
            ) : (
              <AdminPromotionManagement currentUser={currentUser} />
            )
          ) : activeModule === 'orders' ? (
            <AdminOrderManagement currentUser={currentUser} />
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
            <span>Hệ thống Quản trị Cửa hàng Nội thất Cao Cấp</span>
            <span className="admin-footer-dot">•</span>
            <span>Phiên bản 2.0 (Kiến trúc MVC Chuẩn)</span>
          </div>
          <div className="admin-footer-right">
            <span>Bản quyền &copy; 2026 Showroom FuniStore. Mọi quyền được bảo lưu.</span>
          </div>
        </footer>
      </div>

      {/* Hộp thoại Tìm kiếm nhanh toàn hệ thống (Ctrl + K) */}
      <AdminGlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigateModule={handleSelectModule}
      />
    </div>
  )
}
