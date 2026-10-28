package furniture.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.PageResponse;
import furniture.model.admin.order.CancelOrderRequest;
import furniture.model.admin.order.ConfirmOrderRequest;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.order.OrderStatusCountDto;
import furniture.model.admin.order.OrderSummaryDto;
import furniture.service.AdminOrderService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/orders")
@CrossOrigin(origins = "*")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrderSummaryDto>> getOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<OrderSummaryDto> result = adminOrderService.getOrders(search, status, fromDate, toDate, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/counts")
    public ResponseEntity<OrderStatusCountDto> getStatusCounts() {
        return ResponseEntity.ok(adminOrderService.getStatusCounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id) {
        try {
            OrderDetailDto detail = adminOrderService.getOrderDetail(id);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmOrder(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmOrderRequest req) {
        try {
            adminOrderService.confirmOrder(id, req);
            return ResponseEntity.ok(Map.of("message", "Đã xác nhận đơn hàng và gán nhân viên phụ trách thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest req) {
        try {
            adminOrderService.cancelOrder(id, req);
            return ResponseEntity.ok(Map.of("message", "Đã hủy đơn hàng, hoàn trả tồn kho và hoàn voucher thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        try {
            adminOrderService.completeOrder(id);
            return ResponseEntity.ok(Map.of("message", "Đã hoàn tất đơn hàng và nghiệm thu lắp đặt thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }
}
