package furniture.model.admin.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDetailDto(
        Long id,
        Long customerId,
        String customerName,
        String phone,
        String address,
        Long staffId,
        String staffName,
        LocalDateTime orderDate,
        String status,
        BigDecimal subtotal,
        String voucherCode,
        BigDecimal discountAmount,
        BigDecimal finalTotal,
        List<OrderItemDto> items
) {}
