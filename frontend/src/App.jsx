import React, { useState, useEffect } from 'react'
import ClientStorefront from './pages/client/ClientStorefront'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLoginGate from './pages/admin/AdminLoginGate'
import NotFoundPage from './pages/common/NotFoundPage'
import { getCurrentUser } from './lib/auth'

// Danh sách đường dẫn hợp lệ của hệ thống FurniStore
const VALID_CLIENT_ROUTES = new Set([
  '/',
  '',
  '/home',
  '/products',
  '/story',
  '/order-success',
])

const VALID_ADMIN_ROUTES = new Set([
  '/admin',
  '/admin/',
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/inventory',
  '/admin/promotions',
  '/admin/invoices',
  '/admin/customers',
  '/admin/staff',
  '/admin/suppliers',
  '/admin/reviews',
  '/admin/reports',
])

function normalizePath(path) {
  if (!path) return '/'
  const clean = path.split('?')[0].split('#')[0]
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1)
  }
  return clean || '/'
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname))
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser())

  useEffect(() => {
    function handleLocationChange() {
      setCurrentPath(normalizePath(window.location.pathname))
      setCurrentUserState(getCurrentUser())
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  function navigate(path) {
    const normalized = normalizePath(path)
    if (normalized !== currentPath) {
      window.history.pushState({}, '', normalized)
      setCurrentPath(normalized)
      setCurrentUserState(getCurrentUser())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 1. Kiểm tra nếu là đường dẫn Admin hợp lệ
  const isAdminRoute = VALID_ADMIN_ROUTES.has(currentPath)
  if (isAdminRoute) {
    // BẢO VỆ PHÂN QUYỀN (ROUTE GUARD): Chỉ cho phép nếu đã đăng nhập quyền ADMIN hoặc STAFF
    const hasAdminAccess = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF')
    if (!hasAdminAccess) {
      return (
        <AdminLoginGate
          onLoginSuccess={(authedUser) => {
            setCurrentUserState(authedUser)
          }}
          onNavigate={navigate}
        />
      )
    }

    const activeAdminPath = currentPath === '/admin' ? '/admin/dashboard' : currentPath
    return <AdminLayout currentPath={activeAdminPath} onNavigate={navigate} />
  }

  // 2. Kiểm tra nếu là đường dẫn Khách hàng hợp lệ
  const isClientRoute = VALID_CLIENT_ROUTES.has(currentPath)
  if (isClientRoute) {
    return <ClientStorefront onNavigate={navigate} />
  }

  // 3. Nếu người dùng nhập sai đường dẫn URL -> Báo lỗi giao diện 404
  return <NotFoundPage currentPath={currentPath} onNavigate={navigate} />
}
