import assert from 'node:assert/strict'
import test from 'node:test'
import { accountRoleLabel, adminErrorMessage, orderStatusLabel } from '../src/admin/adminDisplay.js'

test('admin shows Vietnamese labels for API roles and statuses', () => {
  assert.equal(accountRoleLabel('ADMIN'), 'Quản trị viên')
  assert.equal(accountRoleLabel('STAFF'), 'Nhân viên')
  assert.equal(orderStatusLabel('SHIPPING'), 'Đang giao')
  assert.equal(orderStatusLabel('COMPLETED'), 'Hoàn tất')
  assert.equal(orderStatusLabel('UNKNOWN'), 'Chưa xác định')
})

test('admin translates browser errors and keeps application messages', () => {
  assert.equal(adminErrorMessage(new TypeError('Failed to fetch')), 'Không thể kết nối máy chủ. Vui lòng thử lại.')
  assert.equal(adminErrorMessage(new SyntaxError('Unexpected token')), 'Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại.')
  assert.equal(adminErrorMessage(new Error('Chiến dịch đã tồn tại')), 'Chiến dịch đã tồn tại')
})
