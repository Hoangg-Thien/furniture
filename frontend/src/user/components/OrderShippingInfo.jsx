import { Truck } from 'lucide-react'
import { getDeliveryEstimate } from '../lib/delivery.js'

const formatDate = date => new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC' }).format(new Date(date))

export default function OrderShippingInfo({ order }) {
  if (order.status !== 'CONFIRMED' && order.status !== 'SHIPPING') return null
  const address = order.shippingInfo?.address || order.address || ''
  const estimate = getDeliveryEstimate(order.approved_at, address)
  return (
    <section className="order-shipping-info" aria-label="Thông tin vận chuyển">
      <h3><Truck size={18} /> Thông tin vận chuyển</h3>
      <p>{order.status === 'SHIPPING' ? 'Đơn hàng đang được vận chuyển.' : 'Đơn đã được duyệt, đang chuẩn bị bàn giao vận chuyển.'}</p>
      <p><strong>Xuất phát:</strong> TP. Hồ Chí Minh</p>
      <p><strong>Giao đến:</strong> {address || 'Chưa có địa chỉ nhận hàng'}</p>
      {estimate ? (
        <>
          <p><strong>Dự kiến giao:</strong> {formatDate(estimate.from)} – {formatDate(estimate.to)}</p>
          <p>{estimate.region} · {estimate.days[0]}–{estimate.days[1]} ngày kể từ khi duyệt đơn. Đây là thời gian ước tính.</p>
        </>
      ) : <p>Chưa đủ thông tin để dự kiến ngày giao. Vui lòng liên hệ cửa hàng để được hỗ trợ.</p>}
      <p className="order-shipping-note"><strong>Lưu ý:</strong> Khách hàng vui lòng chú ý điện thoại để nhận hàng đúng thời hạn.</p>
    </section>
  )
}
