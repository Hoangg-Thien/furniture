package furniture.model.admin.product;

public record ProductImageDto(
        Long id,
        String imageUrl,
        Boolean isPrimary,
        Integer displayOrder
) {
}
