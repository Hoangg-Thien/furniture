package furniture;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import furniture.controller.ProductController;
import furniture.repository.ProductRepository;
import furniture.service.ProductService;

class ProductStockTest {
    @Test
    void publicCatalogReturnsActualStockAndKeepsSoldOutProductsVisible() throws Exception {
        var database = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2).build();
        try {
            var jdbc = new JdbcTemplate(database);
            jdbc.execute("CREATE TABLE categories (id BIGINT PRIMARY KEY, name VARCHAR(100))");
            jdbc.execute("CREATE TABLE orders (id BIGINT, status VARCHAR(20), order_date TIMESTAMP)");
            jdbc.execute("CREATE TABLE order_items (order_id BIGINT, product_id BIGINT, quantity INT)");
            jdbc.execute("CREATE TABLE promotion_programs (id BIGINT, status VARCHAR(20), start_date TIMESTAMP, end_date TIMESTAMP)");
            jdbc.execute("CREATE TABLE product_discounts (product_id BIGINT, promotion_program_id BIGINT, discount_percent NUMERIC(5,2), start_date TIMESTAMP, end_date TIMESTAMP)");
            jdbc.execute("CREATE TABLE products (id BIGINT PRIMARY KEY, category_id BIGINT, name VARCHAR(100), description TEXT, selling_price NUMERIC, image_url TEXT, quantity INT, is_active BOOLEAN)");
            jdbc.execute("INSERT INTO categories VALUES (1, 'Sofa')");
            jdbc.execute("INSERT INTO products VALUES (1, 1, 'Low stock', NULL, 100, NULL, 2, TRUE), (2, 1, 'Sold out', NULL, 100, NULL, 0, TRUE), (3, 1, 'Hidden', NULL, 100, NULL, 99, FALSE)");
            var mvc = MockMvcBuilders.standaloneSetup(new ProductController(new ProductService(new ProductRepository(jdbc)))).build();
            mvc.perform(get("/api/products")).andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].quantity").value(2))
                    .andExpect(jsonPath("$[1].quantity").value(0));
            jdbc.update("UPDATE products SET quantity = 1 WHERE id = 1");
            mvc.perform(get("/api/products")).andExpect(jsonPath("$[0].quantity").value(1));
        } finally {
            database.shutdown();
        }
    }
}
