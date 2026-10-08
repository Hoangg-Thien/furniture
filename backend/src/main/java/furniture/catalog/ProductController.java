package furniture.catalog;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "${app.frontend-url:http://localhost:5173}")
public class ProductController {

    private final JdbcTemplate jdbcTemplate;

    public ProductController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<ProductResponse> getProducts() {
        return jdbcTemplate.query("""
                SELECT p.id, p.name, p.description, p.selling_price, p.image_url,
                       c.name AS category_name
                FROM public.products p
                JOIN public.categories c ON c.id = p.category_id
                WHERE p.is_active = TRUE
                ORDER BY p.id
                """, (resultSet, rowNumber) -> new ProductResponse(
                resultSet.getLong("id"),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getString("category_name"),
                resultSet.getBigDecimal("selling_price"),
                resultSet.getString("image_url")));
    }

    public record ProductResponse(
            Long id,
            String name,
            String description,
            String category,
            BigDecimal price,
            String imageUrl) {
    }
}
