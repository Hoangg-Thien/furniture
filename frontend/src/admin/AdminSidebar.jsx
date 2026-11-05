import {
  Armchair,
  BarChart3,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Percent,
  Receipt,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  ShieldAlert,
  X
} from 'lucide-react'
import { canAccessModule } from '../lib/adminPermissions'

export const ADMIN_MODULES = [
  // Nhóm 1: Bảng điều khiển (Chỉ Quản trị viên)
  { id: 'dashboard', name: 'Tổng quan', icon: LayoutDashboard, group: 'Không gian làm việc', roles: ['ADMIN'] },
  
  // Nhóm 2: Bán Hàng & Đơn Hàng (Cả ADMIN và STAFF)
  { id: 'orders', name: 'Đơn hàng', icon: ShoppingCart, group: 'Bán hàng', doc: '08', roles: ['ADMIN', 'STAFF'] },
  { id: 'invoices', name: 'Hóa đơn', icon: Receipt, group: 'Bán hàng', doc: '09', roles: ['ADMIN', 'STAFF'] },
  { id: 'customers', name: 'Khách hàng', icon: Users, group: 'Bán hàng', doc: '02', roles: ['ADMIN', 'STAFF'] },

  // Nhóm 3: Kho Hàng & Nhập Kho (Cả ADMIN và STAFF)
  { id: 'products', name: 'Sản phẩm & tồn kho', icon: Armchair, group: 'Sản phẩm', doc: '05', roles: ['ADMIN', 'STAFF'] },
  { id: 'suppliers', name: 'Nhà cung cấp', icon: Truck, group: 'Sản phẩm', doc: '06', roles: ['ADMIN', 'STAFF'] },

  // Nhóm 4: Quản Trị Hệ Thống (Chỉ ADMIN)
  { id: 'users', name: 'Tài khoản & phân quyền', icon: ShieldAlert, group: 'Quản lý', doc: '01', roles: ['ADMIN'] },
  { id: 'staff', name: 'Nhân viên', icon: UserCheck, group: 'Quản lý', doc: '03', roles: ['ADMIN'] },
  { id: 'categories', name: 'Danh mục nội thất', icon: FolderTree, group: 'Sản phẩm', doc: '04', roles: ['ADMIN'] },

  // Nhóm 5: Chiến Dịch & Tài Chính (Chỉ ADMIN)
  { id: 'promotions', name: 'Khuyến mãi & voucher', icon: Percent, group: 'Tăng trưởng', doc: '07', roles: ['ADMIN'] },
  { id: 'reports', name: 'Thống kê & báo cáo', icon: BarChart3, group: 'Tăng trưởng', doc: '10', roles: ['ADMIN'] }
]

export default function AdminSidebar({
  currentUser,
  activeModule,
  onSelectModule,
  onBackToStore,
  pendingOrdersCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) {
  const role = currentUser?.role?.toUpperCase() || 'ADMIN'
  const isStaff = role === 'STAFF'

  // Lọc danh sách module theo quyền hạn người đăng nhập
  const visibleModules = ADMIN_MODULES.filter(m => canAccessModule(currentUser, m.id))

  // Lấy danh sách các nhóm thực sự có module hiển thị
  const groups = Array.from(new Set(visibleModules.map((m) => m.group)))

  const handleItemClick = (id) => {
    onSelectModule(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Header Logo */}
      <div className="admin-sidebar-header">
        <a
          href="/admin"
          className="admin-logo-badge"
          onClick={(e) => {
            e.preventDefault()
            handleItemClick(isStaff ? 'orders' : 'dashboard')
          }}
        >
          <div className="admin-logo-icon">
            <Armchair size={22} />
          </div>
          <div className="admin-logo-text">
            <h2>funi<span className="admin-brand-dot">.</span></h2>
            <span>{isStaff ? 'Không gian nhân viên' : 'Không gian quản trị'}</span>
          </div>
        </a>

        {/* Nút đóng Sidebar trên Mobile */}
        {onCloseMobile && (
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Đóng Menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="admin-sidebar-nav">
        {groups.map((groupName) => {
          const items = visibleModules.filter((m) => m.group === groupName)
          if (items.length === 0) return null
          return (
            <div key={groupName} className="admin-nav-group">
              <div className="admin-nav-group-title">{groupName}</div>
              {items.map((item) => {
                const IconComponent = item.icon
                const isActive = activeModule === item.id
                return (
                  <button
                    key={item.id}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <IconComponent size={18} />
                    <span>{item.name}</span>
                    {item.id === 'orders' && pendingOrdersCount > 0 && (
                      <span className="admin-nav-badge">{pendingOrdersCount}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer link to Storefront */}
      <div className="admin-sidebar-footer">
        <button
          className="admin-store-link-btn"
          onClick={() => {
            if (onCloseMobile) onCloseMobile()
            onBackToStore()
          }}
        >
          <ExternalLink size={16} />
          <span>Xem cửa hàng</span>
        </button>
      </div>
    </aside>
  )
}
