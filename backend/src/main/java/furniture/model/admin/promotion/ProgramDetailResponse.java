package furniture.model.admin.promotion;

import java.util.List;

public record ProgramDetailResponse(
        ProgramResponse program,
        List<ProductDiscountDto> productDiscounts,
        List<OrderDiscountDto> orderDiscounts,
        List<VoucherDto> vouchers
) {}
