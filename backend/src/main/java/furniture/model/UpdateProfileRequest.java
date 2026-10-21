package furniture.model;

public record UpdateProfileRequest(
        String fullName,
        String email,
        String phone,
        String address,
        String currentPassword,
        String newPassword) {
}

