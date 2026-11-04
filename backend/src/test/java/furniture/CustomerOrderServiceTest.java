package furniture;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.CreateOrderRequest;
import furniture.model.OrderItemDto;
import furniture.repository.OrderRepository;
import furniture.service.OrderService;

@ExtendWith(MockitoExtension.class)
class CustomerOrderServiceTest {
    @Mock private OrderRepository repository;

    @Test
    void missingCustomerDoesNotExposeAllOrders() {
        OrderService service = new OrderService(repository);
        assertThrows(IllegalArgumentException.class, () -> service.getOrders(null));
        assertThrows(IllegalArgumentException.class, () -> service.getOrders(0L));
        verify(repository, never()).findOrders(any());
    }

    @Test
    void missingIdentityDoesNotAssignOrderToFirstCustomer() {
        OrderService service = new OrderService(repository);
        CreateOrderRequest request = new CreateOrderRequest(
                null, null, "Customer", "0901234567", "Street", null, "District", "City",
                BigDecimal.TEN, null, BigDecimal.ZERO,
                List.of(new OrderItemDto(1L, 1, BigDecimal.TEN)));
        assertThrows(IllegalArgumentException.class, () -> service.createOrder(request));
        verify(repository, never()).findFirstCustomerId();
        verify(repository, never()).insertOrder(anyLong(), any(), isNull(), any(), any());
    }
}
