package furniture.config;

import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.UrlPathHelper;
import furniture.model.admin.AdminIdentity;
import furniture.repository.AdminActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AdminActivityInterceptor implements HandlerInterceptor {
    private static final Logger log = LoggerFactory.getLogger(AdminActivityInterceptor.class);
    private static final Map<String, String> MODULES = Map.of(
            "products", "sản phẩm", "suppliers", "nhà cung cấp", "orders", "đơn hàng",
            "invoices", "hóa đơn", "customers", "khách hàng", "categories", "danh mục",
            "promotions", "khuyến mãi", "staff", "nhân viên", "users", "tài khoản");
    private final AdminActivityRepository activities;

    public AdminActivityInterceptor(AdminActivityRepository activities) { this.activities = activities; }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception exception) {
        AdminIdentity actor = (AdminIdentity) request.getAttribute(AdminIdentity.ATTRIBUTE);
        if (actor == null || !"STAFF".equals(actor.role()) || exception != null
                || response.getStatus() < 200 || response.getStatus() >= 300
                || !Set.of("POST", "PUT", "PATCH", "DELETE").contains(request.getMethod())) return;
        String path = new UrlPathHelper().getPathWithinApplication(request).replaceAll(";[^/]*", "").replaceAll("/+", "/");
        if (!path.startsWith("/api/admin/") || path.endsWith("/preview-calculation")) return;
        String[] parts = path.substring("/api/admin/".length()).split("/");
        String module = parts[0];
        if (!MODULES.containsKey(module)) return;
        Long recordId = parts.length > 1 && parts[1].matches("\\d+") ? Long.valueOf(parts[1]) : null;
        String action = switch (request.getMethod()) {
            case "POST" -> "Thêm";
            case "DELETE" -> "Xóa";
            default -> "Cập nhật";
        };
        String subject = MODULES.get(module) + (recordId == null ? "" : " #" + recordId);
        if (path.contains("/images")) subject = "ảnh " + subject;
        if (path.contains("/receipts")) subject = "phiếu nhập · " + subject;
        String operation = parts[parts.length - 1];
        action = switch (operation) {
            case "confirm" -> "Xác nhận";
            case "cancel" -> "Hủy";
            case "ship" -> "Giao vận";
            case "complete" -> "Hoàn tất";
            case "set-primary" -> "Đặt ảnh đại diện cho";
            case "status", "toggle-status" -> "Đổi trạng thái";
            default -> action;
        };
        try {
            activities.record(actor.userId(), module, "DELETE".equals(request.getMethod()) ? null : recordId, action + " " + subject);
        } catch (RuntimeException error) {
            // shortcut: activity is recorded after commit, use a transactional outbox if guaranteed delivery is required.
            log.error("Không thể lưu thông báo hoạt động: user={}, method={}, path={}", actor.userId(), request.getMethod(), path, error);
        }
    }
}
