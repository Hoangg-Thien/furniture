package furniture.model;

import java.math.BigDecimal;

public record OrderItemDiscount(Long productId, BigDecimal originalAmount, BigDecimal discountAmount,
        BigDecimal finalAmount, String label) {}
