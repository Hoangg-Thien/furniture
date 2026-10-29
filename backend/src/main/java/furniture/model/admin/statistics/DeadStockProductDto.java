package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record DeadStockProductDto(
        Long productId,
        String productName,
        String imageUrl,
        String unit,
        Integer currentStock,
        BigDecimal sellingPrice,
        Long daysSinceLastSold
) {
}
