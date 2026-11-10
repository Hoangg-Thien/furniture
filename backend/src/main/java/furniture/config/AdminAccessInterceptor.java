package furniture.config;

import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UrlPathHelper;
import org.springframework.jdbc.core.JdbcTemplate;
import furniture.model.admin.AdminIdentity;
import furniture.service.AdminSessionService;
import furniture.util.PasswordUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AdminAccessInterceptor implements HandlerInterceptor {
    private final AdminSessionService sessions;
    private final JdbcTemplate jdbc;
    public AdminAccessInterceptor(AdminSessionService sessions, JdbcTemplate jdbc) { this.sessions = sessions; this.jdbc = jdbc; }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equals(request.getMethod())) return true;
        String path = new UrlPathHelper().getPathWithinApplication(request).replaceAll(";[^/]*", "").replaceAll("/+", "/");
        String method = request.getMethod();
        boolean customerPath = path.matches("/api/orders(/.*)?") || path.equals("/api/auth/me") || path.equals("/api/auth/logout") || path.startsWith("/api/auth/update/");
        boolean protectedPath = path.startsWith("/api/admin/") || path.equals("/api/admin")
                || path.matches("/api/auth/admin/(session|logout)")
                || path.matches("/api/auth/(users|customers)")
                || path.equals("/api/vouchers/admin/all")
                || (path.startsWith("/api/vouchers") && !"GET".equals(method) && !path.equals("/api/vouchers/validate"));
        if (!protectedPath && !customerPath) return true;
        if (customerPath && "POST".equals(method) && path.equals("/api/orders")
                && request.getHeader("Authorization") == null) return true;
        String guestToken = request.getHeader("X-Order-Token");
        if (guestToken != null && customerPath) {
            boolean read = "GET".equals(method) && path.matches("/api/orders/(\\d+|FUNI-\\d{4}-\\d+)");
            boolean cancel = "POST".equals(method) && path.matches("/api/orders/(\\d+|FUNI-\\d{4}-\\d+)/cancel");
            if ((read || cancel) && guestToken.matches("[A-Za-z0-9_-]{43}")) {
                String orderCode = path.substring("/api/orders/".length()).split("/")[0];
                try {
                    long orderId = Long.parseLong(orderCode.substring(orderCode.lastIndexOf('-') + 1));
                    Integer count = jdbc.queryForObject("""
                            SELECT COUNT(*) FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
                            WHERE o.id = ? AND o.guest_token_hash = ? AND c.user_id IS NULL
                            """, Integer.class, orderId, PasswordUtil.hash(guestToken));
                    if (count != null && count == 1) return true;
                } catch (NumberFormatException ignored) { }
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Liên kết đơn hàng không hợp lệ");
        }
        AdminIdentity identity = sessions.authenticate(request.getHeader("Authorization"));
        request.setAttribute(AdminIdentity.ATTRIBUTE, identity);
        if (!(customerPath ? allowsCustomerApi(identity, method, path, request) : allows(identity, method, path))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này");
        }
        return true;
    }

    private boolean allowsCustomerApi(AdminIdentity user, String method, String path, HttpServletRequest request) {
        if (path.equals("/api/auth/logout")) return "POST".equals(method);
        if (path.equals("/api/auth/me")) return "GET".equals(method) && String.valueOf(user.userId()).equals(request.getParameter("userId"));
        if (path.startsWith("/api/auth/update/")) return "PUT".equals(method) && path.equals("/api/auth/update/" + user.userId());
        if ("ADMIN".equals(user.role())) return true;
        boolean read = "GET".equals(method) && path.matches("/api/orders(/(\\d+|FUNI-\\d{4}-\\d+))?");
        boolean create = "POST".equals(method) && path.equals("/api/orders");
        boolean cancel = "POST".equals(method) && path.matches("/api/orders/(\\d+|FUNI-\\d{4}-\\d+)/cancel");
        if (!read && !create && !cancel) return false;
        if ("STAFF".equals(user.role())) return user.staffId() != null &&
                ("SALES".equals(user.staffType()) || ("WAREHOUSE".equals(user.staffType()) && read));
        if (!"CUSTOMER".equals(user.role()) || user.customerId() == null) return false;
        if (path.equals("/api/orders")) return "POST".equals(method)
                || ("GET".equals(method) && String.valueOf(user.customerId()).equals(request.getParameter("customerId")));
        String orderCode = path.substring("/api/orders/".length()).split("/")[0];
        try {
            long orderId = Long.parseLong(orderCode.startsWith("FUNI-") ? orderCode.substring(orderCode.lastIndexOf('-') + 1) : orderCode);
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM public.orders WHERE id = ? AND customer_id = ?", Integer.class, orderId, user.customerId());
            return count != null && count == 1;
        } catch (NumberFormatException e) { return false; }
    }

    public static boolean allows(AdminIdentity user, String method, String path) {
        if ("ADMIN".equals(user.role())) return true;
        if (!"STAFF".equals(user.role())) return false;
        if (("GET".equals(method) && path.equals("/api/auth/admin/session"))
                || ("POST".equals(method) && path.equals("/api/auth/admin/logout"))) return true;
        if (user.staffId() == null || !Set.of("SALES", "WAREHOUSE", "CONTENT").contains(user.staffType() == null ? "" : user.staffType())) return false;
        if ("GET".equals(method) && path.matches("/api/admin/(products|categories)(/\\d+)?")) return true;
        return switch (user.staffType()) {
            case "SALES" -> ("GET".equals(method) && path.matches("/api/admin/(orders|invoices|customers)(/\\d+|/counts|/eligible-orders|/export|/\\d+/pdf)?"))
                    || ("PUT".equals(method) && path.matches("/api/admin/orders/\\d+/(confirm|cancel|ship|complete)"))
                    || ("PUT".equals(method) && path.matches("/api/admin/customers/\\d+"))
                    || ("POST".equals(method) && path.matches("/api/admin/invoices(/preview-calculation)?"));
            case "WAREHOUSE" -> ("GET".equals(method) && path.matches("/api/admin/orders(/\\d+|/counts)?"))
                    || ("GET".equals(method) && path.matches("/api/admin/suppliers(/\\d+(/receipts(/\\d+/items)?)?)?"))
                    || ("POST".equals(method) && path.matches("/api/admin/suppliers(/\\d+/receipts)?"))
                    || ("PUT".equals(method) && path.matches("/api/admin/suppliers/\\d+"))
                    || ("PATCH".equals(method) && path.matches("/api/admin/suppliers/\\d+/receipts/\\d+/status"));
            case "CONTENT" -> ("PUT".equals(method) && path.matches("/api/admin/products/\\d+/content"))
                    || ("POST".equals(method) && path.matches("/api/admin/products/\\d+/images(/url)?"))
                    || ("PUT".equals(method) && path.matches("/api/admin/products/\\d+/images/\\d+/set-primary"))
                    || ("DELETE".equals(method) && path.matches("/api/admin/products/\\d+/images/\\d+"));
            default -> false;
        };
    }
}
