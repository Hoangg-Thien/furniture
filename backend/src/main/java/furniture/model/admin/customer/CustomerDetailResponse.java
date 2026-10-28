package furniture.model.admin.customer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerDetailResponse(
    Long id,
    Long userId,
    String username,
    String fullName,
    String phone,
    String email,
    String address,
    Long totalOrders,
    Long completedOrders,
    BigDecimal totalSpent,
    String customerTier,
    Boolean isUserActive,
    LocalDateTime createdAt,
    List<CustomerOrderDto> orders,
    List<CustomerCartItemDto> cartItems
) {}
