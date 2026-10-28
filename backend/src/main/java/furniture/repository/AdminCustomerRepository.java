package furniture.repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import furniture.model.admin.PageResponse;
import furniture.model.admin.customer.CustomerCartItemDto;
import furniture.model.admin.customer.CustomerOrderDto;
import furniture.model.admin.customer.CustomerTableItemDto;

@Repository
public class AdminCustomerRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminCustomerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static String computeTier(BigDecimal totalSpent, long completedOrders) {
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;
        if (totalSpent.compareTo(new BigDecimal("50000000")) >= 0) {
            return "VIP_DIAMOND";
        } else if (totalSpent.compareTo(new BigDecimal("15000000")) >= 0) {
            return "GOLD";
        } else if (completedOrders >= 1) {
            return "SILVER";
        } else {
            return "NEW";
        }
    }

    public PageResponse<CustomerTableItemDto> searchCustomers(
            String keyword, String tier, BigDecimal minSpent, BigDecimal maxSpent, int page, int size) {

        String baseCte = """
                WITH customer_stats AS (
                    SELECT c.id, c.user_id, u.username, c.full_name, c.phone, c.email, c.address,
                           COALESCE(u.is_active, true) AS is_user_active, c.created_at,
                           COUNT(o.id) AS total_orders,
                           COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS completed_orders,
                           COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.total_amount ELSE 0 END), 0) AS total_spent
                    FROM public.customers c
                    LEFT JOIN public.users u ON u.id = c.user_id
                    LEFT JOIN public.orders o ON o.customer_id = c.id
                    GROUP BY c.id, c.user_id, u.username, c.full_name, c.phone, c.email, c.address, u.is_active, c.created_at
                )
                """;

        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            whereClause.append("""
                     AND (LOWER(full_name) LIKE ? 
                       OR phone LIKE ? 
                       OR LOWER(email) LIKE ? 
                       OR LOWER(username) LIKE ? 
                       OR LOWER(address) LIKE ?) 
                    """);
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        if (tier != null && !tier.trim().isEmpty() && !"ALL".equalsIgnoreCase(tier.trim())) {
            String t = tier.trim().toUpperCase();
            if ("VIP_DIAMOND".equals(t) || "VIP".equals(t)) {
                whereClause.append(" AND total_spent >= 50000000 ");
            } else if ("GOLD".equals(t)) {
                whereClause.append(" AND total_spent >= 15000000 AND total_spent < 50000000 ");
            } else if ("SILVER".equals(t)) {
                whereClause.append(" AND completed_orders >= 1 AND total_spent < 15000000 ");
            } else if ("NEW".equals(t)) {
                whereClause.append(" AND completed_orders = 0 ");
            }
        }

        if (minSpent != null && minSpent.compareTo(BigDecimal.ZERO) > 0) {
            whereClause.append(" AND total_spent >= ? ");
            params.add(minSpent);
        }

        if (maxSpent != null && maxSpent.compareTo(BigDecimal.ZERO) > 0) {
            whereClause.append(" AND total_spent <= ? ");
            params.add(maxSpent);
        }

        String countSql = baseCte + " SELECT COUNT(*) FROM customer_stats " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());
        long totalElements = totalCount != null ? totalCount : 0L;

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        int offset = Math.max(0, page) * size;

        String selectSql = baseCte + " SELECT * FROM customer_stats "
                + whereClause
                + " ORDER BY total_spent DESC, id DESC LIMIT ? OFFSET ?";

        List<Object> selectParams = new ArrayList<>(params);
        selectParams.add(size);
        selectParams.add(offset);

        List<CustomerTableItemDto> content = jdbcTemplate.query(selectSql, (rs, rowNum) -> {
            Long id = rs.getLong("id");
            Long userId = (Long) rs.getObject("user_id");
            String username = rs.getString("username");
            String fullName = rs.getString("full_name");
            String phone = rs.getString("phone");
            String email = rs.getString("email");
            String address = rs.getString("address");
            long totalOrders = rs.getLong("total_orders");
            long completedOrders = rs.getLong("completed_orders");
            BigDecimal totalSpent = rs.getBigDecimal("total_spent");
            Boolean isUserActive = rs.getBoolean("is_user_active");
            Timestamp ts = rs.getTimestamp("created_at");
            LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;

            String computedTier = computeTier(totalSpent, completedOrders);
            return new CustomerTableItemDto(
                    id, userId, username, fullName, phone, email, address,
                    totalOrders, completedOrders, totalSpent, computedTier, isUserActive, createdAt);
        }, selectParams.toArray());

        boolean isFirst = page <= 0;
        boolean isLast = totalPages <= 1 || page >= totalPages - 1;

        return new PageResponse<>(content, page, size, totalElements, totalPages, isFirst, isLast);
    }

    public Optional<Map<String, Object>> findCustomerByIdWithStats(Long customerId) {
        String sql = """
                SELECT c.id, c.user_id, u.username, c.full_name, c.phone, c.email, c.address,
                       COALESCE(u.is_active, true) AS is_user_active, c.created_at,
                       COUNT(o.id) AS total_orders,
                       COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS completed_orders,
                       COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.total_amount ELSE 0 END), 0) AS total_spent
                FROM public.customers c
                LEFT JOIN public.users u ON u.id = c.user_id
                LEFT JOIN public.orders o ON o.customer_id = c.id
                WHERE c.id = ?
                GROUP BY c.id, c.user_id, u.username, c.full_name, c.phone, c.email, c.address, u.is_active, c.created_at
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, customerId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rows.get(0));
    }

    public List<CustomerOrderDto> findOrdersByCustomerId(Long customerId) {
        String ordersSql = """
                SELECT o.id, to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                       o.status, o.total_amount, o.discount_amount, v.code AS voucher_code
                FROM public.orders o
                LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                WHERE o.customer_id = ?
                ORDER BY o.id DESC
                """;

        List<Map<String, Object>> orderRows = jdbcTemplate.queryForList(ordersSql, customerId);
        if (orderRows.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> orderIds = orderRows.stream()
                .map(r -> ((Number) r.get("id")).longValue())
                .collect(Collectors.toList());

        String inClause = orderIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String itemsSql = "SELECT oi.order_id, oi.product_id, p.name AS product_name, p.image_url, " +
                "p.unit, oi.quantity, oi.unit_price, oi.amount " +
                "FROM public.order_items oi " +
                "LEFT JOIN public.products p ON p.id = oi.product_id " +
                "WHERE oi.order_id IN (" + inClause + ") " +
                "ORDER BY oi.order_id DESC, oi.product_id ASC";

        List<Map<String, Object>> itemRows = jdbcTemplate.queryForList(itemsSql);
        Map<Long, List<Map<String, Object>>> itemsByOrderId = itemRows.stream()
                .collect(Collectors.groupingBy(item -> ((Number) item.get("order_id")).longValue()));

        List<CustomerOrderDto> result = new ArrayList<>();
        for (Map<String, Object> r : orderRows) {
            Long orderId = ((Number) r.get("id")).longValue();
            String orderDate = (String) r.get("order_date");
            String status = (String) r.get("status");
            BigDecimal totalAmount = (BigDecimal) r.get("total_amount");
            BigDecimal discountAmount = (BigDecimal) r.get("discount_amount");
            String voucherCode = (String) r.get("voucher_code");
            List<Map<String, Object>> items = itemsByOrderId.getOrDefault(orderId, Collections.emptyList());

            result.add(new CustomerOrderDto(orderId, orderDate, status, totalAmount, discountAmount, voucherCode, items));
        }

        return result;
    }

    public List<CustomerCartItemDto> findCartItemsByCustomerId(Long customerId) {
        String sql = """
                SELECT ci.product_id, p.name AS product_name, p.unit AS product_unit,
                       p.selling_price AS unit_price, p.image_url, ci.quantity,
                       (ci.quantity * p.selling_price) AS amount
                FROM public.carts c
                JOIN public.cart_items ci ON ci.cart_id = c.id
                JOIN public.products p ON p.id = ci.product_id
                WHERE c.customer_id = ?
                ORDER BY p.id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Long productId = rs.getLong("product_id");
            String productName = rs.getString("product_name");
            String productUnit = rs.getString("product_unit");
            BigDecimal unitPrice = rs.getBigDecimal("unit_price");
            String imageUrl = rs.getString("image_url");
            Integer quantity = rs.getInt("quantity");
            BigDecimal amount = rs.getBigDecimal("amount");
            return new CustomerCartItemDto(productId, productName, productUnit, unitPrice, imageUrl, quantity, amount);
        }, customerId);
    }

    public int countByEmailExcludingCustomerId(String email, Long customerId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.customers WHERE LOWER(email) = LOWER(?) AND id != ?",
                Integer.class,
                email,
                customerId);
        return count != null ? count : 0;
    }

    public int updateCustomer(Long customerId, String fullName, String phone, String email, String address) {
        return jdbcTemplate.update(
                "UPDATE public.customers SET full_name = ?, phone = ?, email = ?, address = ? WHERE id = ?",
                fullName, phone, email, address, customerId);
    }
}
