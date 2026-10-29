package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.admin.promotion.CreateOrderDiscountRequest;
import furniture.model.admin.promotion.CreateProductDiscountRequest;
import furniture.model.admin.promotion.CreateProgramRequest;
import furniture.model.admin.promotion.CreateVoucherRequest;
import furniture.model.admin.promotion.OrderDiscountDto;
import furniture.model.admin.promotion.ProductDiscountDto;
import furniture.model.admin.promotion.ProgramResponse;
import furniture.model.admin.promotion.VoucherDto;
import jakarta.annotation.PostConstruct;

@Repository
public class AdminPromotionRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminPromotionRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AdminPromotionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void syncSequences() {
        try {
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.promotion_programs', 'id'), COALESCE((SELECT MAX(id) FROM public.promotion_programs), 1))");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.product_discounts', 'id'), COALESCE((SELECT MAX(id) FROM public.product_discounts), 1))");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.order_discounts', 'id'), COALESCE((SELECT MAX(id) FROM public.order_discounts), 1))");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.vouchers', 'id'), COALESCE((SELECT MAX(id) FROM public.vouchers), 1))");
            log.info("Đã đồng bộ sequences cho promotion_programs, product_discounts, order_discounts, vouchers");
        } catch (Exception e) {
            log.warn("Lưu ý khi đồng bộ sequence khuyến mãi: {}", e.getMessage());
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

    @SuppressWarnings("null")
    public List<ProgramResponse> findAllPrograms(String search, String status) {
        StringBuilder sql = new StringBuilder("""
                SELECT pp.id, pp.name, pp.description, pp.start_date, pp.end_date, pp.status,
                       (SELECT COUNT(*) FROM public.product_discounts pd WHERE pd.promotion_program_id = pp.id) AS product_discounts_count,
                       (SELECT COUNT(*) FROM public.order_discounts od WHERE od.promotion_program_id = pp.id) AS order_discounts_count,
                       (SELECT COUNT(*) FROM public.vouchers v WHERE v.promotion_program_id = pp.id) AS vouchers_count,
                       (pp.status = 'ACTIVE' AND CURRENT_TIMESTAMP BETWEEN pp.start_date AND pp.end_date) AS is_currently_running
                FROM public.promotion_programs pp
                WHERE 1=1
                """);

        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(pp.name) LIKE LOWER(?) OR LOWER(COALESCE(pp.description, '')) LIKE LOWER(?))");
            String p = "%" + search.trim() + "%";
            params.add(p);
            params.add(p);
        }

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND pp.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY pp.id DESC");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            Timestamp startTs = rs.getTimestamp("start_date");
            Timestamp endTs = rs.getTimestamp("end_date");
            return new ProgramResponse(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("description"),
                    startTs != null ? startTs.toLocalDateTime() : null,
                    endTs != null ? endTs.toLocalDateTime() : null,
                    rs.getString("status"),
                    rs.getInt("product_discounts_count"),
                    rs.getInt("order_discounts_count"),
                    rs.getInt("vouchers_count"),
                    rs.getBoolean("is_currently_running")
            );
        }, params.toArray());
    }

    public ProgramResponse findById(Long id) {
        String sql = """
                SELECT pp.id, pp.name, pp.description, pp.start_date, pp.end_date, pp.status,
                       (SELECT COUNT(*) FROM public.product_discounts pd WHERE pd.promotion_program_id = pp.id) AS product_discounts_count,
                       (SELECT COUNT(*) FROM public.order_discounts od WHERE od.promotion_program_id = pp.id) AS order_discounts_count,
                       (SELECT COUNT(*) FROM public.vouchers v WHERE v.promotion_program_id = pp.id) AS vouchers_count,
                       (pp.status = 'ACTIVE' AND CURRENT_TIMESTAMP BETWEEN pp.start_date AND pp.end_date) AS is_currently_running
                FROM public.promotion_programs pp
                WHERE pp.id = ?
                """;

        List<ProgramResponse> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp startTs = rs.getTimestamp("start_date");
            Timestamp endTs = rs.getTimestamp("end_date");
            return new ProgramResponse(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("description"),
                    startTs != null ? startTs.toLocalDateTime() : null,
                    endTs != null ? endTs.toLocalDateTime() : null,
                    rs.getString("status"),
                    rs.getInt("product_discounts_count"),
                    rs.getInt("order_discounts_count"),
                    rs.getInt("vouchers_count"),
                    rs.getBoolean("is_currently_running")
            );
        }, id);

        return list.isEmpty() ? null : list.get(0);
    }

    public boolean existsByName(String name) {
        if (name == null || name.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.promotion_programs WHERE LOWER(name) = LOWER(?)",
                Integer.class,
                name.trim()
        );
        return count != null && count > 0;
    }

    public boolean existsByNameExcludingId(String name, Long id) {
        if (name == null || name.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.promotion_programs WHERE LOWER(name) = LOWER(?) AND id != ?",
                Integer.class,
                name.trim(),
                id
        );
        return count != null && count > 0;
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.promotion_programs WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public Long insertProgram(CreateProgramRequest req) {
        String status = req.status() != null && !req.status().trim().isEmpty()
                ? req.status().trim().toUpperCase()
                : "DRAFT";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.promotion_programs (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)",
                    new String[]{"id"}
            );
            ps.setString(1, req.name().trim());
            ps.setString(2, req.description() != null && !req.description().trim().isEmpty() ? req.description().trim() : null);
            ps.setTimestamp(3, Timestamp.valueOf(req.startDate()));
            ps.setTimestamp(4, Timestamp.valueOf(req.endDate()));
            ps.setString(5, status);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void updateProgram(Long id, CreateProgramRequest req) {
        String status = req.status() != null && !req.status().trim().isEmpty()
                ? req.status().trim().toUpperCase()
                : "DRAFT";

        jdbcTemplate.update("""
                UPDATE public.promotion_programs
                SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?
                WHERE id = ?
                """,
                req.name().trim(),
                req.description() != null && !req.description().trim().isEmpty() ? req.description().trim() : null,
                Timestamp.valueOf(req.startDate()),
                Timestamp.valueOf(req.endDate()),
                status,
                id
        );
    }

    public void updateProgramStatus(Long id, String status) {
        String validStatus = status != null ? status.trim().toUpperCase() : "DRAFT";
        jdbcTemplate.update("UPDATE public.promotion_programs SET status = ? WHERE id = ?", validStatus, id);
    }

    public Long countUsedVouchersByProgramId(Long programId) {
        Long count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM public.orders o
                JOIN public.vouchers v ON v.id = o.voucher_id
                WHERE v.promotion_program_id = ?
                """, Long.class, programId);
        return count != null ? count : 0L;
    }

    public void deleteProgram(Long id) {
        jdbcTemplate.update("DELETE FROM public.product_discounts WHERE promotion_program_id = ?", id);
        jdbcTemplate.update("DELETE FROM public.order_discounts WHERE promotion_program_id = ?", id);
        jdbcTemplate.update("DELETE FROM public.vouchers WHERE promotion_program_id = ?", id);
        jdbcTemplate.update("DELETE FROM public.promotion_programs WHERE id = ?", id);
    }

    // -------------------------------------------------------------
    // Product Discounts
    // -------------------------------------------------------------
    public List<ProductDiscountDto> findProductDiscountsByProgramId(Long programId) {
        String sql = """
                SELECT pd.id, pd.promotion_program_id, pd.product_id,
                       p.name AS product_name, p.image_url, COALESCE(p.unit, 'cái') AS unit,
                       p.selling_price, pd.discount_percent,
                       ROUND(p.selling_price * (1 - pd.discount_percent / 100), -2) AS discounted_price,
                       pd.start_date, pd.end_date
                FROM public.product_discounts pd
                JOIN public.products p ON p.id = pd.product_id
                WHERE pd.promotion_program_id = ?
                ORDER BY pd.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp startTs = rs.getTimestamp("start_date");
            Timestamp endTs = rs.getTimestamp("end_date");
            return new ProductDiscountDto(
                    rs.getLong("id"),
                    rs.getLong("promotion_program_id"),
                    rs.getLong("product_id"),
                    rs.getString("product_name"),
                    rs.getString("image_url"),
                    rs.getString("unit"),
                    rs.getBigDecimal("selling_price"),
                    rs.getBigDecimal("discount_percent"),
                    rs.getBigDecimal("discounted_price"),
                    startTs != null ? startTs.toLocalDateTime() : null,
                    endTs != null ? endTs.toLocalDateTime() : null
            );
        }, programId);
    }

    public boolean existsProductDiscount(Long programId, Long productId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.product_discounts WHERE promotion_program_id = ? AND product_id = ?",
                Integer.class,
                programId,
                productId
        );
        return count != null && count > 0;
    }

    public Long insertProductDiscount(Long programId, CreateProductDiscountRequest req, LocalDateTime defaultStart, LocalDateTime defaultEnd) {
        LocalDateTime start = req.startDate() != null ? req.startDate() : defaultStart;
        LocalDateTime end = req.endDate() != null ? req.endDate() : defaultEnd;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.product_discounts (promotion_program_id, product_id, discount_percent, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                    new String[]{"id"}
            );
            ps.setLong(1, programId);
            ps.setLong(2, req.productId());
            ps.setBigDecimal(3, req.discountPercent());
            ps.setTimestamp(4, Timestamp.valueOf(start));
            ps.setTimestamp(5, Timestamp.valueOf(end));
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void deleteProductDiscount(Long discountId) {
        jdbcTemplate.update("DELETE FROM public.product_discounts WHERE id = ?", discountId);
    }

    // -------------------------------------------------------------
    // Order Discounts
    // -------------------------------------------------------------
    public List<OrderDiscountDto> findOrderDiscountsByProgramId(Long programId) {
        String sql = """
                SELECT od.id, od.promotion_program_id, od.minimum_amount, od.discount_percent,
                       od.start_date, od.end_date
                FROM public.order_discounts od
                WHERE od.promotion_program_id = ?
                ORDER BY od.minimum_amount ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp startTs = rs.getTimestamp("start_date");
            Timestamp endTs = rs.getTimestamp("end_date");
            return new OrderDiscountDto(
                    rs.getLong("id"),
                    rs.getLong("promotion_program_id"),
                    rs.getBigDecimal("minimum_amount"),
                    rs.getBigDecimal("discount_percent"),
                    startTs != null ? startTs.toLocalDateTime() : null,
                    endTs != null ? endTs.toLocalDateTime() : null
            );
        }, programId);
    }

    public Long insertOrderDiscount(Long programId, CreateOrderDiscountRequest req, LocalDateTime defaultStart, LocalDateTime defaultEnd) {
        LocalDateTime start = req.startDate() != null ? req.startDate() : defaultStart;
        LocalDateTime end = req.endDate() != null ? req.endDate() : defaultEnd;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.order_discounts (promotion_program_id, minimum_amount, discount_percent, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                    new String[]{"id"}
            );
            ps.setLong(1, programId);
            ps.setBigDecimal(2, req.minimumAmount());
            ps.setBigDecimal(3, req.discountPercent());
            ps.setTimestamp(4, Timestamp.valueOf(start));
            ps.setTimestamp(5, Timestamp.valueOf(end));
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void deleteOrderDiscount(Long discountId) {
        jdbcTemplate.update("DELETE FROM public.order_discounts WHERE id = ?", discountId);
    }

    // -------------------------------------------------------------
    // Vouchers
    // -------------------------------------------------------------
    public List<VoucherDto> findVouchersByProgramId(Long programId) {
        String sql = """
                SELECT v.id, v.promotion_program_id, pp.name AS program_name, v.code,
                       v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       v.start_date, v.end_date, v.status,
                       (v.end_date < CURRENT_TIMESTAMP) AS is_expired
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE v.promotion_program_id = ?
                ORDER BY v.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
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
        }, programId);
    }

    @SuppressWarnings("null")
    public List<VoucherDto> findAllVouchers(String search, String status) {
        StringBuilder sql = new StringBuilder("""
                SELECT v.id, v.promotion_program_id, pp.name AS program_name, v.code,
                       v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       v.start_date, v.end_date, v.status,
                       (v.end_date < CURRENT_TIMESTAMP) AS is_expired
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE 1=1
                """);

        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(v.code) LIKE LOWER(?) OR LOWER(pp.name) LIKE LOWER(?))");
            String p = "%" + search.trim() + "%";
            params.add(p);
            params.add(p);
        }

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND v.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY v.id DESC");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
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
        }, params.toArray());
    }

    public boolean existsVoucherCode(String code) {
        if (code == null || code.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.vouchers WHERE UPPER(code) = UPPER(?)",
                Integer.class,
                code.trim()
        );
        return count != null && count > 0;
    }

    public boolean existsVoucherCodeExcludingId(String code, Long id) {
        if (code == null || code.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.vouchers WHERE UPPER(code) = UPPER(?) AND id != ?",
                Integer.class,
                code.trim(),
                id
        );
        return count != null && count > 0;
    }

    public boolean existsVoucherById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.vouchers WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public VoucherDto findVoucherById(Long id) {
        String sql = """
                SELECT v.id, v.promotion_program_id, pp.name AS program_name, v.code,
                       v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       v.start_date, v.end_date, v.status,
                       (v.end_date < CURRENT_TIMESTAMP) AS is_expired
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE v.id = ?
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
        }, id);

        return list.isEmpty() ? null : list.get(0);
    }

    public Long insertVoucher(Long programId, CreateVoucherRequest req, LocalDateTime defaultStart, LocalDateTime defaultEnd) {
        LocalDateTime start = req.startDate() != null ? req.startDate() : defaultStart;
        LocalDateTime end = req.endDate() != null ? req.endDate() : defaultEnd;
        String status = req.status() != null && !req.status().trim().isEmpty() ? req.status().trim().toUpperCase() : "ACTIVE";
        BigDecimal minAmt = req.minimumAmount() != null ? req.minimumAmount() : BigDecimal.ZERO;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO public.vouchers (
                        promotion_program_id, code, discount_percent, minimum_amount,
                        maximum_discount, quantity, used_quantity, start_date, end_date, status
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
                    """, new String[]{"id"});
            ps.setLong(1, programId);
            ps.setString(2, req.code().trim().toUpperCase());
            ps.setBigDecimal(3, req.discountPercent());
            ps.setBigDecimal(4, minAmt);
            if (req.maximumDiscount() != null) {
                ps.setBigDecimal(5, req.maximumDiscount());
            } else {
                ps.setNull(5, java.sql.Types.NUMERIC);
            }
            ps.setInt(6, req.quantity());
            ps.setTimestamp(7, Timestamp.valueOf(start));
            ps.setTimestamp(8, Timestamp.valueOf(end));
            ps.setString(9, status);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void updateVoucherStatus(Long voucherId, String status) {
        String validStatus = status != null ? status.trim().toUpperCase() : "ACTIVE";
        jdbcTemplate.update("UPDATE public.vouchers SET status = ? WHERE id = ?", validStatus, voucherId);
    }

    public int countOrdersUsingVoucher(Long voucherId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.orders WHERE voucher_id = ?",
                Integer.class,
                voucherId
        );
        return count != null ? count : 0;
    }

    public void deleteVoucher(Long voucherId) {
        jdbcTemplate.update("DELETE FROM public.vouchers WHERE id = ?", voucherId);
    }
}
