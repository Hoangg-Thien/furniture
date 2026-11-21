package furniture;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import furniture.config.AdminAccessInterceptor;
import furniture.controller.AdminPromotionController;
import furniture.model.admin.AdminIdentity;
import furniture.service.AdminPromotionService;
import furniture.service.AdminSessionService;

class VoucherLifecyclePermissionsTest {
    @Test
    void salesCanPauseButCannotActivateReplaceOrDeleteEvenWithForgedBodies() throws Exception {
        var sessions = mock(AdminSessionService.class);
        var service = mock(AdminPromotionService.class);
        when(sessions.authenticate("Bearer sales")).thenReturn(new AdminIdentity(2L, 2L, "STAFF", "SALES", null));
        when(sessions.authenticate("Bearer admin")).thenReturn(new AdminIdentity(1L, null, "ADMIN", null, null));
        var mvc = MockMvcBuilders.standaloneSetup(new AdminPromotionController(service))
                .addInterceptors(new AdminAccessInterceptor(sessions, mock(JdbcTemplate.class))).build();
        for (String body : List.of("{\"status\":\"ACTIVE\"}", "{}", "{\"status\":\" active \"}")) {
            mvc.perform(put("/api/admin/promotions/vouchers/1/status").header("Authorization", "Bearer sales")
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        }
        mvc.perform(put("/api/admin/promotions/vouchers/1/status").header("Authorization", "Bearer sales")
                .param("status", "ACTIVE").contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isForbidden());
        verify(service, never()).updateVoucherStatus(anyLong(), any());
        mvc.perform(put("/api/admin/promotions/vouchers/1/status").header("Authorization", "Bearer sales")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}")).andExpect(status().isOk());
        mvc.perform(put("/api/admin/promotions/vouchers/1/status").header("Authorization", "Bearer admin")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\"}")).andExpect(status().isOk());
        verify(service).updateVoucherStatus(1L, "INACTIVE");
        verify(service).updateVoucherStatus(1L, "ACTIVE");
        mvc.perform(delete("/api/admin/promotions/vouchers/1").header("Authorization", "Bearer sales")).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/promotions/vouchers/1/replace").header("Authorization", "Bearer sales")).andExpect(status().isForbidden());
    }
}
