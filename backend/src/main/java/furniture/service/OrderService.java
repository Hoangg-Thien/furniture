package furniture.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.CreateOrderRequest;
import furniture.model.OrderItemDto;
import furniture.model.OrderResponse;
import furniture.repository.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất 1 sản phẩm.");
        }

        // 1. Xác định customer_id hợp lệ
        Long resolvedCustomerId = req.customerId();
        if (resolvedCustomerId == null || resolvedCustomerId <= 0) {
            resolvedCustomerId = orderRepository.findCustomerIdByUserId(req.userId());
        }

        if (resolvedCustomerId == null || resolvedCustomerId <= 0) {
            resolvedCustomerId = orderRepository.findFirstCustomerId();
            if (resolvedCustomerId == null) {
                throw new IllegalStateException("Không tìm thấy khách hàng trong cơ sở dữ liệu.");
            }
        }

        // 2. Cập nhật thông tin số điện thoại / địa chỉ vào bảng customers
        String fullAddress = req.address() != null ? req.address().trim() : "";
        if (req.ward() != null && !req.ward().trim().isEmpty()) {
            fullAddress += (fullAddress.isEmpty() ? "" : ", ") + req.ward().trim();
        }
        if (req.district() != null && !req.district().trim().isEmpty()) {
            fullAddress += (fullAddress.isEmpty() ? "" : ", ") + req.district().trim();
        }
        if (req.city() != null && !req.city().trim().isEmpty()) {
            fullAddress += (fullAddress.isEmpty() ? "" : ", ") + req.city().trim();
        }

        orderRepository.updateCustomerContact(resolvedCustomerId, req.phone(), fullAddress);

        // 3. Tính toán tổng số tiền
        BigDecimal computedTotal = BigDecimal.ZERO;
        for (OrderItemDto item : req.items()) {
            if (item.productId() != null && item.quantity() != null && item.quantity() > 0) {
                BigDecimal price = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
                computedTotal = computedTotal.add(price.multiply(BigDecimal.valueOf(item.quantity())));
            }
        }

        BigDecimal discount = (req.discountAmount() != null && req.discountAmount().compareTo(BigDecimal.ZERO) > 0)
                ? req.discountAmount()
                : BigDecimal.ZERO;

        BigDecimal finalTotal;
        if (req.totalAmount() != null && req.totalAmount().compareTo(BigDecimal.ZERO) > 0) {
            finalTotal = req.totalAmount();
        } else {
            BigDecimal shippingFee = (computedTotal.compareTo(new BigDecimal("2000000")) >= 0)
                    ? BigDecimal.ZERO
                    : new BigDecimal("35000");
            finalTotal = computedTotal.subtract(discount).add(shippingFee);
        }

        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        // 4. Lưu đơn hàng
        Long orderId = orderRepository.insertOrder(resolvedCustomerId, finalTotal, req.voucherId(), discount);
        if (orderId == null) {
            throw new IllegalStateException("Không thể tạo mã đơn hàng trong database.");
        }

        // Cập nhật lượt dùng voucher
        orderRepository.incrementVoucherUsedQuantity(req.voucherId());

        // 5. Lưu order_items và trừ tồn kho thực tế trong database
        for (OrderItemDto item : req.items()) {
            if (item.productId() == null || item.quantity() == null || item.quantity() <= 0) {
                continue;
            }
            BigDecimal price = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
            BigDecimal amount = price.multiply(BigDecimal.valueOf(item.quantity()));
            orderRepository.insertOrderItem(orderId, item.productId(), item.quantity(), price, amount);
            orderRepository.deductProductStock(item.productId(), item.quantity());
        }

        // 6. Ghi đồng bộ sales.sql
        appendToSalesSql(orderId, resolvedCustomerId, finalTotal, req.items());

        String orderCode = "FUNI-" + Year.now().getValue() + "-" + String.format("%06d", orderId);

        return new OrderResponse(
                orderId,
                orderCode,
                "PENDING",
                finalTotal,
                "Đặt hàng thành công và đã lưu vào cơ sở dữ liệu!");
    }

    public List<Map<String, Object>> getOrders(Long customerId) {
        List<Map<String, Object>> orders = orderRepository.findOrders(customerId);
        if (orders.isEmpty()) {
            return orders;
        }

        List<Long> orderIds = orders.stream()
                .map(o -> ((Number) o.get("id")).longValue())
                .toList();

        List<Map<String, Object>> allItems = orderRepository.findOrderItemsByOrderIds(orderIds);
        Map<Long, List<Map<String, Object>>> itemsByOrderId = new HashMap<>();
        for (Map<String, Object> it : allItems) {
            Long oid = ((Number) it.get("order_id")).longValue();
            itemsByOrderId.computeIfAbsent(oid, k -> new java.util.ArrayList<>()).add(it);
        }

        int currentYear = Year.now().getValue();
        for (Map<String, Object> order : orders) {
            Long orderId = ((Number) order.get("id")).longValue();
            String orderCode = "FUNI-" + currentYear + "-" + String.format("%06d", orderId);
            order.put("orderCode", orderCode);
            order.put("items", itemsByOrderId.getOrDefault(orderId, Collections.emptyList()));
        }

        return orders;
    }

    public Map<String, Object> getOrderById(Long id) {
        List<Map<String, Object>> orders = orderRepository.findOrderById(id);
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng #" + id);
        }

        Map<String, Object> order = orders.get(0);
        String orderCode = "FUNI-" + Year.now().getValue() + "-" + String.format("%06d", id);
        order.put("orderCode", orderCode);

        List<Map<String, Object>> items = orderRepository.findOrderItemsByOrderId(id);
        return Map.of("order", order, "items", items);
    }

    public boolean cancelOrder(Long id) {
        int updated = orderRepository.cancelOrder(id);
        return updated > 0;
    }

    private synchronized void appendToSalesSql(Long orderId, Long customerId, BigDecimal totalAmount, List<OrderItemDto> items) {
        try {
            java.nio.file.Path[] candidates = new java.nio.file.Path[] {
                java.nio.file.Paths.get("../database/sales.sql"),
                java.nio.file.Paths.get("database/sales.sql"),
                java.nio.file.Paths.get("furniture/database/sales.sql"),
                java.nio.file.Paths.get("c:/Users/Lenovo/OneDrive/Desktop/SE_project/furniture/database/sales.sql")
            };
            java.nio.file.Path targetPath = null;
            for (java.nio.file.Path p : candidates) {
                if (java.nio.file.Files.exists(p)) {
                    targetPath = p;
                    break;
                }
            }
            if (targetPath != null) {
                String now = LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                StringBuilder sb = new StringBuilder();
                sb.append(String.format(
                    "INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) " +
                    "VALUES (%d, %d, '%s', 'PENDING', %s, 0);\n",
                    orderId, customerId, now, totalAmount.toPlainString()));

                for (OrderItemDto item : items) {
                    if (item.productId() == null || item.quantity() == null) continue;
                    BigDecimal price = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
                    BigDecimal amount = price.multiply(BigDecimal.valueOf(item.quantity()));
                    sb.append(String.format(
                        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) " +
                        "VALUES (%d, %d, %d, %s, %s);\n",
                        orderId, item.productId(), item.quantity(), price.toPlainString(), amount.toPlainString()));
                }

                String currentContent = java.nio.file.Files.readString(targetPath);
                String newContent;
                if (currentContent.contains("COMMIT;")) {
                    newContent = currentContent.replace("COMMIT;", sb.toString() + "COMMIT;");
                } else {
                    newContent = currentContent + "\n" + sb.toString();
                }
                java.nio.file.Files.writeString(targetPath, newContent);
            }
        } catch (Exception ex) {
            System.err.println("Warning: Could not append order to sales.sql: " + ex.getMessage());
        }
    }
}

