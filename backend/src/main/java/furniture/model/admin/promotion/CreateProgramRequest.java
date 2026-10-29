package furniture.model.admin.promotion;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateProgramRequest(
        @NotBlank(message = "Tên chương trình khuyến mãi không được để trống")
        String name,

        String description,

        @NotNull(message = "Ngày bắt đầu không được để trống")
        LocalDateTime startDate,

        @NotNull(message = "Ngày kết thúc không được để trống")
        LocalDateTime endDate,

        String status
) {}
