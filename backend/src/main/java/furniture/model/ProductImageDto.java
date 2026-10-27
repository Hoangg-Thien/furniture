package furniture.model;

public record ProductImageDto(
        Long id,
        Long productId,
        String imageUrl,
        Boolean isPrimary,
        Integer displayOrder) {
}
