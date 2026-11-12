package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.OrderItemDto;
@Repository
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long findCustomerIdByUserId(Long userId) {
        if (userId == null || userId <= 0) return null;
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM public.customers WHERE user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public Long insertGuestCustomer(String fullName, String phone, String address) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.customers (full_name, phone, address) VALUES (?, ?, ?)", new String[] { "id" });
            ps.setString(1, fullName);
            ps.setString(2, phone);
            ps.setString(3, address);
            return ps;
        }, keyHolder);
        if (keyHolder.getKey() == null) throw new IllegalStateException("Không thể lưu thông tin khách hàng");
        return keyHolder.getKey().longValue();
    }

    public BigDecimal findProductPrice(Long productId) {
        return jdbcTemplate.queryForObject("SELECT selling_price FROM public.products WHERE id = ?", BigDecimal.class, productId);
    }

    public String findVoucherCode(Long voucherId) throws IllegalArgumentException {
        List<String> codes = jdbcTemplate.query("SELECT code FROM public.vouchers WHERE id = ?", (rs, row) -> rs.getString("code"), voucherId);
        if (codes.isEmpty()) throw new IllegalArgumentException("Voucher không tồn tại");
        return codes.get(0);
    }

    public void saveGuestToken(Long orderId, String tokenHash) {
        jdbcTemplate.update("UPDATE public.orders SET guest_token_hash = ? WHERE id = ?", tokenHash, orderId);
    }

    public Long insertOrder(Long customerId, BigDecimal finalTotal, Long voucherId, BigDecimal discount, String shippingAddress,
            String fullName, String phone, String discountLabel) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.orders (customer_id, order_date, status, total_amount, voucher_id, discount_amount, shipping_address, stock_deducted, recipient_name, recipient_phone, discount_label) " +
                            "VALUES (?, date_trunc('second', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'PENDING', ?, ?, ?, ?, TRUE, ?, ?, ?)",
                    new String[] { "id" });
            ps.setLong(1, customerId);
            ps.setBigDecimal(2, finalTotal);
            if (voucherId != null && voucherId > 0) {
                ps.setLong(3, voucherId);
            } else {
                ps.setNull(3, java.sql.Types.BIGINT);
            }
            ps.setBigDecimal(4, discount != null ? discount : BigDecimal.ZERO);
            ps.setString(5, shippingAddress);
            ps.setString(6, fullName);
            ps.setString(7, phone);
            ps.setString(8, discountLabel);
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId == null && keyHolder.getKeys() != null && keyHolder.getKeys().containsKey("id")) {
            generatedId = (Number) keyHolder.getKeys().get("id");
        }
        return generatedId != null ? generatedId.longValue() : null;
    }

    public BigDecimal findAvailableProductPrice(Long productId, int quantity) throws IllegalArgumentException {
        var prices = jdbcTemplate.queryForList("""
                SELECT selling_price FROM public.products WHERE id = ?
                  AND quantity >= ? AND COALESCE(is_active, TRUE) = TRUE
                """, BigDecimal.class, productId, quantity);
        if (prices.isEmpty()) throw new IllegalArgumentException("Sản phẩm không đủ tồn kho hoặc đã ngừng bán. Vui lòng cập nhật giỏ hàng.");
        return prices.get(0);
    }

    public List<Map<String, Object>> findBestPromotion(List<OrderItemDto> items, BigDecimal subtotal) {
        String values = items.stream().map(item -> "(CAST(? AS BIGINT), CAST(? AS INTEGER), CAST(? AS NUMERIC))")
                .collect(Collectors.joining(","));
        List<Object> params = new ArrayList<>();
        for (var item : items) {
            params.add(item.productId());
            params.add(item.quantity());
            params.add(item.unitPrice());
        }
        params.add(subtotal);
        params.add(subtotal);
        return jdbcTemplate.queryForList("""
                WITH lines(product_id, quantity, unit_price) AS (VALUES %s), candidates AS (
                    SELECT pp.name AS discount_label,
                           ROUND(SUM(l.unit_price * l.quantity * pd.discount_percent / 100), 0) AS discount_amount
                    FROM lines l JOIN public.product_discounts pd ON pd.product_id = l.product_id
                    JOIN public.promotion_programs pp ON pp.id = pd.promotion_program_id
                    WHERE pp.status = 'ACTIVE' AND CURRENT_TIMESTAMP BETWEEN pp.start_date AND pp.end_date
                      AND CURRENT_TIMESTAMP BETWEEN pd.start_date AND pd.end_date
                    GROUP BY pp.id, pp.name
                    UNION ALL
                    SELECT pp.name AS discount_label, ROUND(? * od.discount_percent / 100, 0) AS discount_amount
                    FROM public.order_discounts od JOIN public.promotion_programs pp ON pp.id = od.promotion_program_id
                    WHERE pp.status = 'ACTIVE' AND CURRENT_TIMESTAMP BETWEEN pp.start_date AND pp.end_date
                      AND CURRENT_TIMESTAMP BETWEEN od.start_date AND od.end_date AND od.minimum_amount <= ?
                ) SELECT discount_label, discount_amount FROM candidates
                WHERE discount_amount > 0 ORDER BY discount_amount DESC, discount_label LIMIT 1
                """.formatted(values), params.toArray());
    }

    public void incrementVoucherUsedQuantity(Long voucherId) throws IllegalArgumentException {
        if (voucherId != null && voucherId > 0) {
            int updated = jdbcTemplate.update("""
                    UPDATE public.vouchers SET used_quantity = used_quantity + 1
                    WHERE id = ? AND used_quantity < quantity AND status = 'ACTIVE'
                      AND start_date <= CURRENT_TIMESTAMP AND end_date >= CURRENT_TIMESTAMP
                      AND EXISTS (SELECT 1 FROM public.promotion_programs pp
                          WHERE pp.id = promotion_program_id AND pp.status = 'ACTIVE'
                            AND pp.start_date <= CURRENT_TIMESTAMP AND pp.end_date >= CURRENT_TIMESTAMP)
                    """, voucherId);
            if (updated != 1) {
                throw new IllegalArgumentException("Voucher không còn hiệu lực hoặc đã hết lượt dùng. Vui lòng chọn lại.");
            }
        }
    }

    public void insertOrderItem(Long orderId, Long productId, Integer quantity, BigDecimal unitPrice, BigDecimal amount) {
        jdbcTemplate.update(
                "INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, amount) " +
                        "VALUES (?, ?, ?, ?, ?)",
                orderId, productId, quantity, unitPrice, amount);
    }

    public List<Map<String, Object>> findOrders(Long customerId) {
        String sql = """
                SELECT o.id, o.customer_id, to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                       o.status, o.total_amount, o.discount_amount, o.discount_label, o.voucher_id, v.code AS voucher_code,
                       to_char(o.approved_at, 'YYYY-MM-DD"T"HH24:MI:SS') || '+07:00' AS approved_at,
                       COALESCE(o.recipient_name, c.full_name, 'Khách hàng') AS full_name,
                       COALESCE(o.recipient_phone, c.phone, '') AS phone,
                       COALESCE(o.shipping_address, c.address, '') AS address
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                """ + (customerId != null ? " WHERE o.customer_id = ? " : "") + """
                ORDER BY o.id DESC
                """;

        return (customerId != null)
                ? jdbcTemplate.queryForList(sql, customerId)
                : jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> findOrderItemsByOrderIds(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) return Collections.emptyList();
        String inSql = orderIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String itemsSql = "SELECT oi.order_id, oi.product_id, p.name AS product_name, p.image_url, " +
                "p.unit, c.name AS category_name, oi.quantity, oi.unit_price, oi.amount " +
                "FROM public.order_items oi " +
                "LEFT JOIN public.products p ON p.id = oi.product_id " +
                "LEFT JOIN public.categories c ON c.id = p.category_id " +
                "WHERE oi.order_id IN (" + inSql + ") " +
                "ORDER BY oi.order_id DESC, oi.product_id ASC";
        return jdbcTemplate.queryForList(itemsSql);
    }

    public List<Map<String, Object>> findOrderById(Long id) {
        return jdbcTemplate.queryForList("""
                SELECT o.id, o.customer_id, to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                       o.status, o.total_amount, o.discount_amount, o.discount_label, o.voucher_id, v.code AS voucher_code,
                       to_char(o.approved_at, 'YYYY-MM-DD"T"HH24:MI:SS') || '+07:00' AS approved_at,
                       COALESCE(o.recipient_name, c.full_name, 'Khách hàng') AS full_name,
                       COALESCE(o.recipient_phone, c.phone, '') AS phone,
                       COALESCE(o.shipping_address, c.address, '') AS address
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                WHERE o.id = ?
                """, id);
    }

    public List<Map<String, Object>> findOrderItemsByOrderId(Long orderId) {
        return jdbcTemplate.queryForList("""
                SELECT oi.product_id, p.name AS product_name, p.image_url,
                       p.unit, c.name AS category_name,
                       oi.quantity, oi.unit_price, oi.amount
                FROM public.order_items oi
                LEFT JOIN public.products p ON p.id = oi.product_id
                LEFT JOIN public.categories c ON c.id = p.category_id
                WHERE oi.order_id = ?
                ORDER BY oi.product_id ASC
                """, orderId);
    }

    public int cancelOrder(Long id) {
        return jdbcTemplate.update(
                "UPDATE public.orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'",
                id);
    }

    public boolean deductProductStock(Long productId, int quantity) {
        return jdbcTemplate.update("""
                UPDATE public.products SET quantity = quantity - ?
                WHERE id = ? AND quantity >= ? AND COALESCE(is_active, TRUE) = TRUE
                """, quantity, productId, quantity) == 1;
    }

    public void restoreOrderStock(Long orderId) {
        jdbcTemplate.update("""
                UPDATE public.products p SET quantity = quantity +
                    (SELECT oi.quantity FROM public.order_items oi WHERE oi.order_id = ? AND oi.product_id = p.id)
                WHERE p.id IN (SELECT product_id FROM public.order_items WHERE order_id = ?)
                  AND EXISTS (SELECT 1 FROM public.orders WHERE id = ? AND stock_deducted = TRUE)
                """, orderId, orderId, orderId);
    }

    public void restoreOrderVoucher(Long orderId) {
        jdbcTemplate.update("""
                UPDATE public.vouchers SET used_quantity = used_quantity - 1
                WHERE used_quantity > 0 AND id = (SELECT voucher_id FROM public.orders WHERE id = ?)
                """, orderId);
    }
}

