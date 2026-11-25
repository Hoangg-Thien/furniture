import { useState } from 'react'
import { LogIn, UserPlus, X, User, Lock, Mail, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { loginUser, registerUser } from '../../lib/auth'
import { getAllProvinces, VIETNAM_LOCATIONS } from '../lib/vietnamLocations'

const provinces = getAllProvinces()

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
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')
  const [otherDistrict, setOtherDistrict] = useState('')
  const [otherWard, setOtherWard] = useState('')
  const districts = VIETNAM_LOCATIONS.find(location => location.name === city)?.districts ?? []
  const wards = districts.find(location => location.name === district)?.wards ?? []

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
    setCity('')
    setDistrict('')
    setWard('')
    setOtherDistrict('')
    setOtherWard('')
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
        const addressParts = [address, ward === 'other' ? otherWard : ward, district === 'other' ? otherDistrict : district, city].map(part => part.trim())
        if (!email.trim() || !phone.trim() || addressParts.some(part => !part)) {
          setError('Vui lòng điền email, số điện thoại và đầy đủ địa chỉ giao hàng.')
          return
        }

        const registeredUsername = username.trim()
        const { error: regErr } = await registerUser({
          username: registeredUsername,
          password,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: addressParts.join(', '),
        })

        if (regErr) {
          setError(regErr)
        } else {
          resetForm()
          setUsername(registeredUsername)
          setMode('login')
          setSuccess('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.')
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
        <div className="auth-modal-header">
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
          <button
            className="auth-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        <h2 className="auth-modal-title">
          {mode === 'login' ? 'Đăng nhập tài khoản khách hàng' : 'Tạo tài khoản thành viên'}
        </h2>
        <p className="auth-modal-subtitle">
          {mode === 'login'
            ? 'Đăng nhập để theo dõi giỏ hàng và hưởng ưu đãi dành cho thành viên'
            : 'Đăng ký nhanh chóng để nhận tư vấn và mua sắm dễ dàng tại FuniStore'}
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
                <label htmlFor="register-email">Email liên hệ <span className="req">*</span></label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-icon" />
                  <input
                    type="email"
                    id="register-email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-phone">Số điện thoại <span className="req">*</span></label>
                <div className="auth-input-wrapper">
                  <Phone size={16} className="auth-icon" />
                  <input
                    type="tel"
                    id="register-phone"
                    required
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <fieldset className="auth-address">
                <legend>Địa chỉ giao hàng <span className="req">*</span></legend>
                <div className="auth-field">
                  <label htmlFor="register-city">Tỉnh / Thành phố</label>
                  <select id="register-city" className="account-select" required value={city} onChange={event => {
                    setCity(event.target.value)
                    setDistrict('')
                    setWard('')
                    setOtherDistrict('')
                    setOtherWard('')
                  }}>
                    <option value="">Chọn tỉnh hoặc thành phố</option>
                    {provinces.map(province => <option key={province}>{province}</option>)}
                  </select>
                </div>
                <div className="auth-field">
                  <label htmlFor="register-district">Quận / Huyện</label>
                  <select id="register-district" className="account-select" required disabled={!city} value={district} onChange={event => {
                    setDistrict(event.target.value)
                    setWard('')
                    setOtherDistrict('')
                    setOtherWard('')
                  }}>
                    <option value="">{city ? 'Chọn quận hoặc huyện' : 'Chọn tỉnh hoặc thành phố trước'}</option>
                    {districts.map(({ name }) => <option key={name}>{name}</option>)}
                    <option value="other">Khác (nhập tên)</option>
                  </select>
                  {district === 'other' && <input aria-label="Tên quận hoặc huyện" placeholder="Nhập tên quận hoặc huyện" className="account-select" required value={otherDistrict} onChange={event => setOtherDistrict(event.target.value)} />}
                </div>
                <div className="auth-field">
                  <label htmlFor="register-ward">Phường / Xã</label>
                  <select id="register-ward" className="account-select" required disabled={!district} value={ward} onChange={event => {
                    setWard(event.target.value)
                    setOtherWard('')
                  }}>
                    <option value="">{district ? 'Chọn phường hoặc xã' : 'Chọn quận hoặc huyện trước'}</option>
                    {wards.map(name => <option key={name}>{name}</option>)}
                    <option value="other">Khác (nhập tên)</option>
                  </select>
                  {ward === 'other' && <input aria-label="Tên phường hoặc xã" placeholder="Nhập tên phường hoặc xã" className="account-select" required value={otherWard} onChange={event => setOtherWard(event.target.value)} />}
                </div>
                <label htmlFor="register-street">Số nhà, tên đường</label>
                <div className="auth-input-wrapper">
                  <MapPin size={16} className="auth-icon" />
                  <input
                    type="text"
                    id="register-street"
                    required
                    autoComplete="street-address"
                    placeholder="VD: 123 Nguyễn Thị Minh Khai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </fieldset>
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

