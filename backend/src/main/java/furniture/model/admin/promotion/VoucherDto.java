package furniture.model.admin.promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VoucherDto(
        Long id,
        Long promotionProgramId,
        String programName,
        String code,
        BigDecimal discountPercent,
        BigDecimal minimumAmount,
        BigDecimal maximumDiscount,
        Integer quantity,
        Integer usedQuantity,
        Integer remainingQuantity,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String status,
        Boolean isExpired,
        String voucherType,
        Long productId,
        boolean archived,
        int ordersCount,
        String customerTier
) {
    public VoucherDto(Long id, Long promotionProgramId, String programName, String code, BigDecimal discountPercent,
            BigDecimal minimumAmount, BigDecimal maximumDiscount, Integer quantity, Integer usedQuantity,
            Integer remainingQuantity, LocalDateTime startDate, LocalDateTime endDate, String status, Boolean isExpired,
            String voucherType, Long productId, boolean archived, int ordersCount) {
        this(id, promotionProgramId, programName, code, discountPercent, minimumAmount, maximumDiscount, quantity,
                usedQuantity, remainingQuantity, startDate, endDate, status, isExpired, voucherType, productId, archived, ordersCount, "VIP_DIAMOND");
    }
    public VoucherDto(Long id, Long promotionProgramId, String programName, String code, BigDecimal discountPercent,
            BigDecimal minimumAmount, BigDecimal maximumDiscount, Integer quantity, Integer usedQuantity,
            Integer remainingQuantity, LocalDateTime startDate, LocalDateTime endDate, String status, Boolean isExpired,
            String voucherType, Long productId) {
        this(id, promotionProgramId, programName, code, discountPercent, minimumAmount, maximumDiscount, quantity,
                usedQuantity, remainingQuantity, startDate, endDate, status, isExpired, voucherType, productId, false, 0);
    }
    public VoucherDto(Long id, Long promotionProgramId, String programName, String code, BigDecimal discountPercent,
            BigDecimal minimumAmount, BigDecimal maximumDiscount, Integer quantity, Integer usedQuantity,
            Integer remainingQuantity, LocalDateTime startDate, LocalDateTime endDate, String status, Boolean isExpired) {
        this(id, promotionProgramId, programName, code, discountPercent, minimumAmount, maximumDiscount, quantity,
                usedQuantity, remainingQuantity, startDate, endDate, status, isExpired, "ORDER", null);
    }
}
