package furniture.model.dashboard;

import java.math.BigDecimal;

public record LowStockProductDto(
        Long id,
        String code,
        String name,
        String category,
        String description,
        BigDecimal costPrice,
        BigDecimal basePrice,
        int totalStock,
        String unit,
        String imageUrl
) {}
