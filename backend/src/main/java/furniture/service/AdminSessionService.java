package furniture.service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import furniture.model.AuthResponse;
import furniture.model.LoginRequest;
import furniture.model.admin.AdminIdentity;
import furniture.util.PasswordUtil;

@Service
public class AdminSessionService {
    private final JdbcTemplate jdbc;
    private final AuthService auth;
    private final SecureRandom random = new SecureRandom();

    public AdminSessionService(JdbcTemplate jdbc, AuthService auth) {
        this.jdbc = jdbc;
        this.auth = auth;
    }

    public Map<String, Object> login(LoginRequest request) {
        AuthResponse user = auth.login(request);
        if (!List.of("ADMIN", "STAFF").contains(user.role())) {
            throw new SecurityException("Tài khoản không có quyền truy cập trang quản trị");
        }
        String token = issueToken(user.userId());
        AdminIdentity identity = authenticate("Bearer " + token);
        return Map.of("user", user, "accessToken", token, "staffType", identity.staffType() == null ? "" : identity.staffType());
    }

    public String issueToken(Long userId) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        jdbc.update("DELETE FROM public.admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
        jdbc.update("INSERT INTO public.admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL '8' HOUR)",
                PasswordUtil.hash(token), userId);
        return token;
    }

    public AdminIdentity authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() > 200) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại");
        }
        List<AdminIdentity> identities = jdbc.query("""
                SELECT u.id, u.role, s.id AS staff_id, s.staff_type, c.id AS customer_id
                FROM public.admin_sessions a
                JOIN public.users u ON u.id = a.user_id
                LEFT JOIN public.staff s ON s.user_id = u.id
                LEFT JOIN public.customers c ON c.user_id = u.id
                WHERE a.token_hash = ? AND a.expires_at > CURRENT_TIMESTAMP AND u.is_active = true
                """, (rs, row) -> new AdminIdentity(rs.getLong("id"), (Long) rs.getObject("staff_id"),
                        rs.getString("role"), rs.getString("staff_type"), (Long) rs.getObject("customer_id")), PasswordUtil.hash(authorization.substring(7)));
        if (identities.isEmpty() || !List.of("ADMIN", "STAFF", "CUSTOMER").contains(identities.get(0).role())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đã hết hạn hoặc tài khoản đã bị khóa");
        }
        return identities.get(0);
    }

    public void logout(String authorization) {
        authenticate(authorization);
        jdbc.update("DELETE FROM public.admin_sessions WHERE token_hash = ?", PasswordUtil.hash(authorization.substring(7)));
    }
}
