package furniture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import furniture.model.CreateVoucherRequest;
import furniture.model.ValidateVoucherRequest;
import furniture.repository.VoucherRepository;
import furniture.service.VoucherService;

class VoucherServiceTest {
    private final VoucherRepository repository = mock(VoucherRepository.class);
    private final VoucherService service = new VoucherService(repository);

    @Test
    void scheduledAndExpiredVouchersCannotBeAppliedAndDiscountIsCapped() {
        Map<String, Object> voucher = new HashMap<>(Map.of(
                "id", 1L, "code", "TEST", "program_name", "Test", "program_status", "ACTIVE",
                "voucher_status", "ACTIVE", "quantity", 10, "used_quantity", 0,
                "minimum_amount", BigDecimal.ZERO, "discount_percent", new BigDecimal("20"),
                "maximum_discount", new BigDecimal("10000")));
        when(repository.findVoucherWithProgramByCode("TEST")).thenReturn(List.of(voucher));
        var request = new ValidateVoucherRequest("TEST", new BigDecimal("100000"));
        assertEquals(new BigDecimal("10000"), service.validateVoucher(request).get("discountAmount"));
        assertThrows(IllegalArgumentException.class, () -> service.validateVoucher(new ValidateVoucherRequest("TEST", new BigDecimal("10000000000000"))));
        voucher.put("is_not_started", true);
        assertThrows(IllegalStateException.class, () -> service.validateVoucher(request));
        voucher.put("is_not_started", false);
        voucher.put("is_expired", true);
        assertThrows(IllegalStateException.class, () -> service.validateVoucher(request));
        assertThrows(IllegalArgumentException.class, () -> service.validateVoucher(new ValidateVoucherRequest("TEST", BigDecimal.ONE.negate())));
    }

    @Test
    void invalidDatesAndNegativeAmountsNeverCreateAPartialProgram() {
        for (var request : List.of(
                voucher("2026-12-02 00:00:00", "2026-12-01 00:00:00", BigDecimal.ZERO, 10),
                voucher("invalid", "2026-12-01 00:00:00", BigDecimal.ZERO, 10),
                voucher(null, null, BigDecimal.ONE.negate(), 10),
                voucher(null, null, BigDecimal.ZERO, 0))) {
            assertThrows(IllegalArgumentException.class, () -> service.createVoucher(request));
        }
        verify(repository, never()).insertProgram(any(), any(), any(), any(), any());
        when(repository.insertProgram(any(), any(), any(), any(), any())).thenReturn(1L);
        assertEquals("DRAFT", service.createVoucher(voucher(null, null, BigDecimal.ZERO, 10)).get("status"));
    }

    private CreateVoucherRequest voucher(String start, String end, BigDecimal minimum, int quantity) {
        return new CreateVoucherRequest("Test", "", "TEST", BigDecimal.TEN, minimum, null, quantity, start, end, false);
    }

    @Test
    void legacyCreationCannotAutoPublishAVoucher() {
        var repository = mock(VoucherRepository.class);
        when(repository.insertProgram(any(), any(), any(), any(), eq("DRAFT"))).thenReturn(1L);
        var request = new CreateVoucherRequest("Test", "", "PENDING", BigDecimal.TEN, BigDecimal.ZERO,
                null, 10, null, null, true);
        assertEquals("DRAFT", new VoucherService(repository).createVoucher(request).get("status"));
        verify(repository).insertProgram(any(), any(), any(), any(), eq("DRAFT"));
    }
    private Map<String, Object> scopedVoucher(String type) {
        var voucher = new HashMap<String, Object>(Map.of("id", 1L, "code", "SCOPE", "program_name", "Test",
                "program_status", "ACTIVE", "voucher_status", "ACTIVE", "quantity", 10, "used_quantity", 0,
                "minimum_amount", new BigDecimal("400000"), "discount_percent", new BigDecimal("20")));
        voucher.put("voucher_type", type);
        voucher.put("product_id", 1L);
        when(repository.findVoucherWithProgramByCode("SCOPE")).thenReturn(List.of(voucher));
        return voucher;
    }

    @Test
    void productVoucherUsesOnlyMatchingProductsAtDatabasePricesAndHonorsTheCap() {
        var voucher = scopedVoucher("PRODUCT");
        when(repository.findProductPrice(1L)).thenReturn(new BigDecimal("150000"));
        when(repository.findProductPrice(2L)).thenReturn(new BigDecimal("500000"));
        var selected = new furniture.model.OrderItemDto(1L, 2, new BigDecimal("99999999"));
        var other = new furniture.model.OrderItemDto(2L, 1, BigDecimal.ZERO);
        var request = new ValidateVoucherRequest("SCOPE", BigDecimal.ONE, List.of(selected, other));
        var result = service.validateVoucher(request);
        assertEquals(new BigDecimal("800000"), result.get("subtotal"));
        assertEquals(new BigDecimal("60000"), result.get("discountAmount"));
        voucher.put("maximum_discount", new BigDecimal("10000"));
        assertEquals(new BigDecimal("10000"), service.validateVoucher(request).get("discountAmount"));
        assertThrows(IllegalArgumentException.class, () -> service.validateVoucher(new ValidateVoucherRequest("SCOPE", BigDecimal.ZERO, List.of(other))));
        assertThrows(IllegalArgumentException.class, () -> service.validateVoucher(new ValidateVoucherRequest("SCOPE", BigDecimal.ZERO, List.of(selected, selected))));
        assertThrows(IllegalArgumentException.class, () -> service.validateVoucher(new ValidateVoucherRequest("SCOPE", BigDecimal.TEN)));
    }

    @Test
    void vipValidationUsesAuthenticatedIdentityAndNeverAClaimedCustomerId() throws Exception {
        scopedVoucher("VIP");
        when(repository.isVipCustomer(7L)).thenReturn(true);
        var sessions = mock(furniture.service.AdminSessionService.class);
        when(sessions.authenticate("Bearer vip")).thenReturn(new furniture.model.admin.AdminIdentity(3L, null, "CUSTOMER", null, 7L));
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new furniture.controller.VoucherController(service))
                .addInterceptors(new furniture.config.AdminAccessInterceptor(sessions, mock(org.springframework.jdbc.core.JdbcTemplate.class))).build();
        String body = "{\"code\":\"SCOPE\",\"subtotal\":500000,\"customerId\":7}";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/vouchers/validate")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        verify(repository, never()).isVipCustomer(7L);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/vouchers/validate")
                .header("Authorization", "Bearer vip").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.discountAmount").value(100000));
    }

    @Test
    void manuallySelectedVoucherUsesValidatedFullPricesWithoutStacking() {
        var voucher = scopedVoucher("ORDER");
        voucher.put("minimum_amount", BigDecimal.ZERO);
        voucher.put("discount_percent", BigDecimal.TEN);
        var prices = List.of(new furniture.model.OrderItemDto(1L, 1, new BigDecimal("14500000")),
                new furniture.model.OrderItemDto(2L, 1, new BigDecimal("9800000")));
        var result = service.validateVoucher(new ValidateVoucherRequest("SCOPE", BigDecimal.ZERO, prices), null, prices);
        assertEquals(new BigDecimal("2430000"), result.get("discountAmount"));
        assertEquals(new BigDecimal("21870000"), result.get("finalTotal"));
        assertEquals(BigDecimal.ZERO, result.get("automaticDiscountAmount"));
        verify(repository, never()).findProductPrice(anyLong());
    }

}
