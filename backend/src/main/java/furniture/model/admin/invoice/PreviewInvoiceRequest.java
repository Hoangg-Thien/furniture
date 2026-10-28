package furniture.model.admin.invoice;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;

public record PreviewInvoiceRequest(
        @NotNull(message = "Mã đơn hàng không được để trống")
        Long orderId,

        String voucherCode,
        Boolean includeVat,
        BigDecimal vatPercent
) {
}
