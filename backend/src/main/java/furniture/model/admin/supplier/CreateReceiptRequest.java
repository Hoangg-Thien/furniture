package furniture.model.admin.supplier;

import java.math.BigDecimal;
import java.util.List;
import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

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

    public static class IntegerQuantityDeserializer extends JsonDeserializer<Integer> {
        @Override
        public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            if (!parser.isExpectedNumberIntToken()) {
                return (Integer) context.handleUnexpectedToken(Integer.class, parser);
            }
            return parser.getIntValue();
        }
    }
}
