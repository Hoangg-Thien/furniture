package furniture.repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import furniture.model.admin.PageResponse;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.order.OrderItemDto;
import furniture.model.admin.order.OrderStatusCountDto;
import furniture.model.admin.order.OrderSummaryDto;

@Repository
public class AdminOrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminOrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.orders WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public boolean existsStaffById(Long staffId) {
        if (staffId == null) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.staff WHERE id = ?",
                Integer.class,
                staffId
        );
        return count != null && count > 0;
    }

    public Long findFirstStaffId() {
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM public.staff ORDER BY id ASC LIMIT 1",
                (rs, rowNum) -> rs.getLong("id")
        );
        if (!ids.isEmpty()) {
            return ids.get(0);
        }
        try {
            Long defaultUserId = jdbcTemplate.query(
                    "SELECT id FROM public.users WHERE role IN ('ADMIN', 'STAFF') ORDER BY id ASC LIMIT 1",
                    (rs, rowNum) -> rs.getLong("id")
            ).stream().findFirst().orElse(null);

            if (defaultUserId != null) {
                jdbcTemplate.update(
                        "INSERT INTO public.staff (user_id, full_name, role) VALUES (?, 'Quản lý Showroom FuniStore', 'STAFF') ON CONFLICT DO NOTHING",
                        defaultUserId
                );
                List<Long> newIds = jdbcTemplate.query(
                        "SELECT id FROM public.staff ORDER BY id ASC LIMIT 1",
                        (rs, rowNum) -> rs.getLong("id")
                );
                if (!newIds.isEmpty()) return newIds.get(0);
            }
        } catch (Exception ex) {
            System.err.println("Notice: could not auto create default staff: " + ex.getMessage());
        }
        return null;
    }

    @SuppressWarnings("null")
    public PageResponse<OrderSummaryDto> findOrders(
            String search,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {

        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            whereClause.append(" AND o.status = ? ");
            params.add(status.trim().toUpperCase());
        }

        if (search != null && !search.trim().isEmpty()) {
            String p = "%" + search.trim() + "%";
            whereClause.append("""
                     AND (
                        CAST(o.id AS TEXT) LIKE ?
                        OR LOWER(COALESCE(c.full_name, '')) LIKE LOWER(?)
                        OR COALESCE(c.phone, '') LIKE ?
                        OR LOWER(COALESCE(c.address, '')) LIKE LOWER(?)
                        OR LOWER(COALESCE(st.full_name, '')) LIKE LOWER(?)
                        OR LOWER(COALESCE(v.code, '')) LIKE LOWER(?)
                     )
                    """);
            params.add(p);
            params.add(p);
            params.add(p);
            params.add(p);
            params.add(p);
            params.add(p);
        }

        if (fromDate != null) {
            whereClause.append(" AND o.order_date >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }

        if (toDate != null) {
            whereClause.append(" AND o.order_date <= ? ");
            params.add(Timestamp.valueOf(toDate.atTime(23, 59, 59)));
        }

        // Count total
        String countSql = """
                SELECT COUNT(DISTINCT o.id)
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.staff st ON st.id = o.staff_id
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                """ + whereClause;

        Long totalElements = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());
        long total = totalElements != null ? totalElements : 0L;

        // Query page
        StringBuilder querySql = new StringBuilder("""
                SELECT o.id, o.customer_id,
                       COALESCE(c.full_name, 'Khách hàng #' || o.customer_id) AS customer_name,
                       COALESCE(c.phone, '') AS phone,
                       o.order_date, o.staff_id,
                       COALESCE(st.full_name, u.username, CASE WHEN o.staff_id IS NOT NULL THEN 'Nhân viên #' || o.staff_id ELSE NULL END) AS staff_name,
                       o.total_amount, o.discount_amount, o.status,
                       COALESCE(SUM(oi.quantity), 0) AS total_items_count,
                       v.code AS voucher_code
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.staff st ON st.id = o.staff_id
                LEFT JOIN public.users u ON u.id = st.user_id
                LEFT JOIN public.order_items oi ON oi.order_id = o.id
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                """);

        querySql.append(whereClause);
        querySql.append("""
                GROUP BY o.id, o.customer_id, c.full_name, c.phone, o.order_date, o.staff_id, st.full_name, u.username, o.total_amount, o.discount_amount, o.status, v.code
                ORDER BY o.order_date DESC, o.id DESC
                LIMIT ? OFFSET ?
                """);

        int limit = Math.max(1, size);
        int offset = Math.max(0, page) * limit;
        params.add(limit);
        params.add(offset);

        List<OrderSummaryDto> content = jdbcTemplate.query(querySql.toString(), (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("order_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            return new OrderSummaryDto(
                    rs.getLong("id"),
                    rs.getLong("customer_id"),
                    rs.getString("customer_name"),
                    rs.getString("phone"),
                    date,
                    rs.getObject("staff_id") != null ? rs.getLong("staff_id") : null,
                    rs.getString("staff_name"),
                    rs.getBigDecimal("total_amount"),
                    rs.getBigDecimal("discount_amount"),
                    rs.getString("status"),
                    rs.getInt("total_items_count"),
                    rs.getString("voucher_code")
            );
        }, params.toArray());

        int totalPages = (int) Math.ceil((double) total / limit);
        return new PageResponse<>(content, page, limit, total, totalPages);
    }

    public OrderDetailDto findDetailById(Long id) {
        String sql = """
                SELECT o.id, o.customer_id,
                       COALESCE(c.full_name, 'Khách hàng #' || o.customer_id) AS customer_name,
                       COALESCE(c.phone, '') AS phone,
                       COALESCE(c.address, '') AS address,
                       o.staff_id,
                       COALESCE(st.full_name, u.username, CASE WHEN o.staff_id IS NOT NULL THEN 'Nhân viên #' || o.staff_id ELSE NULL END) AS staff_name,
                       o.order_date, o.status,
                       (o.total_amount + o.discount_amount) AS subtotal,
                       v.code AS voucher_code,
                       o.discount_amount,
                       o.total_amount AS final_total
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.staff st ON st.id = o.staff_id
                LEFT JOIN public.users u ON u.id = st.user_id
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                WHERE o.id = ?
                """;

        List<OrderDetailDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("order_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            return new OrderDetailDto(
                    rs.getLong("id"),
                    rs.getLong("customer_id"),
                    rs.getString("customer_name"),
                    rs.getString("phone"),
                    rs.getString("address"),
                    rs.getObject("staff_id") != null ? rs.getLong("staff_id") : null,
                    rs.getString("staff_name"),
                    date,
                    rs.getString("status"),
                    rs.getBigDecimal("subtotal"),
                    rs.getString("voucher_code"),
                    rs.getBigDecimal("discount_amount"),
                    rs.getBigDecimal("final_total"),
                    null
            );
        }, id);

        if (list.isEmpty()) return null;

        OrderDetailDto dto = list.get(0);
        List<OrderItemDto> items = findItemsByOrderId(id);

        return new OrderDetailDto(
                dto.id(),
                dto.customerId(),
                dto.customerName(),
                dto.phone(),
                dto.address(),
                dto.staffId(),
                dto.staffName(),
                dto.orderDate(),
                dto.status(),
                dto.subtotal(),
                dto.voucherCode(),
                dto.discountAmount(),
                dto.finalTotal(),
                items
        );
    }

    public List<OrderItemDto> findItemsByOrderId(Long orderId) {
        String sql = """
                SELECT oi.product_id,
                       COALESCE(p.name, 'Sản phẩm #' || oi.product_id) AS product_name,
                       p.image_url,
                       COALESCE(p.unit, 'cái') AS unit,
                       oi.quantity, oi.unit_price, oi.amount
                FROM public.order_items oi
                LEFT JOIN public.products p ON p.id = oi.product_id
                WHERE oi.order_id = ?
                ORDER BY oi.product_id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new OrderItemDto(
                rs.getLong("product_id"),
                rs.getString("product_name"),
                rs.getString("image_url"),
                rs.getString("unit"),
                rs.getInt("quantity"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("amount")
        ), orderId);
    }

    public OrderStatusCountDto countByStatus() {
        String sql = """
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
                    COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
                    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled
                FROM public.orders
                """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new OrderStatusCountDto(
                rs.getLong("total"),
                rs.getLong("pending"),
                rs.getLong("confirmed"),
                rs.getLong("completed"),
                rs.getLong("cancelled")
        ));
    }

    public void updateStatusAndStaff(Long orderId, String status, Long staffId) {
        jdbcTemplate.update(
                "UPDATE public.orders SET status = ?, staff_id = ? WHERE id = ?",
                status,
                staffId,
                orderId
        );
    }

    public void updateStatus(Long orderId, String status) {
        jdbcTemplate.update("UPDATE public.orders SET status = ? WHERE id = ?", status, orderId);
    }

    public void restoreProductStock(Long productId, int quantity) {
        jdbcTemplate.update(
                "UPDATE public.products SET quantity = quantity + ? WHERE id = ?",
                quantity,
                productId
        );
    }

    public void restoreVoucherUsedQuantity(Long voucherId) {
        if (voucherId != null) {
            jdbcTemplate.update(
                    "UPDATE public.vouchers SET used_quantity = used_quantity - 1 WHERE id = ? AND used_quantity > 0",
                    voucherId
            );
        }
    }

    public Long findVoucherIdByOrderId(Long orderId) {
        List<Long> list = jdbcTemplate.query(
                "SELECT voucher_id FROM public.orders WHERE id = ?",
                (rs, rowNum) -> (Long) rs.getObject("voucher_id"),
                orderId
        );
        return list.isEmpty() ? null : list.get(0);
    }
}
