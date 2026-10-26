package furniture.model.dashboard;

import java.math.BigDecimal;

public record RevenueChartItemDto(
        String month,
        String monthKey,
        BigDecimal revenue,
        BigDecimal cost,
        BigDecimal profit
) {}
