package furniture.model;

/**
 * =====================================================================
 * Request Model: UpdateOrderStatusRequest
 * Mục đích: Nhận dữ liệu khi Admin chuyển trạng thái quy trình đơn hàng (Stepper 6 bước).
 * Sử dụng trong: PUT /api/admin/orders/{id}/status
 * =====================================================================
 */
public class UpdateOrderStatusRequest {

    /** Trạng thái mới: PENDING_CONFIRM, CONFIRMED, PREPARING, DELIVERING, INSTALLING, COMPLETED, CANCELLED */
    private String nextStatus;

    /** Chuỗi văn bản hiển thị tiến độ giao lắp (Ví dụ: "Xe tải trên đường giao", "Đang lắp ráp tại phòng ngủ...") */
    private String deliveryStatusText;

    /** Ghi chú bổ sung trong nhật ký timeline */
    private String note;

    public UpdateOrderStatusRequest() {}

    public String getNextStatus() { return nextStatus; }
    public void setNextStatus(String nextStatus) { this.nextStatus = nextStatus; }

    public String getDeliveryStatusText() { return deliveryStatusText; }
    public void setDeliveryStatusText(String deliveryStatusText) { this.deliveryStatusText = deliveryStatusText; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
