package furniture.model.admin.supplier;

import java.math.BigDecimal;
import java.util.List;

public record CreateReceiptRequest(
        Long staffId,
        String status,
        List<ReceiptItemRequest> items
) {
    public record ReceiptItemRequest(
            Long productId,
            Integer quantity,
            BigDecimal unitPrice
    ) {}
}
