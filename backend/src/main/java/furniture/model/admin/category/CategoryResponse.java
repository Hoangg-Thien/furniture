package furniture.model.admin.category;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        Long productCount,
        Boolean isActive
) {
    public CategoryResponse(Long id, String name, String description, Long productCount) {
        this(id, name, description, productCount, true);
    }
}
