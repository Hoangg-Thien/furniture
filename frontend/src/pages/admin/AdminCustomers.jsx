import React, { useState } from 'react'
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  DollarSign,
  ShoppingBag,
} from 'lucide-react'
import { MOCK_CUSTOMERS } from './adminMockData'

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function AdminCustomers({ showToast }) {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Quản lý Khách hàng FurniStore</h1>
          <p className="admin-page-subtitle">
            Hồ sơ khách hàng, địa chỉ giao lắp nội thất mặc định, tích lũy điểm và phân hạng thành viên.
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-table-filters" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--admin-text-dim)' }} />
              <input
                type="text"
                className="admin-filter-input"
                style={{ width: '100%' }}
                placeholder="Tìm tên khách hàng, số điện thoại, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-dim)' }}>
              Tổng số khách hàng: <strong>{customers.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Liên Hệ (SĐT / Email)</th>
                <th>Địa Chỉ Giao Lắp Mặc Định</th>
                <th>Tổng Chi Tiêu</th>
                <th>Số Đơn Đã Mua</th>
                <th>Hạng Thành Viên</th>
                <th>Ngày Gia Nhập</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{c.fullName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-dim)' }}>Mã KH: #{c.id}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{c.phone}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-dim)' }}>{c.email}</div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                      {c.address}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#FBBF24' }}>
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td>
                    <span className="admin-badge info">{c.orderCount} đơn</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${c.tier === 'DIAMOND' ? 'warning' : c.tier === 'GOLD' ? 'warning' : 'neutral'}`}>
                      <Award size={12} /> {c.tier}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--admin-text-dim)' }}>{c.joinedDate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
