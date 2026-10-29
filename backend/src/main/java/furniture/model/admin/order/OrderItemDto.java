package furniture.model.admin.order;

import java.math.BigDecimal;

public record OrderItemDto(
        Long productId,
        String productName,
        String imageUrl,
        String unit,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal amount
) {}
