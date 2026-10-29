package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.admin.PageResponse;
import furniture.model.admin.invoice.EligibleOrderDto;
import furniture.model.admin.invoice.InvoiceDetailDto;
import furniture.model.admin.invoice.InvoiceItemDto;
import furniture.model.admin.invoice.InvoiceStatusCountDto;
import furniture.model.admin.invoice.InvoiceSummaryDto;
import furniture.model.admin.promotion.VoucherDto;
import jakarta.annotation.PostConstruct;

@Repository
public class AdminInvoiceRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminInvoiceRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AdminInvoiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureInvoicesTableAndSeed() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS public.invoices (
                        id BIGSERIAL PRIMARY KEY,
                        invoice_code VARCHAR(50) UNIQUE NOT NULL,
                        order_id BIGINT UNIQUE NOT NULL,
                        customer_id BIGINT NOT NULL,
                        staff_id BIGINT,
                        subtotal_amount NUMERIC(15,2) NOT NULL CHECK (subtotal_amount >= 0),
                        discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
                        voucher_code VARCHAR(50),
                        voucher_discount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (voucher_discount >= 0),
                        tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
                        final_amount NUMERIC(15,2) NOT NULL CHECK (final_amount >= 0),
                        payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
                        payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID',
                        payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        notes TEXT,
                        CONSTRAINT ck_invoices_payment_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'VNPAY', 'MOMO')),
                        CONSTRAINT ck_invoices_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
                        CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES public.orders (id),
                        CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES public.customers (id),
                        CONSTRAINT fk_invoices_staff FOREIGN KEY (staff_id) REFERENCES public.staff (id)
                    );
                    CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices (order_id);
                    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices (customer_id);
                    CREATE INDEX IF NOT EXISTS idx_invoices_payment_date ON public.invoices (payment_date);
                    """);
            log.info("Bảo đảm bảng public.invoices và các index đã sẵn sàng");

            // Đồng bộ sequence
            try {
                jdbcTemplate.execute("""
                        SELECT setval('public.invoices_id_seq', COALESCE((SELECT MAX(id) FROM public.invoices), 1), true)
                        """);
            } catch (Exception ignored) {
            }

            // Seed sample invoices if empty
            seedSampleInvoicesIfEmpty();

        } catch (Exception ex) {
            log.warn("Lưu ý khi kiểm tra bảng invoices: {}", ex.getMessage());
        }
    }

    private void seedSampleInvoicesIfEmpty() {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM public.invoices", Integer.class);
            if (count != null && count == 0) {
                // Kiểm tra xem có đơn hàng COMPLETED để xuất hóa đơn mẫu không
                List<Map<String, Object>> completedOrders = jdbcTemplate.queryForList("""
                        SELECT o.id, o.customer_id, o.staff_id, o.total_amount, o.discount_amount, v.code AS voucher_code
                        FROM public.orders o
                        LEFT JOIN public.vouchers v ON v.id = o.voucher_id
                        WHERE o.status = 'COMPLETED'
                        ORDER BY o.id ASC
                        LIMIT 3
                        """);

                if (!completedOrders.isEmpty()) {
                    String[] methods = {"BANK_TRANSFER", "CASH", "CREDIT_CARD"};
                    int idx = 0;
                    for (Map<String, Object> ord : completedOrders) {
                        Long orderId = ((Number) ord.get("id")).longValue();
                        Long customerId = ((Number) ord.get("customer_id")).longValue();
                        Long staffId = ord.get("staff_id") != null ? ((Number) ord.get("staff_id")).longValue() : null;
                        BigDecimal totalAmount = ord.get("total_amount") != null ? (BigDecimal) ord.get("total_amount") : BigDecimal.ZERO;
                        BigDecimal discountAmount = ord.get("discount_amount") != null ? (BigDecimal) ord.get("discount_amount") : BigDecimal.ZERO;
                        String vCode = (String) ord.get("voucher_code");
                        BigDecimal subtotal = totalAmount.add(discountAmount);
                        BigDecimal tax = totalAmount.multiply(BigDecimal.valueOf(0.08)).setScale(2, java.math.RoundingMode.HALF_UP);
                        BigDecimal finalTotal = totalAmount.add(tax);
                        String method = methods[idx % methods.length];
                        String code = String.format("HD-2026102%d-%03d", 7 - idx, 100 - idx);

                        jdbcTemplate.update("""
                                INSERT INTO public.invoices
                                (invoice_code, order_id, customer_id, staff_id, subtotal_amount, discount_amount, voucher_code, voucher_discount, tax_amount, final_amount, payment_method, payment_status, payment_date, notes)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', CURRENT_TIMESTAMP - (INTERVAL '1 day' * ?), ?)
                                """,
                                code, orderId, customerId, staffId, subtotal, discountAmount, vCode, discountAmount, tax, finalTotal, method, idx,
                                "Hóa đơn xuất tự động cho đơn hàng #" + orderId
                        );
                        idx++;
                    }
                    log.info("Đã tạo {} hóa đơn bán hàng mẫu cho đơn hàng COMPLETED", completedOrders.size());
                }
            }
        } catch (Exception e) {
            log.warn("Không thể tạo dữ liệu hóa đơn mẫu: {}", e.getMessage());
        }
    }

    public boolean existsByOrderId(Long orderId) {
        if (orderId == null) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.invoices WHERE order_id = ?",
                Integer.class,
                orderId
        );
        return count != null && count > 0;
    }

    public Optional<Long> findInvoiceIdByOrderId(Long orderId) {
        if (orderId == null) return Optional.empty();
        List<Long> list = jdbcTemplate.query(
                "SELECT id FROM public.invoices WHERE order_id = ?",
                (rs, rowNum) -> rs.getLong("id"),
                orderId
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @SuppressWarnings("null")
    public PageResponse<InvoiceSummaryDto> findInvoices(
            String search,
            String paymentMethod,
            String paymentStatus,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {

        StringBuilder whereClause = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            String p = "%" + search.trim() + "%";
            whereClause.append(" AND (LOWER(i.invoice_code) LIKE LOWER(?) OR LOWER(c.full_name) LIKE LOWER(?) OR c.phone LIKE ?)");
            params.add(p);
            params.add(p);
            params.add(p);
        }

        if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentMethod)) {
            whereClause.append(" AND i.payment_method = ?");
            params.add(paymentMethod.trim().toUpperCase());
        }

        if (paymentStatus != null && !paymentStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentStatus)) {
            whereClause.append(" AND i.payment_status = ?");
            params.add(paymentStatus.trim().toUpperCase());
        }

        if (fromDate != null) {
            whereClause.append(" AND i.payment_date >= ?");
            params.add(fromDate.atStartOfDay());
        }

        if (toDate != null) {
            whereClause.append(" AND i.payment_date <= ?");
            params.add(toDate.atTime(23, 59, 59));
        }

        String countSql = """
                SELECT COUNT(*)
                FROM public.invoices i
                LEFT JOIN public.customers c ON c.id = i.customer_id
                """ + whereClause;

        Long totalElements = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());
        long total = totalElements != null ? totalElements : 0L;

        int limit = Math.max(1, size);
        int offset = Math.max(0, page) * limit;

        StringBuilder querySql = new StringBuilder("""
                SELECT i.id, i.invoice_code, i.order_id, i.customer_id,
                       COALESCE(c.full_name, 'Khách hàng #' || i.customer_id) AS customer_name,
                       COALESCE(c.phone, '') AS phone,
                       i.payment_date, i.payment_method, i.payment_status,
                       i.subtotal_amount, i.discount_amount, i.voucher_discount,
                       i.tax_amount, i.final_amount, i.voucher_code,
                       i.staff_id,
                       COALESCE(st.full_name, u.username, CASE WHEN i.staff_id IS NOT NULL THEN 'Nhân viên #' || i.staff_id ELSE NULL END) AS staff_name
                FROM public.invoices i
                LEFT JOIN public.customers c ON c.id = i.customer_id
                LEFT JOIN public.staff st ON st.id = i.staff_id
                LEFT JOIN public.users u ON u.id = st.user_id
                """);

        querySql.append(whereClause);
        querySql.append(" ORDER BY i.payment_date DESC, i.id DESC LIMIT ? OFFSET ?");

        params.add(limit);
        params.add(offset);

        List<InvoiceSummaryDto> content = jdbcTemplate.query(querySql.toString(), (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("payment_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            return new InvoiceSummaryDto(
                    rs.getLong("id"),
                    rs.getString("invoice_code"),
                    rs.getLong("order_id"),
                    rs.getLong("customer_id"),
                    rs.getString("customer_name"),
                    rs.getString("phone"),
                    date,
                    rs.getString("payment_method"),
                    rs.getString("payment_status"),
                    rs.getBigDecimal("subtotal_amount"),
                    rs.getBigDecimal("discount_amount"),
                    rs.getBigDecimal("voucher_discount"),
                    rs.getBigDecimal("tax_amount"),
                    rs.getBigDecimal("final_amount"),
                    rs.getString("voucher_code"),
                    rs.getObject("staff_id") != null ? rs.getLong("staff_id") : null,
                    rs.getString("staff_name")
            );
        }, params.toArray());

        int totalPages = (int) Math.ceil((double) total / limit);
        return new PageResponse<>(content, page, limit, total, totalPages);
    }

    public InvoiceDetailDto findDetailById(Long id) {
        String sql = """
                SELECT i.id, i.invoice_code, i.order_id, i.customer_id,
                       COALESCE(c.full_name, 'Khách hàng #' || i.customer_id) AS customer_name,
                       COALESCE(c.phone, '') AS phone,
                       COALESCE(c.address, '') AS address,
                       COALESCE(c.email, '') AS email,
                       i.staff_id,
                       COALESCE(st.full_name, u.username, CASE WHEN i.staff_id IS NOT NULL THEN 'Nhân viên #' || i.staff_id ELSE NULL END) AS staff_name,
                       i.payment_date, i.payment_method, i.payment_status,
                       i.subtotal_amount, i.discount_amount, i.voucher_code,
                       i.voucher_discount, i.tax_amount, i.final_amount, i.notes
                FROM public.invoices i
                LEFT JOIN public.customers c ON c.id = i.customer_id
                LEFT JOIN public.staff st ON st.id = i.staff_id
                LEFT JOIN public.users u ON u.id = st.user_id
                WHERE i.id = ?
                """;

        List<InvoiceDetailDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("payment_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            BigDecimal finalAmount = rs.getBigDecimal("final_amount");
            String code = rs.getString("invoice_code");

            // Sinh link VietQR động
            String qrUrl = "https://img.vietqr.io/image/MB-0312345678-compact.png?amount="
                    + (finalAmount != null ? finalAmount.toBigInteger() : 0)
                    + "&addInfo=" + code
                    + "&accountName=SHOWROOM%20NOI%20THAT%20CAO%20CAP";

            return new InvoiceDetailDto(
                    rs.getLong("id"),
                    code,
                    rs.getLong("order_id"),
                    rs.getLong("customer_id"),
                    rs.getString("customer_name"),
                    rs.getString("phone"),
                    rs.getString("address"),
                    rs.getString("email"),
                    rs.getObject("staff_id") != null ? rs.getLong("staff_id") : null,
                    rs.getString("staff_name"),
                    date,
                    rs.getString("payment_method"),
                    rs.getString("payment_status"),
                    rs.getBigDecimal("subtotal_amount"),
                    rs.getBigDecimal("discount_amount"),
                    rs.getString("voucher_code"),
                    rs.getBigDecimal("voucher_discount"),
                    rs.getBigDecimal("tax_amount"),
                    finalAmount,
                    rs.getString("notes"),
                    null,
                    qrUrl
            );
        }, id);

        if (list.isEmpty()) return null;

        InvoiceDetailDto dto = list.get(0);
        List<InvoiceItemDto> items = findItemsByOrderId(dto.orderId());

        return new InvoiceDetailDto(
                dto.id(),
                dto.invoiceCode(),
                dto.orderId(),
                dto.customerId(),
                dto.customerName(),
                dto.phone(),
                dto.address(),
                dto.email(),
                dto.staffId(),
                dto.staffName(),
                dto.paymentDate(),
                dto.paymentMethod(),
                dto.paymentStatus(),
                dto.subtotalAmount(),
                dto.discountAmount(),
                dto.voucherCode(),
                dto.voucherDiscount(),
                dto.taxAmount(),
                dto.finalAmount(),
                dto.notes(),
                items,
                dto.qrCodeUrl()
        );
    }

    public List<InvoiceItemDto> findItemsByOrderId(Long orderId) {
        String sql = """
                SELECT oi.product_id, p.name AS product_name, p.image_url,
                       COALESCE(p.unit, 'cái') AS unit,
                       oi.quantity, oi.unit_price, oi.amount
                FROM public.order_items oi
                JOIN public.products p ON p.id = oi.product_id
                WHERE oi.order_id = ?
                ORDER BY oi.product_id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new InvoiceItemDto(
                rs.getLong("product_id"),
                rs.getString("product_name"),
                rs.getString("image_url"),
                rs.getString("unit"),
                rs.getInt("quantity"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("amount")
        ), orderId);
    }

    public Long insertInvoice(
            String invoiceCode,
            Long orderId,
            Long customerId,
            Long staffId,
            BigDecimal subtotalAmount,
            BigDecimal discountAmount,
            String voucherCode,
            BigDecimal voucherDiscount,
            BigDecimal taxAmount,
            BigDecimal finalAmount,
            String paymentMethod,
            String paymentStatus,
            String notes) {

        String sql = """
                INSERT INTO public.invoices
                (invoice_code, order_id, customer_id, staff_id, subtotal_amount, discount_amount, voucher_code, voucher_discount, tax_amount, final_amount, payment_method, payment_status, payment_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, invoiceCode);
            ps.setLong(2, orderId);
            ps.setLong(3, customerId);
            if (staffId != null) {
                ps.setLong(4, staffId);
            } else {
                ps.setNull(4, java.sql.Types.BIGINT);
            }
            ps.setBigDecimal(5, subtotalAmount);
            ps.setBigDecimal(6, discountAmount != null ? discountAmount : BigDecimal.ZERO);
            ps.setString(7, voucherCode);
            ps.setBigDecimal(8, voucherDiscount != null ? voucherDiscount : BigDecimal.ZERO);
            ps.setBigDecimal(9, taxAmount != null ? taxAmount : BigDecimal.ZERO);
            ps.setBigDecimal(10, finalAmount);
            ps.setString(11, paymentMethod != null ? paymentMethod.trim().toUpperCase() : "CASH");
            ps.setString(12, paymentStatus != null ? paymentStatus.trim().toUpperCase() : "PAID");
            ps.setString(13, notes);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public InvoiceStatusCountDto countStats() {
        String sql = """
                SELECT
                    COUNT(*) AS total,
                    COALESCE(SUM(final_amount), 0) AS total_revenue,
                    COUNT(*) FILTER (WHERE payment_method = 'CASH') AS cash_count,
                    COUNT(*) FILTER (WHERE payment_method = 'BANK_TRANSFER') AS bank_transfer_count,
                    COUNT(*) FILTER (WHERE payment_method = 'CREDIT_CARD') AS pos_card_count,
                    COUNT(*) FILTER (WHERE payment_method IN ('VNPAY', 'MOMO')) AS e_wallet_count,
                    COUNT(*) FILTER (WHERE payment_status = 'PAID') AS paid_count,
                    COUNT(*) FILTER (WHERE payment_status = 'REFUNDED') AS refunded_count
                FROM public.invoices
                """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new InvoiceStatusCountDto(
                rs.getLong("total"),
                rs.getBigDecimal("total_revenue"),
                rs.getLong("cash_count"),
                rs.getLong("bank_transfer_count"),
                rs.getLong("pos_card_count"),
                rs.getLong("e_wallet_count"),
                rs.getLong("paid_count"),
                rs.getLong("refunded_count")
        ));
    }

    public List<EligibleOrderDto> findEligibleOrders() {
        String sql = """
                SELECT o.id,
                       COALESCE(c.full_name, 'Khách hàng #' || o.customer_id) AS customer_name,
                       COALESCE(c.phone, '') AS phone,
                       o.order_date, o.status, o.total_amount,
                       COALESCE(SUM(oi.quantity), 0) AS total_items_count
                FROM public.orders o
                LEFT JOIN public.customers c ON c.id = o.customer_id
                LEFT JOIN public.order_items oi ON oi.order_id = o.id
                WHERE o.id NOT IN (SELECT order_id FROM public.invoices)
                  AND o.status != 'CANCELLED'
                GROUP BY o.id, c.full_name, c.phone, o.order_date, o.status, o.total_amount
                ORDER BY o.order_date DESC, o.id DESC
                LIMIT 50
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("order_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            return new EligibleOrderDto(
                    rs.getLong("id"),
                    rs.getString("customer_name"),
                    rs.getString("phone"),
                    date,
                    rs.getString("status"),
                    rs.getBigDecimal("total_amount"),
                    rs.getInt("total_items_count")
            );
        });
    }

    public Optional<VoucherDto> findVoucherByCode(String code) {
        if (code == null || code.trim().isEmpty()) return Optional.empty();
        String sql = """
                SELECT v.id, v.promotion_program_id, pp.name AS program_name, v.code,
                       v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       v.start_date, v.end_date, v.status,
                       (v.end_date < CURRENT_TIMESTAMP) AS is_expired
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE UPPER(v.code) = UPPER(?)
                """;

        List<VoucherDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp startTs = rs.getTimestamp("start_date");
            Timestamp endTs = rs.getTimestamp("end_date");
            return new VoucherDto(
                    rs.getLong("id"),
                    rs.getLong("promotion_program_id"),
                    rs.getString("program_name"),
                    rs.getString("code"),
                    rs.getBigDecimal("discount_percent"),
                    rs.getBigDecimal("minimum_amount"),
                    rs.getBigDecimal("maximum_discount"),
                    rs.getInt("quantity"),
                    rs.getInt("used_quantity"),
                    rs.getInt("remaining_quantity"),
                    startTs != null ? startTs.toLocalDateTime() : null,
                    endTs != null ? endTs.toLocalDateTime() : null,
                    rs.getString("status"),
                    rs.getBoolean("is_expired")
            );
        }, code.trim());

        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public void incrementVoucherUsedQuantity(Long voucherId) {
        if (voucherId != null) {
            jdbcTemplate.update(
                    "UPDATE public.vouchers SET used_quantity = used_quantity + 1 WHERE id = ?",
                    voucherId
            );
        }
    }

    private Long extractId(KeyHolder keyHolder) {
        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null) {
            for (Map.Entry<String, Object> entry : keys.entrySet()) {
                if ("id".equalsIgnoreCase(entry.getKey()) && entry.getValue() instanceof Number num) {
                    return num.longValue();
                }
            }
        }
        try {
            Number key = keyHolder.getKey();
            return key != null ? key.longValue() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
