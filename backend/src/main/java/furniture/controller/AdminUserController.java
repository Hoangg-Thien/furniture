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

import furniture.model.admin.CreateUserRequest;
import furniture.model.admin.PageResponse;
import furniture.model.admin.ResetPasswordRequest;
import furniture.model.admin.UserSummaryResponse;
import furniture.service.AdminUserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            PageResponse<UserSummaryResponse> result = adminUserService.searchUsers(keyword, role, isActive, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách tài khoản: " + ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest req) {
        try {
            UserSummaryResponse created = adminUserService.createUser(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo tài khoản: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-Current-User-Id", required = false) String headerUserId,
            @RequestParam(value = "currentUserId", required = false) String paramUserId) {
        try {
            Long currentLoggedInId = null;
            if (headerUserId != null && !headerUserId.trim().isEmpty()) {
                try {
                    currentLoggedInId = Long.parseLong(headerUserId.trim());
                } catch (NumberFormatException ignored) {}
            }
            if (currentLoggedInId == null && paramUserId != null && !paramUserId.trim().isEmpty()) {
                try {
                    currentLoggedInId = Long.parseLong(paramUserId.trim());
                } catch (NumberFormatException ignored) {}
            }
            boolean newStatus = adminUserService.toggleActiveStatus(id, currentLoggedInId);
            return ResponseEntity.ok(Map.of(
                    "message", newStatus ? "Đã kích hoạt tài khoản thành công" : "Đã tạm khóa tài khoản thành công",
                    "isActive", newStatus));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi thay đổi trạng thái tài khoản: " + ex.getMessage()));
        }
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest req) {
        try {
            adminUserService.resetPassword(id, req.newPassword());
            return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu mới cho tài khoản thành công!"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi đặt lại mật khẩu: " + ex.getMessage()));
        }
    }
}
