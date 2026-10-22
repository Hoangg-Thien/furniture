import React from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Truck,
  ShoppingBag,
  FileText,
  Tag,
  Star,
  Layers,
  Package,
  Building2,
  Users,
  ShieldCheck,
  Settings,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react'

export const ADMIN_NAV_SECTIONS = [
  {
    title: 'TỔNG QUAN',
    items: [
      {
        label: 'Dashboard Thống Kê',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'DISPATCHER'],
      },
      {
        label: 'Báo Cáo Chuyên Sâu',
        path: '/admin/reports',
        icon: BarChart3,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'BÁN HÀNG & DỊCH VỤ',
    items: [
      {
        label: 'Đơn Hàng & Giao Lắp',
        path: '/admin/orders',
        icon: Truck,
        badge: '12 đơn',
        badgeType: 'rose',
        roles: ['ADMIN', 'SALES', 'DISPATCHER'],
      },
      {
        label: 'Hóa Đơn & Mẫu In A4',
        path: '/admin/invoices',
        icon: FileText,
        roles: ['ADMIN', 'SALES'],
      },
      {
        label: 'Khuyến Mãi & Voucher',
        path: '/admin/promotions',
        icon: Tag,
        badge: '1 chờ',
        badgeType: 'amber',
        roles: ['ADMIN', 'SALES'],
      },
      {
        label: 'Đánh Giá Sản Phẩm',
        path: '/admin/reviews',
        icon: Star,
        roles: ['ADMIN', 'SALES'],
      },
    ],
  },
  {
    title: 'SẢN PHẨM & BIẾN THỂ',
    items: [
      {
        label: 'Sản Phẩm & Biến Thể',
        path: '/admin/products',
        icon: ShoppingBag,
        badge: '6 SP',
        badgeType: 'neutral',
        roles: ['ADMIN', 'SALES', 'WAREHOUSE'],
      },
      {
        label: 'Danh Mục Sản Phẩm',
        path: '/admin/categories',
        icon: Layers,
        roles: ['ADMIN', 'SALES'],
      },
    ],
  },
  {
    title: 'QUẢN LÝ KHO',
    items: [
      {
        label: 'Phiếu Nhập & Tồn Kho',
        path: '/admin/inventory',
        icon: Package,
        badge: '5 sắp hết',
        badgeType: 'amber',
        roles: ['ADMIN', 'WAREHOUSE'],
      },
      {
        label: 'Nhà Cung Cấp',
        path: '/admin/suppliers',
        icon: Building2,
        roles: ['ADMIN', 'WAREHOUSE'],
      },
    ],
  },
  {
    title: 'CON NGƯỜI',
    items: [
      {
        label: 'Khách Hàng',
        path: '/admin/customers',
        icon: Users,
        roles: ['ADMIN', 'SALES', 'DISPATCHER'],
      },
      {
        label: 'Nhân Viên & Đội Thợ',
        path: '/admin/staff',
        icon: ShieldCheck,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'HỆ THỐNG',
    items: [
      {
        label: 'Tài Khoản & Phân Quyền',
        path: '/admin/roles-permissions',
        icon: ShieldCheck,
        roles: ['ADMIN'],
      },
      {
        label: 'Cài Đặt Hệ Thống',
        path: '/admin/settings',
        icon: Settings,
        roles: ['ADMIN'],
      },
    ],
  },
]

export default function AdminSidebar({
  currentPath,
  onNavigate,
  currentUserRole = 'ADMIN',
  mobileOpen = false,
  onCloseMobile,
}) {
  return (
    <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="admin-sidebar-header">
        <div
          className="admin-brand"
          onClick={() => {
            onNavigate('/admin/dashboard')
            if (onCloseMobile) onCloseMobile()
          }}
          title="FURNISTORE - Quản lý kinh doanh nội thất"
        >
          <div className="admin-brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="admin-brand-info">
            <h2>FURNISTORE</h2>
            <span className="admin-brand-badge">ADMIN ERP</span>
          </div>
        </div>

        {mobileOpen && (
          <button
            type="button"
            className="admin-modal-close"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation List filtered by current user role */}
      <nav className="admin-sidebar-nav">
        {ADMIN_NAV_SECTIONS.map((section, secIdx) => {
          // Lọc các item thuộc quyền của role hiện tại
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(currentUserRole)
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={secIdx} className="admin-nav-group">
              <div className="admin-nav-category">{section.title}</div>
              <div className="admin-nav-items-stack">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    currentPath === item.path ||
                    (item.path === '/admin/dashboard' &&
                      (currentPath === '/admin' || currentPath === '/admin/'))

                  return (
                    <button
                      key={item.path}
                      type="button"
                      className={`admin-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onNavigate(item.path)
                        if (onCloseMobile) onCloseMobile()
                      }}
                      title={item.label}
                    >
                      {isActive && <span className="admin-nav-indicator" />}

                      <div className="admin-nav-item-left">
                        <Icon size={16} className="admin-nav-icon" />
                        <span className="admin-nav-label">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`admin-nav-badge ${item.badgeType || 'neutral'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer Quick Action */}
      <div className="admin-sidebar-footer">
        <button
          type="button"
          className="admin-store-link-btn"
          onClick={() => {
            onNavigate('/')
            if (onCloseMobile) onCloseMobile()
          }}
          title="Mở giao diện khách hàng mua sắm"
        >
          <ShoppingBag size={14} style={{ color: '#D97706' }} />
          <span>Xem Cửa Hàng Khách</span>
          <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </button>
      </div>
    </aside>
  )
}
