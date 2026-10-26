package furniture.model.dashboard;

import java.math.BigDecimal;

public record RecentOrderDto(
        Long id,
        String orderCode,
        String customerName,
        String phone,
        String address,
        BigDecimal finalAmount,
        String orderStatus,
        String paymentStatus,
        String deliveryStatus,
        String technician,
        String orderDate
) {}
