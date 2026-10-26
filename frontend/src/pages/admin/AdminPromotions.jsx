import React, { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  X,
  Percent,
  Calculator,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ShoppingBag,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { MOCK_VOUCHERS, MOCK_CATEGORIES } from './adminMockData'
import AdminPagination from './AdminPagination'
import {
  fetchAdminPromotions,
  createAdminPromotion,
  approveAdminPromotion,
  updateAdminPromotionStatus,
  deleteAdminPromotion,
} from '../../lib/adminSales'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminPromotions({ showToast, activeRole = 'ADMIN' }) {
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS)
  const [loading, setLoading] = useState(false)
  const [isRealData, setIsRealData] = useState(false)
  const [statusTab, setStatusTab] = useState('ALL') // 'ALL' | 'ACTIVE' | 'PAUSED' | 'PENDING_APPROVAL' | 'EXPIRED'
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // Tự động trở về trang 1 khi chuyển tab hoặc gõ tìm kiếm
  useEffect(() => {
    setCurrentPage(1)
  }, [statusTab, searchTerm])

  // Form State
  const [code, setCode] = useState('')
  const [programName, setProgramName] = useState('')
  const [discountType, setDiscountType] = useState('PERCENT') // 'PERCENT' | 'FIXED'
  const [discountPercent, setDiscountPercent] = useState('10')
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState('1500000')
  const [minimumAmount, setMinimumAmount] = useState('10000000')
  const [maxDiscount, setMaxDiscount] = useState('2000000')
  const [quantity, setQuantity] = useState('50')
  const [startDate, setStartDate] = useState('2026-10-22')
  const [endDate, setEndDate] = useState('2026-12-31')
  const [appliedCategory, setAppliedCategory] = useState('ALL')

  // Discount Simulator State
  const [simulatedOrderValue, setSimulatedOrderValue] = useState(35000000)

  const loadVouchers = async (silent = false) => {
    if (!silent) setLoading(true)
    const { vouchers: remoteVouchers, isRealData: real } = await fetchAdminPromotions()
    if (remoteVouchers && remoteVouchers.length > 0) {
      setVouchers(remoteVouchers)
      setIsRealData(real)
      if (real && !silent) {
        showToast('Đã tải danh sách voucher thực tế từ database!')
      }
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  // Status Tab Counts
  const activeCount = vouchers.filter((v) => v.status === 'ACTIVE').length
  const pausedCount = vouchers.filter((v) => v.status === 'PAUSED').length
  const pendingCount = vouchers.filter((v) => v.approvalState === 'PENDING_APPROVAL').length
  const expiredCount = vouchers.filter((v) => v.status === 'EXPIRED').length

  // Filter Vouchers
  const filteredVouchers = vouchers.filter((v) => {
    let matchTab = true
    if (statusTab === 'ACTIVE') matchTab = v.status === 'ACTIVE'
    else if (statusTab === 'PAUSED') matchTab = v.status === 'PAUSED'
    else if (statusTab === 'PENDING_APPROVAL') matchTab = v.approvalState === 'PENDING_APPROVAL'
    else if (statusTab === 'EXPIRED') matchTab = v.status === 'EXPIRED'

    const matchSearch =
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.programName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchTab && matchSearch
  })

  // Danh sách voucher sau khi phân trang
  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Quick Action Handlers
  async function handleTogglePause(id, currentStatus, vCode) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v))
    )
    showToast(`Đã chuyển voucher "${vCode}" sang trạng thái: ${nextStatus === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'}`)
    await updateAdminPromotionStatus(id, nextStatus)
  }

  async function handleEndVoucher(id, vCode) {
    if (window.confirm(`Bạn có chắc chắn muốn kết thúc chiến dịch voucher "${vCode}"?`)) {
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'EXPIRED' } : v))
      )
      showToast(`Đã kết thúc voucher "${vCode}".`)
      await updateAdminPromotionStatus(id, 'INACTIVE')
    }
  }

  async function handleApprove(id, vCode) {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: 'ACTIVE', approvalState: 'APPROVED' } : v
      )
    )
    showToast(`Đã phê duyệt voucher "${vCode}" vào hệ thống!`)
    await approveAdminPromotion(id)
  }

  async function handleCreateVoucher(e) {
    e.preventDefault()
    if (!code || !programName) {
      alert('Vui lòng nhập Mã Voucher và Tên chương trình!')
      return
    }

    const payload = {
      code: code.trim().toUpperCase(),
      programName: programName.trim(),
      description: `Chương trình ${programName.trim()} - Giảm ${discountType === 'PERCENT' ? discountPercent + '%' : formatCurrency(fixedDiscountAmount)}`,
      discountPercent: discountType === 'PERCENT' ? Number(discountPercent) : 10,
      minimumAmount: Number(minimumAmount),
      maximumDiscount: discountType === 'PERCENT' ? Number(maxDiscount) : Number(fixedDiscountAmount),
      quantity: Number(quantity),
      startDate,
      endDate,
    }

    const res = await createAdminPromotion(payload)
    if (res.success) {
      showToast(`Đã phát hành thành công voucher "${payload.code}" vào database!`)
      setCreateModalOpen(false)
      loadVouchers(true)
    } else {
      const newVoucher = {
        id: Date.now(),
        code: payload.code,
        programName: payload.programName,
        discountType,
        discountPercent: payload.discountPercent,
        minimumAmount: payload.minimumAmount,
        maximumDiscount: payload.maximumDiscount,
        quantity: payload.quantity,
        usedQuantity: 0,
        remainingQuantity: payload.quantity,
        startDate,
        endDate,
        status: 'ACTIVE',
        approvalState: 'APPROVED',
      }
      setVouchers([newVoucher, ...vouchers])
      setCreateModalOpen(false)
      showToast(`Đã phát hành voucher "${newVoucher.code}"!`)
    }
  }

  // Calculate Simulation Values
  const simEligible = simulatedOrderValue >= Number(minimumAmount)
  let simCalculatedDiscount = 0
  if (simEligible) {
    if (discountType === 'PERCENT') {
      const rawDiscount = (simulatedOrderValue * Number(discountPercent)) / 100
      simCalculatedDiscount = Math.min(rawDiscount, Number(maxDiscount))
    } else {
      simCalculatedDiscount = Number(fixedDiscountAmount)
    }
  }
  const simFinalCustomerPay = Math.max(0, simulatedOrderValue - simCalculatedDiscount)
  const simActualDiscountPercent = simulatedOrderValue > 0
    ? ((simCalculatedDiscount / simulatedOrderValue) * 100).toFixed(1)
    : 0

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-page-title">Quản Lý Khuyến Mãi & Kho Voucher</h1>
            {isRealData && (
              <span className="admin-badge admin-badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Database Supabase Live
              </span>
            )}
          </div>
          <p className="admin-page-subtitle">
            Cấu hình mã giảm giá tri ân, chiết khấu theo %, thiết lập trần tối đa và giả lập hiệu quả ngân sách chiến dịch.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => loadVouchers(false)}
            title="Làm mới voucher từ máy chủ"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {loading ? 'Đang tải...' : 'Làm Mới'}
          </button>
          {(activeRole === 'ADMIN' || activeRole === 'SALES') && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setCode(`FURNI-${Math.floor(10 + Math.random() * 90)}`)
                setProgramName('Ưu đãi nội thất phong cách Bắc Âu')
                setCreateModalOpen(true)
              }}
            >
              <Plus size={16} /> Tạo Voucher Mới
            </button>
          )}
        </div>
      </div>

      {/* Status Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusTab('ALL')}
        >
          <span>Tất cả ({vouchers.length})</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setStatusTab('ACTIVE')}
        >
          <span>Đang chạy</span>
          <span className="admin-status-tab-badge" style={{ background: '#EDF7ED', color: '#2E7D32' }}>
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'PAUSED' ? 'active' : ''}`}
          onClick={() => setStatusTab('PAUSED')}
        >
          <span>Tạm ngưng</span>
          <span className="admin-status-tab-badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
            {pausedCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
          onClick={() => setStatusTab('PENDING_APPROVAL')}
        >
          <span>Chờ duyệt</span>
          <span className="admin-status-tab-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${statusTab === 'EXPIRED' ? 'active' : ''}`}
          onClick={() => setStatusTab('EXPIRED')}
        >
          <span>Đã kết thúc</span>
          <span className="admin-status-tab-badge" style={{ background: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}>
            {expiredCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm mã code (TRIAN10...), tên chương trình..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Đang hiển thị <strong>{filteredVouchers.length}</strong> voucher
            </div>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Code & Chương Trình</th>
                <th>Hình Thức Giảm</th>
                <th>Điều Kiện Đơn Tối Thiểu</th>
                <th>Mức Giảm Tối Đa</th>
                <th className="text-center">Lượt Dùng</th>
                <th>Thời Gian Hiệu Lực</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác Nhanh</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                    Không tìm thấy mã khuyến mãi / voucher nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((v) => {
                  const isApproved = v.approvalState === 'APPROVED'
                const usagePercent = Math.round((v.usedQuantity / v.quantity) * 100)

                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: 'var(--admin-primary)',
                            fontFamily: 'monospace',
                            fontSize: '13.5px',
                            background: 'var(--admin-primary-soft)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--admin-border)',
                          }}
                        >
                          {v.code}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
                        {v.programName}
                      </div>
                    </td>

                    <td>
                      {v.discountPercent ? (
                        <span className="admin-status-badge info">
                          <Percent size={12} style={{ marginRight: '3px' }} />
                          Giảm {v.discountPercent}%
                        </span>
                      ) : (
                        <span className="admin-status-badge info">
                          Giảm cố định {formatCurrency(v.maximumDiscount)}
                        </span>
                      )}
                    </td>

                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      Đơn từ {formatCurrency(v.minimumAmount)}
                    </td>

                    <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                      Tối đa {formatCurrency(v.maximumDiscount)}
                    </td>

                    <td className="text-center tabular-nums">
                      <div>
                        {v.usedQuantity} / {v.quantity}
                      </div>
                      <div className="admin-stock-bar" style={{ margin: '4px auto 0' }}>
                        <div
                          className="admin-stock-fill high"
                          style={{ width: `${usagePercent}%`, background: 'var(--admin-primary)' }}
                        />
                      </div>
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>
                      <div>Từ: {v.startDate}</div>
                      <div>Đến: {v.endDate}</div>
                    </td>

                    <td className="text-center">
                      <span
                        className={`admin-status-badge ${
                          v.status === 'ACTIVE'
                            ? 'success'
                            : v.status === 'PAUSED'
                            ? 'warning'
                            : 'neutral'
                        }`}
                      >
                        <span className="dot" />
                        {v.status === 'ACTIVE'
                          ? 'Đang chạy'
                          : v.status === 'PAUSED'
                          ? 'Tạm ngưng'
                          : 'Đã hết hạn'}
                      </span>
                    </td>

                    <td className="text-center">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {v.approvalState === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleApprove(v.id, v.code)}
                          >
                            Duyệt
                          </button>
                        )}

                        {v.status === 'ACTIVE' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11.5px', color: 'var(--admin-warning)' }}
                            onClick={() => handleTogglePause(v.id, v.status, v.code)}
                            title="Tạm ngưng mã voucher"
                          >
                            Tạm Dừng
                          </button>
                        )}

                        {v.status === 'PAUSED' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11.5px', color: '#10B981' }}
                            onClick={() => handleTogglePause(v.id, v.status, v.code)}
                            title="Kích hoạt lại voucher"
                          >
                            Kích Hoạt
                          </button>
                        )}

                        {v.status !== 'EXPIRED' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleEndVoucher(v.id, v.code)}
                            title="Kết thúc chiến dịch"
                          >
                            Kết Thúc
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang voucher */}
        <AdminPagination
          currentPage={currentPage}
          totalItems={filteredVouchers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 8, 10, 15, 20]}
          itemLabel="voucher"
        />
      </div>

      {/* ==========================================================================
          MODAL: CREATE VOUCHER WITH REAL-TIME DISCOUNT SIMULATOR
         ========================================================================== */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '860px', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Thiết Lập Chiến Dịch Voucher Mới</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Tích hợp bộ mô phỏng tính toán chiết khấu ngân sách thời gian thực
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher}>
              <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 2 Columns: Form Fields (Left) & Simulator (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                  {/* Left Column: Form Setup */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="admin-form-group">
                      <label>Mã Voucher (Code) *</label>
                      <input
                        type="text"
                        required
                        style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--admin-primary)' }}
                        placeholder="VD: PHONGKHACH20, TRIANVIP"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Tên Chương Trình Khuyến Mãi *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Tri ân khách hàng mua trọn bộ phòng khách"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="admin-form-group">
                        <label>Hình Thức Giảm Giá</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value)}
                        >
                          <option value="PERCENT">Giảm theo tỷ lệ %</option>
                          <option value="FIXED">Giảm số tiền cố định (VNĐ)</option>
                        </select>
                      </div>

                      {discountType === 'PERCENT' ? (
                        <div className="admin-form-group">
                          <label>Tỷ Lệ Giảm (%) *</label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            required
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="admin-form-group">
                          <label>Số Tiền Giảm (VNĐ) *</label>
                          <input
                            type="number"
                            step="50000"
                            required
                            value={fixedDiscountAmount}
                            onChange={(e) => setFixedDiscountAmount(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="admin-form-group">
                        <label>Đơn Hàng Tối Thiểu (VNĐ) *</label>
                        <input
                          type="number"
                          step="100000"
                          required
                          value={minimumAmount}
                          onChange={(e) => setMinimumAmount(e.target.value)}
                        />
                      </div>

                      {discountType === 'PERCENT' && (
                        <div className="admin-form-group">
                          <label>Mức Giảm Tối Đa (Trần VNĐ) *</label>
                          <input
                            type="number"
                            step="100000"
                            required
                            value={maxDiscount}
                            onChange={(e) => setMaxDiscount(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="admin-form-group">
                        <label>Tổng Lượt Sử Dụng *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Áp Dụng Cho Danh Mục</label>
                        <select
                          value={appliedCategory}
                          onChange={(e) => setAppliedCategory(e.target.value)}
                        >
                          <option value="ALL">Toàn bộ danh mục nội thất</option>
                          {MOCK_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="admin-form-group">
                        <label>Ngày Bắt Đầu</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Ngày Kết Thúc</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: REAL-TIME DISCOUNT SIMULATOR WIDGET */}
                  <div>
                    <div
                      style={{
                        background: 'var(--admin-bg)',
                        border: '2px solid var(--admin-primary)',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: 'var(--admin-card-shadow)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-primary)', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                        <Calculator size={18} />
                        MÔ PHỎNG SỐ TIỀN GIẢM (SIMULATOR)
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '10px' }}>
                        Nhập thử giá trị đơn hàng khách mua để kiểm tra số tiền giảm thực tế:
                      </div>

                      <div className="admin-form-group" style={{ marginBottom: '14px' }}>
                        <label>Giá Trị Đơn Hàng Thử Nghiệm (VNĐ):</label>
                        <input
                          type="number"
                          step="1000000"
                          className="tabular-nums"
                          style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-main)' }}
                          value={simulatedOrderValue}
                          onChange={(e) => setSimulatedOrderValue(Number(e.target.value))}
                        />
                      </div>

                      {/* Simulation Result Box */}
                      <div
                        style={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--admin-text-muted)' }}>Đủ điều kiện tối thiểu:</span>
                          <span style={{ fontWeight: 700, color: simEligible ? '#10B981' : 'var(--admin-danger)' }}>
                            {simEligible ? '✓ Đạt điều kiện' : '✕ Chưa đạt điều kiện'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--admin-text-muted)' }}>Số tiền giảm thực tế:</span>
                          <strong className="tabular-nums" style={{ color: '#10B981', fontSize: '14px' }}>
                            {formatCurrency(simCalculatedDiscount)}
                          </strong>
                        </div>

                        {discountType === 'PERCENT' && simEligible && (
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                            (Mức giảm danh nghĩa: {formatCurrency((simulatedOrderValue * Number(discountPercent)) / 100)}, đã áp trần {formatCurrency(Number(maxDiscount))})
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--admin-border)',
                            paddingTop: '8px',
                            marginTop: '4px',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          <span>Khách còn phải trả:</span>
                          <span className="tabular-nums" style={{ color: 'var(--admin-primary)' }}>
                            {formatCurrency(simFinalCustomerPay)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>
                          <span>Tỷ lệ chiết khấu thực tế:</span>
                          <span className="tabular-nums">{simActualDiscountPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Phát Hành Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
