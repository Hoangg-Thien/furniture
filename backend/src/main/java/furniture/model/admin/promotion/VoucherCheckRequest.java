package furniture.model.admin.promotion;

import java.util.List;
import furniture.model.OrderItemDto;

public record VoucherCheckRequest(Long customerId, List<OrderItemDto> items) {}
