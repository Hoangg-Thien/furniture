package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record CategoryRevenueDto(
        Long categoryId,
        String categoryName,
        BigDecimal totalRevenue,
        Long soldQuantity,
        Double percentage
) {
}
