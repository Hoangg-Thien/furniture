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
        Boolean autoApprove) {
}

