import { useState, useEffect, useRef } from 'react'
import {
  Armchair,
  ArrowRight,
  FileText,
  Receipt,
  Search,
  ShoppingCart,
  Users,
  X
} from 'lucide-react'
import { getApiBaseUrl, getApiHeaders } from '../lib/apiConfig'

export default function AdminGlobalSearchModal({ onClose, onNavigateModule }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const inputRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) return
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      const q = searchTerm.toLowerCase().trim()
      const groups = [[], [], []]
      const sources = [
        { path: 'products', size: 4, map: p => ({
          id: `prod-${p.id}`,
          type: 'products',
          typeLabel: 'Sản phẩm nội thất',
          icon: Armchair,
          title: p.name,
          subtitle: `Mã SP: #${p.id} • Giá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.sellingPrice)}`,
          badge: p.quantity < 5 ? 'Tồn thấp' : 'Còn hàng',
          badgeColor: p.quantity < 5 ? 'danger' : 'success'
        }) },
        { path: 'orders', size: 4, map: o => ({
          id: `ord-${o.id}`,
          type: 'orders',
          typeLabel: 'Đơn đặt hàng',
          icon: ShoppingCart,
          title: `Đơn hàng #${o.id} - ${o.customerName || 'Khách vãng lai'}`,
          subtitle: `SĐT: ${o.phone || '—'} • Ngày: ${o.orderDate ? new Date(o.orderDate).toLocaleDateString('vi-VN') : ''}`,
          badge: o.status,
          badgeColor: o.status === 'COMPLETED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'info'
        }) },
        { path: 'customers', size: 3, map: c => ({
          id: `cust-${c.id}`,
          type: 'customers',
          typeLabel: 'Khách hàng',
          icon: Users,
          title: c.fullName || c.username,
          subtitle: `Email: ${c.email || '—'} • SĐT: ${c.phone || '—'}`,
          badge: c.membershipLevel || 'Thành viên',
          badgeColor: 'primary'
        }) },
      ]
      await Promise.all(sources.map(async (source, index) => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/admin/${source.path}?search=${encodeURIComponent(q)}&page=0&size=${source.size}`, {
            headers: getApiHeaders(), signal: controller.signal,
          })
          if (!response.ok) throw new Error('Search unavailable')
          const data = await response.json()
          if (!Array.isArray(data.content)) throw new Error('Invalid search response')
          if (controller.signal.aborted) return
          groups[index] = data.content.map(source.map)
          setSearchResults(groups.flat())
        } catch {
          if (!controller.signal.aborted) setSearchError(true)
        }
      }))
      if (!controller.signal.aborted) setIsSearching(false)
    }, 250)

    return () => { clearTimeout(timer); controller.abort() }
  }, [searchTerm])

  const handleSearchChange = value => {
    setSearchTerm(value)
    setSearchResults([])
    setSearchError(false)
    setIsSearching(Boolean(value.trim()))
  }

  const handleSelectResult = (item) => {
    onNavigateModule(item.type)
    onClose()
  }

  return (
    <div className="admin-modal-backdrop admin-search-backdrop" onClick={onClose}>
      <div
        className="admin-global-search-modal"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm toàn hệ thống"
        onKeyDown={event => {
          if (event.key === 'Escape') onClose()
          if (event.key !== 'Tab') return
          const controls = dialogRef.current.querySelectorAll('input, button:not([disabled]), [href]')
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first?.focus()
          }
        }}
      >
        <div className="admin-global-search-input-wrap">
          <Search size={20} className="admin-global-search-icon" />
          <input
            ref={inputRef}
            aria-label="Tìm kiếm toàn hệ thống"
            type="text"
            className="admin-global-search-input"
            placeholder="Tìm mã đơn (#101), số điện thoại khách, tên sofa, tủ kệ..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-global-search-clear"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => { handleSearchChange(''); inputRef.current?.focus() }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-global-search-body" aria-busy={isSearching}>
          {searchError && <div className="admin-search-status" role="status">Một số dữ liệu chưa tải được. Vui lòng thử lại.</div>}
          {isSearching && searchResults.length === 0 ? (
            <div className="admin-search-status">Đang tìm kiếm trên hệ thống...</div>
          ) : searchTerm.trim() && searchResults.length === 0 ? (
            !searchError && <div className="admin-search-status">
              Không tìm thấy mục nào khớp với &quot;<strong>{searchTerm}</strong>&quot;
            </div>
          ) : searchResults.length > 0 ? (
            <div className="admin-search-results-list">
              {searchResults.map((item) => {
                const IconComp = item.icon
                return (
                  <button
                    type="button"
                    key={item.id}
                    className="admin-search-result-row"
                    onClick={() => handleSelectResult(item)}
                  >
                    <div className="admin-search-row-icon">
                      <IconComp size={18} />
                    </div>
                    <div className="admin-search-row-info">
                      <div className="admin-search-row-title">
                        <span>{item.title}</span>
                        <span className={`admin-badge admin-badge-${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="admin-search-row-sub">{item.subtitle}</div>
                    </div>
                    <div className="admin-search-row-tag">
                      <span>{item.typeLabel}</span>
                      <ArrowRight size={14} />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="admin-search-shortcuts-hint">
              <div className="admin-search-hint-title">Gợi ý chuyển nhanh module:</div>
              <div className="admin-search-quick-tags">
                <button
                  type="button"
                  className="admin-quick-tag"
                  onClick={() => {
                    onNavigateModule('orders')
                    onClose()
                  }}
                >
                  <ShoppingCart size={14} /> Đơn đặt hàng
                </button>
                <button
                  type="button"
                  className="admin-quick-tag"
                  onClick={() => {
                    onNavigateModule('products')
                    onClose()
                  }}
                >
                  <Armchair size={14} /> Sản phẩm & Kho
                </button>
                <button
                  type="button"
                  className="admin-quick-tag"
                  onClick={() => {
                    onNavigateModule('invoices')
                    onClose()
                  }}
                >
                  <Receipt size={14} /> Hóa đơn bán lẻ
                </button>
                <button
                  type="button"
                  className="admin-quick-tag"
                  onClick={() => {
                    onNavigateModule('reports')
                    onClose()
                  }}
                >
                  <FileText size={14} /> Thống kê báo cáo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-global-search-footer">
          <div className="admin-search-keyboard-hint">
            <span>Dùng phím <kbd>ESC</kbd> để đóng</span>
          </div>
        </div>
      </div>
    </div>
  )
}
