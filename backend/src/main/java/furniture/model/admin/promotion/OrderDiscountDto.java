package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderDiscountDto(
        Long id,
        Long promotionProgramId,
        BigDecimal minimumAmount,
        BigDecimal discountPercent,
        LocalDateTime startDate,
        LocalDateTime endDate
) {}
