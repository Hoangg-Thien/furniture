package furniture.model.dashboard;

import java.math.BigDecimal;

public record MonthlyReportDetailDto(
        String month,
        BigDecimal revenue,
        BigDecimal cost,
        BigDecimal profit,
        double margin,
        String performance
) {}
