package furniture.model.admin.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCustomerRequest(
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    String fullName,

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    String phone,

    @Size(max = 150, message = "Email tối đa 150 ký tự")
    String email,

    String address
) {}
