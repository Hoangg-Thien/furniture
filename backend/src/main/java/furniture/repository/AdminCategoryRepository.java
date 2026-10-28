package furniture.repository;

import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.admin.category.CategoryResponse;
import jakarta.annotation.PostConstruct;

@Repository
public class AdminCategoryRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminCategoryRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AdminCategoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureActiveColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true");
            log.info("Đã bảo đảm cột is_active tồn tại trong public.categories");
        } catch (Exception ex) {
            log.warn("Lưu ý khi kiểm tra cột is_active trong public.categories: {}", ex.getMessage());
        }
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

    public List<CategoryResponse> findAllWithProductCount(String search, Boolean isActive) {
        StringBuilder sql = new StringBuilder("""
                SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count,
                       COALESCE(c.is_active, true) AS is_active
                FROM public.categories c
                LEFT JOIN public.products p ON p.category_id = c.id
                WHERE 1=1
                """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(c.name) LIKE LOWER(?) OR (c.description IS NOT NULL AND LOWER(c.description) LIKE LOWER(?))) ");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        if (isActive != null) {
            sql.append(" AND COALESCE(c.is_active, true) = ? ");
            params.add(isActive);
        }

        sql.append("""
                GROUP BY c.id, c.name, c.description, c.is_active
                ORDER BY c.id ASC
                """);

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new CategoryResponse(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getLong("product_count"),
                rs.getBoolean("is_active")
        ), params.toArray());
    }

    public List<CategoryResponse> findAllWithProductCount(String search) {
        return findAllWithProductCount(search, null);
    }

    public CategoryResponse findById(Long id) {
        String sql = """
                SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count,
                       COALESCE(c.is_active, true) AS is_active
                FROM public.categories c
                LEFT JOIN public.products p ON p.category_id = c.id
                WHERE c.id = ?
                GROUP BY c.id, c.name, c.description, c.is_active
                """;

        List<CategoryResponse> list = jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryResponse(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getLong("product_count"),
                rs.getBoolean("is_active")
        ), id);

        return list.isEmpty() ? null : list.get(0);
    }

    public boolean existsByName(String name) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.categories WHERE LOWER(name) = LOWER(?)",
                Integer.class,
                name.trim()
        );
        return count != null && count > 0;
    }

    public boolean existsByNameExcludingId(String name, Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.categories WHERE LOWER(name) = LOWER(?) AND id != ?",
                Integer.class,
                name.trim(),
                id
        );
        return count != null && count > 0;
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.categories WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public Long countProductsByCategoryId(Long categoryId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.products WHERE category_id = ?",
                Long.class,
                categoryId
        );
        return count != null ? count : 0L;
    }

    public Long countActiveProductsByCategoryId(Long categoryId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.products WHERE category_id = ? AND is_active = true",
                Long.class,
                categoryId
        );
        return count != null ? count : 0L;
    }

    public Long insertCategory(String name, String description, Boolean isActive) {
        boolean active = isActive == null || Boolean.TRUE.equals(isActive);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.categories (name, description, is_active) VALUES (?, ?, ?)",
                    new String[]{"id"}
            );
            ps.setString(1, name.trim());
            ps.setString(2, description != null && !description.trim().isEmpty() ? description.trim() : null);
            ps.setBoolean(3, active);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public Long insertCategory(String name, String description) {
        return insertCategory(name, description, true);
    }

    public void updateCategory(Long id, String name, String description, Boolean isActive) {
        if (isActive != null) {
            jdbcTemplate.update(
                    "UPDATE public.categories SET name = ?, description = ?, is_active = ? WHERE id = ?",
                    name.trim(),
                    description != null && !description.trim().isEmpty() ? description.trim() : null,
                    isActive,
                    id
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE public.categories SET name = ?, description = ? WHERE id = ?",
                    name.trim(),
                    description != null && !description.trim().isEmpty() ? description.trim() : null,
                    id
            );
        }
    }

    public void updateCategory(Long id, String name, String description) {
        updateCategory(id, name, description, null);
    }

    public void updateCategoryActive(Long id, boolean isActive) {
        jdbcTemplate.update("UPDATE public.categories SET is_active = ? WHERE id = ?", isActive, id);
    }

    public void updateProductsActiveByCategoryId(Long categoryId, boolean isActive) {
        jdbcTemplate.update("UPDATE public.products SET is_active = ? WHERE category_id = ?", isActive, categoryId);
    }

    public void deleteCategory(Long id) {
        jdbcTemplate.update("DELETE FROM public.categories WHERE id = ?", id);
    }
}
