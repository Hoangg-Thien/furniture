package furniture.model.admin.supplier;

import java.math.BigDecimal;

public record PurchaseReceiptItemDto(
        Long receiptId,
        Long productId,
        String productName,
        String unit,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal amount
) {}
