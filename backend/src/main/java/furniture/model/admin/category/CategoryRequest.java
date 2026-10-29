package furniture.model.admin.category;

public record CategoryRequest(
        String name,
        String description,
        Boolean isActive
) {
    public CategoryRequest(String name, String description) {
        this(name, description, true);
    }
}
