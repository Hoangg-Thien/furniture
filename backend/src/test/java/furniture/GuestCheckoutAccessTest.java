package furniture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import furniture.config.AdminAccessInterceptor;
import furniture.controller.OrderController;
import furniture.model.admin.AdminIdentity;
import furniture.service.AdminSessionService;
import furniture.service.OrderService;
import furniture.util.PasswordUtil;

class GuestCheckoutAccessTest {
    private EmbeddedDatabase database;
    private MockMvc mvc;
    private OrderService orders;
    private final String token = "a".repeat(43);

    @BeforeEach
    void setup() {
        database = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2).build();
        var jdbc = new JdbcTemplate(database);
        jdbc.execute("CREATE TABLE customers (id BIGINT PRIMARY KEY, user_id BIGINT)");
        jdbc.execute("CREATE TABLE orders (id BIGINT PRIMARY KEY, customer_id BIGINT, guest_token_hash VARCHAR(64))");
        jdbc.execute("INSERT INTO customers VALUES (1, NULL), (2, 20)");
        jdbc.update("INSERT INTO orders VALUES (1, 1, ?), (2, 1, ?), (3, 2, ?)",
                PasswordUtil.hash(token), PasswordUtil.hash("b".repeat(43)), PasswordUtil.hash(token));
        var sessions = mock(AdminSessionService.class);
        when(sessions.authenticate(null)).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        when(sessions.authenticate("Bearer customer")).thenReturn(new AdminIdentity(20L, null, "CUSTOMER", null, 2L));
        orders = mock(OrderService.class);
        mvc = MockMvcBuilders.standaloneSetup(new OrderController(orders))
                .addInterceptors(new AdminAccessInterceptor(sessions, jdbc)).build();
    }

    @AfterEach
    void cleanup() { database.shutdown(); }

    @Test
    void publicCreationAcceptsOnlyGuestIdentityAndStillValidatesInput() throws Exception {
        when(orders.createOrder(any())).thenThrow(new IllegalArgumentException("Invalid shipping information"));
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verify(orders).createOrder(any());
        clearInvocations(orders);
        for (String body : List.of("{\"customerId\":2}", "{\"userId\":20}", "{\"customerId\":0}")) {
            mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(orders);
    }

    @Test
    void tokenAllowsOnlyItsGuestOrderAndCannotListOrdersOrBypassAccountOwnership() throws Exception {
        when(orders.getOrderById(1L)).thenReturn(Map.of("order", Map.of("id", 1), "items", List.of()));
        when(orders.cancelOrder(1L)).thenReturn(true);
        mvc.perform(get("/api/orders/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/1").param("token", token)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/1").header("X-Order-Token", token)).andExpect(status().isOk());
        mvc.perform(post("/api/orders/FUNI-2026-000001/cancel").header("X-Order-Token", token)).andExpect(status().isOk());
        for (String path : List.of("/api/orders/2", "/api/orders/3", "/api/orders?customerId=1", "/api/orders/999999999999999999999")) {
            mvc.perform(get(path).header("X-Order-Token", token)).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/orders/1").header("X-Order-Token", "forged")).andExpect(status().isForbidden());
        mvc.perform(post("/api/orders/2/cancel").header("X-Order-Token", token)).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders/1").header("Authorization", "Bearer customer")).andExpect(status().isForbidden());
        verify(orders, never()).getOrderById(2L);
        verify(orders, never()).getOrderById(3L);
        verify(orders, never()).cancelOrder(2L);
        verify(orders, never()).getOrders(any());
    }
}
