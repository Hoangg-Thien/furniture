package furniture.model;

import java.math.BigDecimal;

public record CreateVoucherRequest(
        String programName,
        String description,
        String code,
        BigDecimal discountPercent,
        BigDecimal minimumAmount,
        BigDecimal maximumDiscount,
        Integer quantity,
        String startDate,
        String endDate,
        Boolean autoApprove, String customerTier) {
    public CreateVoucherRequest {
        customerTier = customerTier == null ? "VIP_DIAMOND" : customerTier.trim().toUpperCase(java.util.Locale.ROOT);
    }
    public CreateVoucherRequest(String programName, String description, String code, BigDecimal discountPercent,
            BigDecimal minimumAmount, BigDecimal maximumDiscount, Integer quantity, String startDate, String endDate, Boolean autoApprove) {
        this(programName, description, code, discountPercent, minimumAmount, maximumDiscount, quantity, startDate, endDate, autoApprove, "VIP_DIAMOND");
    }
}

