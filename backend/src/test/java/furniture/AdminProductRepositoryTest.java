package furniture;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import furniture.repository.AdminProductRepository;

class AdminProductRepositoryTest {
    @Test
    void paginationAndMissingGalleryImagesAreHandledAsClientInput() {
        var db = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2).build();
        try {
            var jdbc = new JdbcTemplate(db);
            jdbc.execute("CREATE TABLE categories (id BIGINT PRIMARY KEY, name VARCHAR)");
            jdbc.execute("CREATE TABLE products (id BIGINT PRIMARY KEY, name VARCHAR, category_id BIGINT, unit VARCHAR, selling_price NUMERIC, image_url VARCHAR, quantity INT, is_active BOOLEAN, description VARCHAR, created_at TIMESTAMP)");
            jdbc.execute("CREATE TABLE product_images (id BIGINT PRIMARY KEY, product_id BIGINT, is_primary BOOLEAN)");
            var repository = new AdminProductRepository(jdbc);
            var page = repository.searchProducts(null, null, null, null, -1, 0);
            assertEquals(0, page.page());
            assertEquals(1, page.size());
            assertTrue(page.content().isEmpty());
            assertDoesNotThrow(() -> repository.searchProducts(null, null, null, null, Integer.MAX_VALUE, Integer.MAX_VALUE));
            assertThrows(IllegalArgumentException.class, () -> repository.deleteProductImage(1L, 99L));
        } finally {
            db.shutdown();
        }
    }
}
