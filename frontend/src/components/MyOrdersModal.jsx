import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Eye,
  Store,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Tag,
} from 'lucide-react'
import { fetchOrders, cancelOrderApi } from '../lib/orders'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price || 0)}₫`

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'SHIPPING', label: 'Đang vận chuyển' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

const PRODUCT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  2: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
  3: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80',
  4: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80',
  5: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80',
  6: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80',
  7: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80',
  8: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
  9: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
  10: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
  11: 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?auto=format&fit=crop&w=600&q=80',
  12: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
  13: 'https://images.unsplash.com/photo-1589384267710-7a170981ca78?auto=format&fit=crop&w=600&q=80',
  14: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  15: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  16: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
  17: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
  18: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
  19: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
  20: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
}

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

  // 4. Nhận diện fallback cho ghế Luna (/images/ghe_an_go_soi.jpg trong DB)
  if (nameStr.includes('luna')) {
    return '/images/ghe_an_go_soi.jpg'
  }

  // 5. Fallback từ PRODUCT_IMAGES
  if (pId && PRODUCT_IMAGES[pId]) return PRODUCT_IMAGES[pId]

  return ''
}

function getLocalOrders() {
  try {
    const historyList = JSON.parse((localStorage.getItem('funi_orders_history') || localStorage.getItem('nep_orders_history')) || '[]')
    const lastOrder = JSON.parse((localStorage.getItem('funi_last_order') || localStorage.getItem('nep_last_order')) || 'null')
    const list = Array.isArray(historyList) ? [...historyList] : []
    if (lastOrder) {
      const lKey = lastOrder.orderNumber || lastOrder.orderId || lastOrder.id
      if (!list.some((o) => (o.orderNumber || o.orderId || o.id) === lKey)) {
        list.unshift(lastOrder)
      }
    }
    return list
  } catch {
    return []
  }
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
        price: Number(it.unit_price || it.price || 0),
        lineTotal: Number(
          it.amount ||
            it.lineTotal ||
            (Number(it.unit_price || it.price || 0) * (Number(it.quantity) || 1))
        ),
      }))

      const itemsCalculatedSubtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
      const subtotal = Number(ord.subtotal != null ? ord.subtotal : itemsCalculatedSubtotal)
      const discountAmount = Number(ord.discount_amount != null ? ord.discount_amount : (ord.discountAmount || 0))
      const voucherCode = ord.voucher_code || ord.voucherCode || ord.appliedVoucher?.code || ''
      const total = Number(ord.total_amount != null ? ord.total_amount : (ord.total || 0))
      const orderDate = ord.order_date || ord.orderDate || 'Vừa xong'
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

export default function MyOrdersModal({
  isOpen,
  onClose,
  currentUser,
  catalogProducts = [],
  onViewOrderDetail,
  onReorder,
  onOpenStore,
}) {
  const [orders, setOrders] = useState(() =>
    normalizeOrders(getLocalOrders(), currentUser, catalogProducts)
  )
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelMessage, setCancelMessage] = useState('')

  // Tải danh sách đơn hàng từ Backend + LocalStorage
  const loadOrders = async () => {
    // 1. Hiển thị đơn từ localStorage trước để không bao giờ bị màn hình trắng
    const local = getLocalOrders()
    if (local.length > 0) {
      setOrders(normalizeOrders(local, currentUser, catalogProducts))
    }

    setLoading(true)
    try {
      const customerId = currentUser?.customerId || null
      let fetchedOrders = []

      // 2. Tải đơn từ backend riêng của tài khoản này nếu có
      if (customerId) {
        const res = await fetchOrders(customerId)
        if (Array.isArray(res.orders) && res.orders.length > 0) {
          fetchedOrders = res.orders
        }
      }

      // 3. Nếu tài khoản chưa có đơn riêng, tự động tải toàn bộ danh sách đơn hệ thống
      if (!fetchedOrders || fetchedOrders.length === 0) {
        const allRes = await fetchOrders(null)
        fetchedOrders = allRes.orders || []
      }

      // 4. Gộp với các đơn mới đặt trong localStorage
      const merged = [...(fetchedOrders || [])]
      for (const loc of local) {
        const idKey = loc.orderNumber || loc.orderId || loc.id
        const exists = merged.some(
          (o) => (o.orderCode || o.orderNumber || o.orderId || o.id) === idKey
        )
        if (!exists) {
          merged.unshift(loc)
        }
      }

      const normalized = normalizeOrders(merged, currentUser, catalogProducts)

      // Sắp xếp đơn mới nhất lên đầu
      normalized.sort((a, b) => {
        const idA = Number(a.orderId || a.id || 0)
        const idB = Number(b.orderId || b.id || 0)
        if (idA && idB && idA !== idB) return idB - idA
        const timeA = new Date(a.orderDate).getTime() || 0
        const timeB = new Date(b.orderDate).getTime() || 0
        return timeB - timeA
      })

      setOrders(normalized)
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    loadOrders()
    const interval = setInterval(() => {
      loadOrders()
    }, 4000)
    return () => clearInterval(interval)
  }, [isOpen, currentUser, catalogProducts])

  // Lọc đơn hàng theo tab và từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const st = String(ord.status || 'PENDING').toUpperCase()

      // Lọc theo Tab
      if (activeTab === 'PENDING' && st !== 'PENDING' && st !== 'CONFIRMED' && st !== 'WAITING') return false
      if (activeTab === 'SHIPPING' && st !== 'SHIPPING' && st !== 'PROCESSING' && st !== 'DELIVERING') return false
      if (activeTab === 'COMPLETED' && st !== 'COMPLETED' && st !== 'DELIVERED' && st !== 'SUCCESS') return false
      if (activeTab === 'CANCELLED' && st !== 'CANCELLED' && st !== 'CANCELED') return false

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
  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng ${order.orderNumber} không?\nHành động này không thể hoàn tác.`
    )
    if (!confirmCancel) return

    setCancellingId(order.id || order.orderNumber)
    try {
      const res = await cancelOrderApi(order.id)
      if (res.success) {
        setCancelMessage(`Đã hủy thành công đơn hàng ${order.orderNumber}.`)
        setTimeout(() => setCancelMessage(''), 4000)
        // Cập nhật trạng thái tại state
        setOrders((prev) =>
          prev.map((o) =>
            (o.id === order.id || o.orderNumber === order.orderNumber)
              ? { ...o, status: 'CANCELLED' }
              : o
          )
        )
      } else {
        alert(res.error || 'Không thể hủy đơn hàng vào lúc này.')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi hủy đơn.')
    } finally {
      setCancellingId(null)
    }
  }

  // Xử lý mua lại (Re-order)
  const handleReorderClick = (order) => {
    if (onReorder) {
      onReorder(order.items)
    }
    onClose()
  }

  // Render trạng thái đơn theo phong cách Shopee
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="shopee-order-status-badge pending">
            <Clock size={13} />
            CHỜ XÁC NHẬN
          </span>
        )
      case 'SHIPPING':
      case 'PROCESSING':
        return (
          <span className="shopee-order-status-badge shipping">
            <Truck size={13} />
            ĐANG VẬN CHUYỂN
          </span>
        )
      case 'COMPLETED':
      case 'DELIVERED':
        return (
          <span className="shopee-order-status-badge completed">
            <CheckCircle2 size={13} />
            HOÀN THÀNH
          </span>
        )
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

  if (!isOpen) return null

  return (
    <div className="shopee-orders-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shopee-orders-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <header className="shopee-orders-header">
          <div className="shopee-orders-title-group">
            <Package size={22} className="shopee-header-icon" />
            <div>
              <h2 className="shopee-orders-title">Đơn Mua Của Tôi</h2>
              <p className="shopee-orders-subtitle">Quản lý và theo dõi tiến trình đơn hàng của bạn</p>
            </div>
          </div>
          <button
            className="shopee-orders-close"
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </header>

        {/* Thanh tìm kiếm & Tabs Shopee */}
        <div className="shopee-orders-toolbar">
          <div className="shopee-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Bạn có thể tìm kiếm theo Mã Đơn Hàng hoặc Tên Sản Phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="shopee-search-clear"
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
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.id === 'ALL' && orders.length > 0 && (
                  <span className="shopee-tab-count">{orders.length}</span>
                )}
                {tab.id !== 'ALL' && (
                  <span className="shopee-tab-count">
                    {orders.filter((o) => {
                      const st = String(o.status || 'PENDING').toUpperCase()
                      if (tab.id === 'PENDING') return st === 'PENDING' || st === 'CONFIRMED' || st === 'WAITING'
                      if (tab.id === 'SHIPPING') return st === 'SHIPPING' || st === 'PROCESSING' || st === 'DELIVERING'
                      if (tab.id === 'COMPLETED') return st === 'COMPLETED' || st === 'DELIVERED' || st === 'SUCCESS'
                      if (tab.id === 'CANCELLED') return st === 'CANCELLED' || st === 'CANCELED'
                      return false
                    }).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thông báo thao tác */}
        {cancelMessage && (
          <div className="shopee-cancel-alert">
            <CheckCircle2 size={16} />
            <span>{cancelMessage}</span>
          </div>
        )}

        {/* Danh sách các đơn hàng phong cách Shopee */}
        <div className="shopee-orders-list">
          {loading ? (
            <div className="shopee-orders-empty">
              <div className="shopee-spinner" />
              <p>Đang tải lịch sử đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="shopee-orders-empty">
              <ShoppingBag size={56} strokeWidth={1.2} />
              <h3>Chưa có đơn hàng nào</h3>
              <p>
                {searchTerm
                  ? 'Không tìm thấy đơn hàng nào phù hợp với từ khóa của bạn.'
                  : 'Hãy dạo xem cửa hàng và chọn cho mình những món đồ nội thất ấm cúng nhé!'}
              </p>
              <button
                type="button"
                className="shopee-shop-now-btn"
                onClick={() => {
                  onClose()
                  if (onOpenStore) onOpenStore()
                }}
              >
                Mua sắm ngay
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalItemsCount = order.items.reduce((s, it) => s + (it.quantity || 1), 0)
              const isPending = order.status === 'PENDING'
              const isCancelling = cancellingId === (order.id || order.orderNumber)

              return (
                <div className="shopee-order-card" key={order.orderNumber || order.id}>
                  {/* Header thẻ đơn Shopee */}
                  <div className="shopee-card-header">
                    <div className="shopee-card-shop-info">
                      <span className="shopee-mall-badge">Mall</span>
                      <strong className="shopee-shop-name">FuniStore Official Store</strong>
                      <span className="shopee-order-code-badge">
                        Mã đơn: <strong>{order.orderNumber}</strong>
                      </span>
                    </div>
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
                              src={item.image}
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
                            Phân loại hàng: {item.category}
                          </span>
                          <span className="shopee-item-qty">x{item.quantity}</span>
                          <div className="shopee-item-guarantee">
                            <ShieldCheck size={13} />
                            <span>Đổi trả miễn phí 7 ngày</span>
                          </div>
                        </div>
                        <div className="shopee-item-price-col">
                          <span className="shopee-item-price">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

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
                            Voucher {order.voucher_code ? `(${order.voucher_code})` : ''}: -{formatPrice(order.discount_amount || order.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="shopee-footer-total">
                        <span className="shopee-total-label">
                          Thành tiền ({totalItemsCount} sản phẩm):
                        </span>
                        <span className="shopee-total-amount">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thanh nút hành động Shopee */}
                  <div className="shopee-card-actions">
                    {isPending && (
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-cancel"
                        disabled={isCancelling}
                        onClick={() => handleCancelOrder(order)}
                      >
                        <X size={14} />
                        {isCancelling ? 'Đang hủy...' : 'Hủy Đơn Hàng'}
                      </button>
                    )}

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-detail"
                      onClick={() => {
                        if (onViewOrderDetail) {
                          onViewOrderDetail(order)
                        }
                        onClose()
                      }}
                    >
                      <Eye size={14} />
                      Xem Chi Tiết
                    </button>

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-reorder"
                      onClick={() => handleReorderClick(order)}
                    >
                      <RotateCcw size={14} />
                      Mua Lại
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
