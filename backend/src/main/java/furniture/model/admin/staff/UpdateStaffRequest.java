package furniture.model.admin.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateStaffRequest(
    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    String fullName,

    String email,

    @Pattern(regexp = "^(0|\\+84)?[0-9]{9,10}$", message = "Số điện thoại không đúng định dạng (9-10 số)")
    String phone,

    String address
) {}
