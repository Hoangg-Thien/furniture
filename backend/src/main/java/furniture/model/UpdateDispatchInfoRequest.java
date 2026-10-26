package furniture.model;

/**
 * =====================================================================
 * Request Model: UpdateDispatchInfoRequest
 * Mục đích: Nhận thông tin điều phối kỹ thuật viên, xe tải và lưu ý thi công cho đơn hàng.
 * Sử dụng trong: PUT /api/admin/orders/{id}/dispatch
 * =====================================================================
 */
public class UpdateDispatchInfoRequest {

    /** Tên thợ mộc / kỹ thuật viên trưởng được phân công */
    private String technician;

    /** Biển số xe và loại xe tải giao hàng */
    private String vehicle;

    /** Khung giờ giao hàng dự kiến */
    private String deliveryTime;

    /** Ghi chú hiện trường thi công */
    private String deliveryNotes;

    public UpdateDispatchInfoRequest() {}

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }

    public String getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(String deliveryTime) { this.deliveryTime = deliveryTime; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
}
