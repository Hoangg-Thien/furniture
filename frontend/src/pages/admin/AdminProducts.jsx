import React, { useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Star,
  Upload,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Tag,
  DollarSign,
  Package,
} from 'lucide-react'
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './adminMockData'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val)

export default function AdminProducts({ showToast, activeRole = 'ADMIN' }) {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [categories, setCategories] = useState(MOCK_CATEGORIES)
  const [viewMode, setViewMode] = useState('TABLE') // 'TABLE' | 'GRID'

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [sortBy, setSortBy] = useState('DEFAULT') // 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK'

  // Accordion row state (which products are expanded)
  const [expandedProductIds, setExpandedProductIds] = useState(new Set([1])) // default expand product 1 to wow the user!
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())

  // Modals
  const [modalMode, setModalMode] = useState(null) // 'CREATE' | 'EDIT' | 'CATEGORY_MANAGE'
  const [editingProduct, setEditingProduct] = useState(null)

  // 4-Step Create/Edit Form State
  const [formStep, setFormStep] = useState(1) // 1: General -> 2: Variants -> 3: Images -> 4: Pricing/Stock
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formCategory, setFormCategory] = useState(categories[0]?.name || '')
  const [formOrigin, setFormOrigin] = useState('Xưởng gỗ Đồng Kỵ - Bắc Ninh')
  const [formWarranty, setFormWarranty] = useState('36 tháng khung gỗ, 12 tháng nệm mút')
  const [formDesc, setFormDesc] = useState('')
  const [formLowStockThreshold, setFormLowStockThreshold] = useState(5)

  // Attribute Matrix Generator State
  const [attrColors, setAttrColors] = useState(['Nâu Walnut', 'Gỗ Sồi Tự Nhiên', 'Đen Mờ Nhám'])
  const [newColorInput, setNewColorInput] = useState('')
  const [attrSizes, setAttrSizes] = useState(['Tiêu chuẩn (1m6 x 2m0)', 'Rộng rãi (1m8 x 2m0)'])
  const [newSizeInput, setNewSizeInput] = useState('')

  // Generated Variants Matrix
  const [formVariants, setFormVariants] = useState([
    {
      id: 1,
      sku: 'FURN-VAR-01',
      color: 'Nâu Walnut',
      dimension: 'Tiêu chuẩn (1m6 x 2m0)',
      material: 'Gỗ óc chó tự nhiên',
      price: 18500000,
      costPrice: 11000000,
      stock: 12,
      active: true,
    },
    {
      id: 2,
      sku: 'FURN-VAR-02',
      color: 'Nâu Walnut',
      dimension: 'Rộng rãi (1m8 x 2m0)',
      material: 'Gỗ óc chó tự nhiên',
      price: 21000000,
      costPrice: 12500000,
      stock: 8,
      active: true,
    },
  ])

  // Batch fill for variants
  const [batchPrice, setBatchPrice] = useState('')
  const [batchCostPrice, setBatchCostPrice] = useState('')
  const [batchStock, setBatchStock] = useState('')

  // Images Gallery State
  const [formImages, setFormImages] = useState([
    { id: 1, url: '/images/sofa_goc_chu_L.jpg', isPrimary: true, name: 'Góc chụp chính diện' },
    { id: 2, url: '/images/ghe_don_thu_gian.jpg', isPrimary: false, name: 'Cận cảnh vân gỗ & nệm' },
    { id: 3, url: '/images/ban_tra_tron_doi.jpg', isPrimary: false, name: 'Không gian phòng mẫu' },
  ])

  // Category Manager Modal State
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')

  // Toggle Accordion Row
  function toggleAccordion(id) {
    const next = new Set(expandedProductIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedProductIds(next)
  }

  // Toggle Selection
  function toggleSelectProduct(id) {
    const next = new Set(selectedProductIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedProductIds(next)
  }

  function handleSelectAll(e) {
    if (e.target.checked) {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)))
    } else {
      setSelectedProductIds(new Set())
    }
  }

  // Generate Matrix Automatically from Attribute Combinations
  function handleGenerateVariants() {
    if (attrColors.length === 0 || attrSizes.length === 0) {
      alert('Vui lòng nhập ít nhất 1 Màu sắc và 1 Kích thước!')
      return
    }

    const generated = []
    let counter = 1
    const baseCode = formCode || `FURN-${Math.floor(100 + Math.random() * 900)}`

    for (const color of attrColors) {
      for (const size of attrSizes) {
        generated.push({
          id: Date.now() + counter,
          sku: `${baseCode}-V${counter}`,
          color,
          dimension: size,
          material: 'Gỗ sồi & Nỉ nhập khẩu',
          price: Number(batchPrice) || 16500000,
          costPrice: Number(batchCostPrice) || 9500000,
          stock: Number(batchStock) || 10,
          active: true,
        })
        counter++
      }
    }

    setFormVariants(generated)
    showToast(`Đã tự động tạo ${generated.length} biến thể từ tổ hợp thuộc tính!`)
  }

  // Apply batch prices/stocks to all variants
  function handleApplyBatch() {
    setFormVariants((prev) =>
      prev.map((v) => ({
        ...v,
        price: batchPrice ? Number(batchPrice) : v.price,
        costPrice: batchCostPrice ? Number(batchCostPrice) : v.costPrice,
        stock: batchStock ? Number(batchStock) : v.stock,
      }))
    )
    showToast('Đã áp dụng thông số hàng loạt cho toàn bộ biến thể!')
  }

  // Add attribute tag
  function handleAddColor() {
    if (newColorInput.trim() && !attrColors.includes(newColorInput.trim())) {
      setAttrColors([...attrColors, newColorInput.trim()])
      setNewColorInput('')
    }
  }

  function handleAddSize() {
    if (newSizeInput.trim() && !attrSizes.includes(newSizeInput.trim())) {
      setAttrSizes([...attrSizes, newSizeInput.trim()])
      setNewSizeInput('')
    }
  }

  // Set Primary Star Image
  function handleSetPrimaryImage(imgId) {
    setFormImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imgId,
      }))
    )
    showToast('Đã đặt làm ảnh đại diện sản phẩm!')
  }

  function handleDeleteImage(imgId) {
    if (formImages.length <= 1) {
      alert('Sản phẩm cần giữ ít nhất 1 ảnh!')
      return
    }
    const updated = formImages.filter((img) => img.id !== imgId)
    if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true
    }
    setFormImages(updated)
  }

  // Open Create Modal
  function handleOpenCreate() {
    setFormStep(1)
    setFormName('')
    setFormCode(`FURN-PROD-${Math.floor(100 + Math.random() * 900)}`)
    setFormCategory(categories[0]?.name || '')
    setFormOrigin('Xưởng mộc FurniStore Long An')
    setFormWarranty('36 tháng toàn bộ mối nối mộng gỗ')
    setFormDesc('Nội thất cao cấp phong cách Bắc Âu tối giản, xử lý tẩm sấy chống cong vênh mối mọt.')
    setFormLowStockThreshold(5)
    setFormVariants([
      {
        id: 1,
        sku: 'FURN-01-N20',
        color: 'Nâu Walnut',
        dimension: '1m6 x 2m0',
        material: 'Gỗ óc chó Bắc Mỹ',
        price: 18500000,
        costPrice: 11500000,
        stock: 12,
        active: true,
      },
      {
        id: 2,
        sku: 'FURN-01-N24',
        color: 'Nâu Walnut',
        dimension: '1m8 x 2m0',
        material: 'Gỗ óc chó Bắc Mỹ',
        price: 22000000,
        costPrice: 13500000,
        stock: 7,
        active: true,
      },
    ])
    setEditingProduct(null)
    setModalMode('CREATE')
  }

  // Open Edit Modal
  function handleOpenEdit(prod) {
    setFormStep(1)
    setEditingProduct(prod)
    setFormName(prod.name)
    setFormCode(prod.code)
    setFormCategory(prod.category)
    setFormDesc(prod.description)
    setFormVariants(
      prod.variants || [
        {
          id: 1,
          sku: `${prod.code}-V1`,
          color: 'Tiêu chuẩn',
          dimension: 'Tiêu chuẩn',
          material: 'Gỗ sồi cao cấp',
          price: prod.basePrice,
          costPrice: prod.costPrice,
          stock: prod.totalStock,
          active: true,
        },
      ]
    )
    setFormImages([
      { id: 1, url: prod.image, isPrimary: true, name: 'Ảnh đại diện chính' },
      { id: 2, url: '/images/ban_tra_tron_doi.jpg', isPrimary: false, name: 'Chi tiết sản phẩm' },
    ])
    setModalMode('EDIT')
  }

  // Save Product (Create or Edit)
  function handleSaveProduct(e) {
    if (e) e.preventDefault()
    if (!formName.trim()) {
      alert('Vui lòng nhập Tên sản phẩm!')
      setFormStep(1)
      return
    }

    const primaryImg = formImages.find((img) => img.isPrimary)?.url || formImages[0]?.url || '/images/sofa_goc_chu_L.jpg'
    const totalCalculatedStock = formVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    const minPrice = Math.min(...formVariants.map((v) => Number(v.price) || 0))
    const maxPrice = Math.max(...formVariants.map((v) => Number(v.price) || 0))

    if (modalMode === 'EDIT' && editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formName,
                code: formCode,
                category: formCategory,
                description: formDesc,
                image: primaryImg,
                basePrice: minPrice,
                maxPrice: maxPrice,
                totalStock: totalCalculatedStock,
                variants: formVariants,
              }
            : p
        )
      )
      showToast(`Đã cập nhật sản phẩm "${formName}" thành công!`)
    } else {
      const newProd = {
        id: Date.now(),
        code: formCode,
        name: formName,
        category: formCategory,
        basePrice: minPrice || 14500000,
        maxPrice: maxPrice || 18500000,
        costPrice: formVariants[0]?.costPrice || 9000000,
        totalStock: totalCalculatedStock,
        status: 'ACTIVE',
        image: primaryImg,
        description: formDesc,
        variants: formVariants,
      }
      setProducts([newProd, ...products])
      showToast(`Đã thêm mới sản phẩm "${formName}" với ${formVariants.length} biến thể!`)
    }

    setModalMode(null)
  }

  // Delete product
  function handleDelete(id, name) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      setProducts(products.filter((p) => p.id !== id))
      showToast(`Đã xóa sản phẩm "${name}".`)
    }
  }

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(searchTerm.toLowerCase()))

      let matchStatus = true
      if (statusFilter === 'LOW_STOCK') matchStatus = p.totalStock < 6 && p.totalStock > 0
      else if (statusFilter === 'OUT_OF_STOCK') matchStatus = p.totalStock === 0
      else if (statusFilter === 'ACTIVE') matchStatus = p.totalStock > 0

      return matchCat && matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice
      if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice
      if (sortBy === 'STOCK') return b.totalStock - a.totalStock
      return 0
    })

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản Lý Sản Phẩm & Biến Thể Nội Thất</h1>
          <p className="admin-page-subtitle">
            Kiểm soát danh mục sản phẩm, ma trận kích thước - màu sắc - chất liệu và số lượng tồn kho theo thời gian thực.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setModalMode('CATEGORY_MANAGE')}
            title="Quản lý cây danh mục nội thất"
          >
            <Layers size={15} /> Quản Lý Danh Mục
          </button>

          {(activeRole === 'ADMIN' || activeRole === 'SALES') && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} /> Thêm Sản Phẩm Mới
            </button>
          )}
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '380px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm theo tên SP, mã SKU, chất liệu gỗ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="admin-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">Tất cả danh mục ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái tồn</option>
                <option value="ACTIVE">Đang sẵn hàng bán</option>
                <option value="LOW_STOCK">Sắp hết hàng (&lt; 6 cái)</option>
                <option value="OUT_OF_STOCK">Đã hết hàng (0 cái)</option>
              </select>

              <select
                className="admin-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="DEFAULT">Sắp xếp mặc định</option>
                <option value="PRICE_ASC">Giá tăng dần</option>
                <option value="PRICE_DESC">Giá giảm dần</option>
                <option value="STOCK">Tồn kho nhiều nhất</option>
              </select>

              {(searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('ALL')
                    setStatusFilter('ALL')
                    setSortBy('DEFAULT')
                  }}
                >
                  Xóa lọc
                </button>
              )}

              {/* View Toggle (Table vs Grid) */}
              <div className="admin-view-toggle">
                <button
                  type="button"
                  className={`admin-view-toggle-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                  onClick={() => setViewMode('TABLE')}
                  title="Xem dạng Bảng chi tiết"
                >
                  <List size={14} /> Bảng
                </button>
                <button
                  type="button"
                  className={`admin-view-toggle-btn ${viewMode === 'GRID' ? 'active' : ''}`}
                  onClick={() => setViewMode('GRID')}
                  title="Xem dạng Thẻ lưới (Card Grid)"
                >
                  <LayoutGrid size={14} /> Thẻ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar if selected */}
        {selectedProductIds.size > 0 && (
          <div
            style={{
              padding: '10px 20px',
              background: 'var(--admin-primary-soft)',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}
          >
            <div>
              Đã chọn <strong>{selectedProductIds.size}</strong> sản phẩm
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={() => {
                  showToast(`Đã tạm ngưng kinh doanh ${selectedProductIds.size} sản phẩm đã chọn.`)
                  setSelectedProductIds(new Set())
                }}
              >
                Tạm Ngưng Bán
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={() => {
                  if (window.confirm(`Xóa vĩnh viễn ${selectedProductIds.size} sản phẩm đã chọn?`)) {
                    setProducts(products.filter((p) => !selectedProductIds.has(p.id)))
                    setSelectedProductIds(new Set())
                    showToast('Đã xóa các sản phẩm được chọn.')
                  }
                }}
              >
                Xóa Đã Chọn
              </button>
            </div>
          </div>
        )}

        {/* 1. VIEW MODE: TABLE WITH ACCORDION ROWS */}
        {viewMode === 'TABLE' && (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProductIds.size === filteredProducts.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Ảnh & Mã SP</th>
                  <th>Tên Sản Phẩm & Biến Thể</th>
                  <th>Danh Mục</th>
                  <th className="text-right">Khoảng Giá Bán</th>
                  <th className="text-center">Tổng Tồn Kho</th>
                  <th className="text-center">Trạng Thái</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                      Không có sản phẩm nào khớp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isExpanded = expandedProductIds.has(p.id)
                    const isSelected = selectedProductIds.has(p.id)
                    const variantCount = p.variants?.length || 1

                    return (
                      <React.Fragment key={p.id}>
                        <tr style={{ background: isSelected ? 'var(--admin-primary-soft)' : undefined }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(p.id)}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{
                                  width: '46px',
                                  height: '46px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--admin-border)',
                                }}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80'
                                }}
                              />
                              <div>
                                <code
                                  style={{
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    color: 'var(--admin-primary)',
                                    background: 'var(--admin-bg)',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {p.code}
                                </code>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                              {p.name}
                            </div>
                            {/* Accordion toggle link */}
                            <button
                              type="button"
                              onClick={() => toggleAccordion(p.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--admin-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '3px',
                                padding: 0,
                              }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span>
                                {isExpanded ? 'Thu gọn' : `Xem chi tiết ${variantCount} biến thể`}
                              </span>
                            </button>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                              {p.category}
                            </span>
                          </td>
                          <td className="text-right tabular-nums" style={{ fontWeight: 700 }}>
                            {p.maxPrice && p.maxPrice > p.basePrice
                              ? `${formatCurrency(p.basePrice)} - ${formatCurrency(p.maxPrice)}`
                              : formatCurrency(p.basePrice)}
                          </td>
                          <td className="text-center">
                            <span
                              className={`tabular-nums ${p.totalStock < 6 ? 'text-rose-500' : ''}`}
                              style={{ fontWeight: 700 }}
                            >
                              {p.totalStock} cái
                            </span>
                            <div className="admin-stock-bar" style={{ margin: '4px auto 0' }}>
                              <div
                                className={`admin-stock-fill ${
                                  p.totalStock === 0
                                    ? 'low'
                                    : p.totalStock < 6
                                    ? 'medium'
                                    : 'high'
                                }`}
                                style={{
                                  width: `${Math.min(100, (p.totalStock / 25) * 100)}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            <span
                              className={`admin-status-badge ${
                                p.totalStock === 0
                                  ? 'danger'
                                  : p.totalStock < 6
                                  ? 'warning'
                                  : 'success'
                              }`}
                            >
                              <span className="dot" />
                              {p.totalStock === 0
                                ? 'Hết hàng'
                                : p.totalStock < 6
                                ? 'Sắp hết'
                                : 'Đang bán'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '5px 8px' }}
                                title="Chỉnh sửa sản phẩm"
                                onClick={() => handleOpenEdit(p)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                style={{ padding: '5px 8px' }}
                                title="Xóa sản phẩm"
                                onClick={() => handleDelete(p.id, p.name)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ACCORDION EXPANDED SUBROW FOR VARIANTS */}
                        {isExpanded && (
                          <tr className="admin-accordion-row">
                            <td colSpan="8" style={{ padding: 0 }}>
                              <div className="admin-accordion-content">
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--admin-text-main)' }}>
                                    DANH SÁCH BIẾN THỂ THỰC TẾ TRONG KHO (SKU SPECIFICATIONS):
                                  </div>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                                    onClick={() => handleOpenEdit(p)}
                                  >
                                    <Plus size={12} /> Thêm biến thể cho mẫu này
                                  </button>
                                </div>

                                <table className="admin-subvariants-table">
                                  <thead>
                                    <tr>
                                      <th>Mã SKU</th>
                                      <th>Màu Sắc</th>
                                      <th>Kích Thước</th>
                                      <th>Chất Liệu Cấu Thành</th>
                                      <th className="text-right">Giá Bán Lẻ</th>
                                      <th className="text-center">Tồn Kho</th>
                                      <th className="text-center">Trạng Thái</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.variants && p.variants.length > 0 ? (
                                      p.variants.map((v) => (
                                        <tr key={v.id}>
                                          <td>
                                            <code style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                              {v.sku}
                                            </code>
                                          </td>
                                          <td>{v.color}</td>
                                          <td>{v.dimension}</td>
                                          <td>{v.material}</td>
                                          <td className="text-right tabular-nums" style={{ fontWeight: 700 }}>
                                            {formatCurrency(v.price)}
                                          </td>
                                          <td className="text-center tabular-nums">
                                            <span
                                              className={`admin-status-badge ${
                                                v.stock < 4 ? 'danger' : 'success'
                                              }`}
                                              style={{ fontSize: '11px', padding: '1px 8px' }}
                                            >
                                              {v.stock} chiếc
                                            </span>
                                          </td>
                                          <td className="text-center">
                                            <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                                              ✓ Đang bán
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '12px' }}>
                                          Chưa có biến thể chi tiết.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. VIEW MODE: GRID CARDS */}
        {viewMode === 'GRID' && (
          <div style={{ padding: '20px' }}>
            <div className="admin-products-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="admin-product-card">
                  <div style={{ position: 'relative' }}>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="admin-product-card-img"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(35, 31, 29, 0.85)',
                        color: '#FFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {p.category}
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'var(--admin-surface)',
                        color: 'var(--admin-primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      {p.variants?.length || 1} biến thể
                    </span>
                  </div>

                  <div className="admin-product-card-body">
                    <code style={{ fontSize: '11px', color: 'var(--admin-primary)', fontWeight: 700 }}>
                      {p.code}
                    </code>
                    <h3 style={{ margin: '4px 0 6px 0', fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                      {p.name}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        color: 'var(--admin-text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {p.description}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Giá niêm yết:</span>
                        <span className="tabular-nums" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-primary)' }}>
                          {formatCurrency(p.basePrice)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>Tồn kho:</span>
                        <span
                          className={`tabular-nums ${p.totalStock < 6 ? 'text-rose-500' : ''}`}
                          style={{ fontWeight: 600, fontSize: '12.5px' }}
                        >
                          {p.totalStock} cái
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-product-card-footer">
                    <span
                      className={`admin-status-badge ${
                        p.totalStock === 0 ? 'danger' : p.totalStock < 6 ? 'warning' : 'success'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      <span className="dot" />
                      {p.totalStock === 0 ? 'Hết hàng' : p.totalStock < 6 ? 'Sắp hết' : 'Đang bán'}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '5px 8px' }}
                        onClick={() => handleOpenEdit(p)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '5px 8px' }}
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================================================
          MODAL: 4-STEP PRODUCT CREATION & EDIT WITH ATTRIBUTE MATRIX GENERATOR
         ========================================================================== */}
      {(modalMode === 'CREATE' || modalMode === 'EDIT') && (
        <div className="admin-modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '820px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  {modalMode === 'CREATE' ? 'Thêm Sản Phẩm Nội Thất Mới' : `Chỉnh Sửa: ${formName}`}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Quy trình chuẩn hóa 4 bước kiểm định chất lượng nội thất
                </span>
              </div>
              <button className="admin-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            {/* 4-Step Tab Navigation */}
            <div className="admin-form-tabs">
              <button
                type="button"
                className={`admin-form-tab-btn ${formStep === 1 ? 'active' : ''}`}
                onClick={() => setFormStep(1)}
              >
                <span className="admin-tab-step-badge">1</span>
                <span>Thông Tin Chung</span>
              </button>
              <button
                type="button"
                className={`admin-form-tab-btn ${formStep === 2 ? 'active' : ''}`}
                onClick={() => setFormStep(2)}
              >
                <span className="admin-tab-step-badge">2</span>
                <span>Biến Thể & Ma Trận ({formVariants.length})</span>
              </button>
              <button
                type="button"
                className={`admin-form-tab-btn ${formStep === 3 ? 'active' : ''}`}
                onClick={() => setFormStep(3)}
              >
                <span className="admin-tab-step-badge">3</span>
                <span>Thư Viện Hình Ảnh ({formImages.length})</span>
              </button>
              <button
                type="button"
                className={`admin-form-tab-btn ${formStep === 4 ? 'active' : ''}`}
                onClick={() => setFormStep(4)}
              >
                <span className="admin-tab-step-badge">4</span>
                <span>Giá & Định Mức Tồn</span>
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {/* STEP 1: GENERAL INFORMATION */}
              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                    <div className="admin-form-group">
                      <label>Tên Sản Phẩm Nội Thất *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Sofa da bò Milan góc chữ L cao cấp"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Mã Sản Phẩm (Product Code)</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="admin-form-group">
                      <label>Danh Mục Phân Loại *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label>Xưởng Gia Công / Xuất Xứ</label>
                      <input
                        type="text"
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Chính Sách Bảo Hành & Bảo Trì Định Kỳ</label>
                    <input
                      type="text"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Mô Tả Kiểu Dáng, Khung Gỗ & Tính Năng Nổi Bật</label>
                    <textarea
                      rows="4"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Mô tả kỹ thuật: cốt gỗ sồi Mỹ tẩm sấy công nghệ cao, đệm mút D40 chống xẹp lún, bảo hành 3 năm..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: ATTRIBUTE MATRIX GENERATOR & VARIANTS TABLE */}
              {formStep === 2 && (
                <div>
                  <div
                    style={{
                      background: 'var(--admin-primary-soft)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '16px',
                      fontSize: '13px',
                    }}
                  >
                    <strong>Bộ sinh ma trận biến thể tự động (Attribute Combinator):</strong> Định nghĩa các thuộc tính như màu sắc và kích cỡ, sau đó nhấn nút để tự động sinh ra danh sách tổ hợp SKU cho xưởng sản xuất.
                  </div>

                  {/* Attribute 1: Color / Material */}
                  <div className="admin-attr-box">
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                      Thuộc tính 1: Màu sắc / Chất liệu vải bọc
                    </div>
                    <div className="admin-tag-pill-list">
                      {attrColors.map((color) => (
                        <span key={color} className="admin-tag-pill">
                          {color}
                          <button
                            type="button"
                            className="admin-tag-pill-remove"
                            onClick={() => setAttrColors(attrColors.filter((c) => c !== color))}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="admin-filter-input"
                        placeholder="Thêm màu mới (VD: Xám Tro, Nâu Da Bò...)"
                        style={{ flex: 1 }}
                        value={newColorInput}
                        onChange={(e) => setNewColorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={handleAddColor}
                      >
                        + Thêm Màu
                      </button>
                    </div>
                  </div>

                  {/* Attribute 2: Dimensions */}
                  <div className="admin-attr-box">
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                      Thuộc tính 2: Kích thước tiêu chuẩn
                    </div>
                    <div className="admin-tag-pill-list">
                      {attrSizes.map((size) => (
                        <span key={size} className="admin-tag-pill">
                          {size}
                          <button
                            type="button"
                            className="admin-tag-pill-remove"
                            onClick={() => setAttrSizes(attrSizes.filter((s) => s !== size))}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="admin-filter-input"
                        placeholder="Thêm kích thước (VD: 2m0 x 2m2, Phủ bì 2m8...)"
                        style={{ flex: 1 }}
                        value={newSizeInput}
                        onChange={(e) => setNewSizeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={handleAddSize}
                      >
                        + Thêm Kích Thước
                      </button>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={handleGenerateVariants}
                      style={{ padding: '10px 24px', fontSize: '14px' }}
                    >
                      <Sparkles size={16} />
                      Tạo Biến Thể Tự Động Từ Tổ Hợp ({attrColors.length} x {attrSizes.length} = {attrColors.length * attrSizes.length} biến thể)
                    </button>
                  </div>

                  {/* Batch Fill Toolbar */}
                  <div
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Áp dụng nhanh cho tất cả:</span>
                    <input
                      type="number"
                      placeholder="Giá bán niêm yết (VNĐ)"
                      className="admin-filter-input"
                      style={{ width: '170px' }}
                      value={batchPrice}
                      onChange={(e) => setBatchPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Giá vốn nhập (VNĐ)"
                      className="admin-filter-input"
                      style={{ width: '150px' }}
                      value={batchCostPrice}
                      onChange={(e) => setBatchCostPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Số tồn khởi tạo"
                      className="admin-filter-input"
                      style={{ width: '120px' }}
                      value={batchStock}
                      onChange={(e) => setBatchStock(e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={handleApplyBatch}
                      style={{ padding: '6px 12px' }}
                    >
                      Áp Dụng
                    </button>
                  </div>

                  {/* Matrix Variants Table */}
                  <div className="admin-table-container">
                    <table className="admin-data-table" style={{ fontSize: '12.5px' }}>
                      <thead>
                        <tr>
                          <th>Mã SKU</th>
                          <th>Màu Sắc</th>
                          <th>Kích Thước</th>
                          <th style={{ width: '140px' }}>Giá Bán (₫)</th>
                          <th style={{ width: '120px' }}>Giá Vốn (₫)</th>
                          <th style={{ width: '80px' }} className="text-center">Tồn</th>
                          <th className="text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formVariants.map((v, idx) => (
                          <tr key={v.id}>
                            <td>
                              <input
                                type="text"
                                style={{
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-border)',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: 'var(--admin-primary)',
                                  fontWeight: 700,
                                  width: '120px',
                                }}
                                value={v.sku}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setFormVariants((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                                  )
                                }}
                              />
                            </td>
                            <td>{v.color}</td>
                            <td>{v.dimension}</td>
                            <td>
                              <input
                                type="number"
                                className="tabular-nums"
                                style={{
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-border)',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  width: '120px',
                                  textAlign: 'right',
                                  fontWeight: 600,
                                }}
                                value={v.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setFormVariants((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                                  )
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="tabular-nums"
                                style={{
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-border)',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  width: '110px',
                                  textAlign: 'right',
                                }}
                                value={v.costPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setFormVariants((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, costPrice: val } : item))
                                  )
                                }}
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                className="tabular-nums"
                                style={{
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-border)',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  width: '60px',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                }}
                                value={v.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setFormVariants((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                                  )
                                }}
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer' }}
                                onClick={() => setFormVariants(formVariants.filter((_, i) => i !== idx))}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 3: IMAGES GALLERY & DROPZONE */}
              {formStep === 3 && (
                <div>
                  <div
                    className="admin-image-dropzone"
                    onClick={() => {
                      // Demo upload new photo
                      const newId = Date.now()
                      setFormImages([
                        ...formImages,
                        {
                          id: newId,
                          url: '/images/ban_tra_tron_doi.jpg',
                          isPrimary: false,
                          name: `Ảnh bổ sung ${formImages.length + 1}`,
                        },
                      ])
                      showToast('Đã tải lên 1 ảnh nội thất mới!')
                    }}
                  >
                    <Upload size={32} style={{ color: 'var(--admin-primary)', margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                      Kéo thả nhiều ảnh sản phẩm vào đây hoặc BẤM ĐỂ DUYỆT
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                      Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 15MB/ảnh). Khuyên dùng ảnh chụp phối cảnh góc rộng và cận cảnh chi tiết vân gỗ.
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', fontWeight: 600, fontSize: '13px' }}>
                    Bộ Sưu Tập Ảnh Sản Phẩm ({formImages.length} ảnh):
                  </div>

                  <div className="admin-gallery-grid">
                    {formImages.map((img) => (
                      <div
                        key={img.id}
                        className={`admin-gallery-item ${img.isPrimary ? 'is-primary' : ''}`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="admin-gallery-thumb"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80'
                          }}
                        />

                        {img.isPrimary && (
                          <div className="admin-primary-star-badge">
                            <Star size={11} fill="#FFF" /> Đại Diện
                          </div>
                        )}

                        <div className="admin-gallery-overlay">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '4px 6px', fontSize: '11px', background: '#F59E0B', color: '#FFF' }}
                              onClick={() => handleSetPrimaryImage(img.id)}
                              title="Đặt làm ảnh đại diện chính"
                            >
                              <Star size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 6px', fontSize: '11px' }}
                            onClick={() => handleDeleteImage(img.id)}
                            title="Xóa ảnh này"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: PRICING & INVENTORY THRESHOLD */}
              {formStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      background: 'var(--admin-surface-hover)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '12px',
                      padding: '18px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Tóm Tắt Kho & Khoảng Giá:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Tổng số biến thể:</span>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--admin-primary)' }}>
                          {formVariants.length} biến thể
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Tổng tồn kho khởi tạo:</span>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--admin-text-main)' }}>
                          {formVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} chiếc
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Khoảng giá bán:</span>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--admin-primary)' }}>
                          {formVariants.length > 0
                            ? `${formatCurrency(Math.min(...formVariants.map((v) => v.price)))} - ${formatCurrency(Math.max(...formVariants.map((v) => v.price)))}`
                            : 'Chưa có giá'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Ngưỡng Cảnh Báo Tồn Kho Tối Thiểu (Chiếc) *</label>
                    <input
                      type="number"
                      min="1"
                      value={formLowStockThreshold}
                      onChange={(e) => setFormLowStockThreshold(Number(e.target.value))}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>
                      Hệ thống sẽ tự động bật cảnh báo đỏ trên Dashboard khi tổng tồn của sản phẩm xuống dưới mức này.
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'var(--admin-success-soft)',
                      color: 'var(--admin-success)',
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>Mọi thông tin sản phẩm và tổ hợp thuộc tính đã sẵn sàng để phát hành trên sàn!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="admin-modal-footer">
              {formStep > 1 && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setFormStep(formStep - 1)}
                >
                  <ArrowLeft size={14} /> Quay Lại Bước {formStep - 1}
                </button>
              )}

              {formStep < 4 ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => setFormStep(formStep + 1)}
                >
                  Tiếp Tục Bước {formStep + 1} <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveProduct}
                  style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)' }}
                >
                  <Check size={16} /> Lưu & Phát Hành Sản Phẩm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: CATEGORY MANAGEMENT DRAWER
         ========================================================================== */}
      {modalMode === 'CATEGORY_MANAGE' && (
        <div className="admin-modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Quản Lý Danh Mục Nội Thất</h3>
              <button className="admin-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Add New Category Input */}
              <div
                style={{
                  background: 'var(--admin-bg)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                  Thêm Danh Mục Nội Thất Mới:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="admin-filter-input"
                    placeholder="Tên danh mục (VD: Nội thất văn phòng, Bàn trang điểm...)"
                    style={{ flex: 1 }}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      if (!newCatName.trim()) return
                      const newCat = {
                        id: Date.now(),
                        name: newCatName.trim(),
                        code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
                        productCount: 0,
                        status: 'ACTIVE',
                        description: newCatDesc || 'Danh mục sản phẩm nội thất FurniStore',
                      }
                      setCategories([...categories, newCat])
                      setNewCatName('')
                      setNewCatDesc('')
                      showToast(`Đã thêm danh mục "${newCat.name}" thành công!`)
                    }}
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Category List Table */}
              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Tên Danh Mục</th>
                      <th>Mã Phân Loại</th>
                      <th className="text-center">Số Sản Phẩm</th>
                      <th className="text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          <code style={{ color: 'var(--admin-primary)' }}>{c.code}</code>
                        </td>
                        <td className="text-center tabular-nums">
                          <span className="admin-status-badge info">{c.productCount || 0} SP</span>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              if (window.confirm(`Xóa danh mục "${c.name}"?`)) {
                                setCategories(categories.filter((cat) => cat.id !== c.id))
                                showToast(`Đã xóa danh mục "${c.name}".`)
                              }
                            }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setModalMode(null)}
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
