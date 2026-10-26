package furniture.model.dashboard;

import java.math.BigDecimal;

public record DashboardStatsDto(
        BigDecimal totalRevenue,
        double revenueGrowth,
        long totalOrders,
        double ordersGrowth,
        long totalCustomers,
        double customersGrowth,
        long pendingDeliveries,
        long lowStockAlerts
) {}
