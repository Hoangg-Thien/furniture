package furniture.model.admin.order;

import jakarta.validation.constraints.NotNull;

public record ConfirmOrderRequest(
        @NotNull(message = "Vui lòng chọn nhân viên phụ trách điều phối & lắp đặt")
        Long staffId,

        String notes
) {}
