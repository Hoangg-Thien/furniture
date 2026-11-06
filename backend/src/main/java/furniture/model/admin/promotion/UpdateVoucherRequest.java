package furniture.model.admin.promotion;

import java.math.BigDecimal;

public record UpdateVoucherRequest(
        BigDecimal discountPercent,
        BigDecimal minimumAmount,
        BigDecimal maximumDiscount,
        Integer quantity,
        String status
) {}

