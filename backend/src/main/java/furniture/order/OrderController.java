package furniture.order;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final JdbcTemplate jdbcTemplate;

    public OrderController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record OrderItemDto(
            Long productId,
            Integer quantity,
            BigDecimal unitPrice) {
    }

    public record CreateOrderRequest(
            Long customerId,
            Long userId,
            String fullName,
            String phone,
            String address,
            String ward,
            String district,
            String city,
            BigDecimal totalAmount,
            List<OrderItemDto> items) {
    }

    public record OrderResponse(
            Long orderId,
            String orderCode,
            String status,
            BigDecimal totalAmount,
            String message) {
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest req) {
        try {
            if (req.items() == null || req.items().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng phải có ít nhất 1 sản phẩm."));
            }

            // 1. Xác định customer_id hợp lệ
            Long resolvedCustomerId = req.customerId();
            if (resolvedCustomerId == null || resolvedCustomerId <= 0) {
                if (req.userId() != null && req.userId() > 0) {
                    List<Long> customerIds = jdbcTemplate.query(
                            "SELECT id FROM public.customers WHERE user_id = ? LIMIT 1",
                            (rs, rowNum) -> rs.getLong("id"),
                            req.userId());
                    if (!customerIds.isEmpty()) {
                        resolvedCustomerId = customerIds.get(0);
                    }
                }
            }

            // Nếu vẫn không có customer_id, lấy customer đầu tiên làm fallback
            if (resolvedCustomerId == null || resolvedCustomerId <= 0) {
                List<Long> fallbackIds = jdbcTemplate.query(
                        "SELECT id FROM public.customers ORDER BY id ASC LIMIT 1",
                        (rs, rowNum) -> rs.getLong("id"));
                if (!fallbackIds.isEmpty()) {
                    resolvedCustomerId = fallbackIds.get(0);
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Không tìm thấy khách hàng trong cơ sở dữ liệu."));
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

            if (req.phone() != null && !req.phone().trim().isEmpty()) {
                jdbcTemplate.update(
                        "UPDATE public.customers SET phone = ?, address = CASE WHEN ? <> '' THEN ? ELSE address END WHERE id = ?",
                        req.phone().trim(), fullAddress, fullAddress, resolvedCustomerId);
            }

            // 3. Tính toán tổng số tiền
            BigDecimal computedTotal = BigDecimal.ZERO;
            for (OrderItemDto item : req.items()) {
                if (item.productId() != null && item.quantity() != null && item.quantity() > 0) {
                    BigDecimal price = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
                    computedTotal = computedTotal.add(price.multiply(BigDecimal.valueOf(item.quantity())));
                }
            }

            final Long finalCustomerId = resolvedCustomerId;
            final BigDecimal finalTotal = (req.totalAmount() != null && req.totalAmount().compareTo(BigDecimal.ZERO) > 0)
                    ? req.totalAmount()
                    : computedTotal;

            // 4. INSERT vào bảng orders
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO public.orders (customer_id, order_date, status, total_amount, discount_amount) " +
                                "VALUES (?, CURRENT_TIMESTAMP, 'PENDING', ?, 0)",
                        new String[] { "id" });
                ps.setLong(1, finalCustomerId);
                ps.setBigDecimal(2, finalTotal);
                return ps;
            }, keyHolder);

            Number generatedId = keyHolder.getKey();
            if (generatedId == null && keyHolder.getKeys() != null && keyHolder.getKeys().containsKey("id")) {
                generatedId = (Number) keyHolder.getKeys().get("id");
            }

            if (generatedId == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Không thể tạo mã đơn hàng trong database."));
            }

            Long orderId = generatedId.longValue();

            // 5. INSERT vào bảng order_items
            for (OrderItemDto item : req.items()) {
                if (item.productId() == null || item.quantity() == null || item.quantity() <= 0) {
                    continue;
                }
                BigDecimal price = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
                BigDecimal amount = price.multiply(BigDecimal.valueOf(item.quantity()));

                jdbcTemplate.update(
                        "INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, amount) " +
                                "VALUES (?, ?, ?, ?, ?) " +
                                "ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, amount = EXCLUDED.amount",
                        orderId, item.productId(), item.quantity(), price, amount);
            }

            // 6. Ghi nối tiếp vào file database/sales.sql để dữ liệu đồng bộ vào file
            appendToSalesSql(orderId, finalCustomerId, finalTotal, req.items());

            String orderCode = "NEP-" + Year.now().getValue() + "-" + String.format("%06d", orderId);

            return ResponseEntity.ok(new OrderResponse(
                    orderId,
                    orderCode,
                    "PENDING",
                    finalTotal,
                    "Đặt hàng thành công và đã lưu vào cơ sở dữ liệu!"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lưu đơn hàng vào database: " + ex.getMessage()));
        }
    }

    @GetMapping
    public List<Map<String, Object>> getOrders(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return jdbcTemplate.queryForList("""
                    SELECT o.id, o.customer_id, o.order_date, o.status, o.total_amount,
                           c.full_name, c.phone, c.address
                    FROM public.orders o
                    JOIN public.customers c ON c.id = o.customer_id
                    WHERE o.customer_id = ?
                    ORDER BY o.id DESC
                    """, customerId);
        }
        return jdbcTemplate.queryForList("""
                SELECT o.id, o.customer_id, o.order_date, o.status, o.total_amount,
                       c.full_name, c.phone, c.address
                FROM public.orders o
                JOIN public.customers c ON c.id = o.customer_id
                ORDER BY o.id DESC
                """);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        List<Map<String, Object>> orders = jdbcTemplate.queryForList("""
                SELECT o.id, o.customer_id, o.order_date, o.status, o.total_amount,
                       c.full_name, c.phone, c.address
                FROM public.orders o
                JOIN public.customers c ON c.id = o.customer_id
                WHERE o.id = ?
                """, id);

        if (orders.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy đơn hàng #" + id));
        }

        Map<String, Object> order = orders.get(0);
        List<Map<String, Object>> items = jdbcTemplate.queryForList("""
                SELECT oi.product_id, p.name AS product_name, p.image_url,
                       oi.quantity, oi.unit_price, oi.amount
                FROM public.order_items oi
                JOIN public.products p ON p.id = oi.product_id
                WHERE oi.order_id = ?
                """, id);

        return ResponseEntity.ok(Map.of("order", order, "items", items));
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
                String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
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
            // Log warning
            System.err.println("Warning: Could not append order to sales.sql: " + ex.getMessage());
        }
    }
}
