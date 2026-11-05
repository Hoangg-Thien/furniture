package furniture.model.admin.product;

import java.time.Instant;

public record ProductAuditDto(Long id, Long actorUserId, String actorUsername, String fieldName,
        String oldValue, String newValue, Instant changedAt) {}
