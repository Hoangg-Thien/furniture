import React from 'react'
import { AlertTriangle, ArrowLeft, Home, LayoutDashboard, ShoppingBag, Search } from 'lucide-react'

export default function NotFoundPage({ currentPath, onNavigate }) {
  const suggestedRoutes = [
    { label: 'Cửa hàng FurniStore (Trang chủ)', path: '/', icon: Home, desc: 'Xem danh mục nội thất & mua sắm' },
    { label: 'Tổng quan Quản trị (Admin)', path: '/admin/reports', icon: LayoutDashboard, desc: 'Báo cáo chỉ số kinh doanh & doanh thu' },
    { label: 'Quản lý Sản phẩm & Biến thể', path: '/admin/products', icon: ShoppingBag, desc: 'Danh sách sofa, bàn ghế, tủ giường' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #172033 0%, #0B0F17 100%)',
      color: '#F8FAFC',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '20px',
        padding: '40px 32px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.1)',
        textAlign: 'center',
      }}>
        {/* Error Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#F87171',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          letterSpacing: '0.04em',
        }}>
          <AlertTriangle size={16} />
          <span>LỖI 404 · SAI ĐƯỜNG DẪN URL</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '12px',
          letterSpacing: '-0.02em',
        }}>
          Đường dẫn không tồn tại trên hệ thống
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#94A3B8',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          Hệ thống không tìm thấy trang phù hợp với địa chỉ URL bạn vừa nhập. Vui lòng kiểm tra lại chính tả của đường dẫn.
        </p>

        {/* Path Display */}
        <div style={{
          background: '#0B0F17',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 18px',
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#FCA5A5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '28px',
          wordBreak: 'break-all',
        }}>
          <span style={{ color: '#64748B' }}>URL không hợp lệ:</span>
          <strong>{currentPath || window.location.pathname}</strong>
        </div>

        {/* Suggested Routes */}
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748B',
            fontWeight: 700,
            marginBottom: '12px',
          }}>
            Gợi ý các đường dẫn chính xác:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestedRoutes.map((route) => {
              const Icon = route.icon
              return (
                <button
                  key={route.path}
                  type="button"
                  onClick={() => onNavigate(route.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(217, 119, 6, 0.12)'
                    e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.4)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(217, 119, 6, 0.2)',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>{route.label}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{route.desc} · <code style={{ color: '#D97706' }}>{route.path}</code></div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)' }}
          >
            <ArrowLeft size={16} /> Quay lại trang trước
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Home size={16} /> Về trang chủ FurniStore
          </button>
        </div>
      </div>
    </div>
  )
}
