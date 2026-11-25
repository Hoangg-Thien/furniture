package furniture.model.admin.supplier;

import java.math.BigDecimal;
import java.util.List;
import tools.jackson.databind.annotation.JsonDeserialize;
import furniture.util.IntegerQuantityDeserializer;

public record CreateReceiptRequest(
        Long staffId,
        String status,
        List<ReceiptItemRequest> items
) {
    public record ReceiptItemRequest(
            Long productId,
            @JsonDeserialize(using = IntegerQuantityDeserializer.class) Integer quantity,
            BigDecimal unitPrice
    ) {}

}
