package furniture.repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class AuthRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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

    public int countByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = LOWER(?)",
                Integer.class,
                username);
        return count != null ? count : 0;
    }

    public int countByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.customers WHERE LOWER(email) = LOWER(?)",
                Integer.class,
                email);
        return count != null ? count : 0;
    }

    public int countByEmailExcludingUserId(String email, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.customers WHERE LOWER(email) = LOWER(?) AND user_id != ?",
                Integer.class,
                email,
                userId);
        return count != null ? count : 0;
    }

    public Long insertUser(String username, String passwordHash, String role) {
        KeyHolder userKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.users (username, password_hash, role, is_active) VALUES (?, ?, ?, true)",
                    new String[] { "id" });
            ps.setString(1, username);
            ps.setString(2, passwordHash);
            ps.setString(3, role != null ? role : "CUSTOMER");
            return ps;
        }, userKeyHolder);
        return extractId(userKeyHolder);
    }

    public Long insertCustomer(Long userId, String role, String fullName, String email, String phone, String address) {
        KeyHolder customerKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.customers (user_id, role, full_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
                    new String[] { "id" });
            ps.setObject(1, userId);
            ps.setString(2, role != null ? role : "CUSTOMER");
            ps.setString(3, fullName);
            ps.setString(4, email);
            ps.setString(5, phone);
            ps.setString(6, address);
            return ps;
        }, customerKeyHolder);
        return extractId(customerKeyHolder);
    }

    public List<Map<String, Object>> findClientUserByIdentifier(String identifier) {
        return jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role, u.is_active,
                       c.id AS customer_id,
                       COALESCE(c.full_name, u.username) AS full_name,
                       c.email,
                       c.phone,
                       c.address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                WHERE u.role = 'CUSTOMER'
                  AND (LOWER(u.username) = LOWER(?)
                     OR (c.email IS NOT NULL AND LOWER(c.email) = LOWER(?)))
                LIMIT 1
                """, identifier, identifier);
    }

    public List<Map<String, Object>> findAdminByIdentifier(String identifier) {
        return jdbcTemplate.queryForList("""
                SELECT a.id AS admin_id, a.user_id, u.username, u.password_hash, a.role, u.is_active,
                       a.full_name, a.email, a.phone, a.address
                FROM public.admins a
                JOIN public.users u ON u.id = a.user_id
                WHERE (u.role = 'ADMIN' OR a.role = 'ADMIN')
                  AND (LOWER(u.username) = LOWER(?)
                     OR (a.email IS NOT NULL AND LOWER(a.email) = LOWER(?)))
                LIMIT 1
                """, identifier, identifier);
    }

    public List<Map<String, Object>> findUserWithCustomerByIdentifier(String identifier) {
        return jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role, u.is_active,
                       COALESCE(c.id, a.id, s.id) AS customer_id,
                       COALESCE(c.full_name, a.full_name, s.full_name, u.username) AS full_name,
                       COALESCE(c.email, a.email, s.email) AS email,
                       COALESCE(c.phone, a.phone, s.phone) AS phone,
                       COALESCE(c.address, a.address, s.address) AS address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                LEFT JOIN public.admins a ON a.user_id = u.id
                LEFT JOIN public.staff s ON s.user_id = u.id
                WHERE (LOWER(u.username) = LOWER(?)
                   OR (c.email IS NOT NULL AND LOWER(c.email) = LOWER(?))
                   OR (a.email IS NOT NULL AND LOWER(a.email) = LOWER(?))
                   OR (s.email IS NOT NULL AND LOWER(s.email) = LOWER(?)))
                LIMIT 1
                """, identifier, identifier, identifier, identifier);
    }

    public List<Map<String, Object>> findUserWithCustomerById(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role,
                       COALESCE(c.id, a.id, s.id) AS customer_id,
                       COALESCE(c.full_name, a.full_name, s.full_name, u.username) AS full_name,
                       COALESCE(c.email, a.email, s.email) AS email,
                       COALESCE(c.phone, a.phone, s.phone) AS phone,
                       COALESCE(c.address, a.address, s.address) AS address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                LEFT JOIN public.admins a ON a.user_id = u.id
                LEFT JOIN public.staff s ON s.user_id = u.id
                WHERE u.id = ? AND u.is_active = true
                LIMIT 1
                """, userId);
    }

    public void updatePassword(Long userId, String newPasswordHash) {
        jdbcTemplate.update("UPDATE public.users SET password_hash = ? WHERE id = ?", newPasswordHash, userId);
    }

    public void updateCustomer(Long userId, String fullName, String email, String phone, String address) {
        jdbcTemplate.update(
                "UPDATE public.customers SET full_name = ?, email = ?, phone = ?, address = ? WHERE user_id = ?",
                fullName, email, phone, address, userId);
    }

    public List<Map<String, Object>> findAllUsers() {
        return jdbcTemplate
                .queryForList("SELECT id, username, role, is_active, created_at FROM public.users ORDER BY id ASC");
    }

    public List<Map<String, Object>> findAllCustomers() {
        return jdbcTemplate.queryForList(
                "SELECT id, user_id, full_name, email, phone, address, role, created_at FROM public.customers ORDER BY id ASC");
    }

    public Map<String, Object> syncAdminAccounts() {
        String pass123456Hash = furniture.util.PasswordUtil.hash("123456");

        Integer adminCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = 'admin'", Integer.class);
        if (adminCount != null && adminCount > 0) {
            jdbcTemplate.update(
                    "UPDATE public.users SET password_hash = ?, role = 'ADMIN', is_active = true WHERE LOWER(username) = 'admin'",
                    pass123456Hash);
        } else {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbcTemplate.update(conn -> {
                PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO public.users (username, password_hash, role, is_active) VALUES ('admin', ?, 'ADMIN', true)",
                        new String[] { "id" });
                ps.setString(1, pass123456Hash);
                return ps;
            }, kh);
            Long newId = extractId(kh);
            if (newId != null) {
                jdbcTemplate.update(
                        "INSERT INTO public.admins (user_id, full_name, email, phone, address, role) " +
                                "VALUES (?, 'Tổng Quản Trị Viên (Admin)', 'admin@furniture.com', '0901888999', 'Hệ thống Quản trị Furniture', 'ADMIN') "
                                +
                                "ON CONFLICT (user_id) DO NOTHING",
                        newId);
            }
        }

        jdbcTemplate
                .update("""
                        INSERT INTO public.admins (user_id, full_name, email, phone, address, role)
                        SELECT u.id, 'Tổng Quản Trị Viên (Admin)', 'admin@furniture.com', '0901888999', 'Hệ thống Quản trị Furniture', 'ADMIN'
                        FROM public.users u WHERE LOWER(u.username) = 'admin'
                        ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'ADMIN'
                        """);

        jdbcTemplate.update(
                "UPDATE public.users SET password_hash = ? WHERE username IN ('admin01', 'admin02', 'admin03')",
                pass123456Hash);

        jdbcTemplate
                .update("""
                        INSERT INTO public.admins (user_id, full_name, email, phone, address, role)
                        SELECT u.id, 'Nguyễn Quang Minh (Admin 01)', 'minh.admin@example.com', '0901000001', '25 Le Loi, Quan 1, TP.HCM', 'ADMIN'
                        FROM public.users u WHERE u.username = 'admin01'
                        ON CONFLICT (user_id) DO NOTHING
                        """);

        try {
            jdbcTemplate.execute(
                    "SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 0) + 1, false)");
            jdbcTemplate.execute(
                    "SELECT setval(pg_get_serial_sequence('public.admins', 'id'), COALESCE((SELECT MAX(id) FROM public.admins), 0) + 1, false)");
        } catch (Exception ignored) {
        }

        return Map.of(
                "status", "success",
                "message", "Khởi tạo và đồng bộ tài khoản admin trên Supabase thành công!",
                "accounts", List.of(
                        Map.of("username", "admin", "password", "admin123", "role", "ADMIN", "fullName",
                                "Tổng Quản Trị Viên (Admin)"),
                        Map.of("username", "admin01", "password", "123456", "role", "ADMIN", "fullName",
                                "Nguyễn Quang Minh (Admin 01)")));
    }

    public List<Map<String, Object>> findAllStaff() {
        return jdbcTemplate.queryForList("""
            SELECT 
                u.id AS user_id,
                u.username,
                u.role,
                u.is_active,
                u.created_at,
                COALESCE(s.full_name, a.full_name, u.username) AS full_name,
                COALESCE(s.email, a.email, u.username || '@furniture.com') AS email,
                COALESCE(s.phone, a.phone, '') AS phone,
                COALESCE(s.address, a.address, 'Trụ sở chính') AS address,
                s.id AS staff_id,
                a.id AS admin_id
            FROM public.users u
            LEFT JOIN public.staff s ON s.user_id = u.id
            LEFT JOIN public.admins a ON a.user_id = u.id
            WHERE u.role IN ('STAFF', 'ADMIN')
            ORDER BY u.id ASC
        """);
    }

    public Map<String, Object> createStaffUser(String username, String password, String fullName, String email, String phone, String address, String role) {
        String reqRole = (role != null && !role.isBlank()) ? role.trim().toUpperCase() : "STAFF";
        String baseDbRole = "ADMIN".equals(reqRole) ? "ADMIN" : "STAFF";

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = LOWER(?)", Integer.class, username.trim());
        if (exists != null && exists > 0) {
            throw new IllegalArgumentException("Tên đăng nhập '" + username + "' đã tồn tại trên hệ thống!");
        }

        String passHash = furniture.util.PasswordUtil.hash((password != null && !password.isBlank()) ? password : "123456");

        KeyHolder kh = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO public.users (username, password_hash, role, is_active) VALUES (?, ?, ?, true)",
                new String[] { "id" }
            );
            ps.setString(1, username.trim().toLowerCase());
            ps.setString(2, passHash);
            ps.setString(3, baseDbRole);
            return ps;
        }, kh);

        Long newUserId = extractId(kh);
        String finalEmail = (email != null && !email.isBlank()) ? email.trim() : (username.trim() + "@furniture.com");
        String finalPhone = (phone != null && !phone.isBlank()) ? phone.trim() : "";
        String finalAddress = (address != null && !address.isBlank()) ? address.trim() : "Showroom Furniture";

        if (newUserId != null) {
            if ("ADMIN".equals(baseDbRole)) {
                jdbcTemplate.update(
                    "INSERT INTO public.admins (user_id, full_name, email, phone, address, role) VALUES (?, ?, ?, ?, ?, 'ADMIN')",
                    newUserId, fullName, finalEmail, finalPhone, finalAddress
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO public.staff (user_id, full_name, email, phone, address, role) VALUES (?, ?, ?, ?, ?, 'STAFF')",
                    newUserId, fullName, finalEmail, finalPhone, finalAddress
                );
            }
        }

        return Map.of(
            "userId", newUserId != null ? newUserId : 0,
            "username", username,
            "role", baseDbRole,
            "fullName", fullName,
            "email", finalEmail,
            "phone", finalPhone,
            "address", finalAddress,
            "isActive", true
        );
    }

    public boolean toggleUserStatus(Long userId) {
        Boolean current = jdbcTemplate.queryForObject(
            "SELECT is_active FROM public.users WHERE id = ?", Boolean.class, userId);
        boolean next = current == null || !current;
        jdbcTemplate.update("UPDATE public.users SET is_active = ? WHERE id = ?", next, userId);
        return next;
    }

    public void updateUserRole(Long userId, String newRole) {
        String baseDbRole = "ADMIN".equalsIgnoreCase(newRole) ? "ADMIN" : "STAFF";
        jdbcTemplate.update("UPDATE public.users SET role = ? WHERE id = ?", baseDbRole, userId);
        try {
            jdbcTemplate.update("UPDATE public.staff SET role = ? WHERE user_id = ?", baseDbRole, userId);
        } catch (Exception ignore) {}
        try {
            jdbcTemplate.update("UPDATE public.admins SET role = ? WHERE user_id = ?", baseDbRole, userId);
        } catch (Exception ignore) {}
    }

    public void resetUserPassword(Long userId, String newPassword) {
        String hash = furniture.util.PasswordUtil.hash(newPassword);
        jdbcTemplate.update("UPDATE public.users SET password_hash = ? WHERE id = ?", hash, userId);
    }
}
