package furniture.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.CreateVoucherRequest;
import furniture.model.ValidateVoucherRequest;
import furniture.service.VoucherService;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin(origins = "*")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveVouchers() {
        try {
            return ResponseEntity.ok(voucherService.getActiveVouchers());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách voucher: " + ex.getMessage()));
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllVouchersForAdmin() {
        try {
            return ResponseEntity.ok(voucherService.getAllVouchersForAdmin());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách voucher quản trị: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveVoucher(@PathVariable Long id) {
        try {
            boolean approved = voucherService.approveVoucher(id);
            if (approved) {
                return ResponseEntity.ok(Map.of("message", "Đã phê duyệt voucher thành công! Voucher hiện đã có mặt trong Kho Vouchers của khách hàng."));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy voucher ID " + id));
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi duyệt voucher: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectVoucher(@PathVariable Long id) {
        try {
            voucherService.rejectVoucher(id);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối / ngừng áp dụng voucher này."));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi từ chối voucher: " + ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createVoucher(@RequestBody CreateVoucherRequest req) {
        try {
            Map<String, Object> result = voucherService.createVoucher(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo voucher: " + ex.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateVoucher(@RequestBody ValidateVoucherRequest req) {
        try {
            Map<String, Object> result = voucherService.validateVoucher(req);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi kiểm tra voucher: " + ex.getMessage()));
        }
    }
}

