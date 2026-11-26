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
  Ticket
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { VIP_TIER_LABELS, VOUCHER_TYPE_LABELS, isDefaultVoucherCode, memberVoucherCode, parseVoucherCustomerId } from '../lib/vouchers'
import AdminConfirmModal from './AdminConfirmModal'
import { adminErrorMessage, orderStatusLabel } from './adminDisplay'
import { formatProductUnit } from '../lib/productUnits'

const initialVoucherForm = {
  programId: '', voucherType: 'VIP', code: '', discountPercent: 10, minimumAmount: 5000000,
  maximumDiscount: 1000000, quantity: 100, status: 'INACTIVE'
}

async function fetchProgramDetail(programId, signal) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/promotions/${programId}/detail`, {
    headers: getApiHeaders(), signal
  })
  if (!response.ok) throw new Error('Không thể tải chi tiết chiến dịch.')
  return response.json()
}

export default function AdminPromotionManagement({ currentUser }) {
  const canManage = currentUser?.role === 'ADMIN'
  const canEditVouchers = canManage || (currentUser?.role === 'STAFF' && currentUser.staffType === 'SALES')
  const [deletingVoucher, setDeletingVoucher] = useState(null)
  const [programs, setPrograms] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | ACTIVE | DRAFT | INACTIVE
  const [timeFilter, setTimeFilter] = useState('ALL') // ALL | RUNNING | UPCOMING | EXPIRED
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [quickProgramId, setQuickProgramId] = useState(null)
  const [quickProgramDetails, setQuickProgramDetails] = useState(null)
  const [quickProgramRetry, setQuickProgramRetry] = useState(0)
  const programHoverTimer = useRef(null)
  const programRowRef = useRef(null)
  const programPanelRef = useRef(null)
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

  // Campaign Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [activeTab, setActiveTab] = useState('orders') // orders | products | overview

  // Products list for selecting in Product Discount tab
  const [availableProducts, setAvailableProducts] = useState([])
  const [productError, setProductError] = useState('')
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
  const [showVoucherPage, setShowVoucherPage] = useState(false)
  const [voucherProgramFilter, setVoucherProgramFilter] = useState('')
  const [voucherTypeFilter, setVoucherTypeFilter] = useState('')
  const [voucherForm, setVoucherForm] = useState(initialVoucherForm)
  const [voucherTarget, setVoucherTarget] = useState(null)
  const voucherTier = voucherForm.customerTier || 'VIP_DIAMOND'
  const isMemberVoucher = voucherForm.voucherType === 'VIP'
  const editingDefaultVoucher = voucherTarget?.mode === 'edit' && isDefaultVoucherCode(voucherTarget.voucher.code)
  const [voucherFilter, setVoucherFilter] = useState('ALL')
  const [voucherHistory, setVoucherHistory] = useState(null)
  const historyController = useRef(null)
  const voucherRowRef = useRef(null)
  const voucherPanelRef = useRef(null)
  const voucherFormRef = useRef(null)
  const [submittingVoucher, setSubmittingVoucher] = useState(false)
  const scopedVouchers = vouchers.filter(voucher =>
    (!voucherProgramFilter || String(voucher.promotionProgramId) === voucherProgramFilter) &&
    (!voucherTypeFilter || (voucher.voucherType || 'ORDER') === voucherTypeFilter))
  const visibleVouchers = scopedVouchers.filter(voucher => voucherFilter === 'ALL'
    || (voucherFilter === 'ARCHIVED' ? voucher.archived : !voucher.archived && voucher.status === voucherFilter))
  const quickVoucher = visibleVouchers.find(voucher => voucher.id === voucherHistory?.id)
  const quickVoucherProgram = programs.find(program => program.id === quickVoucher?.promotionProgramId)

  const [voucherCheck, setVoucherCheck] = useState({ voucherId: '', customerId: '', items: [{ productId: '', quantity: 1 }] })
  const [checkResult, setCheckResult] = useState(null)
  const [checkError, setCheckError] = useState('')
  const [checking, setChecking] = useState(false)
  const checkController = useRef(null)

  function changeVoucherCheck(next) {
    checkController.current?.abort()
    setChecking(false)
    setCheckResult(null)
    setCheckError('')
    setVoucherCheck(next)
  }

  useEffect(() => {
    changeVoucherCheck({ voucherId: '', customerId: '', items: [{ productId: '', quantity: 1 }] })
    return () => checkController.current?.abort()
  }, [showVoucherPage, voucherProgramFilter, vouchers])

  async function handleCheckVoucher(event) {
    event.preventDefault()
    checkController.current?.abort()
    const controller = new AbortController()
    checkController.current = controller
    setChecking(true)
    setCheckResult(null)
    setCheckError('')
    try {
      const customerId = parseVoucherCustomerId(voucherCheck.customerId)
      const response = await fetch(`${getApiBaseUrl()}/api/admin/promotions/vouchers/${voucherCheck.voucherId}/check`, {
        method: 'POST', headers: getApiHeaders({ 'Content-Type': 'application/json' }), signal: controller.signal,
        body: JSON.stringify({ customerId,
          items: voucherCheck.items.map(item => ({ productId: Number(item.productId), quantity: Number(item.quantity) })) })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không thể kiểm tra voucher. Vui lòng thử lại.')
      if (!['subtotal', 'discountAmount', 'finalTotal'].every(key => typeof data[key] === 'number' && Number.isFinite(data[key]) && data[key] >= 0)
          || data.discountAmount > data.subtotal || data.finalTotal > data.subtotal) {
        throw new Error('Kết quả kiểm tra voucher không hợp lệ. Vui lòng thử lại.')
      }
      if (!controller.signal.aborted) setCheckResult(data)
    } catch (error) {
      if (!controller.signal.aborted) setCheckError(adminErrorMessage(error))
    } finally {
      if (!controller.signal.aborted) setChecking(false)
    }
  }

  // Delete program confirmation
  const [deletingProgram, setDeletingProgram] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const modalOpen = showProgramModal || showDetailModal || !!deletingProgram || !!deletingVoucher
  const saving = submittingProgram || submittingDelete || submittingVoucher || submittingProductDiscount || submittingOrderDiscount
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    if (!modalOpen) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = [...document.querySelectorAll('.admin-promotion-management [role="dialog"]')].at(-1)
    const focusable = () => [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || [])].filter(el => el.getClientRects().length)
    focusable()[0]?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape' && !saving && deletingVoucher) {
        setDeletingVoucher(null)
        return
      }
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
  }, [modalOpen, saving, loadingDetail, deletingVoucher])

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
      const [res, voucherRes] = await Promise.all([
        fetch(url, { headers: getApiHeaders() }),
        fetch(`${baseUrl}/api/admin/promotions/vouchers`, { headers: getApiHeaders() }),
      ])
      if (!res.ok || !voucherRes.ok) {
        throw new Error(`Lỗi tải danh sách khuyến mãi và voucher (HTTP ${!res.ok ? res.status : voucherRes.status})`)
      }
      const [data, vouchers] = await Promise.all([res.json(), voucherRes.json()])
      if (!Array.isArray(data) || !Array.isArray(vouchers)) throw new Error('Dữ liệu khuyến mãi/voucher không hợp lệ.')
      if (id === requestId.current) {
        setVouchers(vouchers)
        setPrograms(data.map(p => ({ ...p,
          voucherCodes: vouchers.filter(v => v.promotionProgramId === p.id).map(v => `${v.code} (${VOUCHER_TYPE_LABELS[v.voucherType || 'ORDER']})`),
        })))
      }
    } catch (err) {
      console.error(err)
      if (id === requestId.current) setError(adminErrorMessage(err, 'Không thể kết nối đến máy chủ.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  // Fetch available products
  const fetchProducts = async () => {
    setProductError('')
    try {
      const baseUrl = getApiBaseUrl()
      const products = []
      let page = 0
      let totalPages = 1
      do {
        const res = await fetch(`${baseUrl}/api/admin/products?size=100&page=${page}`, { headers: getApiHeaders() })
        if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
        const data = await res.json()
        if (!Array.isArray(data.content)) throw new Error('Danh sách sản phẩm không hợp lệ.')
        products.push(...data.content)
        totalPages = data.totalPages || 1
        page++
      } while (page < totalPages)
      setAvailableProducts(products)
    } catch (err) {
      setProductError(adminErrorMessage(err))
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
      if (keyword && !normalize(`${p.name} ${p.description || ''} ${p.voucherCodes.join(' ')}`).includes(keyword)) return false
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
  const quickProgram = showVoucherPage ? null : pagedPrograms.find(program => program.id === quickProgramId)
  const quickProgramVouchers = quickProgram ? vouchers.filter(voucher => voucher.promotionProgramId === quickProgram.id) : []
  const quickDiscountDetails = quickProgramDetails?.program === quickProgram ? quickProgramDetails : null
  const hasFilters = !!searchKeyword.trim() || statusFilter !== 'ALL' || timeFilter !== 'ALL'
  const resetFilters = () => { setSearchKeyword(''); setStatusFilter('ALL'); setTimeFilter('ALL'); setPage(1) }

  useEffect(() => {
    if (!quickProgram && quickProgramId !== null) setQuickProgramId(null)
  }, [quickProgram, quickProgramId])

  useEffect(() => clearProgramHover, [displayedPrograms, currentPage, pageSize, showVoucherPage, modalOpen])

  useEffect(() => {
    setQuickProgramDetails(null)
    if (!quickProgram) return
    const controller = new AbortController()
    fetchProgramDetail(quickProgram.id, controller.signal)
      .then(data => {
        if (!Array.isArray(data?.orderDiscounts) || !Array.isArray(data?.productDiscounts)) {
          throw new Error('Dữ liệu ưu đãi của chiến dịch không hợp lệ.')
        }
        if (!controller.signal.aborted) setQuickProgramDetails({ program: quickProgram, data })
      })
      .catch(error => {
        if (!controller.signal.aborted) setQuickProgramDetails({ program: quickProgram, error: adminErrorMessage(error) })
      })
    return () => controller.abort()
  }, [quickProgram, quickProgramRetry])

  function clearProgramHover() {
    clearTimeout(programHoverTimer.current)
    programHoverTimer.current = null
  }

  function showProgramPreview(id, { scroll = true } = {}) {
    clearProgramHover()
    setQuickProgramId(id)
    if (scroll && window.matchMedia('(max-width: 1199px)').matches) {
      requestAnimationFrame(() => programPanelRef.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function closeProgramPreview() {
    const row = programRowRef.current
    clearProgramHover()
    setQuickProgramId(null)
    requestAnimationFrame(() => row?.focus({ preventScroll: true }))
  }

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
      setProgramFormError(adminErrorMessage(err, 'Lỗi khi lưu chiến dịch.'))
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
      showToast(adminErrorMessage(err), 'error')
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
      setDeleteError(adminErrorMessage(err))
    } finally {
      setSubmittingDelete(false)
    }
  }

  // Open Detail / Configuration Modal
  const handleOpenDetailModal = async (programId, tab = 'orders') => {
    setActiveProgramId(programId)
    setActiveTab(tab)
    setShowDetailModal(true)
    setLoadingDetail(true)
    setDetailData(null)
    setDetailError('')
    try {
      setDetailData(await fetchProgramDetail(programId))

      if (availableProducts.length > 0) {
        setProductDiscountForm({ productId: availableProducts[0].id, discountPercent: 10 })
      }
    } catch (err) {
      setDetailError(adminErrorMessage(err))
    } finally {
      setLoadingDetail(false)
    }
  }

  // Refresh current detail modal data
  const refreshDetail = async () => {
    if (!activeProgramId) return
    try {
      setDetailData(await fetchProgramDetail(activeProgramId))
    } catch (err) {
      console.error(err)
    } finally {
      fetchPrograms()
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
      showToast(adminErrorMessage(err), 'error')
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
      showToast(adminErrorMessage(err), 'error')
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
      showToast(adminErrorMessage(err), 'error')
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
      showToast(adminErrorMessage(err), 'error')
    }
  }

  // Create Voucher
  const handleCreateVoucher = async (e) => {
    e.preventDefault()
    const voucherCode = voucherForm.code.trim().toUpperCase()
    if (!voucherCode) {
      showToast('Mã voucher không được để trống.', 'error')
      return
    }
    if (isDefaultVoucherCode(voucherCode) && !editingDefaultVoucher) {
      showToast('Đây là mã thành viên mặc định. Hãy nhập mã khác.', 'error')
      return
    }
    setSubmittingVoucher(true)
    try {
      const baseUrl = getApiBaseUrl()
      const payload = {
        customerTier: voucherTier,
        voucherType: voucherTarget ? voucherTarget.voucher.voucherType || 'ORDER' : voucherForm.voucherType,
        productId: voucherTarget?.voucher.productId ?? null,
        startDate: voucherForm.startDate || null,
        endDate: voucherForm.endDate || null,
        code: voucherCode,
        discountPercent: Number(voucherForm.discountPercent),
        minimumAmount: Number(voucherForm.minimumAmount) || 0,
        maximumDiscount: voucherForm.maximumDiscount ? Number(voucherForm.maximumDiscount) : null,
        quantity: Number(voucherForm.quantity) || 50,
        status: voucherForm.status
      }

      const path = voucherTarget ? `vouchers/${voucherTarget.voucher.id}${voucherTarget.mode === 'replace' ? '/replace' : ''}` : `${voucherForm.programId}/vouchers`
      const res = await fetch(`${baseUrl}/api/admin/promotions/${path}`, {
        method: voucherTarget?.mode === 'edit' ? 'PUT' : 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi phát hành voucher.')
      showToast(voucherTarget?.mode === 'replace' ? `Đã tạo ${data.code} tạm ngưng thay thế ${voucherTarget.voucher.code}` : `Đã lưu voucher ${data.code} ở trạng thái tạm ngưng`)
      if (voucherTypeFilter) setVoucherTypeFilter(payload.voucherType)
      setVoucherTarget(null)
      setVoucherForm({ ...initialVoucherForm, programId: voucherForm.programId, voucherType: payload.voucherType === 'PRODUCT' ? 'VIP' : payload.voucherType })
      await fetchPrograms()
    } catch (err) {
      showToast(adminErrorMessage(err), 'error')
    } finally {
      setSubmittingVoucher(false)
    }
  }

  async function createOrderExamples(programId) {
    setSubmittingVoucher(true)
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/promotions/${programId}/vouchers/order-examples`, {
        method: 'POST', headers: getApiHeaders()
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không thể tạo voucher hóa đơn mẫu.')
      showToast(data.created ? `Đã tạo ${data.created} mã hóa đơn ở trạng thái tạm ngưng` : 'Chiến dịch đã có đủ mã hóa đơn mẫu')
      await fetchPrograms()
    } catch (error) {
      showToast(adminErrorMessage(error), 'error')
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật trạng thái voucher.')
      showToast(`Voucher ${voucher.code} đã chuyển sang ${newStatus}!`)
      await fetchPrograms()
    } catch (err) {
      showToast(adminErrorMessage(err), 'error')
    }
  }

  // Delete Voucher
  const handleDeleteVoucher = async (voucherId) => {
    setSubmittingVoucher(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/promotions/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể xóa voucher.')
      showToast(data.message)
      setDeletingVoucher(null)
      await fetchPrograms()
    } catch (err) {
      showToast(adminErrorMessage(err), 'error')
    } finally {
      setSubmittingVoucher(false)
    }
  }

  function prepareVoucher(voucher, mode) {
    setVoucherTarget({ voucher, mode })
    setVoucherForm({ ...voucher, code: mode === 'replace' ? '' : voucher.code,
      programId: String(voucher.promotionProgramId),
      status: 'INACTIVE',
      maximumDiscount: voucher.maximumDiscount ?? '' })
    const form = voucherFormRef.current
    if (!form) return
    form.closest('details').open = true
    form.scrollIntoView({ block: 'start' })
    form.querySelector('input')?.focus({ preventScroll: true })
  }

  function openVoucherPage(programId = '', type = '') {
    const scope = String(programId)
    setShowDetailModal(false)
    setShowVoucherPage(true)
    setVoucherProgramFilter(scope)
    setVoucherTypeFilter(type)
    setVoucherFilter('ALL')
    setVoucherTarget(null)
    setVoucherForm({ ...initialVoucherForm, programId: scope, voucherType: type === 'ORDER' ? 'ORDER' : 'VIP' })
  }

  useEffect(() => {
    setVoucherHistory(null)
    return () => historyController.current?.abort()
  }, [showVoucherPage, voucherProgramFilter, voucherTypeFilter, voucherFilter])

  function showVoucherPreview(voucher) {
    if (voucherHistory?.id !== voucher.id || voucherHistory?.error) viewVoucherOrders(voucher.id)
    if (window.matchMedia('(max-width: 1199px)').matches) {
      requestAnimationFrame(() => voucherPanelRef.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function closeVoucherPreview() {
    const row = voucherRowRef.current
    historyController.current?.abort()
    setVoucherHistory(null)
    requestAnimationFrame(() => row?.focus({ preventScroll: true }))
  }

  async function viewVoucherOrders(id) {
    historyController.current?.abort()
    const controller = new AbortController()
    historyController.current = controller
    setVoucherHistory({ id, loading: true })
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/promotions/vouchers/${id}/orders`, {
        headers: getApiHeaders(), signal: controller.signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không tải được lịch sử voucher')
      if (!Array.isArray(data)) throw new Error('Dữ liệu lịch sử voucher không hợp lệ.')
      if (!controller.signal.aborted) setVoucherHistory({ id, orders: data })
    } catch (error) {
      if (!controller.signal.aborted) setVoucherHistory({ id, error: adminErrorMessage(error) })
    }
  }

  const voucherStatusLabel = voucher => voucher.archived ? 'Đã lưu trữ' : voucher.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Tạm ngưng'
  const programStatusLabel = program => program.status === 'ACTIVE' ? 'Đã kích hoạt' : program.status === 'DRAFT' ? 'Bản nháp' : 'Tạm dừng'

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
        {!showVoucherPage && <button className="btn-admin btn-admin-primary" disabled={!canManage} onClick={handleOpenCreateProgram}>
          <Plus size={17} /><span>Tạo chiến dịch</span>
        </button>}
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

      <div className="promotion-status-tabs promotion-workspace-tabs" role="group" aria-label="Quản lý khuyến mãi">
        <button type="button" aria-pressed={!showVoucherPage} className={!showVoucherPage ? 'active' : ''} onClick={() => setShowVoucherPage(false)}>Chiến dịch</button>
        <button type="button" aria-pressed={showVoucherPage} className={showVoucherPage ? 'active' : ''} onClick={() => { if (!showVoucherPage) openVoucherPage() }}>Voucher</button>
      </div>

      {!showVoucherPage && <>
      <div className="promotion-review-layout">
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
            <input type="search" placeholder="Tìm chiến dịch, mã voucher, mô tả..." aria-label="Tìm kiếm chiến dịch" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
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
            <thead><tr><th>Chiến dịch</th><th>Thời gian áp dụng</th><th>Ưu đãi</th><th>Trạng thái</th><th className="promotion-actions-heading">Thao tác</th></tr></thead>
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
                  <button className={hasFilters ? 'btn-admin btn-admin-secondary' : 'btn-admin btn-admin-primary'} disabled={!canManage && !hasFilters} onClick={hasFilters ? resetFilters : handleOpenCreateProgram}>
                    {hasFilters ? <X size={15} /> : <Plus size={15} />}{hasFilters ? 'Xóa bộ lọc' : 'Tạo chiến dịch đầu tiên'}
                  </button>
                </div></td></tr>
              ) : pagedPrograms.map(p => {
                const now = new Date()
                const isRunning = p.status === 'ACTIVE' && now >= new Date(p.startDate) && now <= new Date(p.endDate)
                const isExpired = now > new Date(p.endDate)
                const isUpcoming = now < new Date(p.startDate)
                return (
                  <tr key={p.id}
                    ref={quickProgramId === p.id ? programRowRef : null}
                    className={`promotion-preview-row${quickProgramId === p.id ? ' is-selected' : ''}`}
                    tabIndex={0}
                    aria-label={`Xem chi tiết chiến dịch ${p.name}`}
                    aria-current={quickProgramId === p.id ? 'true' : undefined}
                    onPointerMove={event => {
                      if (event.pointerType !== 'mouse') return
                      if (quickProgramId === p.id || event.target.closest('.promotion-row-actions, .promotion-status-badge, .promotion-setup-link')) {
                        clearProgramHover()
                      } else if (programHoverTimer.current === null) {
                        programHoverTimer.current = setTimeout(() => showProgramPreview(p.id, { scroll: false }), 250)
                      }
                    }}
                    onPointerLeave={clearProgramHover}
                    onClick={event => {
                      if (!event.target.closest('button')) showProgramPreview(p.id)
                    }}
                    onKeyDown={event => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        showProgramPreview(p.id)
                      }
                    }}
                  >
                    <td><div className="promotion-name-cell"><div className={`promotion-row-icon ${isRunning ? 'running' : ''}`}><Tag size={18} strokeWidth={1.6} /></div><div>
                      <button type="button" className="promotion-name-button" onClick={() => showProgramPreview(p.id)}>{p.name}</button>
                      <div className="promotion-row-description" title={p.description || ''}>#{String(p.id).padStart(2, '0')} · {p.description || 'Chưa có mô tả'}</div>
                      {p.voucherCodes.length > 0 && <div className="promotion-row-description" title={p.voucherCodes.join(', ')}>Mã voucher: {p.voucherCodes.join(', ')}</div>}
                    </div></div></td>
                    <td><div className="promotion-date"><Calendar size={13} />{formatDateTime(p.startDate)} – {formatDateTime(p.endDate)}</div><span className={`promotion-schedule ${isRunning ? 'running' : ''}`}>{isRunning ? 'Đang diễn ra' : isExpired ? 'Đã kết thúc' : isUpcoming ? 'Sắp diễn ra' : 'Chưa kích hoạt'}</span></td>
                    <td><div className="promotion-discount-tags">
                      {p.productDiscountsCount > 0 && <button type="button" onClick={() => showProgramPreview(p.id)}>{p.productDiscountsCount} sản phẩm</button>}
                      {p.orderDiscountsCount > 0 && <button type="button" onClick={() => handleOpenDetailModal(p.id)}>{p.orderDiscountsCount} bậc đơn</button>}
                      {p.vouchersCount > 0 && <button type="button" onClick={() => showProgramPreview(p.id)}>{p.vouchersCount} voucher</button>}
                      {!p.productDiscountsCount && !p.orderDiscountsCount && !p.vouchersCount && <button className="promotion-setup-link" onClick={() => handleOpenDetailModal(p.id)}>Thiết lập ưu đãi <ArrowRight size={12} /></button>}
                    </div></td>
                    <td><button className={`promotion-status-badge status-${p.status.toLowerCase()}`} disabled={!canManage} onClick={() => handleToggleStatus(p)} title="Nhấn để bật hoặc tạm dừng chiến dịch"><span />{programStatusLabel(p)}</button></td>
                    <td><div className="promotion-row-actions">
                      <button className="btn-action" title="Thiết lập ưu đãi" aria-label={`Thiết lập ưu đãi: ${p.name}`} onClick={() => handleOpenDetailModal(p.id)}><Settings size={16} /></button>
                      <button className="btn-action" title="Chỉnh sửa chiến dịch" aria-label={`Chỉnh sửa: ${p.name}`} disabled={!canManage} onClick={() => handleOpenEditProgram(p)}><Edit2 size={15} /></button>
                      <button className="btn-action btn-action-danger" title="Xóa chiến dịch" aria-label={`Xóa: ${p.name}`} disabled={!canManage} onClick={() => { setDeletingProgram(p); setDeleteError('') }}><Trash2 size={15} /></button>
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

      {quickProgram && <section ref={programPanelRef} className="promotion-quick-detail" aria-label="Chi tiết chiến dịch">
        <div className="promotion-quick-heading">
          <h2>Chi tiết chiến dịch</h2>
          <button type="button" className="admin-btn admin-btn-outline" aria-label="Đóng chi tiết chiến dịch" onClick={closeProgramPreview}><X size={16} /></button>
        </div>
        <div className="promotion-quick-content">
          <div className="promotion-quick-summary">
            <h3>{quickProgram.name}</h3>
            <dl>
              <div><dt>Mã chiến dịch</dt><dd>#{String(quickProgram.id).padStart(2, '0')}</dd></div>
              <div><dt>Trạng thái</dt><dd>{programStatusLabel(quickProgram)}</dd></div>
              <div><dt>Thời gian áp dụng</dt><dd>{formatDateTime(quickProgram.startDate)} – {formatDateTime(quickProgram.endDate)}</dd></div>
              {quickProgram.description && <div><dt>Mô tả</dt><dd>{quickProgram.description}</dd></div>}
            </dl>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleOpenDetailModal(quickProgram.id)}>Thiết lập ưu đãi</button>
          </div>

          {Object.entries(VOUCHER_TYPE_LABELS).map(([type, label]) => {
            const codes = quickProgramVouchers.filter(voucher => (voucher.voucherType || 'ORDER') === type)
            const productDiscounts = quickDiscountDetails?.data?.productDiscounts
            return <section key={type} className="promotion-quick-section" aria-labelledby={`promotion-quick-${type}`}>
              <h3 id={`promotion-quick-${type}`}>{type === 'PRODUCT' ? 'Giảm giá theo sản phẩm' : `Voucher ${label.toLowerCase()}`}</h3>
              {type === 'PRODUCT' && (!quickDiscountDetails ? <p role="status">Đang tải ưu đãi sản phẩm...</p>
                : quickDiscountDetails.error ? <div role="alert">
                  <p>{quickDiscountDetails.error}</p>
                  <button type="button" className="admin-btn admin-btn-outline" onClick={() => setQuickProgramRetry(attempt => attempt + 1)}>Thử lại</button>
                </div> : productDiscounts.length ? <div className="admin-table-container">
                <table className="admin-table promotion-voucher-table">
                  <thead><tr><th>Sản phẩm</th><th>Giá ưu đãi</th><th>Thời gian áp dụng</th></tr></thead>
                  <tbody>{productDiscounts.map(discount => <tr key={discount.id}>
                    <td><strong>{discount.productName}</strong></td>
                    <td><div className="promotion-product-prices">
                      <del aria-label="Giá gốc">{formatCurrency(discount.sellingPrice)}</del>
                      <span>-{discount.discountPercent}%</span>
                      <strong aria-label="Giá ưu đãi">{formatCurrency(discount.discountedPrice)}</strong>
                    </div></td>
                    <td>{formatDateTime(discount.startDate)} – {formatDateTime(discount.endDate)}</td>
                  </tr>)}</tbody>
                </table>
              </div> : <p>Chiến dịch này chưa có sản phẩm giảm giá.</p>)}
              {codes.length > 0 ? <div className="admin-table-container">
                <table className="admin-table promotion-voucher-table">
                  <thead><tr><th>Mã voucher</th><th>{type === 'ORDER' ? 'Đơn tối thiểu' : type === 'VIP' ? 'Hạng áp dụng' : 'Sản phẩm áp dụng'}</th><th>Ưu đãi</th><th>Trạng thái</th></tr></thead>
                  <tbody>{codes.map(voucher => <tr key={voucher.id}>
                    <td><strong>{voucher.code}</strong></td>
                    <td>{type === 'ORDER' ? formatCurrency(voucher.minimumAmount)
                      : type === 'VIP' ? VIP_TIER_LABELS[voucher.customerTier] || '—'
                        : availableProducts.find(product => product.id === voucher.productId)?.name || `#${voucher.productId}`}</td>
                    <td><span className="promotion-voucher-discount">Giảm {voucher.discountPercent}%</span>{voucher.maximumDiscount != null && <div>Tối đa {formatCurrency(voucher.maximumDiscount)}</div>}</td>
                    <td><span className={`promotion-voucher-status ${voucher.status === 'ACTIVE' && !voucher.archived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{voucherStatusLabel(voucher)}</span></td>
                  </tr>)}</tbody>
                </table>
              </div> : type !== 'PRODUCT' && <p>Chưa có mã voucher.</p>}
              <div className="promotion-quick-actions">
                {type === 'PRODUCT' && <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleOpenDetailModal(quickProgram.id, 'products')}>Thiết lập ưu đãi sản phẩm</button>}
                {(type !== 'PRODUCT' || codes.length > 0) && <button type="button" className="admin-btn admin-btn-outline" onClick={() => openVoucherPage(quickProgram.id, type)}>Quản lý mã {label.toLowerCase()}</button>}
                {type === 'ORDER' && canManage && <button type="button" className="admin-btn admin-btn-outline" disabled={submittingVoucher} onClick={() => createOrderExamples(quickProgram.id)}>Tạo 3 mã hóa đơn mẫu</button>}
              </div>
            </section>
          })}
        </div>
      </section>}
      </div>

      </>}

      {showVoucherPage && (
        <section className="promotion-vouchers" aria-label="Quản lý voucher">
          {canEditVouchers && <details className="promotion-voucher-create">
          <summary>{voucherTarget ? `${voucherTarget.mode === 'edit' ? 'Sửa voucher' : 'Tạo mã thay thế'} ${voucherTarget.voucher.code}` : 'Tạo voucher'}</summary>
          <form
            onSubmit={handleCreateVoucher}
            ref={voucherFormRef}
            className="promotion-voucher-form"
            style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--admin-radius)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
              {voucherTarget ? `${voucherTarget.mode === 'edit' ? 'Sửa voucher' : 'Tạo mã mới thay thế'} ${voucherTarget.voucher.code}` : 'Tạo voucher tạm ngưng'}
            </div>

            <p>{voucherTarget ? `Loại: ${VOUCHER_TYPE_LABELS[voucherTarget.voucher.voucherType || 'ORDER']}. ${voucherTarget.mode === 'replace' ? 'Mã mới được tạo ở trạng thái tạm ngưng; mã cũ tự tạm ngưng. Đơn đã sử dụng giữ nguyên giá trị.' : 'Chỉ sửa mã tạm ngưng chưa từng có đơn sử dụng.'}` : 'Mã mới luôn tạm ngưng. Quản trị viên có thể kích hoạt từ khung chi tiết voucher.'}</p>
            {voucherTarget && <button type="button" className="admin-btn admin-btn-outline" disabled={submittingVoucher} onClick={() => {
              setVoucherTarget(null)
              setVoucherForm({ ...initialVoucherForm, programId: voucherForm.programId, voucherType: voucherTypeFilter === 'ORDER' ? 'ORDER' : 'VIP' })
            }}>Hủy chỉnh sửa</button>}

            {!voucherTarget && <div>
              <label htmlFor="voucher-form-program" className="admin-form-label">Chiến dịch phát hành</label>
              <select id="voucher-form-program" className="admin-form-input" required value={voucherForm.programId} onChange={event => setVoucherForm({ ...voucherForm, programId: event.target.value })}>
                <option value="">Chọn chiến dịch</option>
                {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
              </select>
            </div>}
            <div className="promotion-voucher-grid">
              {!voucherTarget && <div>
                <label htmlFor="voucher-type" className="admin-form-label">Loại voucher</label>
                <select id="voucher-type" className="admin-form-input" value={voucherForm.voucherType} onChange={event => setVoucherForm({ ...voucherForm, voucherType: event.target.value })}>
                  <option value="ORDER">{VOUCHER_TYPE_LABELS.ORDER}</option>
                  <option value="VIP">{VOUCHER_TYPE_LABELS.VIP}</option>
                </select>
              </div>}
              <div>
                <label htmlFor="promotion-field-10" className="admin-form-label" style={{ fontSize: '0.78rem' }}>Mã Voucher</label>
                <input id="promotion-field-10"
                  type="text"
                  placeholder={isMemberVoucher ? `VD: ${memberVoucherCode(voucherTier)}-THANG12` : 'VD: NOITHAT10'}
                  className="admin-form-input"
                  style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  readOnly={editingDefaultVoucher}
                  maxLength={50}
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
                  value={voucherForm.maximumDiscount ?? ''}
                  onChange={(e) => setVoucherForm({ ...voucherForm, maximumDiscount: e.target.value })}
                />
              </div>
            </div>

            <div className="promotion-date-grid">
              {isMemberVoucher && <div><label htmlFor="voucher-tier" className="admin-form-label">Hạng thành viên áp dụng</label><select id="voucher-tier" className="admin-form-input" value={voucherTier} disabled={editingDefaultVoucher} onChange={e => setVoucherForm({ ...voucherForm, customerTier: e.target.value })}>{Object.entries(VIP_TIER_LABELS).map(([tier, label]) => <option key={tier} value={tier}>{label}</option>)}</select></div>}
              <div><label htmlFor="voucher-start" className="admin-form-label">Bắt đầu áp dụng</label><input id="voucher-start" type="datetime-local" className="admin-form-input" value={(voucherForm.startDate || '').slice(0, 16)} onChange={e => setVoucherForm({ ...voucherForm, startDate: e.target.value })} /></div>
              <div><label htmlFor="voucher-end" className="admin-form-label">Hết hạn</label><input id="voucher-end" type="datetime-local" className="admin-form-input" value={(voucherForm.endDate || '').slice(0, 16)} onChange={e => setVoucherForm({ ...voucherForm, endDate: e.target.value })} /></div>
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
                <Plus size={15} /> {submittingVoucher ? 'Đang lưu...' : voucherTarget?.mode === 'edit' ? 'Lưu thay đổi' : voucherTarget ? 'Tạo mã thay thế' : 'Tạo voucher tạm ngưng'}
              </button>
            </div>
          </form>
          </details>}

          <div className="promotion-voucher-toolbar">
            <h2>Danh sách voucher <span>({visibleVouchers.length})</span></h2>
            <div>
              <label className="admin-form-label" htmlFor="voucher-program-filter">Chiến dịch</label>
              <select id="voucher-program-filter" className="admin-form-input" value={voucherProgramFilter} onChange={e => setVoucherProgramFilter(e.target.value)}>
                <option value="">Tất cả chiến dịch</option>
                {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
              </select>
              <label className="admin-form-label" htmlFor="voucher-type-filter">Loại voucher</label>
              <select id="voucher-type-filter" className="admin-form-input" value={voucherTypeFilter} onChange={event => setVoucherTypeFilter(event.target.value)}>
                <option value="">Tất cả loại</option>
                {Object.entries(VOUCHER_TYPE_LABELS).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
              </select>
              <label className="admin-form-label" htmlFor="voucher-status-filter">Lọc trạng thái voucher</label>
              <select id="voucher-status-filter" className="admin-form-input" value={voucherFilter} onChange={e => setVoucherFilter(e.target.value)}>
                <option value="ALL">Tất cả</option><option value="ACTIVE">Đã kích hoạt</option><option value="INACTIVE">Tạm ngưng</option><option value="ARCHIVED">Đã lưu trữ</option>
              </select>
            </div>
          </div>
          {error && <div className="promotion-error" role="alert"><AlertCircle size={19} /><p>{error}</p><button className="btn-admin btn-admin-secondary" onClick={fetchPrograms}>Thử lại</button></div>}
          {loading && <p role="status">Đang tải danh sách voucher...</p>}
          {!loading && !error && visibleVouchers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <Gift size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>{vouchers.length ? 'Không có voucher phù hợp với bộ lọc.' : 'Chưa có voucher nào.'}</p>
            </div>
          )}
          {visibleVouchers.length > 0 && <div className="promotion-review-layout">
            <div className="promotion-voucher-table-scroll" role="region" aria-label="Danh sách voucher" tabIndex={0}>
            <table className="admin-table promotion-voucher-table">
              <thead>
                <tr>
                  <th>Mã voucher</th>
                  <th>Loại voucher</th>
                  <th style={{ textAlign: 'center' }}>Ưu đãi</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Lượt dùng</th>
                </tr>
              </thead>
              <tbody>
                {visibleVouchers.map((v) => {
                  const usedPercent = v.quantity > 0 ? Math.round((v.usedQuantity / v.quantity) * 100) : 0
                  return (
                    <tr key={v.id}
                      ref={quickVoucher?.id === v.id ? voucherRowRef : null}
                      className={`promotion-preview-row${quickVoucher?.id === v.id ? ' is-selected' : ''}`}
                      tabIndex={0}
                      aria-label={`Xem chi tiết voucher ${v.code}`}
                      aria-current={quickVoucher?.id === v.id ? 'true' : undefined}
                      onClick={() => showVoucherPreview(v)}
                      onKeyDown={event => {
                        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          showVoucherPreview(v)
                        }
                      }}
                    >
                      <td>
                        <button type="button" className="promotion-voucher-code">{v.code}</button>
                      </td>
                      <td><span className="promotion-voucher-type">{VOUCHER_TYPE_LABELS[v.voucherType || 'ORDER']}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="promotion-voucher-discount">
                          Giảm {v.discountPercent}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`promotion-voucher-status ${v.status === 'ACTIVE' && !v.archived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                          {voucherStatusLabel(v)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                          {v.usedQuantity} / {v.quantity} ({usedPercent}%)
                        </div>
                        <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden', marginTop: '3px' }}>
                          <div style={{ width: `${Math.min(usedPercent, 100)}%`, height: '100%', background: usedPercent >= 90 ? '#ef4444' : '#059669' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            {quickVoucher && <section ref={voucherPanelRef} className="promotion-quick-detail" aria-label="Chi tiết voucher">
              <div className="promotion-quick-heading">
                <h2>Chi tiết voucher</h2>
                <button type="button" className="admin-btn admin-btn-outline" aria-label="Đóng chi tiết voucher" onClick={closeVoucherPreview}><X size={16} /></button>
              </div>
              <div className="promotion-quick-content">
                <div>
                  <h3>Điều kiện áp dụng</h3>
                  <dl>
                    <div><dt>Loại voucher</dt><dd>{VOUCHER_TYPE_LABELS[quickVoucher.voucherType || 'ORDER']}</dd></div>
                    {quickVoucher.voucherType === 'PRODUCT' && <div><dt>Sản phẩm</dt><dd>{availableProducts.find(p => p.id === quickVoucher.productId)?.name || `#${quickVoucher.productId}`}</dd></div>}
                    {quickVoucher.voucherType === 'VIP' && <div><dt>Hạng thành viên áp dụng</dt><dd>{VIP_TIER_LABELS[quickVoucher.customerTier] || '—'}</dd></div>}
                    <div><dt>Giá trị đơn tối thiểu</dt><dd>{formatCurrency(quickVoucher.minimumAmount)}</dd></div>
                    <div><dt>Mức giảm tối đa</dt><dd>{quickVoucher.maximumDiscount == null ? 'Không giới hạn' : formatCurrency(quickVoucher.maximumDiscount)}</dd></div>
                  </dl>
                </div>
                <div className="promotion-quick-summary">
                  <h3>Voucher {quickVoucher.code}</h3>
                  <span className="promotion-voucher-discount">Giảm {quickVoucher.discountPercent}%</span>
                  <dl>
                    <div><dt>Trạng thái</dt><dd>{voucherStatusLabel(quickVoucher)}</dd></div>
                    <div><dt>Chiến dịch</dt><dd>{quickVoucher.programName || quickVoucherProgram?.name || '—'}</dd></div>
                    <div><dt>Thời gian áp dụng</dt><dd>{formatDateTime(quickVoucher.startDate ?? quickVoucherProgram?.startDate)} – {formatDateTime(quickVoucher.endDate ?? quickVoucherProgram?.endDate)}</dd></div>
                    <div><dt>Lượt đã dùng</dt><dd>{quickVoucher.usedQuantity} / {quickVoucher.quantity}</dd></div>
                  </dl>
                  <div className="promotion-voucher-actions">
                    <button type="button" className="admin-btn admin-btn-outline" title="Bật/Tắt mã voucher" disabled={loading || !canEditVouchers || quickVoucher.archived || (!canManage && quickVoucher.status !== 'ACTIVE')} onClick={() => handleToggleVoucherStatus(quickVoucher)}>
                      {quickVoucher.status === 'ACTIVE' ? 'Tạm ngưng voucher' : 'Kích hoạt voucher'}
                    </button>
                    <button type="button" className="admin-btn admin-btn-outline" disabled={!canEditVouchers || quickVoucher.archived || quickVoucher.status !== 'INACTIVE' || quickVoucher.usedQuantity > 0 || quickVoucher.ordersCount > 0} title={quickVoucher.usedQuantity > 0 || quickVoucher.ordersCount > 0 ? 'Đã có lịch sử sử dụng; hãy tạo mã mới thay thế' : 'Sửa voucher chưa dùng'} onClick={() => prepareVoucher(quickVoucher, 'edit')}>Sửa</button>
                    <button type="button" className="admin-btn admin-btn-outline" disabled={!canManage || quickVoucher.archived} onClick={() => prepareVoucher(quickVoucher, 'replace')}>Tạo mã thay thế</button>
                    <button type="button" className="admin-btn admin-btn-outline" disabled={!canManage || quickVoucher.archived || isDefaultVoucherCode(quickVoucher.code)} onClick={() => setDeletingVoucher(quickVoucher)}>
                      <Trash2 size={14} />{quickVoucher.usedQuantity > 0 || quickVoucher.ordersCount > 0 ? 'Lưu trữ voucher' : 'Xóa vĩnh viễn voucher'}
                    </button>
                  </div>
                </div>
                <section aria-label="Lịch sử sử dụng voucher" aria-busy={!!voucherHistory.loading}>
                  <h3>Lịch sử sử dụng</h3>
                  {voucherHistory.loading ? <p role="status">Đang tải lịch sử...</p> : voucherHistory.error ? <div role="alert">
                    <p>{voucherHistory.error}</p>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={() => viewVoucherOrders(quickVoucher.id)}>Thử lại</button>
                  </div> : voucherHistory.orders?.length ? <div className="admin-table-container">
                    <table className="admin-table promotion-voucher-history-table">
                      <thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Trạng thái</th><th>Giảm giá đã chốt</th><th>Tổng thanh toán</th></tr></thead>
                      <tbody>{voucherHistory.orders.map(order => <tr key={order.id}><td>#{order.id}</td><td>{new Date(order.order_date).toLocaleString('vi-VN')}</td><td>{orderStatusLabel(order.status)}</td><td>{formatCurrency(order.discount_amount)}</td><td>{formatCurrency(order.total_amount)}</td></tr>)}</tbody>
                    </table>
                  </div> : <p>Chưa có đơn sử dụng mã này.</p>}
                </section>
              </div>
            </section>}
          </div>}
          <details className="promotion-check-panel">
            <summary>Kiểm tra số tiền giảm thực tế</summary>
          <form onSubmit={handleCheckVoucher} className="promotion-voucher-check admin-card" aria-label="Kiểm tra voucher">
            <h3>Kiểm tra số tiền giảm thực tế</h3>
            <p>Mô phỏng khoản giảm khi mã tạm ngưng hoặc chưa đến ngày áp dụng. Nhập mã khách hàng để kiểm tra voucher theo hạng thành viên.</p>
            <div className="promotion-voucher-grid">
              <div><label htmlFor="check-voucher" className="admin-form-label">Voucher cần kiểm tra</label>
                <select id="check-voucher" className="admin-form-input" required value={voucherCheck.voucherId} onChange={e => changeVoucherCheck({ ...voucherCheck, voucherId: e.target.value })}>
                  <option value="">Chọn voucher</option>
                  {scopedVouchers.map(v => <option key={v.id} value={v.id}>{v.code} — {VOUCHER_TYPE_LABELS[v.voucherType || 'ORDER']}</option>)}
                </select></div>
              <div><label htmlFor="check-customer" className="admin-form-label">Mã khách hàng (để trống nếu khách vãng lai)</label>
                <input id="check-customer" type="text" placeholder="Ví dụ: C021 hoặc 21" className="admin-form-input" value={voucherCheck.customerId} onChange={e => changeVoucherCheck({ ...voucherCheck, customerId: e.target.value })} /></div>
            </div>
            {voucherCheck.items.map((item, index) => <div key={index} className="promotion-voucher-grid">
              <div><label htmlFor={`check-product-${index}`} className="admin-form-label">Sản phẩm {index + 1}</label>
                <select id={`check-product-${index}`} required className="admin-form-input" value={item.productId} onChange={e => changeVoucherCheck({ ...voucherCheck, items: voucherCheck.items.map((it, i) => i === index ? { ...it, productId: e.target.value } : it) })}>
                  <option value="">Chọn sản phẩm</option>
                  {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sellingPrice)}</option>)}
                </select></div>
              <div><label htmlFor={`check-quantity-${index}`} className="admin-form-label">Số lượng {index + 1}</label>
                <input id={`check-quantity-${index}`} required className="admin-form-input" type="number" min="1" max="2147483647" step="1" value={item.quantity} onChange={e => changeVoucherCheck({ ...voucherCheck, items: voucherCheck.items.map((it, i) => i === index ? { ...it, quantity: e.target.value } : it) })} /></div>
              {voucherCheck.items.length > 1 && <button type="button" className="admin-btn admin-btn-outline" onClick={() => changeVoucherCheck({ ...voucherCheck, items: voucherCheck.items.filter((_, i) => i !== index) })}>Bỏ sản phẩm {index + 1}</button>}
            </div>)}
            {productError && <p role="alert">{productError} <button type="button" className="admin-btn admin-btn-outline" onClick={fetchProducts}>Tải lại sản phẩm</button></p>}
            <div className="promotion-check-actions">
              <button type="button" className="admin-btn admin-btn-outline" disabled={voucherCheck.items.length >= 100} onClick={() => changeVoucherCheck({ ...voucherCheck, items: [...voucherCheck.items, { productId: '', quantity: 1 }] })}>Thêm sản phẩm kiểm tra</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={checking || !scopedVouchers.length}>{checking ? 'Đang kiểm tra...' : 'Kiểm tra voucher'}</button>
            </div>
            {checkError && <p role="alert">{checkError}</p>}
            {checkResult && <div role="status"><strong>Kết quả kiểm tra thử: {checkResult.code}</strong>
              {checkResult.warnings?.map(warning => <p key={warning}>{warning} — đây chỉ là mô phỏng, khách chưa thể dùng mã.</p>)}
              <p>Tiền hàng: {formatCurrency(checkResult.subtotal)} · Ưu đãi tự động: {formatCurrency(checkResult.automaticDiscountAmount || 0)} · Voucher giảm: <span>{formatCurrency(checkResult.discountAmount)}</span> · Còn lại: {formatCurrency(checkResult.finalTotal)}</p>
            </div>}
          </form>
          </details>
        </section>
      )}

      {/* MODAL 1: Tạo / Sửa Nhanh Chiến Dịch */}
      {showProgramModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotion-program-title" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--admin-radius-sm)', background: '#edf3ef', color: '#376757', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

            {canManage && <form onSubmit={handleSubmitProgram}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {programFormError && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--admin-radius-sm)', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            </form>}
          </div>
        </div>
      )}

      {/* MODAL 2: Cấu Hình Chi Tiết Chiến Dịch */}
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
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotion-detail-title" style={{ maxWidth: '1120px' }}>
            <div className="admin-modal-header" style={{ paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--admin-radius)', background: '#edf3ef', color: '#376757', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        borderRadius: 'var(--admin-radius-sm)',
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
                      {programStatusLabel(detailData.program)}
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
                <span>Bậc giảm theo đơn ({detailData.orderDiscounts.length})</span>
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
                <span>Ưu đãi sản phẩm ({detailData.productDiscounts.length})</span>
              </button>

              <button
                className="admin-tab-btn"
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '2px solid transparent',
                  fontWeight: 500,
                  color: '#84928a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => openVoucherPage(activeProgramId)}
              >
                <Gift size={16} />
                <span>Quản lý mã voucher ({detailData.vouchers.length})</span>
              </button>

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
                <span>Tổng quan</span>
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.25rem' }}>
              {activeTab === 'overview' && <div className="promotion-overview-grid">
                <div className="admin-card"><h3>1. Voucher theo hóa đơn</h3><p>{detailData.vouchers.filter(v => v.voucherType === 'ORDER').length} mã theo giá trị đơn tối thiểu.</p></div>
                <div className="admin-card"><h3>2. Giảm theo sản phẩm</h3><p>{detailData.productDiscounts.length} sản phẩm có ưu đãi tự động trên phần tiền sản phẩm; không cần nhập mã.</p></div>
                <div className="admin-card"><h3>3. Voucher theo hạng thành viên</h3><p>{detailData.vouchers.filter(v => v.voucherType === 'VIP').length} mã dành cho đúng hạng, tính theo chi tiêu đơn hoàn thành.</p></div>
                <p>Mỗi đơn chỉ áp dụng một loại ưu đãi do khách chọn. Chọn voucher sẽ thay thế ưu đãi sản phẩm và ngược lại, không cộng dồn. Hóa đơn giữ khoản giảm đã chốt của đơn.</p>
              </div>}

              {/* TAB 2: GIẢM GIÁ SẢN PHẨM */}
              {activeTab === 'products' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p>Giá giảm theo sản phẩm tự động áp dụng trong giỏ hàng và thanh toán khi chiến dịch còn hiệu lực. Chọn voucher sẽ thay thế ưu đãi sản phẩm; bỏ voucher sẽ khôi phục giá giảm sản phẩm, không cộng dồn.</p>
                  {/* Form thêm SP giảm giá */}
                  {canManage && <form
                    className="promotion-discount-form"
                    onSubmit={handleAddProductDiscount}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1.5fr auto',
                      gap: '0.75rem',
                      alignItems: 'end',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: 'var(--admin-radius)',
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
                  </form>}

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
                          <th>Giá ưu đãi</th>
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
                                  style={{ width: '36px', height: '36px', borderRadius: 'var(--admin-radius-sm)', objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{pd.productName}</div>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đơn vị: {formatProductUnit(pd.unit)}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="promotion-product-prices">
                                <del aria-label="Giá gốc">{formatCurrency(pd.sellingPrice)}</del>
                                <span>-{pd.discountPercent}%</span>
                                <strong aria-label="Giá ưu đãi">{formatCurrency(pd.discountedPrice)}</strong>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-action btn-action-danger"
                                style={{ width: '28px', height: '28px' }}
                                disabled={!canManage} onClick={() => handleDeleteProductDiscount(pd.id)}
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
                  <p>Để phát hành mã khách có thể nhập khi thanh toán, vào mục voucher theo hóa đơn.</p>
                  <button type="button" className="admin-btn admin-btn-outline" onClick={() => openVoucherPage(activeProgramId, 'ORDER')}>Quản lý mã theo hóa đơn</button>
                  {/* Form thêm bậc đơn hàng */}
                  {canManage && <form
                    className="promotion-discount-form"
                    onSubmit={handleAddOrderDiscount}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr auto',
                      gap: '0.75rem',
                      alignItems: 'end',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: 'var(--admin-radius)',
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
                  </form>}

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
                            <td style={{ color: '#1e293b' }}>
                              Đơn hàng từ <span>{formatCurrency(od.minimumAmount)}</span> trở lên
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ padding: '0.2rem 0.6rem', background: '#f5f3ff', color: '#7c3aed', borderRadius: '4px', fontSize: '0.85rem' }}>
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
                                disabled={!canManage} onClick={() => handleDeleteOrderDiscount(od.id)}
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
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--admin-radius-sm)', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--admin-radius-sm)', color: '#b91c1c', fontSize: '0.85rem' }}>
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
      <AdminConfirmModal
        isOpen={!!deletingVoucher}
        title={deletingVoucher && (deletingVoucher.usedQuantity > 0 || deletingVoucher.ordersCount > 0) ? 'Lưu trữ voucher' : 'Xóa vĩnh viễn voucher'}
        message={deletingVoucher && (deletingVoucher.usedQuantity > 0 || deletingVoucher.ordersCount > 0)
          ? `Lưu trữ ${deletingVoucher.code}? Khách không thể dùng mã nữa; lịch sử đơn hàng được giữ nguyên.`
          : `Xóa vĩnh viễn ${deletingVoucher?.code}? Mã chưa từng dùng sẽ bị xóa và không thể khôi phục. Nếu có lịch sử phát sinh, hệ thống sẽ chỉ lưu trữ.`}
        isLoading={submittingVoucher}
        onCancel={() => { if (!submittingVoucher) setDeletingVoucher(null) }}
        onConfirm={() => handleDeleteVoucher(deletingVoucher.id)}
      />
    </div>
  )
}
