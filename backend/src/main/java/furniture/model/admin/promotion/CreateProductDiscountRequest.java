package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CreateProductDiscountRequest(
        @NotNull(message = "Vui lòng chọn sản phẩm áp dụng giảm giá")
        Long productId,

        @NotNull(message = "% giảm giá không được để trống")
        @DecimalMin(value = "0.01", message = "% giảm giá phải lớn hơn 0")
        @DecimalMax(value = "100.00", message = "% giảm giá không được vượt quá 100%")
        BigDecimal discountPercent,

        LocalDateTime startDate,
        LocalDateTime endDate
) {}
