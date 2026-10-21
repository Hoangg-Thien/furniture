import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Tag,
  Search,
  Check,
  Copy,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  TrendingDown,
  Gift,
  Store,
  Layers,
} from 'lucide-react'
import {
  fetchActiveVouchers,
  fetchAllVouchersForAdmin,
  approveVoucherApi,
  rejectVoucherApi,
  createVoucherApi,
} from '../lib/vouchers'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price || 0)}₫`

export default function VouchersModal({
  isOpen,
  onClose,
  currentUser,
  onUseVoucher,
  onOpenStore,
}) {
  const isAdmin = currentUser?.role === 'ADMIN'
  const isStaff = currentUser?.role === 'STAFF'
  const canManageVouchers = isAdmin || isStaff

  const [activeTab, setActiveTab] = useState('KHO') // 'KHO' | 'DUYET' | 'CREATE'
  const [activeVouchers, setActiveVouchers] = useState([])
  const [adminVouchers, setAdminVouchers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)
  const [actionAlert, setActionAlert] = useState(null) // { type: 'success'|'error', message: '' }
  const [processingId, setProcessingId] = useState(null)

  // Form tạo voucher mới
  const [createForm, setCreateForm] = useState({
    programName: '',
    description: '',
    code: '',
    discountPercent: 10,
    minimumAmount: 5000000,
    maximumDiscount: 500000,
    quantity: 100,
    startDate: new Date().toISOString().slice(0, 10) + ' 00:00:00',
    endDate: '2026-12-31 23:59:59',
    autoApprove: isAdmin, // Nếu là Admin thì có thể tự động duyệt ngay
  })
  const [creating, setCreating] = useState(false)

  // Tải dữ liệu voucher
  const loadData = async () => {
    setLoading(true)
    const [activeRes, adminRes] = await Promise.all([
      fetchActiveVouchers(),
      canManageVouchers ? fetchAllVouchersForAdmin() : Promise.resolve({ vouchers: [] }),
    ])
    setActiveVouchers(activeRes.vouchers || [])
    if (adminRes.vouchers) {
      setAdminVouchers(adminRes.vouchers || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
      setActionAlert(null)
      setCopiedCode(null)
    }
  }, [isOpen, canManageVouchers])

  // Xử lý sao chép mã
  const handleCopy = (code) => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  // Xử lý áp dụng voucher ngay
  const handleApplyNow = (voucher) => {
    if (onUseVoucher) {
      onUseVoucher(voucher.code)
    }
    onClose()
  }

  // Admin duyệt voucher
  const handleApprove = async (voucherId) => {
    setProcessingId(voucherId)
    const res = await approveVoucherApi(voucherId)
    setProcessingId(null)
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message })
      await loadData()
      setTimeout(() => setActionAlert(null), 4000)
    } else {
      setActionAlert({ type: 'error', message: res.error })
    }
  }

  // Admin từ chối voucher
  const handleReject = async (voucherId) => {
    if (!window.confirm('Bạn có chắc muốn từ chối / ngừng áp dụng voucher này không?')) return
    setProcessingId(voucherId)
    const res = await rejectVoucherApi(voucherId)
    setProcessingId(null)
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message })
      await loadData()
      setTimeout(() => setActionAlert(null), 4000)
    } else {
      setActionAlert({ type: 'error', message: res.error })
    }
  }

  // Xử lý tạo voucher mới
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.code.trim()) {
      alert('Vui lòng nhập mã voucher')
      return
    }
    setCreating(true)
    const res = await createVoucherApi(createForm)
    setCreating(false)
    if (res.voucher) {
      setActionAlert({ type: 'success', message: res.voucher.message })
      setCreateForm({
        programName: '',
        description: '',
        code: '',
        discountPercent: 10,
        minimumAmount: 5000000,
        maximumDiscount: 500000,
        quantity: 100,
        startDate: new Date().toISOString().slice(0, 10) + ' 00:00:00',
        endDate: '2026-12-31 23:59:59',
        autoApprove: isAdmin,
      })
      await loadData()
      setActiveTab(isAdmin ? 'KHO' : 'DUYET')
      setTimeout(() => setActionAlert(null), 4000)
    } else {
      setActionAlert({ type: 'error', message: res.error })
    }
  }

  // Lọc voucher trong kho
  const filteredActiveVouchers = useMemo(() => {
    if (!searchTerm.trim()) return activeVouchers
    const q = searchTerm.trim().toLowerCase()
    return activeVouchers.filter(
      (v) =>
        (v.code || '').toLowerCase().includes(q) ||
        (v.program_name || '').toLowerCase().includes(q) ||
        (v.program_description || '').toLowerCase().includes(q)
    )
  }, [activeVouchers, searchTerm])

  // Voucher chờ duyệt của Admin
  const pendingVouchers = useMemo(() => {
    return adminVouchers.filter((v) => v.approval_state === 'PENDING_APPROVAL')
  }, [adminVouchers])

  if (!isOpen) return null

  return (
    <div className="vouchers-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vouchers-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <header className="vouchers-header">
          <div className="vouchers-title-group">
            <div className="vouchers-icon-badge">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="vouchers-title">Kho Voucher & Ưu Đãi</h2>
              <p className="vouchers-subtitle">
                Thu thập và sử dụng mã giảm giá độc quyền từ FuniStore
              </p>
            </div>
          </div>
          <button
            className="vouchers-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </header>

        {/* Thanh Tabs & Navigation */}
        <div className="vouchers-toolbar">
          <div className="vouchers-tabs">
            <button
              type="button"
              className={`vouchers-tab ${activeTab === 'KHO' ? 'active' : ''}`}
              onClick={() => setActiveTab('KHO')}
            >
              <Gift size={16} />
              <span>Kho Voucher Khách Hàng</span>
              {activeVouchers.length > 0 && (
                <span className="vouchers-tab-badge">{activeVouchers.length}</span>
              )}
            </button>

            {canManageVouchers && (
              <button
                type="button"
                className={`vouchers-tab ${activeTab === 'DUYET' ? 'active' : ''}`}
                onClick={() => setActiveTab('DUYET')}
              >
                <ShieldCheck size={16} />
                <span>Duyệt Voucher Cửa Hàng</span>
                {pendingVouchers.length > 0 && (
                  <span className="vouchers-tab-badge alert">{pendingVouchers.length}</span>
                )}
              </button>
            )}

            {canManageVouchers && (
              <button
                type="button"
                className={`vouchers-tab ${activeTab === 'CREATE' ? 'active' : ''}`}
                onClick={() => setActiveTab('CREATE')}
              >
                <Plus size={16} />
                <span>Tạo Voucher Mới</span>
              </button>
            )}
          </div>

          {activeTab === 'KHO' && (
            <div className="vouchers-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Tìm mã voucher hoặc chương trình ưu đãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="vouchers-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thông báo Alert */}
        {actionAlert && (
          <div className={`vouchers-alert ${actionAlert.type}`}>
            {actionAlert.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{actionAlert.message}</span>
          </div>
        )}

        {/* Nội dung chính Modal */}
        <div className="vouchers-content">
          {loading ? (
            <div className="vouchers-loading">
              <div className="vouchers-spinner" />
              <p>Đang tải thông tin ưu đãi...</p>
            </div>
          ) : activeTab === 'KHO' ? (
            /* TAB 1: KHO VOUCHER KHÁCH HÀNG */
            <div className="vouchers-grid-list">
              {filteredActiveVouchers.length === 0 ? (
                <div className="vouchers-empty-state">
                  <Gift size={52} strokeWidth={1.3} />
                  <h3>Chưa tìm thấy voucher phù hợp</h3>
                  <p>
                    Các mã giảm giá mới đang được FuniStore chuẩn bị. Bạn hãy ghé lại sau nhé!
                  </p>
                  {onOpenStore && (
                    <button
                      type="button"
                      className="vouchers-shop-now-btn"
                      onClick={() => {
                        onClose()
                        onOpenStore()
                      }}
                    >
                      Dạo xem sản phẩm ngay
                    </button>
                  )}
                </div>
              ) : (
                filteredActiveVouchers.map((voucher) => {
                  const minAmt = Number(voucher.minimum_amount || 0)
                  const maxDisc = Number(voucher.maximum_discount || 0)
                  const pct = Number(voucher.discount_percent || 0)
                  const remaining = Number(voucher.remaining_quantity || 0)
                  const totalQty = Number(voucher.quantity || 100)
                  const is500kSpecial = voucher.code === 'FUNI500K' || voucher.code === 'NEP500K' || maxDisc >= 500000

                  return (
                    <article
                      className={`voucher-card ${is500kSpecial ? 'voucher-card--highlight' : ''}`}
                      key={voucher.id}
                    >
                      {/* Cột trái: Giá trị giảm */}
                      <div className="voucher-left-col">
                        {is500kSpecial && (
                          <span className="voucher-ribbon-tag">Hot Funi</span>
                        )}
                        <div className="voucher-discount-val">
                          {maxDisc > 0 && pct >= 10 ? (
                            <>
                              <span className="unit">Giảm</span>
                              <strong>{formatPrice(maxDisc).replace('₫', '')}</strong>
                              <span className="currency">₫</span>
                            </>
                          ) : (
                            <>
                              <span className="unit">Giảm</span>
                              <strong>{pct}%</strong>
                            </>
                          )}
                        </div>
                        <span className="voucher-type-label">MÃ GIẢM GIÁ</span>
                      </div>

                      {/* Rãnh răng cưa ngăn cách phong cách vé voucher */}
                      <div className="voucher-ticket-divider">
                        <div className="notch notch-top" />
                        <div className="dashed-line" />
                        <div className="notch notch-bottom" />
                      </div>

                      {/* Cột phải: Thông tin & Nút hành động */}
                      <div className="voucher-right-col">
                        <div className="voucher-body">
                          <h4 className="voucher-program-title">
                            {voucher.program_name || 'Ưu đãi FuniStore'}
                          </h4>
                          <p className="voucher-condition-text">
                            {minAmt > 0
                              ? `Áp dụng cho đơn hàng từ ${formatPrice(minAmt)}`
                              : 'Áp dụng cho mọi giá trị đơn hàng'}
                            {maxDisc > 0 && pct < 100 && (
                              <span className="voucher-max-hint">
                                {' '}(Giảm tối đa {formatPrice(maxDisc)})
                              </span>
                            )}
                          </p>
                          <div className="voucher-meta-line">
                            <span className="voucher-expiry">
                              <Clock size={12} /> HSD: {voucher.end_date?.slice(0, 10)}
                            </span>
                            <span className="voucher-remaining">
                              Còn lại: <strong>{remaining}</strong> lượt
                            </span>
                          </div>
                        </div>

                        {/* Thanh code và nút sử dụng */}
                        <div className="voucher-footer-row">
                          <div className="voucher-code-pill">
                            <span className="code-text">{voucher.code}</span>
                            <button
                              type="button"
                              className="copy-btn"
                              title="Sao chép mã"
                              onClick={() => handleCopy(voucher.code)}
                            >
                              {copiedCode === voucher.code ? (
                                <Check size={13} color="#2b8a3e" />
                              ) : (
                                <Copy size={13} />
                              )}
                              <span>
                                {copiedCode === voucher.code ? 'Đã chép' : 'Chép mã'}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            className="voucher-use-btn"
                            onClick={() => handleApplyNow(voucher)}
                          >
                            <span>Dùng ngay</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          ) : activeTab === 'DUYET' ? (
            /* TAB 2: QUẢN TRỊ DUYỆT VOUCHER CỬA HÀNG */
            <div className="vouchers-admin-view">
              <div className="vouchers-admin-banner">
                <Store size={20} />
                <div>
                  <strong>Phê duyệt Vouchers Cửa Hàng trong tháng</strong>
                  <p>
                    Voucher do nhân viên/cửa hàng đề xuất sẽ ở trạng thái chờ duyệt. Sau khi
                    Admin phê duyệt, voucher sẽ tự động mở trong Kho Voucher của khách hàng.
                  </p>
                </div>
              </div>

              {pendingVouchers.length === 0 ? (
                <div className="vouchers-empty-state">
                  <CheckCircle2 size={46} color="#2b8a3e" />
                  <h3>Không có voucher nào đang chờ duyệt</h3>
                  <p>Tất cả các voucher đề xuất đã được xử lý hoặc đã vào kho.</p>
                </div>
              ) : (
                <div className="vouchers-approval-table-wrap">
                  <table className="vouchers-approval-table">
                    <thead>
                      <tr>
                        <th>Mã Voucher</th>
                        <th>Chương trình / Mô tả</th>
                        <th>Mức giảm</th>
                        <th>Đơn tối thiểu</th>
                        <th>Thời hạn</th>
                        <th>Trạng thái</th>
                        <th>Thao tác Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVouchers.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <strong className="code-badge">{v.code}</strong>
                          </td>
                          <td>
                            <strong>{v.program_name}</strong>
                            <p className="sub-desc">{v.program_description}</p>
                          </td>
                          <td>
                            <span className="discount-tag">
                              Giảm {Number(v.discount_percent)}%
                              {v.maximum_discount ? ` (tối đa ${formatPrice(v.maximum_discount)})` : ''}
                            </span>
                          </td>
                          <td>{formatPrice(v.minimum_amount)}</td>
                          <td>
                            <span className="date-hint">
                              {v.start_date?.slice(0, 10)} → {v.end_date?.slice(0, 10)}
                            </span>
                          </td>
                          <td>
                            <span className="status-badge pending">Chờ Admin duyệt</span>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button
                                type="button"
                                className="admin-approve-btn"
                                disabled={processingId === v.id}
                                onClick={() => handleApprove(v.id)}
                              >
                                <Check size={14} />
                                {processingId === v.id ? 'Đang duyệt...' : 'Duyệt vào Kho'}
                              </button>
                              <button
                                type="button"
                                className="admin-reject-btn"
                                disabled={processingId === v.id}
                                onClick={() => handleReject(v.id)}
                              >
                                <X size={14} />
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Danh sách các voucher khác trong hệ thống */}
              <div className="vouchers-all-list-section">
                <h3 className="section-title">
                  <Layers size={16} /> Toàn bộ voucher trong hệ thống ({adminVouchers.length})
                </h3>
                <div className="vouchers-mini-table-wrap">
                  <table className="vouchers-approval-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Mã</th>
                        <th>Chương trình</th>
                        <th>Đơn tối thiểu</th>
                        <th>Lượt dùng</th>
                        <th>Trạng thái</th>
                        <th>Xử lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminVouchers.map((v) => (
                        <tr key={v.id}>
                          <td>#{v.id}</td>
                          <td>
                            <strong>{v.code}</strong>
                          </td>
                          <td>{v.program_name}</td>
                          <td>{formatPrice(v.minimum_amount)}</td>
                          <td>
                            {v.used_quantity} / {v.quantity}
                          </td>
                          <td>
                            <span className={`status-badge ${v.approval_state?.toLowerCase()}`}>
                              {v.approval_state === 'ACTIVE'
                                ? 'Đang hoạt động'
                                : v.approval_state === 'PENDING_APPROVAL'
                                ? 'Chờ duyệt'
                                : v.approval_state === 'EXPIRED'
                                ? 'Đã hết hạn'
                                : 'Đã tạm ngừng'}
                            </span>
                          </td>
                          <td>
                            {v.approval_state === 'PENDING_APPROVAL' ? (
                              <button
                                type="button"
                                className="table-quick-btn approve"
                                onClick={() => handleApprove(v.id)}
                              >
                                Duyệt
                              </button>
                            ) : v.approval_state === 'ACTIVE' ? (
                              <button
                                type="button"
                                className="table-quick-btn reject"
                                onClick={() => handleReject(v.id)}
                              >
                                Ngừng
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="table-quick-btn approve"
                                onClick={() => handleApprove(v.id)}
                              >
                                Mở lại
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 3: TẠO VOUCHER MỚI CHO CỬA HÀNG */
            <div className="vouchers-create-view">
              <div className="vouchers-create-intro">
                <Sparkles size={20} />
                <div>
                  <h4>Đề xuất Voucher Ưu Đãi Mới</h4>
                  <p>
                    {isAdmin
                      ? 'Bạn đang đăng nhập với tư cách Quản trị viên (Admin). Bạn có thể phê duyệt trực tiếp voucher vào Kho hoặc lưu nháp.'
                      : 'Voucher do cửa hàng tạo sẽ được gửi tới Admin để phê duyệt trước khi khách hàng có thể sử dụng.'}
                  </p>
                </div>
              </div>

              <form className="vouchers-create-form" onSubmit={handleCreateSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Tên chương trình ưu đãi <i>*</i>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Ưu đãi Đơn Hàng Lớn FuniStore"
                      value={createForm.programName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, programName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Mã Voucher (viết hoa không dấu) <i>*</i>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: FUNI500K, THANG10..."
                      value={createForm.code}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phần trăm giảm giá (%) <i>*</i></label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={createForm.discountPercent}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          discountPercent: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đơn hàng tối thiểu (₫) <i>*</i></label>
                    <input
                      type="number"
                      step="50000"
                      placeholder="5000000"
                      value={createForm.minimumAmount}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          minimumAmount: Number(e.target.value),
                        })
                      }
                      required
                    />
                    <small className="field-hint">
                      VD: 5.000.000₫ để khách mua trên 5 triệu mới được giảm
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Mức giảm tối đa (₫)</label>
                    <input
                      type="number"
                      step="50000"
                      placeholder="500000"
                      value={createForm.maximumDiscount}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          maximumDiscount: Number(e.target.value),
                        })
                      }
                    />
                    <small className="field-hint">
                      VD: 500.000₫ (Nếu đơn hơn 5 triệu giảm 500k)
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Số lượng phát hành</label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.quantity}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          quantity: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày bắt đầu áp dụng</label>
                    <input
                      type="text"
                      value={createForm.startDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày hết hạn</label>
                    <input
                      type="text"
                      value={createForm.endDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Mô tả chi tiết ưu đãi</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả quyền lợi và đối tượng khách hàng áp dụng..."
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                  />
                </div>

                {isAdmin && (
                  <div className="form-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={createForm.autoApprove}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, autoApprove: e.target.checked })
                        }
                      />
                      <span>
                        <strong>Duyệt ngay vào Kho Voucher</strong> (Bỏ qua bước chờ duyệt)
                      </span>
                    </label>
                  </div>
                )}

                <div className="form-actions-row">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setActiveTab('KHO')}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="submit-btn" disabled={creating}>
                    <Plus size={16} />
                    {creating
                      ? 'Đang lưu...'
                      : isAdmin && createForm.autoApprove
                      ? 'Tạo và Mở Vào Kho'
                      : 'Gửi Đề Xuất Chờ Admin Duyệt'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

