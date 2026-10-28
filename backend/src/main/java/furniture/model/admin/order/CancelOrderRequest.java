package furniture.model.admin.order;

import jakarta.validation.constraints.NotBlank;

public record CancelOrderRequest(
        @NotBlank(message = "Vui lòng nhập lý do hủy đơn hàng")
        String reason
) {}
