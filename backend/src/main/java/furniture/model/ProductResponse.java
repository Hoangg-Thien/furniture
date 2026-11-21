package furniture.model;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String description,
        String category,
        BigDecimal price,
        String imageUrl,
        Integer quantity,
        BigDecimal discountPercent,
        BigDecimal discountedPrice,
        long soldQuantity,
        boolean bestSeller) {
}

