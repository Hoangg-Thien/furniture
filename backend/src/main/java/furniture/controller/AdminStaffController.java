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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.PageResponse;
import furniture.model.admin.staff.CreateStaffRequest;
import furniture.model.admin.staff.StaffSummaryDto;
import furniture.model.admin.staff.UpdateStaffRequest;
import furniture.service.AdminStaffService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/staff")
@CrossOrigin(origins = "*")
public class AdminStaffController {

    private final AdminStaffService adminStaffService;

    public AdminStaffController(AdminStaffService adminStaffService) {
        this.adminStaffService = adminStaffService;
    }

    @GetMapping
    public ResponseEntity<?> getStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String kw = (search != null && !search.trim().isEmpty()) ? search : keyword;
            PageResponse<StaffSummaryDto> result = adminStaffService.searchStaff(kw, isActive, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách nhân viên: " + ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        try {
            StaffSummaryDto created = adminStaffService.createStaff(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khởi tạo nhân viên: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest req) {
        try {
            adminStaffService.updateStaff(id, req);
            return ResponseEntity.ok(Map.of("message", "Cập nhật hồ sơ nhân viên thành công!"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật nhân viên: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStaffStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-Current-User-Id", required = false) Long headerUserId,
            @RequestParam(value = "currentUserId", required = false) Long paramUserId) {
        try {
            Long currentLoggedInId = headerUserId != null ? headerUserId : paramUserId;
            boolean newStatus = adminStaffService.toggleStaffStatus(id, currentLoggedInId);
            return ResponseEntity.ok(Map.of(
                    "message", newStatus ? "Đã kích hoạt quyền truy cập nhân viên" : "Đã thu hồi quyền truy cập (khóa tài khoản)",
                    "isActive", newStatus));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật quyền truy cập: " + ex.getMessage()));
        }
    }
}
