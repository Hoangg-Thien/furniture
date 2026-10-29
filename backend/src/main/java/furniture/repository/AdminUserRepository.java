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
import furniture.model.admin.UserSummaryResponse;

@Repository
public class AdminUserRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminUserRepository(JdbcTemplate jdbcTemplate) {
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

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.users WHERE LOWER(username) = LOWER(?)",
                Integer.class,
                username != null ? username.trim() : "");
        return count != null && count > 0;
    }

    public Optional<Map<String, Object>> findById(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, username, role, is_active, created_at FROM public.users WHERE id = ?",
                id);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rows.get(0));
    }

    public PageResponse<UserSummaryResponse> searchUsers(String keyword, String role, Boolean isActive, int page, int size) {
        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.trim().isEmpty()) {
            whereClause.append(" AND LOWER(username) LIKE ? ");
            params.add("%" + keyword.trim().toLowerCase() + "%");
        }

        if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role.trim())) {
            whereClause.append(" AND role = ? ");
            params.add(role.trim().toUpperCase());
        }

        if (isActive != null) {
            whereClause.append(" AND is_active = ? ");
            params.add(isActive);
        }

        String countSql = "SELECT COUNT(*) FROM public.users " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());
        long totalElements = totalCount != null ? totalCount : 0L;

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        int offset = Math.max(0, page) * size;

        String selectSql = "SELECT id, username, role, is_active, created_at FROM public.users "
                + whereClause
                + " ORDER BY id DESC LIMIT ? OFFSET ?";

        List<Object> selectParams = new ArrayList<>(params);
        selectParams.add(size);
        selectParams.add(offset);

        List<UserSummaryResponse> content = jdbcTemplate.query(selectSql, (rs, rowNum) -> {
            Long id = rs.getLong("id");
            String username = rs.getString("username");
            String r = rs.getString("role");
            Boolean active = rs.getBoolean("is_active");
            Timestamp ts = rs.getTimestamp("created_at");
            LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;
            return new UserSummaryResponse(id, username, r, active, createdAt);
        }, selectParams.toArray());

        boolean isFirst = page <= 0;
        boolean isLast = totalPages <= 1 || page >= totalPages - 1;

        return new PageResponse<>(content, page, size, totalElements, totalPages, isFirst, isLast);
    }

    public Long insertUser(String username, String passwordHash, String role, boolean isActive) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.users (username, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
                    new String[] { "id" });
            ps.setString(1, username.trim().toLowerCase());
            ps.setString(2, passwordHash);
            ps.setString(3, role != null ? role.trim().toUpperCase() : "STAFF");
            ps.setBoolean(4, isActive);
            return ps;
        }, keyHolder);
        return extractId(keyHolder);
    }

    public int updateActiveStatus(Long id, boolean isActive) {
        return jdbcTemplate.update("UPDATE public.users SET is_active = ? WHERE id = ?", isActive, id);
    }

    public int updatePassword(Long id, String passwordHash) {
        return jdbcTemplate.update("UPDATE public.users SET password_hash = ? WHERE id = ?", passwordHash, id);
    }
}
