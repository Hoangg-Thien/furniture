package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record VoucherReportDto(
        Long voucherId,
        String voucherCode,
        String programName,
        BigDecimal discountPercent,
        Integer usedQuantity,
        Integer totalQuantity,
        BigDecimal totalDiscountGiven
) {
}
