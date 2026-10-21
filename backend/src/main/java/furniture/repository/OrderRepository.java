package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void syncOrderTimezoneAndFixes() {
        try {
            jdbcTemplate.execute("ALTER TABLE public.orders ALTER COLUMN order_date TYPE TIMESTAMP(0)");
        } catch (Exception ex) {
            System.err.println("Notice: Could not alter order_date type to TIMESTAMP(0): " + ex.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE public.orders ALTER COLUMN order_date SET DEFAULT (date_trunc('second', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'))");
        } catch (Exception ex) {
            System.err.println("Notice: Could not alter default order_date: " + ex.getMessage());
        }
        try {
            jdbcTemplate.execute("UPDATE public.orders SET order_date = date_trunc('second', order_date)");
            jdbcTemplate.execute("UPDATE public.orders SET order_date = '2026-10-13 13:45:14' WHERE id = 23 AND order_date < '2026-10-13 10:00:00'");
            jdbcTemplate.execute("UPDATE public.orders SET order_date = '2026-10-12 16:47:52' WHERE id = 22 AND order_date < '2026-10-12 12:00:00'");
            jdbcTemplate.execute("UPDATE public.orders SET order_date = '2026-10-12 16:46:58' WHERE id = 21 AND order_date < '2026-10-12 12:00:00'");
        } catch (Exception ex) {
            System.err.println("Notice: Could not update old orders date: " + ex.getMessage());
        }

        try {
            jdbcTemplate.execute("""
                    UPDATE public.orders o
                    SET total_amount = (
                        SELECT COALESCE(SUM(oi.amount), 0) - COALESCE(o.discount_amount, 0)
                        FROM public.order_items oi
                        WHERE oi.order_id = o.id
                    )
                    WHERE o.voucher_id IS NOT NULL 
                      AND o.discount_amount > 0
                      AND o.total_amount < (
                        SELECT COALESCE(SUM(oi.amount), 0) - COALESCE(o.discount_amount, 0)
                        FROM public.order_items oi
                        WHERE oi.order_id = o.id
                      )
                    """);
        } catch (Exception ex) {
            System.err.println("Notice: Could not correct double discount orders: " + ex.getMessage());
        }
    }

    public Long findCustomerIdByUserId(Long userId) {
        if (userId == null || userId <= 0) return null;
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM public.customers WHERE user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public Long findFirstCustomerId() {
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM public.customers ORDER BY id ASC LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"));
        return ids.isEmpty() ? null : ids.get(0);
    }

    public void updateCustomerContact(Long customerId, String phone, String address) {
        if (phone != null && !phone.trim().isEmpty()) {
            jdbcTemplate.update(
                    "UPDATE public.customers SET phone = ?, address = CASE WHEN ? <> '' THEN ? ELSE address END WHERE id = ?",
                    phone.trim(), address, address, customerId);
        }
    }

    public Long insertOrder(Long customerId, BigDecimal finalTotal, Long voucherId, BigDecimal discount) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.orders (customer_id, order_date, status, total_amount, voucher_id, discount_amount) " +
                            "VALUES (?, date_trunc('second', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'PENDING', ?, ?, ?)",
                    new String[] { "id" });
            ps.setLong(1, customerId);
            ps.setBigDecimal(2, finalTotal);
            if (voucherId != null && voucherId > 0) {
                ps.setLong(3, voucherId);
            } else {
                ps.setNull(3, java.sql.Types.BIGINT);
            }
            ps.setBigDecimal(4, discount != null ? discount : BigDecimal.ZERO);
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId == null && keyHolder.getKeys() != null && keyHolder.getKeys().containsKey("id")) {
            generatedId = (Number) keyHolder.getKeys().get("id");
        }
        return generatedId != null ? generatedId.longValue() : null;
    }

    public void incrementVoucherUsedQuantity(Long voucherId) {
        if (voucherId != null && voucherId > 0) {
            try {
                jdbcTemplate.update(
                        "UPDATE public.vouchers SET used_quantity = used_quantity + 1 WHERE id = ? AND used_quantity < quantity",
                        voucherId);
            } catch (Exception ex) {
                System.err.println("Notice: could not increment voucher used_quantity: " + ex.getMessage());
            }
        }
    }

    public void insertOrderItem(Long orderId, Long productId, Integer quantity, BigDecimal unitPrice, BigDecimal amount) {
        jdbcTemplate.update(
                "INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, amount) " +
                        "VALUES (?, ?, ?, ?, ?) " +
                        "ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, amount = EXCLUDED.amount",
                orderId, productId, quantity, unitPrice, amount);
    }

    public List<Map<String, Object>> findOrders(Long customerId) {
        String sql = """
                SELECT o.id, o.customer_id, to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                       o.status, o.total_amount, o.discount_amount, o.voucher_id, v.code AS voucher_code,
                       COALESCE(c.full_name, 'Khách hàng') AS full_name,
                       COALESCE(c.phone, '') AS phone,
                       COALESCE(c.address, '') AS address
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
                       o.status, o.total_amount, o.discount_amount,
                       COALESCE(c.full_name, 'Khách hàng') AS full_name,
                       COALESCE(c.phone, '') AS phone,
                       COALESCE(c.address, '') AS address
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
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
}

