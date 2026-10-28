package furniture.model.admin.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderSummaryDto(
        Long id,
        Long customerId,
        String customerName,
        String phone,
        LocalDateTime orderDate,
        Long staffId,
        String staffName,
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        String status,
        Integer totalItemsCount,
        String voucherCode
) {}
