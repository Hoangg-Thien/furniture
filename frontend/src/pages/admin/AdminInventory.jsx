import React, { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Eye,
  Building2,
  FileCheck,
  AlertCircle,
  X,
  FileText,
  Printer,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowRight,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import {
  MOCK_GOODS_RECEIPTS,
  MOCK_SUPPLIERS,
  MOCK_PRODUCTS,
} from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminInventory({ showToast, activeRole = 'ADMIN' }) {
  const [activeTab, setActiveTab] = useState('GRN') // 'GRN' (Phiếu nhập) | 'STOCK' (Tồn kho biến thể)
  const [receipts, setReceipts] = useState(MOCK_GOODS_RECEIPTS)
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'CONFIRMED' | 'DRAFT' | 'CANCELLED'

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [confirmDialogReceipt, setConfirmDialogReceipt] = useState(null) // Holds receipt to confirm

  // GRN Form State
  const [grnSupplierId, setGrnSupplierId] = useState(suppliers[0]?.id || 1)
  const [grnStaffName, setGrnStaffName] = useState('Nguyễn Văn Vũ (Thủ kho chính)')
  const [grnWarehouse, setGrnWarehouse] = useState('Tổng kho nội thất Thủ Đức - Khu A')
  const [grnNotes, setGrnNotes] = useState('Hàng gỗ nguyên đai nguyên kiện, bề mặt sơn PU bóng mờ không trầy xước.')
  const [grnVAT, setGrnVAT] = useState(8) // 8% VAT standard

  // GRN Line Items (Multiple Variant Rows)
  const [grnItems, setGrnItems] = useState([
    {
      id: 1,
      sku: 'SOFA-01-GRY-L',
      productName: 'Sofa góc chữ L vải bọc Milan',
      variant: 'Xám tro / 280 x 180 cm',
      unit: 'Chiếc',
      quantity: 5,
      unitCost: 8500000,
      total: 42500000,
    },
    {
      id: 2,
      sku: 'CHAIR-02-OAK-GRN',
      productName: 'Ghế đơn thư giãn Gỗ Sồi Nẹp',
      variant: 'Gỗ sồi Nga + Vải rêu / 75 x 82 cm',
      unit: 'Chiếc',
      quantity: 10,
      unitCost: 2400000,
      total: 24000000,
    },
  ])

  // Autocomplete search state for adding item
  const [searchVariantTerm, setSearchVariantTerm] = useState('')
  const [showVariantDropdown, setShowVariantDropdown] = useState(false)

  // Flatten all variants from products for easy searching
  const allAvailableVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      ...v,
      productId: p.id,
      productName: p.name,
      category: p.category,
      costPrice: p.costPrice || v.price * 0.6,
    }))
  )

  const searchedVariants = allAvailableVariants.filter(
    (v) =>
      searchVariantTerm &&
      (v.productName.toLowerCase().includes(searchVariantTerm.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchVariantTerm.toLowerCase()) ||
        v.color.toLowerCase().includes(searchVariantTerm.toLowerCase()))
  )

  // Calculate Real-time Totals for GRN Form
  const subtotalCost = grnItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const vatAmount = Math.round((subtotalCost * grnVAT) / 100)
  const grandTotalCost = subtotalCost + vatAmount
  const totalItemCount = grnItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  // Filter receipts
  const filteredReceipts = receipts.filter((r) => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchSearch =
      r.receiptCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStatus && matchSearch
  })

  // Filter inventory variants (Stock tab)
  const filteredStockVariants = allAvailableVariants.filter(
    (v) =>
      v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add Item to GRN
  function handleSelectVariant(variant) {
    // Check if already in list
    const existingIndex = grnItems.findIndex((it) => it.sku === variant.sku)
    if (existingIndex >= 0) {
      setGrnItems(
        grnItems.map((it, idx) =>
          idx === existingIndex
            ? {
                ...it,
                quantity: it.quantity + 1,
                total: (it.quantity + 1) * it.unitCost,
              }
            : it
        )
      )
    } else {
      const defaultCost = Number(variant.costPrice) || 5000000
      setGrnItems([
        ...grnItems,
        {
          id: Date.now(),
          sku: variant.sku,
          productName: variant.productName,
          variant: `${variant.color} / ${variant.dimension}`,
          unit: 'Chiếc',
          quantity: 2,
          unitCost: defaultCost,
          total: defaultCost * 2,
        },
      ])
    }
    setSearchVariantTerm('')
    setShowVariantDropdown(false)
  }

  // Update item quantity or unit cost in GRN
  function handleUpdateItem(idx, field, value) {
    setGrnItems(
      grnItems.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: Number(value) }
          updated.total = (updated.quantity || 0) * (updated.unitCost || 0)
          return updated
        }
        return item
      })
    )
  }

  function handleRemoveItem(idx) {
    setGrnItems(grnItems.filter((_, i) => i !== idx))
  }

  // Open Create GRN Modal
  function handleOpenCreateGRN(preselectedSku = null) {
    if (preselectedSku) {
      const found = allAvailableVariants.find((v) => v.sku === preselectedSku)
      if (found) {
        setGrnItems([
          {
            id: Date.now(),
            sku: found.sku,
            productName: found.productName,
            variant: `${found.color} / ${found.dimension}`,
            unit: 'Chiếc',
            quantity: 5,
            unitCost: found.costPrice || 5000000,
            total: (found.costPrice || 5000000) * 5,
          },
        ])
      }
    }
    setCreateModalOpen(true)
  }

  // Create Draft Receipt or Request Confirmation
  function handleSaveGRN(asStatus = 'DRAFT') {
    if (grnItems.length === 0) {
      alert('Vui lòng thêm ít nhất một dòng biến thể nhập kho!')
      return
    }

    const supplier = suppliers.find((s) => s.id === Number(grnSupplierId))
    const newReceipt = {
      id: Date.now(),
      receiptCode: `PNK-202610-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: supplier?.name || 'Nhà cung cấp gỗ An Cường',
      supplierId: Number(grnSupplierId),
      staffName: grnStaffName,
      receivedDate: new Date().toISOString(),
      warehouse: grnWarehouse,
      subtotalCost,
      vatPercent: grnVAT,
      totalCost: grandTotalCost,
      status: asStatus,
      notes: grnNotes,
      items: grnItems,
    }

    if (asStatus === 'CONFIRMED') {
      // Trigger Safety Dialog Confirmation
      setConfirmDialogReceipt(newReceipt)
    } else {
      setReceipts([newReceipt, ...receipts])
      setCreateModalOpen(false)
      showToast(`Đã lưu bản nháp phiếu nhập kho #${newReceipt.receiptCode}!`)
    }
  }

  // Execute Official Warehouse Entry
  function handleExecuteWarehouseEntry() {
    if (!confirmDialogReceipt) return

    // Update product stocks
    const updatedProducts = products.map((prod) => {
      let stockIncrease = 0
      const updatedVariants = (prod.variants || []).map((v) => {
        const matchingGRN = confirmDialogReceipt.items.find((it) => it.sku === v.sku)
        if (matchingGRN) {
          stockIncrease += Number(matchingGRN.quantity)
          return { ...v, stock: v.stock + Number(matchingGRN.quantity) }
        }
        return v
      })

      return {
        ...prod,
        totalStock: prod.totalStock + stockIncrease,
        variants: updatedVariants,
      }
    })

    setProducts(updatedProducts)
    setReceipts([confirmDialogReceipt, ...receipts])
    setConfirmDialogReceipt(null)
    setCreateModalOpen(false)
    showToast(`Đã nhập kho chính thức ${totalItemCount} kiện hàng! Tồn kho hệ thống và công nợ NCC đã được cập nhật.`)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Tồn Kho & Nhập Hàng (GRN)</h1>
          <p className="admin-page-subtitle">
            Kiểm soát chính xác số lượng tồn theo từng biến thể, lập phiếu nhập kho (Goods Receipt Note) và theo dõi công nợ nhà cung cấp.
          </p>
        </div>

        <div className="admin-hero-actions">
          {(activeRole === 'ADMIN' || activeRole === 'WAREHOUSE') && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => handleOpenCreateGRN()}
            >
              <Plus size={16} /> Lập Phiếu Nhập Kho (GRN)
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Tổng Giá Trị Kho Theo Vốn</span>
            <div className="admin-metric-icon-box amber">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {formatCurrency(854200000)}
          </div>
          <div className="admin-metric-footer">
            <span style={{ color: 'var(--admin-text-muted)' }}>14 mã sản phẩm, 32 biến thể</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Số Phiếu Nhập Kho (GRN)</span>
            <div className="admin-metric-icon-box blue">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {receipts.length} phiếu
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge up">+2 phiếu tuần này</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Biến Thể Sắp Hết Hàng</span>
            <div className="admin-metric-icon-box rose">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums" style={{ color: 'var(--admin-danger)' }}>
            05 biến thể
          </div>
          <div className="admin-metric-footer">
            <span className="trend-badge down">Dưới định mức 5 cái</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Công Nợ NCC Cần Thanh Toán</span>
            <div className="admin-metric-icon-box olive">
              <Building2 size={18} />
            </div>
          </div>
          <div className="admin-metric-value tabular-nums">
            {formatCurrency(191160000)}
          </div>
          <div className="admin-metric-footer">
            <span style={{ color: 'var(--admin-text-muted)' }}>Hạn thanh toán 30 ngày</span>
          </div>
        </div>
      </div>

      {/* Main Tab Toggle: Phiếu Nhập Kho vs Báo Cáo Tồn Kho */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'GRN' ? 'active' : ''}`}
          onClick={() => setActiveTab('GRN')}
        >
          <FileText size={15} />
          <span>Danh Sách Phiếu Nhập Kho (GRN)</span>
          <span className="admin-status-tab-badge">{receipts.length}</span>
        </button>

        <button
          type="button"
          className={`admin-status-tab-btn ${activeTab === 'STOCK' ? 'active' : ''}`}
          onClick={() => setActiveTab('STOCK')}
        >
          <Package size={15} />
          <span>Tra Cứu Tồn Kho Biến Thể SKU</span>
          <span className="admin-status-tab-badge">{allAvailableVariants.length}</span>
        </button>
      </div>

      {/* Panel Container */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder={
                  activeTab === 'GRN'
                    ? 'Tìm theo mã phiếu #PNK..., tên nhà cung cấp...'
                    : 'Tìm SKU, tên sản phẩm, kích thước...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {activeTab === 'GRN' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái phiếu</option>
                  <option value="CONFIRMED">Đã xác nhận nhập kho</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: GRN RECEIPTS LIST TABLE */}
        {activeTab === 'GRN' && (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Mã Phiếu & Ngày Nhận</th>
                  <th>Nhà Cung Cấp Đối Tác</th>
                  <th>Kho Đích & Thủ Kho</th>
                  <th className="text-center">Số Mặt Hàng</th>
                  <th className="text-right">Tổng Tiền Thanh Toán</th>
                  <th className="text-center">Trạng Thái</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((r) => {
                  const rDate = new Date(r.receivedDate || '2026-10-22')
                  const formattedDate = `${rDate.getDate().toString().padStart(2, '0')}/${(rDate.getMonth() + 1).toString().padStart(2, '0')}/${rDate.getFullYear()}`

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                          {r.receiptCode}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)', marginTop: '2px' }}>
                          {formattedDate} {rDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{r.supplierName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                          Hợp đồng nguyên tắc vật tư
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-main)' }}>
                          {r.warehouse || 'Tổng kho Thủ Đức'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>
                          Thủ kho: {r.staffName}
                        </div>
                      </td>

                      <td className="text-center tabular-nums">
                        <span className="admin-status-badge info" style={{ fontSize: '11.5px' }}>
                          {r.items?.length || 1} dòng
                        </span>
                      </td>

                      <td className="text-right tabular-nums">
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text-main)' }}>
                          {formatCurrency(r.totalCost)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--admin-text-dim)' }}>
                          Đã gồm VAT 8%
                        </div>
                      </td>

                      <td className="text-center">
                        <span
                          className={`admin-status-badge ${
                            r.status === 'CONFIRMED'
                              ? 'success'
                              : r.status === 'DRAFT'
                              ? 'warning'
                              : 'danger'
                          }`}
                        >
                          <span className="dot" />
                          {r.status === 'CONFIRMED'
                            ? 'Đã nhập kho'
                            : r.status === 'DRAFT'
                            ? 'Bản nháp'
                            : 'Đã hủy'}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => setSelectedReceipt(r)}
                        >
                          <Eye size={13} /> Xem Phiếu
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: INVENTORY STOCK BY SKU VARIANT TABLE */}
        {activeTab === 'STOCK' && (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Mã SKU Biến Thể</th>
                  <th>Tên Sản Phẩm & Nhóm</th>
                  <th>Màu Sắc & Kích Thước</th>
                  <th className="text-right">Giá Vốn Nhập</th>
                  <th className="text-center">Tồn Thực Tế</th>
                  <th className="text-center">Khả Dụng Bán</th>
                  <th className="text-center">Trạng Thái Tồn</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockVariants.map((v) => {
                  const stock = v.stock || 0
                  const reserved = Math.min(stock, Math.floor(stock * 0.2)) // simulated reserved for orders
                  const available = stock - reserved

                  return (
                    <tr key={v.id}>
                      <td>
                        <code style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '12.5px' }}>
                          {v.sku}
                        </code>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{v.productName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                          {v.category}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '12.5px' }}>
                          {v.color} · {v.dimension}
                        </span>
                      </td>

                      <td className="text-right tabular-nums">
                        {formatCurrency(v.costPrice)}
                      </td>

                      <td className="text-center tabular-nums" style={{ fontWeight: 700 }}>
                        {stock} chiếc
                        <div className="admin-stock-bar" style={{ margin: '4px auto 0' }}>
                          <div
                            className={`admin-stock-fill ${
                              stock === 0 ? 'low' : stock < 6 ? 'medium' : 'high'
                            }`}
                            style={{ width: `${Math.min(100, (stock / 20) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="text-center tabular-nums">
                        <span style={{ color: '#10B981', fontWeight: 600 }}>{available} chiếc</span>
                        {reserved > 0 && (
                          <div style={{ fontSize: '10.5px', color: 'var(--admin-text-dim)' }}>
                            (Giữ {reserved} đơn)
                          </div>
                        )}
                      </td>

                      <td className="text-center">
                        <span
                          className={`admin-status-badge ${
                            stock === 0 ? 'danger' : stock < 6 ? 'warning' : 'success'
                          }`}
                        >
                          <span className="dot" />
                          {stock === 0 ? 'Hết hàng' : stock < 6 ? 'Sắp hết' : 'Đủ hàng'}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          onClick={() => handleOpenCreateGRN(v.sku)}
                          title="Lập phiếu nhập thêm cho biến thể này"
                        >
                          + Nhập Hàng
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================================================
          MODAL: CREATE GOODS RECEIPT NOTE (REAL-TIME AUTOCOMPLETE DATA GRID)
         ========================================================================== */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '980px', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-modal-header" style={{ padding: '16px 24px' }}>
              <div>
                <h3 className="admin-modal-title">Lập Phiếu Nhập Kho Nội Thất (GRN)</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Ghi nhận hàng hóa nhập xưởng, tự động tính giá vốn và cộng dồn tồn kho
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '24px' }}>
              {/* Supplier & Logistics Header Box */}
              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div className="admin-form-group">
                  <label>Nhà Cung Cấp Đối Tác *</label>
                  <select
                    value={grnSupplierId}
                    onChange={(e) => setGrnSupplierId(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Kho Nhận Hàng *</label>
                  <select
                    value={grnWarehouse}
                    onChange={(e) => setGrnWarehouse(e.target.value)}
                  >
                    <option value="Tổng kho nội thất Thủ Đức - Khu A">Tổng kho nội thất Thủ Đức - Khu A</option>
                    <option value="Kho trung chuyển Bình Chánh">Kho trung chuyển Bình Chánh</option>
                    <option value="Kho phụ kiện ray trượt Tân Bình">Kho phụ kiện ray trượt Tân Bình</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Thủ Kho Lập Phiếu *</label>
                  <input
                    type="text"
                    value={grnStaffName}
                    onChange={(e) => setGrnStaffName(e.target.value)}
                  />
                </div>
              </div>

              {/* Autocomplete Variant Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '6px', display: 'block' }}>
                  Tìm Kiếm Biến Thể Nội Thất Cần Nhập (Autocomplete):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={16}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-dim)' }}
                    />
                    <input
                      type="text"
                      className="admin-filter-input"
                      style={{ width: '100%', paddingLeft: '36px' }}
                      placeholder="Gõ mã SKU (SF-MIL...), tên sản phẩm (Sofa...), hoặc màu sắc..."
                      value={searchVariantTerm}
                      onChange={(e) => {
                        setSearchVariantTerm(e.target.value)
                        setShowVariantDropdown(true)
                      }}
                      onFocus={() => setShowVariantDropdown(true)}
                    />
                  </div>
                </div>

                {/* Autocomplete Results Popup */}
                {showVariantDropdown && searchVariantTerm && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--admin-surface)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--admin-modal-shadow)',
                      zIndex: 100,
                      maxHeight: '240px',
                      overflowY: 'auto',
                    }}
                  >
                    {searchedVariants.length === 0 ? (
                      <div style={{ padding: '14px', fontSize: '13px', color: 'var(--admin-text-muted)', textAlign: 'center' }}>
                        Không tìm thấy biến thể nào khớp với "{searchVariantTerm}".
                      </div>
                    ) : (
                      searchedVariants.map((v) => (
                        <div
                          key={v.sku}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--admin-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                          onMouseDown={() => handleSelectVariant(v)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                              {v.productName} ({v.color} - {v.dimension})
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-primary)' }}>
                              Mã SKU: {v.sku} · Tồn hiện tại: {v.stock} chiếc
                            </div>
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            + Chọn Dòng Này
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Data Grid: GRN Line Items */}
              <div className="admin-table-container" style={{ border: '1px solid var(--admin-border)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="admin-data-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>STT</th>
                      <th>Mã SKU</th>
                      <th>Sản Phẩm & Biến Thể</th>
                      <th className="text-center" style={{ width: '80px' }}>ĐVT</th>
                      <th className="text-center" style={{ width: '100px' }}>Số Lượng</th>
                      <th className="text-right" style={{ width: '150px' }}>Đơn Giá Vốn (₫)</th>
                      <th className="text-right" style={{ width: '160px' }}>Thành Tiền (₫)</th>
                      <th className="text-center" style={{ width: '50px' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grnItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--admin-text-dim)' }}>{idx + 1}</td>
                        <td>
                          <code style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                            {item.sku}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.productName}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                            {item.variant}
                          </div>
                        </td>
                        <td className="text-center">{item.unit}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            min="1"
                            className="tabular-nums"
                            style={{
                              width: '70px',
                              padding: '5px',
                              textAlign: 'center',
                              background: 'var(--admin-bg)',
                              border: '1px solid var(--admin-border)',
                              borderRadius: '6px',
                              fontWeight: 700,
                            }}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="50000"
                            className="tabular-nums"
                            style={{
                              width: '130px',
                              padding: '5px',
                              textAlign: 'right',
                              background: 'var(--admin-bg)',
                              border: '1px solid var(--admin-border)',
                              borderRadius: '6px',
                            }}
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(idx, 'unitCost', e.target.value)}
                          />
                        </td>
                        <td className="text-right tabular-nums" style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                          {formatCurrency(item.total)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer' }}
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '20px',
                  marginTop: '18px',
                }}
              >
                <div>
                  <div className="admin-form-group">
                    <label>Ghi Chú Kiểm Định Hàng Khi Giao Nhận</label>
                    <textarea
                      rows="3"
                      value={grnNotes}
                      onChange={(e) => setGrnNotes(e.target.value)}
                      placeholder="Ghi chú về quy cách bao bì, thùng carton, biên bản bàn giao có dấu mộc của xưởng..."
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                    <span>Tổng số lượng kiện gỗ:</span>
                    <strong className="tabular-nums">{totalItemCount} kiện</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                    <span>Tiền hàng trước thuế:</span>
                    <span className="tabular-nums">{formatCurrency(subtotalCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--admin-text-muted)' }}>
                    <span>Thuế GTGT (VAT):</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <select
                        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '4px', padding: '2px 6px', fontSize: '11.5px' }}
                        value={grnVAT}
                        onChange={(e) => setGrnVAT(Number(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="8">8% (Chuẩn)</option>
                        <option value="10">10%</option>
                      </select>
                      <span className="tabular-nums">+ {formatCurrency(vatAmount)}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--admin-border)',
                      paddingTop: '8px',
                      marginTop: '4px',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  >
                    <span>TỔNG TIỀN PHẢI TRẢ NCC:</span>
                    <span className="tabular-nums" style={{ color: 'var(--admin-primary)', fontSize: '16px' }}>
                      {formatCurrency(grandTotalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="admin-modal-footer" style={{ padding: '16px 24px' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setCreateModalOpen(false)}
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => handleSaveGRN('DRAFT')}
              >
                Lưu Bản Nháp
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                style={{ background: 'linear-gradient(135deg, #8B5E3C 0%, #724C30 100%)' }}
                onClick={() => handleSaveGRN('CONFIRMED')}
              >
                <CheckCircle size={15} /> Xác Nhận Nhập Kho Chính Thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: VIEW EXISTING GOODS RECEIPT NOTE (A4 PREVIEW)
         ========================================================================== */}
      {selectedReceipt && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '820px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  Phiếu Nhập Kho: {selectedReceipt.receiptCode}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Nhà cung cấp: {selectedReceipt.supplierName} · Ngày lập: {new Date(selectedReceipt.receivedDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedReceipt(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'var(--admin-bg)', padding: '14px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>NHÀ CUNG CẤP:</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedReceipt.supplierName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Mã đối tác: NCC-AC-01</div>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-dim)' }}>KHO TIẾP NHẬN:</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedReceipt.warehouse || 'Tổng kho Thủ Đức'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Thủ kho phụ trách: {selectedReceipt.staffName}</div>
                </div>
              </div>

              <div className="admin-table-container" style={{ marginTop: '16px' }}>
                <table className="admin-data-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Mã SKU</th>
                      <th>Tên Mặt Hàng</th>
                      <th className="text-center">Số Lượng</th>
                      <th className="text-right">Đơn Giá Vốn</th>
                      <th className="text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td><code>{it.sku}</code></td>
                        <td style={{ fontWeight: 600 }}>{it.productName}</td>
                        <td className="text-center tabular-nums">{it.quantity} chiếc</td>
                        <td className="text-right tabular-nums">{formatCurrency(it.unitCost)}</td>
                        <td className="text-right tabular-nums" style={{ fontWeight: 700 }}>
                          {formatCurrency(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <div style={{ width: '280px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)' }}>
                    <span>Tổng tiền vốn:</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--admin-primary)' }}>
                      {formatCurrency(selectedReceipt.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  showToast('Đang kết xuất bản in A4 cho phiếu nhập kho...')
                  window.print()
                }}
              >
                <Printer size={14} /> In Phiếu A4
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setSelectedReceipt(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SAFETY DIALOG: CONFIRM OFFICIAL WAREHOUSE ENTRY
         ========================================================================== */}
      {confirmDialogReceipt && (
        <div className="admin-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setConfirmDialogReceipt(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: 'var(--admin-primary-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-primary)' }}>
                <AlertTriangle size={20} />
                <h3 className="admin-modal-title" style={{ color: 'var(--admin-primary)' }}>
                  Xác Nhận Nhập Kho Chính Thức?
                </h3>
              </div>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--admin-text-main)', lineHeight: 1.5 }}>
                Bạn chuẩn bị nhập chính thức <strong>{totalItemCount} kiện hàng</strong> vào <strong>{confirmDialogReceipt.warehouse}</strong> từ nhà cung cấp <strong>{confirmDialogReceipt.supplierName}</strong>.
              </p>

              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12.5px',
                  color: 'var(--admin-text-muted)',
                }}
              >
                Tác động hệ thống:
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Số lượng tồn kho thực tế sẽ <strong>lập tức tăng lên</strong> trên toàn hệ thống.</li>
                  <li>Ghi nhận công nợ phải trả: <strong>{formatCurrency(grandTotalCost)}</strong> cho đối tác.</li>
                  <li>Khóa phiếu nhập kho để đảm bảo tính toàn vẹn của sổ sách kế toán.</li>
                </ul>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmDialogReceipt(null)}
              >
                Kiểm Tra Lại
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleExecuteWarehouseEntry}
              >
                Xác Nhận Nhập Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
