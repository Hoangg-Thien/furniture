package furniture.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import furniture.model.ProductResponse;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public java.util.Map<String, Object> findActiveDetail(long id) {
        var rows = jdbcTemplate.queryForList("""
                SELECT p.name, p.description, p.selling_price AS price, p.image_url,
                       c.name AS category, d.sku, d.brand, d.origin, d.material,
                       d.dimensions, d.weight_kg, d.color, d.warranty_months,
                       d.care_instructions, d.detailed_description
                FROM public.products p
                LEFT JOIN public.product_details d ON d.product_id = p.id
                LEFT JOIN public.categories c ON c.id = p.category_id
                WHERE p.id = ? AND COALESCE(p.is_active, TRUE) = TRUE
                """, id);
        if (rows.isEmpty()) return null;
        var detail = new java.util.LinkedHashMap<String, Object>();
        rows.get(0).forEach((key, value) -> detail.put(key.toLowerCase(java.util.Locale.ROOT), value));
        return detail;
    }

    public List<ProductResponse> findAllActiveProducts() {
        return jdbcTemplate.query("""
                WITH sales AS (
                    SELECT oi.product_id, SUM(oi.quantity) AS sold_quantity,
                           SUM(CASE WHEN o.order_date >= CURRENT_TIMESTAMP - INTERVAL '30' DAY
                               THEN oi.quantity ELSE 0 END) AS recent_quantity
                    FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
                    WHERE o.status = 'COMPLETED' AND o.order_date <= CURRENT_TIMESTAMP
                    GROUP BY oi.product_id
                ), ranked_sales AS (
                    SELECT s.*, ROW_NUMBER() OVER (ORDER BY s.recent_quantity DESC, s.product_id) AS sales_rank
                    FROM sales s JOIN public.products p ON p.id = s.product_id
                    WHERE COALESCE(p.is_active, TRUE) = TRUE AND s.recent_quantity > 0
                )
                SELECT p.id, p.name, p.description, p.selling_price, p.image_url, p.quantity,
                       COALESCE(c.name, 'Khác') AS category_name,
                       COALESCE(s.sold_quantity, 0) AS sold_quantity,
                       (COALESCE(r.sales_rank, 4) <= 3) AS best_seller,
                       offer.discount_percent,
                       p.selling_price - ROUND(p.selling_price * offer.discount_percent / 100, 0) AS discounted_price
                FROM public.products p
                LEFT JOIN public.categories c ON c.id = p.category_id
                LEFT JOIN sales s ON s.product_id = p.id
                LEFT JOIN ranked_sales r ON r.product_id = p.id
                LEFT JOIN (
                    SELECT pd.product_id, MAX(pd.discount_percent) AS discount_percent
                    FROM public.product_discounts pd
                    JOIN public.promotion_programs pp ON pp.id = pd.promotion_program_id
                    WHERE pp.status = 'ACTIVE' AND CAST(CURRENT_TIMESTAMP AT TIME ZONE INTERVAL '7' HOUR AS TIMESTAMP) BETWEEN pp.start_date AND pp.end_date
                      AND CAST(CURRENT_TIMESTAMP AT TIME ZONE INTERVAL '7' HOUR AS TIMESTAMP) BETWEEN pd.start_date AND pd.end_date
                      AND pd.discount_percent > 0 AND pd.discount_percent <= 100
                    GROUP BY pd.product_id
                ) offer ON offer.product_id = p.id
                WHERE COALESCE(p.is_active, TRUE) = TRUE
                ORDER BY p.id
                """, (resultSet, rowNumber) -> new ProductResponse(
                resultSet.getLong("id"),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getString("category_name"),
                resultSet.getBigDecimal("selling_price"),
                resultSet.getString("image_url"),
                resultSet.getInt("quantity"),
                resultSet.getBigDecimal("discount_percent"),
                resultSet.getBigDecimal("discounted_price"),
                resultSet.getLong("sold_quantity"),
                resultSet.getBoolean("best_seller")));
    }
}

