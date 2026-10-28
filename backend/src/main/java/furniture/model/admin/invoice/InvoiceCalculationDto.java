package furniture.model.admin.invoice;

import java.math.BigDecimal;

public record InvoiceCalculationDto(
        Long orderId,
        BigDecimal originalSubtotal,
        BigDecimal orderDiscount,
        BigDecimal voucherDiscount,
        String voucherCode,
        boolean voucherValid,
        String voucherMessage,
        boolean includeVat,
        BigDecimal vatPercent,
        BigDecimal vatAmount,
        BigDecimal finalAmount
) {
}
