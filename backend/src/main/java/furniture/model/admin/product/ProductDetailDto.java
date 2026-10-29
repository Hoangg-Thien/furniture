package furniture.model.admin.product;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailDto(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        String unit,
        BigDecimal sellingPrice,
        String imageUrl,
        Integer quantity,
        Boolean isActive,
        String description,
        List<ProductImageDto> images
) {
}
