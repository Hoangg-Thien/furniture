package furniture.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvoiceResponse(
        Long id,
        String invoiceCode,
        Long orderId,
        Long customerId,
        String customerName,
        Long staffId,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String voucherCode,
        BigDecimal voucherDiscount,
        BigDecimal taxAmount,
        BigDecimal finalAmount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime paymentDate,
        String notes) {
}
