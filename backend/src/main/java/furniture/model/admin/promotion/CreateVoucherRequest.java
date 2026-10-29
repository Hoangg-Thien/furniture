package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateVoucherRequest(
        @NotBlank(message = "Mã voucher không được để trống")
        String code,

        @NotNull(message = "% giảm giá không được để trống")
        @DecimalMin(value = "0.01", message = "% giảm giá phải lớn hơn 0")
        @DecimalMax(value = "100.00", message = "% giảm giá không được vượt quá 100%")
        BigDecimal discountPercent,

        @DecimalMin(value = "0.0", message = "Giá trị đơn tối thiểu phải >= 0")
        BigDecimal minimumAmount,

        BigDecimal maximumDiscount,

        @NotNull(message = "Số lượng phát hành không được để trống")
        @Min(value = 1, message = "Số lượng phát hành phải từ 1 voucher trở lên")
        Integer quantity,

        LocalDateTime startDate,
        LocalDateTime endDate,
        String status
) {}
