import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Package,
  FileText,
  Tag,
  Users,
  Star,
  Building2,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
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

export default function AdminLayout({ currentPath, onNavigate }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  function showToast(msg) {
    setToastMessage(msg)
    window.clearTimeout(window.__adminToastTimer)
    window.__adminToastTimer = window.setTimeout(() => setToastMessage(''), 3800)
  }

  // Find active label for breadcrumbs
  let currentNavLabel = 'Báo Cáo & Thống Kê'
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path === currentPath) {
        currentNavLabel = item.label
        break
      }
    }
  }

  // Render Subpage (Báo Cáo & Thống Kê mặc định đứng đầu)
  function renderSubpage() {
    switch (currentPath) {
      case '/admin':
      case '/admin/reports':
        return <AdminReports showToast={showToast} />
      case '/admin/dashboard':
        return <AdminDashboard onNavigate={onNavigate} showToast={showToast} />
      case '/admin/products':
        return <AdminProducts showToast={showToast} />
      case '/admin/orders':
        return <AdminOrders showToast={showToast} />
      case '/admin/inventory':
        return <AdminInventory showToast={showToast} />
      case '/admin/promotions':
        return <AdminPromotions showToast={showToast} />
      case '/admin/invoices':
        return <AdminInvoices showToast={showToast} />
      case '/admin/customers':
        return <AdminCustomers showToast={showToast} />
      case '/admin/staff':
        return <AdminStaff showToast={showToast} />
      case '/admin/suppliers':
        return <AdminSuppliers showToast={showToast} />
      case '/admin/reviews':
        return <AdminReviews showToast={showToast} />
      default:
        return <AdminReports showToast={showToast} />
    }
  }

  return (
    <div className="admin-app-root">
      {/* Standalone Reusable Admin Sidebar */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
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
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumbs */}
            <div className="admin-breadcrumbs">
              <span>Hệ Thống</span>
              <ChevronRight size={14} />
              <span>Quản Trị</span>
              <ChevronRight size={14} />
              <span className="active">{currentNavLabel}</span>
            </div>
          </div>

          <div className="admin-header-right">
            {/* Live Status indicator */}
            <div className="admin-status-indicator" title="Hệ thống cơ sở dữ liệu nội thất sẵn sàng">
              <span className="glowing-dot" />
              <span>Hệ Thống Sẵn Sàng</span>
            </div>

            {/* Admin Avatar & Logout */}
            <div className="admin-user-profile">
              <div className="admin-avatar">HT</div>
              <div className="admin-user-info">
                <span className="admin-user-name">Hoàng Thiên</span>
                <span className="admin-user-role">Tổng Quản Trị Viên</span>
              </div>
              <button
                type="button"
                title="Đăng xuất khỏi tài khoản Quản trị"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                onClick={() => {
                  try {
                    localStorage.removeItem('furniture_logged_in_user')
                  } catch {}
                  onNavigate('/')
                }}
              >
                <LogOut size={13} />
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

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div className="admin-toast">
          <Sparkles size={16} style={{ color: '#F59E0B' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
