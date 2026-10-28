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

export default function AdminLayout({ currentUser, onLogout, onBackToStore }) {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

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

      {/* Sidebar điều hướng 10 module */}
      <AdminSidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
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
          onNavigateModule={setActiveModule}
        />

        {/* Dynamic Content */}
        <main className="admin-content-body">
          {activeModule === 'dashboard' ? (
            <AdminDashboard onNavigateModule={setActiveModule} />
          ) : activeModule === 'users' ? (
            <AdminUserManagement currentUser={currentUser} />
          ) : activeModule === 'customers' ? (
            <AdminCustomerManagement currentUser={currentUser} />
          ) : activeModule === 'staff' ? (
            <AdminStaffManagement currentUser={currentUser} />
          ) : activeModule === 'categories' ? (
            <AdminCategoryManagement currentUser={currentUser} />
          ) : activeModule === 'products' ? (
            <AdminProductManagement currentUser={currentUser} />
          ) : activeModule === 'suppliers' ? (
            <AdminSupplierManagement currentUser={currentUser} />
          ) : activeModule === 'promotions' ? (
            <AdminPromotionManagement currentUser={currentUser} />
          ) : activeModule === 'orders' ? (
            <AdminOrderManagement currentUser={currentUser} />
          ) : activeModule === 'invoices' ? (
            <AdminInvoiceManagement currentUser={currentUser} />
          ) : activeModule === 'reports' ? (
            <AdminReportsManagement currentUser={currentUser} />
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
        onNavigateModule={setActiveModule}
      />
    </div>
  )
}
