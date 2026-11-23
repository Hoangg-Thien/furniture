package furniture.service;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import furniture.model.admin.AdminIdentity;
import furniture.repository.AdminSupplierRepository;

@Service
public class ReceiptInspectionService {
    private final JdbcTemplate jdbc;
    private final AdminSupplierRepository receipts;
    public ReceiptInspectionService(JdbcTemplate jdbc, AdminSupplierRepository receipts) {
        this.jdbc = jdbc;
        this.receipts = receipts;
    }
    private void admin(AdminIdentity actor) {
        if (!"ADMIN".equals(actor.role())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ admin được duyệt phiếu nhập.");
    }
    public List<Map<String, Object>> queue(AdminIdentity actor) {
        admin(actor);
        return jdbc.queryForList("""
            SELECT pr.id, pr.supplier_id AS "supplierId", s.name AS "supplierName", pr.total_amount AS "totalAmount",
                   u.username AS "checkedBy", pr.submitted_at AS "submittedAt"
            FROM public.purchase_receipts pr JOIN public.suppliers s ON s.id = pr.supplier_id
            JOIN public.users u ON u.id = pr.checked_by
            WHERE pr.status = 'PENDING' AND pr.submitted_at IS NOT NULL AND pr.reviewed_at IS NULL
            ORDER BY pr.submitted_at, pr.id
            """);
    }
    public Map<String, Object> detail(Long supplierId, Long id) {
        receipts.getReceiptStatus(supplierId, id, false);
        Map<String, Object> result = jdbc.queryForMap("""
            SELECT pr.submitted_at AS "submittedAt", pr.reviewed_at AS "reviewedAt", pr.review_reason AS "reason",
                   c.username AS "checkedBy", r.username AS "reviewedBy"
            FROM public.purchase_receipts pr LEFT JOIN public.users c ON c.id = pr.checked_by
            LEFT JOIN public.users r ON r.id = pr.reviewed_by WHERE pr.id = ?
            """, id);
        result.put("items", jdbc.queryForList("SELECT product_id AS \"productId\", received_quantity AS \"quantity\" FROM public.purchase_receipt_items WHERE purchase_receipt_id = ?", id));
        result.put("history", jdbc.queryForList("SELECT u.username, e.action, e.reason, e.created_at AS \"createdAt\" FROM public.receipt_inspection_events e JOIN public.users u ON u.id = e.actor_user_id WHERE e.receipt_id = ? ORDER BY e.id", id));
        return result;
    }
    @Transactional
    public void submit(Long supplierId, Long id, Map<Long, Integer> counts, AdminIdentity actor) {
        if (!"PENDING".equals(receipts.getReceiptStatus(supplierId, id, true))) throw new IllegalArgumentException("Phiếu đã khóa.");
        Map<String, Object> previous = detail(supplierId, id);
        if (previous.get("submittedAt") != null && previous.get("reviewedAt") == null) throw new IllegalArgumentException("Phiếu đã gửi và đang chờ admin duyệt.");
        var items = receipts.findReceiptItemsByReceiptId(id);
        if (counts == null || items.isEmpty() || counts.size() != items.size()) throw new IllegalArgumentException("Cần kiểm đếm đủ mọi mặt hàng.");
        for (var item : items) {
            if (!Objects.equals(counts.get(item.productId()), item.quantity())) throw new IllegalArgumentException("Số lượng thực nhận chưa khớp phiếu nhập.");
            jdbc.update("UPDATE public.purchase_receipt_items SET received_quantity = ? WHERE purchase_receipt_id = ? AND product_id = ?", counts.get(item.productId()), id, item.productId());
        }
        jdbc.update("UPDATE public.purchase_receipts SET checked_by = ?, submitted_at = CURRENT_TIMESTAMP, reviewed_by = NULL, reviewed_at = NULL, review_reason = NULL WHERE id = ?", actor.userId(), id);
        jdbc.update("INSERT INTO public.receipt_inspection_events (receipt_id, actor_user_id, action) VALUES (?, ?, 'SUBMITTED')", id, actor.userId());
    }
    @Transactional
    public void review(Long supplierId, Long id, boolean approve, String reason, AdminIdentity actor) {
        admin(actor);
        if (!"PENDING".equals(receipts.getReceiptStatus(supplierId, id, true))) throw new IllegalArgumentException("Phiếu đã khóa.");
        var inspection = detail(supplierId, id);
        if (inspection.get("submittedAt") == null || inspection.get("reviewedAt") != null) throw new IllegalArgumentException("Phiếu chưa được gửi kiểm duyệt.");
        if (!approve && (reason == null || reason.isBlank() || reason.length() > 1000)) throw new IllegalArgumentException("Nhập lý do yêu cầu kiểm tra lại (tối đa 1000 ký tự).");
        if (approve) {
            Integer mismatch = jdbc.queryForObject("SELECT COUNT(*) FROM public.purchase_receipt_items WHERE purchase_receipt_id = ? AND (received_quantity IS NULL OR received_quantity <> quantity)", Integer.class, id);
            if (mismatch == null || mismatch != 0) throw new IllegalArgumentException("Số kiểm đếm chưa khớp.");
            receipts.updateReceiptStatus(supplierId, id, "COMPLETED");
        }
        jdbc.update("UPDATE public.purchase_receipts SET reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_reason = ? WHERE id = ?", actor.userId(), approve ? null : reason.trim(), id);
        jdbc.update("INSERT INTO public.receipt_inspection_events (receipt_id, actor_user_id, action, reason) VALUES (?, ?, ?, ?)", id, actor.userId(), approve ? "APPROVED" : "RETURNED", approve ? null : reason.trim());
    }
}
