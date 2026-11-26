const orderStatuses = {
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Đã duyệt',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export function orderStatusLabel(status) {
  return Object.hasOwn(orderStatuses, status) ? orderStatuses[status] : 'Chưa xác định'
}

const accountRoles = { ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', CUSTOMER: 'Khách hàng' }

export function accountRoleLabel(role) {
  return Object.hasOwn(accountRoles, role) ? accountRoles[role] : 'Chưa xác định'
}

export function adminErrorMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  if (error instanceof TypeError) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  if (error instanceof SyntaxError) return 'Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại.'
  return error?.message || fallback
}
