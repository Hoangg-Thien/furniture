package furniture.repository;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import furniture.model.admin.product.ProductAuditDto;

@Repository
public class ProductAuditRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public ProductAuditRepository(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    public Map<String, Object> snapshot(Long productId) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("Nhật ký sản phẩm phải dùng cùng transaction với cập nhật");
        }
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT name, description, category_id, unit, selling_price, quantity, is_active, image_url
                FROM public.products WHERE id = ? FOR UPDATE
                """, productId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + productId);
        Map<String, Object> result = rows.get(0);
        result.put("images", jdbc.queryForList("""
                SELECT id, image_url, is_primary, display_order FROM public.product_images
                WHERE product_id = ? ORDER BY id
                """, productId));
        return result;
    }

    public void record(Long productId, Long actorUserId, Map<String, Object> before) {
        if (actorUserId == null) throw new IllegalArgumentException("Thiếu người thao tác đã xác thực");
        Map<String, Object> after = snapshot(productId);
        after.forEach((field, value) -> {
            Object old = before.get(field);
            if (!Objects.equals(old, value)) jdbc.update("""
                    INSERT INTO public.product_audit_logs (product_id, actor_user_id, field_name, old_value, new_value)
                    VALUES (?, ?, ?, ?, ?)
                    """, productId, actorUserId, field, encode(old), encode(value));
        });
    }

    private String encode(Object value) {
        if (value == null) return null;
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Không thể ghi giá trị nhật ký", e); }
    }

    public List<ProductAuditDto> findByProductId(Long productId, Long beforeId) {
        return jdbc.query("""
                SELECT a.id, a.actor_user_id, u.username, a.field_name, a.old_value, a.new_value, a.changed_at
                FROM public.product_audit_logs a JOIN public.users u ON u.id = a.actor_user_id
                WHERE a.product_id = ? AND a.id < ? ORDER BY a.id DESC LIMIT 50
                """, (rs, row) -> new ProductAuditDto(rs.getLong("id"), rs.getLong("actor_user_id"), rs.getString("username"),
                    rs.getString("field_name"), rs.getString("old_value"), rs.getString("new_value"), rs.getTimestamp("changed_at").toInstant()),
                productId, beforeId == null ? Long.MAX_VALUE : beforeId);
    }
}
