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
        String message,
        String accessToken) {
    public AuthResponse withAccessToken(String token) {
        return new AuthResponse(userId, customerId, username, fullName, email, phone, address, role, message, token);
    }
}

