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

    public List<ProductResponse> findAllActiveProducts() {
        return jdbcTemplate.query("""
                SELECT p.id, p.name, p.description, p.selling_price, p.image_url,
                       COALESCE(c.name, 'Khác') AS category_name
                FROM public.products p
                LEFT JOIN public.categories c ON c.id = p.category_id
                WHERE COALESCE(p.is_active, TRUE) = TRUE
                ORDER BY p.id
                """, (resultSet, rowNumber) -> new ProductResponse(
                resultSet.getLong("id"),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getString("category_name"),
                resultSet.getBigDecimal("selling_price"),
                resultSet.getString("image_url")));
    }
}

