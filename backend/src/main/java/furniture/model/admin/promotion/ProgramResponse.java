package furniture.model.admin.promotion;

import java.time.LocalDateTime;

public record ProgramResponse(
        Long id,
        String name,
        String description,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String status,
        Integer productDiscountsCount,
        Integer orderDiscountsCount,
        Integer vouchersCount,
        Boolean isCurrentlyRunning
) {
    public ProgramResponse(Long id, String name, String description, LocalDateTime startDate, LocalDateTime endDate, String status) {
        this(id, name, description, startDate, endDate, status, 0, 0, 0, false);
    }
}
