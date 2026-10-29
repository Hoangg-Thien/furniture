package furniture.model.admin.invoice;

import java.math.BigDecimal;

public record InvoiceItemDto(
        Long productId,
        String productName,
        String imageUrl,
        String unit,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal amount
) {
}
