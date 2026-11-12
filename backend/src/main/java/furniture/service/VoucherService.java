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

        String cleanCode = req.code().trim().toUpperCase();
        if (voucherRepository.countByCode(cleanCode) > 0) {
            throw new IllegalArgumentException("Mã voucher '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String progName = (req.programName() != null && !req.programName().trim().isEmpty())
                ? req.programName().trim()
                : "Chương trình ưu đãi " + cleanCode;
        String progDesc = (req.description() != null) ? req.description().trim() : "";
        boolean isAutoApprove = Boolean.TRUE.equals(req.autoApprove());
        String initialStatus = isAutoApprove ? "ACTIVE" : "DRAFT";

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
        if (end.isBefore(start)) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
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

        voucherRepository.insertVoucher(progId, cleanCode, req.discountPercent(), minAmt, maxDisc, qty, startDate, endDate);

        String message = isAutoApprove
                ? "Tạo voucher thành công và đã đưa vào Kho Voucher!"
                : "Tạo voucher cửa hàng thành công! Voucher đang ở trạng thái 'Chờ Admin duyệt' trước khi vào Kho Voucher.";

        return Map.of(
                "message", message,
                "code", cleanCode,
                "status", initialStatus);
    }

    public Map<String, Object> validateVoucher(ValidateVoucherRequest req) {
        if (req == null || req.code() == null || req.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mã voucher");
        }

        BigDecimal subtotal = req.subtotal() != null ? req.subtotal() : BigDecimal.ZERO;
        if (subtotal.signum() < 0) throw new IllegalArgumentException("Giá trị đơn hàng không được âm");
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

        if (!"ACTIVE".equalsIgnoreCase(progStatus)) {
            if ("DRAFT".equalsIgnoreCase(progStatus)) {
                throw new IllegalStateException("Voucher '" + req.code() + "' hiện đang chờ Admin phê duyệt, chưa thể áp dụng.");
            }
            throw new IllegalStateException("Voucher này hiện không còn hoạt động.");
        }

        if (!"ACTIVE".equalsIgnoreCase(vchStatus)) {
            throw new IllegalStateException("Voucher này đã bị tạm ngừng áp dụng.");
        }

        if (Boolean.TRUE.equals(isExpired)) {
            throw new IllegalStateException("Voucher '" + req.code() + "' đã hết hạn sử dụng.");
        }

        if (Boolean.TRUE.equals(v.get("is_not_started"))) {
            throw new IllegalStateException("Voucher chưa đến thời gian áp dụng.");
        }

        if (usedQuantity >= quantity) {
            throw new IllegalStateException("Voucher '" + req.code() + "' đã hết số lượng lượt dùng.");
        }

        BigDecimal minimumAmount = (BigDecimal) v.get("minimum_amount");
        if (minimumAmount != null && subtotal.compareTo(minimumAmount) < 0) {
            BigDecimal needed = minimumAmount.subtract(subtotal);
            throw new IllegalArgumentException("Đơn hàng chưa đạt giá trị tối thiểu " + formatMoney(minimumAmount)
                    + ". Bạn cần mua thêm " + formatMoney(needed) + " để áp dụng mã này.");
        }

        BigDecimal discountPercent = (BigDecimal) v.get("discount_percent");
        BigDecimal maximumDiscount = (BigDecimal) v.get("maximum_discount");

        BigDecimal calculatedDiscount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        if (maximumDiscount != null && maximumDiscount.compareTo(BigDecimal.ZERO) > 0) {
            if (calculatedDiscount.compareTo(maximumDiscount) > 0) {
                calculatedDiscount = maximumDiscount;
            }
        }

        return Map.of(
                "voucherId", v.get("id"),
                "code", v.get("code"),
                "programName", v.get("program_name"),
                "discountPercent", discountPercent,
                "discountAmount", calculatedDiscount,
                "subtotal", subtotal,
                "finalTotal", subtotal.subtract(calculatedDiscount));
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0₫";
        return String.format("%,d₫", amount.longValue()).replace(',', '.');
    }
}

