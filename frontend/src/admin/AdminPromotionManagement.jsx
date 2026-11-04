import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Layers,
  Info,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Gift,
  Settings,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Ticket,
  ShoppingBag
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminPromotionManagement({ currentUser }) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | ACTIVE | DRAFT | INACTIVE
  const [timeFilter, setTimeFilter] = useState('ALL') // ALL | RUNNING | UPCOMING | EXPIRED
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const toastTimer = useRef(null)
  const requestId = useRef(0)

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // Program Modal (Create / Quick Edit)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  })
  const [programFormError, setProgramFormError] = useState('')
  const [submittingProgram, setSubmittingProgram] = useState(false)

  // Campaign Detail Modal (4 Tabs)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // overview | products | orders | vouchers

  // Products list for selecting in Product Discount tab
  const [availableProducts, setAvailableProducts] = useState([])
  const [productDiscountForm, setProductDiscountForm] = useState({
    productId: '',
    discountPercent: 10
  })
  const [submittingProductDiscount, setSubmittingProductDiscount] = useState(false)

  // Order Discount form
  const [orderDiscountForm, setOrderDiscountForm] = useState({
    minimumAmount: 10000000,
    discountPercent: 5
  })
  const [submittingOrderDiscount, setSubmittingOrderDiscount] = useState(false)

  // Voucher form
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discountPercent: 10,
    minimumAmount: 5000000,
    maximumDiscount: 1000000,
    quantity: 100,
    status: 'ACTIVE'
  })
  const [submittingVoucher, setSubmittingVoucher] = useState(false)

  // Delete program confirmation
  const [deletingProgram, setDeletingProgram] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const modalOpen = showProgramModal || showDetailModal || !!deletingProgram
  const saving = submittingProgram || submittingDelete || submittingVoucher || submittingProductDiscount || submittingOrderDiscount
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    if (!modalOpen) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = document.querySelector('.admin-promotion-management [role="dialog"]')
    const focusable = () => [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || [])].filter(el => el.getClientRects().length)
    focusable()[0]?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape' && !saving) {
        setShowProgramModal(false)
        setShowDetailModal(false)
        setDeletingProgram(null)
      }
      if (event.key === 'Tab') {
        const items = focusable()
        const first = items[0]
        const last = items.at(-1)
        if (!first) { event.preventDefault(); return }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [modalOpen, saving, loadingDetail])

  // Format currency
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Format datetime for display
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Format for HTML datetime-local input
  const toInputDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      return d.toISOString().slice(0, 16)
    } catch {
      return dateStr.slice(0, 16)
    }
  }

  // Fetch all programs
  const fetchPrograms = async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const url = `${baseUrl}/api/admin/promotions`
      const res = await fetch(url, { headers: getApiHeaders() })
      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách khuyến mãi (HTTP ${res.status})`)
      }
      const data = await res.json()
      if (id === requestId.current) setPrograms(data || [])
    } catch (err) {
      console.error(err)
      if (id === requestId.current) setError(err.message || 'Không thể kết nối đến máy chủ.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  // Fetch available products
  const fetchProducts = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/products?size=100`, { headers: getApiHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAvailableProducts(data?.content || [])
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err)
    }
  }

  useEffect(() => {
    fetchPrograms()
    fetchProducts()
  }, [])

  useEffect(() => { setPage(1) }, [searchKeyword, statusFilter, timeFilter, pageSize])

  // Filtered programs list by time filter
  const displayedPrograms = useMemo(() => {
    const now = new Date()
    const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    const keyword = normalize(searchKeyword.trim())
    return programs.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (keyword && !normalize(`${p.name} ${p.description || ''}`).includes(keyword)) return false
      if (timeFilter === 'ALL') return true
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      if (timeFilter === 'RUNNING') {
        return p.status === 'ACTIVE' && now >= start && now <= end
      }
      if (timeFilter === 'UPCOMING') {
        return now < start
      }
      if (timeFilter === 'EXPIRED') {
        return now > end || p.status === 'INACTIVE'
      }
      return true
    })
  }, [programs, timeFilter, searchKeyword, statusFilter])

  const totalPages = Math.max(1, Math.ceil(displayedPrograms.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedPrograms = displayedPrograms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = !!searchKeyword.trim() || statusFilter !== 'ALL' || timeFilter !== 'ALL'
  const resetFilters = () => { setSearchKeyword(''); setStatusFilter('ALL'); setTimeFilter('ALL'); setPage(1) }

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = programs.length
    const now = new Date()
    const activeRunning = programs.filter(
      (p) => p.status === 'ACTIVE' && now >= new Date(p.startDate) && now <= new Date(p.endDate)
    ).length
    const totalVouchers = programs.reduce((sum, p) => sum + (p.vouchersCount || 0), 0)
    const totalProductDiscounts = programs.reduce((sum, p) => sum + (p.productDiscountsCount || 0), 0)
    return { total, activeRunning, totalVouchers, totalProductDiscounts }
  }, [programs])

  // Open Create Program Modal
  const handleOpenCreateProgram = () => {
    setEditingProgram(null)
    const now = new Date()
    const oneMonthLater = new Date()
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

    setProgramForm({
      name: '',
      description: '',
      startDate: toInputDate(now),
      endDate: toInputDate(oneMonthLater),
      status: 'ACTIVE'
    })
    setProgramFormError('')
    setShowProgramModal(true)
  }

  // Open Edit Program Modal
  const handleOpenEditProgram = (program) => {
    setEditingProgram(program)
    setProgramForm({
      name: program.name || '',
      description: program.description || '',
      startDate: toInputDate(program.startDate),
      endDate: toInputDate(program.endDate),
      status: program.status || 'DRAFT'
    })
    setProgramFormError('')
    setShowProgramModal(true)
  }

  // Submit Program Form (Create / Edit)
  const handleSubmitProgram = async (e) => {
    e.preventDefault()
    setProgramFormError('')

    if (!programForm.name.trim()) {
      setProgramFormError('Tên chiến dịch khuyến mãi không được để trống.')
      return
    }
    if (!programForm.startDate || !programForm.endDate) {
      setProgramFormError('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.')
      return
    }
    if (new Date(programForm.endDate) < new Date(programForm.startDate)) {
      setProgramFormError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.')
      return
    }

    setSubmittingProgram(true)
    try {
      const baseUrl = getApiBaseUrl()
      const isEdit = !!editingProgram
      const url = isEdit
        ? `${baseUrl}/api/admin/promotions/${editingProgram.id}`
        : `${baseUrl}/api/admin/promotions`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(programForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác thất bại.')
      }

      showToast(isEdit ? 'Cập nhật chiến dịch thành công!' : 'Tạo chiến dịch khuyến mãi mới thành công!')
      setShowProgramModal(false)
      fetchPrograms()
    } catch (err) {
      setProgramFormError(err.message || 'Lỗi khi lưu chiến dịch.')
    } finally {
      setSubmittingProgram(false)
    }
  }

  // Toggle Program Status
  const handleToggleStatus = async (program) => {
    const newStatus = program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${program.id}/status`, {
        method: 'PUT',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Cập nhật trạng thái thất bại.')
      }
      showToast(`Đã chuyển trạng thái chiến dịch sang ${newStatus}!`)
      fetchPrograms()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Delete Program
  const handleDeleteProgram = async () => {
    if (!deletingProgram) return
    setSubmittingDelete(true)
    setDeleteError('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${deletingProgram.id}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa chiến dịch này.')
      }
      showToast('Đã xóa chiến dịch khuyến mãi thành công!')
      setDeletingProgram(null)
      fetchPrograms()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setSubmittingDelete(false)
    }
  }

  // Open Detail / Configuration Modal
  const handleOpenDetailModal = async (programId, tab = 'overview') => {
    setActiveProgramId(programId)
    setActiveTab(tab)
    setShowDetailModal(true)
    setLoadingDetail(true)
    setDetailData(null)
    setDetailError('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${programId}/detail`, {
        headers: getApiHeaders()
      })
      if (!res.ok) {
        throw new Error('Không thể tải chi tiết chiến dịch.')
      }
      const data = await res.json()
      setDetailData(data)

      // Reset forms
      if (availableProducts.length > 0) {
        setProductDiscountForm({ productId: availableProducts[0].id, discountPercent: 10 })
      }
      setVoucherForm({
        code: `${data.program.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}${Math.floor(10 + Math.random() * 90)}`,
        discountPercent: 10,
        minimumAmount: 5000000,
        maximumDiscount: 1000000,
        quantity: 100,
        status: 'ACTIVE'
      })
    } catch (err) {
      setDetailError(err.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Refresh current detail modal data
  const refreshDetail = async () => {
    if (!activeProgramId) return
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/detail`, {
        headers: getApiHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setDetailData(data)
      }
      fetchPrograms()
    } catch (err) {
      console.error(err)
    }
  }

  // Add Product Discount
  const handleAddProductDiscount = async (e) => {
    e.preventDefault()
    if (!productDiscountForm.productId) {
      showToast('Vui lòng chọn sản phẩm nội thất.', 'error')
      return
    }
    setSubmittingProductDiscount(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/product-discounts`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          productId: Number(productDiscountForm.productId),
          discountPercent: Number(productDiscountForm.discountPercent)
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi thêm giảm giá sản phẩm.')
      }
      showToast('Đã thêm sản phẩm vào danh mục giảm giá!')
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingProductDiscount(false)
    }
  }

  // Delete Product Discount
  const handleDeleteProductDiscount = async (discountId) => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/product-discounts/${discountId}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể gỡ bỏ giảm giá sản phẩm.')
      showToast('Đã gỡ bỏ giảm giá sản phẩm!')
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Add Order Discount
  const handleAddOrderDiscount = async (e) => {
    e.preventDefault()
    setSubmittingOrderDiscount(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/order-discounts`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          minimumAmount: Number(orderDiscountForm.minimumAmount),
          discountPercent: Number(orderDiscountForm.discountPercent)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm chiết khấu đơn hàng.')
      showToast('Đã thêm bậc chiết khấu đơn hàng!')
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingOrderDiscount(false)
    }
  }

  // Delete Order Discount
  const handleDeleteOrderDiscount = async (discountId) => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/order-discounts/${discountId}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      if (!res.ok) throw new Error('Không thể gỡ bậc chiết khấu.')
      showToast('Đã xóa bậc chiết khấu!')
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Create Voucher
  const handleCreateVoucher = async (e) => {
    e.preventDefault()
    if (!voucherForm.code.trim()) {
      showToast('Mã voucher không được để trống.', 'error')
      return
    }
    setSubmittingVoucher(true)
    try {
      const baseUrl = getApiBaseUrl()
      const payload = {
        code: voucherForm.code.trim().toUpperCase(),
        discountPercent: Number(voucherForm.discountPercent),
        minimumAmount: Number(voucherForm.minimumAmount) || 0,
        maximumDiscount: voucherForm.maximumDiscount ? Number(voucherForm.maximumDiscount) : null,
        quantity: Number(voucherForm.quantity) || 50,
        status: voucherForm.status
      }

      const res = await fetch(`${baseUrl}/api/admin/promotions/${activeProgramId}/vouchers`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi phát hành voucher.')
      showToast(`Đã phát hành mã Voucher ${data.code} thành công!`)
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingVoucher(false)
    }
  }

  // Toggle Voucher Status
  const handleToggleVoucherStatus = async (voucher) => {
    const newStatus = voucher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/vouchers/${voucher.id}/status`, {
        method: 'PUT',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái voucher.')
      showToast(`Voucher ${voucher.code} đã chuyển sang ${newStatus}!`)
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Delete Voucher
  const handleDeleteVoucher = async (voucherId) => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể xóa voucher.')
      showToast('Đã xóa voucher thành công!')
      refreshDetail()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="admin-promotion-management">
      {/* Toast Feedback */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`} role="status">
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-breadcrumb promotion-breadcrumb">
        <span>Không gian làm việc</span><ChevronRight size={13} /><span>Khuyến mãi & voucher</span>
      </div>
      <div className="admin-page-header promotion-page-header">
        <div>
          <div className="promotion-eyebrow">TĂNG TRƯỞNG CỬA HÀNG</div>
          <h1 className="admin-page-title">Khuyến mãi & voucher</h1>
          <p className="admin-page-subtitle">Quản lý chiến dịch, thiết lập ưu đãi và chăm sóc khách hàng.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={handleOpenCreateProgram}>
          <Plus size={17} /><span>Tạo chiến dịch</span>
        </button>
      </div>

      <div className="admin-stats-grid" aria-label="Tổng quan khuyến mãi" aria-busy={loading}>
        {[
          { label: 'Tổng chiến dịch', value: kpiStats.total, icon: Layers, note: 'Tất cả chương trình ưu đãi' },
          { label: 'Đang diễn ra', value: kpiStats.activeRunning, icon: TrendingUp, note: 'Đang áp dụng cho khách hàng', active: true },
          { label: 'Mã voucher', value: kpiStats.totalVouchers, icon: Ticket, note: 'Tổng số mã đã phát hành' },
          { label: 'Sản phẩm ưu đãi', value: kpiStats.totalProductDiscounts, icon: Package, note: 'Lượt sản phẩm được giảm giá' }
        ].map(({ label, value, icon: Icon, note, active }) => (
          <div key={label} className={`admin-stat-card ${active ? 'is-highlighted' : ''}`}>
            <div className="stat-card-header"><span className="stat-card-title">{label}</span><Icon size={18} strokeWidth={1.6} /></div>
            <div className="stat-card-value">{loading || error ? '—' : value.toLocaleString('vi-VN')}</div>
            <div className="stat-card-footer">{active && <span className="promotion-live-dot" />}{note}</div>
          </div>
        ))}
      </div>

      <section className="promotion-list-panel" aria-label="Danh sách chiến dịch">
        <div className="promotion-panel-heading">
          <div className="promotion-panel-title"><h2>Chiến dịch của bạn</h2><span className="promotion-count">{programs.length}</span></div>
          <button className="promotion-refresh" onClick={fetchPrograms} disabled={loading} title="Tải lại danh sách" aria-label="Tải lại danh sách">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /><span>Làm mới</span>
          </button>
        </div>
        <div className="promotion-status-tabs" role="group" aria-label="Lọc theo trạng thái">
          {[
            ['ALL', 'Tất cả'], ['ACTIVE', 'Đã kích hoạt'], ['DRAFT', 'Bản nháp'], ['INACTIVE', 'Tạm dừng']
          ].map(([value, label]) => (
            <button key={value} aria-pressed={statusFilter === value} className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>
              {label}<span>{value === 'ALL' ? programs.length : programs.filter(p => p.status === value).length}</span>
            </button>
          ))}
        </div>
        <div className="promotion-filter-bar">
          <div className="promotion-search-field">
            <Search size={17} />
            <input type="search" placeholder="Tìm tên chiến dịch, mô tả..." aria-label="Tìm kiếm chiến dịch" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
          </div>
          <div className="promotion-time-filter"><SlidersHorizontal size={15} />
            <select aria-label="Lọc theo thời gian" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="ALL">Tất cả thời gian</option><option value="RUNNING">Đang diễn ra</option><option value="UPCOMING">Sắp diễn ra</option><option value="EXPIRED">Đã kết thúc</option>
            </select>
          </div>
          {hasFilters && <button className="promotion-clear-filter" onClick={resetFilters}><X size={14} />Xóa bộ lọc</button>}
        </div>

        {error && <div className="promotion-error" role="alert"><AlertCircle size={19} /><div><strong>Chưa tải được danh sách chiến dịch</strong><p>{error}</p></div><button className="btn-admin btn-admin-secondary" onClick={fetchPrograms}>Thử lại</button></div>}
        <div className="table-responsive promotion-table-scroll">
          <table className="admin-table promotion-table">
            <thead><tr><th>Chiến dịch</th><th>Thời gian áp dụng</th><th>Ưu đãi đã thiết lập</th><th>Trạng thái</th><th className="promotion-actions-heading">Thao tác</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="promotion-empty" role="status"><RefreshCw size={24} className="animate-spin" /><h3>Đang tải chiến dịch...</h3></div></td></tr>
              ) : error && programs.length === 0 ? (
                <tr><td colSpan="5"><div className="promotion-empty"><div className="promotion-empty-icon"><AlertCircle size={28} /></div><h3>Dữ liệu chưa sẵn sàng</h3><p>Vui lòng thử tải lại để xem các chiến dịch của bạn.</p></div></td></tr>
              ) : displayedPrograms.length === 0 ? (
                <tr><td colSpan="5"><div className="promotion-empty">
                  <div className="promotion-empty-icon"><Ticket size={29} strokeWidth={1.4} /><span><Plus size={12} /></span></div>
                  <h3>{hasFilters ? 'Không tìm thấy chiến dịch' : 'Ưu đãi đầu tiên, khởi đầu mới'}</h3>
                  <p>{hasFilters ? 'Thử một từ khóa khác hoặc điều chỉnh bộ lọc của bạn.' : 'Tạo chiến dịch để mang sản phẩm đến gần khách hàng hơn. Bạn có thể thiết lập giảm giá và voucher trong cùng một nơi.'}</p>
                  <button className={hasFilters ? 'btn-admin btn-admin-secondary' : 'btn-admin btn-admin-primary'} onClick={hasFilters ? resetFilters : handleOpenCreateProgram}>
                    {hasFilters ? <X size={15} /> : <Plus size={15} />}{hasFilters ? 'Xóa bộ lọc' : 'Tạo chiến dịch đầu tiên'}
                  </button>
                </div></td></tr>
              ) : pagedPrograms.map(p => {
                const now = new Date()
                const isRunning = p.status === 'ACTIVE' && now >= new Date(p.startDate) && now <= new Date(p.endDate)
                const isExpired = now > new Date(p.endDate)
                const isUpcoming = now < new Date(p.startDate)
                return (
                  <tr key={p.id}>
                    <td><div className="promotion-name-cell"><div className={`promotion-row-icon ${isRunning ? 'running' : ''}`}><Tag size={18} strokeWidth={1.6} /></div><div>
                      <button className="promotion-name-button" onClick={() => handleOpenDetailModal(p.id)}>{p.name}</button>
                      <div className="promotion-row-description" title={p.description || ''}>#{String(p.id).padStart(2, '0')} · {p.description || 'Chưa có mô tả'}</div>
                    </div></div></td>
                    <td><div className="promotion-date"><Calendar size={13} />{formatDateTime(p.startDate)} – {formatDateTime(p.endDate)}</div><span className={`promotion-schedule ${isRunning ? 'running' : ''}`}>{isRunning ? 'Đang diễn ra' : isExpired ? 'Đã kết thúc' : isUpcoming ? 'Sắp diễn ra' : 'Chưa kích hoạt'}</span></td>
                    <td><div className="promotion-discount-tags">
                      {p.productDiscountsCount > 0 && <button onClick={() => handleOpenDetailModal(p.id, 'products')}>{p.productDiscountsCount} sản phẩm</button>}
                      {p.orderDiscountsCount > 0 && <button onClick={() => handleOpenDetailModal(p.id, 'orders')}>{p.orderDiscountsCount} bậc đơn</button>}
                      {p.vouchersCount > 0 && <button onClick={() => handleOpenDetailModal(p.id, 'vouchers')}>{p.vouchersCount} voucher</button>}
                      {!p.productDiscountsCount && !p.orderDiscountsCount && !p.vouchersCount && <button className="promotion-setup-link" onClick={() => handleOpenDetailModal(p.id)}>Thiết lập ưu đãi <ArrowRight size={12} /></button>}
                    </div></td>
                    <td><button className={`promotion-status-badge status-${p.status.toLowerCase()}`} onClick={() => handleToggleStatus(p)} title="Nhấn để bật hoặc tạm dừng chiến dịch"><span />{p.status === 'ACTIVE' ? 'Đã kích hoạt' : p.status === 'DRAFT' ? 'Bản nháp' : 'Tạm dừng'}</button></td>
                    <td><div className="promotion-row-actions">
                      <button className="btn-action" title="Thiết lập ưu đãi" aria-label={`Thiết lập ưu đãi: ${p.name}`} onClick={() => handleOpenDetailModal(p.id)}><Settings size={16} /></button>
                      <button className="btn-action" title="Chỉnh sửa chiến dịch" aria-label={`Chỉnh sửa: ${p.name}`} onClick={() => handleOpenEditProgram(p)}><Edit2 size={15} /></button>
                      <button className="btn-action btn-action-danger" title="Xóa chiến dịch" aria-label={`Xóa: ${p.name}`} onClick={() => { setDeletingProgram(p); setDeleteError('') }}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="promotion-pagination">
          <span aria-live="polite">{displayedPrograms.length ? `Hiển thị ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, displayedPrograms.length)} trong ${displayedPrograms.length} chiến dịch` : '0 chiến dịch'}</span>
          <div className="promotion-pagination-controls"><label>Số dòng <select aria-label="Số dòng mỗi trang" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><button className="btn-action" aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage} / {totalPages}</span><button className="btn-action" aria-label="Trang sau" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div>
        </div>
      </section>

      <div className="promotion-guide-heading"><span>MỘT CHIẾN DỊCH, NHIỀU CÁCH ƯU ĐÃI</span><span>Thiết lập sau khi tạo chiến dịch</span></div>
      <div className="promotion-guides">
        {[
          { icon: Package, title: 'Giảm giá sản phẩm', text: 'Áp dụng phần trăm giảm giá trực tiếp cho từng sản phẩm nội thất.' },
          { icon: ShoppingBag, title: 'Ưu đãi theo đơn hàng', text: 'Thiết lập các bậc chiết khấu theo giá trị đơn hàng của khách.' },
          { icon: Ticket, title: 'Voucher dành riêng', text: 'Phát hành mã ưu đãi với hạn mức, số lượng và điều kiện sử dụng.' }
        ].map(({ icon: Icon, title, text }, index) => <div className="promotion-guide" key={title}><div className="promotion-guide-top"><Icon size={21} strokeWidth={1.5} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></div>)}
      </div>

      {/* MODAL 1: Tạo / Sửa Nhanh Chiến Dịch */}
      {showProgramModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotion-program-title" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#edf3ef', color: '#376757', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" id="promotion-program-title">
                    {editingProgram ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    {editingProgram ? `Mã chiến dịch: #${editingProgram.id}` : 'Nhập thông tin chiến dịch tiếp thị & ưu đãi'}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" aria-label="Đóng" disabled={saving} onClick={() => setShowProgramModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProgram}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {programFormError && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{programFormError}</span>
                  </div>
                )}

                <div className="admin-form-group">
                  <label htmlFor="promotion-field-1" className="admin-form-label">
                    Tên Chiến Dịch Khuyến Mãi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input id="promotion-field-1"
                    type="text"
                    className="admin-form-input"
                    placeholder="VD: Tri Ân Mùa Cưới 2026, Black Friday..."
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="promotion-date-grid">
                  <div className="admin-form-group">
                    <label htmlFor="promotion-field-2" className="admin-form-label">
                      Ngày Bắt Đầu <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input id="promotion-field-2"
                      type="datetime-local"
                      className="admin-form-input"
                      value={programForm.startDate}
                      onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="promotion-field-3" className="admin-form-label">
                      Ngày Kết Thúc <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input id="promotion-field-3"
                      type="datetime-local"
                      className="admin-form-input"
                      value={programForm.endDate}
                      onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="promotion-field-4" className="admin-form-label">Trạng thái chiến dịch</label>
                  <select id="promotion-field-4"
                    className="admin-form-input"
                    value={programForm.status}
                    onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">Đã kích hoạt</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="promotion-field-5" className="admin-form-label">Mô Tả Chiến Dịch / Điều Kiện Áp Dụng</label>
                  <textarea id="promotion-field-5"
                    rows="3"
                    className="admin-form-input"
                    placeholder="VD: Giảm ngay 20% cho Sofa da Ý, tặng voucher 500k cho đơn từ 20 triệu..."
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowProgramModal(false)}
                  disabled={submittingProgram}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={submittingProgram}
                >
                  {submittingProgram ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingProgram ? 'Lưu thay đổi' : 'Tạo chiến dịch'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cấu Hình Chi Tiết Chiến Dịch (4 Tabs Chuyên Sâu) */}
      {showDetailModal && !detailData && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-label="Chi tiết chiến dịch" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header"><h3 className="admin-modal-title">Chi tiết chiến dịch</h3><button className="admin-modal-close" aria-label="Đóng" onClick={() => setShowDetailModal(false)}><X size={18} /></button></div>
            <div className="promotion-empty" role="status">
              {loadingDetail ? <><RefreshCw size={24} className="animate-spin" /><p>Đang tải cấu hình chiến dịch...</p></> : <><AlertCircle size={24} /><p>{detailError || 'Không thể tải chi tiết chiến dịch.'}</p><button className="btn-admin btn-admin-secondary" onClick={() => handleOpenDetailModal(activeProgramId, activeTab)}>Thử lại</button></>}
            </div>
          </div>
        </div>
      )}
      {showDetailModal && detailData && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotion-detail-title" style={{ maxWidth: '880px' }}>
            <div className="admin-modal-header" style={{ paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#edf3ef', color: '#376757', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 className="admin-modal-title" id="promotion-detail-title" style={{ fontSize: '1.15rem' }}>
                      {detailData.program.name}
                    </h3>
                    <span
                      style={{
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                      className={
                        detailData.program.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : detailData.program.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }
                    >
                      {detailData.program.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Thời gian: {formatDateTime(detailData.program.startDate)} ➔ {formatDateTime(detailData.program.endDate)}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" aria-label="Đóng" disabled={saving} onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="promotion-detail-tabs">
              <button
                className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'overview' ? '2px solid #376757' : '2px solid transparent',
                  fontWeight: activeTab === 'overview' ? 600 : 500,
                  color: activeTab === 'overview' ? '#376757' : '#84928a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => setActiveTab('overview')}
              >
                <Info size={16} />
                <span>1. Tổng Quan</span>
              </button>

              <button
                className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'products' ? '2px solid #376757' : '2px solid transparent',
                  fontWeight: activeTab === 'products' ? 600 : 500,
                  color: activeTab === 'products' ? '#376757' : '#84928a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => setActiveTab('products')}
              >
                <Package size={16} />
                <span>2. SP Giảm Giá ({detailData.productDiscounts.length})</span>
              </button>

              <button
                className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'orders' ? '2px solid #376757' : '2px solid transparent',
                  fontWeight: activeTab === 'orders' ? 600 : 500,
                  color: activeTab === 'orders' ? '#376757' : '#84928a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => setActiveTab('orders')}
              >
                <DollarSign size={16} />
                <span>3. Bậc Đơn Hàng ({detailData.orderDiscounts.length})</span>
              </button>

              <button
                className={`admin-tab-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'vouchers' ? '2px solid #376757' : '2px solid transparent',
                  fontWeight: activeTab === 'vouchers' ? 600 : 500,
                  color: activeTab === 'vouchers' ? '#376757' : '#84928a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => setActiveTab('vouchers')}
              >
                <Gift size={16} />
                <span>4. Kho Voucher ({detailData.vouchers.length})</span>
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.25rem' }}>
              {/* TAB 1: TỔNG QUAN */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="promotion-overview-grid">
                    <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>Cơ chế 1: SP Giảm Giá</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>
                        {detailData.productDiscounts.length} sản phẩm
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>Áp dụng trực tiếp vào giá bán lẻ</div>
                    </div>

                    <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                      <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>Cơ chế 2: Bậc Đơn Hàng</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4c1d95', marginTop: '4px' }}>
                        {detailData.orderDiscounts.length} mức chiết khấu
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>Kích thích mua trọn gói căn hộ</div>
                    </div>

                    <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Cơ chế 3: Kho Voucher</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#064e3b', marginTop: '4px' }}>
                        {detailData.vouchers.length} mã phát hành
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>Phiếu quà tặng khi thanh toán</div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#1e293b' }}>Mô tả chiến dịch</h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                      {detailData.program.description || 'Chưa cập nhật mô tả chi tiết cho chiến dịch này.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: GIẢM GIÁ SẢN PHẨM */}
              {activeTab === 'products' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Form thêm SP giảm giá */}
                  <form
                    className="promotion-discount-form"
                    onSubmit={handleAddProductDiscount}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1.5fr auto',
                      gap: '0.75rem',
                      alignItems: 'end',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <label htmlFor="promotion-field-6" className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        Chọn Sản Phẩm Nội Thất
                      </label>
                      <select id="promotion-field-6"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        value={productDiscountForm.productId}
                        onChange={(e) => setProductDiscountForm({ ...productDiscountForm, productId: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn sản phẩm nội thất --</option>
                        {availableProducts.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            #{prod.id} - {prod.name} ({formatCurrency(prod.sellingPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="promotion-field-7" className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        % Giảm Giá (1% - 100%)
                      </label>
                      <input id="promotion-field-7"
                        type="number"
                        min="1"
                        max="100"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        value={productDiscountForm.discountPercent}
                        onChange={(e) => setProductDiscountForm({ ...productDiscountForm, discountPercent: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-admin btn-admin-primary"
                      disabled={submittingProductDiscount}
                    >
                      <Plus size={15} /> Thêm Giảm Giá
                    </button>
                  </form>

                  {/* Bảng danh sách SP giảm giá */}
                  {detailData.productDiscounts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <Package size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>Chiến dịch này chưa có sản phẩm nào được áp dụng giảm giá.</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Sản Phẩm Nội Thất</th>
                          <th style={{ textAlign: 'right' }}>Giá Gốc</th>
                          <th style={{ textAlign: 'center' }}>% Giảm</th>
                          <th style={{ textAlign: 'right' }}>Giá Sau Giảm</th>
                          <th style={{ textAlign: 'center', width: '80px' }}>Gỡ Bỏ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.productDiscounts.map((pd) => (
                          <tr key={pd.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <img
                                  src={pd.productImageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80'}
                                  alt=""
                                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{pd.productName}</div>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đơn vị: {pd.unit}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b', textDecoration: 'line-through' }}>
                              {formatCurrency(pd.sellingPrice)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ padding: '0.2rem 0.5rem', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontWeight: 700, fontSize: '0.82rem' }}>
                                -{pd.discountPercent}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                              {formatCurrency(pd.discountedPrice)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-action btn-action-danger"
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => handleDeleteProductDiscount(pd.id)}
                                title="Gỡ sản phẩm khỏi danh sách giảm giá"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: BẬC ĐƠN HÀNG */}
              {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Form thêm bậc đơn hàng */}
                  <form
                    className="promotion-discount-form"
                    onSubmit={handleAddOrderDiscount}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr auto',
                      gap: '0.75rem',
                      alignItems: 'end',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <label htmlFor="promotion-field-8" className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        Mức Đơn Hàng Tối Thiểu (VNĐ)
                      </label>
                      <input id="promotion-field-8"
                        type="number"
                        min="0"
                        step="500000"
                        placeholder="VD: 15000000"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        value={orderDiscountForm.minimumAmount}
                        onChange={(e) => setOrderDiscountForm({ ...orderDiscountForm, minimumAmount: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="promotion-field-9" className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        % Chiết Khấu Đơn Hàng (1% - 100%)
                      </label>
                      <input id="promotion-field-9"
                        type="number"
                        min="1"
                        max="100"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        value={orderDiscountForm.discountPercent}
                        onChange={(e) => setOrderDiscountForm({ ...orderDiscountForm, discountPercent: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-admin btn-admin-primary"
                      disabled={submittingOrderDiscount}
                    >
                      <Plus size={15} /> Thêm Bậc
                    </button>
                  </form>

                  {/* Bảng danh sách bậc chiết khấu */}
                  {detailData.orderDiscounts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <DollarSign size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>Chiến dịch này chưa thiết lập bậc chiết khấu giá trị đơn hàng.</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mức Giá Trị Đơn Hàng Tối Thiểu</th>
                          <th style={{ textAlign: 'center' }}>Mức Chiết Khấu</th>
                          <th>Thời Hạn Áp Dụng</th>
                          <th style={{ textAlign: 'center', width: '80px' }}>Gỡ Bỏ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.orderDiscounts.map((od) => (
                          <tr key={od.id}>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>
                              Đơn hàng từ <strong>{formatCurrency(od.minimumAmount)}</strong> trở lên
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ padding: '0.2rem 0.6rem', background: '#f5f3ff', color: '#7c3aed', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                                Giảm {od.discountPercent}%
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              {formatDateTime(od.startDate)} ➔ {formatDateTime(od.endDate)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-action btn-action-danger"
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => handleDeleteOrderDiscount(od.id)}
                                title="Xóa bậc chiết khấu"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 4: KHO VOUCHER */}
              {activeTab === 'vouchers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Form phát hành Voucher mới */}
                  <form
                    onSubmit={handleCreateVoucher}
                    style={{
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                      Phát hành mã Voucher mới cho chiến dịch này
                    </div>

                    <div className="promotion-voucher-grid">
                      <div>
                        <label htmlFor="promotion-field-10" className="admin-form-label" style={{ fontSize: '0.78rem' }}>Mã Voucher</label>
                        <input id="promotion-field-10"
                          type="text"
                          placeholder="VD: NOITHAT10"
                          className="admin-form-input"
                          style={{ textTransform: 'uppercase', fontWeight: 600 }}
                          value={voucherForm.code}
                          onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="promotion-field-11" className="admin-form-label" style={{ fontSize: '0.78rem' }}>% Giảm</label>
                        <input id="promotion-field-11"
                          type="number"
                          min="1"
                          max="100"
                          className="admin-form-input"
                          value={voucherForm.discountPercent}
                          onChange={(e) => setVoucherForm({ ...voucherForm, discountPercent: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="promotion-field-12" className="admin-form-label" style={{ fontSize: '0.78rem' }}>Đơn tối thiểu (VNĐ)</label>
                        <input id="promotion-field-12"
                          type="number"
                          min="0"
                          step="500000"
                          className="admin-form-input"
                          value={voucherForm.minimumAmount}
                          onChange={(e) => setVoucherForm({ ...voucherForm, minimumAmount: e.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor="promotion-field-13" className="admin-form-label" style={{ fontSize: '0.78rem' }}>Giảm tối đa (VNĐ)</label>
                        <input id="promotion-field-13"
                          type="number"
                          min="0"
                          step="100000"
                          placeholder="Không giới hạn"
                          className="admin-form-input"
                          value={voucherForm.maximumDiscount || ''}
                          onChange={(e) => setVoucherForm({ ...voucherForm, maximumDiscount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label htmlFor="promotion-field-14" className="admin-form-label" style={{ margin: 0, fontSize: '0.78rem' }}>
                          Số lượng phát hành:
                        </label>
                        <input id="promotion-field-14"
                          type="number"
                          min="1"
                          className="admin-form-input"
                          style={{ width: '90px' }}
                          value={voucherForm.quantity}
                          onChange={(e) => setVoucherForm({ ...voucherForm, quantity: e.target.value })}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-admin btn-admin-primary"
                        disabled={submittingVoucher}
                      >
                        <Plus size={15} /> Phát Hành Voucher
                      </button>
                    </div>
                  </form>

                  {/* Bảng danh sách Vouchers */}
                  {detailData.vouchers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <Gift size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>Chiến dịch này chưa phát hành mã voucher nào.</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã Code</th>
                          <th style={{ textAlign: 'center' }}>Ưu Đãi</th>
                          <th>Điều Kiện Áp Dụng</th>
                          <th style={{ textAlign: 'center', width: '130px' }}>Lượt Dùng</th>
                          <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                          <th style={{ textAlign: 'center', width: '70px' }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.vouchers.map((v) => {
                          const usedPercent = v.quantity > 0 ? Math.round((v.usedQuantity / v.quantity) * 100) : 0
                          return (
                            <tr key={v.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Gift size={15} className="text-orange-500" />
                                  <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px' }}>
                                    {v.code}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ padding: '0.2rem 0.5rem', background: '#edf3ef', color: '#376757', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                                  Giảm {v.discountPercent}%
                                </span>
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                                <div>Đơn từ: <strong>{formatCurrency(v.minimumAmount)}</strong></div>
                                {v.maximumDiscount && (
                                  <div>Tối đa: <strong>{formatCurrency(v.maximumDiscount)}</strong></div>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                                  {v.usedQuantity} / {v.quantity} ({usedPercent}%)
                                </div>
                                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '3px' }}>
                                  <div
                                    style={{
                                      width: `${Math.min(usedPercent, 100)}%`,
                                      height: '100%',
                                      background: usedPercent >= 90 ? '#ef4444' : '#059669'
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                  onClick={() => handleToggleVoucherStatus(v)}
                                  title="Bật/Tắt mã voucher"
                                >
                                  <span
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '999px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                    className={
                                      v.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }
                                  >
                                    {v.status}
                                  </span>
                                </button>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  className="btn-action btn-action-danger"
                                  style={{ width: '28px', height: '28px' }}
                                  onClick={() => handleDeleteVoucher(v.id)}
                                  title="Xóa voucher"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="btn-admin btn-admin-secondary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Xóa Chiến Dịch */}
      {deletingProgram && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotion-delete-title" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 className="admin-modal-title" id="promotion-delete-title" style={{ color: '#991b1b' }}>Xóa chiến dịch</h3>
              </div>
              <button className="admin-modal-close" aria-label="Đóng" disabled={saving} onClick={() => setDeletingProgram(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {deleteError ? (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem' }}>
                  {deleteError}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa chiến dịch <strong>{deletingProgram.name}</strong> không?
                  <br />
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Toàn bộ cấu hình giảm giá sản phẩm, bậc đơn hàng và voucher chưa dùng thuộc chiến dịch này sẽ được gỡ bỏ.
                  </span>
                </p>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => setDeletingProgram(null)}
                disabled={submittingDelete}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-danger"
                onClick={handleDeleteProgram}
                disabled={submittingDelete}
              >
                {submittingDelete ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác Nhận Xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
