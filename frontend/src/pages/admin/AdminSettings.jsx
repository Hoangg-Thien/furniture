import React, { useState, useEffect } from 'react'
import {
  Settings,
  Store,
  CreditCard,
  Truck,
  Shield,
  Save,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Percent,
  Sliders,
  Database,
  Activity,
  HardDrive,
} from 'lucide-react'
import {
  fetchSystemSettings,
  saveSystemSettings,
  testBackendConnection,
} from '../../lib/admin'

const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam' },
  { code: 'MB', name: 'MBBank - Ngân hàng Quân Đội' },
  { code: 'TCB', name: 'Techcombank - Ngân hàng Kỹ Thương' },
  { code: 'BIDV', name: 'BIDV - Ngân hàng Đầu tư & Phát triển Việt Nam' },
  { code: 'ACB', name: 'ACB - Ngân hàng Á Châu' },
  { code: 'VPB', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng' },
  { code: 'TPB', name: 'TPBank - Ngân hàng Tiên Phong' },
  { code: 'VIB', name: 'VIB - Ngân hàng Quốc Tế' },
]

export default function AdminSettings({ showToast, activeRole = 'ADMIN' }) {
  const [activeTab, setActiveTab] = useState('STORE') // 'STORE' | 'PAYMENT' | 'SALES' | 'SYSTEM'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingPing, setTestingPing] = useState(false)
  const [pingResult, setPingResult] = useState(null)

  // Settings State
  const [settings, setSettings] = useState({
    store_name: 'FURNITURE Cung Đình & Hiện Đại',
    hotline: '0903 889 922',
    email: 'contact@furniture.vn',
    address: 'Số 123 Đại Lộ Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    warehouse_address: 'Kho Tổng Tân Tạo, Lô B2 KCN Tân Tạo, Quận Bình Tân, TP. Hồ Chí Minh',
    bank_name: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam',
    bank_code: 'VCB',
    bank_account_no: '998877665544',
    bank_account_owner: 'CONG TY TNHH NOI THAT FURNITURE',
    vietqr_template: 'compact2',
    transfer_syntax: 'FUNI {ORDER_ID}',
    free_shipping_threshold: 5000000,
    standard_shipping_fee: 150000,
    vat_rate: 8,
    allow_cod: true,
    allow_vietqr: true,
    maintenance_mode: false,
    allow_registration: true,
    auto_print_invoice: false,
    inventory_warning_threshold: 5,
  })

  // Load Settings from Backend API & Supabase
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { settings: loaded } = await fetchSystemSettings()
      if (loaded && Object.keys(loaded).length > 0) {
        setSettings((prev) => ({
          ...prev,
          ...loaded,
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleChange(key, val) {
    setSettings((prev) => ({
      ...prev,
      [key]: val,
    }))
  }

  async function handleSave(e) {
    if (e) e.preventDefault()
    setSaving(true)
    const res = await saveSystemSettings(settings)
    setSaving(false)

    if (res.success) {
      showToast('Đã lưu cấu hình cài đặt hệ thống thành công!')
    } else {
      showToast(`Lỗi khi lưu cài đặt: ${res.error || 'Thử lại'}`, 'error')
    }
  }

  async function handleTestConnection() {
    setTestingPing(true)
    const result = await testBackendConnection()
    setPingResult(result)
    setTestingPing(false)
    if (result.online) {
      showToast(`Kết nối Backend & Database hoạt động tốt (${result.pingMs}ms)`)
    } else {
      showToast('Không thể kết nối đến máy chủ Backend!', 'error')
    }
  }

  // Sample QR generator URL
  const sampleAmount = 15000000
  const sampleDes = settings.transfer_syntax.replace('{ORDER_ID}', 'DH1001')
  const qrUrl = `https://img.vietqr.io/image/${settings.bank_code}-${settings.bank_account_no}-${settings.vietqr_template}.png?amount=${sampleAmount}&addInfo=${encodeURIComponent(
    sampleDes
  )}&accountName=${encodeURIComponent(settings.bank_account_owner)}`

  return (
    <div>
      {/* Page Hero */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Cài Đặt Hệ Thống & Cấu Hình Vận Hành</h1>
          <p className="admin-page-subtitle">
            Quản trị thông tin thương hiệu showroom, tích hợp thanh toán VietQR ngân hàng, thiết lập phí vận chuyển và chính sách bán hàng.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleTestConnection}
            disabled={testingPing}
          >
            <Activity size={15} className={testingPing ? 'admin-spin' : ''} />
            Kiểm Tra Ping API
          </button>

          {activeRole === 'ADMIN' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} className={saving ? 'admin-spin' : ''} />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'STORE' ? 'active' : ''}`}
          onClick={() => setActiveTab('STORE')}
        >
          <Store size={15} />
          <span>Showroom & Thương Hiệu</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'PAYMENT' ? 'active' : ''}`}
          onClick={() => setActiveTab('PAYMENT')}
        >
          <CreditCard size={15} />
          <span>Thanh Toán & VietQR</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'SALES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SALES')}
        >
          <Truck size={15} />
          <span>Vận Chuyển, Thuế & Tồn Kho</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'SYSTEM' ? 'active' : ''}`}
          onClick={() => setActiveTab('SYSTEM')}
        >
          <Settings size={15} />
          <span>Vận Hành & Kết Nối API</span>
        </button>
      </div>

      {loading ? (
        <div className="admin-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-dim)' }}>
          <RefreshCw size={28} className="admin-spin" style={{ margin: '0 auto 12px' }} />
          <div>Đang tải cấu hình hệ thống từ Supabase Database...</div>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* TAB 1: STORE & SHOWROOM */}
          {activeTab === 'STORE' && (
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2 className="admin-panel-title">
                    <Building size={17} style={{ color: 'var(--admin-primary)' }} />
                    Thông Tin Showroom & Doanh Nghiệp
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Thông tin hiển thị trên tiêu đề website, chân trang hóa đơn và thông báo đặt hàng
                  </span>
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="admin-form-label">Tên Thương Hiệu Doanh Nghiệp *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="admin-form-label">
                      <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Hotline Hỗ Trợ Khách Hàng *
                    </label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      value={settings.hotline}
                      onChange={(e) => handleChange('hotline', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">
                      <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Email Liên Hệ & Nhận Đơn *
                    </label>
                    <input
                      type="email"
                      required
                      className="admin-form-input"
                      value={settings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-form-label">Địa Chỉ Showroom Trưng Bày Chính *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={settings.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Địa Chỉ Kho Hàng & Trung Tâm Xuất Hàng *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={settings.warehouse_address}
                    onChange={(e) => handleChange('warehouse_address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIETQR & BANKING */}
          {activeTab === 'PAYMENT' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2 className="admin-panel-title">
                      <CreditCard size={17} style={{ color: 'var(--admin-primary)' }} />
                      Cấu Hình Thanh Toán VietQR & Ngân Hàng
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                      Tự động tạo mã QR động có sẵn số tài khoản, số tiền và mã đơn hàng khi khách thanh toán
                    </span>
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label className="admin-form-label">Ngân Hàng Thụ Hưởng (Napas247) *</label>
                    <select
                      className="admin-form-input"
                      value={settings.bank_code}
                      onChange={(e) => {
                        const code = e.target.value
                        const b = VIETNAM_BANKS.find((item) => item.code === code)
                        handleChange('bank_code', code)
                        if (b) handleChange('bank_name', b.name)
                      }}
                    >
                      {VIETNAM_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          [{b.code}] {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-form-label">Số Tài Khoản Ngân Hàng *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      value={settings.bank_account_no}
                      onChange={(e) => handleChange('bank_account_no', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Tên Chủ Tài Khoản (In hoa không dấu) *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      value={settings.bank_account_owner}
                      onChange={(e) => handleChange('bank_account_owner', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="admin-form-label">Mẫu Giao Diện VietQR</label>
                      <select
                        className="admin-form-input"
                        value={settings.vietqr_template}
                        onChange={(e) => handleChange('vietqr_template', e.target.value)}
                      >
                        <option value="compact2">Compact 2 (Gọn nhẹ, có logo)</option>
                        <option value="compact">Compact (Tối giản)</option>
                        <option value="qr_only">QR Only (Chỉ mã QR)</option>
                        <option value="print">Print (Khổ A4/In hóa đơn)</option>
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label">Cú Pháp Chuyển Khoản *</label>
                      <input
                        type="text"
                        required
                        className="admin-form-input"
                        value={settings.transfer_syntax}
                        onChange={(e) => handleChange('transfer_syntax', e.target.value)}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                        Dùng {'{ORDER_ID}'} để tự thay bằng mã đơn hàng thực tế
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', padding: '14px', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Phương Thức Cho Phép:</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '6px' }}>
                      <input
                        type="checkbox"
                        checked={settings.allow_vietqr}
                        onChange={(e) => handleChange('allow_vietqr', e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--admin-primary)' }}
                      />
                      <span>Bật thanh toán chuyển khoản qua quét mã VietQR</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.allow_cod}
                        onChange={(e) => handleChange('allow_cod', e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--admin-primary)' }}
                      />
                      <span>Bật thanh toán tiền mặt khi giao nhận hàng (COD)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW OF VIETQR */}
              <div className="admin-panel" style={{ height: 'fit-content' }}>
                <div className="admin-panel-header">
                  <h3 className="admin-panel-title">
                    <QrCode size={16} style={{ color: 'var(--admin-primary)' }} />
                    Xem Trước Mã VietQR Thực Tế
                  </h3>
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <img
                    src={qrUrl}
                    alt="VietQR Preview"
                    style={{
                      maxWidth: '240px',
                      width: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                  <div style={{ marginTop: '16px', fontSize: '12.5px', color: 'var(--admin-text-dim)' }}>
                    Cú pháp test: <strong>{sampleDes}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                    Mã QR này sẽ hiển thị trực tiếp trên trang Checkout & Hóa đơn khách hàng
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHIPPING, TAX & INVENTORY */}
          {activeTab === 'SALES' && (
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2 className="admin-panel-title">
                    <Truck size={17} style={{ color: 'var(--admin-primary)' }} />
                    Chính Sách Vận Chuyển, Thuế VAT & Cảnh Báo Kho
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Quy định mức tính phí ship, thuế giá trị gia tăng và hạn mức cảnh báo số lượng tồn
                  </span>
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="admin-form-label">Ngưỡng Miễn Phí Vận Chuyển (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50000"
                      className="admin-form-input"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => handleChange('free_shipping_threshold', Number(e.target.value))}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                      Đơn hàng đạt từ mức này trở lên sẽ được miễn phí giao lắp tận nơi (Freeship).
                    </div>
                  </div>

                  <div>
                    <label className="admin-form-label">Phí Giao Hàng Tiêu Chuẩn (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10000"
                      className="admin-form-input"
                      value={settings.standard_shipping_fee}
                      onChange={(e) => handleChange('standard_shipping_fee', Number(e.target.value))}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                      Áp dụng cho các đơn hàng chưa đạt ngưỡng miễn phí ship.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="admin-form-label">
                      <Percent size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Thuế Suất VAT Bán Lẻ Mặc Định (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="20"
                      className="admin-form-input"
                      value={settings.vat_rate}
                      onChange={(e) => handleChange('vat_rate', Number(e.target.value))}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                      Mức thuế GTGT tiêu chuẩn hiển thị trên hóa đơn (mặc định 8% hoặc 10%).
                    </div>
                  </div>

                  <div>
                    <label className="admin-form-label">Ngưỡng Cảnh Báo Tồn Kho Thấp (Sản phẩm) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="admin-form-input"
                      value={settings.inventory_warning_threshold}
                      onChange={(e) => handleChange('inventory_warning_threshold', Number(e.target.value))}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '3px' }}>
                      Sản phẩm có số lượng tồn kho nhỏ hơn mức này sẽ được gắn cờ báo động.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM OPERATIONS & MAINTENANCE */}
          {activeTab === 'SYSTEM' && (
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2 className="admin-panel-title">
                    <Sliders size={17} style={{ color: 'var(--admin-primary)' }} />
                    Trạng Thái Vận Hành & Bảo Mật Hệ Thống
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Quản lý cơ chế đóng/mở hệ thống và tình trạng kết nối cơ sở dữ liệu
                  </span>
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '16px', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#DC2626' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: settings.maintenance_mode ? '#DC2626' : 'var(--admin-text-main)' }}>
                        Kích Hoạt Chế Độ Bảo Trì Hệ Thống (Maintenance Mode)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        Khi bật, khách hàng ngoài trang chủ sẽ nhận được thông báo hệ thống đang nâng cấp. Chỉ tài khoản ADMIN mới có quyền truy cập.
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ padding: '16px', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.allow_registration}
                      onChange={(e) => handleChange('allow_registration', e.target.checked)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--admin-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--admin-text-main)' }}>
                        Cho Phép Khách Hàng Mới Đăng Ký Tài Khoản
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        Bật hoặc tắt tính năng tạo tài khoản mới từ trang đăng ký người dùng.
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ padding: '16px', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.auto_print_invoice}
                      onChange={(e) => handleChange('auto_print_invoice', e.target.checked)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--admin-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--admin-text-main)' }}>
                        Tự Động Xuất Hóa Đơn Khi Duyệt Đơn Hàng
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                        Tự động sinh mã hóa đơn điện tử ngay khi quản trị viên chuyển trạng thái đơn hàng sang CONFIRMED.
                      </div>
                    </div>
                  </label>
                </div>

                {/* API & DATABASE HEALTH CARD */}
                <div style={{ marginTop: '10px', padding: '18px', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <Database size={16} style={{ color: 'var(--admin-primary)' }} />
                      Trạng Thái Hạ Tầng Backend & Supabase
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      onClick={handleTestConnection}
                      disabled={testingPing}
                    >
                      <RefreshCw size={12} className={testingPing ? 'admin-spin' : ''} /> Thử lại
                    </button>
                  </div>

                  {pingResult ? (
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {pingResult.online ? (
                        <>
                          <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                          <span style={{ color: '#16A34A', fontWeight: 600 }}>Đang kết nối bình thường</span>
                          <span style={{ color: 'var(--admin-text-dim)' }}>— Độ trễ: {pingResult.pingMs}ms ({pingResult.url})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} style={{ color: '#DC2626' }} />
                          <span style={{ color: '#DC2626', fontWeight: 600 }}>Mất kết nối máy chủ</span>
                          <span style={{ color: 'var(--admin-text-dim)' }}>— {pingResult.error}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: 'var(--admin-text-dim)' }}>
                      Bấm nút "Kiểm Tra Ping API" để kiểm tra độ trễ phản hồi từ Spring Boot và PostgreSQL Supabase.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              <Save size={16} className={saving ? 'admin-spin' : ''} />
              {saving ? 'Đang lưu...' : 'Lưu Tất Cả Cài Đặt'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
