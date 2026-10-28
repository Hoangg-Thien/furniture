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
  // Nhóm 1: Bảng điều khiển
  { id: 'dashboard', name: 'Tổng quan Dashboard', icon: LayoutDashboard, group: 'Bảng Điều Khiển' },
  
  // Nhóm 2: Người dùng & Nhân sự
  { id: 'users', name: 'Tài khoản & Phân quyền', icon: ShieldAlert, group: 'Nhân Sự & Khách Hàng', doc: '01' },
  { id: 'customers', name: 'Khách hàng (CRM)', icon: Users, group: 'Nhân Sự & Khách Hàng', doc: '02' },
  { id: 'staff', name: 'Đội ngũ Nhân viên', icon: UserCheck, group: 'Nhân Sự & Khách Hàng', doc: '03' },

  // Nhóm 3: Kho & Chuỗi cung ứng
  { id: 'categories', name: 'Loại nội thất', icon: FolderTree, group: 'Kho & Chuỗi Cung Ứng', doc: '04' },
  { id: 'products', name: 'Sản phẩm & Album ảnh', icon: Armchair, group: 'Kho & Chuỗi Cung Ứng', doc: '05' },
  { id: 'suppliers', name: 'Nhà cung cấp nội thất', icon: Truck, group: 'Kho & Chuỗi Cung Ứng', doc: '06' },

  // Nhóm 4: Bán hàng & Dòng tiền
  { id: 'promotions', name: 'Khuyến mãi & Voucher', icon: Percent, group: 'Bán Hàng & Dòng Tiền', doc: '07' },
  { id: 'orders', name: 'Đơn đặt hàng', icon: ShoppingCart, group: 'Bán Hàng & Dòng Tiền', doc: '08', badge: 'Mới' },
  { id: 'invoices', name: 'Hóa đơn bán hàng', icon: Receipt, group: 'Bán Hàng & Dòng Tiền', doc: '09' },
  { id: 'reports', name: 'Thống kê & Báo cáo', icon: BarChart3, group: 'Bán Hàng & Dòng Tiền', doc: '10' }
]

export default function AdminSidebar({
  activeModule,
  onSelectModule,
  onBackToStore,
  pendingOrdersCount = 3,
  isMobileOpen = false,
  onCloseMobile
}) {
  // Gom nhóm các module
  const groups = ['Bảng Điều Khiển', 'Nhân Sự & Khách Hàng', 'Kho & Chuỗi Cung Ứng', 'Bán Hàng & Dòng Tiền']

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
            handleItemClick('dashboard')
          }}
        >
          <div className="admin-logo-icon">
            <Armchair size={22} />
          </div>
          <div className="admin-logo-text">
            <h2>NỘI THẤT CAO CẤP</h2>
            <span>HỆ THỐNG QUẢN TRỊ ADMIN</span>
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
          const items = ADMIN_MODULES.filter((m) => m.group === groupName)
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
