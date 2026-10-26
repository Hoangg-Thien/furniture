import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShoppingBag,
  Truck,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { loginUser, setCurrentUser } from '../../lib/auth'

export default function AdminLoginGate({ onLoginSuccess, onNavigate }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  async function handleAdminLogin(e) {
    if (e) e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const res = await loginUser(username, password, { requireAdmin: true })
      if (res.user && (res.user.role === 'ADMIN' || res.user.role === 'STAFF')) {
        onLoginSuccess(res.user)
      } else {
        setErrorMsg(res.error || 'Tên đăng nhập hoặc mật khẩu không chính xác!')
      }
    } catch (err) {
      setErrorMsg('Không thể xác thực: ' + (err.message || 'Lỗi kết nối máy chủ'))
    } finally {
      setLoading(false)
    }
  }



  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#181513',
        color: '#F5F2EB',
        fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
      }}
    >
      {/* ===================== LEFT COLUMN (50%): HERO BRAND SHOWCASE ===================== */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          backgroundImage: 'linear-gradient(rgba(24, 21, 19, 0.45), rgba(24, 21, 19, 0.85)), url("/images/sofa_goc_chu_L.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Brand Top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5E3C 0%, #5E3F28 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(139, 94, 60, 0.4)',
            }}
          >
            <Sparkles size={20} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em', color: '#FFF' }}>
              FURNISTORE
            </div>
            <div style={{ fontSize: '11px', color: '#D6CEBE', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Hệ Thống Quản Trị Kinh Doanh Nội Thất
            </div>
          </div>
        </div>

        {/* Brand Philosophy Hero Center */}
        <div style={{ maxWidth: '520px', margin: 'auto 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              color: '#F4EFEA',
              marginBottom: '18px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#F59E0B' }} />
            <span>Cổng Quản Trị & Mini-ERP Nội Thất Độc Quyền</span>
          </div>

          <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, color: '#FFF', margin: '0 0 16px 0' }}>
            Không gian sống tinh tế bắt đầu từ khâu quản trị chuẩn mực.
          </h2>

          <p style={{ fontSize: '14.5px', color: '#D6CEBE', lineHeight: 1.6, margin: 0 }}>
            Tích hợp toàn diện ma trận biến thể chất liệu gỗ, điều phối đội thợ giao lắp căn hộ, kiểm soát tồn kho thời gian thực và quản trị tài chính minh bạch.
          </p>

          {/* Quick Feature Badges */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF' }}>
              <CheckCircle2 size={15} style={{ color: '#10B981' }} />
              <span>Biến thể Gỗ & Da thuộc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF' }}>
              <CheckCircle2 size={15} style={{ color: '#10B981' }} />
              <span>Điều phối xe & Thợ lắp đặt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF' }}>
              <CheckCircle2 size={15} style={{ color: '#10B981' }} />
              <span>Tích hợp VietQR Hóa đơn A4</span>
            </div>
          </div>
        </div>

        {/* Footer Back to Store Link */}
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#D6CEBE',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={15} />
            <span>Quay về Website Mua Hàng Của Khách</span>
          </button>
        </div>
      </div>

      {/* ===================== RIGHT COLUMN (50%): AUTH FORM ===================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
          background: '#221E1C',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', color: '#FFF' }}>
              Đăng Nhập Quản Trị
            </h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#A8A199' }}>
              Vui lòng nhập tài khoản nhân viên được cấp quyền để truy cập hệ thống.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Username */}
            <div className="admin-form-group">
              <label style={{ color: '#D6CEBE', fontSize: '13px', fontWeight: 600 }}>Tên Đăng Nhập / Email</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#736C65' }}
                />
                <input
                  type="text"
                  required
                  style={{ width: '100%', paddingLeft: '38px', background: '#181513', borderColor: '#36302B', color: '#FFF' }}
                  placeholder="Tên đăng nhập hoặc email..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#D6CEBE', fontSize: '13px', fontWeight: 600 }}>Mật Khẩu</label>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#B07D52', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  onClick={() => setForgotModalOpen(true)}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#736C65' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px', background: '#181513', borderColor: '#36302B', color: '#FFF' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#736C65', cursor: 'pointer' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A8A199' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#8B5E3C', width: '16px', height: '16px' }}
              />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Ghi nhớ phiên đăng nhập trên thiết bị này</label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                fontSize: '14.5px',
                background: 'linear-gradient(135deg, #8B5E3C 0%, #724C30 100%)',
                boxShadow: '0 4px 14px rgba(139, 94, 60, 0.35)',
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '440px', background: '#221E1C', color: '#FFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ borderColor: '#36302B' }}>
              <h3 className="admin-modal-title" style={{ color: '#FFF' }}>Khôi Phục Mật Khẩu Quản Trị</h3>
              <button className="admin-modal-close" onClick={() => setForgotModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '13px', color: '#A8A199', lineHeight: 1.5 }}>
                Vui lòng liên hệ Trưởng bộ phận IT hoặc Tổng Quản trị viên theo hotline <strong>1900.6868</strong> để được cấp lại mật khẩu xác thực hai lớp (2FA).
              </p>
            </div>
            <div className="admin-modal-footer" style={{ borderColor: '#36302B' }}>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setForgotModalOpen(false)}
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
