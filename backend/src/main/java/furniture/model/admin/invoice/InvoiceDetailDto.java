package furniture.model.admin.invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceDetailDto(
        Long id,
        String invoiceCode,
        Long orderId,
        Long customerId,
        String customerName,
        String phone,
        String address,
        String email,
        Long staffId,
        String staffName,
        LocalDateTime paymentDate,
        String paymentMethod,
        String paymentStatus,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String voucherCode,
        BigDecimal voucherDiscount,
        BigDecimal taxAmount,
        BigDecimal finalAmount,
        String notes,
        List<InvoiceItemDto> items,
        String qrCodeUrl
) {
}
