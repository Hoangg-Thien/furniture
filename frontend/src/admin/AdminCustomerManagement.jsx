import { useState, useEffect } from 'react'
import {
  AlertCircle,
  Armchair,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  Filter,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  Users,
  X
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminCustomerManagement({ currentUser }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedTier, setSelectedTier] = useState('ALL')
  const [minSpent, setMinSpent] = useState('')
  const [maxSpent, setMaxSpent] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Drawer / Modal Chi tiết khách hàng
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'orders' | 'cart'

  // Edit form state in Profile Tab
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Tải danh sách khách hàng từ Backend
  const loadCustomers = async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('size', targetPageSize)

      if (searchKeyword.trim()) {
        params.append('keyword', searchKeyword.trim())
      }
      if (selectedTier !== 'ALL') {
        params.append('tier', selectedTier)
      }
      if (minSpent && Number(minSpent) > 0) {
        params.append('minSpent', minSpent)
      }
      if (maxSpent && Number(maxSpent) > 0) {
        params.append('maxSpent', maxSpent)
      }

      const res = await fetch(`${baseUrl}/api/admin/customers?${params.toString()}`, {
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}: Lỗi tải danh sách khách hàng`)
      }

      const data = await res.json()
      setCustomers(data.content || [])
      setPage(data.page || 0)
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Tự động load khi thay đổi filter
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(0, pageSize)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchKeyword, selectedTier, minSpent, maxSpent, pageSize])

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadCustomers(newPage, pageSize)
    }
  }

  // Mở Drawer / Modal chi tiết khách hàng
  const openCustomerProfile = async (customer, initialTab = 'profile') => {
    setSelectedCustomer(customer)
    setActiveTab(initialTab)
    setCustomerDetail(null)
    setDetailLoading(true)
    setEditError('')

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/customers/${customer.id}`, {
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        })
      })

      if (!res.ok) {
        throw new Error('Không thể tải chi tiết khách hàng')
      }

      const data = await res.json()
      setCustomerDetail(data)
      setEditForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || ''
      })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  // Lưu chỉnh sửa thông tin khách hàng (Tab 1)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setEditError('')

    if (!editForm.fullName || !editForm.fullName.trim()) {
      setEditError('Họ và tên không được để trống')
      return
    }

    setEditSubmitting(true)
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: getApiHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          address: editForm.address.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật thất bại')
      }

      showToast('Cập nhật thông tin khách hàng thành công!', 'success')
      // Cập nhật lại state cục bộ
      setCustomerDetail((prev) => ({
        ...prev,
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim()
      }))
      loadCustomers(page)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Xuất file CSV (Tương thích tốt với Excel UTF-8 BOM)
  const handleExportCSV = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const params = new URLSearchParams()
      if (searchKeyword.trim()) params.append('keyword', searchKeyword.trim())
      if (selectedTier !== 'ALL') params.append('tier', selectedTier)
      if (minSpent) params.append('minSpent', minSpent)
      if (maxSpent) params.append('maxSpent', maxSpent)

      const res = await fetch(`${baseUrl}/api/admin/customers/export?${params.toString()}`, {
        headers: getApiHeaders()
      })

      if (!res.ok) throw new Error('Không thể tải dữ liệu xuất Excel')
      const data = await res.json()

      if (!data || data.length === 0) {
        showToast('Không có dữ liệu khách hàng để xuất file', 'error')
        return
      }

      // Tạo chuỗi CSV
      const headers = ['Mã KH', 'Tài khoản', 'Họ và tên', 'Số điện thoại', 'Email', 'Địa chỉ', 'Hạng tiêu dùng', 'Số đơn hoàn thành', 'Tổng chi tiêu (VNĐ)', 'Trạng thái TK', 'Ngày tạo']
      const rows = data.map((c) => [
        `"C${String(c.id).padStart(3, '0')}"`,
        `"${c.username || ''}"`,
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${c.phone || ''}"`,
        `"${c.email || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${c.customerTier || ''}"`,
        c.completedOrders || 0,
        c.totalSpent || 0,
        c.isUserActive ? '"Hoạt động"' : '"Tạm khóa"',
        `"${c.createdAt || ''}"`
      ])

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Đã xuất thành công ${data.length} khách hàng ra file Excel (CSV)!`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Format tiền tệ VNĐ
  const formatMoney = (val) => {
    if (!val && val !== 0) return '0 ₫'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Render Badge phân hạng khách hàng
  const renderTierBadge = (tier) => {
    switch (tier) {
      case 'VIP_DIAMOND':
        return (
          <span className="customer-tier-badge diamond">
            <Sparkles size={12} />
            VIP Diamond
          </span>
        )
      case 'GOLD':
        return (
          <span className="customer-tier-badge gold">
            <Award size={12} />
            Thân thiết (Gold)
          </span>
        )
      case 'SILVER':
        return (
          <span className="customer-tier-badge silver">
            <Award size={12} />
            Tiềm năng (Silver)
          </span>
        )
      default:
        return (
          <span className="customer-tier-badge new">
            <User size={12} />
            Khách mới
          </span>
        )
    }
  }

  // Render Status Badge của đơn hàng
  const renderOrderStatus = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="admin-badge admin-badge-success">Đã hoàn thành</span>
      case 'CONFIRMED':
        return <span className="admin-badge admin-badge-info">Đã xác nhận</span>
      case 'PENDING':
        return <span className="admin-badge admin-badge-warning">Chờ xử lý</span>
      case 'CANCELLED':
        return <span className="admin-badge admin-badge-danger">Đã hủy</span>
      default:
        return <span className="admin-badge">{status}</span>
    }
  }

  return (
    <div className="admin-module-view">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Trang chủ &gt; Quản lý khách hàng (CRM) &gt; <span>Module 02</span>
          </div>
          <h1 className="admin-page-title">Hồ Sơ Khách Hàng & Phân Hạng Tiêu Dùng</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={() => loadCustomers(page)} title="Làm mới">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm Mới</span>
          </button>
          <button className="admin-btn admin-btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Xuất DS Khách Hàng (Excel)</span>
          </button>
        </div>
      </div>


      {/* Toolbar Tìm kiếm & Bộ Lọc Nâng Cao */}
      <div className="admin-card admin-filter-toolbar">
        <div className="filter-grid" style={{ alignItems: 'flex-end' }}>
          {/* Keyword Search */}
          <div className="filter-search-box" style={{ flex: 1.5, minWidth: '280px' }}>
            <Search size={16} color="var(--admin-text-muted)" />
            <input
              type="text"
              placeholder="Tìm theo Tên, SĐT, Email, Username, Địa chỉ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button className="clear-btn" onClick={() => setSearchKeyword('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Phân hạng */}
          <div className="filter-select-group">
            <label>Phân hạng:</label>
            <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
              <option value="ALL">Tất cả phân hạng</option>
              <option value="VIP_DIAMOND">VIP Diamond (&ge; 50 triệu)</option>
              <option value="GOLD">Thân thiết - Gold (15 - 50 triệu)</option>
              <option value="SILVER">Tiềm năng - Silver (1+ đơn)</option>
              <option value="NEW">Khách hàng Mới (0 đơn)</option>
            </select>
          </div>

          {/* Chi tiêu từ... đến... */}
          <div className="filter-select-group">
            <label>Chi tiêu từ:</label>
            <input
              type="number"
              placeholder="0 ₫"
              className="filter-money-input"
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
            />
          </div>
          <div className="filter-select-group">
            <label>Đến:</label>
            <input
              type="number"
              placeholder="Tối đa ₫"
              className="filter-money-input"
              value={maxSpent}
              onChange={(e) => setMaxSpent(e.target.value)}
            />
          </div>

          {(searchKeyword || selectedTier !== 'ALL' || minSpent || maxSpent) && (
            <button
              className="admin-btn admin-btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setSearchKeyword('')
                setSelectedTier('ALL')
                setMinSpent('')
                setMaxSpent('')
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Dữ Liệu Khách Hàng */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mã KH</th>
                <th>Họ và Tên</th>
                <th>Số Điện Thoại</th>
                <th>Email</th>
                <th>Hạng Tiêu Dùng</th>
                <th style={{ textAlign: 'center' }}>Số Đơn Đặt</th>
                <th style={{ textAlign: 'right' }}>Tổng Chi Tiêu (LTV)</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={20} className="spin" color="var(--admin-accent)" />
                      <span>Đang tải danh sách khách hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#EF4444' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={20} />
                      <span>Lỗi: {error}</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}>
                    <Users size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const initials = (c.fullName || 'K')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: 'var(--admin-accent)', whiteSpace: 'nowrap' }}>
                        C{String(c.id).padStart(3, '0')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="customer-avatar-badge">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.92rem' }}>
                              {c.fullName || 'Chưa đặt tên'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                              @{c.username || 'guest'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {c.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={13} color="var(--admin-text-muted)" />
                            {c.phone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--admin-text-main)', fontSize: '0.86rem' }}>
                        {c.email ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={13} color="var(--admin-text-muted)" />
                            {c.email}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>{renderTierBadge(c.customerTier)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        <span title={`Đã hoàn thành ${c.completedOrders} / tổng ${c.totalOrders} đơn`}>
                          {c.completedOrders} <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>/ {c.totalOrders} đơn</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.95rem' }}>
                        {formatMoney(c.totalSpent)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="table-action-btn edit"
                            onClick={() => openCustomerProfile(c, 'orders')}
                            title="Xem chi tiết hồ sơ & đơn hàng"
                          >
                            <Eye size={14} />
                            <span>Xem</span>
                          </button>
                          <button
                            className="table-action-btn"
                            onClick={() => openCustomerProfile(c, 'profile')}
                            title="Chỉnh sửa thông tin liên hệ"
                          >
                            <Edit size={14} />
                            <span>Sửa</span>
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

        {/* Phân Trang */}
        <div className="admin-pagination-footer">
          <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>
              Hiển thị <strong>{customers.length}</strong> trên tổng số <strong>{totalElements}</strong> khách hàng
              (Trang {page + 1} / {Math.max(1, totalPages)})
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>Hiển thị:</span>
              <select
                className="admin-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value)
                  setPageSize(newSize)
                  setPage(0)
                  loadCustomers(0, newSize)
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>
          </div>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0 || loading}
            >
              &lt; Trước
            </button>

            {Array.from({ length: totalPages }, (_, idx) => {
              if (
                totalPages > 6 &&
                idx !== 0 &&
                idx !== totalPages - 1 &&
                Math.abs(idx - page) > 1
              ) {
                if (idx === 1 && page > 2) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                if (idx === totalPages - 2 && page < totalPages - 3) return <span key={idx} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                return null
              }

              return (
                <button
                  key={idx}
                  className={`page-num-btn ${idx === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(idx)}
                  disabled={loading}
                >
                  {idx + 1}
                </button>
              )
            })}

            <button
              className="page-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              Sau &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          DRAWER / MODAL: HỒ SƠ CHI TIẾT KHÁCH HÀNG (CUSTOMER PROFILE DRAWER)
          ==================================================================== */}
      {selectedCustomer && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div
            className="customer-drawer-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="customer-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="customer-drawer-avatar">
                  {(selectedCustomer.fullName || 'K')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="customer-drawer-title">{selectedCustomer.fullName}</h2>
                    {renderTierBadge(customerDetail?.customerTier || selectedCustomer.customerTier)}
                  </div>
                  <div className="customer-drawer-sub">
                    <span>Mã KH: <strong>C{String(selectedCustomer.id).padStart(3, '0')}</strong></span>
                    <span>•</span>
                    <span>Tài khoản: @{customerDetail?.username || selectedCustomer.username}</span>
                    <span>•</span>
                    <span>Tổng chi tiêu: <strong style={{ color: 'var(--admin-accent)' }}>{formatMoney(customerDetail?.totalSpent || selectedCustomer.totalSpent)}</strong></span>
                  </div>
                </div>
              </div>

              <button className="modal-close-btn" onClick={() => setSelectedCustomer(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="customer-tabs-nav">
              <button
                className={`customer-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={16} />
                <span>Thông Tin Liên Lạc</span>
              </button>
              <button
                className={`customer-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <Package size={16} />
                <span>Lịch Sử Đơn Hàng ({customerDetail?.orders?.length || 0})</span>
              </button>
              <button
                className={`customer-tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
                onClick={() => setActiveTab('cart')}
              >
                <ShoppingCart size={16} />
                <span>Giỏ Hàng Quan Tâm ({customerDetail?.cartItems?.length || 0})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="customer-drawer-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-text-muted)' }}>
                  <RefreshCw size={24} className="spin" color="var(--admin-accent)" />
                  <p style={{ marginTop: '10px' }}>Đang tải dữ liệu hồ sơ khách hàng...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: THÔNG TIN LIÊN LẠC & CHỈNH SỬA */}
                  {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="drawer-form">
                      {editError && (
                        <div className="modal-alert-error">
                          <AlertCircle size={16} />
                          <span>{editError}</span>
                        </div>
                      )}

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Họ và tên khách hàng <span className="req">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.fullName}
                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Số điện thoại liên hệ</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="VD: 0901234567"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Địa chỉ Email</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="VD: khachhang@email.com"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Địa chỉ giao nhận nội thất</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="Số nhà, đường phố, phường/xã, quận/huyện, tỉnh/thành phố..."
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      </div>

                      {/* Thông tin metadata */}
                      <div className="customer-meta-box">
                        <div className="meta-item">
                          <Calendar size={15} />
                          <span>Ngày tạo tài khoản: <strong>{formatDate(customerDetail?.createdAt)}</strong></span>
                        </div>
                        <div className="meta-item">
                          <Award size={15} />
                          <span>Phân hạng hiện tại: <strong>{customerDetail?.customerTier}</strong></span>
                        </div>
                        <div className="meta-item">
                          <Package size={15} />
                          <span>Đơn hoàn thành: <strong>{customerDetail?.completedOrders} đơn</strong></span>
                        </div>
                        <div className="meta-item">
                          <Armchair size={15} />
                          <span>Món trong giỏ hàng: <strong>{customerDetail?.cartItems?.length || 0} món</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-outline"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="admin-btn admin-btn-accent"
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? (
                            <>
                              <RefreshCw size={15} className="spin" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <span>Lưu Thông Tin Khách Hàng</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: LỊCH SỬ ĐƠN HÀNG */}
                  {activeTab === 'orders' && (
                    <div className="drawer-orders-list">
                      {!customerDetail?.orders || customerDetail.orders.length === 0 ? (
                        <div className="empty-tab-box">
                          <Package size={36} color="var(--admin-text-muted)" />
                          <p>Khách hàng này chưa phát sinh đơn hàng nào.</p>
                        </div>
                      ) : (
                        customerDetail.orders.map((order) => (
                          <div key={order.id} className="order-history-card">
                            <div className="order-card-header">
                              <div>
                                <span className="order-code">Đơn hàng #{order.id}</span>
                                <span className="order-date">
                                  <Clock size={12} />
                                  {order.orderDate}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {renderOrderStatus(order.status)}
                                <strong className="order-total">{formatMoney(order.totalAmount)}</strong>
                              </div>
                            </div>

                            {order.voucherCode && (
                              <div className="order-voucher-tag">
                                <Tag size={12} />
                                <span>Áp mã voucher: <strong>{order.voucherCode}</strong> (Giảm {formatMoney(order.discountAmount)})</span>
                              </div>
                            )}

                            {/* Danh sách món hàng trong đơn */}
                            {order.items && order.items.length > 0 && (
                              <div className="order-items-sublist">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="order-item-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      {it.image_url ? (
                                        <img src={it.image_url} alt="" className="item-thumb" />
                                      ) : (
                                        <div className="item-thumb placeholder">
                                          <Armchair size={16} />
                                        </div>
                                      )}
                                      <div>
                                        <div className="item-name">{it.product_name}</div>
                                        <div className="item-qty">
                                          {formatMoney(it.unit_price)} × {it.quantity} {it.unit || 'món'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="item-amount">{formatMoney(it.amount)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: GIỎ HÀNG QUAN TÂM */}
                  {activeTab === 'cart' && (
                    <div className="drawer-cart-view">
                      <div className="cart-telesale-banner">
                        <ShoppingCart size={18} color="var(--admin-accent)" />
                        <div>
                          <strong>Gợi ý tư vấn (Telesale):</strong> Đây là các sản phẩm khách đã thêm vào giỏ nhưng chưa hoàn tất đặt hàng. Nhân viên có thể liên hệ để tư vấn kích thước, chất liệu hoặc cung cấp mã giảm giá để chốt đơn.
                        </div>
                      </div>

                      {!customerDetail?.cartItems || customerDetail.cartItems.length === 0 ? (
                        <div className="empty-tab-box">
                          <ShoppingCart size={36} color="var(--admin-text-muted)" />
                          <p>Giỏ hàng của khách hàng hiện đang trống.</p>
                        </div>
                      ) : (
                        <div className="cart-items-table-container">
                          <table className="cart-items-table">
                            <thead>
                              <tr>
                                <th>Sản phẩm nội thất</th>
                                <th>Đơn vị</th>
                                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                                <th style={{ textAlign: 'center' }}>Số lượng</th>
                                <th style={{ textAlign: 'right' }}>Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerDetail.cartItems.map((item) => (
                                <tr key={item.productId}>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      {item.imageUrl ? (
                                        <img src={item.imageUrl} alt="" className="item-thumb" />
                                      ) : (
                                        <div className="item-thumb placeholder">
                                          <Armchair size={16} />
                                        </div>
                                      )}
                                      <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>
                                        {item.productName}
                                      </strong>
                                    </div>
                                  </td>
                                  <td>{item.productUnit || 'Bộ'}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(item.unitPrice)}</td>
                                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-accent)' }}>
                                    {formatMoney(item.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, padding: '16px' }}>
                                  Tổng giá trị giỏ hàng quan tâm:
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--admin-primary)', padding: '16px' }}>
                                  {formatMoney(
                                    customerDetail.cartItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
