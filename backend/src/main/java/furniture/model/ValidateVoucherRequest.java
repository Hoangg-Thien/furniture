package furniture.model;

import java.math.BigDecimal;

public record ValidateVoucherRequest(
        String code,
        BigDecimal subtotal,
        java.util.List<OrderItemDto> items) {
    public ValidateVoucherRequest(String code, BigDecimal subtotal) {
        this(code, subtotal, null);
    }
}

