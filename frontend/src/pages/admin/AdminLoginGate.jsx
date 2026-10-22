import React, { useState } from 'react'
import { ShieldCheck, Lock, User, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { loginUser, setCurrentUser } from '../../lib/auth'

export default function AdminLoginGate({ onLoginSuccess, onNavigate }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdminLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const res = await loginUser(username, password)
      if (res.user && (res.user.role === 'ADMIN' || res.user.role === 'STAFF')) {
        onLoginSuccess(res.user)
      } else if (res.user && res.user.role === 'CUSTOMER') {
        setErrorMsg('Tài khoản này là tài khoản Khách hàng (CUSTOMER), không có quyền quản trị hệ thống!')
      } else {
        // Fallback demo cho môi trường dev khi backend chưa bật hoặc tài khoản mẫu
        if ((username === 'admin' || username === 'admin01' || username === 'hoangthien') && password) {
          const mockAdmin = {
            id: 1,
            username: username,
            fullName: 'Hoàng Thiên (Quản Trị Viên)',
            role: 'ADMIN',
          }
          setCurrentUser(mockAdmin)
          onLoginSuccess(mockAdmin)
        } else {
          setErrorMsg(res.error || 'Sai tên đăng nhập hoặc mật khẩu quản trị viên!')
        }
      }
    } catch (err) {
      setErrorMsg('Không thể xác thực: ' + (err.message || 'Lỗi kết nối'))
    } finally {
      setLoading(false)
    }
  }

  function handleQuickDemoAdmin() {
    const mockAdmin = {
      id: 1,
      username: 'admin01',
      fullName: 'Hoàng Thiên (Tổng Quản Trị Viên)',
      role: 'ADMIN',
    }
    setCurrentUser(mockAdmin)
    onLoginSuccess(mockAdmin)
  }

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
        maxWidth: '460px',
        width: '100%',
        background: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(217, 119, 6, 0.35)',
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(217, 119, 6, 0.1)',
      }}>
        {/* Security Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #D97706 0%, #78350F 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
            marginBottom: '14px',
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: '#FFF' }}>
            Khu Vực Quản Trị Hệ Thống
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: 0 }}>
            Yêu cầu xác thực tài khoản có phân quyền Quản trị viên (ADMIN) để tiếp tục.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
              Tên đăng nhập Quản trị viên
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0B0F17',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9px',
              padding: '10px 14px',
            }}>
              <User size={16} style={{ color: '#F59E0B' }} />
              <input
                type="text"
                required
                placeholder="VD: admin01 hoặc admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFF',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
              Mật khẩu bảo mật
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0B0F17',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9px',
              padding: '10px 14px',
            }}>
              <Lock size={16} style={{ color: '#F59E0B' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFF',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              color: '#FFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Đang xác thực bảo mật...' : 'Đăng Nhập Quản Trị'}
          </button>
        </form>

        {/* Quick Demo for testing */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FBBF24',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ⚡ Xác Thực Nhanh Quyền Quản Trị (Chế độ phát triển)
          </button>

          <div>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Quay về Trang chủ Cửa hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
