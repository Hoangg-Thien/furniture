package furniture.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.CreateOrderRequest;
import furniture.model.OrderResponse;
import furniture.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest req) {
        try {
            OrderResponse response = orderService.createOrder(req);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lưu đơn hàng vào database: " + ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getOrders(@RequestParam(required = false) Long customerId) {
        try {
            return ResponseEntity.ok(orderService.getOrders(customerId));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lấy danh sách đơn hàng: " + ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable String id) {
        try {
            Long orderId;
            if (id.startsWith("FUNI-")) {
                String[] parts = id.split("-");
                orderId = Long.parseLong(parts[parts.length - 1]);
            } else {
                orderId = Long.parseLong(id);
            }
            return ResponseEntity.ok(orderService.getOrderById(orderId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String id) {
        try {
            Long orderId;
            if (id.startsWith("FUNI-")) {
                String[] parts = id.split("-");
                orderId = Long.parseLong(parts[parts.length - 1]);
            } else {
                orderId = Long.parseLong(id);
            }
            boolean success = orderService.cancelOrder(orderId);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Đã hủy đơn hàng #" + id + " thành công.", "status", "CANCELLED"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể hủy đơn hàng (đơn không tồn tại hoặc đã được xử lý)."));
            }
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }
}

