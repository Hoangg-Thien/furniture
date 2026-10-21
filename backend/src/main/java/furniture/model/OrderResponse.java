package furniture.model;

import java.math.BigDecimal;

public record OrderResponse(
        Long orderId,
        String orderCode,
        String status,
        BigDecimal totalAmount,
        String message) {
}

