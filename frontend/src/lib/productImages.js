import { getApiBaseUrl } from './apiConfig.js'

export function productImageUrl(url) {
  if (typeof url !== 'string') return ''
  return url.startsWith('/uploads/') ? `${getApiBaseUrl()}${url}` : url
}

export function validateProductImage(file) {
  if (!file || file.size === 0) return 'File ảnh không có dữ liệu.'
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return 'Chỉ chọn ảnh JPG, PNG, WEBP hoặc GIF.'
  if (file.size > 5 * 1024 * 1024) return 'Mỗi ảnh không được vượt quá 5 MB.'
  return ''
}
