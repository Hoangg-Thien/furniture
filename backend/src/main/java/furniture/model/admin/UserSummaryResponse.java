package furniture.model.admin;

import java.time.LocalDateTime;

public record UserSummaryResponse(
    Long id,
    String username,
    String role,
    Boolean isActive,
    LocalDateTime createdAt
) {}
