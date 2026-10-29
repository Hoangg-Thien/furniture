import { useEffect, useState, useMemo } from 'react'
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
  Tag,
  Sparkles,
  UserCheck,
  RefreshCw,
} from 'lucide-react'
import { createOrder, saveOrderToLocalHistory, cancelOrderApi, fetchOrderById } from '../lib/orders'
import { validateVoucherApi, fetchActiveVouchers } from '../lib/vouchers'
import { getAllProvinces, getDistricts, getWards } from '../lib/vietnamLocations'

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

function OrderSummary({
  cartItems,
  cart,
  subtotal,
  appliedVoucher,
  voucherInput,
  setVoucherInput,
  onApplyVoucher,
  onRemoveVoucher,
  onQuickApply,
  voucherError,
  voucherLoading,
  availableVouchers = [],
}) {
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0
  const shippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
  const total = Math.max(0, subtotal - discount + shippingFee)

  // Gợi ý voucher phù hợp (ưu tiên NEP500K nếu đơn >= 5tr hoặc voucher lớn nhất)
  const suggestedVoucher = useMemo(() => {
    if (appliedVoucher || !Array.isArray(availableVouchers) || availableVouchers.length === 0) return null
    if (subtotal >= 5000000) {
      const v500 = availableVouchers.find((v) => v.code === 'FUNI500K' || v.code === 'NEP500K')
      if (v500) return v500
    }
    const eligible = availableVouchers.filter((v) => Number(v.minimum_amount || 0) <= subtotal)
    if (eligible.length > 0) return eligible[0]
    return availableVouchers.find((v) => Number(v.minimum_amount || 0) > subtotal) || null
  }, [appliedVoucher, availableVouchers, subtotal])

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
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div
                className="order-item-fallback-icon"
                style={{ display: product.image ? 'none' : 'flex' }}
              >
                <Package size={16} />
              </div>
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

      {/* Khung Áp Dụng Voucher Khách Hàng */}
      <div className="order-summary-voucher-section">
        <div className="voucher-section-title">
          <Tag size={14} />
          <span>Mã giảm giá FuniStore</span>
        </div>

        <div className="voucher-input-action-row">
          <input
            type="text"
            className="voucher-code-input"
            placeholder="Nhập mã (VD: FUNI500K)..."
            value={voucherInput}
            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
            disabled={!!appliedVoucher || voucherLoading}
          />
          {appliedVoucher ? (
            <button
              type="button"
              className="voucher-btn voucher-btn--remove"
              onClick={onRemoveVoucher}
            >
              Hủy
            </button>
          ) : (
            <button
              type="button"
              className="voucher-btn voucher-btn--apply"
              disabled={voucherLoading || !voucherInput.trim()}
              onClick={onApplyVoucher}
            >
              {voucherLoading ? 'Kiểm tra...' : 'Áp dụng'}
            </button>
          )}
        </div>

        {voucherError && (
          <div className="voucher-msg-alert error">
            <AlertCircle size={13} />
            <span>{voucherError}</span>
          </div>
        )}

        {appliedVoucher && (
          <div className="voucher-msg-alert success">
            <CheckCircle2 size={13} />
            <span>
              Đã giảm <strong>{formatPrice(appliedVoucher.discountAmount)}</strong> ({appliedVoucher.code})
            </span>
          </div>
        )}

        {!appliedVoucher && suggestedVoucher && (
          <div className="voucher-suggest-box">
            <div className="suggest-info">
              <Sparkles size={13} className="suggest-sparkle" />
              <span>
                {Number(suggestedVoucher.minimum_amount || 0) <= subtotal ? (
                  <>Đủ điều kiện nhận mã <strong>{suggestedVoucher.code}</strong> (Giảm {suggestedVoucher.maximum_discount ? formatPrice(suggestedVoucher.maximum_discount) : `${suggestedVoucher.discount_percent}%`})</>
                ) : (
                  <>Gợi ý mã <strong>{suggestedVoucher.code}</strong>: Mua thêm {formatPrice(Number(suggestedVoucher.minimum_amount || 0) - subtotal)} để giảm {suggestedVoucher.maximum_discount ? formatPrice(suggestedVoucher.maximum_discount) : `${suggestedVoucher.discount_percent}%`}</>
                )}
              </span>
            </div>
            {Number(suggestedVoucher.minimum_amount || 0) <= subtotal && (
              <button
                type="button"
                className="suggest-apply-btn"
                onClick={() => onQuickApply(suggestedVoucher)}
              >
                Dùng ngay
              </button>
            )}
          </div>
        )}
      </div>

      <div className="order-summary-totals">
        <div className="order-total-row">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {appliedVoucher && (
          <div className="order-total-row order-discount-row">
            <span>Giảm giá Voucher ({appliedVoucher.code})</span>
            <span className="order-discount-text">-{formatPrice(appliedVoucher.discountAmount)}</span>
          </div>
        )}
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
  catalogProducts = [],
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
  const [liveStatus, setLiveStatus] = useState(initialOrder?.status || 'PENDING')
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)

  // Đồng bộ khi initialOrder thay đổi từ component cha (App.jsx fetch live order)
  useEffect(() => {
    if (initialOrder) {
      setOrderSnapshot(initialOrder)
      setStep(3)
      if (initialOrder.status) setLiveStatus(initialOrder.status)
    }
  }, [initialOrder])

  // Cập nhật liveStatus khi orderSnapshot thay đổi
  useEffect(() => {
    if (orderSnapshot?.status) {
      setLiveStatus(orderSnapshot.status)
    }
  }, [orderSnapshot?.status])

  // Hàm tự động gọi backend lấy trạng thái duyệt đơn mới nhất
  const handleRefreshStatus = async () => {
    const orderKey = orderSnapshot?.orderNumber || orderSnapshot?.id || initialOrder?.orderNumber || initialOrder?.id
    if (!orderKey) return
    setIsRefreshingStatus(true)
    try {
      const { order, error } = await fetchOrderById(orderKey)
      if (order && !error && order.status) {
        setLiveStatus(order.status)
        setOrderSnapshot((prev) => ({
          ...(prev || {}),
          status: order.status,
          total_amount: order.total_amount ?? prev?.total_amount,
        }))
      }
    } catch (e) {
      console.warn('Lỗi làm mới trạng thái đơn hàng:', e)
    } finally {
      setIsRefreshingStatus(false)
    }
  }

  // Tự động kiểm tra và cập nhật trạng thái liên tục theo thời gian thực (Polling mỗi 3.5s)
  useEffect(() => {
    if (step !== 3) return
    const orderKey = orderSnapshot?.orderNumber || orderSnapshot?.id || initialOrder?.orderNumber || initialOrder?.id
    if (!orderKey) return

    // Kiểm tra ngay lập tức
    handleRefreshStatus()

    // Cập nhật liên tục mỗi 3.5 giây để nhận ngay trạng thái Duyệt từ Admin mà không cần tải lại trang
    const interval = setInterval(() => {
      handleRefreshStatus()
    }, 3500)

    return () => clearInterval(interval)
  }, [step, orderSnapshot?.orderNumber, orderSnapshot?.id, initialOrder?.orderNumber, initialOrder?.id])

  const [orderNumber] = useState(
    () =>
      initialOrder?.orderNumber ||
      `FUNI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  )

  const [useDefaultAccountInfo, setUseDefaultAccountInfo] = useState(() => {
    return Boolean(currentUser && (currentUser.fullName || currentUser.phone || currentUser.address))
  })

  const [form, setForm] = useState(() => {
    const defaultCity = initialOrder?.shippingInfo?.city || (currentUser?.address?.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh')
    return {
      fullName: initialOrder?.shippingInfo?.fullName || currentUser?.fullName || currentUser?.username || '',
      phone: initialOrder?.shippingInfo?.phone || currentUser?.phone || '',
      address: initialOrder?.shippingInfo?.address || currentUser?.address || '',
      ward: initialOrder?.shippingInfo?.ward || '',
      district: initialOrder?.shippingInfo?.district || '',
      city: defaultCity,
    }
  })

  const provinces = useMemo(() => getAllProvinces(), [])
  const districts = useMemo(() => getDistricts(form.city), [form.city])
  const wards = useMemo(() => getWards(form.city, form.district), [form.city, form.district])

  function handleCitySelect(e) {
    const selectedCity = e.target.value
    setForm((prev) => ({
      ...prev,
      city: selectedCity,
      district: '',
      ward: '',
    }))
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }))
  }

  function handleDistrictSelect(e) {
    const selectedDistrict = e.target.value
    setForm((prev) => ({
      ...prev,
      district: selectedDistrict,
      ward: '',
    }))
    if (errors.district) setErrors((prev) => ({ ...prev, district: '' }))
  }

  function handleWardSelect(e) {
    const selectedWard = e.target.value
    setForm((prev) => ({
      ...prev,
      ward: selectedWard,
    }))
  }

  function handleToggleDefaultInfo(checked) {
    setUseDefaultAccountInfo(checked)
    if (checked && currentUser) {
      setForm((prev) => ({
        ...prev,
        fullName: currentUser.fullName || currentUser.username || prev.fullName,
        phone: currentUser.phone || prev.phone,
        address: currentUser.address || prev.address,
      }))
    }
  }
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // State hỗ trợ Shopee tracking & actions
  const [copied, setCopied] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('')

  // State quản lý Voucher áp dụng cho đơn hàng
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherInput, setVoucherInput] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [availableVouchers, setAvailableVouchers] = useState([])

  // Tải danh sách voucher đang hoạt động từ backend
  useEffect(() => {
    let isMounted = true
    async function loadVouchers() {
      try {
        const res = await fetchActiveVouchers()
        const list = res?.vouchers || (Array.isArray(res) ? res : [])
        if (isMounted) {
          setAvailableVouchers(list)
        }
      } catch (err) {
        console.error('Failed to load active vouchers', err)
      }
    }
    loadVouchers()
    return () => {
      isMounted = false
    }
  }, [])

  // Xử lý áp dụng voucher
  async function handleApplyVoucher(codeToApply) {
    const code = (typeof codeToApply === 'string' ? codeToApply : voucherInput).trim().toUpperCase()
    if (!code) {
      setVoucherError('Vui lòng nhập mã voucher')
      return
    }
    setVoucherLoading(true)
    setVoucherError('')
    try {
      const res = await validateVoucherApi({ code, subtotal })
      if (!res.valid) {
        setVoucherError(res.error || 'Mã giảm giá không hợp lệ')
        setAppliedVoucher(null)
      } else {
        setAppliedVoucher({
          id: res.voucherId,
          code: res.code || code,
          discountAmount: res.discountAmount,
          programName: res.programName,
        })
        setVoucherInput(res.code || code)
        setVoucherError('')
      }
    } catch (err) {
      setVoucherError('Lỗi kiểm tra voucher, vui lòng thử lại.')
    } finally {
      setVoucherLoading(false)
    }
  }

  // Xử lý gỡ voucher
  function handleRemoveVoucher() {
    setAppliedVoucher(null)
    setVoucherInput('')
    setVoucherError('')
  }

  // Áp dụng nhanh từ gợi ý
  function handleQuickApply(voucher) {
    if (!voucher) return
    handleApplyVoucher(voucher.code)
  }

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
    else if (!/^(0|\+84)\d{8,10}$/.test(form.phone.trim().replace(/\s+/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ'
    if (!form.city.trim()) newErrors.city = 'Vui lòng chọn tỉnh/thành phố'
    if (!form.district.trim()) newErrors.district = 'Vui lòng chọn quận/huyện'
    if (!form.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ'
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

    const discountAmount = appliedVoucher ? Number(appliedVoucher.discountAmount || 0) : 0
    const fee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
    const finalTotal = Math.max(0, subtotal - discountAmount + fee)

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
      voucherId: appliedVoucher?.id || null,
      discountAmount: discountAmount,
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
      discountAmount,
      appliedVoucher: appliedVoucher ? {
        id: appliedVoucher.id,
        code: appliedVoucher.code,
        discountAmount: appliedVoucher.discountAmount,
        programName: appliedVoucher.programName,
      } : null,
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
      localStorage.setItem('funi_last_order', JSON.stringify(currentOrderSnapshot));
      localStorage.setItem('nep_last_order', JSON.stringify(currentOrderSnapshot));
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

  // TRANG CẢM ƠN BẠN ĐÃ MUA HÀNG & THÔNG TIN ĐƠN HÀNG (BƯỚC 3)
  if (step === 3) {
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

    const resolveProductImg = (it) => {
      if (!it) return ''

      // 1. Ưu tiên lấy trực tiếp URL từ database hoặc cart (hỗ trợ cả link /images/... lẫn link http)
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

      // 2. Tra cứu từ danh mục sản phẩm của giao diện chính (catalog)
      const pId = it.id || it.product_id || it.productId
      if (pId && Array.isArray(catalogProducts)) {
        const found = catalogProducts.find((p) => String(p.id) === String(pId))
        if (found?.image) return found.image
      }

      // 3. Tra cứu theo tên trong catalog
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

      // 5. Fallback dự phòng
      if (pId && PRODUCT_IMAGES[pId]) return PRODUCT_IMAGES[pId]
      return ''
    }

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

    const rawItems = currentOrder.items || []
    const items = rawItems.map((it) => ({
      id: it.id || it.product_id || it.productId,
      name: it.name || it.product_name || 'Sản phẩm FuniStore',
      category: it.category || it.category_name || 'Nội thất gỗ tự nhiên',
      image: resolveProductImg(it),
      quantity: it.quantity || 1,
      price: Number(it.price || it.unit_price || 0),
      lineTotal: Number(it.lineTotal || it.amount || (Number(it.price || it.unit_price || 0) * (it.quantity || 1))),
    }))

    const itemsCalculatedSubtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
    const activeSubtotal = currentOrder.subtotal != null && currentOrder.subtotal > 0
      ? currentOrder.subtotal
      : (itemsCalculatedSubtotal > 0 ? itemsCalculatedSubtotal : Number(currentOrder.total_amount || currentOrder.total || 0))

    const activeDiscountAmount = Number(
      currentOrder.discount_amount ??
      (currentOrder.discountAmount ??
      (currentOrder.appliedVoucher?.discountAmount ?? (appliedVoucher?.discountAmount || 0)))
    )

    const activeVoucherCode =
      currentOrder.voucher_code ||
      currentOrder.voucherCode ||
      currentOrder.appliedVoucher?.code ||
      appliedVoucher?.code ||
      ''

    const activeShippingFee = currentOrder.shippingFee !== undefined
      ? currentOrder.shippingFee
      : (activeSubtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE)

    const activeTotal = Number(
      currentOrder.total_amount ??
      (currentOrder.total ?? Math.max(0, activeSubtotal - activeDiscountAmount + activeShippingFee))
    )

    const {
      orderNumber: activeOrderNumber = orderNumber,
      shippingInfo = {},
      paymentMethod = PAYMENT_METHOD,
      orderDate = '',
      status: rawStatus = 'PENDING',
    } = currentOrder

    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

    const activeStatus = (liveStatus || rawStatus || 'PENDING').toUpperCase()

    const statusConfig = {
      CONFIRMED: {
        badgeClass: 'status-pill-confirmed',
        icon: <UserCheck size={15} strokeWidth={2.2} />,
        label: 'ĐÃ ĐƯỢC DUYỆT • ĐANG CHUẨN BỊ HÀNG',
        title: 'Đơn hàng của bạn đã được duyệt!',
        subtitle: 'FuniStore đã duyệt đơn hàng thành công. Bộ phận kho đang đóng gói cẩn thận và chuẩn bị bàn giao cho đơn vị vận chuyển.',
        circleClass: 'circle-confirmed',
      },
      SHIPPING: {
        badgeClass: 'status-pill-shipping',
        icon: <Truck size={15} strokeWidth={2.2} />,
        label: 'ĐANG VẬN CHUYỂN',
        title: 'Đơn hàng đang trên đường giao!',
        subtitle: 'Kiện hàng của bạn đang được vận chuyển. Vui lòng giữ liên lạc điện thoại để nhận hàng nhanh nhất.',
        circleClass: 'circle-shipping',
      },
      COMPLETED: {
        badgeClass: 'status-pill-completed',
        icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
        label: 'GIAO HÀNG THÀNH CÔNG',
        title: 'Đơn hàng hoàn tất thành công!',
        subtitle: 'Cảm ơn bạn đã lựa chọn FuniStore. Chúc bạn có không gian sống ấm cúng và an yên cùng sản phẩm mới!',
        circleClass: 'circle-completed',
      },
      CANCELLED: {
        badgeClass: 'status-pill-cancelled',
        icon: <XCircle size={15} strokeWidth={2.2} />,
        label: 'ĐƠN HÀNG ĐÃ BỊ HỦY',
        title: 'Đơn hàng đã được hủy',
        subtitle: 'Đơn hàng này hiện ở trạng thái Đã Hủy. Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ hotline 1900 6868.',
        circleClass: 'circle-cancelled',
      },
      PENDING: {
        badgeClass: 'status-pill-pending',
        icon: <Clock size={15} strokeWidth={2.2} />,
        label: 'CHỜ TIẾP NHẬN & DUYỆT ĐƠN',
        title: 'Cảm ơn bạn đã mua hàng!',
        subtitle: 'Đơn hàng của bạn đã được ghi nhận thành công. FuniStore sẽ sớm liên hệ xác nhận và duyệt đơn hàng.',
        circleClass: 'circle-pending',
      },
    }

    const currentStatusConfig = statusConfig[activeStatus] || statusConfig.PENDING

    return (
      <div className="order-page-layer" role="dialog" aria-modal="true" aria-label="Xác nhận đơn hàng thành công">
        <div className="order-page-container order-success-modern-container">
          {/* Header thanh thoát */}
          <header className="order-success-top-header">
            <a
              className="wordmark order-wordmark"
              href="#top"
              aria-label="FuniStore - Trang chủ"
              onClick={(e) => {
                e.preventDefault()
                handleClose()
              }}
            >
              <span className="wordmark-symbol" aria-hidden="true">f.</span>
            <span>FUNI <em>STORE</em></span>
            </a>
            <button className="order-close-btn" type="button" onClick={handleClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </header>

          <div className="order-success-scroll-content">
            {/* Hero Cảm Ơn FuniStore */}
            <div className="order-thankyou-hero">
              <div className={`order-thankyou-icon-circle ${currentStatusConfig.circleClass}`}>
                {activeStatus === 'CANCELLED' ? (
                  <XCircle size={46} strokeWidth={2.2} />
                ) : activeStatus === 'CONFIRMED' ? (
                  <UserCheck size={44} strokeWidth={2.2} />
                ) : activeStatus === 'SHIPPING' ? (
                  <Truck size={42} strokeWidth={2.2} />
                ) : (
                  <CheckCircle2 size={46} strokeWidth={2.2} />
                )}
              </div>

              {/* Status Badge */}
              <div className={`order-live-status-pill ${currentStatusConfig.badgeClass}`}>
                {currentStatusConfig.icon}
                <span>{currentStatusConfig.label}</span>
              </div>

              <h1 className="order-thankyou-title">{currentStatusConfig.title}</h1>
              <p className="order-thankyou-subtitle">
                {currentStatusConfig.subtitle}
              </p>

              <div className="order-thankyou-code-pill">
                <span className="code-label">MÃ ĐƠN HÀNG</span>
                <strong className="code-value">{activeOrderNumber}</strong>
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={() => handleCopyCode(activeOrderNumber)}
                  title="Sao chép mã đơn hàng"
                >
                  {copied ? <Check size={13} color="#2b8a3e" /> : <Copy size={13} />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshingStatus}
                  title="Kiểm tra trạng thái duyệt đơn mới nhất từ máy chủ"
                >
                  <RefreshCw size={13} className={isRefreshingStatus ? 'spin-anim' : ''} />
                  <span>{isRefreshingStatus ? 'Đang kiểm tra...' : 'Cập nhật trạng thái'}</span>
                </button>
              </div>
            </div>

            {/* Layout 2 cột sang trọng */}
            <div className="order-success-grid-layout">
              {/* CỘT TRÁI: Danh sách sản phẩm & Tổng tiền */}
              <div className="order-success-card items-card">
                <div className="card-heading-row">
                  <Package size={18} className="card-heading-icon" />
                  <h3>Chi tiết sản phẩm ({totalQty} món)</h3>
                </div>

                <div className="order-success-items-list">
                  {items.map((item, idx) => (
                    <div className="order-success-item-row" key={`${item.id}-${idx}`}>
                      <div className="order-success-item-thumb">
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
                          className="order-item-fallback-icon"
                          style={{ display: item.image ? 'none' : 'flex' }}
                        >
                          <Package size={20} />
                        </div>
                        <span className="order-success-item-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="order-success-item-info">
                        <h4 className="item-title">{item.name}</h4>
                        <span className="item-category">{item.category}</span>
                        <div className="item-unit-calc">
                          <span>{formatPrice(item.price)} × {item.quantity}</span>
                        </div>
                      </div>
                      <div className="order-success-item-total">
                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bảng phân tích thanh toán */}
                <div className="order-success-payment-breakdown">
                  <div className="breakdown-line">
                    <span>Tạm tính</span>
                    <span>{formatPrice(activeSubtotal)}</span>
                  </div>
                  {activeDiscountAmount > 0 && (
                    <div className="breakdown-line discount-line">
                      <span className="order-success-voucher-label">
                        <Tag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Giảm giá voucher {activeVoucherCode ? `(${activeVoucherCode})` : ''}
                      </span>
                      <strong className="order-success-voucher-discount">
                        -{formatPrice(activeDiscountAmount)}
                      </strong>
                    </div>
                  )}
                  <div className="breakdown-line">
                    <span>Phí giao hàng</span>
                    <span>
                      {activeShippingFee === 0 ? (
                        <span className="free-shipping-tag">Miễn phí giao hàng</span>
                      ) : (
                        formatPrice(activeShippingFee)
                      )}
                    </span>
                  </div>
                  <div className="breakdown-divider" />
                  <div className="breakdown-line grand-total-line">
                    <span>Tổng thanh toán</span>
                    <strong>{formatPrice(activeTotal)}</strong>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: Thông tin nhận hàng & Thanh toán */}
              <div className="order-success-card-column">
                {/* Thông tin người nhận */}
                <div className="order-success-card info-card">
                  <div className="card-heading-row">
                    <MapPin size={18} className="card-heading-icon" />
                    <h3>Thông tin nhận hàng</h3>
                  </div>

                  <div className="order-info-details-box">
                    <div className="info-detail-row">
                      <span className="info-label">Người nhận:</span>
                      <strong className="info-val">{shippingInfo.fullName || form.fullName || 'Khách hàng'}</strong>
                    </div>
                    <div className="info-detail-row">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-val">{shippingInfo.phone || form.phone || '(Chưa cập nhật)'}</span>
                    </div>
                    <div className="info-detail-row">
                      <span className="info-label">Địa chỉ:</span>
                      <span className="info-val address-text">
                        {shippingInfo.address || form.address}
                        {shippingInfo.ward ? `, ${shippingInfo.ward}` : ''}
                        {shippingInfo.district ? `, ${shippingInfo.district}` : (form.district ? `, ${form.district}` : '')}
                        {shippingInfo.city ? `, ${shippingInfo.city}` : (form.city ? `, ${form.city}` : '')}
                      </span>
                    </div>
                    <div className="info-detail-row">
                      <span className="info-label">Thời gian giao:</span>
                      <span className="info-val green-text">Dự kiến 2 - 4 ngày làm việc</span>
                    </div>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="order-success-card info-card">
                  <div className="card-heading-row">
                    <CreditCard size={18} className="card-heading-icon" />
                    <h3>Phương thức thanh toán</h3>
                  </div>

                  <div className="payment-method-box">
                    <div className="payment-method-badge">
                      <ShieldCheck size={16} />
                      <strong>Thanh toán khi nhận hàng (COD)</strong>
                    </div>
                    <p className="payment-method-desc">
                      Bạn thanh toán tiền mặt trực tiếp cho nhân viên giao hàng sau khi nhận và kiểm tra kiện hàng.
                    </p>
                  </div>
                </div>

                {/* Cam kết của Nếp */}
                <div className="order-nep-guarantee-box">
                  <div className="guarantee-item">
                    <Truck size={15} />
                    <span>Đồng kiểm cùng shipper khi nhận hàng</span>
                  </div>
                  <div className="guarantee-item">
                    <ShieldCheck size={15} />
                    <span>Đổi trả miễn phí trong 7 ngày nếu lỗi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Các nút hành động chính ở chân trang */}
            <div className="order-success-bottom-actions">
              {onOpenMyOrders && (
                <button
                  type="button"
                  className="order-btn-view-history"
                  onClick={() => {
                    handleClose()
                    onOpenMyOrders()
                  }}
                >
                  <Package size={16} />
                  <span>Xem lịch sử đơn mua</span>
                </button>
              )}
              <button
                type="button"
                className="order-btn-continue-shopping"
                onClick={handleClose}
              >
                <span>Tiếp tục mua sắm</span>
                <ArrowRight size={17} />
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
          <a
            className="wordmark order-wordmark"
            href="#top"
            aria-label="FuniStore - Trang chủ"
            onClick={(e) => {
              e.preventDefault()
              handleClose()
            }}
          >
            <span className="wordmark-symbol" aria-hidden="true">f.</span>
            <span>FUNI <em>STORE</em></span>
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

                {currentUser && (
                  <div className="order-use-default-box">
                    <label className="order-use-default-label">
                      <input
                        type="checkbox"
                        checked={useDefaultAccountInfo}
                        onChange={(e) => handleToggleDefaultInfo(e.target.checked)}
                      />
                      <div className="order-use-default-info">
                        <span className="order-use-default-title">
                          Lấy thông tin mặc định đã nhập trong tài khoản
                        </span>
                        <span className="order-use-default-hint">
                          Tự động điền họ tên ({currentUser.fullName || currentUser.username}), SĐT ({currentUser.phone || "Chưa cập nhật"}) và địa chỉ
                        </span>
                      </div>
                    </label>
                  </div>
                )}

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

                  <div className={`order-field ${errors.city ? 'has-error' : ''}`}>
                    <label htmlFor="ord-city">
                      <MapPin size={12} /> Tỉnh / Thành phố <i>*</i>
                    </label>
                    <div className="order-select-wrapper">
                      <select
                        id="ord-city"
                        name="city"
                        value={form.city}
                        onChange={handleCitySelect}
                        className="order-select"
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        {form.city && !provinces.includes(form.city) && (
                          <option value={form.city}>{form.city}</option>
                        )}
                        {provinces.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.city && <span className="order-field-error">{errors.city}</span>}
                  </div>

                  <div className={`order-field ${errors.district ? 'has-error' : ''}`}>
                    <label htmlFor="ord-district">
                      Quận / Huyện <i>*</i>
                    </label>
                    <div className="order-select-wrapper">
                      <select
                        id="ord-district"
                        name="district"
                        value={form.district}
                        onChange={handleDistrictSelect}
                        disabled={!form.city}
                        className="order-select"
                      >
                        <option value="">
                          {form.city ? "-- Chọn Quận / Huyện --" : "-- Chọn Tỉnh/TP trước --"}
                        </option>
                        {form.district && !districts.includes(form.district) && (
                          <option value={form.district}>{form.district}</option>
                        )}
                        {districts.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.district && <span className="order-field-error">{errors.district}</span>}
                  </div>

                  <div className="order-field">
                    <label htmlFor="ord-ward">Phường / Xã</label>
                    <div className="order-select-wrapper">
                      <select
                        id="ord-ward"
                        name="ward"
                        value={form.ward}
                        onChange={handleWardSelect}
                        disabled={!form.district}
                        className="order-select"
                      >
                        <option value="">
                          {form.district ? "-- Chọn Phường / Xã --" : "-- Chọn Quận/Huyện trước --"}
                        </option>
                        {form.ward && !wards.includes(form.ward) && (
                          <option value={form.ward}>{form.ward}</option>
                        )}
                        {wards.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`order-field order-field-full ${errors.address ? 'has-error' : ''}`}>
                    <label htmlFor="ord-address">
                      <MapPin size={12} /> Địa chỉ chi tiết (số nhà, tên đường) <i>*</i>
                    </label>
                    <input
                      id="ord-address"
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      placeholder="VD: 123 Nguyễn Thị Minh Khai, Tòa nhà Bitexco..."
                      autoComplete="street-address"
                    />
                    {errors.address && <span className="order-field-error">{errors.address}</span>}
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
                    Hiện tại FuniStore chỉ hỗ trợ thanh toán COD. Các phương thức khác sẽ sớm được bổ sung.
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

          <OrderSummary
            cartItems={cartItems}
            cart={cart}
            subtotal={subtotal}
            appliedVoucher={appliedVoucher}
            voucherInput={voucherInput}
            setVoucherInput={setVoucherInput}
            onApplyVoucher={handleApplyVoucher}
            onRemoveVoucher={handleRemoveVoucher}
            onQuickApply={handleQuickApply}
            voucherError={voucherError}
            voucherLoading={voucherLoading}
            availableVouchers={availableVouchers}
          />
        </div>
      </div>
    </div>
  )
}
