package furniture.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.CreateVoucherRequest;
import furniture.model.ValidateVoucherRequest;
import furniture.repository.VoucherRepository;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public List<Map<String, Object>> getActiveVouchers(Long customerId) {
        String tier = voucherRepository.findCustomerTier(customerId);
        return getActiveVouchers().stream().filter(v -> !"VIP".equals(v.get("voucher_type"))
                || v.getOrDefault("customer_tier", "VIP_DIAMOND").equals(tier)).toList();
    }

    public List<Map<String, Object>> getActiveVouchers() {
        return voucherRepository.findActiveVouchers();
    }

    public List<Map<String, Object>> getAllVouchersForAdmin() {
        return voucherRepository.findAllVouchersForAdmin();
    }

    @Transactional
    public boolean approveVoucher(Long id) {
        voucherRepository.approveProgramByVoucherId(id);
        int updatedVch = voucherRepository.approveVoucher(id);
        return updatedVch > 0;
    }

    @Transactional
    public void rejectVoucher(Long id) {
        voucherRepository.rejectProgramByVoucherId(id);
        voucherRepository.rejectVoucher(id);
    }

    @Transactional
    public Map<String, Object> createVoucher(CreateVoucherRequest req) {
        if (req == null || req.code() == null || req.code().trim().isEmpty() || req.code().trim().length() > 50) {
            throw new IllegalArgumentException("Mã voucher không được để trống");
        }
        if (req.discountPercent() == null || req.discountPercent().compareTo(BigDecimal.ZERO) <= 0
                || req.discountPercent().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Phần trăm giảm giá phải từ 1 đến 100");
        }

        if (!List.of("SILVER", "GOLD", "VIP_DIAMOND").contains(req.customerTier()))
            throw new IllegalArgumentException("Hạng khách hàng không hợp lệ");
        String cleanCode = req.code().trim().toUpperCase();
        if (voucherRepository.countByCode(cleanCode) > 0) {
            throw new IllegalArgumentException("Mã voucher '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String progName = (req.programName() != null && !req.programName().trim().isEmpty())
                ? req.programName().trim()
                : "Chương trình ưu đãi " + cleanCode;
        String progDesc = (req.description() != null) ? req.description().trim() : "";
        String initialStatus = "DRAFT";

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime start;
        LocalDateTime end;
        try {
            start = req.startDate() == null || req.startDate().isBlank() ? today.atStartOfDay()
                    : LocalDateTime.parse(req.startDate().trim().replace(' ', 'T'));
            end = req.endDate() == null || req.endDate().isBlank() ? today.plusYears(1).atTime(23, 59, 59)
                    : LocalDateTime.parse(req.endDate().trim().replace(' ', 'T'));
        } catch (java.time.format.DateTimeParseException ex) {
            throw new IllegalArgumentException("Ngày bắt đầu hoặc kết thúc voucher không hợp lệ");
        }
        if (end.isBefore(start))
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        BigDecimal minAmt = req.minimumAmount() != null ? req.minimumAmount() : BigDecimal.ZERO;
        BigDecimal maxDisc = req.maximumDiscount();
        if (minAmt.signum() < 0 || (maxDisc != null && maxDisc.signum() < 0)
                || (req.quantity() != null && req.quantity() <= 0)) {
            throw new IllegalArgumentException("Giá trị giảm giá không được âm và số lượng phải lớn hơn 0");
        }
        int qty = req.quantity() != null ? req.quantity() : 100;
        String startDate = start.toString();
        String endDate = end.toString();

        Long progId = voucherRepository.insertProgram(progName, progDesc, startDate, endDate, initialStatus);
        if (progId == null) {
            throw new IllegalStateException("Không thể tạo chương trình ưu đãi");
        }

        voucherRepository.insertVoucher(progId, cleanCode, req.discountPercent(), minAmt, maxDisc, qty, startDate,
                endDate, req.customerTier());

        String message = "Đã tạo voucher tạm ngưng, cần admin kiểm tra và kích hoạt trước khi khách sử dụng.";

        return Map.of(
                "message", message,
                "code", cleanCode,
                "status", initialStatus);
    }

    public Map<String, Object> validateVoucher(ValidateVoucherRequest req) throws IllegalStateException {
        return validateVoucher(req, null);
    }

    public Map<String, Object> validateVoucher(ValidateVoucherRequest req, Long customerId) throws IllegalStateException {
        return validateVoucher(req, customerId, null);
    }

    public Map<String, Object> validateVoucher(ValidateVoucherRequest req, Long customerId,
            List<furniture.model.OrderItemDto> pricedOrderItems) throws IllegalStateException {
        return validateVoucher(req, customerId, pricedOrderItems, false);
    }

    public Map<String, Object> simulateVoucher(ValidateVoucherRequest req, Long customerId) {
        return validateVoucher(req, customerId, null, true);
    }

    private Map<String, Object> validateVoucher(ValidateVoucherRequest req, Long customerId,
            List<furniture.model.OrderItemDto> pricedOrderItems, boolean simulation) {
        if (req == null || req.code() == null || req.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mã voucher");
        }

        BigDecimal subtotal = req.subtotal() != null ? req.subtotal() : BigDecimal.ZERO;
        if (subtotal.signum() < 0)
            throw new IllegalArgumentException("Giá trị đơn hàng không được âm");
        List<Map<String, Object>> rows = voucherRepository.findVoucherWithProgramByCode(req.code());

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Mã voucher '" + req.code() + "' không tồn tại");
        }

        Map<String, Object> v = rows.get(0);
        String progStatus = (String) v.get("program_status");
        String vchStatus = (String) v.get("voucher_status");
        Boolean isExpired = (Boolean) v.get("is_expired");
        int quantity = ((Number) v.get("quantity")).intValue();
        int usedQuantity = ((Number) v.get("used_quantity")).intValue();

        if (!simulation && !"ACTIVE".equalsIgnoreCase(progStatus)) {
            if ("DRAFT".equalsIgnoreCase(progStatus)) {
                throw new IllegalStateException(
                        "Voucher '" + req.code() + "' hiện đang chờ Admin phê duyệt, chưa thể áp dụng.");
            }
            throw new IllegalStateException("Voucher này hiện không còn hoạt động.");
        }

        if (!simulation && !"ACTIVE".equalsIgnoreCase(vchStatus)) {
            throw new IllegalStateException("Voucher này đã bị tạm ngừng áp dụng.");
        }

        if (!simulation && Boolean.TRUE.equals(isExpired)) {
            throw new IllegalStateException("Voucher '" + req.code() + "' đã hết hạn sử dụng.");
        }

        if (!simulation && Boolean.TRUE.equals(v.get("is_not_started"))) {
            throw new IllegalStateException("Voucher chưa đến thời gian áp dụng.");
        }

        if (usedQuantity >= quantity) {
            throw new IllegalStateException("Voucher '" + req.code() + "' đã hết số lượng lượt dùng.");
        }

        String type = (String) v.getOrDefault("voucher_type", "ORDER");
        if (!List.of("ORDER", "PRODUCT", "VIP").contains(type)) {
            throw new IllegalArgumentException("Loại voucher không hợp lệ");
        }
        if ("VIP".equals(type) && !v.getOrDefault("customer_tier", "VIP_DIAMOND").equals(voucherRepository.findCustomerTier(customerId))) {
            throw new IllegalArgumentException(
                    "Voucher không dành cho hạng khách hàng hiện tại");
        }
        BigDecimal eligibleAmount = subtotal;
        if (req.items() != null) {
            if (req.items().isEmpty() || req.items().size() > 100) {
                throw new IllegalArgumentException("Giỏ hàng phải có từ 1 đến 100 sản phẩm");
            }
            var ids = new java.util.HashSet<Long>();
            subtotal = BigDecimal.ZERO;
            eligibleAmount = BigDecimal.ZERO;
            for (var item : req.items()) {
                if (item == null || item.productId() == null || item.productId() <= 0 || item.quantity() == null
                        || item.quantity() <= 0 || !ids.add(item.productId())) {
                    throw new IllegalArgumentException("Sản phẩm và số lượng không hợp lệ hoặc bị trùng");
                }
                BigDecimal unitPrice = pricedOrderItems == null ? voucherRepository.findProductPrice(item.productId())
                        : pricedOrderItems.stream().filter(priced -> priced.productId().equals(item.productId()))
                                .findFirst()
                                .orElseThrow(() -> new IllegalArgumentException("Thiếu giá sản phẩm đã kiểm tra"))
                                .unitPrice();
                BigDecimal amount = unitPrice.multiply(BigDecimal.valueOf(item.quantity()));
                subtotal = subtotal.add(amount);
                if (!"PRODUCT".equals(type) || item.productId().equals(((Number) v.get("product_id")).longValue())) {
                    eligibleAmount = eligibleAmount.add(amount);
                }
            }
            if (pricedOrderItems == null && req.subtotal() != null && req.subtotal().compareTo(subtotal) < 0
                    && !"PRODUCT".equals(type)) {
                subtotal = req.subtotal();
                eligibleAmount = req.subtotal();
            }
        } else if ("PRODUCT".equals(type)) {
            throw new IllegalArgumentException("Vui lòng cung cấp sản phẩm trong giỏ để kiểm tra voucher");
        }
        if ("PRODUCT".equals(type) && eligibleAmount.signum() <= 0) {
            throw new IllegalArgumentException("Giỏ hàng không có sản phẩm áp dụng voucher này");
        }

        if (subtotal.compareTo(new BigDecimal("9999999999999.99")) > 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng vượt quá giới hạn cho phép");
        }

        if (eligibleAmount.signum() <= 0)
            throw new IllegalArgumentException("Không có tiền hàng hợp lệ để áp dụng voucher");

        BigDecimal minimumAmount = (BigDecimal) v.get("minimum_amount");
        if (minimumAmount != null && subtotal.compareTo(minimumAmount) < 0) {
            BigDecimal needed = minimumAmount.subtract(subtotal);
            throw new IllegalArgumentException("Đơn hàng chưa đạt giá trị tối thiểu " + formatMoney(minimumAmount)
                    + ". Bạn cần mua thêm " + formatMoney(needed) + " để áp dụng mã này.");
        }

        BigDecimal discountPercent = (BigDecimal) v.get("discount_percent");
        BigDecimal maximumDiscount = (BigDecimal) v.get("maximum_discount");

        BigDecimal calculatedDiscount = eligibleAmount.multiply(discountPercent).divide(BigDecimal.valueOf(100), 0,
                RoundingMode.HALF_UP);
        if (maximumDiscount != null && maximumDiscount.compareTo(BigDecimal.ZERO) > 0) {
            if (calculatedDiscount.compareTo(maximumDiscount) > 0) {
                calculatedDiscount = maximumDiscount;
            }
        }

        calculatedDiscount = calculatedDiscount.min(eligibleAmount);

        return Map.of(
                "productId", "PRODUCT".equals(type) ? v.get("product_id") : 0L,
                "automaticDiscountAmount", BigDecimal.ZERO,
                "automaticDiscountLabel", "",
                "voucherId", v.get("id"),
                "code", v.get("code"),
                "programName", v.get("program_name"),
                "discountPercent", discountPercent,
                "discountAmount", calculatedDiscount,
                "subtotal", subtotal,
                "finalTotal", subtotal.subtract(calculatedDiscount));
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "0₫";
        return String.format("%,d₫", amount.longValue()).replace(',', '.');
    }
}
