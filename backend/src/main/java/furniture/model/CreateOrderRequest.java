package furniture.model;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        Long customerId,
        Long userId,
        String fullName,
        String phone,
        String address,
        String ward,
        String district,
        String city,
        BigDecimal totalAmount,
        Long voucherId,
        BigDecimal discountAmount,
        List<OrderItemDto> items,
        Boolean preferProductDiscounts,
        String checkoutKey) {
    public CreateOrderRequest {
        preferProductDiscounts = Boolean.TRUE.equals(preferProductDiscounts);
    }
    public CreateOrderRequest(Long customerId, Long userId, String fullName, String phone, String address,
            String ward, String district, String city, BigDecimal totalAmount, Long voucherId,
            BigDecimal discountAmount, List<OrderItemDto> items, Boolean preferProductDiscounts) {
        this(customerId, userId, fullName, phone, address, ward, district, city, totalAmount, voucherId, discountAmount,
                items, preferProductDiscounts, null);
    }
    public CreateOrderRequest(Long customerId, Long userId, String fullName, String phone, String address,
            String ward, String district, String city, BigDecimal totalAmount, Long voucherId,
            BigDecimal discountAmount, List<OrderItemDto> items) {
        this(customerId, userId, fullName, phone, address, ward, district, city, totalAmount, voucherId, discountAmount, items, false, null);
    }
}

