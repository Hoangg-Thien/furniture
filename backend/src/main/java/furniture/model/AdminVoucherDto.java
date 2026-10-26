package furniture.model;

import java.math.BigDecimal;

/**
 * =====================================================================
 * DTO: AdminVoucherDto
 * Mục đích: Đại diện cho chương trình khuyến mãi và mã voucher giảm giá nội thất.
 * Sử dụng trong: Màn hình "Khuyến Mãi & Voucher" (/admin/promotions)
 * =====================================================================
 */
public class AdminVoucherDto {

    /** Khóa chính voucher trong database */
    private Long id;

    /** Mã voucher viết hoa (Ví dụ: FURNI2026, VIPSOFA, THANG10...) */
    private String code;

    /** ID chương trình khuyến mãi gốc */
    private Long programId;

    /** Tên chương trình ưu đãi (Ví dụ: Mừng Năm Mới FurniStore 2026) */
    private String programName;

    /** Mô tả chi tiết thể lệ chương trình */
    private String description;

    /** Tỷ lệ giảm giá (%) */
    private BigDecimal discountPercent;

    /** Giá trị đơn hàng tối thiểu để được áp dụng voucher */
    private BigDecimal minimumAmount;

    /** Số tiền giảm giá tối đa (trần giảm giá) */
    private BigDecimal maximumDiscount;

    /** Tổng số lượng voucher phát hành */
    private Integer quantity;

    /** Số lượng voucher đã được khách hàng sử dụng */
    private Integer usedQuantity;

    /** Số lượng voucher còn lại có thể sử dụng = quantity - usedQuantity */
    private Integer remainingQuantity;

    /** Ngày bắt đầu hiệu lực (YYYY-MM-DD) */
    private String startDate;

    /** Ngày hết hạn (YYYY-MM-DD) */
    private String endDate;

    /** Trạng thái voucher: 'ACTIVE', 'PAUSED', 'EXPIRED', 'INACTIVE' */
    private String status;

    /** Trạng thái phê duyệt: 'APPROVED', 'PENDING_APPROVAL', 'REJECTED' */
    private String approvalState;

    public AdminVoucherDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getProgramId() { return programId; }
    public void setProgramId(Long programId) { this.programId = programId; }

    public String getProgramName() { return programName; }
    public void setProgramName(String programName) { this.programName = programName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getMinimumAmount() { return minimumAmount; }
    public void setMinimumAmount(BigDecimal minimumAmount) { this.minimumAmount = minimumAmount; }

    public BigDecimal getMaximumDiscount() { return maximumDiscount; }
    public void setMaximumDiscount(BigDecimal maximumDiscount) { this.maximumDiscount = maximumDiscount; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getUsedQuantity() { return usedQuantity; }
    public void setUsedQuantity(Integer usedQuantity) { this.usedQuantity = usedQuantity; }

    public Integer getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(Integer remainingQuantity) { this.remainingQuantity = remainingQuantity; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getApprovalState() { return approvalState; }
    public void setApprovalState(String approvalState) { this.approvalState = approvalState; }
}
