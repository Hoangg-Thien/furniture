package furniture.model.admin;

import java.time.Instant;

public record AdminActivityDto(Long id, String actorUsername, String module, Long recordId,
        String title, Instant createdAt) { }
