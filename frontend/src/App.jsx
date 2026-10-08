import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Upload,
  X,
} from 'lucide-react'
import { demoProducts, loadProducts } from './lib/products'
import './App.css'

const categories = ['Tất cả', 'Ghế & sofa', 'Bàn', 'Đèn', 'Trang trí']

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

function App() {
  const [products, setProducts] = useState(demoProducts)
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState({})
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false

    loadProducts().then(({ products: loadedProducts, error }) => {
      if (cancelled) return
      setProducts(loadedProducts)
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

  function toggleFavorite(productId) {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(productId)
        ? currentFavorites.filter((id) => id !== productId)
        : [...currentFavorites, productId],
    )
  }

  function placeOrder() {
    setNotice('Backend chưa kết nối nên đơn hàng chưa được gửi.')
    window.setTimeout(() => setNotice(''), 3500)
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

  return (
    <div className="storefront">
      <div className="announcement">
        <span>Giao hàng miễn phí cho đơn từ 2.000.000₫</span>
        <span className="announcement-note">Thiết kế tử tế, sống an yên</span>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Nếp Living - Trang chủ">
          <span className="wordmark-symbol" aria-hidden="true">n.</span>
          <span>NẾP <em>LIVING</em></span>
        </a>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <a className="nav-active" href="#top">Trang chủ</a>
          <a href="#products">Sản phẩm</a>
          <a href="#story">Câu chuyện Nếp</a>
        </nav>
        <div className="header-actions">
        <button
          className="add-product-button"
          type="button"
          onClick={() => setProductFormOpen(true)}
        >
          <Upload size={15} strokeWidth={1.8} />
          <span>Đăng sản phẩm</span>
        </button>
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
            className="bag-button"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Mở giỏ hàng, ${cartCount} sản phẩm`}
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            <span>Giỏ hàng</span>
            <span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Bộ sưu tập nội thất Nếp Living">
          <div className="hero-copy">
            <p className="eyebrow"><span></span> SỐNG CHẬM, SỐNG CÓ GU</p>
            <h1>Nhà là nơi<br />mình trở về.</h1>
            <p className="hero-description">
              Những món đồ được làm ra để ở lại thật lâu trong ngôi nhà của bạn.
            </p>
            <a className="hero-cta" href="#products">
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
            <a className="text-link" href="#story">Xem câu chuyện Nếp <ArrowRight size={16} /></a>
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
                    <button
                      className={favorites.includes(product.id) ? 'favorite-button is-favorite' : 'favorite-button'}
                      type="button"
                      aria-label={favorites.includes(product.id) ? `Bỏ thích ${product.name}` : `Yêu thích ${product.name}`}
                      aria-pressed={favorites.includes(product.id)}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart size={19} strokeWidth={1.7} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button className="quick-add" type="button" onClick={() => updateQuantity(product.id, 1)}>
                      <Plus size={15} /> Thêm vào giỏ
                    </button>
                  </div>
                  <div className="product-meta">
                    <span>{product.category}</span>
                    <span className="product-rating">Nếp chọn</span>
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
          <div className="story-mark" aria-hidden="true">N.</div>
          <div>
            <p className="eyebrow">ÍT HƠN, NHƯNG ĐÚNG HƠN</p>
            <h2>Chọn đồ có ý thức.<br />Sống nhà có tình.</h2>
          </div>
          <p className="story-copy">
            Nếp tìm những chất liệu gần gũi và dáng hình bền vững, để mỗi món đồ đều có một lý do ở lại.
          </p>
          <a href="#products" aria-label="Khám phá sản phẩm"><ArrowRight size={20} /></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#top"><span className="wordmark-symbol">n.</span><span>NẾP <em>LIVING</em></span></a>
        <span>Đồ đẹp cho những ngày bình thường.</span>
        <span>© 2026 Nếp Living</span>
      </footer>

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
                <p>Thêm một món đồ bạn thích, Nếp giữ giúp bạn ở đây.</p>
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
                <p>Điền thông tin món đồ bạn muốn giới thiệu tại Nếp.</p>
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
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
