package furniture.model;

public record RegisterRequest(
        String username,
        String password,
        String fullName,
        String email,
        String phone,
        String address) {
}

