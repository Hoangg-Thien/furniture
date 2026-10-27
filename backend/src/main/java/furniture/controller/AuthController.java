package furniture.controller;

import java.util.List;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.AuthResponse;
import furniture.model.LoginRequest;
import furniture.model.RegisterRequest;
import furniture.model.UpdateProfileRequest;
import furniture.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            AuthResponse response = authService.register(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xử lý đăng ký: " + ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            AuthResponse response = authService.login(req);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xử lý đăng nhập: " + ex.getMessage()));
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest req) {
        try {
            LoginRequest adminReq = new LoginRequest(req.username(), req.password(), "ADMIN");
            AuthResponse response = authService.login(adminReq);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xử lý đăng nhập quản trị: " + ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestParam Long userId) {
        try {
            AuthResponse response = authService.getProfile(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải thông tin cá nhân: " + ex.getMessage()));
        }
    }

    @PutMapping("/update/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody UpdateProfileRequest req) {
        try {
            AuthResponse response = authService.updateProfile(userId, req);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật thông tin: " + ex.getMessage()));
        }
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return authService.getAllUsers();
    }

    @GetMapping("/customers")
    public List<Map<String, Object>> getAllCustomers() {
        return authService.getAllCustomers();
    }

    @GetMapping("/staff")
    public List<Map<String, Object>> getAllStaff() {
        return authService.getAllStaff();
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@RequestBody Map<String, String> req) {
        try {
            Map<String, Object> result = authService.createStaff(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo tài khoản nhân sự: " + ex.getMessage()));
        }
    }

    @PutMapping("/staff/{userId}/toggle-status")
    public ResponseEntity<?> toggleStaffStatus(@PathVariable Long userId) {
        try {
            boolean active = authService.toggleUserStatus(userId);
            return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "isActive", active,
                    "message", active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi thay đổi trạng thái tài khoản: " + ex.getMessage()));
        }
    }

    @PutMapping("/staff/{userId}/role")
    public ResponseEntity<?> updateStaffRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        try {
            String role = body.get("role");
            authService.updateUserRole(userId, role);
            return ResponseEntity.ok(Map.of("userId", userId, "role", role, "message", "Cập nhật vai trò thành công!"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật vai trò: " + ex.getMessage()));
        }
    }

    @PostMapping("/staff/{userId}/reset-password")
    public ResponseEntity<?> resetStaffPassword(@PathVariable Long userId, @RequestBody(required = false) Map<String, String> body) {
        try {
            String pass = (body != null && body.containsKey("password")) ? body.get("password") : "123456";
            authService.resetUserPassword(userId, pass);
            return ResponseEntity.ok(Map.of("userId", userId, "message", "Mật khẩu đã được thiết lập lại thành công!"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi reset mật khẩu: " + ex.getMessage()));
        }
    }

    @GetMapping("/init-admin")
    public ResponseEntity<?> initAdmin() {
        try {
            Map<String, Object> res = authService.syncAdminAccounts();
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khởi tạo tài khoản admin: " + ex.getMessage()));
        }
    }

    @PostMapping("/init-admin")
    public ResponseEntity<?> postInitAdmin() {
        return initAdmin();
    }
}

