import { getApiBaseUrl } from './apiConfig'

/**
 * Lấy danh sách voucher đang hoạt động cho khách hàng
 */
export async function fetchActiveVouchers() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers/active`)
    if (!res.ok) throw new Error(`Lỗi tải vouchers: ${res.status}`)
    const data = await res.json()
    return { vouchers: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.error('Lỗi fetchActiveVouchers:', err)
    return { vouchers: [], error: err.message || 'Không thể kết nối đến máy chủ backend.' }
  }
}

/**
 * Lấy tất cả voucher cho Admin (bao gồm chờ duyệt, hoạt động, hết hạn)
 */
export async function fetchAllVouchersForAdmin() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers/admin/all`)
    if (!res.ok) throw new Error(`Lỗi tải danh sách quản trị: ${res.status}`)
    const data = await res.json()
    return { vouchers: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.error('Lỗi fetchAllVouchersForAdmin:', err)
    return { vouchers: [], error: err.message || 'Không thể kết nối đến máy chủ backend.' }
  }
}

/**
 * Admin duyệt voucher đưa vào Kho Voucher
 */
export async function approveVoucherApi(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers/${id}/approve`, {
      method: 'PUT',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Duyệt voucher thất bại')
    return { success: true, message: data.message, error: null }
  } catch (err) {
    return { success: false, error: err.message || 'Lỗi khi duyệt voucher' }
  }
}

/**
 * Admin từ chối hoặc tạm dừng voucher
 */
export async function rejectVoucherApi(id) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers/${id}/reject`, {
      method: 'PUT',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Từ chối voucher thất bại')
    return { success: true, message: data.message, error: null }
  } catch (err) {
    return { success: false, error: err.message || 'Lỗi khi từ chối voucher' }
  }
}

/**
 * Tạo mới voucher
 */
export async function createVoucherApi(voucherData) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voucherData),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Tạo voucher thất bại')
    return { voucher: data, error: null }
  } catch (err) {
    return { voucher: null, error: err.message || 'Lỗi khi tạo voucher' }
  }
}

/**
 * Kiểm tra mã voucher và tính số tiền giảm khi khách áp dụng cho đơn hàng
 */
export async function validateVoucherApi(codeOrObj, maybeSubtotal) {
  const apiBaseUrl = getApiBaseUrl()
  let code = ''
  let subtotal = 0
  if (typeof codeOrObj === 'object' && codeOrObj !== null) {
    code = codeOrObj.code
    subtotal = codeOrObj.subtotal
  } else {
    code = codeOrObj
    subtotal = maybeSubtotal
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/vouchers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: (code || '').trim().toUpperCase(), subtotal: Number(subtotal || 0) }),
    })
    const data = await res.json()
    if (!res.ok) {
      return {
        valid: false,
        discount: 0,
        error: data.error || 'Voucher không hợp lệ',
        minimumAmount: data.minimumAmount,
        neededAmount: data.neededAmount,
      }
    }
    return {
      valid: true,
      voucherId: data.voucherId,
      code: data.code,
      programName: data.programName,
      discountAmount: Number(data.discountAmount || 0),
      discountPercent: Number(data.discountPercent || 0),
      finalTotal: Number(data.finalTotal || 0),
      error: null,
    }
  } catch (err) {
    return { valid: false, discount: 0, error: 'Không thể kết nối đến máy chủ để xác thực voucher.' }
  }
}
