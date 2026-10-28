package furniture.model.admin.staff;

import java.time.LocalDateTime;

public record StaffSummaryDto(
    Long id,
    Long userId,
    String username,
    String fullName,
    String phone,
    String email,
    String address,
    Long handledOrdersCount,
    Long receiptsCount,
    Boolean isActive,
    LocalDateTime createdAt
) {}
