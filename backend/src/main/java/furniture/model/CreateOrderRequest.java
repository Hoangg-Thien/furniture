package furniture.model;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        Long customerId,
        Long userId,
        String fullName,
        String phone,
        String address,
        String ward,
        String district,
        String city,
        BigDecimal totalAmount,
        Long voucherId,
        BigDecimal discountAmount,
        List<OrderItemDto> items) {
}

