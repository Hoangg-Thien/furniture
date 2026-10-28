package furniture.model.admin.invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvoiceSummaryDto(
        Long id,
        String invoiceCode,
        Long orderId,
        Long customerId,
        String customerName,
        String phone,
        LocalDateTime paymentDate,
        String paymentMethod,
        String paymentStatus,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal voucherDiscount,
        BigDecimal taxAmount,
        BigDecimal finalAmount,
        String voucherCode,
        Long staffId,
        String staffName
) {
}
