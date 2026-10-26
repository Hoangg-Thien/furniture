package furniture.model.dashboard;

import java.math.BigDecimal;

public record PeriodStatsDto(
        String period,
        BigDecimal revenue,
        double growth,
        long orders,
        double ordersGrowth,
        long pendingDeliveries,
        long lowStock
) {}
