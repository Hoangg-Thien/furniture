package furniture;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.customer.CustomerDetailResponse;
import furniture.model.admin.customer.UpdateCustomerRequest;
import furniture.repository.AdminCustomerRepository;
import furniture.service.AdminCustomerService;

@ExtendWith(MockitoExtension.class)
public class AdminCustomerServiceTest {

    @Mock
    private AdminCustomerRepository adminCustomerRepository;

    private AdminCustomerService adminCustomerService;

    @BeforeEach
    void setUp() {
        adminCustomerService = new AdminCustomerService(adminCustomerRepository);
    }

    @Test
    void testComputeTier() {
        assertEquals("VIP_DIAMOND", AdminCustomerRepository.computeTier(new BigDecimal("68500000"), 4));
        assertEquals("VIP_DIAMOND", AdminCustomerRepository.computeTier(new BigDecimal("50000000"), 1));
        assertEquals("GOLD", AdminCustomerRepository.computeTier(new BigDecimal("24200000"), 2));
        assertEquals("GOLD", AdminCustomerRepository.computeTier(new BigDecimal("15000000"), 1));
        assertEquals("SILVER", AdminCustomerRepository.computeTier(new BigDecimal("8000000"), 1));
        assertEquals("NEW", AdminCustomerRepository.computeTier(BigDecimal.ZERO, 0));
        assertEquals("NEW", AdminCustomerRepository.computeTier(null, 0));
    }

    @Test
    void testGetCustomerDetail_Success() {
        Long customerId = 1L;
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", customerId);
        map.put("user_id", 10L);
        map.put("username", "customer_an");
        map.put("full_name", "Nguyễn Văn An");
        map.put("phone", "0901234567");
        map.put("email", "an.nv@gmail.com");
        map.put("address", "Hà Nội");
        map.put("total_orders", 4L);
        map.put("completed_orders", 4L);
        map.put("total_spent", new BigDecimal("68500000"));
        map.put("is_user_active", true);
        map.put("created_at", new Timestamp(System.currentTimeMillis()));

        when(adminCustomerRepository.findCustomerByIdWithStats(customerId)).thenReturn(Optional.of(map));

        when(adminCustomerRepository.findOrdersByCustomerId(customerId)).thenReturn(Collections.emptyList());
        when(adminCustomerRepository.findCartItemsByCustomerId(customerId)).thenReturn(Collections.emptyList());

        CustomerDetailResponse detail = adminCustomerService.getCustomerDetail(customerId);

        assertEquals("Nguyễn Văn An", detail.fullName());
        assertEquals("VIP_DIAMOND", detail.customerTier());
        assertEquals(4L, detail.totalOrders());
        assertEquals(new BigDecimal("68500000"), detail.totalSpent());
    }

    @Test
    void testGetCustomerDetail_NotFound_ThrowsException() {
        Long customerId = 999L;
        when(adminCustomerRepository.findCustomerByIdWithStats(customerId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            adminCustomerService.getCustomerDetail(customerId);
        });
    }

    @Test
    void testUpdateCustomerProfile_DuplicateEmail_ThrowsException() {
        Long customerId = 1L;
        UpdateCustomerRequest req = new UpdateCustomerRequest("Nguyễn Văn An", "0901234567", "other@gmail.com", "Hà Nội");

        when(adminCustomerRepository.findCustomerByIdWithStats(customerId)).thenReturn(Optional.of(Map.of(
                "id", customerId,
                "email", "an.nv@gmail.com"
        )));

        when(adminCustomerRepository.countByEmailExcludingCustomerId("other@gmail.com", customerId)).thenReturn(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminCustomerService.updateCustomerProfile(customerId, req);
        });

        assertEquals("Email 'other@gmail.com' đã được sử dụng bởi khách hàng khác", ex.getMessage());
    }

    @Test
    void testUpdateCustomerProfile_Success() {
        Long customerId = 1L;
        UpdateCustomerRequest req = new UpdateCustomerRequest("Trần Văn Bình", "0988777666", "binh.tv@gmail.com", "Đà Nẵng");

        when(adminCustomerRepository.findCustomerByIdWithStats(customerId)).thenReturn(Optional.of(Map.of(
                "id", customerId,
                "email", "binh.old@gmail.com"
        )));

        when(adminCustomerRepository.countByEmailExcludingCustomerId("binh.tv@gmail.com", customerId)).thenReturn(0);

        adminCustomerService.updateCustomerProfile(customerId, req);

        verify(adminCustomerRepository).updateCustomer(customerId, "Trần Văn Bình", "0988777666", "binh.tv@gmail.com", "Đà Nẵng");
    }
}
