import { getApiBaseUrl, getApiHeaders } from './apiConfig'

/**
 * Tải toàn bộ dữ liệu tổng quan cho trang Admin Dashboard từ Backend / Supabase
 */
export async function fetchDashboardOverview() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/dashboard/overview`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    console.warn('Lỗi fetchDashboardOverview:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Tải dữ liệu thống kê theo mốc thời gian (TODAY | WEEK | MONTH | YEAR)
 */
export async function fetchDashboardPeriodStats(period = 'MONTH') {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/dashboard/stats?period=${period}`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    console.warn('Lỗi fetchDashboardPeriodStats:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Tải báo cáo tài chính chuyên sâu cho trang Admin Reports
 */
export async function fetchFinancialReports() {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBaseUrl}/api/admin/dashboard/reports`, {
      headers: getApiHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    console.warn('Lỗi fetchFinancialReports:', err)
    return { data: null, error: err.message }
  }
}
