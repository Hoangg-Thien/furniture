package furniture.model;

import java.math.BigDecimal;
import java.util.stream.Stream;

public final class OrderAmounts {
    public static final BigDecimal STANDARD_SHIPPING_FEE = BigDecimal.valueOf(35_000);

    private OrderAmounts() {}

    public static BigDecimal shippingFee(BigDecimal beforeDiscount, Stream<BigDecimal> amounts) {
        var lines = amounts.toList();
        if (beforeDiscount == null || lines.isEmpty() || lines.stream().anyMatch(java.util.Objects::isNull)) return null;
        BigDecimal remainder = beforeDiscount.subtract(lines.stream().reduce(BigDecimal.ZERO, BigDecimal::add));
        // shortcut: historical orders lack a fee field, split only amounts matching the supported tariff.
        return remainder.signum() == 0 || remainder.compareTo(STANDARD_SHIPPING_FEE) == 0 ? remainder : null;
    }
}
