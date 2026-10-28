package furniture.repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.admin.PageResponse;
import furniture.model.admin.staff.StaffSummaryDto;

@Repository
public class AdminStaffRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminStaffRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Long extractId(KeyHolder keyHolder) {
        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null) {
            for (Map.Entry<String, Object> entry : keys.entrySet()) {
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

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = LOWER(?)",
                Integer.class,
                username != null ? username.trim() : "");
        return count != null && count > 0;
    }

    public boolean existsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.staff WHERE LOWER(email) = LOWER(?)",
                Integer.class,
                email.trim());
        return count != null && count > 0;
    }

    public int countByEmailExcludingStaffId(String email, Long staffId) {
        if (email == null || email.trim().isEmpty()) return 0;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.staff WHERE LOWER(email) = LOWER(?) AND id != ?",
                Integer.class,
                email.trim(),
                staffId);
        return count != null ? count : 0;
    }

    public Optional<Map<String, Object>> findById(Long staffId) {
        String sql = """
                SELECT s.id, s.user_id, u.username, s.full_name, s.phone, s.email, s.address,
                       COALESCE(u.is_active, true) AS is_active, s.created_at,
                       COUNT(DISTINCT o.id) AS handled_orders_count,
                       COUNT(DISTINCT pr.id) AS receipts_count
                FROM public.staff s
                LEFT JOIN public.users u ON u.id = s.user_id
                LEFT JOIN public.orders o ON o.staff_id = s.id
                LEFT JOIN public.purchase_receipts pr ON pr.staff_id = s.id
                WHERE s.id = ?
                GROUP BY s.id, s.user_id, u.username, s.full_name, s.phone, s.email, s.address, u.is_active, s.created_at
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, staffId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rows.get(0));
    }

    public Optional<Map<String, Object>> findByUserId(Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, user_id, full_name, email, phone, address FROM public.staff WHERE user_id = ?",
                userId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rows.get(0));
    }

    public PageResponse<StaffSummaryDto> searchStaff(String keyword, Boolean isActive, int page, int size) {
        String baseCte = """
                WITH staff_stats AS (
                    SELECT s.id, s.user_id, u.username, s.full_name, s.phone, s.email, s.address,
                           COALESCE(u.is_active, true) AS is_active, s.created_at,
                           COUNT(DISTINCT o.id) AS handled_orders_count,
                           COUNT(DISTINCT pr.id) AS receipts_count
                    FROM public.staff s
                    LEFT JOIN public.users u ON u.id = s.user_id
                    LEFT JOIN public.orders o ON o.staff_id = s.id
                    LEFT JOIN public.purchase_receipts pr ON pr.staff_id = s.id
                    GROUP BY s.id, s.user_id, u.username, s.full_name, s.phone, s.email, s.address, u.is_active, s.created_at
                )
                """;

        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            whereClause.append("""
                     AND (LOWER(full_name) LIKE ? 
                       OR phone LIKE ? 
                       OR LOWER(email) LIKE ? 
                       OR LOWER(username) LIKE ? 
                       OR LOWER(address) LIKE ?) 
                    """);
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        if (isActive != null) {
            whereClause.append(" AND is_active = ? ");
            params.add(isActive);
        }

        String countSql = baseCte + " SELECT COUNT(*) FROM staff_stats " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());
        long totalElements = totalCount != null ? totalCount : 0L;

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        int offset = Math.max(0, page) * size;

        String selectSql = baseCte + " SELECT * FROM staff_stats "
                + whereClause
                + " ORDER BY id DESC LIMIT ? OFFSET ?";

        List<Object> selectParams = new ArrayList<>(params);
        selectParams.add(size);
        selectParams.add(offset);

        List<StaffSummaryDto> content = jdbcTemplate.query(selectSql, (rs, rowNum) -> {
            Long id = rs.getLong("id");
            Long userId = (Long) rs.getObject("user_id");
            String username = rs.getString("username");
            String fullName = rs.getString("full_name");
            String phone = rs.getString("phone");
            String email = rs.getString("email");
            String address = rs.getString("address");
            long handledOrdersCount = rs.getLong("handled_orders_count");
            long receiptsCount = rs.getLong("receipts_count");
            Boolean active = rs.getBoolean("is_active");
            Timestamp ts = rs.getTimestamp("created_at");
            LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;

            return new StaffSummaryDto(
                    id, userId, username, fullName, phone, email, address,
                    handledOrdersCount, receiptsCount, active, createdAt);
        }, selectParams.toArray());

        boolean isFirst = page <= 0;
        boolean isLast = totalPages <= 1 || page >= totalPages - 1;

        return new PageResponse<>(content, page, size, totalElements, totalPages, isFirst, isLast);
    }

    public Long insertStaff(Long userId, String fullName, String email, String phone, String address) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.staff (user_id, full_name, email, phone, address, role, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, 'STAFF', CURRENT_TIMESTAMP)",
                    new String[] { "id" });
            ps.setLong(1, userId);
            ps.setString(2, fullName);
            ps.setString(3, email != null && !email.trim().isEmpty() ? email.trim() : null);
            ps.setString(4, phone != null && !phone.trim().isEmpty() ? phone.trim() : null);
            ps.setString(5, address != null && !address.trim().isEmpty() ? address.trim() : null);
            return ps;
        }, keyHolder);
        return extractId(keyHolder);
    }

    public int updateStaff(Long staffId, String fullName, String email, String phone, String address) {
        return jdbcTemplate.update(
                "UPDATE public.staff SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
                fullName,
                email != null && !email.trim().isEmpty() ? email.trim() : null,
                phone != null && !phone.trim().isEmpty() ? phone.trim() : null,
                address != null && !address.trim().isEmpty() ? address.trim() : null,
                staffId);
    }

    public int updateStaffUserActive(Long userId, boolean isActive) {
        return jdbcTemplate.update("UPDATE public.users SET is_active = ? WHERE id = ?", isActive, userId);
    }
}
