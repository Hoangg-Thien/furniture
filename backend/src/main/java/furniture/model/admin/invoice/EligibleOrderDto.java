package furniture.model.admin.invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EligibleOrderDto(
        Long orderId,
        String customerName,
        String phone,
        LocalDateTime orderDate,
        String status,
        BigDecimal totalAmount,
        Integer totalItemsCount
) {
}
