package furniture.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.PageResponse;
import furniture.model.admin.customer.CustomerDetailResponse;
import furniture.model.admin.customer.CustomerTableItemDto;
import furniture.model.admin.customer.UpdateCustomerRequest;
import furniture.service.AdminCustomerService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/customers")
@CrossOrigin(origins = "*")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    public AdminCustomerController(AdminCustomerService adminCustomerService) {
        this.adminCustomerService = adminCustomerService;
    }

    @GetMapping
    public ResponseEntity<?> getCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) BigDecimal minSpent,
            @RequestParam(required = false) BigDecimal maxSpent,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            PageResponse<CustomerTableItemDto> res = adminCustomerService.getCustomers(
                    keyword, tier, minSpent, maxSpent, page, size);
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách khách hàng: " + ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerDetail(@PathVariable Long id) {
        try {
            CustomerDetailResponse detail = adminCustomerService.getCustomerDetail(id);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải chi tiết khách hàng: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest req) {
        try {
            adminCustomerService.updateCustomerProfile(id, req);
            return ResponseEntity.ok(Map.of("message", "Cập nhật thông tin khách hàng thành công!"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật khách hàng: " + ex.getMessage()));
        }
    }

    @GetMapping("/export")
    public ResponseEntity<?> exportCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) BigDecimal minSpent,
            @RequestParam(required = false) BigDecimal maxSpent) {
        try {
            List<CustomerTableItemDto> customers = adminCustomerService.getAllCustomersForExport(
                    keyword, tier, minSpent, maxSpent);
            return ResponseEntity.ok(customers);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xuất danh sách khách hàng: " + ex.getMessage()));
        }
    }
}
