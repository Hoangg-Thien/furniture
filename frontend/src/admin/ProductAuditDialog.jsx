import { useEffect, useRef, useState } from 'react'
import { AlertCircle, History, RefreshCw, X } from 'lucide-react'
import { getApiBaseUrl } from '../lib/apiConfig'
import './ProductAuditDialog.css'

const fields = { name: 'Tên sản phẩm', description: 'Mô tả', category_id: 'Danh mục', unit: 'Đơn vị tính', selling_price: 'Giá bán', quantity: 'Tồn kho', is_active: 'Hiển thị', image_url: 'Ảnh đại diện', images: 'Album ảnh' }
function displayValue(value) {
  if (value == null) return '—'
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
  } catch { return value }
}

export default function ProductAuditDialog({ product, onClose }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const dialog = useRef(null)
  const request = useRef(null)
  const retryCursor = useRef(null)

  async function load(beforeId = null) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    retryCursor.current = beforeId
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/products/${product.id}/audit-log${beforeId == null ? '' : `?beforeId=${beforeId}`}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Không thể tải nhật ký sản phẩm. Vui lòng thử lại.')
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error('Dữ liệu nhật ký không hợp lệ.')
      if (controller.signal.aborted) return
      setEntries(previous => beforeId == null ? data : [...previous, ...data])
      setHasMore(data.length === 50)
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current.querySelector('button').focus()
    load()
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const items = [...dialog.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
        const first = items[0]
        const last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      request.current?.abort()
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [product.id])

  return <div className="admin-modal-backdrop product-audit-backdrop" onClick={onClose}>
    <section ref={dialog} className="admin-modal-card product-audit-dialog" role="dialog" aria-modal="true" aria-labelledby="product-audit-title" onClick={event => event.stopPropagation()}>
      <header className="admin-modal-header">
        <div>
          <h2 id="product-audit-title" className="modal-title"><History size={18} aria-hidden="true" /> Lịch sử thay đổi sản phẩm</h2>
          <p className="modal-subtitle">{product.name} · #{product.id}</p>
        </div>
        <button className="modal-close-btn" aria-label="Đóng lịch sử" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="admin-modal-body product-audit-body" aria-busy={loading}>
        {error && <div className="modal-alert-error" role="alert"><AlertCircle size={18} /><span>{error}</span><button className="admin-btn admin-btn-outline" onClick={() => load(retryCursor.current)}>Thử lại</button></div>}
        {entries.length > 0 && <div className="product-audit-scroll" role="region" aria-label="Các thay đổi sản phẩm" tabIndex={0}>
          <table className="admin-table">
            <thead><tr><th scope="col">Thời gian</th><th scope="col">Người sửa</th><th scope="col">Trường</th><th scope="col">Trước</th><th scope="col">Sau</th></tr></thead>
            <tbody>{entries.map(entry => <tr key={entry.id}>
              <td><time dateTime={entry.changedAt}>{new Date(entry.changedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</time></td>
              <td>{entry.actorUsername}<small>User ID: {entry.actorUserId}</small></td>
              <td>{fields[entry.fieldName] || entry.fieldName}</td>
              <td><pre>{displayValue(entry.oldValue)}</pre></td><td><pre>{displayValue(entry.newValue)}</pre></td>
            </tr>)}</tbody>
          </table>
        </div>}
        {loading && <p className="product-audit-state" role="status"><RefreshCw size={17} className="animate-spin" /> Đang tải nhật ký...</p>}
        {!loading && !error && entries.length === 0 && <p className="product-audit-state">Chưa có thay đổi được ghi nhận từ khi bật nhật ký.</p>}
      </div>
      <footer className="admin-modal-footer">
        <span className="product-audit-count" role="status">Đã tải {entries.length} thay đổi</span>
        <button className="admin-btn admin-btn-outline" disabled={loading} onClick={() => load()}>Làm mới</button>
        {hasMore && <button className="admin-btn admin-btn-primary" disabled={loading} onClick={() => load(entries.at(-1).id)}>Tải thêm</button>}
        <button className="admin-btn admin-btn-outline" onClick={onClose}>Đóng</button>
      </footer>
    </section>
  </div>
}
