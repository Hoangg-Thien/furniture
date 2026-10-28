package furniture.model.admin.supplier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SupplierRequest(
        @NotBlank(message = "Tên nhà cung cấp / xưởng không được để trống")
        String name,

        @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84)")
        String phone,

        String email,

        String address
) {}
