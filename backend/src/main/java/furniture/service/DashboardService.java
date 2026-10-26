package furniture.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import furniture.model.dashboard.CategoryShareDto;
import furniture.model.dashboard.DashboardOverviewResponse;
import furniture.model.dashboard.DashboardStatsDto;
import furniture.model.dashboard.FinancialReportResponse;
import furniture.model.dashboard.LowStockProductDto;
import furniture.model.dashboard.MonthlyReportDetailDto;
import furniture.model.dashboard.PeriodStatsDto;
import furniture.model.dashboard.RecentOrderDto;
import furniture.model.dashboard.RevenueChartItemDto;
import furniture.repository.DashboardRepository;

@Service
public class DashboardService {

    private final DashboardRepository dashboardRepository;

    public DashboardService(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public DashboardOverviewResponse getDashboardOverview() {
        // 1. Thống kê chung (Overall KPI stats)
        BigDecimal totalRevenue = dashboardRepository.getTotalRevenue();
        long totalOrders = dashboardRepository.getTotalOrders();
        long totalCustomers = dashboardRepository.getTotalCustomers();
        long pendingDeliveries = dashboardRepository.getPendingDeliveries();
        long lowStockCount = dashboardRepository.getLowStockCount(15);

        // 2. Thống kê theo 4 mốc thời gian: TODAY, WEEK, MONTH, YEAR
        Map<String, PeriodStatsDto> periodStatsMap = buildAllPeriodStats(pendingDeliveries, lowStockCount);

        // Lấy tăng trưởng theo tháng cho stats tổng quan
        PeriodStatsDto monthStats = periodStatsMap.get("MONTH");
        double revenueGrowth = monthStats != null ? monthStats.growth() : 18.4;
        double ordersGrowth = monthStats != null ? monthStats.ordersGrowth() : 12.6;
        double customersGrowth = 15.8;

        DashboardStatsDto stats = new DashboardStatsDto(
                totalRevenue,
                revenueGrowth,
                totalOrders,
                ordersGrowth,
                totalCustomers,
                customersGrowth,
                pendingDeliveries,
                lowStockCount
        );

        // 3. Biểu đồ 6 tháng gần nhất (Doanh thu - Vốn - Lãi)
        List<RevenueChartItemDto> revenueChart = dashboardRepository.getMonthlyRevenueAndCost(6);

        // 4. Tỷ trọng doanh thu theo danh mục
        List<CategoryShareDto> categoryShare = dashboardRepository.getCategoryShare();

        // 5. Đơn hàng gần đây
        List<RecentOrderDto> recentOrders = dashboardRepository.getRecentOrders(6);

        // 6. Cảnh báo tồn kho thấp
        List<LowStockProductDto> lowStockProducts = dashboardRepository.getLowStockProducts(5);

        return new DashboardOverviewResponse(
                stats,
                periodStatsMap,
                revenueChart,
                categoryShare,
                recentOrders,
                lowStockProducts
        );
    }

    public PeriodStatsDto getPeriodStats(String period) {
        long pendingDeliveries = dashboardRepository.getPendingDeliveries();
        long lowStockCount = dashboardRepository.getLowStockCount(15);
        return buildPeriodStat(period.toUpperCase(), pendingDeliveries, lowStockCount);
    }

    public FinancialReportResponse getFinancialReports() {
        List<RevenueChartItemDto> chartItems = dashboardRepository.getMonthlyRevenueAndCost(6);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;

        List<MonthlyReportDetailDto> details = new ArrayList<>();

        for (RevenueChartItemDto item : chartItems) {
            BigDecimal rev = item.revenue();
            BigDecimal cost = item.cost();
            BigDecimal profit = item.profit();

            totalRevenue = totalRevenue.add(rev);
            totalCost = totalCost.add(cost);
            totalProfit = totalProfit.add(profit);

            double margin = 0.0;
            if (rev.compareTo(BigDecimal.ZERO) > 0) {
                margin = profit.multiply(new BigDecimal("100"))
                        .divide(rev, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            String performance;
            if (margin >= 42.0) {
                performance = "Vượt chỉ tiêu biên lợi nhuận (Xuất sắc)";
            } else if (margin >= 35.0) {
                performance = "Tăng trưởng ổn định theo kế hoạch";
            } else if (margin > 0) {
                performance = "Cần tối ưu chi phí giá vốn nhập";
            } else {
                performance = "Chưa có phát sinh giao dịch";
            }

            details.add(new MonthlyReportDetailDto(
                    item.month(),
                    rev,
                    cost,
                    profit,
                    margin,
                    performance
            ));
        }

        double overallMargin = 0.0;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            overallMargin = totalProfit.multiply(new BigDecimal("100"))
                    .divide(totalRevenue, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return new FinancialReportResponse(
                totalRevenue,
                totalCost,
                totalProfit,
                overallMargin,
                18.4,
                details
        );
    }

    private Map<String, PeriodStatsDto> buildAllPeriodStats(long pendingDeliveries, long lowStock) {
        Map<String, PeriodStatsDto> map = new LinkedHashMap<>();
        map.put("TODAY", buildPeriodStat("TODAY", pendingDeliveries, lowStock));
        map.put("WEEK", buildPeriodStat("WEEK", pendingDeliveries, lowStock));
        map.put("MONTH", buildPeriodStat("MONTH", pendingDeliveries, lowStock));
        map.put("YEAR", buildPeriodStat("YEAR", pendingDeliveries, lowStock));
        return map;
    }

    private PeriodStatsDto buildPeriodStat(String period, long pendingDeliveries, long lowStock) {
        String curWhere;
        String prevWhere;

        switch (period) {
            case "TODAY":
                curWhere = "order_date >= CURRENT_DATE";
                prevWhere = "order_date >= CURRENT_DATE - INTERVAL '1 day' AND order_date < CURRENT_DATE";
                break;
            case "WEEK":
                curWhere = "order_date >= date_trunc('week', CURRENT_TIMESTAMP)";
                prevWhere = "order_date >= date_trunc('week', CURRENT_TIMESTAMP) - INTERVAL '1 week' AND order_date < date_trunc('week', CURRENT_TIMESTAMP)";
                break;
            case "YEAR":
                curWhere = "order_date >= date_trunc('year', CURRENT_TIMESTAMP)";
                prevWhere = "order_date >= date_trunc('year', CURRENT_TIMESTAMP) - INTERVAL '1 year' AND order_date < date_trunc('year', CURRENT_TIMESTAMP)";
                break;
            case "MONTH":
            default:
                curWhere = "order_date >= date_trunc('month', CURRENT_TIMESTAMP)";
                prevWhere = "order_date >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '1 month' AND order_date < date_trunc('month', CURRENT_TIMESTAMP)";
                break;
        }

        try {
            Map<String, Object> metrics = dashboardRepository.getMetricsByDateRange(curWhere, prevWhere);
            BigDecimal currentRevenue = (BigDecimal) metrics.get("currentRevenue");
            long currentOrders = (Long) metrics.get("currentOrders");
            BigDecimal prevRevenue = (BigDecimal) metrics.get("prevRevenue");
            long prevOrders = (Long) metrics.get("prevOrders");

            double revenueGrowth = calculateGrowth(currentRevenue, prevRevenue);
            double ordersGrowth = calculateOrdersGrowth(currentOrders, prevOrders);

            return new PeriodStatsDto(
                    period,
                    currentRevenue,
                    revenueGrowth,
                    currentOrders,
                    ordersGrowth,
                    pendingDeliveries,
                    lowStock
            );
        } catch (Exception ex) {
            // Trường hợp fallback nếu query khoảng thời gian có lỗi
            return new PeriodStatsDto(
                    period,
                    BigDecimal.ZERO,
                    0.0,
                    0L,
                    0.0,
                    pendingDeliveries,
                    lowStock
            );
        }
    }

    private double calculateGrowth(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .multiply(new BigDecimal("100"))
                .divide(previous, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double calculateOrdersGrowth(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return Math.round(((double) (current - previous) / previous) * 1000.0) / 10.0;
    }
}
