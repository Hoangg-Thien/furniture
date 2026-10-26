package furniture.model;

public record LoginRequest(
        String username,
        String password,
        String portal) {

    public LoginRequest(String username, String password) {
        this(username, password, "CLIENT");
    }
}


