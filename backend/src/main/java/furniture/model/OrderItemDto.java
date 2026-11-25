package furniture.model;

import java.math.BigDecimal;
import tools.jackson.databind.annotation.JsonDeserialize;
import furniture.util.IntegerQuantityDeserializer;

public record OrderItemDto(
        Long productId,
        @JsonDeserialize(using = IntegerQuantityDeserializer.class) Integer quantity,
        BigDecimal unitPrice) {
}

