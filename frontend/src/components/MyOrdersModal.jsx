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

export default function MyOrdersModal({
  isOpen,
  onClose,
  currentUser,
  onViewOrderDetail,
  onReorder,
  onOpenStore,
}) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelMessage, setCancelMessage] = useState('')

  // Tải danh sách đơn hàng từ Backend + LocalStorage
  const loadOrders = async () => {
    setLoading(true)
    try {
      const customerId = currentUser?.customerId || null
      const { orders: fetchedOrders } = await fetchOrders(customerId)
      
      // Đọc thêm từ localStorage nếu có đơn mới đặt
      let localOrders = []
      try {
        localOrders = JSON.parse(localStorage.getItem('nep_orders_history') || '[]')
      } catch (e) {}

      // Gộp và loại trừ trùng lặp
      const combined = [...(fetchedOrders || [])]
      for (const loc of localOrders) {
        const idKey = loc.orderNumber || loc.orderId || loc.id
        const exists = combined.some(
          (o) => (o.orderCode || o.orderNumber || o.orderId || o.id) === idKey
        )
        if (!exists) {
          combined.push(loc)
        }
      }

      // Chuẩn hóa cấu trúc từng đơn
      const normalized = combined.map((ord) => {
        const orderId = ord.orderId || ord.id
        const orderNumber =
          ord.orderCode ||
          ord.orderNumber ||
          `NEP-${new Date().getFullYear()}-${String(orderId || '000000').padStart(6, '0')}`
        
        const rawItems = ord.items || []
        const items = rawItems.map((it) => ({
          id: it.product_id || it.productId || it.id,
          name: it.product_name || it.name || 'Sản phẩm nội thất Nếp',
          category: it.category_name || it.category || 'Nội thất gia đình',
          image: it.image_url || it.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          quantity: it.quantity || 1,
          price: Number(it.unit_price || it.price || 0),
          lineTotal: Number(it.amount || it.lineTotal || (Number(it.unit_price || it.price || 0) * (it.quantity || 1))),
        }))

        const total = Number(ord.total_amount || ord.total || 0)
        const orderDate = ord.order_date || ord.orderDate || 'Vừa xong'
        const status = (ord.status || 'PENDING').toUpperCase()

        return {
          ...ord,
          id: orderId,
          orderId,
          orderNumber,
          items,
          total,
          orderDate,
          status,
          shippingInfo: ord.shippingInfo || {
            fullName: ord.full_name || currentUser?.fullName || '',
            phone: ord.phone || currentUser?.phone || '',
            address: ord.address || currentUser?.address || '',
          },
        }
      })

      // Sắp xếp đơn mới nhất lên đầu
      normalized.sort((a, b) => {
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
    if (isOpen) {
      loadOrders()
    }
  }, [isOpen, currentUser])

  // Lọc đơn hàng theo tab và từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Lọc theo Tab
      if (activeTab === 'PENDING' && ord.status !== 'PENDING') return false
      if (activeTab === 'SHIPPING' && ord.status !== 'SHIPPING' && ord.status !== 'PROCESSING') return false
      if (activeTab === 'COMPLETED' && ord.status !== 'COMPLETED' && ord.status !== 'DELIVERED') return false
      if (activeTab === 'CANCELLED' && ord.status !== 'CANCELLED') return false

      // Lọc theo từ khóa tìm kiếm (mã đơn hoặc tên sản phẩm)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchCode = (ord.orderNumber || '').toLowerCase().includes(query)
        const matchItem = ord.items.some((it) => (it.name || '').toLowerCase().includes(query))
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
                      if (tab.id === 'PENDING') return o.status === 'PENDING'
                      if (tab.id === 'SHIPPING') return o.status === 'SHIPPING' || o.status === 'PROCESSING'
                      if (tab.id === 'COMPLETED') return o.status === 'COMPLETED' || o.status === 'DELIVERED'
                      if (tab.id === 'CANCELLED') return o.status === 'CANCELLED'
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
                      <strong className="shopee-shop-name">Nếp Living Official Store</strong>
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
                          <img src={item.image} alt={item.name} />
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

                    <div className="shopee-footer-total">
                      <span className="shopee-total-label">
                        Thành tiền ({totalItemsCount} sản phẩm):
                      </span>
                      <span className="shopee-total-amount">
                        {formatPrice(order.total)}
                      </span>
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
