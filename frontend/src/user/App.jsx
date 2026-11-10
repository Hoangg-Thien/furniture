import { useEffect, useRef, useState, useMemo } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  Filter,
  Heart,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Upload,
  User,
  X,
} from 'lucide-react'
import { loadProducts } from '../lib/products'
import { loadCart, saveCart } from './lib/cart'
import { isCheckoutPath } from './lib/checkout'
import { fetchOrderById, getLocalOrders } from '../lib/orders'
import {
  getCurrentUser,
  logoutUser,
  updateProfile,
  getCurrentAdminUser,
  logoutAdminUser,
} from '../lib/auth'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import AccountModal from './components/AccountModal'
import OrderReviewPage from './components/OrderReviewPage'
import MyOrdersPage from './components/MyOrdersPage'
import NotificationsMenu from './components/NotificationsMenu'
import VouchersModal from './components/VouchersModal'
import AdminLayout from '../admin/AdminLayout'
import AdminLoginPage from '../admin/AdminLoginPage'
import NotFoundPage from './components/NotFoundPage'
import './App.css'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

function App() {
  // Hệ thống định tuyến:
  // - '/orders' => lịch sử đơn hàng; '/', '/checkout', '/order-success' => cửa hàng và đặt hàng
  // - '/admin' hoặc bất kỳ trang con nào bắt đầu bằng '/admin' => 'admin' (Trang quản trị Admin)
  // - Bất kỳ đường dẫn lạ nào khác (như /1321, /abc) => '404' (Trang Không tìm thấy)
  function getCurrentRoute() {
    if (typeof window === 'undefined') return 'store'
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
    if (path === '/orders') return 'orders'
    if (path === '' || path === '/' || isCheckoutPath(path) || path.startsWith('/order-success')) return 'store'
    if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
    return '404'
  }

  const [currentRoute, setCurrentRoute] = useState(() => getCurrentRoute())

  function handleBackToStore() {
    window.history.pushState(null, '', '/')
    setCurrentRoute('store')
  }

  useEffect(() => {
    function handleLocationChange() {
      setCurrentRoute(getCurrentRoute())
    }
    // Xóa hash sót lại nếu có
    if (window.location.hash.toLowerCase().includes('admin')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const [products, setProducts] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  // Bộ lọc giá và sắp xếp sản phẩm
  const PRICE_PRESETS = [
    { id: 'ALL', label: 'Tất cả mức giá', min: null, max: null },
    { id: 'OVER_1M', label: 'Trên 1 triệu', min: 1000000, max: null, minExclusive: true },
    { id: 'OVER_2M', label: 'Trên 2 triệu', min: 2000000, max: null, minExclusive: true },
    { id: 'OVER_5M', label: 'Trên 5 triệu', min: 5000000, max: null, minExclusive: true },
    { id: 'UNDER_2M', label: 'Dưới 2 triệu', min: 0, max: 2000000 },
    { id: '2M_5M', label: '2 - 5 triệu', min: 2000000, max: 5000000 },
    { id: '5M_10M', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
    { id: 'OVER_10M', label: 'Trên 10 triệu', min: 10000000, max: null, minExclusive: true },
  ]
  const [pricePreset, setPricePreset] = useState('ALL')
  const [customMin, setCustomMin] = useState('')
  const [customMax, setCustomMax] = useState('')
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: null, max: null })
  const [sortOrder, setSortOrder] = useState('DEFAULT')

  function handleSelectPricePreset(preset) {
    setPricePreset(preset.id)
    setAppliedPriceRange({ min: preset.min, max: preset.max, minExclusive: preset.minExclusive ?? false })
    if (preset.id !== 'CUSTOM') {
      setCustomMin('')
      setCustomMax('')
    }
  }

  function handleApplyCustomPrice(e) {
    if (e) e.preventDefault()
    const minVal = customMin === '' ? null : Number(customMin)
    const maxVal = customMax === '' ? null : Number(customMax)
    if ([minVal, maxVal].some((value) => value != null && (!Number.isFinite(value) || value < 0))) {
      setNotice('Vui lòng nhập mức giá hợp lệ, không âm.')
      setTimeout(() => setNotice(''), 3000)
      return
    }
    if (minVal != null && maxVal != null && minVal > maxVal) {
      setNotice('Giá tối thiểu không được lớn hơn giá tối đa.')
      setTimeout(() => setNotice(''), 3000)
      return
    }
    setPricePreset('CUSTOM')
    setAppliedPriceRange({ min: minVal, max: maxVal })
  }

  function handleResetPriceFilter() {
    setPricePreset('ALL')
    setCustomMin('')
    setCustomMax('')
    setAppliedPriceRange({ min: null, max: null })
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState(loadCart)
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [notice, setNotice] = useState('')
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())
  const [adminUser, setAdminUser] = useState(() => getCurrentAdminUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const [vouchersOpen, setVouchersOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [justAddedId, setJustAddedId] = useState(null)
  const [cartBump, setCartBump] = useState(false)
  const [cartToast, setCartToast] = useState(null)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const expireSession = () => { logoutUser(); setCurrentUser(null); setAuthOpen(true) }
    window.addEventListener('customer-session-expired', expireSession)
    return () => window.removeEventListener('customer-session-expired', expireSession)
  }, [])

  useEffect(() => {
    saveCart(cart)
  }, [cart])

  function scrollToSection(sectionId) {
    if (currentRoute === 'orders') {
      handleBackToStore()
      window.requestAnimationFrame(() => document.getElementById(sectionId === 'home' ? 'top' : sectionId)?.scrollIntoView())
      return
    }
    setActiveSection(sectionId)
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.getElementById(sectionId)
      if (el) {
        const offset = 76
        const bodyRect = document.body.getBoundingClientRect().top
        const elementRect = el.getBoundingClientRect().top
        const elementPosition = elementRect - bodyRect
        const offsetPosition = elementPosition - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }
  }

  // Tự động phát hiện section đang hiển thị trên màn hình khi cuộn trang
  useEffect(() => {
    let ticking = false
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 140
          const productsEl = document.getElementById('products')
          const storyEl = document.getElementById('story')

          if (storyEl && scrollPos >= storyEl.offsetTop - 120) {
            setActiveSection('story')
          } else if (productsEl && scrollPos >= productsEl.offsetTop - 120) {
            setActiveSection('products')
          } else {
            setActiveSection('home')
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleLogout() {
    if (isCheckoutPath(window.location.pathname)) window.history.replaceState({}, '', '/')
    logoutUser()
    setCurrentUser(null)
    setAccountOpen(false)
    setOrderOpen(false)
    setCompletedOrder(null)
    setUserMenuOpen(false)
    setNotice('Đã đăng xuất tài khoản thành công.')
    window.setTimeout(() => setNotice(''), 3000)
  }

  function handleUserUpdate(updatedUser) {
    setCurrentUser(updatedUser)
  }

  // Đóng user-menu khi click ra ngoài
  useEffect(() => {
    if (!userMenuOpen) return
    function handleOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [userMenuOpen])

  useEffect(() => {
    let cancelled = false

    loadProducts().then(({ products: loadedProducts, error }) => {
      if (cancelled) return
      if (Array.isArray(loadedProducts)) {
        setProducts(loadedProducts)
      }
      setCatalogError(error?.message ?? '')
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (productImagePreview) URL.revokeObjectURL(productImagePreview)
    }
  }, [productImagePreview])

  useEffect(() => {
    let cancelled = false
    async function restoreOrderFromUrlOrStorage() {
      if (isCheckoutPath(window.location.pathname)) {
        setCompletedOrder(null)
        if (Object.keys(loadCart()).length === 0) {
          setOrderOpen(false)
          setCartOpen(true)
          window.history.replaceState({}, '', '/')
          return
        }
        setOrderOpen(true)
        return
      }
      if (window.location.pathname.includes('/order-success')) {
        const urlParams = new URLSearchParams(window.location.search)
        const orderIdParam = urlParams.get('id')
        const guestToken = new URLSearchParams(window.location.hash.slice(1)).get('token')
        setOrderOpen(false)
        setCompletedOrder(null)

        if (orderIdParam) {
          try {
            const { order, items, error } = await fetchOrderById(orderIdParam, guestToken)
            if (cancelled) return
            if (order && !error) {
              const liveOrder = {
                guestToken,
                orderNumber: order.orderCode || orderIdParam,
                orderId: order.id,
                id: order.id,
                customerId: order.customer_id,
                status: order.status || 'PENDING',
                approved_at: order.approved_at,
                orderDate: order.order_date || new Date().toLocaleString('vi-VN'),
                items: (items || []).map((it) => ({
                  id: it.product_id,
                  name: it.product_name,
                  image: it.image_url,
                  category: it.category_name,
                  quantity: it.quantity,
                  price: Number(it.unit_price || 0),
                  lineTotal: Number(it.amount || 0),
                })),
                subtotal: (items || []).reduce((sum, it) => sum + Number(it.amount || 0), 0),
                discount_amount: Number(order.discount_amount || 0),
                discountAmount: Number(order.discount_amount || 0),
                total_amount: Number(order.total_amount || 0),
                total: Number(order.total_amount || 0),
                shippingInfo: {
                  fullName: order.full_name,
                  phone: order.phone,
                  address: order.address,
                },
                paymentMethod: {
                  id: 'cod',
                  label: 'Thanh toán khi nhận hàng (COD)',
                },
              }
              setCompletedOrder(liveOrder)
              setOrderOpen(true)
              try {
                localStorage.setItem('funi_last_order', JSON.stringify(liveOrder))
              } catch (e) {}
              return
            }
          } catch (err) {
            console.warn('Cannot fetch live order by ID:', err)
          }
        }

        // Fallback từ localStorage nếu không tìm thấy id hoặc backend offline
        try {
          const saved = getLocalOrders(currentUser?.customerId).find((order) =>
            !orderIdParam || [order.orderNumber, order.orderCode, String(order.orderId ?? order.id)].includes(orderIdParam)
          )
          if (saved) {
            setCompletedOrder(saved)
            setOrderOpen(true)
            return
          }
        } catch (err) {
          console.error('Cannot restore order:', err)
        }
        setNotice('Không thể mở đơn hàng. Vui lòng kiểm tra kết nối và dùng đầy đủ liên kết đơn hàng đã lưu.')
      }
    }

    restoreOrderFromUrlOrStorage()

    function handlePopState() {
      if (isCheckoutPath(window.location.pathname) || window.location.pathname.includes('/order-success')) {
        restoreOrderFromUrlOrStorage()
      } else {
        setOrderOpen(false)
        setCompletedOrder(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      cancelled = true
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentUser?.customerId])

  // Khóa cuộn nền khi mở giỏ hoặc đặt hàng; Escape đóng giỏ hàng.
  useEffect(() => {
    if (cartOpen || orderOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setCartOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [cartOpen, orderOpen])

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const matchesFav = !showFavorites || favorites.includes(product.id)
      const matchesMin = appliedPriceRange.min == null || (
        appliedPriceRange.minExclusive
          ? product.price > appliedPriceRange.min
          : product.price >= appliedPriceRange.min
      )
      const matchesMax = appliedPriceRange.max == null || product.price <= appliedPriceRange.max
      return matchesCategory && matchesSearch && matchesFav && matchesMin && matchesMax
    })
    .sort((a, b) => {
      if (sortOrder === 'PRICE_ASC') return a.price - b.price
      if (sortOrder === 'PRICE_DESC') return b.price - a.price
      if (sortOrder === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi')
      if (sortOrder === 'NAME_DESC') return b.name.localeCompare(a.name, 'vi')
      return 0
    })
  const cartItems = products.filter((product) => cart[product.id])
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const subtotal = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)

  function updateQuantity(productId, change) {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[productId] || 0) + change
      const nextCart = { ...currentCart }
      if (nextQuantity <= 0) delete nextCart[productId]
      else nextCart[productId] = nextQuantity
      return nextCart
    })
  }

  function handleAddToCart(product, event) {
    if (event) event.stopPropagation()
    updateQuantity(product.id, 1)

    // 1. Phản hồi trực quan ngay trên nút
    setJustAddedId(product.id)
    window.clearTimeout(window.__justAddedTimer)
    window.__justAddedTimer = window.setTimeout(() => {
      setJustAddedId(null)
    }, 2200)

    // 2. Hiệu ứng nhịp nảy giỏ hàng trên thanh navbar
    setCartBump(true)
    window.clearTimeout(window.__cartBumpTimer)
    window.__cartBumpTimer = window.setTimeout(() => {
      setCartBump(false)
    }, 600)

    // 3. Thông báo nổi Toast Notification
    const newQuantity = (cart[product.id] || 0) + 1
    setCartToast({
      product,
      quantity: newQuantity,
      show: true,
    })
    window.clearTimeout(window.__cartToastTimer)
    window.__cartToastTimer = window.setTimeout(() => {
      setCartToast(null)
    }, 3800)
  }

  function toggleFavorite(productId) {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(productId)
        ? currentFavorites.filter((id) => id !== productId)
        : [...currentFavorites, productId],
    )
  }

  function placeOrder() {
    window.history.pushState({}, '', '/checkout')
    setCompletedOrder(null)
    setCartOpen(false)
    setOrderOpen(true)
  }

  function handleOrderSuccess(orderData) {
    if (orderData) {
      setCompletedOrder(orderData)
    }
    // Clear cart after successful order
    setCart({})
  }

  function handleReorder(items) {
    if (!items || items.length === 0) return
    const availableItems = items.filter((item) =>
      products.some((product) => String(product.id) === String(item.productId || item.product_id || item.id))
    )
    if (availableItems.length === 0) {
      setNotice('Các sản phẩm trong đơn này hiện không còn được bán.')
      window.setTimeout(() => setNotice(''), 3000)
      return
    }
    setCart((prevCart) => {
      const nextCart = { ...prevCart }
      for (const it of availableItems) {
        const pId = it.productId || it.product_id || it.id
        if (pId) {
          nextCart[pId] = (nextCart[pId] || 0) + Math.max(1, Number(it.quantity) || 1)
        }
      }
      return nextCart
    })
    setNotice(availableItems.length < items.length
      ? 'Đã thêm vào giỏ các sản phẩm còn bán; một số sản phẩm không còn trong danh mục.'
      : 'Đã thêm sản phẩm từ đơn hàng vào giỏ!')
    window.setTimeout(() => setNotice(''), 3000)
    setCartOpen(true)
  }

  function handleViewOrderDetail(order) {
    setCompletedOrder(order)
    setOrderOpen(true)
  }

  function handleOpenMyOrders(event) {
    if (event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey) return
    event?.preventDefault()
    if (currentRoute !== 'orders') window.history.pushState({}, '', '/orders')
    setCurrentRoute('orders')
    setUserMenuOpen(false)
    setProfileOpen(false)
    setOrderOpen(false)
    setCompletedOrder(null)
    window.scrollTo(0, 0)
  }

  function previewProductImage(event) {
    const file = event.target.files?.[0]
    if (file) setProductImagePreview(URL.createObjectURL(file))
  }

  function submitProductForm(event) {
    event.preventDefault()
    setNotice('Đây mới là giao diện xem trước. Sản phẩm chưa được lưu vì backend chưa hỗ trợ thêm sản phẩm.')
    window.setTimeout(() => setNotice(''), 5000)
  }

  function handleAdminLoginSuccess(user) {
    setAdminUser(user)
  }

  function handleAdminLogout() {
    logoutAdminUser()
    window.history.replaceState(null, '', '/admin')
    setAdminUser(null)
  }

  if (currentRoute === 'admin') {
    const hasAdminAccess = adminUser && (adminUser.role === 'ADMIN' || adminUser.role === 'STAFF')

    if (!hasAdminAccess) {
      return (
        <AdminLoginPage
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToStore={handleBackToStore}
        />
      )
    }

    return (
      <AdminLayout
        currentUser={adminUser}
        onLogout={handleAdminLogout}
        onBackToStore={handleBackToStore}
      />
    )
  }

  if (currentRoute === '404') {
    return <NotFoundPage onBackToStore={handleBackToStore} />
  }

  return (
    <div className="storefront">
      <div className="announcement">
        <span>Giao hàng miễn phí cho đơn từ 2.000.000₫</span>
        <span className="announcement-note">Thiết kế tử tế, sống an yên</span>
      </div>

      <header className="site-header">
        <a
          className="wordmark"
          href="#top"
          aria-label="FuniStore - Trang chủ"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('home')
          }}
        >
          <span className="wordmark-symbol" aria-hidden="true">f.</span>
          <span>FUNI <em>STORE</em></span>
        </a>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <a
            className={currentRoute === 'store' && activeSection === 'home' ? 'nav-active' : ''}
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('home')
            }}
          >
            Trang chủ
          </a>
          <a
            className={currentRoute === 'store' && activeSection === 'products' ? 'nav-active' : ''}
            href="#products"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('products')
            }}
          >
            Sản phẩm
          </a>
          <a
            className={currentRoute === 'store' && activeSection === 'story' ? 'nav-active' : ''}
            href="#story"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('story')
            }}
          >
            Câu chuyện FuniStore
          </a>
        </nav>
        <div className="header-actions">
        <label className="search-box">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm món đồ bạn thích"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                if (currentRoute === 'orders') scrollToSection('products')
              }}
            />
          </label>
          <NotificationsMenu
            key={`notifications-${currentUser?.customerId || 'guest'}`}
            customerId={currentUser?.customerId}
            onLogin={() => setAuthOpen(true)}
            onOpenOrder={id => {
              setCompletedOrder(null)
              setOrderOpen(false)
              window.history.pushState({}, '', `/order-success?id=${encodeURIComponent(id)}`)
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
          />
          <button
            className={`bag-button ${cartBump ? 'cart-bounce' : ''}`}
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Mở giỏ hàng, ${cartCount} sản phẩm`}
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            <span>Giỏ hàng</span>
            <span className="bag-count">{cartCount}</span>
          </button>
          {currentUser ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button
                className="user-logged-box"
                type="button"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="user-avatar-badge">
                  {(currentUser.fullName || currentUser.username || 'U').charAt(0)}
                </span>
                <span className="user-display-name">
                  {currentUser.fullName || currentUser.username}
                </span>
                <ChevronDown size={13} className={userMenuOpen ? 'chevron-up' : ''} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu" role="menu">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{currentUser.fullName || currentUser.username}</span>
                    <span className="user-dropdown-sub">@{currentUser.username}</span>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    type="button"
                    onClick={() => { setUserMenuOpen(false); setAccountOpen(true) }}
                  >
                    <User size={15} /> Tài khoản
                  </button>
                  <a
                    className="user-dropdown-item"
                    role="menuitem"
                    href="/orders"
                    onClick={handleOpenMyOrders}
                  >
                    <ShoppingBag size={15} /> Lịch sử đơn hàng
                  </a>
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setVouchersOpen(true)
                    }}
                  >
                    <Tag size={15} /> Voucher của tôi
                  </button>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item user-dropdown-item--logout"
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="user-auth-button"
              type="button"
              onClick={() => setAuthOpen(true)}
            >
              <User size={15} strokeWidth={1.8} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* Thanh điều hướng trang cho giao diện Mobile / Tablet */}
      <nav className="mobile-sub-nav" aria-label="Điều hướng nhanh trang">
        <button
          type="button"
          className={`mobile-nav-chip ${currentRoute === 'store' && activeSection === 'home' ? 'active' : ''}`}
          onClick={() => scrollToSection('home')}
        >
          Trang chủ
        </button>
        <button
          type="button"
          className={`mobile-nav-chip ${currentRoute === 'store' && activeSection === 'products' ? 'active' : ''}`}
          onClick={() => scrollToSection('products')}
        >
          Sản phẩm
        </button>
        <button
          type="button"
          className={`mobile-nav-chip ${currentRoute === 'store' && activeSection === 'story' ? 'active' : ''}`}
          onClick={() => scrollToSection('story')}
        >
          Câu chuyện FuniStore
        </button>
      </nav>

      {currentRoute === 'orders' ? (
        currentUser?.customerId ? (
          <MyOrdersPage
            key={`orders-${currentUser.customerId}`}
            onClose={handleBackToStore}
            currentUser={currentUser}
            catalogProducts={products}
            onViewOrderDetail={handleViewOrderDetail}
            onReorder={handleReorder}
          />
        ) : (
          <main className="orders-page shopee-orders-empty" id="top">
            <h1>Lịch sử đơn hàng</h1>
            <p>Đăng nhập để xem và theo dõi đơn hàng của bạn.</p>
            <button className="shopee-btn shopee-btn-detail" type="button" onClick={() => setAuthOpen(true)}>Đăng nhập</button>
          </main>
        )
      ) : (
      <main id="top">
        <section className="hero" aria-label="Bộ sưu tập nội thất FuniStore">
          <div className="hero-copy">
            <p className="eyebrow"><span></span> SỐNG CHẬM, SỐNG CÓ GU</p>
            <h1>Nhà là nơi<br />mình trở về.</h1>
            <p className="hero-description">
              Những món đồ được làm ra để ở lại thật lâu trong ngôi nhà của bạn.
            </p>
            <a
              className="hero-cta"
              href="#products"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('products')
              }}
            >
              Khám phá bộ sưu tập <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-caption">
            <span>Bộ sưu tập 01 / 2026</span>
            <span>Chạm vào chất liệu tự nhiên</span>
          </div>
          <div className="hero-index" aria-hidden="true">01 <i></i> 04</div>
        </section>

        <section className="shop-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">ĐỒ ĐẸP CHO NHÀ</p>
              <h2>Món bạn đang tìm</h2>
            </div>
            <a
              className="text-link"
              href="#story"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('story')
              }}
            >
              Xem câu chuyện FuniStore <ArrowRight size={16} />
            </a>
          </div>
          <div className="shop-tools">
            <div className="category-list" role="group" aria-label="Lọc theo danh mục">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? 'category-chip selected' : 'category-chip'}
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <button className={`category-chip ${showFavorites ? 'selected' : ''}`} type="button"
              aria-label={`Lọc sản phẩm yêu thích, ${favorites.length} món`} aria-pressed={showFavorites}
              onClick={() => setShowFavorites(value => !value)}><Heart size={14} /> Yêu thích</button>
            <span className="result-count">{filteredProducts.length} sản phẩm</span>
          </div>

          {/* Thanh lọc giá và sắp xếp sản phẩm dành cho khách hàng */}
          <div className="price-filter-bar" aria-label="Bộ lọc giá và sắp xếp">
            <div className="price-filter-presets">
              <span className="filter-group-label">
                <Filter size={13} />
                <span>Khoảng giá:</span>
              </span>
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`price-preset-chip ${pricePreset === p.id ? 'active' : ''}`}
                  aria-pressed={pricePreset === p.id}
                  onClick={() => handleSelectPricePreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="price-filter-custom-and-sort">
              <form className="price-custom-form" onSubmit={handleApplyCustomPrice}>
                <span className="custom-input-label">Tự nhập:</span>
                <div className="price-input-wrapper">
                  <input
                    type="number"
                    placeholder="Từ (₫)"
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    min="0"
                    step="100000"
                    aria-label="Giá từ"
                  />
                </div>
                <span className="price-dash">—</span>
                <div className="price-input-wrapper">
                  <input
                    type="number"
                    placeholder="Đến (₫)"
                    value={customMax}
                    onChange={(e) => setCustomMax(e.target.value)}
                    min="0"
                    step="100000"
                    aria-label="Giá đến"
                  />
                </div>
                <button type="submit" className="price-apply-btn" title="Áp dụng lọc giá">
                  Lọc
                </button>
                {(appliedPriceRange.min != null || appliedPriceRange.max != null) && (
                  <button
                    type="button"
                    className="price-clear-btn"
                    onClick={handleResetPriceFilter}
                    title="Xóa bộ lọc giá"
                  >
                    <X size={13} />
                    <span>Xóa lọc</span>
                  </button>
                )}
              </form>

              <div className="shop-sort-control">
                <ArrowUpDown size={13} className="sort-icon" />
                <select
                  className="shop-sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  aria-label="Sắp xếp sản phẩm"
                >
                  <option value="DEFAULT">Mặc định (Funi chọn)</option>
                  <option value="PRICE_ASC">Giá: Thấp → Cao</option>
                  <option value="PRICE_DESC">Giá: Cao → Thấp</option>
                  <option value="NAME_ASC">Tên: A → Z</option>
                  <option value="NAME_DESC">Tên: Z → A</option>
                </select>
              </div>
            </div>
          </div>

          {catalogError && (
            <p className="catalog-note" role="status">
              Chưa tải được sản phẩm từ backend; đang hiển thị dữ liệu mẫu.
            </p>
          )}

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <article className="product-card" key={product.id} style={{ '--item-index': index }}>
                  <div className="product-image-wrap">
                    <img className="product-image" src={product.image} alt={product.name} />
                    {product.badge && <span className="product-badge">{product.badge}</span>}
                    {cart[product.id] > 0 && (
                      <span className="product-cart-tag" title={`Đang có ${cart[product.id]} sản phẩm trong giỏ`}>
                        <ShoppingBag size={11} strokeWidth={2.2} />
                        <span>Trong giỏ: <strong>{cart[product.id]}</strong></span>
                      </span>
                    )}
                    <button
                      className={favorites.includes(product.id) ? 'favorite-button is-favorite' : 'favorite-button'}
                      type="button"
                      aria-label={favorites.includes(product.id) ? `Bỏ thích ${product.name}` : `Yêu thích ${product.name}`}
                      aria-pressed={favorites.includes(product.id)}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart size={19} strokeWidth={1.7} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className={`quick-add ${justAddedId === product.id ? 'is-added' : ''} ${cart[product.id] > 0 ? 'has-in-cart' : ''}`}
                      type="button"
                      aria-label={`Thêm ${product.name} vào giỏ hàng`}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      {justAddedId === product.id ? (
                        <>
                          <Check size={16} strokeWidth={2.5} className="quick-add-check-icon" />
                          <span>Đã thêm! ({cart[product.id] || 1})</span>
                        </>
                      ) : cart[product.id] > 0 ? (
                        <>
                          <Plus size={15} />
                          <span>Thêm tiếp (đang có {cart[product.id]})</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>Thêm vào giỏ</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="product-meta">
                    <span>{product.category}</span>
                    <span className="product-rating">Funi chọn</span>
                  </div>
                  <h3>{product.name}</h3>
                  <div className="product-price-row">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <Search size={24} />
              <p>Chưa tìm thấy món đồ phù hợp với mức giá hoặc danh mục đã chọn.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setShowFavorites(false)
                  handleResetPriceFilter()
                  setActiveCategory('Tất cả')
                }}
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </section>

        <section className="story-band" id="story">
          <div className="story-mark" aria-hidden="true">F.</div>
          <div>
            <p className="eyebrow">ÍT HƠN, NHƯNG ĐÚNG HƠN</p>
            <h2>Chọn đồ có ý thức.<br />Sống nhà có tình.</h2>
          </div>
          <p className="story-copy">
            FuniStore tìm những chất liệu gần gũi và dáng hình bền vững, để mỗi món đồ đều có một lý do ở lại.
          </p>
          <a
            href="#products"
            aria-label="Khám phá sản phẩm"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('products')
            }}
          >
            <ArrowRight size={20} />
          </a>
        </section>
      </main>
      )}

      <footer className="site-footer">
        <a
          className="wordmark footer-wordmark"
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('home')
          }}
        >
          <span className="wordmark-symbol">f.</span>
          <span>FUNI <em>STORE</em></span>
        </a>
        <span>Đồ đẹp cho những ngày bình thường.</span>
        <span>© 2026 FuniStore</span>
      </footer>

      {/* Thông báo nổi (Toast Notification) xác nhận thêm vào giỏ hàng */}
      {cartToast?.show && (
        <aside className="cart-toast" role="status" aria-live="polite">
          <div className="cart-toast-thumb-wrap">
            <img src={cartToast.product.image} alt="" />
            <span className="cart-toast-badge">
              <Check size={11} strokeWidth={3} />
            </span>
          </div>
          <div className="cart-toast-info">
            <div className="cart-toast-headline">
              <span className="cart-toast-status">Đã thêm vào giỏ</span>
              <span className="cart-toast-dot">•</span>
              <span className="cart-toast-qty">x{cartToast.quantity}</span>
            </div>
            <p className="cart-toast-name">{cartToast.product.name}</p>
            <p className="cart-toast-price">{formatPrice(cartToast.product.price)}</p>
          </div>
          <div className="cart-toast-actions">
            <button
              type="button"
              className="cart-toast-view-btn"
              onClick={() => {
                setCartToast(null)
                setCartOpen(true)
              }}
            >
              <span>Xem giỏ</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              className="cart-toast-close"
              aria-label="Đóng thông báo"
              onClick={() => setCartToast(null)}
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}

      {cartOpen && (
        <div className="cart-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false)
        }}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="cart-header">
              <div><p className="eyebrow">GIỎ HÀNG CỦA BẠN</p><h2 id="cart-title">Món đã chọn <span>({cartCount})</span></h2></div>
              <button className="icon-button close-cart" type="button" aria-label="Đóng giỏ hàng" onClick={() => setCartOpen(false)}><X size={21} /></button>
            </div>
            {cartItems.length ? (
              <>
                <div className="cart-items">
                  {cartItems.map((product) => (
                    <div className="cart-item" key={product.id}>
                      <img src={product.image} alt="" />
                      <div className="cart-item-info">
                        <span>{product.category}</span>
                        <h3>{product.name}</h3>
                        <strong>{formatPrice(product.price)}</strong>
                        <div className="quantity-control">
                          <button type="button" aria-label={`Giảm số lượng ${product.name}`} onClick={() => updateQuantity(product.id, -1)}><Minus size={13} /></button>
                          <span>{cart[product.id]}</span>
                          <button type="button" aria-label={`Tăng số lượng ${product.name}`} onClick={() => updateQuantity(product.id, 1)}><Plus size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div className="subtotal"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
                  <p>Phí giao hàng sẽ được xác nhận khi đặt hàng.</p>
                  <button className="checkout-button" type="button" onClick={placeOrder}>Tiếp tục đặt hàng <ArrowRight size={17} /></button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <div className="empty-cart-icon-wrap">
                  <ShoppingBag size={32} strokeWidth={1.5} />
                </div>
                <h3>Giỏ hàng đang trống</h3>
                <p>Thêm một món đồ bạn thích, FuniStore giữ giúp bạn ở đây.</p>
                <button type="button" onClick={() => setCartOpen(false)}>Tiếp tục khám phá</button>
              </div>
            )}
          </aside>
        </div>
      )}
      {productFormOpen && (
        <div
          className="product-form-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProductFormOpen(false)
          }}
        >
          <section
            className="product-form-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <header className="product-form-header">
              <div>
                <p className="eyebrow">DÀNH CHO NHÀ BÁN HÀNG</p>
                <h2 id="product-form-title">Đăng sản phẩm mới</h2>
                <p>Điền thông tin món đồ bạn muốn giới thiệu tại FuniStore.</p>
              </div>
              <button
                className="icon-button close-product-form"
                type="button"
                aria-label="Đóng biểu mẫu"
                onClick={() => setProductFormOpen(false)}
              >
                <X size={21} />
              </button>
            </header>

            <div className="form-preview-note" role="status">
              <strong>Chế độ xem trước</strong>
              <span>Biểu mẫu hiện chưa gửi hoặc lưu dữ liệu.</span>
            </div>

            <form className="product-form" onSubmit={submitProductForm}>
              <div className="product-form-fields">
                <label className="form-field">
                  <span>Tên sản phẩm <i>*</i></span>
                  <input name="name" placeholder="Ví dụ: Ghế thư giãn Lúa" required />
                </label>

                <div className="form-field-row">
                  <label className="form-field">
                    <span>Danh mục <i>*</i></span>
                    <select name="category" defaultValue="" required>
                      <option value="" disabled>Chọn danh mục</option>
                      {categories.slice(1).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Giá bán (₫) <i>*</i></span>
                    <input name="price" type="number" min="0" step="1000" placeholder="0" required />
                  </label>
                </div>

                <label className="form-field">
                  <span>Số lượng tồn kho <i>*</i></span>
                  <input name="quantity" type="number" min="0" step="1" placeholder="0" required />
                </label>

                <label className="form-field">
                  <span>Mô tả sản phẩm</span>
                  <textarea name="description" rows="4" placeholder="Chất liệu, kích thước và câu chuyện của món đồ..." />
                </label>

                <label className="form-field">
                  <span>Ảnh sản phẩm</span>
                  <input
                    className="image-file-input"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={previewProductImage}
                  />
                  <span className="image-upload-hint">Chọn ảnh từ thiết bị · PNG, JPG</span>
                </label>
              </div>

              <aside className="product-image-preview" aria-label="Xem trước ảnh sản phẩm">
                {productImagePreview ? (
                  <img src={productImagePreview} alt="Ảnh xem trước sản phẩm" />
                ) : (
                  <>
                    <Upload size={23} strokeWidth={1.5} />
                    <span>Ảnh sản phẩm<br />sẽ hiển thị tại đây</span>
                  </>
                )}
              </aside>

              <div className="product-form-actions">
                <button className="cancel-product-button" type="button" onClick={() => setProductFormOpen(false)}>
                  Hủy
                </button>
                <button className="save-product-button" type="submit">
                  <Upload size={15} /> Đăng sản phẩm
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user)
          setNotice(`Xin chào ${user.fullName || user.username}!`)
          setTimeout(() => setNotice(''), 3500)
        }}
      />
      <ProfileModal
        isOpen={profileOpen}
        user={currentUser}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
        onOpenMyOrders={handleOpenMyOrders}
      />
      <VouchersModal
        isOpen={vouchersOpen}
        onClose={() => setVouchersOpen(false)}
        currentUser={currentUser}
        onUseVoucher={(code) => {
          setCartOpen(true)
          setNotice(`Nhập mã ${code} ở bước đặt hàng để áp dụng ưu đãi.`)
          setTimeout(() => setNotice(''), 4500)
        }}
        onOpenStore={() => {
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <AccountModal
        isOpen={accountOpen}
        user={currentUser}
        onClose={() => setAccountOpen(false)}
        onUserUpdate={handleUserUpdate}
      />
      {orderOpen && (
        <OrderReviewPage
          key={currentUser?.customerId || 'guest'}
          cartItems={cartItems}
          cart={cart}
          subtotal={subtotal}
          currentUser={currentUser}
          catalogProducts={products}
          initialOrder={completedOrder}
          onClose={() => {
            setOrderOpen(false)
            setCompletedOrder(null)
            if (isCheckoutPath(window.location.pathname) || window.location.pathname.includes('/order-success')) {
              window.history.pushState({}, '', window.location.origin + '/')
            }
          }}
          onOrderSuccess={handleOrderSuccess}
          onReorder={handleReorder}
          onOpenMyOrders={handleOpenMyOrders}
        />
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
