package furniture;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.CreateOrderRequest;
import furniture.model.OrderItemDto;
import furniture.repository.OrderRepository;
import furniture.service.OrderService;
import furniture.service.VoucherService;

@ExtendWith(MockitoExtension.class)
class CustomerOrderServiceTest {
    @Mock private OrderRepository repository;
    @Mock private VoucherService vouchers;

    @Test
    void orderCodeKeepsTheCreationYearInListAndDetail() {
        var order = new HashMap<String, Object>(Map.of("id", 7L, "order_date", "2025-12-31 23:59:59"));
        when(repository.findOrders(1L)).thenReturn(List.of(order));
        when(repository.findOrderById(7L)).thenReturn(List.of(order));
        var service = new OrderService(repository, vouchers);
        assertEquals("FUNI-2025-000007", service.getOrders(1L).get(0).get("orderCode"));
        assertEquals("FUNI-2025-000007", ((Map<?, ?>) service.getOrderById(7L).get("order")).get("orderCode"));
    }

    @Test
    void missingCustomerDoesNotExposeAllOrders() {
        OrderService service = new OrderService(repository, vouchers);
        assertThrows(IllegalArgumentException.class, () -> service.getOrders(null));
        assertThrows(IllegalArgumentException.class, () -> service.getOrders(0L));
        verify(repository, never()).findOrders(any());
    }

    @Test
    void invalidAccountDoesNotBecomeAGuestOrder() {
        OrderService service = new OrderService(repository, vouchers);
        CreateOrderRequest request = new CreateOrderRequest(
                null, 999L, "Customer", "0901234567", "Street", null, "District", "City",
                BigDecimal.TEN, null, BigDecimal.ZERO,
                List.of(new OrderItemDto(1L, 1, BigDecimal.TEN)));
        assertThrows(IllegalArgumentException.class, () -> service.createOrder(request));
        verify(repository, never()).insertGuestCustomer(any(), any(), any());
        verify(repository, never()).insertOrder(anyLong(), any(), any(), any(), any(), any(), any(), any());
    }
}
