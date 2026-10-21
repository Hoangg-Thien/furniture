package furniture.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        if (req.code() == null || req.code().trim().isEmpty()) {
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

        String startDate = (req.startDate() != null && !req.startDate().trim().isEmpty())
                ? req.startDate().trim()
                : "2026-10-01 00:00:00";
        String endDate = (req.endDate() != null && !req.endDate().trim().isEmpty())
                ? req.endDate().trim()
                : "2026-12-31 23:59:59";

        Long progId = voucherRepository.insertProgram(progName, progDesc, startDate, endDate, initialStatus);
        if (progId == null) {
            throw new IllegalStateException("Không thể tạo chương trình ưu đãi");
        }

        BigDecimal minAmt = req.minimumAmount() != null ? req.minimumAmount() : BigDecimal.ZERO;
        BigDecimal maxDisc = req.maximumDiscount();
        int qty = req.quantity() != null && req.quantity() > 0 ? req.quantity() : 100;

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
        if (req.code() == null || req.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mã voucher");
        }

        BigDecimal subtotal = req.subtotal() != null ? req.subtotal() : BigDecimal.ZERO;
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

