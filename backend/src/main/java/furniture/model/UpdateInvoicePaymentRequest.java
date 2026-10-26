package furniture.model;

/**
 * =====================================================================
 * Request Model: UpdateInvoicePaymentRequest
 * Mục đích: Nhận trạng thái thanh toán mới khi kế toán cập nhật thanh toán cho hóa đơn.
 * Sử dụng trong: PUT /api/admin/invoices/{id}/payment
 * =====================================================================
 */
public class UpdateInvoicePaymentRequest {

    /** Trạng thái thanh toán: 'PAID' (Đã thanh toán), 'PARTIAL_PAID' (Đặt cọc 50%), 'UNPAID' (Chưa thanh toán) */
    private String paymentStatus;

    /** Phương thức thanh toán (VietQR, Tiền mặt, VNPAY...) */
    private String paymentMethod;

    public UpdateInvoicePaymentRequest() {}

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
