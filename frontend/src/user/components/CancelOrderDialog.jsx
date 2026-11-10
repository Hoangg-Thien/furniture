import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, LoaderCircle, X } from 'lucide-react'
import { cancelOrderApi } from '../../lib/orders'

export default function CancelOrderDialog({ order, onClose, onCancelled }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const dialogRef = useRef(null)
  const keepButtonRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    keepButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  async function handleConfirm() {
    if (busy.current) return
    busy.current = true
    dialogRef.current?.focus()
    setLoading(true)
    setError('')
    try {
      const result = await cancelOrderApi(order.orderId || order.id || order.orderNumber, order.guestToken)
      if (result.success) {
        onCancelled(order)
      } else {
        setError(result.error || 'Không thể hủy đơn hàng vào lúc này. Vui lòng thử lại.')
      }
    } catch {
      setError('Không thể hủy đơn hàng vào lúc này. Vui lòng thử lại.')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  function handleKeyDown(event) {
    event.stopPropagation()
    if (event.key === 'Escape' && !busy.current) onClose()
    if (event.key !== 'Tab') return
    const buttons = dialogRef.current?.querySelectorAll('button:not(:disabled)')
    if (!buttons?.length) {
      event.preventDefault()
      return
    }
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (!Array.from(buttons).includes(document.activeElement)) {
      event.preventDefault()
      if (event.shiftKey) last.focus()
      else first.focus()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="cancel-order-backdrop" onClick={(event) => {
      event.stopPropagation()
      if (event.target === event.currentTarget && !busy.current) onClose()
    }} onKeyDown={handleKeyDown}>
      <section className="cancel-order-dialog" ref={dialogRef} tabIndex={-1} role="alertdialog" aria-modal="true"
        aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={loading}>
        <button className="cancel-order-close" type="button" onClick={onClose} disabled={loading} aria-label="Đóng xác nhận hủy đơn">
          <X size={19} />
        </button>
        <div className="cancel-order-icon"><AlertTriangle size={26} /></div>
        <h2 id={titleId}>Bạn muốn hủy đơn hàng?</h2>
        <p id={descriptionId}>Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.orderNumber || order.orderCode || `#${order.id}`}</strong> không? Sau khi hủy, bạn sẽ cần đặt lại nếu muốn mua các sản phẩm này.</p>
        {error && <p className="cancel-order-error" role="alert">{error}</p>}
        <div className="cancel-order-actions">
          <button ref={keepButtonRef} type="button" className="cancel-order-keep" onClick={onClose} disabled={loading}>Giữ đơn hàng</button>
          <button type="button" className="cancel-order-confirm" onClick={handleConfirm} disabled={loading}>
            {loading && <LoaderCircle size={16} className="cancel-order-spinner" />}
            {loading ? 'Đang hủy…' : 'Hủy đơn hàng'}
          </button>
        </div>
      </section>
    </div>, document.body
  )
}
