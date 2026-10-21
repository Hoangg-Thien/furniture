import { useState } from 'react'
import { X, User, Mail, Phone, MapPin, Lock, Check, AlertCircle, Pencil } from 'lucide-react'
import { updateProfile } from '../lib/auth'
import { getAllProvinces, getDistricts, getWards } from '../lib/vietnamLocations'

export default function AccountModal({ isOpen, user, onClose, onUserUpdate }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [accCity, setAccCity] = useState('TP. Hồ Chí Minh')
  const [accDistrict, setAccDistrict] = useState('')
  const [accWard, setAccWard] = useState('')
  const [streetDetail, setStreetDetail] = useState('')

  const provinces = getAllProvinces()
  const districts = getDistricts(accCity)
  const wards = getWards(accCity, accDistrict)

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  if (!isOpen || !user) return null

  function startEdit() {
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setEditing(true)
    setSuccessMsg('')
    setErrorMsg('')
    setShowPasswordSection(false)
    setStreetDetail(user.address || '')
  }


  function handleAccCityChange(e) {
    const newCity = e.target.value
    setAccCity(newCity)
    setAccDistrict('')
    setAccWard('')
    const parts = [streetDetail, newCity].filter(Boolean)
    setForm((prev) => ({ ...prev, address: parts.join(', ') }))
  }

  function handleAccDistrictChange(e) {
    const newDist = e.target.value
    setAccDistrict(newDist)
    setAccWard('')
    const parts = [streetDetail, newDist, accCity].filter(Boolean)
    setForm((prev) => ({ ...prev, address: parts.join(', ') }))
  }

  function handleAccWardChange(e) {
    const newWard = e.target.value
    setAccWard(newWard)
    const parts = [streetDetail, newWard, accDistrict, accCity].filter(Boolean)
    setForm((prev) => ({ ...prev, address: parts.join(', ') }))
  }

  function handleStreetChange(e) {
    const newStreet = e.target.value
    setStreetDetail(newStreet)
    const parts = [newStreet, accWard, accDistrict, accCity].filter(Boolean)
    setForm((prev) => ({ ...prev, address: parts.join(', ') }))
  }

  function cancelEdit() {
    setEditing(false)
    setErrorMsg('')
    setShowPasswordSection(false)
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!form.fullName.trim()) {
      setErrorMsg('Họ và tên không được để trống')
      return
    }
    if (showPasswordSection && form.newPassword) {
      if (form.newPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không khớp')
        return
      }
    }

    setSaving(true)
    const { user: updated, error } = await updateProfile(user.userId, {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      currentPassword: showPasswordSection ? form.currentPassword : undefined,
      newPassword: showPasswordSection ? form.newPassword : undefined,
    })
    setSaving(false)

    if (error) {
      setErrorMsg(error)
    } else {
      onUserUpdate(updated)
      setEditing(false)
      setShowPasswordSection(false)
      setSuccessMsg('Cập nhật thông tin thành công!')
      setTimeout(() => setSuccessMsg(''), 3500)
    }
  }

  const avatarLetter = (user.fullName || user.username || 'U').charAt(0).toUpperCase()

  return (
    <div className="account-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="account-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="account-modal-header">
          <h2 className="account-modal-title">Tài khoản của tôi</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Avatar + tên */}
        <div className="account-avatar-section">
          <div className="account-avatar-circle">{avatarLetter}</div>
          <div className="account-avatar-info">
            <p className="account-avatar-name">{user.fullName || user.username}</p>
            <p className="account-avatar-username">@{user.username}</p>
          </div>
          {!editing && (
            <button className="account-edit-btn" type="button" onClick={startEdit}>
              <Pencil size={14} /> Chỉnh sửa
            </button>
          )}
        </div>

        {/* Thông báo */}
        {successMsg && (
          <div className="account-alert success">
            <Check size={15} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="account-alert error">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Chế độ XEM */}
        {!editing && (
          <div className="account-info-list">
            <div className="account-info-row">
              <span className="account-info-label"><User size={14} /> Tên đăng nhập</span>
              <span className="account-info-value">{user.username}</span>
            </div>
            <div className="account-info-row">
              <span className="account-info-label"><User size={14} /> Họ và tên</span>
              <span className="account-info-value">{user.fullName || <em className="muted">Chưa cập nhật</em>}</span>
            </div>
            <div className="account-info-row">
              <span className="account-info-label"><Mail size={14} /> Email</span>
              <span className="account-info-value">{user.email || <em className="muted">Chưa cập nhật</em>}</span>
            </div>
            <div className="account-info-row">
              <span className="account-info-label"><Phone size={14} /> Số điện thoại</span>
              <span className="account-info-value">{user.phone || <em className="muted">Chưa cập nhật</em>}</span>
            </div>
            <div className="account-info-row">
              <span className="account-info-label"><MapPin size={14} /> Địa chỉ</span>
              <span className="account-info-value">{user.address || <em className="muted">Chưa cập nhật</em>}</span>
            </div>
          </div>
        )}

        {/* Chế độ CHỈNH SỬA */}
        {editing && (
          <form className="account-edit-form" onSubmit={handleSave}>
            <div className="account-form-group">
              <label htmlFor="acc-fullName"><User size={13} /> Họ và tên</label>
              <input
                id="acc-fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                autoFocus
              />
            </div>
            <div className="account-form-group">
              <label htmlFor="acc-email"><Mail size={13} /> Email</label>
              <input
                id="acc-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Nhập email"
              />
            </div>
            <div className="account-form-group">
              <label htmlFor="acc-phone"><Phone size={13} /> Số điện thoại</label>
              <input
                id="acc-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="account-location-picker">
              <label className="account-location-title"><MapPin size={13} /> Địa chỉ giao hàng</label>
              <div className="account-location-grid">
                <div className="account-form-group">
                  <label htmlFor="acc-city-select">Tỉnh / Thành phố</label>
                  <select
                    id="acc-city-select"
                    value={accCity}
                    onChange={handleAccCityChange}
                    className="account-select"
                  >
                    <option value="">-- Chọn Tỉnh / TP --</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="account-form-group">
                  <label htmlFor="acc-dist-select">Quận / Huyện</label>
                  <select
                    id="acc-dist-select"
                    value={accDistrict}
                    onChange={handleAccDistrictChange}
                    disabled={!accCity}
                    className="account-select"
                  >
                    <option value="">{accCity ? '-- Chọn Quận / Huyện --' : '-- Chọn Tỉnh trước --'}</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="account-form-group">
                  <label htmlFor="acc-ward-select">Phường / Xã</label>
                  <select
                    id="acc-ward-select"
                    value={accWard}
                    onChange={handleAccWardChange}
                    disabled={!accDistrict}
                    className="account-select"
                  >
                    <option value="">{accDistrict ? '-- Chọn Phường / Xã --' : '-- Chọn Quận trước --'}</option>
                    {wards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="account-form-group" style={{ marginTop: '10px' }}>
                <label htmlFor="acc-street">Số nhà, tên đường</label>
                <input
                  id="acc-street"
                  type="text"
                  value={streetDetail}
                  onChange={handleStreetChange}
                  placeholder="VD: 123 Nguyễn Thị Minh Khai"
                />
              </div>

              <div className="account-form-group" style={{ marginTop: '6px' }}>
                <label htmlFor="acc-address" style={{ fontSize: '11px', color: '#666' }}>Địa chỉ hoàn chỉnh:</label>
                <input
                  id="acc-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ giao hàng hoàn chỉnh"
                />
              </div>
            </div>

            {/* Toggle đổi mật khẩu */}
            <button
              type="button"
              className="account-toggle-password-btn"
              onClick={() => setShowPasswordSection((v) => !v)}
            >
              <Lock size={13} />
              {showPasswordSection ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
            </button>

            {showPasswordSection && (
              <div className="account-password-section">
                <div className="account-form-group">
                  <label htmlFor="acc-curPwd"><Lock size={13} /> Mật khẩu hiện tại</label>
                  <input
                    id="acc-curPwd"
                    name="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div className="account-form-group">
                  <label htmlFor="acc-newPwd"><Lock size={13} /> Mật khẩu mới</label>
                  <input
                    id="acc-newPwd"
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div className="account-form-group">
                  <label htmlFor="acc-confirmPwd"><Lock size={13} /> Xác nhận mật khẩu mới</label>
                  <input
                    id="acc-confirmPwd"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
            )}

            <div className="account-form-actions">
              <button type="button" className="account-cancel-btn" onClick={cancelEdit}>
                Hủy
              </button>
              <button type="submit" className="account-save-btn" disabled={saving}>
                {saving ? 'Đang lưu...' : <><Check size={14} /> Lưu thay đổi</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

