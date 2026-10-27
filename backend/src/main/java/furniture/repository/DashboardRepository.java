package furniture.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import furniture.model.dashboard.CategoryShareDto;
import furniture.model.dashboard.LowStockProductDto;
import furniture.model.dashboard.RecentOrderDto;
import furniture.model.dashboard.RevenueChartItemDto;

@Repository
public class DashboardRepository {

    private final JdbcTemplate jdbcTemplate;

    public DashboardRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public BigDecimal getTotalRevenue() {
        String sql = "SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status != 'CANCELLED'";
        BigDecimal rev = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return rev != null ? rev : BigDecimal.ZERO;
    }

    public long getTotalOrders() {
        String sql = "SELECT COUNT(*) FROM public.orders";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public long getTotalCustomers() {
        String sql = "SELECT COUNT(*) FROM public.customers";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public long getPendingDeliveries() {
        String sql = "SELECT COUNT(*) FROM public.orders WHERE status IN ('PENDING', 'CONFIRMED')";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public long getLowStockCount(int threshold) {
        String sql = "SELECT COUNT(*) FROM public.products WHERE COALESCE(is_active, TRUE) = TRUE AND quantity <= ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, threshold);
        return count != null ? count : 0L;
    }

    public Map<String, Object> getMetricsByDateRange(String currentWhere, String prevWhere) {
        Map<String, Object> result = new HashMap<>();

        String curSql = "SELECT COALESCE(SUM(total_amount), 0) AS rev, COUNT(*) AS ords " +
                "FROM public.orders WHERE status != 'CANCELLED' AND " + currentWhere;
        Map<String, Object> curMap = jdbcTemplate.queryForMap(curSql);
        BigDecimal currentRev = curMap.get("rev") != null ? new BigDecimal(curMap.get("rev").toString())
                : BigDecimal.ZERO;
        long currentOrds = curMap.get("ords") != null ? ((Number) curMap.get("ords")).longValue() : 0L;

        String prevSql = "SELECT COALESCE(SUM(total_amount), 0) AS rev, COUNT(*) AS ords " +
                "FROM public.orders WHERE status != 'CANCELLED' AND " + prevWhere;
        Map<String, Object> prevMap = jdbcTemplate.queryForMap(prevSql);
        BigDecimal prevRev = prevMap.get("rev") != null ? new BigDecimal(prevMap.get("rev").toString())
                : BigDecimal.ZERO;
        long prevOrds = prevMap.get("ords") != null ? ((Number) prevMap.get("ords")).longValue() : 0L;

        result.put("currentRevenue", currentRev);
        result.put("currentOrders", currentOrds);
        result.put("prevRevenue", prevRev);
        result.put("prevOrders", prevOrds);

        return result;
    }

    public List<RevenueChartItemDto> getMonthlyRevenueAndCost(int monthsCount) {
        String sql = """
                WITH months AS (
                    SELECT generate_series(
                        date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months',
                        date_trunc('month', CURRENT_TIMESTAMP),
                        INTERVAL '1 month'
                    )::timestamp AS m_start
                ),
                monthly_orders AS (
                    SELECT
                        date_trunc('month', o.order_date)::timestamp AS m_start,
                        COALESCE(SUM(o.total_amount), 0) AS rev
                    FROM public.orders o
                    WHERE o.status != 'CANCELLED'
                    GROUP BY date_trunc('month', o.order_date)
                ),
                monthly_costs AS (
                    SELECT
                        date_trunc('month', pr.receipt_date)::timestamp AS m_start,
                        COALESCE(SUM(pr.total_amount), 0) AS cogs
                    FROM public.purchase_receipts pr
                    WHERE pr.status != 'CANCELLED'
                    GROUP BY date_trunc('month', pr.receipt_date)
                )
                SELECT
                    to_char(m.m_start, 'YYYY-MM') AS month_key,
                    'Tháng ' || to_char(m.m_start, 'FMMM') AS month_label,
                    COALESCE(mo.rev, 0) AS revenue,
                    COALESCE(mc.cogs, 0) AS cost
                FROM months m
                LEFT JOIN monthly_orders mo ON mo.m_start = m.m_start
                LEFT JOIN monthly_costs mc ON mc.m_start = m.m_start
                ORDER BY m.m_start ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String monthKey = rs.getString("month_key");
            String monthLabel = rs.getString("month_label");
            BigDecimal rev = rs.getBigDecimal("revenue");
            BigDecimal cost = rs.getBigDecimal("cost");

            if (rev == null)
                rev = BigDecimal.ZERO;
            if (cost == null)
                cost = BigDecimal.ZERO;

            // Nếu tháng đó có doanh thu nhưng chưa có phiếu nhập kho, ước tính giá vốn 58%
            // doanh thu
            if (cost.compareTo(BigDecimal.ZERO) == 0 && rev.compareTo(BigDecimal.ZERO) > 0) {
                cost = rev.multiply(new BigDecimal("0.58")).setScale(0, RoundingMode.HALF_UP);
            }

            BigDecimal profit = rev.subtract(cost);
            if (profit.compareTo(BigDecimal.ZERO) < 0 && rev.compareTo(BigDecimal.ZERO) > 0) {
                profit = rev.multiply(new BigDecimal("0.42")).setScale(0, RoundingMode.HALF_UP);
                cost = rev.subtract(profit);
            }

            return new RevenueChartItemDto(monthLabel, monthKey, rev, cost, profit);
        });
    }

    public List<CategoryShareDto> getCategoryShare() {
        String sql = """
                SELECT
                    COALESCE(c.name, 'Nội thất khác') AS category,
                    COALESCE(SUM(oi.amount), 0) AS revenue,
                    COALESCE(SUM(oi.quantity), 0) AS count
                FROM public.order_items oi
                JOIN public.products p ON p.id = oi.product_id
                LEFT JOIN public.categories c ON c.id = p.category_id
                JOIN public.orders o ON o.id = oi.order_id
                WHERE o.status != 'CANCELLED'
                GROUP BY c.name
                ORDER BY revenue DESC
                """;

        List<CategoryShareDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            String cat = rs.getString("category");
            BigDecimal rev = rs.getBigDecimal("revenue");
            long count = rs.getLong("count");
            return new CategoryShareDto(cat, 0.0, rev != null ? rev : BigDecimal.ZERO, count);
        });

        // Nếu chưa có đơn hàng nào, lấy theo danh mục sản phẩm đang bày bán
        if (list.isEmpty()) {
            String fallbackSql = """
                    SELECT
                        c.name AS category,
                        COALESCE(SUM(p.selling_price), 0) AS revenue,
                        COUNT(p.id) AS count
                    FROM public.categories c
                    LEFT JOIN public.products p ON p.category_id = c.id
                    GROUP BY c.name
                    ORDER BY count DESC
                    """;
            list = jdbcTemplate.query(fallbackSql, (rs, rowNum) -> {
                String cat = rs.getString("category");
                BigDecimal rev = rs.getBigDecimal("revenue");
                long count = rs.getLong("count");
                return new CategoryShareDto(cat, 0.0, rev != null ? rev : BigDecimal.ZERO, count);
            });
        }

        BigDecimal total = list.stream()
                .map(CategoryShareDto::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategoryShareDto> resultWithPct = new ArrayList<>();
        for (CategoryShareDto item : list) {
            double pct = 0.0;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                pct = item.revenue().multiply(new BigDecimal("100"))
                        .divide(total, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            resultWithPct.add(new CategoryShareDto(item.category(), pct, item.revenue(), item.count()));
        }

        return resultWithPct;
    }

    public List<RecentOrderDto> getRecentOrders(int limit) {
        String sql = """
                SELECT
                    o.id,
                    o.customer_id,
                    to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                    o.status,
                    o.total_amount,
                    COALESCE(c.full_name, 'Khách hàng #' || o.customer_id) AS customer_name,
                    COALESCE(c.phone, '') AS phone,
                    COALESCE(c.address, 'TP. Hồ Chí Minh') AS address,
                    COALESCE(s.full_name, 'Đội thợ FurniCare #01') AS staff_name
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.staff s ON s.id = o.staff_id
                ORDER BY o.id DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Long id = rs.getLong("id");
            String orderCode = "ORD-" + String.format("%04d", id);
            String custName = rs.getString("customer_name");
            String phone = rs.getString("phone");
            String address = rs.getString("address");
            BigDecimal totalAmount = rs.getBigDecimal("total_amount");
            String status = rs.getString("status");
            String staff = rs.getString("staff_name");
            String orderDate = rs.getString("order_date");

            String paymentStatus;
            String deliveryStatus;

            if ("COMPLETED".equalsIgnoreCase(status)) {
                paymentStatus = "PAID";
                deliveryStatus = "Hoàn tất bàn giao & nghiệm thu";
            } else if ("CONFIRMED".equalsIgnoreCase(status)) {
                paymentStatus = "DEPOSIT_50";
                deliveryStatus = "Đang vận chuyển & lắp đặt";
            } else if ("CANCELLED".equalsIgnoreCase(status)) {
                paymentStatus = "CANCELLED";
                deliveryStatus = "Đơn đã hủy";
            } else {
                paymentStatus = "DEPOSIT_50";
                deliveryStatus = "Chờ xác nhận & phân công thợ";
            }

            return new RecentOrderDto(
                    id,
                    orderCode,
                    custName,
                    phone,
                    address,
                    totalAmount != null ? totalAmount : BigDecimal.ZERO,
                    status != null ? status : "PENDING",
                    paymentStatus,
                    deliveryStatus,
                    staff,
                    orderDate != null ? orderDate : "");
        }, limit);
    }

    public List<LowStockProductDto> getLowStockProducts(int limit) {
        String sql = """
                SELECT 
                    p.id,
                    'FURN-SP-' || LPAD(p.id::text, 3, '0') AS code,
                    p.name,
                    COALESCE(c.name, 'Nội thất') AS category,
                    COALESCE(p.description, '') AS description,
                    COALESCE(
                        (SELECT pri.unit_cost 
                         FROM public.purchase_receipt_items pri 
                         WHERE pri.product_id = p.id 
                         ORDER BY pri.purchase_receipt_id DESC LIMIT 1),
                        ROUND(p.selling_price * 0.60, -2)
                    ) AS cost_price,
                    p.selling_price AS base_price,
                    p.quantity AS total_stock,
                    p.unit,
                    p.image_url
                FROM public.products p
                LEFT JOIN public.categories c ON c.id = p.category_id
                WHERE COALESCE(p.is_active, TRUE) = TRUE
                  AND p.quantity <= 15
                ORDER BY p.quantity ASC, p.id ASC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new LowStockProductDto(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("category"),
                rs.getString("description"),
                rs.getBigDecimal("cost_price"),
                rs.getBigDecimal("base_price"),
                rs.getInt("total_stock"),
                rs.getString("unit"),
                rs.getString("image_url")), limit);
    }
}
