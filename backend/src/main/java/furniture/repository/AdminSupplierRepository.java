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

import furniture.model.admin.supplier.CreateReceiptRequest;
import furniture.model.admin.supplier.PurchaseReceiptItemDto;
import furniture.model.admin.supplier.PurchaseReceiptSummaryDto;
import furniture.model.admin.supplier.SupplierRequest;
import furniture.model.admin.supplier.SupplierResponse;
import jakarta.annotation.PostConstruct;

@Repository
public class AdminSupplierRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminSupplierRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AdminSupplierRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void syncSequence() {
        try {
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.suppliers', 'id'), COALESCE((SELECT MAX(id) FROM public.suppliers), 1))");
            log.info("Đã đồng bộ sequence cho public.suppliers");
        } catch (Exception e) {
            log.warn("Lưu ý đồng bộ sequence public.suppliers: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('public.purchase_receipts', 'id'), COALESCE((SELECT MAX(id) FROM public.purchase_receipts), 1))");
            log.info("Đã đồng bộ sequence cho public.purchase_receipts");
        } catch (Exception e) {
            log.warn("Lưu ý đồng bộ sequence public.purchase_receipts: {}", e.getMessage());
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
    public List<SupplierResponse> findAllWithReceiptCount(String search) {
        StringBuilder sql = new StringBuilder("""
                SELECT s.id, s.name, s.phone, s.email, s.address,
                       COUNT(pr.id) AS total_receipts_count,
                       COALESCE(SUM(pr.total_amount), 0) AS total_receipt_value
                FROM public.suppliers s
                LEFT JOIN public.purchase_receipts pr ON pr.supplier_id = s.id
                """);

        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append("""
                    WHERE LOWER(s.name) LIKE LOWER(?)
                       OR s.phone LIKE ?
                       OR LOWER(s.email) LIKE LOWER(?)
                       OR LOWER(s.address) LIKE LOWER(?)
                    """);
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        sql.append("""
                GROUP BY s.id, s.name, s.phone, s.email, s.address
                ORDER BY s.id ASC
                """);

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new SupplierResponse(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("address"),
                rs.getLong("total_receipts_count"),
                rs.getBigDecimal("total_receipt_value")
        ), params.toArray());
    }

    public SupplierResponse findById(Long id) {
        String sql = """
                SELECT s.id, s.name, s.phone, s.email, s.address,
                       COUNT(pr.id) AS total_receipts_count,
                       COALESCE(SUM(pr.total_amount), 0) AS total_receipt_value
                FROM public.suppliers s
                LEFT JOIN public.purchase_receipts pr ON pr.supplier_id = s.id
                WHERE s.id = ?
                GROUP BY s.id, s.name, s.phone, s.email, s.address
                """;

        List<SupplierResponse> list = jdbcTemplate.query(sql, (rs, rowNum) -> new SupplierResponse(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("address"),
                rs.getLong("total_receipts_count"),
                rs.getBigDecimal("total_receipt_value")
        ), id);

        return list.isEmpty() ? null : list.get(0);
    }

    public boolean existsByName(String name) {
        if (name == null || name.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.suppliers WHERE LOWER(name) = LOWER(?)",
                Integer.class,
                name.trim()
        );
        return count != null && count > 0;
    }

