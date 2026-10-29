package furniture.model.admin.statistics;

import java.math.BigDecimal;

public record DashboardOverviewDto(
        BigDecimal totalRevenue,
        Double revenueGrowthPercent,
        Long completedOrdersCount,
        Double orderCompletionRate,
        Long totalItemsSold,
        Long lowStockProductsCount,
        Long totalCustomersCount,
        BigDecimal totalPurchaseCost,
        BigDecimal grossProfit
) {
}
