package furniture.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.promotion.CreateOrderDiscountRequest;
import furniture.model.admin.promotion.CreateProductDiscountRequest;
import furniture.model.admin.promotion.CreateProgramRequest;
import furniture.model.admin.promotion.CreateVoucherRequest;
import furniture.model.admin.promotion.OrderDiscountDto;
import furniture.model.admin.promotion.ProductDiscountDto;
import furniture.model.admin.promotion.ProgramDetailResponse;
import furniture.model.admin.promotion.ProgramResponse;
import furniture.model.admin.promotion.VoucherDto;
import furniture.service.AdminPromotionService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/promotions")
@CrossOrigin(origins = "*")
public class AdminPromotionController {

    private final AdminPromotionService adminPromotionService;

    public AdminPromotionController(AdminPromotionService adminPromotionService) {
        this.adminPromotionService = adminPromotionService;
    }

    @GetMapping
    public ResponseEntity<List<ProgramResponse>> getAllPrograms(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<ProgramResponse> list = adminPromotionService.getAllPrograms(search, status);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProgramById(@PathVariable Long id) {
        try {
            ProgramResponse res = adminPromotionService.getProgramById(id);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getProgramDetail(@PathVariable Long id) {
        try {
            ProgramDetailResponse res = adminPromotionService.getProgramDetail(id);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createProgram(@Valid @RequestBody CreateProgramRequest req) {
        try {
            ProgramResponse created = adminPromotionService.createProgram(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProgram(
            @PathVariable Long id,
            @Valid @RequestBody CreateProgramRequest req) {
        try {
            ProgramResponse updated = adminPromotionService.updateProgram(id, req);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateProgramStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String newStatus = status;
            if (newStatus == null && body != null) {
                newStatus = body.get("status");
            }
            adminPromotionService.updateProgramStatus(id, newStatus);
            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái chiến dịch thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProgram(@PathVariable Long id) {
        try {
            adminPromotionService.deleteProgram(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa chương trình khuyến mãi thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Product Discounts
    // -------------------------------------------------------------------------
    @PostMapping("/{id}/product-discounts")
    public ResponseEntity<?> addProductDiscount(
            @PathVariable Long id,
            @Valid @RequestBody CreateProductDiscountRequest req) {
        try {
            ProductDiscountDto dto = adminPromotionService.addProductDiscount(id, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/product-discounts/{discountId}")
    public ResponseEntity<?> deleteProductDiscount(
            @PathVariable Long id,
            @PathVariable Long discountId) {
        try {
            adminPromotionService.deleteProductDiscount(discountId);
            return ResponseEntity.ok(Map.of("message", "Đã gỡ bỏ giảm giá sản phẩm"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Order Discounts
    // -------------------------------------------------------------------------
    @PostMapping("/{id}/order-discounts")
    public ResponseEntity<?> addOrderDiscount(
            @PathVariable Long id,
            @Valid @RequestBody CreateOrderDiscountRequest req) {
        try {
            OrderDiscountDto dto = adminPromotionService.addOrderDiscount(id, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/order-discounts/{discountId}")
    public ResponseEntity<?> deleteOrderDiscount(
            @PathVariable Long id,
            @PathVariable Long discountId) {
        try {
            adminPromotionService.deleteOrderDiscount(discountId);
            return ResponseEntity.ok(Map.of("message", "Đã gỡ bỏ chiết khấu bậc đơn hàng"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Vouchers
    // -------------------------------------------------------------------------
    @GetMapping("/vouchers")
    public ResponseEntity<List<VoucherDto>> getAllVouchers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<VoucherDto> list = adminPromotionService.getAllVouchers(search, status);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/vouchers")
    public ResponseEntity<?> createVoucher(
            @PathVariable Long id,
            @Valid @RequestBody CreateVoucherRequest req) {
        try {
            VoucherDto created = adminPromotionService.createVoucher(id, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/vouchers/{voucherId}/status")
    public ResponseEntity<?> updateVoucherStatus(
            @PathVariable Long voucherId,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String newStatus = status;
            if (newStatus == null && body != null) {
                newStatus = body.get("status");
            }
            adminPromotionService.updateVoucherStatus(voucherId, newStatus);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái voucher"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/vouchers/{voucherId}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long voucherId) {
        try {
            adminPromotionService.deleteVoucher(voucherId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa voucher thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }
}
