export const STAFF_TYPES = {
  SALES: 'Bán hàng / CSKH',
  WAREHOUSE: 'Nhân viên kho',
  CONTENT: 'Nhân viên nội dung',
}

const modules = {
  ADMIN: ['dashboard', 'orders', 'invoices', 'customers', 'products', 'suppliers', 'users', 'staff', 'categories', 'promotions', 'reports'],
  SALES: ['orders', 'invoices', 'customers', 'products'],
  WAREHOUSE: ['suppliers', 'products', 'orders'],
  CONTENT: ['products'],
}

export function allowedAdminModules(user) {
  if (user?.role === 'ADMIN') return modules.ADMIN
  return user?.role === 'STAFF' && Object.hasOwn(STAFF_TYPES, user.staffType) ? modules[user.staffType] : []
}

export const canAccessModule = (user, module) => allowedAdminModules(user).includes(module)
export const defaultAdminModule = user => allowedAdminModules(user)[0] || 'products'
export const canManageProducts = user => user?.role === 'ADMIN'
export const canEditProductContent = user => canManageProducts(user) || (user?.role === 'STAFF' && user.staffType === 'CONTENT')
export const canProcessOrders = user => user?.role === 'ADMIN' || (user?.role === 'STAFF' && user.staffType === 'SALES')
export const adminRoleLabel = user => user?.role === 'ADMIN' ? 'Quản trị viên' : STAFF_TYPES[user?.staffType] || 'Chưa phân công'
