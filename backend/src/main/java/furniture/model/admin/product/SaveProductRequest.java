package furniture.model.admin.product;

import java.math.BigDecimal;

public record SaveProductRequest(
        String name,
        Long categoryId,
        String unit,
        BigDecimal sellingPrice,
        Integer quantity,
        String description,
        String imageUrl,
        Boolean isActive
) {
}
