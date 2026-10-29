import { useState } from 'react'
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { loginAdmin } from '../lib/auth'

export default function AdminLoginPage({ onLoginSuccess, onBackToStore }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleLogin(e) {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.')
      return
    }

    setLoading(true)

    try {
      const { user, error } = await loginAdmin(username.trim(), password)

      if (error) {
        setErrorMessage(error)
        setLoading(false)
        return
      }

      setSuccessMessage(`Xác thực thành công! Đang chuyển hướng...`)
      
      setTimeout(() => {
        onLoginSuccess(user)
      }, 500)
    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi kết nối với máy chủ. Vui lòng thử lại sau.')
      setLoading(false)
    }
  }

  function handleQuickFill(demoUser, demoPass) {
    setUsername(demoUser)
    setPassword(demoPass)
    setErrorMessage('')
  }

  return (
    <div className="admin-login-wrapper">
      {/* Background Decor Shapes */}
      <div className="admin-login-bg-glow glow-1" />
      <div className="admin-login-bg-glow glow-2" />

      <div className="admin-login-card">
        {/* Brand & Security Header */}
        <div className="admin-login-header">
          <div className="admin-login-badge-wrap">
            <div className="admin-login-icon">
              <ShieldCheck size={28} />
            </div>
            <span className="admin-security-pill">
              <span className="security-status-dot" />
              RESTRICTED PORTAL
            </span>
          </div>
          <h1>FuniStore Admin</h1>
          <p>Hệ thống Quản trị & Điều hành Doanh nghiệp Nội thất</p>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="admin-login-alert error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="admin-login-alert success" role="status">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="admin-input-group">
            <label htmlFor="admin-username">Tên đăng nhập hoặc Email</label>
            <div className="admin-input-field">
              <User size={18} className="field-icon" />
              <input
                id="admin-username"
                type="text"
                placeholder="Nhập username (ví dụ: admin01)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="admin-input-group">
            <div className="admin-label-row">
              <label htmlFor="admin-password">Mật khẩu bảo mật</label>
            </div>
            <div className="admin-input-field">
              <Lock size={18} className="field-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="admin-form-meta">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ phiên làm việc</span>
            </label>
          </div>

          <button
            type="submit"
            className="admin-login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-spinner" />
            ) : (
              <>
                <span>Đăng nhập Bảng điều khiển</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Accounts */}
        <div className="admin-quick-fill-section">
          <div className="quick-fill-divider">
            <span>Tài khoản kiểm thử nhanh (Demo)</span>
          </div>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="quick-fill-btn admin-role"
              onClick={() => handleQuickFill('admin01', '123456')}
            >
              <Sparkles size={14} />
              <div>
                <strong>admin01</strong>
                <small>Quyền ADMIN (MK: 123456)</small>
              </div>
            </button>
            <button
              type="button"
              className="quick-fill-btn staff-role"
              onClick={() => handleQuickFill('staff01', '123456')}
            >
              <Sparkles size={14} />
              <div>
                <strong>staff01</strong>
                <small>Quyền STAFF (MK: 123456)</small>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Back to Store */}
        <div className="admin-login-footer">
          <button
            type="button"
            className="admin-back-store-btn"
            onClick={onBackToStore}
          >
            <ArrowLeft size={15} />
            <span>Quay lại Cửa hàng FuniStore</span>
          </button>
        </div>
      </div>
    </div>
  )
}
