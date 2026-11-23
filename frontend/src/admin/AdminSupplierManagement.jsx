import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Receipt,
  Check,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'
import { formatProductUnit } from '../lib/productUnits.js'

export default function AdminSupplierManagement({ currentUser }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [supplierFormError, setSupplierFormError] = useState('')
  const [submittingSupplier, setSubmittingSupplier] = useState(false)

  // Receipt History Modal
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  const [activeSupplier, setActiveSupplier] = useState(null)
  const [receiptsList, setReceiptsList] = useState([])
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [expandedReceiptId, setExpandedReceiptId] = useState(null)
  const [receiptItemsMap, setReceiptItemsMap] = useState({})
  const [loadingItemsMap, setLoadingItemsMap] = useState({})
  const [receiptItemErrors, setReceiptItemErrors] = useState({})
  const [countedItems, setCountedItems] = useState({})
  const [updatingReceiptId, setUpdatingReceiptId] = useState(null)
  const [inspections, setInspections] = useState({})
  const [approvalQueue, setApprovalQueue] = useState(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [reviewReason, setReviewReason] = useState('')
  const [quickSupplierId, setQuickSupplierId] = useState(null)
  const [quickPinned, setQuickPinned] = useState(false)
  const [quickReceipts, setQuickReceipts] = useState([])
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [quickAttempt, setQuickAttempt] = useState(0)
  const quickTimer = useRef(null)
  const quickPanel = useRef(null)
  const quickRow = useRef(null)
  const quickSupplier = suppliers.find(supplier => supplier.id === quickSupplierId)

  // Create Stock-in Receipt Modal
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState([])
  const [receiptForm, setReceiptForm] = useState({
    staffId: 1,
    status: 'PENDING',
    items: [{ productId: '', quantity: 1, unitPrice: '' }]
  })
  const [receiptFormError, setReceiptFormError] = useState('')
  const [submittingReceipt, setSubmittingReceipt] = useState(false)

  useEffect(() => () => clearTimeout(quickTimer.current), [])
  useEffect(() => {
    if (!quickSupplierId || showReceiptsModal || showCreateReceiptModal) return
    const controller = new AbortController()
    async function load() {
      setQuickLoading(true)
      setQuickError('')
      setQuickReceipts([])
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/suppliers/${quickSupplierId}/receipts`, { headers: getApiHeaders(), signal: controller.signal })
        if (!response.ok) throw new Error('Không tải được phiếu nhập của nhà cung cấp.')
        const rows = await response.json()
        if (!Array.isArray(rows)) throw new Error('Dữ liệu phiếu nhập không hợp lệ.')
        if (!controller.signal.aborted) setQuickReceipts(rows)
      } catch (error) {
        if (!controller.signal.aborted) setQuickError('Không tải được phiếu nhập. Bấm Thử lại để cập nhật.')
      } finally {
        if (!controller.signal.aborted) setQuickLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [quickSupplierId, showReceiptsModal, showCreateReceiptModal, quickAttempt])

  const showQuickSupplier = (id, pin = false) => {
    if (showReceiptsModal || showCreateReceiptModal || showSupplierModal || deletingSupplier || (quickPinned && !pin)) return
    if (id !== quickSupplierId) { setQuickReceipts([]); setQuickError(''); setQuickLoading(true) }
    setQuickSupplierId(id)
    if (pin) {
      setQuickPinned(true)
      if (window.matchMedia('(max-width: 1199px)').matches) requestAnimationFrame(() => quickPanel.current?.scrollIntoView({ block: 'start' }))
    }
  }
  const closeQuickSupplier = () => {
    clearTimeout(quickTimer.current)
    const row = quickRow.current
    setQuickSupplierId(null)
    setQuickPinned(false)
    requestAnimationFrame(() => row?.focus({ preventScroll: true }))
  }
  useEffect(() => {
    if (quickSupplierId && !suppliers.some(supplier => supplier.id === quickSupplierId)) {
      setQuickSupplierId(null)
      setQuickPinned(false)
    }
  }, [suppliers, quickSupplierId])

  // Delete confirmation
  const [deletingSupplier, setDeletingSupplier] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Format currency
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Load suppliers
  const fetchSuppliers = async (keyword = searchKeyword) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      let url = `${baseUrl}/api/admin/suppliers`
      if (keyword && keyword.trim()) {
        url += `?search=${encodeURIComponent(keyword.trim())}`
      }
      const res = await fetch(url, { headers: getApiHeaders() })
      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách nhà cung cấp (HTTP ${res.status})`)
      }
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể kết nối đến máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Load products for stock-in receipt
  const fetchProductsForReceipt = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/products?pageSize=100`, { headers: getApiHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAvailableProducts(data?.content || [])
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách sản phẩm:', err)
    }
  }

  useEffect(() => {
    fetchSuppliers()
    fetchProductsForReceipt()
  }, [])

  // KPI calculations
  const kpiStats = useMemo(() => {
    const totalSuppliers = suppliers.length
    const totalReceipts = suppliers.reduce((sum, s) => sum + (Number(s.totalReceiptsCount) || 0), 0)
    const totalValue = suppliers.reduce((sum, s) => sum + (Number(s.totalReceiptValue) || 0), 0)
    let topSupplier = null
    let maxReceipts = -1
    suppliers.forEach((s) => {
      const count = Number(s.totalReceiptsCount) || 0
      if (count > maxReceipts) {
        maxReceipts = count
        topSupplier = s
      }
    })
    return { totalSuppliers, totalReceipts, totalValue, topSupplier }
  }, [suppliers])

  // Open Create Supplier
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm({
      name: '',
      phone: '',
      email: '',
      address: ''
    })
    setSupplierFormError('')
    setShowSupplierModal(true)
  }

  // Open Edit Supplier
  const handleOpenEditSupplier = (supplier) => {
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    })
    setSupplierFormError('')
    setShowSupplierModal(true)
  }

  // Submit Supplier Form
  const handleSubmitSupplier = async (e) => {
    e.preventDefault()
    setSupplierFormError('')

    if (!supplierForm.name.trim()) {
      setSupplierFormError('Tên nhà cung cấp / xưởng mộc không được để trống.')
      return
    }

    if (supplierForm.phone && supplierForm.phone.trim()) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
      if (!phoneRegex.test(supplierForm.phone.trim())) {
        setSupplierFormError('Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0 hoặc +84).')
        return
      }
    }

    setSubmittingSupplier(true)
    try {
      const baseUrl = getApiBaseUrl()
      const isEdit = !!editingSupplier
      const url = isEdit
        ? `${baseUrl}/api/admin/suppliers/${editingSupplier.id}`
        : `${baseUrl}/api/admin/suppliers`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(supplierForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Thao tác thất bại (HTTP ${res.status})`)
      }

      showToast(isEdit ? 'Cập nhật nhà cung cấp thành công!' : 'Thêm nhà cung cấp mới thành công!')
      setShowSupplierModal(false)
      fetchSuppliers()
    } catch (err) {
      setSupplierFormError(err.message || 'Có lỗi xảy ra khi lưu nhà cung cấp.')
    } finally {
      setSubmittingSupplier(false)
    }
  }

  // Delete Supplier
  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return
    setSubmittingDelete(true)
    setDeleteError('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa nhà cung cấp này.')
      }

      showToast('Đã xóa nhà cung cấp thành công!')
      setDeletingSupplier(null)
      fetchSuppliers()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setSubmittingDelete(false)
    }
  }

  // Open Receipt History Modal
  const handleOpenReceiptsModal = async (supplier, receiptId = null) => {
    setActiveSupplier(supplier)
    setShowReceiptsModal(true)
    setReceiptsList([])
    setExpandedReceiptId(null)
    setReceiptItemsMap({})
    setCountedItems({})
    setInspections({})
    setReceiptItemErrors({})
    setLoadingReceipts(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/suppliers/${supplier.id}/receipts`, {
        headers: getApiHeaders()
      })
      if (!res.ok) {
        throw new Error(`Không thể lấy lịch sử nhập kho (HTTP ${res.status})`)
      }
      const data = await res.json()
      setReceiptsList(data || [])
      if (receiptId) await handleToggleExpandReceipt(receiptId, supplier.id, true)
    } catch (err) {
      console.error(err)
      showToast(err.message, 'error')
    } finally {
      setLoadingReceipts(false)
    }
  }

  // Toggle expand receipt items
  const handleToggleExpandReceipt = async (receiptId, supplierId = activeSupplier.id, force = false) => {
    if (!force && expandedReceiptId === receiptId) {
      setExpandedReceiptId(null)
      return
    }

    setExpandedReceiptId(receiptId)
    if (force || !receiptItemsMap[receiptId]) {
      setLoadingItemsMap((prev) => ({ ...prev, [receiptId]: true }))
      setReceiptItemErrors(prev => ({ ...prev, [receiptId]: '' }))
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(
          `${baseUrl}/api/admin/suppliers/${supplierId}/receipts/${receiptId}/items`,
          { headers: getApiHeaders() }
        )
        if (!res.ok) throw new Error('Không tải được chi tiết phiếu nhập. Đóng và mở lại phiếu để thử lại.')
        const items = await res.json()
        const checked = await fetch(`${baseUrl}/api/admin/suppliers/${supplierId}/receipts/${receiptId}/inspection`, { headers: getApiHeaders() })
        if (!checked.ok) throw new Error('Không tải được kết quả kiểm đếm. Mở lại phiếu để thử lại.')
        const inspection = await checked.json()
        setInspections(prev => ({ ...prev, [receiptId]: inspection }))
        setReviewReason('')
        setCountedItems(prev => ({ ...prev, ...Object.fromEntries(inspection.items.filter(item => item.quantity !== null).map(item => [`${receiptId}-${item.productId}`, String(item.quantity)])) }))
        setReceiptItemsMap((prev) => ({ ...prev, [receiptId]: items }))
      } catch (err) {
        setReceiptItemErrors(prev => ({ ...prev, [receiptId]: err instanceof TypeError ? 'Không kết nối được API kiểm đếm. Kiểm tra backend đã chạy bản mới rồi bấm Thử lại.' : err.message }))
      } finally {
        setLoadingItemsMap((prev) => ({ ...prev, [receiptId]: false }))
      }
    }
  }

  // Update Receipt Status
  const receiptCountMatches = (receiptId) => {
    const items = receiptItemsMap[receiptId] || []
    return items.length > 0 && items.every(item => {
      const value = countedItems[`${receiptId}-${item.productId}`]
      return value !== undefined && value !== '' && Number.isSafeInteger(Number(value)) && Number(value) === item.quantity
    })
  }
  const handleUpdateReceiptStatus = async (receiptId, newStatus) => {
    if (updatingReceiptId) return
    if (newStatus === 'COMPLETED' && !receiptCountMatches(receiptId)) {
      showToast('Cần kiểm đếm đủ số lượng của từng sản phẩm trước khi hoàn tất.', 'error')
      return
    }
    setUpdatingReceiptId(receiptId)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(
        `${baseUrl}/api/admin/suppliers/${activeSupplier.id}/receipts/${receiptId}/status`,
        {
          method: 'PATCH',
          headers: getApiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: newStatus })
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái thất bại')
      }

      showToast(`Đã chuyển trạng thái phiếu #${receiptId} sang ${newStatus}!`)
      // Refresh receipts and supplier list (stock updated)
      handleOpenReceiptsModal(activeSupplier)
      fetchSuppliers()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUpdatingReceiptId(null)
    }
  }

  const loadApprovalQueue = async () => {
    setApprovalLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/suppliers/receipt-approvals`, { headers: getApiHeaders() })
      if (!res.ok) throw new Error('Không tải được danh sách phiếu chờ duyệt.')
      setApprovalQueue(await res.json())
    } catch (error) { showToast(error.message, 'error') }
    finally { setApprovalLoading(false) }
  }
  const handleReceiptWorkflow = async (id, action, approve) => {
    if (updatingReceiptId) return
    if (action === 'inspection' && !receiptCountMatches(id)) return
    setUpdatingReceiptId(id)
    try {
      const body = action === 'inspection' ? { counts: Object.fromEntries((receiptItemsMap[id] || []).map(item => [item.productId, Number(countedItems[`${id}-${item.productId}`])])) } : { approve, reason: reviewReason }
      const res = await fetch(`${getApiBaseUrl()}/api/admin/suppliers/${activeSupplier.id}/receipts/${id}/${action}`, { method: 'POST', headers: getApiHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không xử lý được phiếu nhập.')
      showToast(data.message)
      await handleOpenReceiptsModal(activeSupplier, id)
      fetchSuppliers()
      if (approvalQueue !== null) await loadApprovalQueue()
    } catch (error) { showToast(error.message, 'error') }
    finally { setUpdatingReceiptId(null) }
  }

  // Open Create Receipt Modal
  const handleOpenCreateReceipt = (supplier) => {
    setActiveSupplier(supplier)
    setReceiptForm({
      staffId: 1,
      status: 'PENDING',
      items: [{ productId: availableProducts[0]?.id || '', quantity: 5, unitPrice: '' }]
    })
    setReceiptFormError('')
    setShowCreateReceiptModal(true)
  }

  // Receipt form row operations
  const handleAddReceiptItem = () => {
    setReceiptForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: availableProducts[0]?.id || '', quantity: 1, unitPrice: '' }]
    }))
  }

  const handleRemoveReceiptItem = (index) => {
    if (receiptForm.items.length <= 1) return
    setReceiptForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, value) => {
    setReceiptForm((prev) => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }

      // Auto-suggest unitPrice as 70% of product selling price if product selected
      if (field === 'productId') {
        const prod = availableProducts.find((p) => String(p.id) === String(value))
        if (prod && prod.sellingPrice) {
          const suggestedCost = Math.round(prod.sellingPrice * 0.7)
          newItems[index].unitPrice = suggestedCost
        }
      }

      return { ...prev, items: newItems }
    })
  }

  // Calculate estimated total for new receipt
  const estimatedReceiptTotal = useMemo(() => {
    return receiptForm.items.reduce((total, item) => {
      const q = Number(item.quantity) || 0
      const p = Number(item.unitPrice) || 0
      return total + q * p
    }, 0)
  }, [receiptForm.items])

  // Submit new receipt
  const handleSubmitReceipt = async (e) => {
    e.preventDefault()
    setReceiptFormError('')

    if (!receiptForm.items.length) {
      setReceiptFormError('Phiếu nhập phải có ít nhất 1 mặt hàng.')
      return
    }

    for (let i = 0; i < receiptForm.items.length; i++) {
      const item = receiptForm.items[i]
      if (!item.productId) {
        setReceiptFormError(`Dòng #${i + 1}: Vui lòng chọn sản phẩm nội thất cần nhập.`)
        return
      }
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        setReceiptFormError(`Dòng #${i + 1}: Số lượng nhập phải là số nguyên lớn hơn 0.`)
        return
      }
      if (item.unitPrice === '' || Number(item.unitPrice) < 0) {
        setReceiptFormError(`Dòng #${i + 1}: Đơn giá vốn nhập không hợp lệ.`)
        return
      }
      if (receiptForm.items.slice(0, i).some((other) => String(other.productId) === String(item.productId))) {
        setReceiptFormError(`Dòng #${i + 1}: Sản phẩm đã có trong phiếu, vui lòng gộp số lượng vào một dòng.`)
        return
      }
    }

    setSubmittingReceipt(true)
    try {
      const baseUrl = getApiBaseUrl()
      const payload = {
        staffId: currentUser?.staffId || null,
        status: receiptForm.status,
        items: receiptForm.items.map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice)
        }))
      }

      const res = await fetch(`${baseUrl}/api/admin/suppliers/${activeSupplier.id}/receipts`, {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo phiếu nhập kho.')
      }

      showToast(`Lập phiếu nhập kho thành công! Mã phiếu: #PR-${data.receiptId}`)
      setShowCreateReceiptModal(false)
      fetchSuppliers()
      if (activeSupplier && (receiptForm.status === 'PENDING' || showReceiptsModal)) {
        await handleOpenReceiptsModal(activeSupplier, receiptForm.status === 'PENDING' ? data.receiptId : null)
      }
    } catch (err) {
      setReceiptFormError(err.message || 'Lỗi khi lập phiếu nhập kho.')
    } finally {
      setSubmittingReceipt(false)
    }
  }

  return (
    <div className="admin-module-view">
      {/* Toast Feedback */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} type="button">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Kho &amp; Chuỗi Cung Ứng &gt; <span>Nhà Cung Cấp &amp; Nhập Kho</span>
          </div>
          <h1 className="admin-page-title">Hồ Sơ Nhà Cung Cấp &amp; Lịch Sử Nhập Kho</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Quản trị danh bạ xưởng mộc, đối tác vật tư - phụ kiện cao cấp và theo dõi chi tiết các đợt nhập kho nội thất.
          </p>
        </div>

        <div className="admin-header-actions">
          {currentUser?.role === 'ADMIN' && <button type="button" className="admin-btn admin-btn-primary" disabled={approvalLoading} onClick={loadApprovalQueue}>Phiếu nhập chờ duyệt</button>}
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => fetchSuppliers(searchKeyword)}
            disabled={loading}
            title="Làm mới danh sách nhà cung cấp"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-accent"
            onClick={handleOpenCreateSupplier}
          >
            <Plus size={16} />
            <span>+ Thêm Nhà Cung Cấp</span>
          </button>
        </div>
      </div>

      {approvalQueue !== null && <section className="admin-card" aria-label="Phiếu nhập chờ admin duyệt" style={{ padding: 20, marginTop: 20 }}>
        <h2>Phiếu nhập chờ duyệt ({approvalQueue.length})</h2>
        <p>Nhân viên đã kiểm đếm đủ. Mở phiếu để đối chiếu số lượng và giá vốn trước khi duyệt.</p>
        {approvalQueue.length === 0 && <p>Không có phiếu chờ duyệt.</p>}
        {approvalQueue.map(item => <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: 12, borderBottom: '1px solid var(--admin-border)' }}>
          <span>Phiếu #{item.id} · {item.supplierName} · Kiểm đếm: {item.checkedBy} · {formatDate(item.submittedAt)} · {formatCurrency(item.totalAmount)}</span>
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleOpenReceiptsModal({ id: item.supplierId, name: item.supplierName }, item.id)}>Mở phiếu #{item.id}</button>
        </div>)}
      </section>}

      {/* 4 KPI Telemetry Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card card-total">
          <div className="inv-stat-icon" style={{ background: '#EFF6FF', color: '#0284C7' }}>
            <Building2 size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng nhà cung cấp</span>
            <h3 className="inv-stat-value">{kpiStats.totalSuppliers} <span className="inv-stat-unit">đối tác</span></h3>
            <span className="inv-stat-sub" style={{ color: '#0284C7', fontWeight: 600 }}>
              Xưởng mộc &amp; cung ứng vật tư
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-pos">
          <div className="inv-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <Receipt size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng đợt nhập hàng</span>
            <h3 className="inv-stat-value" style={{ color: '#D97706' }}>
              {kpiStats.totalReceipts} <span className="inv-stat-unit">lô hàng</span>
            </h3>
            <span className="inv-stat-sub" style={{ color: '#78716C' }}>
              Phiếu nhập kho trong hệ thống
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-revenue">
          <div className="inv-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <DollarSign size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Tổng giá trị nhập kho</span>
            <h3 className="inv-stat-value text-emerald" style={{ fontSize: '1.35rem' }}>
              {formatCurrency(kpiStats.totalValue)}
            </h3>
            <span className="inv-stat-sub" style={{ color: '#059669', fontWeight: 600 }}>
              Chi phí vốn nhập hàng nội thất
            </span>
          </div>
        </div>

        <div className="inv-stat-card card-vietqr">
          <div className="inv-stat-icon" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
            <TrendingUp size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Đối tác nhập nhiều nhất</span>
            <h3 className="inv-stat-value" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kpiStats.topSupplier ? kpiStats.topSupplier.name : 'Chưa có'}
            </h3>
            <span className="inv-stat-sub" style={{ color: '#7C3AED', fontWeight: 600 }}>
              {kpiStats.topSupplier ? `${kpiStats.topSupplier.totalReceiptsCount} đợt nhập hàng` : 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar Chuẩn */}
      <div className="admin-card inv-filter-toolbar">
        <div className="inv-filter-grid">
          <div className="inv-filter-search">
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm theo tên nhà cung cấp, xưởng mộc, số điện thoại, email, địa chỉ kho..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchSuppliers(searchKeyword)
              }}
            />
            {searchKeyword && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setSearchKeyword('')
                  fetchSuppliers('')
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ height: '42px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => fetchSuppliers(searchKeyword)}
            disabled={loading}
          >
            <Search size={15} />
            <span>Tìm Kiếm</span>
          </button>

          {searchKeyword && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              style={{ height: '42px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setSearchKeyword('')
                fetchSuppliers('')
              }}
            >
              <X size={15} />
              <span>Đặt Lại</span>
            </button>
          )}

          <button
            type="button"
            className="admin-btn admin-btn-outline"
            style={{ height: '42px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => fetchSuppliers(searchKeyword)}
            disabled={loading}
            title="Làm mới danh sách"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>

        {searchKeyword && (
          <div className="inv-active-chips-row">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đang tìm kiếm:</span>
            <span className="inv-chip">
              <span>"{searchKeyword}"</span>
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('')
                  fetchSuppliers('')
                }}
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="supplier-review-layout">
      <div className="admin-card supplier-review-list" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
              Danh Sách Nhà Cung Cấp &amp; Đối Tác Xưởng Mộc
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Hiển thị {suppliers.length} đối tác cung ứng trong cơ sở dữ liệu
            </span>
          </div>
        </div>

        {error && (
          <div style={{ margin: '16px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '65px', textAlign: 'center' }}>ID</th>
                <th style={{ minWidth: '240px' }}>Tên Nhà Cung Cấp / Xưởng</th>
                <th style={{ minWidth: '180px' }}>Thông Tin Liên Hệ</th>
                <th style={{ minWidth: '220px' }}>Địa Chỉ Xưởng / Kho</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Đợt Nhập Hàng</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Tổng Giá Trị Nhập</th>
                <th style={{ width: '240px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang nạp danh sách đối tác cung ứng nội thất...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <Truck size={40} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy nhà cung cấp nào phù hợp.</p>
                    <button
                      type="button"
                      className="admin-btn admin-btn-accent"
                      style={{ marginTop: '12px' }}
                      onClick={handleOpenCreateSupplier}
                    >
                      <Plus size={14} /> Thêm nhà cung cấp mới
                    </button>
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const receiptCount = Number(s.totalReceiptsCount) || 0
                  const receiptValue = Number(s.totalReceiptValue) || 0
                  return (
                    <tr key={s.id} className={`supplier-quick-row ${quickSupplierId === s.id ? 'supplier-quick-selected' : ''}`}
                      ref={quickSupplierId === s.id ? quickRow : null} tabIndex={0} aria-label={`Xem nhà cung cấp ${s.name}`}
                      onMouseEnter={() => { clearTimeout(quickTimer.current); quickTimer.current = setTimeout(() => showQuickSupplier(s.id), 250) }}
                      onMouseLeave={() => clearTimeout(quickTimer.current)}
                      onClick={event => { if (!event.target.closest('button, a, input')) showQuickSupplier(s.id, true) }}
                      onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); showQuickSupplier(s.id, true) } }}>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.86rem' }}>
                        #{s.id < 10 ? `0${s.id}` : s.id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)',
                              color: '#B45309',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.92rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Đối tác sản xuất &amp; cung ứng</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem' }}>
                          {s.phone ? (
                            <a
                              href={`tel:${s.phone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284C7', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <Phone size={13} />
                              <span>{s.phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Chưa có SĐT</span>
                          )}
                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-muted)', textDecoration: 'none' }}
                            >
                              <Mail size={13} />
                              <span>{s.email}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Chưa có email</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.84rem', color: '#334155', maxWidth: '240px' }}>
                          <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#E11D48' }} />
                          <span>{s.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: receiptCount > 0 ? '#EFF6FF' : '#F1F5F9',
                            color: receiptCount > 0 ? '#1D4ED8' : '#64748B',
                            border: `1px solid ${receiptCount > 0 ? '#BFDBFE' : '#E2E8F0'}`
                          }}
                        >
                          <Receipt size={13} />
                          {receiptCount} đợt
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: receiptValue > 0 ? '#047857' : '#94A3B8', fontSize: '0.94rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(receiptValue)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          {/* Lập phiếu nhập kho */}
                          <button
                            type="button"
                            className="btn-action-stock"
                            title="Lập phiếu nhập kho từ nhà cung cấp này"
                            onClick={() => handleOpenCreateReceipt(s)}
                          >
                            <Plus size={13} />
                            <span>Nhập kho</span>
                          </button>

                          {/* Lịch sử nhập kho */}
                          <button
                            type="button"
                            className="btn-action-gallery"
                            title="Xem phiếu nhập và kiểm đếm phiếu chờ"
                            onClick={() => handleOpenReceiptsModal(s)}
                          >
                            <FileSpreadsheet size={13} />
                            <span>Phiếu nhập / Kiểm đếm</span>
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEditSupplier(s)}
                          >
                            <Edit2 size={13} />
                            <span>Sửa</span>
                          </button>

                          {/* Xóa */}
                          {currentUser?.role === 'ADMIN' && <button
                            type="button"
                            className="btn-action-delete"
                            title="Xóa nhà cung cấp"
                            onClick={() => {
                              setDeletingSupplier(s)
                              setDeleteError('')
                            }}
                          >
                            <Trash2 size={13} />
                          </button>}
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



      {quickSupplier && <aside ref={quickPanel} className="supplier-quick-panel" aria-label="Xem nhanh nhà cung cấp">
        <div className="supplier-quick-heading">
          <div><span className="supplier-quick-eyebrow">NHÀ CUNG CẤP #{quickSupplier.id}</span><h2>{quickSupplier.name}</h2></div>
          <button type="button" className="admin-btn admin-btn-outline" aria-label="Đóng chi tiết nhà cung cấp" onClick={closeQuickSupplier}><X size={16} /></button>
        </div>
        <p className="supplier-quick-help">{quickPinned ? 'Đang giữ chi tiết. Chọn nhà cung cấp khác để chuyển.' : 'Rê chuột để xem nhanh, bấm dòng hoặc nhấn Enter để giữ chi tiết.'}</p>
        {quickPinned && <button type="button" className="admin-btn admin-btn-outline" onClick={() => setQuickPinned(false)}>Bỏ giữ chi tiết</button>}
        <div className="supplier-quick-stats">
          <div><span>Đợt nhập hàng</span><strong>{quickSupplier.totalReceiptsCount || 0}</strong></div>
          <div><span>Tổng giá trị nhập</span><strong>{formatCurrency(quickSupplier.totalReceiptValue)}</strong></div>
        </div>
        <h3>Thông tin liên hệ</h3>
        <dl className="supplier-quick-contact">
          <div><dt><Phone size={14} />Điện thoại</dt><dd>{quickSupplier.phone ? <a href={`tel:${quickSupplier.phone}`}>{quickSupplier.phone}</a> : 'Chưa cung cấp'}</dd></div>
          <div><dt><Mail size={14} />Email</dt><dd>{quickSupplier.email ? <a href={`mailto:${quickSupplier.email}`}>{quickSupplier.email}</a> : 'Chưa cung cấp'}</dd></div>
          <div><dt><MapPin size={14} />Địa chỉ</dt><dd>{quickSupplier.address || 'Chưa cung cấp'}</dd></div>
        </dl>
        <div className="supplier-quick-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleOpenCreateReceipt(quickSupplier)}><Plus size={15} />Lập phiếu nhập</button>
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleOpenReceiptsModal(quickSupplier)}>Phiếu nhập / Kiểm đếm</button>
        </div>
        <h3>Phiếu nhập của nhà cung cấp</h3>
        {quickLoading ? <p role="status">Đang tải phiếu nhập...</p> : quickError ? <div role="alert"><p>{quickError}</p><button type="button" className="admin-btn admin-btn-outline" onClick={() => setQuickAttempt(value => value + 1)}>Thử lại</button></div> : quickReceipts.length === 0 ? <p>Chưa có phiếu nhập kho.</p> : <div className="supplier-quick-receipts">
          {quickReceipts.map(receipt => <button type="button" key={receipt.id} className="supplier-quick-receipt" onClick={() => handleOpenReceiptsModal(quickSupplier, receipt.id)}>
            <span><strong>#PR-{receipt.id}</strong><small>{formatDate(receipt.receiptDate)} · {receipt.staffName || 'Chưa rõ người lập'}</small></span>
            <span><strong>{formatCurrency(receipt.totalAmount)}</strong><small>{({ PENDING: 'Chờ kiểm đếm / duyệt', COMPLETED: 'Đã nhập kho', CANCELLED: 'Đã hủy' })[receipt.status] || receipt.status}</small></span>
          </button>)}
        </div>}
      </aside>}
      </div>

      {/* MODAL 1: Thêm / Sửa Nhà Cung Cấp */}
      {showSupplierModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowSupplierModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge warning">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingSupplier ? `Mã đối tác: #${editingSupplier.id}` : 'Nhập thông tin đối tác cung ứng nội thất'}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSupplierModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {supplierFormError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{supplierFormError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Tên Nhà Cung Cấp / Xưởng Mộc <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Xưởng Gỗ Sồi Hoàng Anh Gia Lai, Hafele VN..."
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Số Điện Thoại</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: 0903555777"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Liên Hệ</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="sales@xuonggo.com"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Địa Chỉ Xưởng / Kho Vật Tư</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="VD: KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM..."
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowSupplierModal(false)}
                  disabled={submittingSupplier}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submittingSupplier}
                >
                  {submittingSupplier ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingSupplier ? 'Lưu Thay Đổi' : 'Tạo Nhà Cung Cấp'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Lịch Sử Nhập Hàng Theo Nhà Cung Cấp */}
      {showReceiptsModal && activeSupplier && (
        <div className="admin-modal-backdrop" onClick={() => setShowReceiptsModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    Phiếu nhập &amp; Kiểm đếm — {activeSupplier.name}
                  </h3>
                  <p className="modal-subtitle">
                    Mở phiếu chờ kiểm đếm, đối chiếu hàng nhận thực tế với số lượng trên phiếu rồi hoàn tất nhập kho.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                  onClick={() => handleOpenCreateReceipt(activeSupplier)}
                >
                  <Plus size={14} /> <span>Lập Phiếu Mới</span>
                </button>
                <button className="modal-close-btn" onClick={() => setShowReceiptsModal(false)} type="button">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {loadingReceipts ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>
                  <RefreshCw size={24} className="spin" color="var(--admin-accent)" />
                  <p style={{ marginTop: '10px', fontSize: '0.88rem' }}>Đang tải lịch sử phiếu nhập hàng...</p>
                </div>
              ) : receiptsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--admin-text-muted)' }}>
                  <Receipt size={40} style={{ opacity: 0.35, margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 6px', color: 'var(--admin-text-main)' }}>Chưa có phiếu nhập kho nào</h4>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 14px' }}>
                    Nhà cung cấp này chưa phát sinh giao dịch nhập kho nội thất nào trong hệ thống.
                  </p>
                  <button
                    type="button"
                    className="admin-btn admin-btn-accent"
                    onClick={() => handleOpenCreateReceipt(activeSupplier)}
                  >
                    <Plus size={14} /> Lập phiếu nhập đầu tiên
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...receiptsList].sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING')).map((rc) => {
                    const isExpanded = expandedReceiptId === rc.id
                    const items = receiptItemsMap[rc.id] || []
                    const loadingItems = loadingItemsMap[rc.id]
                    const inspection = inspections[rc.id]
                    const awaitingApproval = Boolean(inspection?.submittedAt && !inspection?.reviewedAt)

                    let statusBadgeClass = 'admin-status-pill'
                    let statusLabel = rc.status
                    let statusDot = 'gray'
                    if (rc.status === 'COMPLETED') {
                      statusBadgeClass = 'admin-status-pill active'
                      statusLabel = 'Hoàn tất (Đã nhập kho)'
                      statusDot = 'green'
                    } else if (rc.status === 'PENDING') {
                      statusBadgeClass = 'admin-status-pill warning'
                      statusLabel = awaitingApproval ? 'Chờ admin duyệt' : inspection?.reason ? 'Cần kiểm tra lại' : 'Chờ kiểm đếm / duyệt'
                      statusDot = 'amber'
                    } else if (rc.status === 'CANCELLED') {
                      statusBadgeClass = 'admin-status-pill inactive'
                      statusLabel = 'Đã hủy'
                      statusDot = 'red'
                    }

                    return (
                      <div
                        key={rc.id}
                        style={{
                          border: '1px solid var(--admin-border)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Receipt row header */}
                        <div
                          role="button" tabIndex={0} aria-expanded={isExpanded}
                          aria-label={`Mở phiếu nhập #${rc.id}${rc.status === 'PENDING' ? ' để kiểm đếm' : ''}`}
                          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleToggleExpandReceipt(rc.id) } }}
                          style={{
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isExpanded ? '#F8FAFC' : '#fff',
                            cursor: 'pointer',
                            userSelect: 'none',
                            borderBottom: isExpanded ? '1px solid var(--admin-border)' : 'none',
                            transition: 'background 0.15s ease'
                          }}
                          onClick={() => handleToggleExpandReceipt(rc.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, color: 'var(--admin-primary)', fontSize: '0.94rem', fontFamily: 'monospace' }}>
                              #PR-{rc.id < 10 ? `00${rc.id}` : rc.id < 100 ? `0${rc.id}` : rc.id}
                            </div>
                            <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                              Ngày nhập: <strong style={{ color: 'var(--admin-text-main)' }}>{formatDate(rc.receiptDate)}</strong>
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                              • Lập bởi: <strong style={{ color: 'var(--admin-text-main)' }}>{rc.staffName}</strong>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.96rem' }}>
                                {formatCurrency(rc.totalAmount)}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                {rc.totalItemsCount || 0} sản phẩm
                              </span>
                            </div>

                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: rc.status === 'COMPLETED' ? '#ECFDF5' : rc.status === 'PENDING' ? '#FFFBEB' : '#FEF2F2',
                                color: rc.status === 'COMPLETED' ? '#059669' : rc.status === 'PENDING' ? '#D97706' : '#DC2626',
                                border: `1px solid ${rc.status === 'COMPLETED' ? '#A7F3D0' : rc.status === 'PENDING' ? '#FDE68A' : '#FECACA'}`
                              }}
                            >
                              {statusLabel}
                            </span>

                            {isExpanded ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
                          </div>
                        </div>

                        {/* Expanded Receipt Items */}
                        {isExpanded && (
                          <div style={{ padding: '16px 20px', background: '#F8FAFC' }}>
                            {rc.status === 'PENDING' && <p role="status" style={{ marginTop: 0, lineHeight: 1.6 }}>
                              Đối chiếu mã sản phẩm, số lượng trên phiếu giao của nhà cung cấp và hàng thực tế. Nhập số lượng đã đếm cho từng dòng bên dưới.
                              Khi đủ hàng đạt chất lượng, gửi kết quả cho admin duyệt. Tồn kho chỉ tăng khi admin đồng ý. Nếu thiếu, thừa hoặc hỏng, liên hệ nhà cung cấp.
                            </p>}
                            {inspection?.checkedBy && <p>Kiểm đếm: <strong>{inspection.checkedBy}</strong> · Gửi lúc {formatDate(inspection.submittedAt)}</p>}
                            {inspection?.reviewedBy && <p>Admin xử lý: <strong>{inspection.reviewedBy}</strong> · {formatDate(inspection.reviewedAt)}{inspection.reason ? ` · Yêu cầu kiểm tra lại: ${inspection.reason}` : ' · Đã duyệt'}</p>}
                            {inspection?.history?.length > 0 && <details style={{ marginBottom: 16 }}><summary>Lịch sử kiểm đếm và duyệt ({inspection.history.length})</summary>
                              <ul>{inspection.history.map((event, index) => <li key={index}>{formatDate(event.createdAt)} · {event.username} · {({ SUBMITTED: 'Gửi kiểm đếm', APPROVED: 'Duyệt nhập kho', RETURNED: 'Yêu cầu kiểm tra lại' })[event.action]}{event.reason ? `: ${event.reason}` : ''}</li>)}</ul>
                            </details>}
                            {awaitingApproval && currentUser?.role !== 'ADMIN' && <p role="status">Đã lưu kết quả kiểm đếm. Đang chờ admin duyệt; bạn không cần nhập lại.</p>}
                            {awaitingApproval && currentUser?.role === 'ADMIN' && rc.status === 'PENDING' && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                              <label>Lý do yêu cầu kiểm tra lại <input className="form-input" maxLength={1000} value={reviewReason} onChange={event => setReviewReason(event.target.value)} /></label>
                              <button type="button" className="admin-btn admin-btn-outline" disabled={updatingReceiptId !== null || !reviewReason.trim()} onClick={() => handleReceiptWorkflow(rc.id, 'review', false)}>Yêu cầu kiểm tra lại</button>
                              <button type="button" className="admin-btn admin-btn-primary" disabled={updatingReceiptId !== null} onClick={() => handleReceiptWorkflow(rc.id, 'review', true)}>Duyệt nhập kho</button>
                            </div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                Chi tiết danh mục nội thất trong phiếu nhập:
                              </h4>

                              {rc.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-outline"
                                    disabled={updatingReceiptId !== null}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateReceiptStatus(rc.id, 'CANCELLED')
                                    }}
                                  >
                                    Hủy phiếu
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-primary"
                                    disabled={awaitingApproval || updatingReceiptId !== null || loadingItems || !receiptCountMatches(rc.id)}
                                    style={{ padding: '5px 12px', fontSize: '0.82rem', background: '#059669', borderColor: '#059669' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleReceiptWorkflow(rc.id, 'inspection')
                                    }}
                                  >
                                    <Check size={14} /> <span>{updatingReceiptId === rc.id ? 'Đang lưu...' : awaitingApproval ? 'Đã gửi admin duyệt' : 'Gửi admin duyệt'}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {loadingItems ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                Đang tải danh sách mặt hàng...
                              </div>
                            ) : receiptItemErrors[rc.id] ? (
                              <div role="alert" style={{ padding: 16, background: '#fff', border: '1px solid #f3c5c5', borderRadius: 8 }}>
                                <p>{receiptItemErrors[rc.id]}</p>
                                <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleToggleExpandReceipt(rc.id, activeSupplier.id, true)}>Thử lại</button>
                              </div>
                            ) : items.length === 0 ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                Không có chi tiết sản phẩm nào.
                              </div>
                            ) : (
                              <div className="admin-table-container">
                              <table className="admin-table" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                                <thead>
                                  <tr>
                                    <th style={{ fontSize: '0.78rem' }}>Tên Sản Phẩm Nội Thất</th>
                                    <th style={{ fontSize: '0.78rem', textAlign: 'center' }}>Đơn Vị</th>
                                    <th style={{ fontSize: '0.78rem', textAlign: 'center' }}>Số Lượng</th>
                                    <th style={{ fontSize: '0.78rem', textAlign: 'right' }}>Giá Vốn Nhập</th>
                                    <th style={{ fontSize: '0.78rem', textAlign: 'right' }}>Thành Tiền</th>
                                    {rc.status === 'PENDING' && <th>Số lượng thực nhận</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((it, idx) => {
                                    const received = countedItems[`${rc.id}-${it.productId}`] ?? ''
                                    const empty = received === ''
                                    const matched = !empty && Number(received) === it.quantity
                                    const hintId = `receipt-count-${rc.id}-${it.productId}`
                                    return (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                        {it.productName}
                                        <div style={{ fontSize: '.75rem', fontWeight: 400 }}>Mã SP: #{it.productId}</div>
                                      </td>
                                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                        {formatProductUnit(it.unit)}
                                      </td>
                                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                                        {it.quantity}
                                      </td>
                                      <td style={{ textAlign: 'right', color: 'var(--admin-text-muted)' }}>
                                        {formatCurrency(it.unitPrice)}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                                        {formatCurrency(it.amount)}
                                      </td>
                                      {rc.status === 'PENDING' && <td className="receipt-count-cell">
                                        <div className="receipt-count" data-state={empty ? 'empty' : matched ? 'matched' : 'mismatch'}>
                                          <div className="receipt-count-control">
                                            <input type="number" min="0" step="1" inputMode="numeric" placeholder="—"
                                              aria-label={`Thực nhận ${it.productName}`} aria-describedby={hintId} aria-invalid={!empty && !matched} value={received}
                                              disabled={awaitingApproval || updatingReceiptId !== null}
                                              onChange={event => setCountedItems(prev => ({ ...prev, [`${rc.id}-${it.productId}`]: event.target.value }))} />
                                            <span>{formatProductUnit(it.unit)}</span>
                                          </div>
                                          <small id={hintId} className="receipt-count-hint">
                                            {matched ? <CheckCircle2 size={13} /> : !empty ? <AlertCircle size={13} /> : null}
                                            {empty ? `Chưa đếm · Cần ${it.quantity}` : matched ? 'Khớp số lượng' : `Chưa khớp · Cần ${it.quantity}`}
                                          </small>
                                        </div>
                                      </td>}
                                    </tr>
                                  )})}
                                </tbody>
                              </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setShowReceiptsModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Lập Phiếu Nhập Kho Mới */}
      {showCreateReceiptModal && activeSupplier && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateReceiptModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    Lập Phiếu Nhập Kho Mới
                  </h3>
                  <p className="modal-subtitle">
                    Nhà cung cấp: <strong>{activeSupplier.name}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateReceiptModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '68vh', overflowY: 'auto' }}>
                {receiptFormError && (
                  <div className="modal-alert-error">
                    <AlertCircle size={16} />
                    <span>{receiptFormError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Trạng Thái Phiếu Nhập</label>
                    <select
                      className="form-input"
                      value={receiptForm.status}
                      onChange={(e) => setReceiptForm({ ...receiptForm, status: e.target.value })}
                    >
                      <option value="PENDING">Chờ kiểm đếm → Gửi admin duyệt</option>
                    </select>
                    <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      Lưu phiếu, kiểm đếm số lượng thực nhận rồi gửi admin duyệt. Chỉ khi admin duyệt mới cộng tồn kho; phiếu đã hoàn tất sẽ bị khóa.
                    </p>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nhân Viên Lập Phiếu</label>
                    <input
                      type="text"
                      className="form-input"
                      disabled
                      style={{ background: '#F8FAFC', color: 'var(--admin-text-muted)' }}
                      value={currentUser ? currentUser.fullName || currentUser.username : ''}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Danh Mục Hàng Hóa Nhập <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                      onClick={handleAddReceiptItem}
                    >
                      <Plus size={14} /> <span>Thêm sản phẩm</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {receiptForm.items.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr auto',
                            gap: '10px',
                            alignItems: 'center',
                            background: '#F8FAFC',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border)'
                          }}
                        >
                          <div>
                            <select
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.86rem', padding: '8px 10px' }}
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              required
                            >
                              <option value="">-- Chọn sản phẩm nội thất --</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  #{p.id} - {p.name} ({p.unit || 'Bộ'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="SL"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.86rem', textAlign: 'center', padding: '8px 6px' }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Giá vốn (VNĐ)"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.86rem', textAlign: 'right', padding: '8px 10px' }}
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              required
                            />
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 700, color: '#047857', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {formatCurrency(lineTotal)}
                          </div>

                          <div>
                            <button
                              type="button"
                              className="btn-action-delete"
                              style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
                              disabled={receiptForm.items.length <= 1}
                              onClick={() => handleRemoveReceiptItem(index)}
                              title="Xóa dòng này"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total Summary */}
                <div
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#065F46', fontSize: '0.92rem' }}>Tổng Giá Trị Phiếu Nhập Kho:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>
                    {formatCurrency(estimatedReceiptTotal)}
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowCreateReceiptModal(false)}
                  disabled={submittingReceipt}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submittingReceipt}
                >
                  {submittingReceipt ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Đang tạo phiếu...</span>
                    </>
                  ) : (
                    <span>Xác Nhận &amp; Lưu Phiếu Nhập</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Xác nhận xóa nhà cung cấp */}
      {deletingSupplier && (
        <div className="admin-modal-backdrop" onClick={() => setDeletingSupplier(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge danger">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#DC2626' }}>Xóa Nhà Cung Cấp</h3>
                  <p className="modal-subtitle">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDeletingSupplier(null)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {deleteError ? (
                <div className="modal-alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              ) : (
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Bạn có chắc chắn muốn xóa đối tác <strong>{deletingSupplier.name}</strong> không?
                  <br />
                  <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '6px' }}>
                    * Hệ thống sẽ chặn xóa nếu đối tác này đã có phiếu nhập kho nhằm bảo toàn dữ liệu sổ sách và lịch sử kho.
                  </span>
                </p>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeletingSupplier(null)}
                disabled={submittingDelete}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteSupplier}
                disabled={submittingDelete}
              >
                {submittingDelete ? (
                  <>
                    <RefreshCw size={15} className="spin" />
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
