import {
  Armchair,
  BarChart3,
  Boxes,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
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

export const ADMIN_MODULES = [
  // Nhóm 1: Bảng điều khiển (Chỉ Quản trị viên)
  { id: 'dashboard', name: 'Tổng quan Dashboard', icon: LayoutDashboard, group: 'Bảng Điều Khiển', roles: ['ADMIN'] },
  
  // Nhóm 2: Bán Hàng & Đơn Hàng (Cả ADMIN và STAFF)
  { id: 'orders', name: 'Đơn đặt hàng', icon: ShoppingCart, group: 'Bán Hàng & Đơn Hàng', doc: '08', badge: 'Mới', roles: ['ADMIN', 'STAFF'] },
  { id: 'invoices', name: 'Hóa đơn bán hàng', icon: Receipt, group: 'Bán Hàng & Đơn Hàng', doc: '09', roles: ['ADMIN', 'STAFF'] },
  { id: 'customers', name: 'Khách hàng (CRM)', icon: Users, group: 'Bán Hàng & Đơn Hàng', doc: '02', roles: ['ADMIN', 'STAFF'] },

  // Nhóm 3: Kho Hàng & Nhập Kho (Cả ADMIN và STAFF)
  { id: 'products', name: 'Sản phẩm & Tồn kho', icon: Armchair, group: 'Kho Hàng & Sản Phẩm', doc: '05', roles: ['ADMIN', 'STAFF'] },
  { id: 'suppliers', name: 'Nhà cung cấp & Nhập kho', icon: Truck, group: 'Kho Hàng & Sản Phẩm', doc: '06', roles: ['ADMIN', 'STAFF'] },

  // Nhóm 4: Quản Trị Hệ Thống (Chỉ ADMIN)
  { id: 'users', name: 'Tài khoản & Phân quyền', icon: ShieldAlert, group: 'Quản Trị Hệ Thống', doc: '01', roles: ['ADMIN'] },
  { id: 'staff', name: 'Đội ngũ Nhân viên', icon: UserCheck, group: 'Quản Trị Hệ Thống', doc: '03', roles: ['ADMIN'] },
  { id: 'categories', name: 'Loại nội thất', icon: FolderTree, group: 'Quản Trị Hệ Thống', doc: '04', roles: ['ADMIN'] },

  // Nhóm 5: Chiến Dịch & Tài Chính (Chỉ ADMIN)
  { id: 'promotions', name: 'Khuyến mãi & Voucher', icon: Percent, group: 'Chiến Dịch & Tài Chính', doc: '07', roles: ['ADMIN'] },
  { id: 'reports', name: 'Thống kê & Báo cáo', icon: BarChart3, group: 'Chiến Dịch & Tài Chính', doc: '10', roles: ['ADMIN'] }
]

export default function AdminSidebar({
  currentUser,
  activeModule,
  onSelectModule,
  onBackToStore,
  pendingOrdersCount = 3,
  isMobileOpen = false,
  onCloseMobile
}) {
  const role = currentUser?.role?.toUpperCase() || 'ADMIN'
  const isStaff = role === 'STAFF'

  // Lọc danh sách module theo quyền hạn người đăng nhập
  const visibleModules = ADMIN_MODULES.filter((m) => !m.roles || m.roles.includes(role))

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
            <h2>NỘI THẤT CAO CẤP</h2>
            <span>{isStaff ? 'PORTAL NHÂN VIÊN' : 'HỆ THỐNG QUẢN TRỊ ADMIN'}</span>
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
          <span>Về Cửa Hàng (Storefront)</span>
        </button>
      </div>
    </aside>
  )
}
