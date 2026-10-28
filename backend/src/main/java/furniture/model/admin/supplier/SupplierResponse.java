package furniture.model.admin.supplier;

import java.math.BigDecimal;

public record SupplierResponse(
        Long id,
        String name,
        String phone,
        String email,
        String address,
        Long totalReceiptsCount,
        BigDecimal totalReceiptValue
) {
    public SupplierResponse(Long id, String name, String phone, String email, String address, Long totalReceiptsCount) {
        this(id, name, phone, email, address, totalReceiptsCount, BigDecimal.ZERO);
    }
}
