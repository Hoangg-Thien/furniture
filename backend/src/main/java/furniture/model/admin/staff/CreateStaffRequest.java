package furniture.model.admin.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 50, message = "Tên đăng nhập từ 4 đến 50 ký tự")
    String username,

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    String password,

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    String fullName,

    String email,

    @Pattern(regexp = "^(0|\\+84)?[0-9]{9,10}$", message = "Số điện thoại không đúng định dạng (9-10 số)")
    String phone,

    String address
) {}
