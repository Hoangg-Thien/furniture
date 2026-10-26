package furniture.model.dashboard;

import java.util.List;
import java.util.Map;

public record DashboardOverviewResponse(
        DashboardStatsDto stats,
        Map<String, PeriodStatsDto> periodStats,
        List<RevenueChartItemDto> revenueChart,
        List<CategoryShareDto> categoryShare,
        List<RecentOrderDto> recentOrders,
        List<LowStockProductDto> lowStockProducts
) {}
