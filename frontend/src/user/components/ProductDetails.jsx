import { useEffect, useLayoutEffect, useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { getApiBaseUrl } from '../../lib/apiConfig'
import { productImageUrl } from '../../lib/productImages'
import { getProductStock } from '../lib/cart'
import './ProductDetails.css'

const fields = [
  ['sku', 'Mã sản phẩm'], ['brand', 'Thương hiệu'], ['origin', 'Xuất xứ'],
  ['material', 'Chất liệu'], ['dimensions', 'Kích thước'], ['weight_kg', 'Khối lượng (kg)'],
  ['color', 'Màu sắc'], ['warranty_months', 'Bảo hành (tháng)'],
]

export default function ProductDetails({ productId, product, cartQuantity, onChangeQuantity, onContact, returnScrollY }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const stock = getProductStock(product)
  const inCart = cartQuantity > 0
  const quantity = inCart ? cartQuantity : Math.min(selectedQuantity, stock)
  const price = product?.discountedPrice ?? product?.price ?? detail?.price
  const image = product?.image || productImageUrl(detail?.image_url)

  function changeQuantity(change) {
    if (inCart) onChangeQuantity(change)
    else setSelectedQuantity(quantity + change)
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${getApiBaseUrl()}/api/products/${productId}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'Sản phẩm không còn được bán.' : 'Không tải được chi tiết sản phẩm. Vui lòng thử lại.')
        return response.json()
      })
      .then(setDetail)
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [productId])

  useLayoutEffect(() => {
    if (detail && returnScrollY != null) window.scrollTo({ top: returnScrollY, behavior: 'instant' })
  }, [detail, returnScrollY])

  return (
    <main className="product-detail-page">
      {!detail && !error && <p role="status">Đang tải thông tin sản phẩm…</p>}
      {error && <p role="alert">{error}</p>}
      {detail && <div className="product-detail-layout">
        {image ? <img className="product-detail-photo" src={image} alt={detail.name} /> : <div className="product-detail-photo">Chưa có ảnh sản phẩm</div>}
        <section>
          <p className="product-detail-category">{product?.category || detail.category}</p>
          <h1 id="product-detail-title">{detail.name}</h1>
          <p className="product-detail-price">{price != null && Number.isFinite(Number(price)) ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Chưa tải được giá sản phẩm'}</p>
          {onChangeQuantity && <div className="product-detail-purchase">
            <div className="product-detail-quantity-heading">
              <span>{inCart ? 'Số lượng trong giỏ' : 'Số lượng'}</span>
              {stock <= 5 && <small>{product?.quantity == null ? 'Chưa xác nhận tồn kho' : stock === 0 ? 'Hết hàng' : `Còn ${stock} sản phẩm`}</small>}
            </div>
            <div className="product-detail-purchase-actions">
              <div className="product-detail-stepper" role="group" aria-label="Số lượng sản phẩm">
                <button type="button" aria-label="Giảm số lượng" disabled={!inCart && quantity <= 1} onClick={() => changeQuantity(-1)}><Minus size={18} /></button>
                <output aria-label={inCart ? 'Số lượng trong giỏ' : 'Số lượng đã chọn'}>{quantity}</output>
                <button type="button" aria-label="Tăng số lượng" disabled={quantity >= stock} onClick={() => changeQuantity(1)}><Plus size={18} /></button>
              </div>
              {inCart ? <span className="product-detail-added" role="status"><Check size={18} /> Đã thêm {cartQuantity} vào giỏ</span> : <button type="button" className="product-detail-add" disabled={quantity === 0} onClick={() => {
                onChangeQuantity(quantity)
                setSelectedQuantity(1)
              }}><ShoppingBag size={18} /> Thêm vào giỏ</button>}
            </div>
            <div role="status">
              {stock > 0 && quantity >= stock && (
                <p className="product-detail-limit">Đã quá số lượng trong kho, nếu bạn cần thì hãy <a href="/contact" onClick={onContact}>liên hệ ngay</a>.</p>
              )}
            </div>
          </div>}
            <p>{detail.detailed_description || detail.description || 'Sản phẩm chưa có mô tả chi tiết.'}</p>
            <dl className="product-detail-specs">
              {fields.filter(([key]) => detail[key] != null && detail[key] !== '').map(([key, label]) => (
                <div key={key}><dt>{label}</dt><dd>{detail[key]}</dd></div>
              ))}
            </dl>
            {detail.care_instructions && <><h3>Hướng dẫn bảo quản</h3><p>{detail.care_instructions}</p></>}
        </section>
      </div>}
    </main>
  )
}
