import React from 'react'
import {
  BarChart3,
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
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react'

export const ADMIN_NAV_SECTIONS = [
  {
    title: 'BÁO CÁO & TỔNG QUAN',
    items: [
      { label: 'Báo Cáo & Thống Kê', path: '/admin/reports', icon: BarChart3 },
      { label: 'Tổng Quan', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'KINH DOANH & KHO',
    items: [
      { label: 'Sản Phẩm & Biến Thể', path: '/admin/products', icon: ShoppingBag, badge: '6 SP', badgeType: 'neutral' },
      { label: 'Đơn Hàng & Giao Lắp', path: '/admin/orders', icon: Truck, badge: '4 đơn', badgeType: 'rose' },
      { label: 'Nhập Kho Nội Thất', path: '/admin/inventory', icon: Package },
      { label: 'Hóa Đơn (Invoices)', path: '/admin/invoices', icon: FileText },
    ],
  },
  {
    title: 'MARKETING & KHÁCH HÀNG',
    items: [
      { label: 'Khuyến Mãi & Voucher', path: '/admin/promotions', icon: Tag, badge: '1 chờ duyệt', badgeType: 'amber' },
      { label: 'Khách Hàng', path: '/admin/customers', icon: Users },
      { label: 'Đánh Giá & Phản Hồi', path: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'ĐỐI TÁC & HỆ THỐNG',
    items: [
      { label: 'Nhà Cung Cấp', path: '/admin/suppliers', icon: Building2 },
      { label: 'Nhân Sự & Phân Quyền', path: '/admin/staff', icon: ShieldCheck },
    ],
  },
]

export default function AdminSidebar({
  currentPath,
  onNavigate,
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
            onNavigate('/admin/reports')
            if (onCloseMobile) onCloseMobile()
          }}
          title="FurniStore Admin Portal"
        >
          <div className="admin-brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="admin-brand-info">
            <h2>FurniStore</h2>
            <span className="admin-brand-badge">ADMIN PORTAL</span>
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

      {/* Navigation List - Scrollbar hidden */}
      <nav className="admin-sidebar-nav">
        {ADMIN_NAV_SECTIONS.map((section, secIdx) => (
          <div key={secIdx} className="admin-nav-group">
            <div className="admin-nav-category">{section.title}</div>
            <div className="admin-nav-items-stack">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentPath === item.path ||
                  (item.path === '/admin/reports' && currentPath === '/admin')

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
                    {/* Active Indigo Indicator pill on far left */}
                    {isActive && <span className="admin-nav-indicator" />}

                    <div className="admin-nav-item-left">
                      <Icon
                        size={17}
                        className={`admin-nav-icon ${isActive ? 'text-white' : 'text-zinc-400'}`}
                      />
                      <span className="admin-nav-label">{item.label}</span>
                    </div>

                    {/* Pill Badges */}
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
        ))}
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
          <ShoppingBag size={15} style={{ color: '#F59E0B' }} />
          <span>Xem Website Cửa Hàng</span>
          <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </button>
      </div>
    </aside>
  )
}
