package furniture.model.admin.customer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerTableItemDto(
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
    LocalDateTime createdAt
) {}
