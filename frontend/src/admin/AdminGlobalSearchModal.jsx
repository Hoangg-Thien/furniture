import React, { useState, useEffect, useRef } from 'react'
import {
  Armchair,
  ArrowRight,
  Command,
  FileText,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Users,
  X
} from 'lucide-react'

export default function AdminGlobalSearchModal({ isOpen, onClose, onNavigateModule }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setSearchTerm('')
      setSearchResults([])
    }
  }, [isOpen])

  // Mock global search qua các module phổ biến
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const q = searchTerm.toLowerCase().trim()
      const results = []

      try {
        // Tìm nhanh qua products API
        const prodRes = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&page=0&size=4`).then((r) =>
          r.ok ? r.json() : null
        )
        if (prodRes?.content) {
          prodRes.content.forEach((p) => {
            results.push({
              id: `prod-${p.id}`,
              type: 'products',
              typeLabel: 'Sản phẩm nội thất',
              icon: Armchair,
              title: p.name,
              subtitle: `Mã SP: #${p.id} • Giá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}`,
              badge: p.stockQuantity <= 5 ? 'Tồn thấp' : 'Còn hàng',
              badgeColor: p.stockQuantity <= 5 ? 'danger' : 'success'
            })
          })
        }
      } catch (e) {}

      try {
        // Tìm nhanh qua orders API
        const ordRes = await fetch(`/api/admin/orders?search=${encodeURIComponent(q)}&page=0&size=4`).then((r) =>
          r.ok ? r.json() : null
        )
        if (ordRes?.content) {
          ordRes.content.forEach((o) => {
            results.push({
              id: `ord-${o.id}`,
              type: 'orders',
              typeLabel: 'Đơn đặt hàng',
              icon: ShoppingCart,
              title: `Đơn hàng #${o.id} - ${o.customerName || 'Khách vãng lai'}`,
              subtitle: `SĐT: ${o.phone || '—'} • Ngày: ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : ''}`,
              badge: o.status,
              badgeColor: o.status === 'COMPLETED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'info'
            })
          })
        }
      } catch (e) {}

      try {
        // Tìm nhanh qua customers API
        const custRes = await fetch(`/api/admin/customers?search=${encodeURIComponent(q)}&page=0&size=3`).then((r) =>
          r.ok ? r.json() : null
        )
        if (custRes?.content) {
          custRes.content.forEach((c) => {
            results.push({
              id: `cust-${c.id}`,
              type: 'customers',
              typeLabel: 'Khách hàng',
              icon: Users,
              title: c.fullName || c.username,
              subtitle: `Email: ${c.email || '—'} • SĐT: ${c.phone || '—'}`,
              badge: c.membershipLevel || 'Thành viên',
              badgeColor: 'primary'
            })
          })
        }
      } catch (e) {}

      setSearchResults(results)
      setIsSearching(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm])

  if (!isOpen) return null

  const handleSelectResult = (item) => {
    onNavigateModule(item.type)
    onClose()
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-global-search-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-global-search-input-wrap">
          <Search size={20} className="admin-global-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="admin-global-search-input"
            placeholder="Tìm mã đơn (#101), số điện thoại khách, tên sofa, tủ kệ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-global-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-global-search-body">
          {isSearching ? (
            <div className="admin-search-status">Đang tìm kiếm trên hệ thống...</div>
          ) : searchTerm.trim() && searchResults.length === 0 ? (
            <div className="admin-search-status">
              Không tìm thấy mục nào khớp với &quot;<strong>{searchTerm}</strong>&quot;
            </div>
          ) : searchResults.length > 0 ? (
            <div className="admin-search-results-list">
              {searchResults.map((item) => {
                const IconComp = item.icon
                return (
                  <div
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
                  </div>
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
