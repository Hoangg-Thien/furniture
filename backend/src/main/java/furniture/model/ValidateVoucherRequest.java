package furniture.model;

import java.math.BigDecimal;

public record ValidateVoucherRequest(
        String code,
        BigDecimal subtotal) {
}

