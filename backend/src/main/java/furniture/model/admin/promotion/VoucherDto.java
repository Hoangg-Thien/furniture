package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VoucherDto(
        Long id,
        Long promotionProgramId,
        String programName,
        String code,
        BigDecimal discountPercent,
        BigDecimal minimumAmount,
        BigDecimal maximumDiscount,
        Integer quantity,
        Integer usedQuantity,
        Integer remainingQuantity,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String status,
        Boolean isExpired
) {}
