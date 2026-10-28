package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record DailyRevenuePointDto(
        String dateLabel,
        BigDecimal salesRevenue,
        BigDecimal importCost,
        Long ordersCount
) {
}
