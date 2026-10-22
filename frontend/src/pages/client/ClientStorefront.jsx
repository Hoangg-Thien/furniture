import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Heart,
  LogOut,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Upload,
  User,
  X,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react'
import { loadProducts } from '../../lib/products'
import { getCurrentUser, logoutUser, updateProfile } from '../../lib/auth'
import AuthModal from '../../components/AuthModal'
import ProfileModal from '../../components/ProfileModal'
import AccountModal from '../../components/AccountModal'
import OrderReviewPage from '../../components/OrderReviewPage'
import MyOrdersModal from '../../components/MyOrdersModal'
import VouchersModal from '../../components/VouchersModal'
import '../../App.css'

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

export default function ClientStorefront({ onNavigate }) {
  const [products, setProducts] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState({})
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [notice, setNotice] = useState('')
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const [myOrdersOpen, setMyOrdersOpen] = useState(false)
  const [vouchersOpen, setVouchersOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [justAddedId, setJustAddedId] = useState(null)
  const [cartBump, setCartBump] = useState(false)
  const [cartToast, setCartToast] = useState(null)
  const [activeSection, setActiveSection] = useState('home')

  function scrollToSection(sectionId) {
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
    logoutUser()
    setCurrentUser(null)
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
      if (loadedProducts && loadedProducts.length > 0) {
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
    if (window.location.pathname.includes('/order-success')) {
      try {
        const saved = localStorage.getItem('funi_last_order') || localStorage.getItem('nep_last_order')
        if (saved) {
          setCompletedOrder(JSON.parse(saved))
          setOrderOpen(true)
        }
      } catch (err) {
        console.error('Cannot restore order:', err)
      }
    }

    function handlePopState() {
      if (window.location.pathname.includes('/order-success')) {
        const saved = localStorage.getItem('funi_last_order') || localStorage.getItem('nep_last_order')
        if (saved) {
          setCompletedOrder(JSON.parse(saved))
          setOrderOpen(true)
        }
      } else {
        setOrderOpen(false)
        setCompletedOrder(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    return matchesCategory && matchesSearch && (!showFavorites || favorites.includes(product.id))
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
    if (currentUser) {
      setCartOpen(false)
      setOrderOpen(true)
    } else {
      setNotice('Vui lòng đăng nhập tài khoản để hoàn tất đặt hàng.')
      setAuthOpen(true)
      window.setTimeout(() => setNotice(''), 4000)
    }
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
    setCart((prevCart) => {
      const nextCart = { ...prevCart }
      for (const it of items) {
        const pId = it.id || it.product_id || it.productId
        if (pId) {
          nextCart[pId] = (nextCart[pId] || 0) + (it.quantity || 1)
        }
      }
      return nextCart
    })
    setNotice('Đã thêm sản phẩm từ đơn hàng vào giỏ!')
    window.setTimeout(() => setNotice(''), 3000)
    setCartOpen(true)
  }

  function handleViewOrderDetail(order) {
    setCompletedOrder(order)
    setOrderOpen(true)
  }

  function previewProductImage(event) {
    const file = event.target.files?.[0]
    if (file) setProductImagePreview(URL.createObjectURL(file))
  }

  function submitProductForm(event) {
    event.preventDefault()
    setNotice('Vui lòng truy cập trang Quản trị (Admin) để cập nhật và lưu trữ sản phẩm vào kho!')
    window.setTimeout(() => setNotice(''), 5000)
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
            className={activeSection === 'home' ? 'nav-active' : ''}
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('home')
            }}
          >
            Trang chủ
          </a>
          <a
            className={activeSection === 'products' ? 'nav-active' : ''}
            href="#products"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('products')
            }}
          >
            Sản phẩm
          </a>
          <a
            className={activeSection === 'story' ? 'nav-active' : ''}
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
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <button
            className={showFavorites ? 'icon-button favorite-shortcut active' : 'icon-button favorite-shortcut'}
            type="button"
            aria-label={`Lọc sản phẩm yêu thích, ${favorites.length} món`}
            aria-pressed={showFavorites}
            onClick={() => {
              setShowFavorites((current) => !current)
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Heart size={20} strokeWidth={1.7} />
            {favorites.length > 0 && <span className="tiny-count">{favorites.length}</span>}
          </button>
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
                  {/* Chỉ hiển thị nếu tài khoản đăng nhập có quyền ADMIN */}
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      className="user-dropdown-item"
                      role="menuitem"
                      type="button"
                      style={{ color: '#D97706', fontWeight: 600 }}
                      onClick={() => {
                        setUserMenuOpen(false)
                        onNavigate && onNavigate('/admin/reports')
                      }}
                    >
                      <LayoutDashboard size={15} /> Trang Quản Trị (Admin)
                    </button>
                  )}
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    type="button"
                    onClick={() => { setUserMenuOpen(false); setAccountOpen(true) }}
                  >
                    <User size={15} /> Tài khoản
                  </button>
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    type="button"
                    onClick={() => { setUserMenuOpen(false); setMyOrdersOpen(true) }}
                  >
                    <ShoppingBag size={15} /> Lịch sử đơn hàng
                  </button>
                  <button
                    className="user-dropdown-item user-dropdown-item--soon"
                    role="menuitem"
                    type="button"
                    disabled
                  >
                    <Bell size={15} /> Thông báo <span className="coming-soon-tag">Sắp ra mắt</span>
                  </button>
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
          className={`mobile-nav-chip ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => scrollToSection('home')}
        >
          Trang chủ
        </button>
        <button
          type="button"
          className={`mobile-nav-chip ${activeSection === 'products' ? 'active' : ''}`}
          onClick={() => scrollToSection('products')}
        >
          Sản phẩm
        </button>
        <button
          type="button"
          className={`mobile-nav-chip ${activeSection === 'story' ? 'active' : ''}`}
          onClick={() => scrollToSection('story')}
        >
          Câu chuyện FuniStore
        </button>
      </nav>

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
            <span className="result-count">{filteredProducts.length} sản phẩm</span>
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
              <p>Chưa tìm thấy món đồ phù hợp.</p>
              <button type="button" onClick={() => { setSearchTerm(''); setShowFavorites(false) }}>
                Xóa bộ lọc
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
                <ShoppingBag size={30} strokeWidth={1.4} />
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
        onOpenMyOrders={() => setMyOrdersOpen(true)}
      />
      <MyOrdersModal
        isOpen={myOrdersOpen}
        onClose={() => setMyOrdersOpen(false)}
        currentUser={currentUser}
        catalogProducts={products}
        onViewOrderDetail={handleViewOrderDetail}
        onReorder={handleReorder}
        onOpenStore={() => {
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <VouchersModal
        isOpen={vouchersOpen}
        onClose={() => setVouchersOpen(false)}
        currentUser={currentUser}
        onUseVoucher={(code) => {
          setCartOpen(true)
          setNotice(`Đã sao chép mã ${code}! Bạn có thể áp dụng mã này khi đặt hàng.`)
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
          cartItems={cartItems}
          cart={cart}
          subtotal={subtotal}
          currentUser={currentUser}
          catalogProducts={products}
          initialOrder={completedOrder}
          onClose={() => {
            setOrderOpen(false)
            setCompletedOrder(null)
            if (window.location.pathname.includes('/order-success')) {
              window.history.pushState({}, '', window.location.origin + '/')
            }
          }}
          onOrderSuccess={handleOrderSuccess}
          onReorder={handleReorder}
          onOpenMyOrders={() => setMyOrdersOpen(true)}
        />
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}
