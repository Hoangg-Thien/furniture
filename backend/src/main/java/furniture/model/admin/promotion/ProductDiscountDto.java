package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDiscountDto(
        Long id,
        Long promotionProgramId,
        Long productId,
        String productName,
        String productImageUrl,
        String unit,
        BigDecimal sellingPrice,
        BigDecimal discountPercent,
        BigDecimal discountedPrice,
        LocalDateTime startDate,
        LocalDateTime endDate
) {}
