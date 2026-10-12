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
} from 'lucide-react'
import { createOrder } from '../lib/orders'

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

  function handleClose() {
    if (window.location.pathname.includes('/order-success')) {
      window.history.pushState({}, '', window.location.origin + '/')
    }
    onClose?.()
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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    }

    setOrderSnapshot(currentOrderSnapshot)
    setStep(3)

    // Save to localStorage for reload persistence
    try {
      localStorage.setItem('nep_last_order', JSON.stringify(currentOrderSnapshot))
    } catch (e) {
      console.warn('Could not save order snapshot to localStorage', e)
    }

    // Update browser URL
    const orderUrl = `/order-success?id=${assignedOrderNumber}`
    window.history.pushState({ orderId: assignedOrderNumber }, '', orderUrl)

    onOrderSuccess?.(currentOrderSnapshot)
  }

  // SUCCESS SCREEN
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
    }

    const {
      orderNumber: activeOrderNumber,
      items = [],
      subtotal: activeSubtotal = 0,
      shippingFee: activeShippingFee = 0,
      total: activeTotal = 0,
      shippingInfo = {},
      paymentMethod = PAYMENT_METHOD,
      orderDate = '',
    } = currentOrder

    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

    return (
      <div className="order-page-layer" role="dialog" aria-modal="true" aria-label="Đặt hàng thành công">
        <div className="order-page-container order-success-container">
          <div className="order-success-content">
            <div className="order-success-icon-wrap">
              <CheckCircle2 size={54} strokeWidth={1.4} />
            </div>
            <p className="eyebrow" style={{ color: 'var(--coral)', marginBottom: 8, letterSpacing: '1px' }}>
              ĐẶT HÀNG THÀNH CÔNG
            </p>
            <h2 className="order-success-title">Cảm ơn bạn đã tin tưởng Nếp!</h2>
            <p className="order-success-desc">
              Đơn hàng <strong>{activeOrderNumber}</strong> {orderDate ? `(đặt lúc ${orderDate})` : ''} của bạn đã được ghi nhận.
              Chúng tôi sẽ liên hệ xác nhận qua số <strong>{shippingInfo.phone || form.phone}</strong> trong thời gian sớm nhất.
            </p>

            {/* 3 Thẻ tóm tắt thông tin */}
            <div className="order-success-info-grid">
              <div className="order-success-info-item">
                <MapPin size={16} strokeWidth={1.8} />
                <div>
                  <span>Giao đến</span>
                  <p>
                    <strong>{shippingInfo.fullName || form.fullName}</strong>
                    <br />
                    {shippingInfo.address || form.address}
                    {shippingInfo.ward ? `, ${shippingInfo.ward}` : ''}
                    {`, ${shippingInfo.district || form.district}, ${shippingInfo.city || form.city}`}
                  </p>
                </div>
              </div>
              <div className="order-success-info-item">
                <CreditCard size={16} strokeWidth={1.8} />
                <div>
                  <span>Thanh toán</span>
                  <p>
                    <strong>{paymentMethod.label || PAYMENT_METHOD.label}</strong>
                    <br />
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>Chuẩn bị tiền mặt khi nhận hàng</small>
                  </p>
                </div>
              </div>
              <div className="order-success-info-item">
                <Truck size={16} strokeWidth={1.8} />
                <div>
                  <span>Tổng đơn hàng</span>
                  <p>
                    <strong style={{ color: 'var(--forest)', fontSize: 14 }}>{formatPrice(activeTotal)}</strong>
                    <br />
                    <small style={{ color: '#2d6a4f', fontSize: 11, fontWeight: 600 }}>● Chờ xác nhận đơn</small>
                  </p>
                </div>
              </div>
            </div>

            {/* DANH SÁCH CHI TIẾT SẢN PHẨM ĐÃ ĐẶT */}
            <div className="order-success-details-box">
              <div className="order-success-details-header">
                <div className="order-success-details-title">
                  <Package size={17} strokeWidth={1.8} />
                  <span>Chi tiết sản phẩm đã đặt</span>
                </div>
                <span className="order-success-badge">{totalQty} món</span>
              </div>

              <div className="order-success-items-list">
                {items.length === 0 ? (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px 0', margin: 0 }}>
                    Không có thông tin sản phẩm
                  </p>
                ) : (
                  items.map((item) => (
                    <div className="order-success-item-card" key={item.id}>
                      <img className="order-success-item-image" src={item.image} alt={item.name} />
                      <div className="order-success-item-info">
                        <span className="order-success-item-cat">{item.category}</span>
                        <h4 className="order-success-item-name">{item.name}</h4>
                        <div className="order-success-item-meta">
                          <span className="order-success-item-price">{formatPrice(item.price)}</span>
                          <span className="order-success-item-qty">
                            Số lượng: <strong>×{item.quantity}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="order-success-item-subtotal">
                        <span className="order-success-subtotal-label">Thành tiền</span>
                        <strong>{formatPrice(item.lineTotal || item.price * item.quantity)}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* TỔNG KẾT CHI PHÍ */}
              <div className="order-success-summary-card">
                <div className="order-success-summary-row">
                  <span>Tạm tính tiền hàng:</span>
                  <span>{formatPrice(activeSubtotal)}</span>
                </div>
                <div className="order-success-summary-row">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {activeShippingFee === 0 ? (
                      <strong style={{ color: '#2d6a4f' }}>Miễn phí giao hàng</strong>
                    ) : (
                      formatPrice(activeShippingFee)
                    )}
                  </span>
                </div>
                <div className="order-success-summary-row order-success-summary-grand">
                  <span>Tổng thanh toán khi nhận hàng (COD):</span>
                  <strong>{formatPrice(activeTotal)}</strong>
                </div>
              </div>
            </div>

            {/* CÁC NÚT ĐIỀU HƯỚNG */}
            <div className="order-success-actions">
              <button className="order-success-home-btn" onClick={handleClose}>
                <Home size={16} />
                Về trang chủ
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
