package furniture.model.admin.invoice;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInvoiceRequest(
        @NotNull(message = "Mã đơn hàng không được để trống")
        Long orderId,

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        String paymentMethod, // CASH: COD, thu tiền mặt khi giao hàng

        String voucherCode,
        Boolean includeVat,
        BigDecimal vatPercent,
        Long staffId,
        String notes
) {
}
