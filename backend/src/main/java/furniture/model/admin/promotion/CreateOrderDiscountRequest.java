package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CreateOrderDiscountRequest(
        @NotNull(message = "Mức đơn hàng tối thiểu không được để trống")
        @DecimalMin(value = "0.0", message = "Mức đơn hàng tối thiểu phải lớn hơn hoặc bằng 0")
        BigDecimal minimumAmount,

        @NotNull(message = "% chiết khấu không được để trống")
        @DecimalMin(value = "0.01", message = "% chiết khấu phải lớn hơn 0")
        @DecimalMax(value = "100.00", message = "% chiết khấu không được vượt quá 100%")
        BigDecimal discountPercent,

        LocalDateTime startDate,
        LocalDateTime endDate
) {}
