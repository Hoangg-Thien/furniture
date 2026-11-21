package furniture;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import furniture.repository.ProductRepository;

class ProductOfferDisplayTest {
    @Test
    void catalogShowsBestCurrentProductOfferWithoutReplacingTheBasePrice() {
        var database = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2)
                .setName("offers;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE").build();
        try {
            var jdbc = new JdbcTemplate(database);
            jdbc.execute("CREATE TABLE categories (id BIGINT, name VARCHAR(50))");
            jdbc.execute("CREATE TABLE orders (id BIGINT, status VARCHAR(20), order_date TIMESTAMP)");
            jdbc.execute("CREATE TABLE order_items (order_id BIGINT, product_id BIGINT, quantity INT)");
            jdbc.execute("CREATE TABLE products (id BIGINT, name VARCHAR(50), description VARCHAR(50), category_id BIGINT, selling_price NUMERIC(15,2), image_url VARCHAR(100), quantity INT, is_active BOOLEAN)");
            jdbc.execute("CREATE TABLE promotion_programs (id BIGINT, status VARCHAR(20), start_date TIMESTAMP, end_date TIMESTAMP)");
            jdbc.execute("CREATE TABLE product_discounts (product_id BIGINT, promotion_program_id BIGINT, discount_percent NUMERIC(5,2), start_date TIMESTAMP, end_date TIMESTAMP)");
            jdbc.execute("INSERT INTO products VALUES (1, 'Sofa', '', NULL, 1000001, '', 5, TRUE), (2, 'Chair', '', NULL, 2000000, '', 0, TRUE), (3, 'Hidden', '', NULL, 10, '', 5, FALSE)");
            jdbc.execute("INSERT INTO promotion_programs VALUES (1, 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP + INTERVAL '1' DAY), (2, 'INACTIVE', CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP + INTERVAL '1' DAY), (3, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '1' DAY, CURRENT_TIMESTAMP + INTERVAL '2' DAY), (4, 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY)");
            for (var offer : new int[][] {{1, 50}, {1, 20}, {2, 90}, {3, 80}, {4, 75}}) {
                jdbc.update("INSERT INTO product_discounts VALUES (1, ?, ?, CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP + INTERVAL '1' DAY)", offer[0], offer[1]);
            }
            jdbc.execute("INSERT INTO product_discounts VALUES (1, 1, 95, CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY), (1, 1, 99, CURRENT_TIMESTAMP + INTERVAL '1' DAY, CURRENT_TIMESTAMP + INTERVAL '2' DAY)");
            var rows = new ProductRepository(jdbc).findAllActiveProducts();
            assertEquals(2, rows.size());
            assertEquals(0, new BigDecimal("1000001").compareTo(rows.get(0).price()));
            assertEquals(0, new BigDecimal("50").compareTo(rows.get(0).discountPercent()));
            assertEquals(0, new BigDecimal("500000").compareTo(rows.get(0).discountedPrice()));
            assertNull(rows.get(1).discountPercent());
            assertNull(rows.get(1).discountedPrice());
            assertEquals(0, rows.get(0).soldQuantity());
            assertFalse(rows.get(0).bestSeller());
            jdbc.execute("INSERT INTO products VALUES (4, 'Table', '', NULL, 10, '', 5, TRUE), (5, 'Desk', '', NULL, 10, '', 5, TRUE), (6, 'Lamp', '', NULL, 10, '', 5, TRUE)");
            jdbc.execute("INSERT INTO orders VALUES (1, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1' DAY), (2, 'CANCELLED', CURRENT_TIMESTAMP - INTERVAL '1' DAY), (3, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1' DAY), (4, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '40' DAY), (5, 'COMPLETED', CURRENT_TIMESTAMP + INTERVAL '1' DAY)");
            jdbc.execute("INSERT INTO order_items VALUES (1,1,8), (4,1,3), (1,2,3), (1,4,2), (1,5,1), (2,6,100), (3,6,100), (5,6,100), (1,3,100)");
            rows = new ProductRepository(jdbc).findAllActiveProducts();
            assertEquals(11, rows.get(0).soldQuantity());
            assertTrue(rows.get(0).bestSeller());
            assertTrue(rows.get(1).bestSeller());
            assertTrue(rows.get(2).bestSeller());
            assertFalse(rows.get(3).bestSeller());
            assertEquals(0, rows.get(4).soldQuantity());
            assertFalse(rows.get(4).bestSeller());
            jdbc.update("UPDATE orders SET order_date = CURRENT_TIMESTAMP - INTERVAL '40' DAY WHERE id = 1");
            rows = new ProductRepository(jdbc).findAllActiveProducts();
            assertEquals(11, rows.get(0).soldQuantity());
            assertTrue(rows.stream().noneMatch(row -> row.bestSeller()));
        } finally { database.shutdown(); }
    }
}
