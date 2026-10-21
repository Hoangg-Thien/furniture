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

    public List<Map<String, Object>> findUserWithCustomerByIdentifier(String identifier) {
        return jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role, u.is_active,
                       c.id AS customer_id, c.full_name, c.email, c.phone, c.address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
                WHERE (LOWER(u.username) = LOWER(?) OR (c.email IS NOT NULL AND LOWER(c.email) = LOWER(?)))
                LIMIT 1
                """, identifier, identifier);
    }

    public List<Map<String, Object>> findUserWithCustomerById(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT u.id AS user_id, u.username, u.password_hash, u.role,
                       c.id AS customer_id, c.full_name, c.email, c.phone, c.address
                FROM public.users u
                LEFT JOIN public.customers c ON c.user_id = u.id
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
        return jdbcTemplate.queryForList("SELECT id, username, role, is_active, created_at FROM public.users ORDER BY id ASC");
    }

    public List<Map<String, Object>> findAllCustomers() {
        return jdbcTemplate.queryForList("SELECT id, user_id, full_name, email, phone, address, role, created_at FROM public.customers ORDER BY id ASC");
    }
}

