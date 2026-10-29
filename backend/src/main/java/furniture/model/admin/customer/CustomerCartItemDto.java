package furniture.model.admin.customer;

import java.math.BigDecimal;

public record CustomerCartItemDto(
    Long productId,
    String productName,
    String productUnit,
    BigDecimal unitPrice,
    String imageUrl,
    Integer quantity,
    BigDecimal amount
) {}
