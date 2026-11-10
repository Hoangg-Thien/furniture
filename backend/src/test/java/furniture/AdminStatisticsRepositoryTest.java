package furniture;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

import furniture.repository.AdminStatisticsRepository;

class AdminStatisticsRepositoryTest {
    private EmbeddedDatabase database;
    private JdbcTemplate jdbc;
    private AdminStatisticsRepository repository;
    private final LocalDate day = LocalDate.of(2026, 11, 10);

    @BeforeEach
    void setup() {
        database = new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2)
                .setName("statistics_" + java.util.UUID.randomUUID() + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE").build();
        jdbc = new JdbcTemplate(database);
        repository = new AdminStatisticsRepository(jdbc);
        jdbc.execute("CREATE TABLE categories (id BIGINT PRIMARY KEY, name VARCHAR(100))");
        jdbc.execute("CREATE TABLE products (id BIGINT PRIMARY KEY, category_id BIGINT, quantity INT, is_active BOOLEAN)");
        jdbc.execute("CREATE TABLE orders (id BIGINT PRIMARY KEY, status VARCHAR(30), order_date TIMESTAMP)");
        jdbc.execute("CREATE TABLE order_items (order_id BIGINT, product_id BIGINT, quantity INT, amount NUMERIC(15,2))");
        jdbc.execute("CREATE TABLE invoices (final_amount NUMERIC(15,2), payment_status VARCHAR(30), payment_date TIMESTAMP)");
        jdbc.execute("CREATE TABLE purchase_receipts (total_amount NUMERIC(15,2), status VARCHAR(30), receipt_date TIMESTAMP)");
        jdbc.execute("CREATE TABLE customers (id BIGINT PRIMARY KEY)");
        jdbc.execute("INSERT INTO categories VALUES (1, 'Sofa'), (2, 'Empty')");
        jdbc.execute("INSERT INTO products VALUES (1, 1, 3, TRUE), (2, 2, 10, TRUE)");
        jdbc.execute("""
                INSERT INTO orders VALUES
                (1, 'COMPLETED', '2026-11-10 23:59:59.999999'),
                (2, 'PENDING', '2026-11-10 10:00:00'),
                (3, 'CANCELLED', '2026-11-10 11:00:00'),
                (4, 'COMPLETED', '2026-11-09 12:00:00'),
                (5, 'COMPLETED', '2026-11-11 00:00:00')
                """);
        jdbc.execute("INSERT INTO order_items VALUES (1, 1, 2, 200), (2, 1, 3, 300), (3, 1, 4, 400), (4, 1, 5, 500), (5, 1, 6, 600)");
        jdbc.execute("""
                INSERT INTO invoices VALUES
                (100, 'PAID', '2026-11-09 12:00:00'),
                (200, 'PAID', '2026-11-10 00:00:00'),
                (400, 'PAID', '2026-11-10 23:59:59.999999'),
                (800, 'PAID', '2026-11-11 00:00:00'),
                (999, 'PENDING', '2026-11-10 12:00:00'),
                (999, 'REFUNDED', '2026-11-10 12:00:00')
                """);
        jdbc.execute("INSERT INTO purchase_receipts VALUES (50, 'COMPLETED', '2026-11-10 23:59:59.999999'), (999, 'PENDING', '2026-11-10 12:00:00')");
    }

    @AfterEach
    void cleanup() {
        database.shutdown();
    }

    @Test
    void categoryTotalsExcludeUnfinishedCancelledAndOutOfRangeOrders() {
        var categories = repository.getCategoryRevenueShare(day, day);
        assertEquals(2, categories.size());
        assertEquals(0, new BigDecimal("200").compareTo(categories.getFirst().totalRevenue()));
        assertEquals(2L, categories.getFirst().soldQuantity());
        assertEquals(100.0, categories.getFirst().percentage());
        assertEquals(0, categories.get(1).totalRevenue().signum());
        assertTrue(repository.getCategoryRevenueShare(day.plusYears(1), day.plusYears(1))
                .stream().allMatch(category -> category.totalRevenue().signum() == 0));
    }

    @Test
    void overviewIncludesLastFractionalSecondAndComparesExactlyOnePreviousDay() {
        var overview = repository.getOverview(day, day);
        assertEquals(0, new BigDecimal("600").compareTo(overview.totalRevenue()));
        assertEquals(500.0, overview.revenueGrowthPercent());
        assertEquals(1L, overview.completedOrdersCount());
        assertEquals(2L, overview.totalItemsSold());
        assertEquals(0, new BigDecimal("50").compareTo(overview.totalPurchaseCost()));
        assertEquals(0, new BigDecimal("550").compareTo(overview.grossProfit()));
    }

    @Test
    void trendUsesSamePaymentAndImportBoundariesAsOverview() {
        var points = repository.getDailyRevenueTrend(day, day);
        assertEquals(1, points.size());
        assertEquals("10/11", points.getFirst().dateLabel());
        assertEquals(0, new BigDecimal("600").compareTo(points.getFirst().salesRevenue()));
        assertEquals(0, new BigDecimal("50").compareTo(points.getFirst().importCost()));
        assertEquals(2L, points.getFirst().ordersCount());
    }
}
