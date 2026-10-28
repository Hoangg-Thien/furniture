import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import AdminDashboard from './AdminDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminModulePlaceholder from './AdminModulePlaceholder'
import './admin.css'

export default function AdminLayout({ currentUser, onLogout, onBackToStore }) {
  const [activeModule, setActiveModule] = useState('dashboard')

  return (
    <div className="admin-shell">
      {/* Sidebar điều hướng 10 module */}
      <AdminSidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onBackToStore={onBackToStore}
      />

      {/* Vùng nội dung chính */}
      <div className="admin-main">
        {/* Top Navbar */}
        <AdminNavbar
          currentUser={currentUser}
          onLogout={onLogout}
          onBackToStore={onBackToStore}
        />

        {/* Dynamic Content */}
        <main className="admin-content-body">
          {activeModule === 'dashboard' ? (
            <AdminDashboard onNavigateModule={setActiveModule} />
          ) : activeModule === 'users' ? (
            <AdminUserManagement currentUser={currentUser} />
          ) : (
            <AdminModulePlaceholder moduleId={activeModule} />
          )}
        </main>
      </div>
    </div>
  )
}
