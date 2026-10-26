package furniture.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * =====================================================================
 * DTO: AdminOrderDto
 * Mục đích: Đại diện cho dữ liệu đơn hàng nội thất và tiến trình điều phối giao lắp.
 * Sử dụng trong: Màn hình "Đơn Hàng & Giao Lắp" (/admin/orders)
 * =====================================================================
 */
public class AdminOrderDto {

    /** Khóa chính đơn hàng trong DB */
    private Long id;

    /** Mã đơn hàng chuẩn hiển thị cho khách và admin (Ví dụ: ORD-2026-0021) */
    private String orderCode;

    /** ID khách hàng */
    private Long customerId;

    /** Họ tên người nhận hàng */
    private String customerName;

    /** Số điện thoại liên hệ */
    private String phone;

    /** Địa chỉ giao hàng và thi công lắp ráp */
    private String address;

    /** Tổng giá trị đơn hàng trước giảm giá */
    private BigDecimal totalAmount;

    /** Số tiền được giảm từ chương trình khuyến mãi/voucher */
    private BigDecimal discountAmount;

    /** Số tiền thực thu sau khi áp dụng voucher = totalAmount - discountAmount */
    private BigDecimal finalAmount;

    /** ID voucher (nếu có) */
    private Long voucherId;

    /** Mã code voucher (Ví dụ: KHAITRUONG5, FUNI500K...) */
    private String voucherCode;

    /** Phương thức thanh toán: 'VietQR / Chuyển khoản', 'COD', 'VNPAY Gateway' */
    private String paymentMethod;

    /** Trạng thái thanh toán: 'PAID' (Đã thanh toán), 'DEPOSIT_50' (Đã đặt cọc 50%), 'UNPAID' (Chưa thanh toán) */
    private String paymentStatus;

    /**
     * Trạng thái tiến trình đơn hàng (Stepper 6 bước):
     * PENDING_CONFIRM (Chờ xác nhận)
     * CONFIRMED (Đã duyệt đơn)
     * PREPARING (Đang soạn kho & đóng kiện gỗ)
     * DELIVERING (Đang vận chuyển xe tải)
     * INSTALLING (Đang lắp ráp tại căn hộ)
     * COMPLETED (Hoàn tất nghiệm thu bàn giao)
     * CANCELLED (Đã hủy đơn hàng)
     */
    private String orderStatus;

    /** Text mô tả chi tiết tiến độ giao nhận cho người điều phối */
    private String deliveryStatus;

    /** Tên thợ mộc / kỹ thuật viên trưởng phụ trách lắp đặt */
    private String technician;

    /** Thông tin xe tải và tài xế chuyên chở nội thất */
    private String vehicle;

    /** Khung giờ hẹn giao lắp (Ví dụ: 14:00 - 16:30 Chiều nay) */
    private String deliveryTime;

    /** Ghi chú đặc biệt cho đội giao lắp (Ví dụ: Nhà có thang máy hàng, cần kê nẹp góc) */
    private String deliveryNotes;

    /** Ngày giờ đặt hàng (định dạng chuỗi YYYY-MM-DD HH:mm:ss) */
    private String createdAt;

    /** Danh sách các sản phẩm nội thất trong đơn hàng */
    private List<AdminOrderItemDto> items = new ArrayList<>();

    /** Nhật ký lịch sử các mốc sự kiện đơn hàng */
    private List<Map<String, String>> timeline = new ArrayList<>();

    public AdminOrderDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    public Long getVoucherId() { return voucherId; }
    public void setVoucherId(Long voucherId) { this.voucherId = voucherId; }

    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }

    public String getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(String deliveryTime) { this.deliveryTime = deliveryTime; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<AdminOrderItemDto> getItems() { return items; }
    public void setItems(List<AdminOrderItemDto> items) { this.items = items; }

    public List<Map<String, String>> getTimeline() { return timeline; }
    public void setTimeline(List<Map<String, String>> timeline) { this.timeline = timeline; }
}
