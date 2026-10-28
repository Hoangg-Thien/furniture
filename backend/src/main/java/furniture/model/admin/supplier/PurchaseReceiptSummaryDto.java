package furniture.model.admin.supplier;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseReceiptSummaryDto(
        Long id,
        Long supplierId,
        Long staffId,
        String staffName,
        LocalDateTime receiptDate,
        String status,
        BigDecimal totalAmount,
        Integer totalItemsCount
) {}
