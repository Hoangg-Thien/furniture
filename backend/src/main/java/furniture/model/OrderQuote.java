package furniture.model;

import java.math.BigDecimal;
import java.util.List;

public record OrderQuote(List<OrderItemDto> items, BigDecimal subtotal, BigDecimal discountAmount,
        BigDecimal shippingFee, BigDecimal totalAmount, Long voucherId, String voucherCode, String discountLabel,
        BigDecimal automaticDiscountAmount, BigDecimal voucherDiscountAmount, String automaticDiscountLabel,
        List<OrderItemDiscount> itemDiscounts, List<OrderItemDiscount> productOffers) {}
