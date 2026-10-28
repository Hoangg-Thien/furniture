package furniture.model.admin.invoice;

import java.math.BigDecimal;

public record InvoiceStatusCountDto(
        long total,
        BigDecimal totalRevenue,
        long cashCount,
        long bankTransferCount,
        long posCardCount,
        long eWalletCount,
        long paidCount,
        long refundedCount
) {
}
