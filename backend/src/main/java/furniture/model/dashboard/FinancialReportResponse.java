package furniture.model.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record FinancialReportResponse(
        BigDecimal totalRevenue,
        BigDecimal totalCost,
        BigDecimal totalProfit,
        double profitMargin,
        double revenueGrowth,
        List<MonthlyReportDetailDto> monthlyDetails
) {}
