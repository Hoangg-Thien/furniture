package furniture.model.admin.invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import furniture.model.OrderAmounts;

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
    public BigDecimal getShippingFee() {
        return items == null ? null : OrderAmounts.shippingFee(subtotalAmount, items.stream().map(InvoiceItemDto::amount));
    }

    public BigDecimal getMerchandiseSubtotal() {
        BigDecimal fee = getShippingFee();
        return fee == null ? null : subtotalAmount.subtract(fee);
    }
}
