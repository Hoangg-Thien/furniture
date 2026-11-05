package furniture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import furniture.config.AdminAccessInterceptor;
import furniture.controller.AdminSessionController;
import furniture.model.LoginRequest;
import furniture.model.admin.product.ProductDetailDto;
import furniture.repository.AuthRepository;
import furniture.repository.AdminProductRepository;
import furniture.repository.AdminCategoryRepository;
import furniture.service.AdminSessionService;
import furniture.service.AdminProductService;
import furniture.service.AuthService;
import furniture.service.FileStorageService;
import furniture.util.PasswordUtil;

class AdminPermissionsTest {
    private EmbeddedDatabase database;
    private JdbcTemplate jdbc;
    private AdminSessionService sessions;
    private MockMvc mvc;

    @RestController
    static class Probe {
        @RequestMapping({"/api/admin/**", "/api/vouchers/**", "/api/auth/users", "/api/auth/customers", "/api/orders/**", "/api/auth/me", "/api/auth/update/**"})
        public Map<String, String> probe() { return Map.of("result", "OK"); }
    }

    @BeforeEach
    void setup() {
        database = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2).build();
        jdbc = new JdbcTemplate(database);
        jdbc.execute("CREATE TABLE users (id BIGINT PRIMARY KEY, username VARCHAR(50), password_hash VARCHAR(100), role VARCHAR(20), is_active BOOLEAN DEFAULT TRUE)");
        jdbc.execute("CREATE TABLE staff (id BIGINT PRIMARY KEY, user_id BIGINT UNIQUE, full_name VARCHAR(150), email VARCHAR(100), phone VARCHAR(30), address VARCHAR(100))");
        jdbc.execute("CREATE TABLE customers (id BIGINT PRIMARY KEY, user_id BIGINT, full_name VARCHAR(150), email VARCHAR(100), phone VARCHAR(30), address VARCHAR(100))");
        for (int id = 1; id <= 5; id++) jdbc.update("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
                id, "user" + id, PasswordUtil.hash("testpass"), id == 1 ? "ADMIN" : id == 5 ? "CUSTOMER" : "STAFF");
        for (int id = 2; id <= 4; id++) jdbc.update("INSERT INTO staff (id, user_id, full_name) VALUES (?, ?, ?)", id * 10, id, "Staff " + id);
        jdbc.update("INSERT INTO customers (id, user_id) VALUES (50, 5)");
        jdbc.execute("CREATE TABLE orders (id BIGINT PRIMARY KEY, customer_id BIGINT)");
        jdbc.execute("INSERT INTO orders VALUES (1, 50), (2, 51)");
        migrate();
        jdbc.update("UPDATE staff SET staff_type = 'WAREHOUSE' WHERE user_id = 3");
        jdbc.update("UPDATE staff SET staff_type = 'CONTENT' WHERE user_id = 4");
        sessions = new AdminSessionService(jdbc, new AuthService(new AuthRepository(jdbc)));
        mvc = MockMvcBuilders.standaloneSetup(new Probe(), new AdminSessionController(sessions))
                .addInterceptors(new AdminAccessInterceptor(sessions, jdbc)).build();
    }

    @AfterEach
    void shutdown() { database.shutdown(); }

    private void migrate() { new ResourceDatabasePopulator(new ClassPathResource("staff_permissions.sql")).execute(database); }
    private String token(int id) { return (String) sessions.login(new LoginRequest("user" + id, "testpass")).get("accessToken"); }

    @Test
    void migrationIsRepeatableAndPreservesExistingStaffAssignments() {
        migrate();
        assertEquals(3, jdbc.queryForObject("SELECT COUNT(*) FROM staff", Integer.class));
        assertEquals("SALES", jdbc.queryForObject("SELECT staff_type FROM staff WHERE user_id = 2", String.class));
        assertEquals("WAREHOUSE", jdbc.queryForObject("SELECT staff_type FROM staff WHERE user_id = 3", String.class));
        assertThrows(Exception.class, () -> jdbc.update("UPDATE staff SET staff_type = 'ADMIN' WHERE user_id = 2"));
    }

    @Test
    void loginRejectsBadCredentialsAndCustomerAndStoresOnlyHashedTokens() throws Exception {
        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"user2\",\"password\":\"wrong\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"user5\",\"password\":\"testpass\"}")).andExpect(status().isUnauthorized());
        String token = token(2);
        assertTrue(token.length() >= 40);
        assertEquals(PasswordUtil.hash(token), jdbc.queryForObject("SELECT token_hash FROM admin_sessions", String.class));
        assertNotEquals(token, jdbc.queryForObject("SELECT token_hash FROM admin_sessions", String.class));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM admin_sessions WHERE expires_at BETWEEN CURRENT_TIMESTAMP + INTERVAL '479' MINUTE AND CURRENT_TIMESTAMP + INTERVAL '481' MINUTE", Integer.class));
    }

    @Test
    void everyRoleHasOnlyItsExplicitPermissions() throws Exception {
        String[][] operations = {
            {"GET", "/api/admin/products"}, {"GET", "/api/admin/categories"}, {"GET", "/api/admin/orders"},
            {"POST", "/api/admin/products"}, {"PUT", "/api/admin/products/1"},
            {"PUT", "/api/admin/products/1/content"}, {"POST", "/api/admin/products/1/images/url"},
            {"PUT", "/api/admin/products/1/images/2/set-primary"}, {"DELETE", "/api/admin/products/1/images/2"},
            {"PUT", "/api/admin/products/1/toggle-status"}, {"GET", "/api/admin/suppliers"},
            {"POST", "/api/admin/suppliers/1/receipts"}, {"PATCH", "/api/admin/suppliers/1/receipts/1/status"},
            {"DELETE", "/api/admin/suppliers/1"}, {"PUT", "/api/admin/orders/1/confirm"},
            {"GET", "/api/admin/staff"}, {"GET", "/api/admin/statistics/overview"},
            {"POST", "/api/admin/invoices"}, {"GET", "/api/admin/customers"},
            {"POST", "/api/vouchers"}, {"PUT", "/api/vouchers/1/approve"}, {"GET", "/api/auth/users"},
            {"POST", "/api/admin/new-module"}, {"PUT", "/api/admin/products/1/content/extra"}
        };
        Map<Integer, Set<Integer>> allowed = Map.of(2, Set.of(0, 1, 2, 14, 17, 18),
                3, Set.of(0, 1, 2, 10, 11, 12), 4, Set.of(0, 1, 5, 6, 7, 8));
        for (int user = 1; user <= 4; user++) {
            String bearer = "Bearer " + token(user);
            for (int op = 0; op < operations.length; op++) {
                var request = request(HttpMethod.valueOf(operations[op][0]), operations[op][1]).header("Authorization", bearer);
                mvc.perform(request).andExpect(user == 1 || allowed.get(user).contains(op) ? status().isOk() : status().isForbidden());
            }
        }
    }

    @Test
    void missingForgedExpiredAndRevokedSessionsCannotAccessAdminApis() throws Exception {
        mvc.perform(get("/api/admin/products")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/products").header("Authorization", "Bearer forged").header("X-Current-User-Id", "1"))
                .andExpect(status().isUnauthorized());
        String token = token(2);
        mvc.perform(get("/api/admin/staff").header("Authorization", "Bearer " + token).header("X-Role", "ADMIN"))
                .andExpect(status().isForbidden());
        jdbc.update("UPDATE admin_sessions SET expires_at = TIMESTAMP '2000-01-01 00:00:00'");
        mvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        token = token(2);
        mvc.perform(post("/api/auth/admin/logout").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    @Test
    void changingPositionAndLockingAccountAffectsExistingSessionImmediately() throws Exception {
        String token = token(2);
        mvc.perform(put("/api/admin/orders/1/confirm").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        jdbc.update("UPDATE staff SET staff_type = 'CONTENT' WHERE user_id = 2");
        mvc.perform(put("/api/admin/orders/1/confirm").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/products/1/content").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        jdbc.update("UPDATE users SET is_active = false WHERE id = 2");
        mvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    @Test
    void matrixParametersAndUnknownPositionsDoNotBypassChecks() throws Exception {
        var encoded = new org.springframework.mock.web.MockHttpServletRequest();
        encoded.setMethod("POST");
        encoded.setRequestURI("/api/admin%3Bignored/products");
        assertThrows(ResponseStatusException.class, () -> new AdminAccessInterceptor(sessions, jdbc).preHandle(encoded, new org.springframework.mock.web.MockHttpServletResponse(), new Object()));
        mvc.perform(post("/api/admin;ignored/products")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin;ignored/products").header("Authorization", "Bearer " + token(4))).andExpect(status().isForbidden());
        assertFalse(AdminAccessInterceptor.allows(new furniture.model.admin.AdminIdentity(9L, null, "STAFF", "SALES", null), "GET", "/api/admin/products"));
        assertFalse(AdminAccessInterceptor.allows(new furniture.model.admin.AdminIdentity(9L, 90L, "STAFF", null, null), "GET", "/api/admin/products"));
    }

    @Test
    void customerAndSharedOrderApisCannotBypassPositionOrOwnership() throws Exception {
        mvc.perform(get("/api/orders/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/1").header("Authorization", "Bearer " + token(4))).andExpect(status().isForbidden());
        mvc.perform(post("/api/orders/1/cancel").header("Authorization", "Bearer " + token(3))).andExpect(status().isForbidden());
        String customer = "Bearer " + sessions.issueToken(5L);
        mvc.perform(get("/api/orders/1").header("Authorization", customer)).andExpect(status().isOk());
        mvc.perform(get("/api/orders/2").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(post("/api/orders/FUNI-2026-00002/cancel").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders").param("customerId", "51").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(put("/api/auth/update/1").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/me").param("userId", "1").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/products").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(post("/api/orders/1/new-operation").header("Authorization", customer)).andExpect(status().isForbidden());
        mvc.perform(post("/api/orders/1/new-operation").header("Authorization", "Bearer " + token(2))).andExpect(status().isForbidden());
    }

    @Test
    void contentWritesRejectHiddenPriceStockAndStatusFields() {
        AdminProductRepository products = mock(AdminProductRepository.class);
        AdminProductService service = new AdminProductService(products, mock(AdminCategoryRepository.class), mock(FileStorageService.class), mock(furniture.repository.ProductAuditRepository.class));
        when(products.findDetailById(1L)).thenReturn(new ProductDetailDto(1L, "Sofa", 1L, "Living", "piece", BigDecimal.TEN, "/uploads/original.jpg", 7, true, "Original description", List.of()));
        for (String field : List.of("sellingPrice", "quantity", "categoryId", "unit", "isActive")) {
            assertThrows(IllegalArgumentException.class, () -> service.updateProductContent(1L, Map.of("name", "Sofa", field, 0), 1L));
        }
        assertThrows(IllegalArgumentException.class, () -> service.updateProductContent(1L, Map.of("name", 123), 1L));
        assertThrows(IllegalArgumentException.class, () -> service.updateProductContent(1L, Map.of("name", "   "), 1L));
        service.updateProductContent(1L, Map.of("name", " Updated sofa ", "description", "New description"), 1L);
        verify(products).updateProductContent(1L, "Updated sofa", "New description", "/uploads/original.jpg");
        service.updateProductContent(1L, Map.of("name", "Only name"), 1L);
        verify(products).updateProductContent(1L, "Only name", "Original description", "/uploads/original.jpg");
        verify(products, never()).updateProduct(anyLong(), any());
    }
}