    public boolean existsByNameExcludingId(String name, Long id) {
        if (name == null || name.trim().isEmpty()) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.suppliers WHERE LOWER(name) = LOWER(?) AND id != ?",
                Integer.class,
                name.trim(),
                id
        );
        return count != null && count > 0;
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.suppliers WHERE id = ?",
                Integer.class,
                id
        );
        return count != null && count > 0;
    }

    public Long countReceiptsBySupplierId(Long supplierId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.purchase_receipts WHERE supplier_id = ?",
                Long.class,
                supplierId
        );
        return count != null ? count : 0L;
    }

    public Long insertSupplier(SupplierRequest req) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)",
                    new String[]{"id"}
            );
            ps.setString(1, req.name().trim());
            ps.setString(2, req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null);
            ps.setString(3, req.email() != null && !req.email().trim().isEmpty() ? req.email().trim() : null);
            ps.setString(4, req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : null);
            return ps;
        }, keyHolder);

        return extractId(keyHolder);
    }

    public void updateSupplier(Long id, SupplierRequest req) {
        jdbcTemplate.update(
                "UPDATE public.suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?",
                req.name().trim(),
                req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null,
                req.email() != null && !req.email().trim().isEmpty() ? req.email().trim() : null,
                req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : null,
                id
        );
    }

    public void deleteSupplier(Long id) {
        jdbcTemplate.update("DELETE FROM public.suppliers WHERE id = ?", id);
    }

    public List<PurchaseReceiptSummaryDto> findReceiptsBySupplierId(Long supplierId) {
        String sql = """
                SELECT pr.id, pr.supplier_id, pr.staff_id,
                       COALESCE(st.full_name, u.username, 'Nhân viên #' || pr.staff_id) AS staff_name,
                       pr.receipt_date, pr.status, pr.total_amount,
                       COUNT(pri.product_id) AS total_items_count
                FROM public.purchase_receipts pr
                LEFT JOIN public.staff st ON st.id = pr.staff_id
                LEFT JOIN public.users u ON u.id = st.user_id
                LEFT JOIN public.purchase_receipt_items pri ON pri.purchase_receipt_id = pr.id
                WHERE pr.supplier_id = ?
                GROUP BY pr.id, pr.supplier_id, pr.staff_id, st.full_name, u.username, pr.receipt_date, pr.status, pr.total_amount
                ORDER BY pr.receipt_date DESC, pr.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("receipt_date");
            LocalDateTime date = ts != null ? ts.toLocalDateTime() : null;
            return new PurchaseReceiptSummaryDto(
                    rs.getLong("id"),
                    rs.getLong("supplier_id"),
                    rs.getLong("staff_id"),
                    rs.getString("staff_name"),
                    date,
                    rs.getString("status"),
                    rs.getBigDecimal("total_amount"),
                    rs.getInt("total_items_count")
            );
        }, supplierId);
    }

    public List<PurchaseReceiptItemDto> findReceiptItemsByReceiptId(Long receiptId) {
        String sql = """
                SELECT pri.purchase_receipt_id, pri.product_id,
                       COALESCE(p.name, 'Sản phẩm #' || pri.product_id) AS product_name,
                       COALESCE(p.unit, 'cái') AS unit,
                       pri.quantity, pri.unit_price, pri.amount
                FROM public.purchase_receipt_items pri
                LEFT JOIN public.products p ON p.id = pri.product_id
                WHERE pri.purchase_receipt_id = ?
                ORDER BY pri.product_id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new PurchaseReceiptItemDto(
                rs.getLong("purchase_receipt_id"),
                rs.getLong("product_id"),
                rs.getString("product_name"),
                rs.getString("unit"),
                rs.getInt("quantity"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("amount")
        ), receiptId);
    }

    public Long insertPurchaseReceipt(Long supplierId, Long staffId, String status, List<CreateReceiptRequest.ReceiptItemRequest> items) {
        String receiptStatus = status != null && !status.trim().isEmpty() ? status.trim().toUpperCase() : "PENDING";
        if (!List.of("PENDING", "COMPLETED", "CANCELLED").contains(receiptStatus)) {
            receiptStatus = "PENDING";
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        if (items != null) {
            for (CreateReceiptRequest.ReceiptItemRequest item : items) {
                if (item.quantity() != null && item.unitPrice() != null) {
                    calculatedTotal = calculatedTotal.add(item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())));
                }
            }
        }

        final BigDecimal finalTotal = calculatedTotal;
        final String finalStatus = receiptStatus;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO public.purchase_receipts (supplier_id, staff_id, receipt_date, status, total_amount) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)",
                    new String[]{"id"}
            );
            ps.setLong(1, supplierId);
            ps.setLong(2, staffId);
            ps.setString(3, finalStatus);
            ps.setBigDecimal(4, finalTotal);
            return ps;
        }, keyHolder);

        Long receiptId = extractId(keyHolder);
        if (receiptId == null) {
            throw new IllegalStateException("Không thể tạo phiếu nhập kho: không lấy được mã sinh tự động.");
        }

        if (items != null) {
            for (CreateReceiptRequest.ReceiptItemRequest item : items) {
                if (item.productId() != null && item.quantity() != null && item.quantity() > 0) {
                    BigDecimal unitPrice = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
                    BigDecimal amount = unitPrice.multiply(BigDecimal.valueOf(item.quantity()));
                    jdbcTemplate.update(
                            "INSERT INTO public.purchase_receipt_items (purchase_receipt_id, product_id, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)",
                            receiptId,
                            item.productId(),
                            item.quantity(),
                            unitPrice,
                            amount
                    );

                    // Nếu trạng thái là COMPLETED, tự động cộng tồn kho sản phẩm
                    if ("COMPLETED".equals(finalStatus)) {
                        jdbcTemplate.update(
                                "UPDATE public.products SET quantity = quantity + ? WHERE id = ?",
                                item.quantity(),
                                item.productId()
                        );
                    }
                }
            }
        }

        return receiptId;
    }

    public void updateReceiptStatus(Long receiptId, String newStatus) {
        String status = newStatus != null ? newStatus.trim().toUpperCase() : "PENDING";
        if (!List.of("PENDING", "COMPLETED", "CANCELLED").contains(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + newStatus);
        }

        String currentStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM public.purchase_receipts WHERE id = ?",
                String.class,
                receiptId
        );

        if (currentStatus == null) {
            throw new IllegalArgumentException("Không tìm thấy phiếu nhập kho với ID: " + receiptId);
        }

        if (currentStatus.equals(status)) {
            return;
        }

        // Cập nhật trạng thái
        jdbcTemplate.update("UPDATE public.purchase_receipts SET status = ? WHERE id = ?", status, receiptId);

        // Nếu chuyển từ PENDING -> COMPLETED, cộng dồn vào kho
        if ("PENDING".equals(currentStatus) && "COMPLETED".equals(status)) {
            List<PurchaseReceiptItemDto> items = findReceiptItemsByReceiptId(receiptId);
            for (PurchaseReceiptItemDto item : items) {
                jdbcTemplate.update(
                        "UPDATE public.products SET quantity = quantity + ? WHERE id = ?",
                        item.quantity(),
                        item.productId()
                );
            }
        }
    }
}
