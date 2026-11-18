package furniture;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import furniture.controller.OrderController;
import furniture.service.OrderService;

class OrderQuantityTest {
    @Test
    void integerQuantityIsAcceptedByBothEndpoints() throws Exception {
        var orders = mock(OrderService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new OrderController(orders)).build();
        for (String path : new String[] { "/api/orders", "/api/orders/preview" }) {
            mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(
                    "{\"items\":[{\"productId\":1,\"quantity\":2}]}"))
                    .andExpect(status().isOk());
        }
        verify(orders).createOrder(argThat(req -> req.items().get(0).quantity() == 2));
        verify(orders).previewOrder(argThat(req -> req.items().get(0).quantity() == 2));
    }

    @Test
    void fractionalOrOverflowingQuantitiesNeverReachCheckoutOrPreview() throws Exception {
        var orders = mock(OrderService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new OrderController(orders)).build();
        for (String path : new String[] { "/api/orders", "/api/orders/preview" }) {
            for (String quantity : new String[] { "1.5", "0.9", "2147483648", "\"1.5\"" }) {
                mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(
                        "{\"items\":[{\"productId\":1,\"quantity\":" + quantity + "}]}"))
                        .andExpect(status().isBadRequest());
            }
        }
        verifyNoInteractions(orders);
    }
}
