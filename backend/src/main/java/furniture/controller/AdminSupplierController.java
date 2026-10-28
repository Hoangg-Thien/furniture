package furniture.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.supplier.CreateReceiptRequest;
import furniture.model.admin.supplier.PurchaseReceiptItemDto;
import furniture.model.admin.supplier.PurchaseReceiptSummaryDto;
import furniture.model.admin.supplier.SupplierRequest;
import furniture.model.admin.supplier.SupplierResponse;
import furniture.service.AdminSupplierService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/suppliers")
@CrossOrigin(origins = "*")
public class AdminSupplierController {

    private final AdminSupplierService adminSupplierService;

    public AdminSupplierController(AdminSupplierService adminSupplierService) {
        this.adminSupplierService = adminSupplierService;
    }

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers(
            @RequestParam(required = false) String search) {
        List<SupplierResponse> list = adminSupplierService.getAllSuppliers(search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable Long id) {
        try {
            SupplierResponse response = adminSupplierService.getSupplierById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(@Valid @RequestBody SupplierRequest req) {
        try {
            SupplierResponse created = adminSupplierService.createSupplier(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest req) {
        try {
            SupplierResponse updated = adminSupplierService.updateSupplier(id, req);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            adminSupplierService.deleteSupplier(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa nhà cung cấp thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/receipts")
    public ResponseEntity<?> getReceipts(@PathVariable Long id) {
        try {
            List<PurchaseReceiptSummaryDto> list = adminSupplierService.getReceiptHistory(id);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/receipts/{receiptId}/items")
    public ResponseEntity<List<PurchaseReceiptItemDto>> getReceiptItems(
            @PathVariable Long id,
            @PathVariable Long receiptId) {
        List<PurchaseReceiptItemDto> items = adminSupplierService.getReceiptItems(receiptId);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{id}/receipts")
    public ResponseEntity<?> createReceipt(
            @PathVariable Long id,
            @RequestBody CreateReceiptRequest req) {
        try {
            Long receiptId = adminSupplierService.createReceipt(id, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Tạo phiếu nhập kho thành công",
                    "receiptId", receiptId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/receipts/{receiptId}/status")
    public ResponseEntity<?> updateReceiptStatus(
            @PathVariable Long id,
            @PathVariable Long receiptId,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            adminSupplierService.updateReceiptStatus(receiptId, status);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái phiếu nhập"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
