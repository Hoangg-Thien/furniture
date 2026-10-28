package furniture.model.admin.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductSummaryDto(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        String unit,
        BigDecimal sellingPrice,
        String imageUrl,
        Integer quantity,
        Boolean isActive,
        LocalDateTime createdAt
) {
}
