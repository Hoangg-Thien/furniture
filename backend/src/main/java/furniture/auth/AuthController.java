package furniture.auth;

import java.util.List;
import java.util.Map;

import java.sql.PreparedStatement;
import java.sql.Statement;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final JdbcTemplate jdbcTemplate;

    public AuthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record RegisterRequest(
            String username,
            String password,
            String fullName,
            String email,
            String phone,
            String address) {
    }

    public record LoginRequest(
            String username,
            String password) {
    }

    public record AuthResponse(
            Long userId,
            Long customerId,
            String username,
            String fullName,
            String email,
            String phone,
            String address,
            String role,
            String message) {
    }

    private Long extractId(KeyHolder keyHolder) {
        if (keyHolder.getKeys() != null) {
            for (Map.Entry<String, Object> entry : keyHolder.getKeys().entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number num) {
                    return num.longValue();
                }
            }
        }
        try {
            Number key = keyHolder.getKey();
            return key != null ? key.longValue() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.username() == null || req.username().trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đăng nhập phải có ít nhất 3 ký tự"));
        }
        if (req.password() == null || req.password().trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu phải có ít nhất 6 ký tự"));
        }
        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Họ và tên không được để trống"));
        }

        String username = req.username().trim();
        Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = LOWER(?)",
                Integer.class,
                username);
        if (userCount != null && userCount > 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đăng nhập đã tồn tại"));
        }

        String email = (req.email() != null && !req.email().trim().isEmpty()) ? req.email().trim() : null;
        if (email != null) {
            Integer emailCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM public.customers WHERE LOWER(email) = LOWER(?)",
                    Integer.class,
                    email);
            if (emailCount != null && emailCount > 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email này đã được sử dụng"));
            }
        }

        String passwordHash = PasswordUtil.hash(req.password());
        KeyHolder userKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.users (username, password_hash, role, is_active) VALUES (?, ?, 'CUSTOMER', true)",
                    new String[] { "id" });
            ps.setString(1, username);
            ps.setString(2, passwordHash);
            return ps;
        }, userKeyHolder);

        Long userId = extractId(userKeyHolder);

        String phone = (req.phone() != null && !req.phone().trim().isEmpty()) ? req.phone().trim() : null;
        String address = (req.address() != null && !req.address().trim().isEmpty()) ? req.address().trim() : null;

        KeyHolder customerKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.customers (user_id, role, full_name, email, phone, address) VALUES (?, 'CUSTOMER', ?, ?, ?, ?)",
                    new String[] { "id" });
            ps.setObject(1, userId);
            ps.setString(2, req.fullName().trim());
            ps.setString(3, email);
            ps.setString(4, phone);
            ps.setString(5, address);
            return ps;
        }, customerKeyHolder);

        Long customerId = extractId(customerKeyHolder);

        // Đồng thời ghi trực tiếp lệnh INSERT vào file sales.sql để dữ liệu luôn được lưu vào file
        appendToSalesSql(userId, customerId, username, passwordHash, req.fullName().trim(), email, phone, address);

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                userId,
                customerId,
                username,
                req.fullName().trim(),
                email,
                phone,
                address,
                "CUSTOMER",
                "Đăng ký tài khoản thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.username() == null || req.username().trim().isEmpty() ||
            req.password() == null || req.password().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"));
        }

        String loginIdentifier = req.username().trim();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role, u.is_active,
                       c.id AS customer_id, c.full_name, c.email, c.phone, c.address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                WHERE (LOWER(u.username) = LOWER(?) OR (c.email IS NOT NULL AND LOWER(c.email) = LOWER(?)))
                LIMIT 1
                """, loginIdentifier, loginIdentifier);

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Tên đăng nhập hoặc mật khẩu không chính xác"));
        }

        Map<String, Object> user = rows.get(0);
        Object activeObj = user.get("is_active");
        boolean isActive = activeObj == null || Boolean.TRUE.equals(activeObj);
        if (!isActive) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Tài khoản này đã bị tạm khóa"));
        }

        String storedHash = (String) user.get("password_hash");
        if (!PasswordUtil.verify(req.password(), storedHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Tên đăng nhập hoặc mật khẩu không chính xác"));
        }

        Number userIdNum = (Number) user.get("user_id");
        Number customerIdNum = (Number) user.get("customer_id");

        return ResponseEntity.ok(new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                (String) user.get("role"),
                "Đăng nhập thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestParam Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.role,
                       c.id AS customer_id, c.full_name, c.email, c.phone, c.address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                WHERE u.id = ? AND u.is_active = true
                LIMIT 1
                """, userId);

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy người dùng"));
        }

        Map<String, Object> user = rows.get(0);
        Number userIdNum = (Number) user.get("user_id");
        Number customerIdNum = (Number) user.get("customer_id");

        return ResponseEntity.ok(new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                (String) user.get("role"),
                "OK"));
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return jdbcTemplate.queryForList("SELECT id, username, role, is_active, created_at FROM public.users ORDER BY id ASC");
    }

    @GetMapping("/customers")
    public List<Map<String, Object>> getAllCustomers() {
        return jdbcTemplate.queryForList("SELECT id, user_id, full_name, email, phone, address, role, created_at FROM public.customers ORDER BY id ASC");
    }

    private synchronized void appendToSalesSql(Long userId, Long customerId, String username, String passwordHash,
                                               String fullName, String email, String phone, String address) {
        try {
            java.nio.file.Path[] candidates = new java.nio.file.Path[] {
                java.nio.file.Paths.get("../database/sales.sql"),
                java.nio.file.Paths.get("database/sales.sql"),
                java.nio.file.Paths.get("furniture/database/sales.sql"),
                java.nio.file.Paths.get("c:/Users/Lenovo/OneDrive/Desktop/SE_project/furniture/database/sales.sql")
            };
            java.nio.file.Path targetPath = null;
            for (java.nio.file.Path p : candidates) {
                if (java.nio.file.Files.exists(p)) {
                    targetPath = p;
                    break;
                }
            }
            if (targetPath != null) {
                String emailVal = email != null ? "'" + email.replace("'", "''") + "'" : "NULL";
                String phoneVal = phone != null ? "'" + phone.replace("'", "''") + "'" : "NULL";
                String addressVal = address != null ? "'" + address.replace("'", "''") + "'" : "NULL";
                String fullNameVal = fullName != null ? "'" + fullName.replace("'", "''") + "'" : "''";
                String userInsert = String.format(
                    "INSERT INTO users (id, username, password_hash, role) VALUES (%d, '%s', '%s', 'CUSTOMER');\n",
                    userId, username.replace("'", "''"), passwordHash);
                String customerInsert = String.format(
                    "INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES (%d, %d, %s, %s, %s, %s);\n",
                    customerId, userId, fullNameVal, emailVal, phoneVal, addressVal);

                String currentContent = java.nio.file.Files.readString(targetPath);
                String newContent;
                if (currentContent.contains("COMMIT;")) {
                    newContent = currentContent.replace("COMMIT;", userInsert + customerInsert + "COMMIT;");
                } else {
                    newContent = currentContent + "\n" + userInsert + customerInsert;
                }
                java.nio.file.Files.writeString(targetPath, newContent);
            }
        } catch (Exception ex) {
            // Log warning but don't fail registration
            ex.printStackTrace();
        }
    }
}

