package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;

@Repository
public class VoucherRepository {

    private final JdbcTemplate jdbcTemplate;

    public VoucherRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initDefaultVouchers() {
        try {
            // 1. Kiểm tra voucher FUNI500K / NEP500K (Giảm 500k cho đơn từ 5 triệu)
            Integer count500k = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM public.vouchers WHERE UPPER(code) IN ('FUNI500K', 'NEP500K')", Integer.class);
            if (count500k == null || count500k == 0) {
                Long progId = jdbcTemplate.queryForObject(
                        "INSERT INTO public.promotion_programs (name, description, start_date, end_date, status) " +
                        "VALUES ('Ưu đãi Đơn hàng lớn FuniStore', 'Giảm ngay 500.000₫ cho đơn hàng từ 5.000.000₫', '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE') " +
                        "RETURNING id", Long.class);

                if (progId != null) {
                    jdbcTemplate.update(
                            "INSERT INTO public.vouchers (promotion_program_id, code, discount_percent, minimum_amount, maximum_discount, quantity, used_quantity, start_date, end_date, status) " +
                            "VALUES (?, 'FUNI500K', 10, 5000000, 500000, 200, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE')",
                            progId);
                }
            }

            // 2. Kiểm tra voucher THANG10 (Voucher cửa hàng trong tháng)
            Integer countThang10 = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM public.vouchers WHERE UPPER(code) = 'THANG10'", Integer.class);
            if (countThang10 == null || countThang10 == 0) {
                Long progId = jdbcTemplate.queryForObject(
                        "INSERT INTO public.promotion_programs (name, description, start_date, end_date, status) " +
                        "VALUES ('Voucher Cửa Hàng Tháng 10', 'Voucher độc quyền tháng 10 của cửa hàng - Giảm 250.000₫ cho đơn từ 3.000.000₫ (Chờ Admin duyệt)', '2026-10-01 00:00:00', '2026-10-31 23:59:59', 'DRAFT') " +
                        "RETURNING id", Long.class);

                if (progId != null) {
                    jdbcTemplate.update(
                            "INSERT INTO public.vouchers (promotion_program_id, code, discount_percent, minimum_amount, maximum_discount, quantity, used_quantity, start_date, end_date, status) " +
                            "VALUES (?, 'THANG10', 8, 3000000, 250000, 100, 0, '2026-10-01 00:00:00', '2026-10-31 23:59:59', 'ACTIVE')",
                            progId);
                }
            }
        } catch (Exception ex) {
            System.err.println("Notice: initDefaultVouchers exception: " + ex.getMessage());
        }
    }

    public List<Map<String, Object>> findActiveVouchers() {
        String sql = """
                SELECT v.id, v.code, v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       to_char(v.start_date, 'YYYY-MM-DD HH24:MI:SS') AS start_date,
                       to_char(v.end_date, 'YYYY-MM-DD HH24:MI:SS') AS end_date,
                       v.status AS voucher_status,
                       pp.id AS program_id, pp.name AS program_name, pp.description AS program_description,
                       pp.status AS program_status
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE v.status = 'ACTIVE' AND pp.status = 'ACTIVE'
                  AND v.end_date >= CURRENT_TIMESTAMP
                  AND v.quantity > v.used_quantity
                ORDER BY v.minimum_amount ASC, v.id DESC
                """;
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> findAllVouchersForAdmin() {
        String sql = """
                SELECT v.id, v.code, v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity, (v.quantity - v.used_quantity) AS remaining_quantity,
                       to_char(v.start_date, 'YYYY-MM-DD HH24:MI:SS') AS start_date,
                       to_char(v.end_date, 'YYYY-MM-DD HH24:MI:SS') AS end_date,
                       v.status AS voucher_status,
                       pp.id AS program_id, pp.name AS program_name, pp.description AS program_description,
                       pp.status AS program_status,
                       CASE
                         WHEN pp.status = 'DRAFT' THEN 'PENDING_APPROVAL'
                         WHEN pp.status = 'ACTIVE' AND v.status = 'ACTIVE' AND v.end_date >= CURRENT_TIMESTAMP THEN 'ACTIVE'
                         WHEN v.end_date < CURRENT_TIMESTAMP THEN 'EXPIRED'
                         ELSE 'INACTIVE'
                       END AS approval_state
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                ORDER BY (CASE WHEN pp.status = 'DRAFT' THEN 0 ELSE 1 END), v.id DESC
                """;
        return jdbcTemplate.queryForList(sql);
    }

    public int approveProgramByVoucherId(Long voucherId) {
        return jdbcTemplate.update("""
                UPDATE public.promotion_programs
                SET status = 'ACTIVE'
                WHERE id = (SELECT promotion_program_id FROM public.vouchers WHERE id = ?)
                """, voucherId);
    }

    public int approveVoucher(Long voucherId) {
        return jdbcTemplate.update("""
                UPDATE public.vouchers
                SET status = 'ACTIVE'
                WHERE id = ?
                """, voucherId);
    }

    public int rejectProgramByVoucherId(Long voucherId) {
        return jdbcTemplate.update("""
                UPDATE public.promotion_programs
                SET status = 'INACTIVE'
                WHERE id = (SELECT promotion_program_id FROM public.vouchers WHERE id = ?)
                """, voucherId);
    }

    public int rejectVoucher(Long voucherId) {
        return jdbcTemplate.update("""
                UPDATE public.vouchers
                SET status = 'INACTIVE'
                WHERE id = ?
                """, voucherId);
    }

    public int countByCode(String code) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.vouchers WHERE UPPER(code) = UPPER(?)", Integer.class, code);
        return count != null ? count : 0;
    }

    public Long insertProgram(String name, String description, String startDate, String endDate, String status) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.promotion_programs (name, description, start_date, end_date, status) " +
                    "VALUES (?, ?, ?::timestamp, ?::timestamp, ?) RETURNING id",
                    new String[] { "id" });
            ps.setString(1, name);
            ps.setString(2, description);
            ps.setString(3, startDate);
            ps.setString(4, endDate);
            ps.setString(5, status);
            return ps;
        }, keyHolder);

        Number num = keyHolder.getKey();
        return num != null ? num.longValue() : null;
    }

    public void insertVoucher(Long progId, String code, BigDecimal discountPercent, BigDecimal minAmt,
                              BigDecimal maxDisc, int quantity, String startDate, String endDate) {
        jdbcTemplate.update(
                "INSERT INTO public.vouchers (promotion_program_id, code, discount_percent, minimum_amount, maximum_discount, quantity, used_quantity, start_date, end_date, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, 0, ?::timestamp, ?::timestamp, 'ACTIVE')",
                progId, code, discountPercent, minAmt, maxDisc, quantity, startDate, endDate);
    }

    public List<Map<String, Object>> findVoucherWithProgramByCode(String code) {
        String sql = """
                SELECT v.id, v.code, v.discount_percent, v.minimum_amount, v.maximum_discount,
                       v.quantity, v.used_quantity,
                       pp.name AS program_name, pp.status AS program_status, v.status AS voucher_status,
                       (v.end_date < CURRENT_TIMESTAMP) AS is_expired
                FROM public.vouchers v
                JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
                WHERE UPPER(v.code) = UPPER(?)
                LIMIT 1
                """;
        return jdbcTemplate.queryForList(sql, code.trim());
    }
}

