import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Home,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
  X,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ShieldCheck,
  Store,
  XCircle,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { createOrder, saveOrderToLocalHistory, cancelOrderApi } from '../lib/orders'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

// Chỉ hỗ trợ COD
const PAYMENT_METHOD = {
  id: 'cod',
  label: 'Thanh toán khi nhận hàng (COD)',
  desc: 'Trả tiền mặt trực tiếp cho shipper khi nhận được hàng. Không cần thanh toán trước.',
}

const SHIPPING_FEE = 35000
const FREE_SHIP_THRESHOLD = 2000000

function StepIndicator({ step }) {
  const steps = [
    { id: 1, label: 'Thông tin giao hàng' },
    { id: 2, label: 'Thanh toán' },
    { id: 3, label: 'Xác nhận' },
  ]
  return (
    <div className="order-steps">
      {steps.map((s, i) => (
        <div key={s.id} className="order-step-wrapper">
          <div className={`order-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
            <span className="order-step-num">
              {step > s.id ? <CheckCircle2 size={14} /> : s.id}
            </span>
            <span className="order-step-label">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight size={13} className="order-step-sep" />}
        </div>
      ))}
    </div>
  )
}

function OrderSummary({ cartItems, cart, subtotal }) {
  const shippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee

  return (
    <aside className="order-summary-panel">
      <p className="eyebrow order-summary-eyebrow">ĐƠN HÀNG CỦA BẠN</p>
      <h3 className="order-summary-title">
        <ShoppingBag size={16} strokeWidth={1.7} />
        {cartItems.length} sản phẩm
      </h3>
      <div className="order-summary-items">
        {cartItems.map((product) => (
          <div className="order-summary-item" key={product.id}>
            <div className="order-item-img-wrap">
              <img src={product.image} alt={product.name} />
              <span className="order-item-qty">{cart[product.id]}</span>
            </div>
            <div className="order-item-detail">
              <span className="order-item-category">{product.category}</span>
              <p className="order-item-name">{product.name}</p>
              <strong className="order-item-price">
                {formatPrice(product.price * cart[product.id])}
              </strong>
            </div>
          </div>
        ))}
      </div>
      <div className="order-summary-totals">
        <div className="order-total-row">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="order-total-row">
          <span>Phí giao hàng</span>
          <span>
            {shippingFee === 0 ? (
              <span className="order-free-ship">Miễn phí</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>
        {shippingFee > 0 && (
          <p className="order-freeship-hint">
            Mua thêm {formatPrice(FREE_SHIP_THRESHOLD - subtotal)} để được miễn phí giao hàng
          </p>
        )}
        <div className="order-total-row order-grand-total">
          <span>Tổng cộng</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>
      <div className="order-trust-badges">
        <div className="order-trust-item">
          <Truck size={14} strokeWidth={1.6} />
          <span>Giao hàng toàn quốc</span>
        </div>
        <div className="order-trust-item">
          <Package size={14} strokeWidth={1.6} />
          <span>Đổi trả trong 7 ngày</span>
        </div>
      </div>
    </aside>
  )
}

export default function OrderReviewPage({
  cartItems,
  cart,
  subtotal,
  currentUser,
  onClose,
  onOrderSuccess,
  initialOrder = null,
  onReorder = null,
  onOpenMyOrders = null,
}) {
  const shippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee

  const [step, setStep] = useState(() => (initialOrder ? 3 : 1))
  const [orderSnapshot, setOrderSnapshot] = useState(initialOrder)
  const [orderNumber] = useState(
    () =>
      initialOrder?.orderNumber ||
      `NEP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  )

  const [form, setForm] = useState(() => ({
    fullName: initialOrder?.shippingInfo?.fullName || currentUser?.fullName || currentUser?.username || '',
    phone: initialOrder?.shippingInfo?.phone || currentUser?.phone || '',
    address: initialOrder?.shippingInfo?.address || '',
    ward: initialOrder?.shippingInfo?.ward || '',
    district: initialOrder?.shippingInfo?.district || '',
    city: initialOrder?.shippingInfo?.city || '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // State hỗ trợ Shopee tracking & actions
  const [copied, setCopied] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('')

  function handleClose() {
    if (window.location.pathname.includes('/order-success')) {
      window.history.pushState({}, '', window.location.origin + '/')
    }
    onClose?.()
  }

  function handleCopyCode(code) {
    if (!code) return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }).catch(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      })
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  async function handleCancelOrderClick(targetOrder) {
    const idToCancel = targetOrder.orderId || targetOrder.id || targetOrder.orderNumber
    const confirmCancel = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng ${targetOrder.orderNumber || ''} này không?`
    )
    if (!confirmCancel) return

    setIsCancelling(true)
    try {
      const res = await cancelOrderApi(idToCancel)
      if (res.success) {
        setCancelSuccessMsg('Đã hủy đơn hàng thành công theo yêu cầu của bạn.')
        setOrderSnapshot((prev) => ({
          ...(prev || {}),
          status: 'CANCELLED',
        }))
      } else {
        alert(res.error || 'Không thể hủy đơn hàng này vào lúc này.')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi hủy đơn.')
    } finally {
      setIsCancelling(false)
    }
  }

  function handleReorderClick(itemsToReorder) {
    if (onReorder) {
      onReorder(itemsToReorder)
    }
    handleClose()
  }

  useEffect(() => {
    function handlePopState() {
      if (!window.location.pathname.includes('/order-success') && step === 3) {
        onClose?.()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [step, onClose])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validateShipping() {
    const newErrors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên'
    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!/^(0|\+84)\d{8,10}$/.test(form.phone.trim()))
      newErrors.phone = 'Số điện thoại không hợp lệ'
    if (!form.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ'
    if (!form.district.trim()) newErrors.district = 'Vui lòng nhập quận/huyện'
    if (!form.city.trim()) newErrors.city = 'Vui lòng nhập tỉnh/thành phố'
    return newErrors
  }

  function handleNextStep() {
    if (step === 1) {
      const errs = validateShipping()
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
    }
    setStep((s) => s + 1)
  }

  async function handlePlaceOrder() {
    setSubmitting(true)
    setSubmitError('')

    const fee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
    const finalTotal = subtotal + fee

    // Chuẩn bị danh sách sản phẩm gửi lên backend
    const payloadItems = cartItems.map((p) => ({
      productId: Number(p.id),
      quantity: cart[p.id] || 1,
      unitPrice: p.price,
    }))

    // Gửi request tới backend Spring Boot để lưu vào Supabase PostgreSQL
    const { order: backendOrder, error: apiError } = await createOrder({
      customerId: currentUser?.customerId || null,
      userId: currentUser?.userId || null,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      ward: form.ward.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      totalAmount: finalTotal,
      items: payloadItems,
    })

    setSubmitting(false)

    if (apiError) {
      setSubmitError(apiError)
      return
    }

    const assignedOrderNumber = backendOrder?.orderCode || orderNumber

    const currentOrderSnapshot = {
      orderNumber: assignedOrderNumber,
      orderId: backendOrder?.orderId || null,
      id: backendOrder?.orderId || null,
      items: cartItems.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        quantity: cart[p.id] || 1,
        lineTotal: p.price * (cart[p.id] || 1),
      })),
      subtotal,
      shippingFee: fee,
      total: finalTotal,
      status: 'PENDING',
      shippingInfo: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        ward: form.ward.trim(),
        district: form.district.trim(),
        city: form.city.trim(),
      },
      paymentMethod: PAYMENT_METHOD,
      orderDate: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    }

    setOrderSnapshot(currentOrderSnapshot)
    setStep(3)

    // Lưu vào localStorage để hỗ trợ xem lại và refresh
    try {
      localStorage.setItem('nep_last_order', JSON.stringify(currentOrderSnapshot))
    } catch (e) {
      console.warn('Could not save order snapshot to localStorage', e)
    }

    // Lưu ngay vào danh sách Đơn mua của tôi (Shopee history)
    saveOrderToLocalHistory(currentOrderSnapshot)

    // Cập nhật browser URL
    const orderUrl = `/order-success?id=${assignedOrderNumber}`
    window.history.pushState({ orderId: assignedOrderNumber }, '', orderUrl)

    onOrderSuccess?.(currentOrderSnapshot)
  }

  // SHOPEE-STYLE ORDER REVIEW & TRACKING SCREEN (BƯỚC 3)
  if (step === 3) {
    const currentOrder = orderSnapshot || {
      orderNumber,
      items: cartItems.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        quantity: cart[p.id] || 1,
        lineTotal: p.price * (cart[p.id] || 1),
      })),
      subtotal,
      shippingFee,
      total,
      shippingInfo: form,
      paymentMethod: PAYMENT_METHOD,
      orderDate: new Date().toLocaleString('vi-VN'),
      status: 'PENDING',
    }

    const {
      orderNumber: activeOrderNumber = orderNumber,
      subtotal: activeSubtotal = 0,
      shippingFee: activeShippingFee = 0,
      total: activeTotal = 0,
      shippingInfo = {},
      paymentMethod = PAYMENT_METHOD,
      orderDate = '',
      status: rawStatus = 'PENDING',
    } = currentOrder

    // Chuẩn hóa danh sách sản phẩm dù đến từ backend hay snapshot
    const rawItems = currentOrder.items || []
    const items = rawItems.map((it) => ({
      id: it.id || it.product_id || it.productId,
      name: it.name || it.product_name || 'Sản phẩm Nếp Living',
      category: it.category || it.category_name || 'Nội thất gỗ tự nhiên',
      image: it.image || it.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      quantity: it.quantity || 1,
      price: Number(it.price || it.unit_price || 0),
      lineTotal: Number(it.lineTotal || it.amount || (Number(it.price || it.unit_price || 0) * (it.quantity || 1))),
    }))

    const orderStatus = (rawStatus || 'PENDING').toUpperCase()
    const isCancelled = orderStatus === 'CANCELLED'
    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

    return (
      <div className="order-page-layer" role="dialog" aria-modal="true" aria-label="Chi tiết đơn hàng Shopee">
        <div className="order-page-container shopee-tracking-page-container">
          {/* Header bar phong cách Shopee */}
          <div className="shopee-tracking-top-nav">
            <button className="shopee-tracking-back-btn" type="button" onClick={handleClose}>
              <ArrowLeft size={18} />
              <span>Trở về</span>
            </button>
            <div className="shopee-tracking-top-title">
              <span>CHI TIẾT ĐƠN HÀNG</span>
            </div>
            <button className="order-close-btn" type="button" onClick={handleClose} aria-label="Đóng">
              <X size={19} />
            </button>
          </div>

          <div className="shopee-tracking-scroll-body">
            {/* Banner trạng thái Shopee */}
            <div className={`shopee-tracking-status-banner ${isCancelled ? 'banner-cancelled' : 'banner-pending'}`}>
              <div className="shopee-status-banner-content">
                <div className="shopee-status-icon-wrap">
                  {isCancelled ? <XCircle size={36} /> : <CheckCircle2 size={36} />}
                </div>
                <div>
                  <h3>
                    {isCancelled
                      ? 'ĐƠN HÀNG ĐÃ HỦY'
                      : 'ĐƠN HÀNG ĐÃ ĐẶT THÀNH CÔNG'}
                  </h3>
                  <p>
                    {isCancelled
                      ? 'Đơn hàng này đã được hủy theo yêu cầu của quý khách.'
                      : 'Cảm ơn bạn đã tin tưởng Nếp Living. Đơn hàng đang được người bán chuẩn bị.'}
                  </p>
                </div>
              </div>
              {!isCancelled && (
                <div className="shopee-status-banner-badge">
                  <Truck size={16} />
                  <span>Dự kiến giao: 2 - 4 ngày tới</span>
                </div>
              )}
            </div>

            {/* Shopee Progress Stepper (Timeline 5 bước) */}
            {!isCancelled && (
              <div className="shopee-stepper-card">
                <div className="shopee-stepper-track">
                  {/* Step 1: Đã đặt */}
                  <div className="shopee-step-node completed">
                    <div className="shopee-step-circle">
                      <FileText size={16} />
                    </div>
                    <div className="shopee-step-info">
                      <span className="shopee-step-title">Đơn Hàng Đã Đặt</span>
                      <span className="shopee-step-time">{orderDate || 'Vừa xong'}</span>
                    </div>
                  </div>
                  <div className="shopee-step-line active" />

                  {/* Step 2: Chờ xác nhận */}
                  <div className={`shopee-step-node ${orderStatus !== 'PENDING' ? 'completed' : 'current'}`}>
                    <div className="shopee-step-circle">
                      <Clock size={16} />
                    </div>
                    <div className="shopee-step-info">
                      <span className="shopee-step-title">Chờ Xác Nhận</span>
                      <span className="shopee-step-time">Đang xử lý</span>
                    </div>
                  </div>
                  <div className={`shopee-step-line ${orderStatus === 'SHIPPING' || orderStatus === 'COMPLETED' ? 'active' : ''}`} />

                  {/* Step 3: Đóng gói */}
                  <div className={`shopee-step-node ${orderStatus === 'SHIPPING' || orderStatus === 'COMPLETED' ? 'completed' : ''}`}>
                    <div className="shopee-step-circle">
                      <Package size={16} />
                    </div>
                    <div className="shopee-step-info">
                      <span className="shopee-step-title">Chuẩn Bị Hàng</span>
                      <span className="shopee-step-time">Tại kho Nếp</span>
                    </div>
                  </div>
                  <div className={`shopee-step-line ${orderStatus === 'COMPLETED' ? 'active' : ''}`} />

                  {/* Step 4: Đang vận chuyển */}
                  <div className={`shopee-step-node ${orderStatus === 'COMPLETED' ? 'completed' : ''}`}>
                    <div className="shopee-step-circle">
                      <Truck size={16} />
                    </div>
                    <div className="shopee-step-info">
                      <span className="shopee-step-title">Đang Giao Hàng</span>
                      <span className="shopee-step-time">Nếp Express</span>
                    </div>
                  </div>
                  <div className={`shopee-step-line ${orderStatus === 'COMPLETED' ? 'active' : ''}`} />

                  {/* Step 5: Hoàn thành */}
                  <div className={`shopee-step-node ${orderStatus === 'COMPLETED' ? 'completed' : ''}`}>
                    <div className="shopee-step-circle">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="shopee-step-info">
                      <span className="shopee-step-title">Đã Nhận Hàng</span>
                      <span className="shopee-step-time">Đánh giá</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shopee Địa Chỉ Nhận Hàng (Card có sọc phong bì thư đặc trưng Shopee) */}
            <div className="shopee-address-box">
              <div className="shopee-address-envelope-stripe" />
              <div className="shopee-address-inner">
                <div className="shopee-address-header">
                  <MapPin size={18} className="shopee-pin-icon" />
                  <h4>Địa Chỉ Nhận Hàng</h4>
                </div>
                <div className="shopee-address-details">
                  <div className="shopee-recipient-name">
                    <strong>{shippingInfo.fullName || form.fullName || 'Khách hàng'}</strong>
                    <span className="shopee-recipient-phone">
                      ({shippingInfo.phone || form.phone || 'Chưa có SĐT'})
                    </span>
                  </div>
                  <p className="shopee-recipient-addr">
                    {shippingInfo.address || form.address}
                    {shippingInfo.ward ? `, ${shippingInfo.ward}` : ''}
                    {shippingInfo.district ? `, ${shippingInfo.district}` : (form.district ? `, ${form.district}` : '')}
                    {shippingInfo.city ? `, ${shippingInfo.city}` : (form.city ? `, ${form.city}` : '')}
                  </p>
                  <div className="shopee-delivery-provider">
                    <Truck size={14} />
                    <span>Phương thức vận chuyển: <strong>Nếp Express - Tiêu chuẩn</strong> (Đồng kiểm khi nhận hàng)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shopee Shop Card: Nếp Living Official Store */}
            <div className="shopee-detail-shop-card">
              <div className="shopee-card-header">
                <div className="shopee-card-shop-info">
                  <span className="shopee-mall-badge">Mall</span>
                  <strong className="shopee-shop-name">Nếp Living Official Store</strong>
                  <button
                    type="button"
                    className="shopee-view-shop-tag"
                    onClick={handleClose}
                  >
                    <Store size={13} />
                    <span>Xem Shop</span>
                  </button>
                </div>
                <div className="shopee-card-status-col">
                  <span className="shopee-chat-hint">Chăm sóc khách hàng 24/7</span>
                </div>
              </div>

              {/* Danh sách sản phẩm chi tiết */}
              <div className="shopee-card-items-wrap">
                {items.length === 0 ? (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                    Không có thông tin sản phẩm
                  </p>
                ) : (
                  items.map((item, idx) => (
                    <div className="shopee-item-row" key={`${item.id}-${idx}`}>
                      <div className="shopee-item-img-box">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="shopee-item-body">
                        <h4 className="shopee-item-title">{item.name}</h4>
                        <span className="shopee-item-variant">
                          Phân loại: {item.category || 'Nội thất gỗ sồi'}
                        </span>
                        <span className="shopee-item-qty">x{item.quantity || 1}</span>
                        <div className="shopee-item-guarantee">
                          <ShieldCheck size={13} />
                          <span>Đổi trả miễn phí 7 ngày</span>
                        </div>
                      </div>
                      <div className="shopee-item-price-col">
                        <span className="shopee-item-price">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shopee Chi Tiết Mã Đơn & Bảng Phân Tích Thanh Toán */}
            <div className="shopee-breakdown-card">
              <div className="shopee-breakdown-row">
                <span className="breakdown-label">Mã đơn hàng:</span>
                <div className="shopee-code-copy-group">
                  <strong className="shopee-order-code">{activeOrderNumber}</strong>
                  <button
                    type="button"
                    className="shopee-copy-code-btn"
                    onClick={() => handleCopyCode(activeOrderNumber)}
                    title="Sao chép mã đơn hàng"
                  >
                    {copied ? <Check size={13} color="#2b8a3e" /> : <Copy size={13} />}
                    <span>{copied ? 'Đã sao chép' : 'SAO CHÉP'}</span>
                  </button>
                </div>
              </div>

              <div className="shopee-breakdown-row">
                <span className="breakdown-label">Thời gian đặt hàng:</span>
                <span className="breakdown-value">{orderDate || 'Vừa xong'}</span>
              </div>

              <div className="shopee-breakdown-row">
                <span className="breakdown-label">Phương thức thanh toán:</span>
                <span className="breakdown-value">{paymentMethod.label || PAYMENT_METHOD.label}</span>
              </div>

              <div className="shopee-divider" />

              <div className="shopee-breakdown-row">
                <span className="breakdown-label">Tổng tiền hàng ({totalQty} món):</span>
                <span className="breakdown-value">{formatPrice(activeSubtotal)}</span>
              </div>

              <div className="shopee-breakdown-row">
                <span className="breakdown-label">Phí vận chuyển:</span>
                <span className="breakdown-value">
                  {activeShippingFee === 0 ? (
                    <span className="shopee-freeship-badge">Miễn phí vận chuyển</span>
                  ) : (
                    formatPrice(activeShippingFee)
                  )}
                </span>
              </div>

              {activeShippingFee === 0 && (
                <div className="shopee-breakdown-row">
                  <span className="breakdown-label">Giảm giá vận chuyển:</span>
                  <span className="breakdown-value text-green">-35.000₫</span>
                </div>
              )}

              <div className="shopee-breakdown-row shopee-breakdown-grand">
                <span className="breakdown-label-grand">Tổng số tiền:</span>
                <div className="shopee-grand-price-group">
                  <strong className="shopee-grand-price">{formatPrice(activeTotal)}</strong>
                  <small className="shopee-cod-note">Thanh toán khi nhận hàng (COD)</small>
                </div>
              </div>
            </div>

            {/* Thông báo hủy đơn */}
            {cancelSuccessMsg && (
              <div className="shopee-cancel-alert">
                <CheckCircle2 size={16} />
                <span>{cancelSuccessMsg}</span>
              </div>
            )}

            {/* Thanh Nút Thao Tác Shopee */}
            <div className="shopee-tracking-actions">
              {!isCancelled && orderStatus === 'PENDING' && (
                <button
                  type="button"
                  className="shopee-btn shopee-btn-cancel"
                  disabled={isCancelling}
                  onClick={() => handleCancelOrderClick(currentOrder)}
                >
                  <X size={15} />
                  <span>{isCancelling ? 'Đang hủy đơn...' : 'Hủy Đơn Hàng'}</span>
                </button>
              )}

              {onOpenMyOrders && (
                <button
                  type="button"
                  className="shopee-btn shopee-btn-myorders"
                  onClick={() => {
                    handleClose()
                    onOpenMyOrders()
                  }}
                >
                  <Package size={15} />
                  <span>Đơn Mua Của Tôi</span>
                </button>
              )}

              <button
                type="button"
                className="shopee-btn shopee-btn-reorder"
                onClick={() => handleReorderClick(items)}
              >
                <RotateCcw size={15} />
                <span>Mua Lại</span>
              </button>

              <button
                type="button"
                className="shopee-btn shopee-btn-home"
                onClick={handleClose}
              >
                <Home size={15} />
                <span>Về Trang Chủ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN ORDER PAGE
  return (
    <div
      className="order-page-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Xem và xác nhận đơn hàng"
    >
      <div className="order-page-container">
        <header className="order-page-header">
          <a className="wordmark order-wordmark" href="#top" aria-label="Nếp Living - Trang chủ">
            <span className="wordmark-symbol" aria-hidden="true">n.</span>
            <span>NẾP <em>LIVING</em></span>
          </a>
          <StepIndicator step={step} />
          <button
            className="order-close-btn"
            type="button"
            aria-label="Quay lại giỏ hàng"
            onClick={handleClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="order-page-body">
          <div className="order-form-area">
            {step === 1 && (
              <section className="order-form-section" aria-label="Thông tin giao hàng">
                <div className="order-section-heading">
                  <Truck size={18} strokeWidth={1.6} />
                  <div>
                    <p className="eyebrow">BƯỚC 1 / 2</p>
                    <h2>Thông tin giao hàng</h2>
                  </div>
                </div>

                <div className="order-form-grid">
                  <div className={`order-field order-field-full ${errors.fullName ? 'has-error' : ''}`}>
                    <label htmlFor="ord-fullName">
                      <User size={12} /> Họ và tên người nhận <i>*</i>
                    </label>
                    <input
                      id="ord-fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleFormChange}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                    />
                    {errors.fullName && <span className="order-field-error">{errors.fullName}</span>}
                  </div>

                  <div className={`order-field ${errors.phone ? 'has-error' : ''}`}>
                    <label htmlFor="ord-phone">
                      <Phone size={12} /> Số điện thoại <i>*</i>
                    </label>
                    <input
                      id="ord-phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="0901 234 567"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    {errors.phone && <span className="order-field-error">{errors.phone}</span>}
                  </div>

                  <div className={`order-field order-field-full ${errors.address ? 'has-error' : ''}`}>
                    <label htmlFor="ord-address">
                      <MapPin size={12} /> Địa chỉ (số nhà, tên đường) <i>*</i>
                    </label>
                    <input
                      id="ord-address"
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      placeholder="123 Nguyễn Thị Minh Khai"
                      autoComplete="street-address"
                    />
                    {errors.address && <span className="order-field-error">{errors.address}</span>}
                  </div>

                  <div className="order-field">
                    <label htmlFor="ord-ward">Phường / Xã</label>
                    <input
                      id="ord-ward"
                      name="ward"
                      value={form.ward}
                      onChange={handleFormChange}
                      placeholder="Phường Bến Nghé"
                    />
                  </div>

                  <div className={`order-field ${errors.district ? 'has-error' : ''}`}>
                    <label htmlFor="ord-district">
                      Quận / Huyện <i>*</i>
                    </label>
                    <input
                      id="ord-district"
                      name="district"
                      value={form.district}
                      onChange={handleFormChange}
                      placeholder="Quận 1"
                    />
                    {errors.district && <span className="order-field-error">{errors.district}</span>}
                  </div>

                  <div className={`order-field ${errors.city ? 'has-error' : ''}`}>
                    <label htmlFor="ord-city">
                      Tỉnh / Thành phố <i>*</i>
                    </label>
                    <input
                      id="ord-city"
                      name="city"
                      value={form.city}
                      onChange={handleFormChange}
                      placeholder="TP. Hồ Chí Minh"
                    />
                    {errors.city && <span className="order-field-error">{errors.city}</span>}
                  </div>

                </div>
              </section>
            )}

            {step === 2 && (
              <section className="order-form-section" aria-label="Phương thức thanh toán">
                <div className="order-section-heading">
                  <CreditCard size={18} strokeWidth={1.6} />
                  <div>
                    <p className="eyebrow">BƯỚC 2 / 2</p>
                    <h2>Phương thức thanh toán</h2>
                  </div>
                </div>

                <div className="order-payment-methods">
                  <div className="order-payment-option selected order-payment-cod-only">
                    <span className="order-payment-icon">
                      <Truck size={20} strokeWidth={1.7} />
                    </span>
                    <div className="order-payment-info">
                      <strong>{PAYMENT_METHOD.label}</strong>
                      <span>{PAYMENT_METHOD.desc}</span>
                    </div>
                    <span className="order-payment-check">
                      <CheckCircle2 size={18} />
                    </span>
                  </div>
                  <p className="order-cod-notice">
                    Hiện tại Nếp Living chỉ hỗ trợ thanh toán COD. Các phương thức khác sẽ sớm được bổ sung.
                  </p>
                </div>

                <div className="order-recap-card">
                  <div className="order-recap-heading">
                    <Truck size={14} strokeWidth={1.6} />
                    <span>Giao hàng đến</span>
                    <button
                      type="button"
                      className="order-recap-edit"
                      onClick={() => setStep(1)}
                    >
                      Sửa
                    </button>
                  </div>
                  <p className="order-recap-address">
                    <strong>{form.fullName}</strong> · {form.phone}
                  </p>
                  <p className="order-recap-address">
                    {[form.address, form.ward, form.district, form.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </section>
            )}

            {submitError && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  lineHeight: '1.5',
                }}
              >
                ⚠️ <strong>Lỗi đặt hàng:</strong> {submitError}
              </div>
            )}

            <div className="order-form-nav">
              {step > 1 ? (
                <button
                  type="button"
                  className="order-back-btn"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={submitting}
                >
                  <ArrowLeft size={15} /> Quay lại
                </button>
              ) : (
                <button type="button" className="order-back-btn" onClick={onClose} disabled={submitting}>
                  <ArrowLeft size={15} /> Giỏ hàng
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  className="order-next-btn"
                  onClick={handleNextStep}
                >
                  Tiếp theo <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className="order-place-btn"
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                >
                  <CheckCircle2 size={16} /> {submitting ? 'Đang lưu vào hệ thống...' : 'Đặt hàng ngay'}
                </button>
              )}
            </div>
          </div>

          <OrderSummary cartItems={cartItems} cart={cart} subtotal={subtotal} />
        </div>
      </div>
    </div>
  )
}
