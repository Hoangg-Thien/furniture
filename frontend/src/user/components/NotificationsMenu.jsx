import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { fetchOrders } from '../../lib/orders.js'
import { getOrderNotifications, loadReadNotificationIds, saveReadNotificationIds } from '../../lib/notifications.js'

export default function NotificationsMenu({ customerId, onLogin, onOpenOrder }) {
  const storageKey = `funi_notifications_customer_${customerId}`
  const [open, setOpen] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [readIds, setReadIds] = useState(() => loadReadNotificationIds(storageKey))
  const wrapperRef = useRef(null)
  const bellRef = useRef(null)

  useEffect(() => {
    if (!customerId) return
    let cancelled = false
    let fetching = false
    async function load() {
      if (fetching) return
      fetching = true
      setLoading(true)
      try {
        const result = await fetchOrders(customerId)
        if (cancelled) return
        if (!result.error) setOrders(result.orders)
        setError(Boolean(result.error))
      } finally {
        fetching = false
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, 30000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [customerId, refreshVersion])

  useEffect(() => {
    if (!open) return
    function outside(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event) {
      if (event.key === 'Escape') { setOpen(false); bellRef.current?.focus() }
    }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const notifications = getOrderNotifications(orders)
  const unreadCount = notifications.filter(item => !readIds.has(item.id)).length
  function markRead(ids) {
    const next = new Set([...readIds, ...ids])
    setReadIds(next)
    saveReadNotificationIds(storageKey, next)
  }

  return (
    <div className="client-notifications" ref={wrapperRef}>
      <button type="button" className="icon-button" ref={bellRef}
        aria-label={`Thông báo đơn hàng, ${unreadCount} chưa đọc`} aria-expanded={open}
        aria-controls="client-notifications-panel" onClick={() => {
          if (!open) setRefreshVersion(value => value + 1)
          setOpen(value => !value)
        }}>
        <Bell size={20} strokeWidth={1.7} />
        {unreadCount > 0 && <span className="tiny-count">{unreadCount}</span>}
      </button>
      {open && (
        <section className="client-notifications-panel" id="client-notifications-panel" aria-label="Thông báo đơn hàng">
          <header className="client-notifications-header">
            <div><h2>Thông báo</h2><p>Trạng thái mới nhất của các đơn hàng</p></div>
            <button type="button" className="icon-button" aria-label="Đóng thông báo" onClick={() => { setOpen(false); bellRef.current?.focus() }}><X size={18} /></button>
          </header>
          {!customerId ? (
            <div className="client-notifications-status"><p>Đăng nhập để nhận thông báo đơn hàng.</p><button type="button" className="category-chip" onClick={() => { setOpen(false); onLogin() }}>Đăng nhập</button></div>
          ) : (
            <>
              {unreadCount > 0 && <button type="button" className="client-notifications-read" onClick={() => markRead(notifications.map(item => item.id))}>Đánh dấu tất cả đã đọc</button>}
              <div className="client-notifications-list">
                {loading && notifications.length === 0 && <p className="client-notifications-status" role="status">Đang tải thông báo...</p>}
                {error && <p className="client-notifications-status" role="status">Chưa cập nhật được thông báo. Mở lại để thử lại.</p>}
                {!loading && !error && notifications.length === 0 && <p className="client-notifications-status">Chưa có thông báo đơn hàng.</p>}
                {notifications.map(item => (
                  <a key={item.id} className={`client-notification-item ${readIds.has(item.id) ? '' : 'unread'}`}
                    href={`/order-success?id=${encodeURIComponent(item.orderId)}`}
                    onClick={event => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                      event.preventDefault()
                      markRead([item.id]); setOpen(false); onOpenOrder(item.orderId)
                    }}>
                    <strong>{!readIds.has(item.id) && <span className="client-notification-dot" aria-label="Chưa đọc" />}{item.title}</strong>
                    <span>{item.description}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
