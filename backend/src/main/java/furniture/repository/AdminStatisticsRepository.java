package furniture.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import furniture.model.admin.statistics.CategoryRevenueDto;
import furniture.model.admin.statistics.DailyRevenuePointDto;
import furniture.model.admin.statistics.DashboardOverviewDto;
import furniture.model.admin.statistics.DeadStockProductDto;
import furniture.model.admin.statistics.TopProductDto;
import furniture.model.admin.statistics.VoucherReportDto;

@Repository
public class AdminStatisticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminStatisticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardOverviewDto getOverview(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(23, 59, 59) : LocalDateTime.now();

        // 1. Doanh thu trong kỳ (từ invoices, nếu chưa có thì lấy từ completed orders)
        BigDecimal invoiceRevenue = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(final_amount), 0)
                FROM public.invoices
                WHERE payment_status = 'PAID' AND payment_date BETWEEN ? AND ?
                """, BigDecimal.class, start, end);

        BigDecimal totalRevenue = invoiceRevenue != null && invoiceRevenue.compareTo(BigDecimal.ZERO) > 0
                ? invoiceRevenue
                : jdbcTemplate.queryForObject("""
                        SELECT COALESCE(SUM(total_amount), 0)
                        FROM public.orders
                        WHERE status = 'COMPLETED' AND order_date BETWEEN ? AND ?
                        """, BigDecimal.class, start, end);

        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        // 2. Tính % tăng trưởng so với kỳ trước (same duration)
        long days = java.time.Duration.between(start, end).toDays();
        if (days <= 0) days = 30;
        LocalDateTime prevStart = start.minusDays(days);
        LocalDateTime prevEnd = start;

        BigDecimal prevRevenue = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(final_amount), 0)
                FROM public.invoices
                WHERE payment_status = 'PAID' AND payment_date BETWEEN ? AND ?
                """, BigDecimal.class, prevStart, prevEnd);

        if (prevRevenue == null || prevRevenue.compareTo(BigDecimal.ZERO) == 0) {
            prevRevenue = jdbcTemplate.queryForObject("""
                    SELECT COALESCE(SUM(total_amount), 0)
                    FROM public.orders
                    WHERE status = 'COMPLETED' AND order_date BETWEEN ? AND ?
                    """, BigDecimal.class, prevStart, prevEnd);
        }

        Double growthPercent = 0.0;
        if (prevRevenue != null && prevRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthPercent = totalRevenue.subtract(prevRevenue)
                    .divide(prevRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
        } else if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthPercent = 100.0;
        }

        // 3. Số đơn hàng hoàn thành & Tỷ lệ hoàn thành
        Map<String, Object> orderStats = jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_orders,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_orders
                FROM public.orders
                WHERE order_date BETWEEN ? AND ?
                """, start, end);

        long totalOrders = ((Number) orderStats.get("total_orders")).longValue();
        long completedOrders = ((Number) orderStats.get("completed_orders")).longValue();
        Double completionRate = totalOrders > 0
                ? Math.round((double) completedOrders / totalOrders * 1000.0) / 10.0
                : 100.0;

        // 4. Tổng số món đồ đã bán
        Long itemsSold = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(oi.quantity), 0)
                FROM public.order_items oi
                JOIN public.orders o ON o.id = oi.order_id
                WHERE o.status = 'COMPLETED' AND o.order_date BETWEEN ? AND ?
                """, Long.class, start, end);
        if (itemsSold == null) itemsSold = 0L;

        // 5. Số sản phẩm tồn kho thấp (< 5 cái)
        Long lowStock = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM public.products
                WHERE quantity < 5 AND is_active = true
                """, Long.class);
        if (lowStock == null) lowStock = 0L;

        // 6. Tổng số khách hàng
        Long customersCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM public.customers
                """, Long.class);
        if (customersCount == null) customersCount = 0L;

        // 7. Tổng chi phí nhập hàng
        BigDecimal purchaseCost = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(total_amount), 0)
                FROM public.purchase_receipts
                WHERE status = 'COMPLETED' AND receipt_date BETWEEN ? AND ?
                """, BigDecimal.class, start, end);
        if (purchaseCost == null) purchaseCost = BigDecimal.ZERO;

        // 8. Lợi nhuận gộp
        BigDecimal grossProfit = totalRevenue.subtract(purchaseCost);

        return new DashboardOverviewDto(
                totalRevenue,
                growthPercent,
                completedOrders,
                completionRate,
                itemsSold,
                lowStock,
                customersCount,
                purchaseCost,
                grossProfit
        );
    }

    public List<DailyRevenuePointDto> getDailyRevenueTrend(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(23, 59, 59) : LocalDateTime.now();

        // Map ngày -> Daily data
        Map<String, BigDecimal> salesMap = new TreeMap<>();
        Map<String, Long> countMap = new HashMap<>();
        Map<String, BigDecimal> costMap = new HashMap<>();

        // Query sales from invoices
        List<Map<String, Object>> invoiceRows = jdbcTemplate.queryForList("""
                SELECT TO_CHAR(payment_date, 'YYYY-MM-DD') AS r_day,
                       SUM(final_amount) AS revenue,
                       COUNT(*) AS cnt
                FROM public.invoices
                WHERE payment_status = 'PAID' AND payment_date BETWEEN ? AND ?
                GROUP BY r_day
                ORDER BY r_day ASC
                """, start, end);

        if (!invoiceRows.isEmpty()) {
            for (Map<String, Object> r : invoiceRows) {
                String day = (String) r.get("r_day");
                BigDecimal rev = (BigDecimal) r.get("revenue");
                long cnt = ((Number) r.get("cnt")).longValue();
                salesMap.put(day, rev != null ? rev : BigDecimal.ZERO);
                countMap.put(day, cnt);
            }
        } else {
            // Fallback to orders
            List<Map<String, Object>> orderRows = jdbcTemplate.queryForList("""
                    SELECT TO_CHAR(order_date, 'YYYY-MM-DD') AS r_day,
                           SUM(total_amount) AS revenue,
                           COUNT(*) AS cnt
                    FROM public.orders
                    WHERE status = 'COMPLETED' AND order_date BETWEEN ? AND ?
                    GROUP BY r_day
                    ORDER BY r_day ASC
                    """, start, end);

            for (Map<String, Object> r : orderRows) {
                String day = (String) r.get("r_day");
                BigDecimal rev = (BigDecimal) r.get("revenue");
                long cnt = ((Number) r.get("cnt")).longValue();
                salesMap.put(day, rev != null ? rev : BigDecimal.ZERO);
                countMap.put(day, cnt);
            }
        }

        // Query import costs from purchase_receipts
        List<Map<String, Object>> costRows = jdbcTemplate.queryForList("""
                SELECT TO_CHAR(receipt_date, 'YYYY-MM-DD') AS r_day,
                       SUM(total_amount) AS cost
                FROM public.purchase_receipts
                WHERE status = 'COMPLETED' AND receipt_date BETWEEN ? AND ?
                GROUP BY r_day
                ORDER BY r_day ASC
                """, start, end);

        for (Map<String, Object> r : costRows) {
            String day = (String) r.get("r_day");
            BigDecimal cost = (BigDecimal) r.get("cost");
            costMap.put(day, cost != null ? cost : BigDecimal.ZERO);
            if (!salesMap.containsKey(day)) {
                salesMap.put(day, BigDecimal.ZERO);
                countMap.put(day, 0L);
            }
        }

        List<DailyRevenuePointDto> points = new ArrayList<>();
        DateTimeFormatter displayFmt = DateTimeFormatter.ofPattern("dd/MM");

        for (Map.Entry<String, BigDecimal> entry : salesMap.entrySet()) {
            String isoDate = entry.getKey();
            LocalDate ld = LocalDate.parse(isoDate);
            String label = ld.format(displayFmt);
            BigDecimal sales = entry.getValue();
            BigDecimal cost = costMap.getOrDefault(isoDate, BigDecimal.ZERO);
            long cnt = countMap.getOrDefault(isoDate, 0L);
            points.add(new DailyRevenuePointDto(label, sales, cost, cnt));
        }

        return points;
    }

    public List<CategoryRevenueDto> getCategoryRevenueShare(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(90).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(23, 59, 59) : LocalDateTime.now();

        String sql = """
                SELECT c.id AS cat_id, c.name AS cat_name,
                       COALESCE(SUM(oi.amount), 0) AS cat_revenue,
                       COALESCE(SUM(oi.quantity), 0) AS cat_qty
                FROM public.categories c
                LEFT JOIN public.products p ON p.category_id = c.id
                LEFT JOIN public.order_items oi ON oi.product_id = p.id
                LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status = 'COMPLETED' AND o.order_date BETWEEN ? AND ?
                GROUP BY c.id, c.name
                ORDER BY cat_revenue DESC, c.id ASC
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, start, end);

        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> r : rows) {
            BigDecimal rev = (BigDecimal) r.get("cat_revenue");
            if (rev != null) total = total.add(rev);
        }

        List<CategoryRevenueDto> list = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            Long catId = ((Number) r.get("cat_id")).longValue();
            String name = (String) r.get("cat_name");
            BigDecimal rev = (BigDecimal) r.get("cat_revenue");
            if (rev == null) rev = BigDecimal.ZERO;
            long qty = ((Number) r.get("cat_qty")).longValue();

            Double pct = total.compareTo(BigDecimal.ZERO) > 0
                    ? rev.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            list.add(new CategoryRevenueDto(catId, name, rev, qty, pct));
        }

        return list;
    }

    public List<TopProductDto> getTopSellingProducts(int limit) {
        int max = limit > 0 ? limit : 5;
        String sql = """
                SELECT p.id, p.name, p.image_url, COALESCE(p.unit, 'cái') AS unit,
                       p.quantity AS current_stock,
                       COALESCE(SUM(oi.quantity), 0) AS sold_qty,
                       COALESCE(SUM(oi.amount), 0) AS total_revenue
                FROM public.products p
                JOIN public.order_items oi ON oi.product_id = p.id
                JOIN public.orders o ON o.id = oi.order_id
                WHERE o.status = 'COMPLETED'
                GROUP BY p.id, p.name, p.image_url, p.unit, p.quantity
                ORDER BY sold_qty DESC, total_revenue DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new TopProductDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("image_url"),
                rs.getString("unit"),
                rs.getLong("sold_qty"),
                rs.getBigDecimal("total_revenue"),
                rs.getInt("current_stock")
        ), max);
    }

    public List<DeadStockProductDto> getDeadStockProducts(int limit) {
        int max = limit > 0 ? limit : 5;
        String sql = """
                SELECT p.id, p.name, p.image_url, COALESCE(p.unit, 'cái') AS unit,
                       p.quantity AS current_stock, p.selling_price,
                       COALESCE(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(o.order_date))), 999)::bigint AS days_idle
                FROM public.products p
                LEFT JOIN public.order_items oi ON oi.product_id = p.id
                LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status = 'COMPLETED'
                WHERE p.is_active = true AND p.quantity > 0
                GROUP BY p.id, p.name, p.image_url, p.unit, p.quantity, p.selling_price
                ORDER BY days_idle DESC, p.quantity DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new DeadStockProductDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("image_url"),
                rs.getString("unit"),
                rs.getInt("current_stock"),
                rs.getBigDecimal("selling_price"),
                rs.getLong("days_idle")
        ), max);
    }

    public List<VoucherReportDto> getVoucherEfficiency() {
        String sql = """
                SELECT v.id, v.code, pp.name AS program_name, v.discount_percent,
                       v.used_quantity, v.quantity AS total_quantity,
                       COALESCE(SUM(COALESCE(i.voucher_discount, o.discount_amount, 0)), 0) AS total_discount_given
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                LEFT JOIN public.orders o ON o.voucher_id = v.id
                LEFT JOIN public.invoices i ON i.order_id = o.id
                GROUP BY v.id, v.code, pp.name, v.discount_percent, v.used_quantity, v.quantity
                ORDER BY v.used_quantity DESC, total_discount_given DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new VoucherReportDto(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("program_name"),
                rs.getBigDecimal("discount_percent"),
                rs.getInt("used_quantity"),
                rs.getInt("total_quantity"),
                rs.getBigDecimal("total_discount_given")
        ));
    }

    public List<Map<String, Object>> getSalesExportRecords(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(23, 59, 59) : LocalDateTime.now();

        String sql = """
                SELECT
                    COALESCE(i.invoice_code, 'HD-ORD-' || o.id) AS invoice_code,
                    o.id AS order_id,
                    COALESCE(c.full_name, 'Khách hàng #' || o.customer_id) AS customer_name,
                    COALESCE(c.phone, '') AS phone,
                    COALESCE(i.payment_date, o.order_date) AS txn_date,
                    COALESCE(i.payment_method, 'CASH') AS payment_method,
                    COALESCE(i.subtotal_amount, o.total_amount + o.discount_amount) AS subtotal,
                    COALESCE(i.voucher_discount, o.discount_amount) AS discount,
                    COALESCE(i.tax_amount, 0) AS tax,
                    COALESCE(i.final_amount, o.total_amount) AS final_amount,
                    COALESCE(st.full_name, u.username, 'Admin') AS staff_name
                FROM public.orders o
                LEFT JOIN public.invoices i ON i.order_id = o.id
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.staff st ON st.id = COALESCE(i.staff_id, o.staff_id)
                LEFT JOIN public.users u ON u.id = st.user_id
                WHERE o.status = 'COMPLETED' AND o.order_date BETWEEN ? AND ?
                ORDER BY txn_date DESC, o.id DESC
                """;

        return jdbcTemplate.queryForList(sql, start, end);
    }
}
