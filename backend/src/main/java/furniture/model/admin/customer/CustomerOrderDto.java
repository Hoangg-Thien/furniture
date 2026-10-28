package furniture.model.admin.customer;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record CustomerOrderDto(
    Long id,
    String orderDate,
    String status,
    BigDecimal totalAmount,
    BigDecimal discountAmount,
    String voucherCode,
    List<Map<String, Object>> items
) {}
