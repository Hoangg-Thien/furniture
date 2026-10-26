package furniture.model.dashboard;

import java.math.BigDecimal;

public record CategoryShareDto(
        String category,
        double percentage,
        BigDecimal revenue,
        long count
) {}
