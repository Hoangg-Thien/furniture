package furniture.model.admin;

public record AdminIdentity(Long userId, Long staffId, String role, String staffType, Long customerId) {
    public static final String ATTRIBUTE = "adminIdentity";
}
