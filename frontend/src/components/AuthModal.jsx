import { useState } from 'react'
import { LogIn, UserPlus, X, User, Lock, Mail, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { loginUser, registerUser } from '../lib/auth'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  if (!isOpen) return null

  function resetForm() {
    setError('')
    setSuccess('')
    setUsername('')
    setPassword('')
    setFullName('')
    setEmail('')
    setPhone('')
    setAddress('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        if (!username.trim() || !password.trim()) {
          setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.')
          setLoading(false)
          return
        }

        const { user, error: loginErr } = await loginUser(username.trim(), password)
        if (loginErr) {
          setError(loginErr)
        } else {
          setSuccess(`Chào mừng trở lại, ${user.fullName || user.username}!`)
          setTimeout(() => {
            onAuthSuccess(user)
            onClose()
            resetForm()
          }, 800)
        }
      } else {
        if (!fullName.trim() || !username.trim() || !password.trim()) {
          setError('Vui lòng điền họ tên, tên đăng nhập và mật khẩu.')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Mật khẩu cần tối thiểu 6 ký tự.')
          setLoading(false)
          return
        }

        const { user, error: regErr } = await registerUser({
          username: username.trim(),
          password,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
        })

        if (regErr) {
          setError(regErr)
        } else {
          setSuccess('Đăng ký tài khoản thành công!')
          setTimeout(() => {
            onAuthSuccess(user)
            onClose()
            resetForm()
          }, 800)
        }
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('login')
              setError('')
              setSuccess('')
            }}
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('register')
              setError('')
              setSuccess('')
            }}
          >
            <UserPlus size={16} />
            <span>Đăng ký</span>
          </button>
        </div>

        <h2 className="auth-modal-title">
          {mode === 'login' ? 'Đăng nhập tài khoản khách hàng' : 'Tạo tài khoản thành viên'}
        </h2>
        <p className="auth-modal-subtitle">
          {mode === 'login'
            ? 'Đăng nhập để theo dõi giỏ hàng và hưởng ưu đãi dành cho thành viên'
            : 'Đăng ký nhanh chóng để nhận tư vấn và mua sắm dễ dàng tại Nếp Living'}
        </p>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label>Họ và tên <span className="req">*</span></label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-icon" />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Tên đăng nhập <span className="req">*</span></label>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-icon" />
              <input
                type="text"
                placeholder={mode === 'login' ? 'Tên đăng nhập hoặc Email' : 'Ví dụ: annguyen99'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Mật khẩu <span className="req">*</span></label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-icon" />
              <input
                type="password"
                placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu của bạn'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="auth-field">
                <label>Email liên hệ</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Số điện thoại</label>
                <div className="auth-input-wrapper">
                  <Phone size={16} className="auth-icon" />
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Địa chỉ giao hàng</label>
                <div className="auth-input-wrapper">
                  <MapPin size={16} className="auth-icon" />
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận/huyện, thành phố"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              'Đang xử lý...'
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Đăng nhập</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Đăng ký tài khoản</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

