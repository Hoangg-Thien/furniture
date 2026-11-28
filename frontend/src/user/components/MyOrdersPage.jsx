import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  ArrowLeft,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react'
import { fetchOrders } from '../../lib/orders'
import CancelOrderDialog from './CancelOrderDialog'
import OrderShippingInfo from './OrderShippingInfo'
import { productImageUrl } from '../../lib/productImages'

const EMPTY_PRODUCTS = []

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price || 0)}₫`

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã duyệt' },
  { id: 'SHIPPING', label: 'Vận chuyển' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

const resolveItemImage = (it, catalogProducts = []) => {
  if (!it) return ''

  // 1. Ưu tiên lấy trực tiếp URL từ database / đơn hàng (hỗ trợ link /images/... hoặc http/https hoặc base64)
  const directUrl = it.image_url || it.imageUrl || it.image
  if (directUrl && typeof directUrl === 'string' && directUrl.trim()) {
    const trimmed = directUrl.trim()
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed
    }
  }

  // 2. Tra cứu trực tiếp từ danh mục sản phẩm của giao diện chính (catalog)
  const pId = it.product_id || it.productId || it.id
  if (pId && Array.isArray(catalogProducts)) {
    const found = catalogProducts.find((p) => String(p.id) === String(pId))
    if (found?.image) return found.image
  }

  // 3. Tra cứu theo tên sản phẩm nếu có trong catalog
  const nameStr = (it.name || it.product_name || '').trim().toLowerCase()
  if (nameStr && Array.isArray(catalogProducts)) {
    const foundByName = catalogProducts.find(
      (p) => (p.name || '').trim().toLowerCase() === nameStr
    )
    if (foundByName?.image) return foundByName.image
  }

  return ''
}

function normalizeOrders(rawList = [], currentUser = null, catalogProducts = []) {
  if (!Array.isArray(rawList)) return []
  return rawList
    .map((ord) => {
      if (!ord) return null
      const orderId = ord.orderId || ord.id
      const orderNumber =
        ord.orderCode ||
        ord.orderNumber ||
        `FUNI-${new Date().getFullYear()}-${String(orderId || '000000').padStart(6, '0')}`

      const rawItems = Array.isArray(ord.items) ? ord.items : []
      const items = rawItems.map((it) => ({
        id: it.product_id || it.productId || it.id,
        name: it.product_name || it.name || 'Sản phẩm nội thất FuniStore',
        category: it.category_name || it.category || 'Nội thất gia đình',
        image: resolveItemImage(it, catalogProducts),
        quantity: Number(it.quantity) || 1,
        price: Number(it.unit_price ?? it.unitPrice ?? it.price ?? 0),
        lineTotal: Number(
          it.amount ??
            it.lineTotal ??
            (Number(it.unit_price ?? it.unitPrice ?? it.price ?? 0) * (Number(it.quantity) || 1))
        ),
      }))

      const itemsCalculatedSubtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
      const subtotal = Number(ord.subtotal != null ? ord.subtotal : itemsCalculatedSubtotal)
      const discountAmount = Number(ord.discount_amount != null ? ord.discount_amount : (ord.discountAmount || 0))
      const voucherCode = ord.voucher_code || ord.voucherCode || ord.appliedVoucher?.code || ''
      const total = Number(ord.total_amount ?? ord.totalAmount ?? ord.total ?? 0)
      const orderDate = ord.order_date || ord.orderDate || 'Chưa có thông tin'
      const status = String(ord.status || 'PENDING').toUpperCase()

      return {
        ...ord,
        id: orderId,
        orderId,
        orderNumber,
        items,
        subtotal,
        discount_amount: discountAmount,
        discountAmount,
        discountLabel: ord.discount_label || ord.discountLabel,
        voucher_code: voucherCode,
        voucherCode,
        total,
        orderDate,
        status,
        shippingInfo: ord.shippingInfo || {
          fullName: ord.full_name || currentUser?.fullName || 'Khách hàng',
          phone: ord.phone || currentUser?.phone || '',
          address: ord.address || currentUser?.address || '',
        },
      }
    })
    .filter(Boolean)
}

export default function MyOrdersPage({
  onClose,
  currentUser,
  catalogProducts = EMPTY_PRODUCTS,
  onViewOrderDetail,
  onReorder,
}) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingCancelOrder, setPendingCancelOrder] = useState(null)
  const [cancelMessage, setCancelMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    if (!currentUser?.customerId) return
    let cancelled = false
    let fetching = false
    async function loadOrders(initial = false) {
      if (fetching) return
      fetching = true
      if (initial) setLoading(true)
      try {
        const result = await fetchOrders(currentUser?.customerId)
        if (cancelled) return
        const normalized = normalizeOrders(result.orders, currentUser, catalogProducts)
        normalized.sort((a, b) => Number(b.orderId || 0) - Number(a.orderId || 0))
        if (!result.error) setOrders(normalized)
        setLoadError(result.error ? 'Không thể cập nhật đơn hàng mới nhất. Vui lòng thử lại.' : '')
      } finally {
        fetching = false
        if (!cancelled && initial) setLoading(false)
      }
    }
    loadOrders(true)
    const interval = setInterval(() => {
      if (!document.hidden) loadOrders()
    }, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [currentUser, catalogProducts, refreshVersion])

  // Lọc đơn hàng theo tab và từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const st = String(ord.status || 'PENDING').toUpperCase()

      // Lọc theo Tab
      if (activeTab !== 'ALL' && st !== activeTab) return false

      // Lọc theo từ khóa tìm kiếm (mã đơn hoặc tên sản phẩm)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchCode = (ord.orderNumber || '').toLowerCase().includes(query)
        const matchItem = Array.isArray(ord.items) && ord.items.some((it) => (it.name || '').toLowerCase().includes(query))
        return matchCode || matchItem
      }
      return true
    })
  }, [orders, activeTab, searchTerm])

  // Xử lý hủy đơn
  const handleOrderCancelled = (order) => {
    setPendingCancelOrder(null)
    setRefreshVersion(version => version + 1)
    setCancelMessage(`Đã hủy thành công đơn hàng ${order.orderNumber}.`)
    setTimeout(() => setCancelMessage(''), 4000)
    setOrders((prev) => prev.map((item) =>
      (item.id === order.id || item.orderNumber === order.orderNumber)
        ? { ...item, status: 'CANCELLED' }
        : item
    ))
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="shopee-order-status-badge pending">
            <Clock size={13} />
            CHỜ XÁC NHẬN
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="shopee-order-status-badge shipping">
            <CheckCircle2 size={13} />
            ĐÃ DUYỆT
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="shopee-order-status-badge completed">
            <CheckCircle2 size={13} />
            HOÀN THÀNH
          </span>
        )
      case 'SHIPPING':
        return <span className="shopee-order-status-badge shipping"><Truck size={13} /> ĐANG VẬN CHUYỂN</span>
      case 'CANCELLED':
        return (
          <span className="shopee-order-status-badge cancelled">
            <XCircle size={13} />
            ĐÃ HỦY
          </span>
        )
      default:
        return (
          <span className="shopee-order-status-badge">
            {status}
          </span>
        )
    }
  }

  const hasFilters = Boolean(searchTerm.trim()) || activeTab !== 'ALL'

  if (!currentUser) return null

  return (
    <main className="orders-page" id="top">
      <div className="shopee-orders-container">
        <header className="shopee-orders-header">
          <button
            className="shopee-orders-close"
            type="button"
            onClick={onClose}
            aria-label="Về cửa hàng"
          >
            <ArrowLeft size={16} /> Về cửa hàng
          </button>
          <h1 className="shopee-orders-title">Lịch sử đơn hàng</h1>
        </header>
        {loadError && <p className="catalog-note" role="status">{loadError}</p>}

        <div className="shopee-orders-toolbar">
          <div className="shopee-search-bar">
            <Search size={16} />
            <input
              type="text"
              aria-label="Tìm theo mã đơn hoặc tên sản phẩm"
              placeholder="Tìm theo mã đơn hoặc tên sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="shopee-search-clear"
                aria-label="Xóa từ khóa"
                type="button"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="shopee-status-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`shopee-status-tab ${activeTab === tab.id ? 'active' : ''}`}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.id === 'ALL' && orders.length > 0 && (
                  <span className="shopee-tab-count">{orders.length}</span>
                )}
                {tab.id !== 'ALL' && (
                  <span className="shopee-tab-count">
                    {orders.filter((o) => o.status === tab.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thông báo thao tác */}
        {cancelMessage && (
          <div className="shopee-cancel-alert" role="status">
            <CheckCircle2 size={16} />
            <span>{cancelMessage}</span>
          </div>
        )}

        <div className="shopee-orders-list">
          {loading && orders.length === 0 ? (
            <div className="shopee-orders-empty">
              <div className="shopee-spinner" />
              <p>Đang tải lịch sử đơn hàng...</p>
            </div>
          ) : loadError && orders.length === 0 ? (
            <button className="shopee-shop-now-btn" type="button" onClick={() => setRefreshVersion(v => v + 1)}>Thử lại</button>
          ) : filteredOrders.length === 0 ? (
            <div className="shopee-orders-empty">
              <ShoppingBag size={56} strokeWidth={1.2} />
              <h2>{hasFilters ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn hàng'}</h2>
              <p>{hasFilters ? 'Thử tìm bằng mã đơn khác hoặc xem lại tất cả đơn hàng.' : 'Đơn hàng của bạn sẽ xuất hiện tại đây sau khi đặt hàng.'}</p>
              <button type="button" className="shopee-shop-now-btn" onClick={hasFilters ? () => {
                setActiveTab('ALL')
                setSearchTerm('')
              } : onClose}>
                {hasFilters ? 'Xem tất cả đơn hàng' : 'Mua sắm ngay'}
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalItemsCount = order.items.reduce((s, it) => s + (it.quantity || 1), 0)
              const isPending = order.status === 'PENDING'

              return (
                <article className="shopee-order-card" key={order.orderNumber || order.id}>
                  <div className="shopee-card-header">
                    <h2 className="shopee-order-code-badge">{order.orderNumber}</h2>
                    <div className="shopee-card-status-col">
                      {renderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Danh sách các sản phẩm trong đơn */}
                  <div className="shopee-card-items-wrap">
                    {order.items.map((item, idx) => (
                      <div className="shopee-item-row" key={`${order.orderNumber}-${item.id || idx}`}>
                        <div className="shopee-item-img-box">
                          {item.image ? (
                            <img
                              src={productImageUrl(item.image)}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="shopee-item-fallback-icon"
                            style={{ display: item.image ? 'none' : 'flex' }}
                            title={item.name}
                          >
                            <Package size={24} className="shopee-fallback-pkg" />
                            <span className="shopee-fallback-text">Funi</span>
                          </div>
                        </div>
                        <div className="shopee-item-body">
                          <h4 className="shopee-item-title">{item.name}</h4>
                          <span className="shopee-item-variant">
                            {item.category}
                          </span>
                          <span className="shopee-item-qty">Số lượng: {item.quantity}</span>
                        </div>
                        <div className="shopee-item-price-col">
                          <span className="shopee-item-price">{formatPrice(item.lineTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <OrderShippingInfo order={order} />

                  {/* Thời gian và tổng kết đơn hàng */}
                  <div className="shopee-card-footer">
                    <div className="shopee-footer-meta">
                      <span className="shopee-order-date">
                        Thời gian đặt hàng: <strong>{order.orderDate}</strong>
                      </span>
                      <span className="shopee-delivery-note">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>

                    <div className="shopee-footer-total-group">
                      {Number(order.discount_amount || order.discountAmount || 0) > 0 && (
                        <div className="shopee-order-voucher-pill">
                          <Tag size={12} />
                          <span>
                            {order.discountLabel || (order.voucher_code ? `Voucher ${order.voucher_code}` : 'Ưu đãi')}: -{formatPrice(order.discount_amount || order.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="shopee-footer-total">
                        <span className="shopee-total-label">
                          Tổng cộng ({totalItemsCount} sản phẩm)
                        </span>
                        <span className="shopee-total-amount">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shopee-card-actions">
                    {isPending && (
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-cancel"
                        disabled={Boolean(pendingCancelOrder)}
                        onClick={() => setPendingCancelOrder(order)}
                      >
                        <X size={14} />
                        Hủy Đơn Hàng
                      </button>
                    )}

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-detail"
                      onClick={() => {
                        if (onViewOrderDetail) {
                          onViewOrderDetail(order)
                        }
                      }}
                    >
                      <Eye size={14} />
                      Xem Chi Tiết
                    </button>

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-reorder"
                      disabled={!order.items.length}
                      onClick={() => { if (onReorder?.(order.items)) onClose() }}
                    >
                      <RotateCcw size={14} />
                      Mua Lại
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
      {pendingCancelOrder && (
        <CancelOrderDialog order={pendingCancelOrder} onClose={() => setPendingCancelOrder(null)} onCancelled={handleOrderCancelled} />
      )}
    </main>
  )
}
