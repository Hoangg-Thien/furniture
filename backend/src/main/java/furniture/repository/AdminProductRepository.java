package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.admin.PageResponse;
import furniture.model.admin.product.ProductDetailDto;
import furniture.model.admin.product.ProductImageDto;
import furniture.model.admin.product.ProductSummaryDto;
import furniture.model.admin.product.SaveProductRequest;
import jakarta.annotation.PostConstruct;

@Repository
public class AdminProductRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminProductRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AdminProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureProductImagesTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS public.product_images (
                        id BIGSERIAL PRIMARY KEY,
                        product_id BIGINT NOT NULL,
                        image_url TEXT NOT NULL,
                        is_primary BOOLEAN NOT NULL DEFAULT false,
                        display_order INT NOT NULL DEFAULT 0,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) 
                            REFERENCES public.products (id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id);
                    CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images (product_id, is_primary);
                    """);
            log.info("Bảo đảm bảng public.product_images đã sẵn sàng");
        } catch (Exception ex) {
            log.warn("Lưu ý khi kiểm tra bảng product_images: {}", ex.getMessage());
        }
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

    public PageResponse<ProductSummaryDto> searchProducts(
            Long categoryId, String search, Boolean lowStock, Boolean isActive, int page, int size) {

        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (categoryId != null && categoryId > 0) {
            whereClause.append(" AND p.category_id = ? ");
            params.add(categoryId);
        }

        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (LOWER(p.name) LIKE LOWER(?) OR (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(?))) ");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        if (Boolean.TRUE.equals(lowStock)) {
            whereClause.append(" AND p.quantity < 5 ");
        }

        if (isActive != null) {
            whereClause.append(" AND p.is_active = ? ");
            params.add(isActive);
        }

        String countSql = "SELECT COUNT(*) FROM public.products p " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());
        int totalElements = totalCount != null ? totalCount : 0;
        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        int offset = page * size;
        String selectSql = """
                SELECT p.id, p.name, p.category_id, c.name AS category_name,
                       p.unit, p.selling_price, p.image_url, p.quantity, p.is_active, p.created_at
                FROM public.products p
                LEFT JOIN public.categories c ON c.id = p.category_id
                """ + whereClause + """
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?
                """;

        List<Object> queryParams = new ArrayList<>(params);
        queryParams.add(size);
        queryParams.add(offset);

        List<ProductSummaryDto> items = jdbcTemplate.query(selectSql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("created_at");
            LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;
            return new ProductSummaryDto(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getLong("category_id"),
                    rs.getString("category_name"),
                    rs.getString("unit"),
                    rs.getBigDecimal("selling_price"),
                    rs.getString("image_url"),
                    rs.getInt("quantity"),
                    rs.getBoolean("is_active"),
                    createdAt
            );
        }, queryParams.toArray());

        return new PageResponse<>(items, page, size, totalElements, totalPages);
    }

    public ProductDetailDto findDetailById(Long id) {
        String sql = """
                SELECT p.id, p.name, p.category_id, c.name AS category_name,
                       p.unit, p.selling_price, p.image_url, p.quantity, p.is_active, p.description
                FROM public.products p
                LEFT JOIN public.categories c ON c.id = p.category_id
                WHERE p.id = ?
                """;

        List<ProductDetailDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> new ProductDetailDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getLong("category_id"),
                rs.getString("category_name"),
                rs.getString("unit"),
                rs.getBigDecimal("selling_price"),
                rs.getString("image_url"),
                rs.getInt("quantity"),
                rs.getBoolean("is_active"),
                rs.getString("description"),
                new ArrayList<>()
        ), id);

        if (list.isEmpty()) return null;

        ProductDetailDto base = list.get(0);
        List<ProductImageDto> images = findImagesByProductId(id);

        return new ProductDetailDto(
                base.id(), base.name(), base.categoryId(), base.categoryName(),
                base.unit(), base.sellingPrice(), base.imageUrl(), base.quantity(),
                base.isActive(), base.description(), images
        );
    }

    public List<ProductImageDto> findImagesByProductId(Long productId) {
        String sql = """
                SELECT id, image_url, is_primary, display_order
                FROM public.product_images
                WHERE product_id = ?
                ORDER BY is_primary DESC, display_order ASC, id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new ProductImageDto(
                rs.getLong("id"),
                rs.getString("image_url"),
                rs.getBoolean("is_primary"),
                rs.getInt("display_order")
        ), productId);
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.products WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public Long insertProduct(SaveProductRequest req) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        boolean isActive = req.isActive() == null || Boolean.TRUE.equals(req.isActive());
        BigDecimal price = req.sellingPrice() != null ? req.sellingPrice() : BigDecimal.ZERO;
        int qty = req.quantity() != null ? req.quantity() : 0;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO public.products (
                        category_id, name, description, unit, selling_price, image_url, quantity, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, new String[]{"id"});
            ps.setLong(1, req.categoryId());
            ps.setString(2, req.name().trim());
            ps.setString(3, req.description() != null ? req.description().trim() : null);
            ps.setString(4, req.unit() != null ? req.unit().trim() : "Cái");
            ps.setBigDecimal(5, price);
            ps.setString(6, req.imageUrl() != null && !req.imageUrl().trim().isEmpty() ? req.imageUrl().trim() : null);
            ps.setInt(7, qty);
            ps.setBoolean(8, isActive);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void updateProduct(Long id, SaveProductRequest req) {
        boolean isActive = req.isActive() == null || Boolean.TRUE.equals(req.isActive());
        BigDecimal price = req.sellingPrice() != null ? req.sellingPrice() : BigDecimal.ZERO;
        int qty = req.quantity() != null ? req.quantity() : 0;

        jdbcTemplate.update("""
                UPDATE public.products
                SET category_id = ?, name = ?, description = ?, unit = ?,
                    selling_price = ?, quantity = ?, is_active = ?,
                    image_url = COALESCE(?, image_url)
                WHERE id = ?
                """,
                req.categoryId(),
                req.name().trim(),
                req.description() != null ? req.description().trim() : null,
                req.unit() != null ? req.unit().trim() : "Cái",
                price,
                qty,
                isActive,
                req.imageUrl() != null && !req.imageUrl().trim().isEmpty() ? req.imageUrl().trim() : null,
                id
        );
    }

    public void updateProductActive(Long id, boolean isActive) {
        jdbcTemplate.update("UPDATE public.products SET is_active = ? WHERE id = ?", isActive, id);
    }

    public void updateProductImageUrl(Long id, String imageUrl) {
        jdbcTemplate.update("UPDATE public.products SET image_url = ? WHERE id = ?", imageUrl, id);
    }

    public Long insertProductImage(Long productId, String imageUrl, boolean isPrimary, int displayOrder) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO public.product_images (product_id, image_url, is_primary, display_order)
                    VALUES (?, ?, ?, ?)
                    """, new String[]{"id"});
            ps.setLong(1, productId);
            ps.setString(2, imageUrl.trim());
            ps.setBoolean(3, isPrimary);
            ps.setInt(4, displayOrder);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void setPrimaryImage(Long productId, Long imageId) {
        // 1. Reset all images of this product to is_primary = false
        jdbcTemplate.update("UPDATE public.product_images SET is_primary = false WHERE product_id = ?", productId);

        // 2. Set this image to is_primary = true
        jdbcTemplate.update("UPDATE public.product_images SET is_primary = true WHERE id = ? AND product_id = ?", imageId, productId);

        // 3. Update products.image_url
        String imageUrl = jdbcTemplate.queryForObject(
                "SELECT image_url FROM public.product_images WHERE id = ?",
                String.class,
                imageId
        );

        if (imageUrl != null) {
            updateProductImageUrl(productId, imageUrl);
        }
    }

    public void deleteProductImage(Long productId, Long imageId) {
        // Kiểm tra xem ảnh sắp xóa có phải là primary không
        Boolean isPrimary = jdbcTemplate.queryForObject(
                "SELECT is_primary FROM public.product_images WHERE id = ? AND product_id = ?",
                Boolean.class,
                imageId,
                productId
        );

        jdbcTemplate.update("DELETE FROM public.product_images WHERE id = ? AND product_id = ?", imageId, productId);

        if (Boolean.TRUE.equals(isPrimary)) {
            // Lấy ảnh kế tiếp làm primary nếu còn ảnh
            List<Map<String, Object>> remaining = jdbcTemplate.queryForList(
                    "SELECT id, image_url FROM public.product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC LIMIT 1",
                    productId
            );

            if (!remaining.isEmpty()) {
                Long nextId = ((Number) remaining.get(0).get("id")).longValue();
                String nextUrl = (String) remaining.get(0).get("image_url");
                jdbcTemplate.update("UPDATE public.product_images SET is_primary = true WHERE id = ?", nextId);
                updateProductImageUrl(productId, nextUrl);
            } else {
                updateProductImageUrl(productId, null);
            }
        }
    }
}
