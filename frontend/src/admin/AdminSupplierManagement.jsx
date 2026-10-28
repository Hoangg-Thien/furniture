import { useState, useEffect, useMemo } from 'react'
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

  // Create Stock-in Receipt Modal
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState([])
  const [receiptForm, setReceiptForm] = useState({
    staffId: 1,
    status: 'COMPLETED',
    items: [{ productId: '', quantity: 1, unitPrice: '' }]
  })
  const [receiptFormError, setReceiptFormError] = useState('')
  const [submittingReceipt, setSubmittingReceipt] = useState(false)

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
  const handleOpenReceiptsModal = async (supplier) => {
    setActiveSupplier(supplier)
    setShowReceiptsModal(true)
    setExpandedReceiptId(null)
    setReceiptItemsMap({})
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
    } catch (err) {
      console.error(err)
      showToast(err.message, 'error')
    } finally {
      setLoadingReceipts(false)
    }
  }

  // Toggle expand receipt items
  const handleToggleExpandReceipt = async (receiptId) => {
    if (expandedReceiptId === receiptId) {
      setExpandedReceiptId(null)
      return
    }

    setExpandedReceiptId(receiptId)
    if (!receiptItemsMap[receiptId]) {
      setLoadingItemsMap((prev) => ({ ...prev, [receiptId]: true }))
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(
          `${baseUrl}/api/admin/suppliers/${activeSupplier.id}/receipts/${receiptId}/items`,
          { headers: getApiHeaders() }
        )
        if (res.ok) {
          const items = await res.json()
          setReceiptItemsMap((prev) => ({ ...prev, [receiptId]: items }))
        }
      } catch (err) {
        console.error('Lỗi lấy chi tiết phiếu nhập:', err)
      } finally {
        setLoadingItemsMap((prev) => ({ ...prev, [receiptId]: false }))
      }
    }
  }

  // Update Receipt Status
  const handleUpdateReceiptStatus = async (receiptId, newStatus) => {
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
    }
  }

  // Open Create Receipt Modal
  const handleOpenCreateReceipt = (supplier) => {
    setActiveSupplier(supplier)
    setReceiptForm({
      staffId: 1,
      status: 'COMPLETED',
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
      if (!item.quantity || Number(item.quantity) <= 0) {
        setReceiptFormError(`Dòng #${i + 1}: Số lượng nhập phải lớn hơn 0.`)
        return
      }
      if (item.unitPrice === '' || Number(item.unitPrice) < 0) {
        setReceiptFormError(`Dòng #${i + 1}: Đơn giá vốn nhập không hợp lệ.`)
        return
      }
    }

    setSubmittingReceipt(true)
    try {
      const baseUrl = getApiBaseUrl()
      const payload = {
        staffId: Number(receiptForm.staffId) || 1,
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
      if (showReceiptsModal && activeSupplier) {
        handleOpenReceiptsModal(activeSupplier)
      }
    } catch (err) {
      setReceiptFormError(err.message || 'Lỗi khi lập phiếu nhập kho.')
    } finally {
      setSubmittingReceipt(false)
    }
  }

  return (
    <div className="admin-supplier-management">
      {/* Toast Feedback */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <div className="admin-page-icon-wrapper" style={{ background: 'linear-gradient(135deg, #b45309, #78350f)' }}>
            <Truck size={24} className="text-white" />
          </div>
          <div>
            <div className="admin-breadcrumb">Trang chủ &gt; Quản lý nhà cung cấp nội thất (Module 06)</div>
            <h1 className="admin-page-title">Hồ Sơ Nhà Cung Cấp &amp; Lịch Sử Nhập Kho</h1>
            <p className="admin-page-subtitle">
              Quản lý danh bạ xưởng mộc, công ty đối tác vật tư, phụ kiện và theo dõi chi tiết các đợt nhập kho nội thất.
            </p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="btn-admin btn-admin-primary" onClick={handleOpenCreateSupplier}>
            <Plus size={16} />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tổng Nhà Cung Cấp</span>
            <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="stat-card-value">{kpiStats.totalSuppliers}</div>
          <div className="stat-card-footer">
            <span className="text-emerald-600 font-medium">Đối tác cung ứng</span> đang hợp tác
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tổng Đợt Nhập Hàng</span>
            <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div className="stat-card-value">{kpiStats.totalReceipts}</div>
          <div className="stat-card-footer">
            Phiếu nhập kho ghi nhận trong hệ thống
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tổng Giá Trị Nhập Kho</span>
            <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-card-value text-emerald-700" style={{ fontSize: '1.45rem' }}>
            {formatCurrency(kpiStats.totalValue)}
          </div>
          <div className="stat-card-footer">
            Chi phí vốn nhập hàng nội thất
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Đối Tác Nhập Nhiều Nhất</span>
            <div className="stat-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '1.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpiStats.topSupplier ? kpiStats.topSupplier.name : 'Chưa có'}
          </div>
          <div className="stat-card-footer">
            {kpiStats.topSupplier ? `${kpiStats.topSupplier.totalReceiptsCount} đợt nhập kho` : 'Chưa có dữ liệu'}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên nhà cung cấp / Xưởng / SĐT / Email / Địa chỉ..."
              className="admin-form-input"
              style={{ paddingLeft: '38px', width: '100%' }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchSuppliers(searchKeyword)
              }}
            />
          </div>
          <button
            className="btn-admin btn-admin-secondary"
            onClick={() => fetchSuppliers(searchKeyword)}
            disabled={loading}
          >
            <Search size={16} />
            <span>Tìm kiếm</span>
          </button>
          <button
            className="btn-admin btn-admin-secondary"
            onClick={() => {
              setSearchKeyword('')
              fetchSuppliers('')
            }}
            disabled={loading}
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
              Danh Sách Nhà Cung Cấp &amp; Đối Tác Xưởng Mộc
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiển thị {suppliers.length} đối tác cung ứng trong cơ sở dữ liệu
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
                <th>Tên Nhà Cung Cấp / Xưởng</th>
                <th>Thông Tin Liên Hệ</th>
                <th>Địa Chỉ Xưởng / Kho</th>
                <th style={{ textAlign: 'center' }}>Đợt Nhập Hàng</th>
                <th style={{ textAlign: 'right' }}>Tổng Giá Trị</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
                      <RefreshCw size={20} className="animate-spin text-amber-600" />
                      <span>Đang nạp danh sách nhà cung cấp nội thất...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={40} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy nhà cung cấp nào phù hợp</p>
                      <button className="btn-admin btn-admin-secondary btn-sm" onClick={handleOpenCreateSupplier}>
                        <Plus size={14} /> Thêm nhà cung cấp mới
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const receiptCount = Number(s.totalReceiptsCount) || 0
                  const receiptValue = Number(s.totalReceiptValue) || 0
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        #{s.id < 10 ? `0${s.id}` : s.id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
                              color: '#b45309',
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
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Đối tác sản xuất &amp; cung ứng</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                          {s.phone ? (
                            <a
                              href={`tel:${s.phone}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', textDecoration: 'none' }}
                            >
                              <Phone size={13} />
                              <span>{s.phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Chưa có SĐT</span>
                          )}
                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', textDecoration: 'none' }}
                            >
                              <Mail size={13} />
                              <span>{s.email}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Chưa có email</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.85rem', color: '#334155', maxWidth: '240px' }}>
                          <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#e11d48' }} />
                          <span>{s.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${receiptCount > 0 ? 'badge-primary' : 'badge-neutral'}`}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: receiptCount > 0 ? '#eff6ff' : '#f1f5f9',
                            color: receiptCount > 0 ? '#1d4ed8' : '#64748b',
                            border: `1px solid ${receiptCount > 0 ? '#bfdbfe' : '#e2e8f0'}`
                          }}
                        >
                          <Receipt size={13} />
                          {receiptCount} lần nhập
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: receiptValue > 0 ? '#047857' : '#94a3b8' }}>
                        {formatCurrency(receiptValue)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            className="btn-action"
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                            title="Lập phiếu nhập kho từ nhà cung cấp này"
                            onClick={() => handleOpenCreateReceipt(s)}
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            className="btn-action"
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                            title="Xem lịch sử nhập kho"
                            onClick={() => handleOpenReceiptsModal(s)}
                          >
                            <FileSpreadsheet size={15} />
                          </button>
                          <button
                            className="btn-action"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEditSupplier(s)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-action btn-action-danger"
                            title="Xóa nhà cung cấp"
                            onClick={() => {
                              setDeletingSupplier(s)
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

      {/* MODAL 1: Thêm / Sửa Nhà Cung Cấp */}
      {showSupplierModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title">
                    {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    {editingSupplier ? `Mã đối tác: #${editingSupplier.id}` : 'Nhập thông tin đối tác cung ứng nội thất'}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowSupplierModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {supplierFormError && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{supplierFormError}</span>
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Tên Nhà Cung Cấp / Xưởng Mộc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="VD: Xưởng Gỗ Sồi Hoàng Anh Gia Lai, Hafele VN..."
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Số Điện Thoại</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="VD: 0903555777"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Email Liên Hệ</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      placeholder="sales@xuonggo.com"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Địa Chỉ Xưởng / Kho Vật Tư</label>
                  <textarea
                    rows="3"
                    className="admin-form-input"
                    placeholder="VD: KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM..."
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowSupplierModal(false)}
                  disabled={submittingSupplier}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={submittingSupplier}
                >
                  {submittingSupplier ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
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
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '820px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="admin-modal-title">
                    Lịch Sử Nhập Kho — {activeSupplier.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    Theo dõi các lô hàng nội thất đã nhập, nhân viên phụ trách và tình trạng kho.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-admin btn-admin-primary btn-sm"
                  onClick={() => handleOpenCreateReceipt(activeSupplier)}
                >
                  <Plus size={14} /> Lập Phiếu Mới
                </button>
                <button className="admin-modal-close" onClick={() => setShowReceiptsModal(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {loadingReceipts ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin text-blue-600 mb-2" />
                  <p>Đang tải lịch sử phiếu nhập hàng...</p>
                </div>
              ) : receiptsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <Receipt size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', color: '#475569' }}>Chưa có phiếu nhập kho nào</h4>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>
                    Nhà cung cấp này chưa phát sinh giao dịch nhập kho nội thất nào trong hệ thống.
                  </p>
                  <button
                    className="btn-admin btn-admin-primary btn-sm"
                    onClick={() => handleOpenCreateReceipt(activeSupplier)}
                  >
                    <Plus size={14} /> Lập phiếu nhập đầu tiên
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {receiptsList.map((rc) => {
                    const isExpanded = expandedReceiptId === rc.id
                    const items = receiptItemsMap[rc.id] || []
                    const loadingItems = loadingItemsMap[rc.id]

                    let statusBadgeClass = 'bg-slate-100 text-slate-700'
                    let statusLabel = rc.status
                    if (rc.status === 'COMPLETED') {
                      statusBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      statusLabel = 'Hoàn tất (Đã nhập kho)'
                    } else if (rc.status === 'PENDING') {
                      statusBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200'
                      statusLabel = 'Chờ duyệt kho'
                    } else if (rc.status === 'CANCELLED') {
                      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200'
                      statusLabel = 'Đã hủy'
                    }

                    return (
                      <div
                        key={rc.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#fff'
                        }}
                      >
                        {/* Receipt row header */}
                        <div
                          style={{
                            padding: '0.9rem 1.15rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isExpanded ? '#f8fafc' : '#fff',
                            cursor: 'pointer',
                            userSelect: 'none',
                            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                          }}
                          onClick={() => handleToggleExpandReceipt(rc.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                              #PR-{rc.id < 10 ? `00${rc.id}` : rc.id < 100 ? `0${rc.id}` : rc.id}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              Ngày nhập: <strong>{formatDate(rc.receiptDate)}</strong>
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              • Lập bởi: <strong>{rc.staffName}</strong>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem' }}>
                                {formatCurrency(rc.totalAmount)}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {rc.totalItemsCount || 0} sản phẩm
                              </span>
                            </div>

                            <span
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                              className={statusBadgeClass}
                            >
                              {statusLabel}
                            </span>

                            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Expanded Receipt Items */}
                        {isExpanded && (
                          <div style={{ padding: '1rem 1.25rem', background: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                                Chi tiết danh mục nội thất trong phiếu nhập
                              </h4>

                              {rc.status === 'PENDING' && (
                                <button
                                  className="btn-admin btn-admin-primary btn-sm"
                                  style={{ background: '#059669', borderColor: '#059669' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateReceiptStatus(rc.id, 'COMPLETED')
                                  }}
                                >
                                  <Check size={14} /> Duyệt nhập &amp; Cộng kho
                                </button>
                              )}
                            </div>

                            {loadingItems ? (
                              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                Đang tải danh sách mặt hàng...
                              </div>
                            ) : items.length === 0 ? (
                              <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                Không có chi tiết sản phẩm nào.
                              </div>
                            ) : (
                              <table className="admin-table" style={{ background: '#fff', borderRadius: '6px', overflow: 'hidden' }}>
                                <thead>
                                  <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ fontSize: '0.8rem' }}>Tên Sản Phẩm Nội Thất</th>
                                    <th style={{ fontSize: '0.8rem', textAlign: 'center' }}>Đơn Vị</th>
                                    <th style={{ fontSize: '0.8rem', textAlign: 'center' }}>Số Lượng</th>
                                    <th style={{ fontSize: '0.8rem', textAlign: 'right' }}>Giá Vốn Nhập</th>
                                    <th style={{ fontSize: '0.8rem', textAlign: 'right' }}>Thành Tiền</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((it, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 500, color: '#1e293b' }}>
                                        {it.productName}
                                      </td>
                                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                                        {it.unit || 'cái'}
                                      </td>
                                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                                        {it.quantity}
                                      </td>
                                      <td style={{ textAlign: 'right', color: '#475569' }}>
                                        {formatCurrency(it.unitPrice)}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                                        {formatCurrency(it.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
              <button className="btn-admin btn-admin-secondary" onClick={() => setShowReceiptsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Lập Phiếu Nhập Kho Mới */}
      {showCreateReceiptModal && activeSupplier && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '780px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="admin-modal-title">
                    Lập Phiếu Nhập Kho Mới
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    Nhà cung cấp: <strong>{activeSupplier.name}</strong>
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowCreateReceiptModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {receiptFormError && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{receiptFormError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Trạng Thái Phiếu Nhập</label>
                    <select
                      className="admin-form-input"
                      value={receiptForm.status}
                      onChange={(e) => setReceiptForm({ ...receiptForm, status: e.target.value })}
                    >
                      <option value="COMPLETED">COMPLETED (Hoàn tất &amp; Tự động cộng tồn kho)</option>
                      <option value="PENDING">PENDING (Lưu tạm chờ kiểm đếm)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Nhân Viên Lập Phiếu</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      disabled
                      value={currentUser ? `${currentUser.fullName || currentUser.username} (ID: 1)` : 'Nhân viên kho (ID: 1)'}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="admin-form-label" style={{ margin: 0 }}>
                      Danh Mục Hàng Hóa Nhập <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      className="btn-admin btn-admin-secondary btn-sm"
                      onClick={handleAddReceiptItem}
                    >
                      <Plus size={14} /> Thêm sản phẩm
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {receiptForm.items.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr auto',
                            gap: '0.6rem',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '0.6rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div>
                            <select
                              className="admin-form-input"
                              style={{ width: '100%', fontSize: '0.85rem' }}
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              required
                            >
                              <option value="">-- Chọn sản phẩm nội thất --</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  #{p.id} - {p.name} ({p.unit || 'cái'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Số lượng"
                              className="admin-form-input"
                              style={{ width: '100%', fontSize: '0.85rem', textAlign: 'center' }}
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
                              className="admin-form-input"
                              style={{ width: '100%', fontSize: '0.85rem', textAlign: 'right' }}
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              required
                            />
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 600, color: '#047857', fontSize: '0.88rem' }}>
                            {formatCurrency(lineTotal)}
                          </div>

                          <div>
                            <button
                              type="button"
                              className="btn-action btn-action-danger"
                              style={{ width: '28px', height: '28px' }}
                              disabled={receiptForm.items.length <= 1}
                              onClick={() => handleRemoveReceiptItem(index)}
                              title="Xóa dòng"
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
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#166534' }}>Tổng Giá Trị Phiếu Nhập Kho:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d' }}>
                    {formatCurrency(estimatedReceiptTotal)}
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowCreateReceiptModal(false)}
                  disabled={submittingReceipt}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={submittingReceipt}
                >
                  {submittingReceipt ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
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
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 className="admin-modal-title" style={{ color: '#991b1b' }}>Xóa Nhà Cung Cấp</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setDeletingSupplier(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {deleteError ? (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {deleteError}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa đối tác <strong>{deletingSupplier.name}</strong> không?
                  <br />
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Lưu ý: Hệ thống sẽ chặn xóa nếu đối tác này đã có phiếu nhập kho để đảm bảo dữ liệu kế toán và công nợ.
                  </span>
                </p>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => setDeletingSupplier(null)}
                disabled={submittingDelete}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-danger"
                onClick={handleDeleteSupplier}
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
