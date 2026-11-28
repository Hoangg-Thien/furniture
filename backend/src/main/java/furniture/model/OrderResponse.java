package furniture.model;

import java.math.BigDecimal;
import java.util.List;

public record OrderResponse(
        Long orderId,
        String orderCode,
        String status,
        BigDecimal totalAmount,
        String message,
        String guestToken,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal shippingFee,
        List<OrderItemDto> items,
        Long voucherId,
        String voucherCode,
        String discountLabel) {
    public OrderResponse withGuestToken(String token) {
        return new OrderResponse(orderId, orderCode, status, totalAmount, message, token, subtotal, discountAmount,
                shippingFee, items, voucherId, voucherCode, discountLabel);
    }
}

