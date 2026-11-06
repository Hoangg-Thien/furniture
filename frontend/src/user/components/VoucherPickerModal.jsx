import { useState, useMemo } from 'react'
import {
  X,
  Ticket,
  Sparkles,
  Check,
  Copy,
  AlertCircle,
  TrendingDown,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price || 0)}₫`

export function calculateVoucherDiscount(v, currentSubtotal) {
  if (!v || currentSubtotal <= 0) return 0
  const minAmt = Number(v.minimum_amount || 0)
  if (currentSubtotal < minAmt) return 0

  let discount = 0
  const pct = Number(v.discount_percent || 0)
  if (pct > 0) {
    discount = (currentSubtotal * pct) / 100
  }
  const maxCap = v.maximum_discount ? Number(v.maximum_discount) : Infinity
  if (maxCap > 0) {
    discount = Math.min(discount, maxCap)
  }
  if (pct <= 0 && v.maximum_discount) {
    discount = Number(v.maximum_discount)
  }
  return Math.floor(Math.min(discount, currentSubtotal))
}

export default function VoucherPickerModal({
  isOpen,
  onClose,
  vouchers = [],
  subtotal = 0,
  appliedVoucher = null,
  onApplyVoucher,
}) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('ALL') // 'ALL' | 'ELIGIBLE' | 'INELIGIBLE'
  const [copiedCode, setCopiedCode] = useState(null)

  // 1. Phân tích chi tiết và tính số tiền giảm cho từng voucher
  const { allVouchers, bestVoucher } = useMemo(() => {
    if (!Array.isArray(vouchers) || vouchers.length === 0) {
      return { allVouchers: [], bestVoucher: null }
    }

    const processed = vouchers.map((v) => {
      const minAmt = Number(v.minimum_amount || 0)
      const isEligible = subtotal >= minAmt
      const savings = isEligible ? calculateVoucherDiscount(v, subtotal) : 0
      const missing = isEligible ? 0 : Math.max(0, minAmt - subtotal)
      return {
        ...v,
        isEligible,
        savings,
        missing,
      }
    })

    // Sắp xếp: đủ điều kiện lên trước (tiết kiệm nhiều nhất lên đầu), sau đó đến chưa đủ
    const eligible = processed
      .filter((v) => v.isEligible)
      .sort((a, b) => b.savings - a.savings)

    const ineligible = processed
      .filter((v) => !v.isEligible)
      .sort((a, b) => a.missing - b.missing)

    const best = eligible.length > 0 && eligible[0].savings > 0 ? eligible[0] : null

    return {
      allVouchers: [...eligible, ...ineligible],
      bestVoucher: best,
    }
  }, [vouchers, subtotal])

  // 2. Lọc theo tìm kiếm và tab
  const filteredVouchers = useMemo(() => {
    return allVouchers.filter((v) => {
      const matchesSearch =
        !search.trim() ||
        v.code?.toLowerCase().includes(search.trim().toLowerCase()) ||
        v.program_name?.toLowerCase().includes(search.trim().toLowerCase())

      if (!matchesSearch) return false
      if (tab === 'ELIGIBLE') return v.isEligible
      if (tab === 'INELIGIBLE') return !v.isEligible
      return true
    })
  }, [allVouchers, search, tab])

  const eligibleCount = useMemo(() => allVouchers.filter((v) => v.isEligible).length, [allVouchers])
  const ineligibleCount = allVouchers.length - eligibleCount

  function handleCopy(code, e) {
    e?.stopPropagation()
    if (!code) return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code)
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function handleSelectVoucher(v) {
    if (!v.isEligible) return
    onApplyVoucher?.(v.code)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div
      className="voucher-picker-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="voucher-picker-modal" role="dialog" aria-modal="true" aria-labelledby="vp-title">
        {/* Header */}
        <header className="voucher-picker-header">
          <div className="voucher-picker-header-title">
            <Ticket size={20} className="text-amber" />
            <div>
              <h3 id="vp-title">Kho Voucher FuniStore</h3>
              <p>Chọn mã giảm giá tốt nhất cho đơn hàng của bạn</p>
            </div>
          </div>
          <button
            type="button"
            className="voucher-picker-close-btn"
            onClick={onClose}
            aria-label="Đóng kho voucher"
          >
            <X size={19} />
          </button>
        </header>

        {/* Tóm tắt đơn hàng & Voucher tối ưu nhất */}
        <div className="voucher-picker-topbar">
          <div className="vp-subtotal-info">
            <span>Tạm tính đơn hàng:</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          {bestVoucher && (
            <div
              className="vp-best-banner"
              onClick={() => handleSelectVoucher(bestVoucher)}
              title="Bấm để áp dụng ngay voucher tốt nhất"
            >
              <div className="vp-best-left">
                <Sparkles size={14} className="sparkle-gold" />
                <span>
                  Đề xuất tốt nhất: <strong>{bestVoucher.code}</strong> (Tiết kiệm{' '}
                  <strong className="text-emerald">-{formatPrice(bestVoucher.savings)}</strong>)
                </span>
              </div>
              <button type="button" className="vp-best-apply-link">
                Áp dụng ngay <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Ô tìm kiếm & Tabs */}
        <div className="voucher-picker-filter-row">
          <div className="vp-search-box">
            <Search size={14} className="vp-search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã voucher hoặc chương trình..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="vp-clear-search" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="vp-tabs">
            <button
              type="button"
              className={`vp-tab ${tab === 'ALL' ? 'active' : ''}`}
              onClick={() => setTab('ALL')}
            >
              Tất cả ({allVouchers.length})
            </button>
            <button
              type="button"
              className={`vp-tab ${tab === 'ELIGIBLE' ? 'active' : ''}`}
              onClick={() => setTab('ELIGIBLE')}
            >
              Đủ điều kiện ({eligibleCount})
            </button>
            <button
              type="button"
              className={`vp-tab ${tab === 'INELIGIBLE' ? 'active' : ''}`}
              onClick={() => setTab('INELIGIBLE')}
            >
              Chưa đủ điều kiện ({ineligibleCount})
            </button>
          </div>
        </div>

        {/* Danh sách thẻ Voucher */}
        <div className="voucher-picker-list">
          {filteredVouchers.length > 0 ? (
            filteredVouchers.map((v) => {
              const isBest = bestVoucher?.code === v.code
              const isCurrent = appliedVoucher?.code === v.code

              return (
                <div
                  key={v.id || v.code}
                  className={`vp-ticket-card ${v.isEligible ? 'eligible' : 'disabled'} ${isBest ? 'is-best' : ''} ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => v.isEligible && handleSelectVoucher(v)}
                >
                  {/* Cột trái: Nhãn phần trăm giảm */}
                  <div className="vp-ticket-left">
                    <span className="vp-ticket-percent">
                      {v.discount_percent ? `${v.discount_percent}%` : 'GIẢM'}
                    </span>
                    <span className="vp-ticket-sub">GIẢM GIÁ</span>
                  </div>

                  {/* Cột giữa: Chi tiết chương trình & Điều kiện */}
                  <div className="vp-ticket-mid">
                    <div className="vp-ticket-header-row">
                      <strong className="vp-ticket-code">{v.code}</strong>
                      <button
                        type="button"
                        className="vp-ticket-copy-btn"
                        onClick={(e) => handleCopy(v.code, e)}
                        title="Sao chép mã"
                      >
                        {copiedCode === v.code ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                        <span>{copiedCode === v.code ? 'Đã chép' : 'Chép'}</span>
                      </button>

                      {isBest && (
                        <span className="vp-best-tag">
                          <Sparkles size={11} /> Tiết kiệm nhất (-{formatPrice(v.savings)})
                        </span>
                      )}
                    </div>

                    <p className="vp-ticket-name">{v.program_name || 'Ưu đãi mua sắm FuniStore'}</p>

                    <div className="vp-ticket-rules">
                      <span>Đơn tối thiểu: <strong>{formatPrice(v.minimum_amount)}</strong></span>
                      {v.maximum_discount ? (
                        <span> · Giảm tối đa: <strong>{formatPrice(v.maximum_discount)}</strong></span>
                      ) : null}
                    </div>

                    {v.end_date && (
                      <div className="vp-ticket-expiry">
                        <Clock size={11} />
                        <span>HSD: Đến {v.end_date.split(' ')[0]}</span>
                      </div>
                    )}

                    {!v.isEligible && (
                      <div className="vp-ticket-missing-msg">
                        <AlertCircle size={12} />
                        <span>Mua thêm <strong>{formatPrice(v.missing)}</strong> để dùng mã này</span>
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Nút áp dụng */}
                  <div className="vp-ticket-right">
                    {isCurrent ? (
                      <span className="vp-applied-badge">
                        <CheckCircle2 size={14} /> Đang dùng
                      </span>
                    ) : v.isEligible ? (
                      <button
                        type="button"
                        className={`vp-apply-btn ${isBest ? 'best-btn' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectVoucher(v)
                        }}
                      >
                        {isBest ? 'Dùng ngay' : 'Áp dụng'}
                      </button>
                    ) : (
                      <button type="button" className="vp-apply-btn disabled" disabled>
                        Chưa đủ
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="vp-empty-state">
              <Ticket size={32} strokeWidth={1.5} className="text-muted" />
              <h4>Không tìm thấy voucher phù hợp</h4>
              <p>Thử tìm với từ khóa khác hoặc chuyển sang tab "Tất cả".</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="voucher-picker-footer">
          <span className="vp-footer-note">
            Đã chọn {appliedVoucher ? `1 voucher: ${appliedVoucher.code}` : '0 voucher'}
          </span>
          <button type="button" className="vp-close-footer-btn" onClick={onClose}>
            Đóng
          </button>
        </footer>
      </div>
    </div>
  )
}
