package furniture.model;

public record AuthResponse(
        Long userId,
        Long customerId,
        String username,
        String fullName,
        String email,
        String phone,
        String address,
        String role,
        String message) {
}

