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
  ChevronDown,
} from 'lucide-react'
import { loginAdmin } from '../lib/auth'
import './AdminLoginPage.css'

export default function AdminLoginPage({ onLoginSuccess, onBackToStore }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    } catch {
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
    <main className="admin-login-wrapper">
      <header className="admin-login-topbar">
        <a className="admin-login-brand" href="/" onClick={event => { event.preventDefault(); onBackToStore() }} aria-label="FuniStore — về cửa hàng">funi<span>.</span></a>
        <button type="button" className="admin-back-store-btn" onClick={onBackToStore}><ArrowLeft size={16} /> Về cửa hàng</button>
      </header>
      <div className="admin-login-layout">
        <aside className="admin-login-story" aria-label="Không gian FuniStore">
          <span className="admin-login-eyebrow">NỘI THẤT CHO NHỮNG NGÀY AN YÊN</span>
          <h2>Không gian đẹp,<br />khởi đầu <em>an yên.</em></h2>
          <p>Một chút chăm chút mỗi ngày,<br />một trải nghiệm tốt hơn cho khách hàng.</p>
          <svg className="admin-login-illustration" viewBox="0 0 520 330" fill="none" aria-hidden="true">
            <path d="M105 250V115a85 85 0 0 1 170 0v135" fill="#dce5d7" />
            <path d="M190 33v216M108 130h164" stroke="#fafbf6" strokeWidth="5" />
            <path d="M73 275h380" stroke="#d1d9cb" strokeWidth="2" />
            <ellipse cx="275" cy="285" rx="122" ry="13" fill="#dce1d4" />
            <path d="m229 256-12 30m130-30 12 30" stroke="#8c7055" strokeWidth="10" strokeLinecap="round" />
            <rect x="214" y="130" width="146" height="125" rx="40" fill="#839d83" />
            <rect x="205" y="215" width="169" height="48" rx="22" fill="#466951" />
            <rect x="193" y="188" width="31" height="65" rx="15" fill="#608264" />
            <rect x="353" y="188" width="31" height="65" rx="15" fill="#608264" />
            <rect x="240" y="150" width="91" height="62" rx="20" transform="rotate(-7 240 150)" fill="#f0e5d0" />
            <path d="M113 228v-90m0 47-22-24m22 7 21-27" stroke="#788b61" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="85" cy="150" rx="11" ry="21" transform="rotate(-42 85 150)" fill="#97aa7e" />
            <ellipse cx="139" cy="128" rx="11" ry="23" transform="rotate(35 139 128)" fill="#788f69" />
            <ellipse cx="112" cy="123" rx="10" ry="23" fill="#a6b794" />
            <path d="m91 223 6 51h34l7-51" fill="#c6a88c" />
            <path d="M404 193v82m-26-80h52" stroke="#a28b70" strokeWidth="5" strokeLinecap="round" />
            <path d="m384 168-8 25h56l-10-25" fill="#e8dcc6" />
            <circle cx="411" cy="164" r="10" fill="#c4ad8c" />
          </svg>
          <div className="admin-login-story-footer"><span className="admin-login-story-line" /> TỪNG CHI TIẾT NHỎ. MỖI NGÀY TỐT HƠN.</div>
        </aside>

        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <header className="admin-login-header">
            <span className="admin-login-portal-label"><ShieldCheck size={15} /> KHÔNG GIAN QUẢN TRỊ</span>
            <h1 id="admin-login-title">Chào mừng trở lại<span>.</span></h1>
            <p>Đăng nhập để tiếp tục công việc tại FuniStore.</p>
          </header>

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
              <label htmlFor="admin-username">Tên đăng nhập hoặc email</label>
              <div className="admin-input-field">
                <User size={18} className="field-icon" />
                <input
                  id="admin-username"
                  type="text"
                  placeholder="Ví dụ: admin01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                />
              </div>
            </div>

            <div className="admin-input-group">
              <div className="admin-label-row">
                <label htmlFor="admin-password">Mật khẩu</label>
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
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <><span className="btn-loading-spinner" aria-hidden="true" /><span>Đang đăng nhập...</span></>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Accounts */}
          <details className="admin-quick-fill-section">
            <summary>Tài khoản thực hành <ChevronDown size={15} /></summary>
            <p>Điền nhanh tài khoản demo của đồ án.</p>
            <div className="quick-fill-buttons">
              <button
                type="button"
                className="quick-fill-btn admin-role"
                onClick={() => handleQuickFill('admin01', '123456')}
              >
                <div>
                  <strong>Quản trị viên</strong>
                  <small>admin01 · 123456</small>
                </div>
              </button>
              <button
                type="button"
                className="quick-fill-btn staff-role"
                onClick={() => handleQuickFill('staff01', '123456')}
              >
                <div>
                  <strong>Nhân viên</strong>
                  <small>staff01 · 123456</small>
                </div>
              </button>
            </div>
          </details>

          <p className="admin-login-access-note"><Lock size={13} /> Dành cho quản trị viên và nhân viên FuniStore.</p>
        </section>
      </div>
      <footer className="admin-login-page-footer"><span>© FuniStore</span><span>Chăm chút không gian, nâng niu trải nghiệm.</span></footer>
    </main>
  )
}
