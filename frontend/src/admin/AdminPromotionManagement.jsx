import { useState, useEffect, useMemo } from 'react'
import {
  Percent,
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
  Sparkles,
  Info,
  AlertTriangle,
  Calendar,
  Check,
  Building2,
  DollarSign,
  TrendingUp,
  Tag,
  Gift,
  Clock,
  Eye,
  Settings,
  Flame,
  ArrowRight
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

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
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
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      let url = `${baseUrl}/api/admin/promotions`
      const params = []
      if (searchKeyword.trim()) {
        params.push(`search=${encodeURIComponent(searchKeyword.trim())}`)
      }
      if (statusFilter !== 'ALL') {
        params.push(`status=${encodeURIComponent(statusFilter)}`)
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`
      }

      const res = await fetch(url, { headers: getApiHeaders() })
      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách khuyến mãi (HTTP ${res.status})`)
      }
      const data = await res.json()
      setPrograms(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể kết nối đến máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch available products
  const fetchProducts = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/products?pageSize=100`, { headers: getApiHeaders() })
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
  }, [statusFilter])

  // Filtered programs list by time filter
  const displayedPrograms = useMemo(() => {
    const now = new Date()
    return programs.filter((p) => {
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
  }, [programs, timeFilter])

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
      showToast(err.message, 'error')
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
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <div className="admin-page-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}>
            <Percent size={24} className="text-white" />
          </div>
          <div>
            <div className="admin-breadcrumb">Trang chủ &gt; Khuyến mãi &amp; Voucher (Module 07)</div>
            <h1 className="admin-page-title">Chiến Dịch Khuyến Mãi &amp; Kho Voucher Nội Thất</h1>
            <p className="admin-page-subtitle">
              Cấu hình 3 cơ chế ưu đãi: Giảm giá trực tiếp theo sản phẩm, Chiết khấu bậc đơn hàng và Phát hành phiếu Voucher quà tặng.
            </p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="btn-admin btn-admin-primary" onClick={handleOpenCreateProgram}>
            <Plus size={16} />
            <span>Tạo Chiến Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tổng Chiến Dịch</span>
            <div className="stat-card-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Tag size={20} />
            </div>
          </div>
          <div className="stat-card-value">{kpiStats.total}</div>
          <div className="stat-card-footer">
            Chương trình tiếp thị trong hệ thống
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Đang Diễn Ra (ACTIVE)</span>
            <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Flame size={20} />
            </div>
          </div>
          <div className="stat-card-value text-emerald-600">{kpiStats.activeRunning}</div>
          <div className="stat-card-footer">
            Chiến dịch đang áp dụng trực tiếp cho khách mua
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Mã Voucher Phát Hành</span>
            <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Gift size={20} />
            </div>
          </div>
          <div className="stat-card-value text-blue-600">{kpiStats.totalVouchers}</div>
          <div className="stat-card-footer">
            Mã quà tặng sẵn sàng kích hoạt
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Sản Phẩm Giảm Giá</span>
            <div className="stat-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="stat-card-value">{kpiStats.totalProductDiscounts}</div>
          <div className="stat-card-footer">
            Món nội thất đang có giá ưu đãi
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chiến dịch, mô tả khuyến mãi..."
              className="admin-form-input"
              style={{ paddingLeft: '38px', width: '100%' }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchPrograms()
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="admin-form-input"
              style={{ minWidth: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="ACTIVE">ACTIVE (Kích hoạt)</option>
              <option value="DRAFT">DRAFT (Bản nháp)</option>
              <option value="INACTIVE">INACTIVE (Tạm dừng)</option>
            </select>

            <select
              className="admin-form-input"
              style={{ minWidth: '150px' }}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="ALL">-- Tất cả thời gian --</option>
              <option value="RUNNING">Đang diễn ra</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="EXPIRED">Đã kết thúc</option>
            </select>
          </div>

          <button className="btn-admin btn-admin-secondary" onClick={fetchPrograms} disabled={loading}>
            <Search size={16} />
            <span>Tìm</span>
          </button>
          <button
            className="btn-admin btn-admin-secondary"
            onClick={() => {
              setSearchKeyword('')
              setStatusFilter('ALL')
              setTimeFilter('ALL')
              fetchPrograms()
            }}
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Programs Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
              Danh Sách Chiến Dịch Khuyến Mãi
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiển thị {displayedPrograms.length} trên tổng số {programs.length} chiến dịch
            </span>
          </div>
        </div>

        {error && (
          <div style={{ margin: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>ID</th>
                <th>Tên Chương Trình Khuyến Mãi</th>
                <th>Thời Gian Diễn Ra</th>
                <th style={{ textAlign: 'center' }}>Cơ Chế Chiết Khấu</th>
                <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ width: '190px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
                      <RefreshCw size={20} className="animate-spin text-orange-600" />
                      <span>Đang nạp danh sách chiến dịch khuyến mãi...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedPrograms.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={40} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy chương trình khuyến mãi nào phù hợp</p>
                      <button className="btn-admin btn-admin-secondary btn-sm" onClick={handleOpenCreateProgram}>
                        <Plus size={14} /> Tạo chiến dịch mới
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedPrograms.map((p) => {
                  const now = new Date()
                  const isRunning = p.status === 'ACTIVE' && now >= new Date(p.startDate) && now <= new Date(p.endDate)
                  const isExpired = now > new Date(p.endDate)
                  const isUpcoming = now < new Date(p.startDate)

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        #{p.id < 10 ? `0${p.id}` : p.id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: isRunning ? 'linear-gradient(135deg, #ffedd5, #fed7aa)' : '#f1f5f9',
                              color: isRunning ? '#ea580c' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            <Tag size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.description || 'Chưa có mô tả chi tiết'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDateTime(p.startDate)} ➔ {formatDateTime(p.endDate)}</span>
                          </div>
                          <div>
                            {isRunning && (
                              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                                ● Đang diễn ra
                              </span>
                            )}
                            {isUpcoming && (
                              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                                ○ Sắp diễn ra
                              </span>
                            )}
                            {isExpired && (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                ✕ Đã hết hạn
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {p.productDiscountsCount > 0 && (
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                              title="Giảm giá sản phẩm"
                            >
                              {p.productDiscountsCount} SP giảm
                            </span>
                          )}
                          {p.orderDiscountsCount > 0 && (
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe'
                              }}
                              title="Chiết khấu bậc đơn hàng"
                            >
                              {p.orderDiscountsCount} Bậc đơn
                            </span>
                          )}
                          {p.vouchersCount > 0 && (
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0'
                              }}
                              title="Kho Voucher"
                            >
                              {p.vouchersCount} Voucher
                            </span>
                          )}
                          {p.productDiscountsCount === 0 && p.orderDiscountsCount === 0 && p.vouchersCount === 0 && (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Chưa cấu hình</span>
                          )}
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
                          onClick={() => handleToggleStatus(p)}
                          title="Nhấp để Bật / Tắt trạng thái"
                        >
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}
                            className={
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }
                          >
                            {p.status}
                          </span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            className="btn-action"
                            style={{ background: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa' }}
                            title="Cấu hình chi tiết (Sản phẩm, Bậc đơn, Voucher)"
                            onClick={() => handleOpenDetailModal(p.id, 'overview')}
                          >
                            <Settings size={15} />
                          </button>
                          <button
                            className="btn-action"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                            title="Chỉnh sửa thông tin chung"
                            onClick={() => handleOpenEditProgram(p)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-action btn-action-danger"
                            title="Xóa chiến dịch"
                            onClick={() => {
                              setDeletingProgram(p)
                              setDeleteError('')
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tạo / Sửa Nhanh Chiến Dịch */}
      {showProgramModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title">
                    {editingProgram ? 'Chỉnh Sửa Chiến Dịch Khuyến Mãi' : 'Tạo Chiến Dịch Khuyến Mãi Mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    {editingProgram ? `Mã chiến dịch: #${editingProgram.id}` : 'Nhập thông tin chiến dịch tiếp thị & ưu đãi'}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowProgramModal(false)}>
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
                  <label className="admin-form-label">
                    Tên Chiến Dịch Khuyến Mãi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="VD: Tri Ân Mùa Cưới 2026, Black Friday..."
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Ngày Bắt Đầu <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="admin-form-input"
                      value={programForm.startDate}
                      onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Ngày Kết Thúc <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="admin-form-input"
                      value={programForm.endDate}
                      onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Trạng Thái Vòng Đời</label>
                  <select
                    className="admin-form-input"
                    value={programForm.status}
                    onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE (Kích hoạt cho khách mua)</option>
                    <option value="DRAFT">DRAFT (Bản nháp chờ phê duyệt)</option>
                    <option value="INACTIVE">INACTIVE (Tạm dừng chiến dịch)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô Tả Chiến Dịch / Điều Kiện Áp Dụng</label>
                  <textarea
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
                  Hủy Bỏ
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
                    <span>{editingProgram ? 'Lưu Thay Đổi' : 'Tạo Chiến Dịch'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cấu Hình Chi Tiết Chiến Dịch (4 Tabs Chuyên Sâu) */}
      {showDetailModal && detailData && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '880px' }}>
            <div className="admin-modal-header" style={{ paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>
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
              <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem' }}>
              <button
                className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'overview' ? '2px solid #ea580c' : '2px solid transparent',
                  fontWeight: activeTab === 'overview' ? 600 : 500,
                  color: activeTab === 'overview' ? '#ea580c' : '#64748b',
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
                  borderBottom: activeTab === 'products' ? '2px solid #ea580c' : '2px solid transparent',
                  fontWeight: activeTab === 'products' ? 600 : 500,
                  color: activeTab === 'products' ? '#ea580c' : '#64748b',
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
                  borderBottom: activeTab === 'orders' ? '2px solid #ea580c' : '2px solid transparent',
                  fontWeight: activeTab === 'orders' ? 600 : 500,
                  color: activeTab === 'orders' ? '#ea580c' : '#64748b',
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
                  borderBottom: activeTab === 'vouchers' ? '2px solid #ea580c' : '2px solid transparent',
                  fontWeight: activeTab === 'vouchers' ? 600 : 500,
                  color: activeTab === 'vouchers' ? '#ea580c' : '#64748b',
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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
                      <label className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        Chọn Sản Phẩm Nội Thất
                      </label>
                      <select
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
                      <label className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        % Giảm Giá (1% - 100%)
                      </label>
                      <input
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
                      <label className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        Mức Đơn Hàng Tối Thiểu (VNĐ)
                      </label>
                      <input
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
                      <label className="admin-form-label" style={{ fontSize: '0.82rem' }}>
                        % Chiết Khấu Đơn Hàng (1% - 100%)
                      </label>
                      <input
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                      <div>
                        <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>Mã Voucher</label>
                        <input
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
                        <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>% Giảm</label>
                        <input
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
                        <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>Đơn tối thiểu (VNĐ)</label>
                        <input
                          type="number"
                          min="0"
                          step="500000"
                          className="admin-form-input"
                          value={voucherForm.minimumAmount}
                          onChange={(e) => setVoucherForm({ ...voucherForm, minimumAmount: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>Giảm tối đa (VNĐ)</label>
                        <input
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
                        <label className="admin-form-label" style={{ margin: 0, fontSize: '0.78rem' }}>
                          Số lượng phát hành:
                        </label>
                        <input
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
                                <span style={{ padding: '0.2rem 0.5rem', background: '#ffedd5', color: '#ea580c', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
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
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 className="admin-modal-title" style={{ color: '#991b1b' }}>Xóa Chiến Dịch Khuyến Mãi</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setDeletingProgram(null)}>
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
