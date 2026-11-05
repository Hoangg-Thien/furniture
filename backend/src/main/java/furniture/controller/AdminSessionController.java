package furniture.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import furniture.model.LoginRequest;
import furniture.model.admin.AdminIdentity;
import furniture.service.AdminSessionService;

@RestController
@RequestMapping("/api/auth/admin")
@CrossOrigin(origins = "*")
public class AdminSessionController {
    private final AdminSessionService sessions;

    public AdminSessionController(AdminSessionService sessions) { this.sessions = sessions; }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(sessions.login(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/session")
    public AdminIdentity session(@RequestAttribute(AdminIdentity.ATTRIBUTE) AdminIdentity identity) { return identity; }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestHeader("Authorization") String authorization) {
        sessions.logout(authorization);
        return Map.of("message", "Đã đăng xuất");
    }
}
