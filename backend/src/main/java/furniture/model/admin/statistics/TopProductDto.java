package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record TopProductDto(
        Long productId,
        String productName,
        String imageUrl,
        String unit,
        Long soldQuantity,
        BigDecimal totalRevenue,
        Integer currentStock
) {
}
