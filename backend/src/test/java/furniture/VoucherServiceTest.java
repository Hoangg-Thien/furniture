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
}
