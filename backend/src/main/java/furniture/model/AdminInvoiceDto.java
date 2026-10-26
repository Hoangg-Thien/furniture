package furniture.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * =====================================================================
 * DTO: AdminInvoiceDto
 * Mục đích: Đại diện cho Hóa đơn bán lẻ & Chứng từ giao lắp bàn giao nội thất (mẫu in A4).
 * Sử dụng trong: Màn hình "Hóa Đơn & Mẫu In A4" (/admin/invoices)
 * =====================================================================
 */
public class AdminInvoiceDto {

    /** Khóa chính hóa đơn (tương ứng với ID đơn hàng trong cơ sở dữ liệu) */
    private Long id;

    /** Mã số hóa đơn chuẩn kế toán (Ví dụ: INV-2026-00021) */
    private String invoiceNumber;

    /** Mã đơn hàng liên kết (Ví dụ: ORD-2026-0021) */
    private String orderCode;

    /** ID đơn hàng gốc */
    private Long orderId;

    /** Họ tên người mua hàng */
    private String customerName;

    /** Số điện thoại */
    private String phone;

    /** Địa chỉ giao nhận nội thất */
    private String address;

    /** Mã số thuế doanh nghiệp (nếu khách yêu cầu xuất hóa đơn GTGT) */
    private String taxCode;

    /** Tiền hàng trước thuế và giảm giá */
    private BigDecimal subtotal;

    /** Thuế suất VAT (8% theo quy định áp dụng ngành gỗ nội thất) */
    private BigDecimal vatRate;

    /** Tiền thuế giá trị gia tăng GTGT = subtotal * 8% */
    private BigDecimal vatAmount;

    /** Số tiền giảm giá từ voucher */
    private BigDecimal discountAmount;

    /** Tổng số tiền thanh toán thực tế */
    private BigDecimal totalPayment;

    /** Ngày giờ phát hành hóa đơn */
    private String issueDate;

    /** Trạng thái thanh toán: 'PAID' (Đã thanh toán), 'PARTIAL_PAID' (Đã đặt cọc 50%), 'UNPAID' (Chưa thanh toán) */
    private String paymentStatus;

    /** Hình thức thanh toán (VietQR, Tiền mặt, VNPAY...) */
    private String paymentMethod;

    /** Đã in bản A4 biên bản nghiệm thu hay chưa */
    private Boolean printed;

    /** Tên kỹ thuật viên thợ mộc phụ trách bàn giao */
    private String technician;

    /** Chi tiết các dòng sản phẩm trong hóa đơn */
    private List<AdminOrderItemDto> items = new ArrayList<>();

    public AdminInvoiceDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getTaxCode() { return taxCode; }
    public void setTaxCode(String taxCode) { this.taxCode = taxCode; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }

    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTotalPayment() { return totalPayment; }
    public void setTotalPayment(BigDecimal totalPayment) { this.totalPayment = totalPayment; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Boolean getPrinted() { return printed; }
    public void setPrinted(Boolean printed) { this.printed = printed; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public List<AdminOrderItemDto> getItems() { return items; }
    public void setItems(List<AdminOrderItemDto> items) { this.items = items; }
}
