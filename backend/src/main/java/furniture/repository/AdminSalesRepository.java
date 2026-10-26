package furniture.repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import furniture.model.AdminInvoiceDto;
import furniture.model.AdminOrderDto;
import furniture.model.AdminOrderItemDto;
import furniture.model.AdminReviewDto;
import furniture.model.AdminVoucherDto;
import jakarta.annotation.PostConstruct;

/**
 * =====================================================================
 * REPOSITORY: AdminSalesRepository
 * Tầng truy xuất dữ liệu (Data Access Layer) cho phân hệ Bán hàng & Dịch vụ.
 * Thực thi các câu lệnh SQL truy vấn trực tiếp vào PostgreSQL Supabase qua JdbcTemplate.
 * 
 * Các chức năng bao gồm:
 * 1. Khởi tạo & tự động chuẩn hóa cấu trúc bảng (Orders, Reviews, Invoices).
 * 2. Quản lý Đơn hàng & Điều phối Giao lắp nội thất.
 * 3. Quản lý Hóa đơn tài chính, mẫu in A4 & trạng thái thanh toán.
 * 4. Quản lý Chương trình khuyến mãi & Mã giảm giá Voucher.
 * 5. Quản lý Đánh giá sản phẩm & Phản hồi chăm sóc khách hàng CSKH.
 * =====================================================================
 */
@Repository
public class AdminSalesRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminSalesRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * =====================================================================
     * HÀM KHỞI TẠO HỆ THỐNG: initSchemaAndDefaultData
     * Mục đích:
     * - Tự động bổ sung các cột chuyên sâu về giao lắp & thanh toán cho bảng 'orders'.
     * - Tháo bỏ các ràng buộc khóa trạng thái cũ để hỗ trợ quy trình Stepper 6 bước.
     * - Tự động khởi tạo bảng 'product_reviews' và chèn dữ liệu mẫu thực tế nếu bảng rỗng.
     * =====================================================================
     */
    @PostConstruct
    public void initSchemaAndDefaultData() {
        // 1. Thêm các cột phục vụ điều phối xe tải & giao lắp vào bảng orders
        try {
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS technician VARCHAR(150) DEFAULT 'Nguyễn Văn Đạt (Thợ trưởng)'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vehicle VARCHAR(150) DEFAULT 'Xe tải 1.5 tấn (29C-881.42 - Tài xế Hùng)'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(150) DEFAULT '14:00 - 16:30'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT DEFAULT 'Chung cư có thang máy hàng, cần đăng ký ban quản lý tòa nhà.'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'VietQR / Chuyển khoản'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PAID'");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(150)");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_printed BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_code VARCHAR(50)");
        } catch (Exception ex) {
            System.err.println("Notice: Lỗi thêm cột giao lắp orders: " + ex.getMessage());
        }

        // 2. Tháo bỏ ràng buộc cứng ck_orders_status để hỗ trợ 6 bước (PREPARING, DELIVERING, INSTALLING...)
        try {
            jdbcTemplate.execute("ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ck_orders_status");
            jdbcTemplate.execute("ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ck_orders_staff");
        } catch (Exception ex) {
            System.err.println("Notice: Không cần tháo constraint: " + ex.getMessage());
        }

        // 3. Chuẩn hóa trạng thái và mô tả tiến độ cho các đơn hàng có sẵn
        try {
            jdbcTemplate.execute("""
                UPDATE public.orders 
                SET delivery_status = CASE 
                    WHEN status = 'COMPLETED' THEN 'Khách hàng đã ký biên bản nghiệm thu bàn giao'
                    WHEN status = 'CONFIRMED' THEN 'Đã nhận đặt cọc, chuyển bộ phận soạn hàng kiện gỗ'
                    WHEN status = 'PREPARING' THEN 'Đang soạn hàng tại kho, bọc màng PE chống xước'
                    WHEN status = 'DELIVERING' THEN 'Xe tải đang trên đường vận chuyển đến địa chỉ khách'
                    WHEN status = 'INSTALLING' THEN 'Đội thợ mộc đang tiến hành lắp ráp căn chỉnh tại phòng'
                    WHEN status = 'CANCELLED' THEN 'Đơn hàng đã hủy'
                    ELSE 'Chờ nhân viên kinh doanh gọi xác nhận đơn và lịch đo đạc'
                END
                WHERE delivery_status IS NULL OR delivery_status = ''
            """);

            jdbcTemplate.execute("""
                UPDATE public.orders 
                SET payment_status = CASE 
                    WHEN status = 'COMPLETED' THEN 'PAID'
                    WHEN status = 'CONFIRMED' THEN 'DEPOSIT_50'
                    WHEN status = 'CANCELLED' THEN 'UNPAID'
                    ELSE 'PAID'
                END
                WHERE payment_status IS NULL OR payment_status = ''
            """);
        } catch (Exception ex) {
            System.err.println("Notice: Lỗi chuẩn hóa dữ liệu orders cũ: " + ex.getMessage());
        }

        // 4. Tạo bảng đánh giá sản phẩm (product_reviews) nếu chưa tồn tại
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.product_reviews (
                    id BIGSERIAL PRIMARY KEY,
                    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
                    customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
                    customer_name VARCHAR(150) NOT NULL,
                    customer_phone VARCHAR(50),
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    comment TEXT NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
                    store_reply_content TEXT,
                    store_reply_author VARCHAR(150),
                    store_reply_date VARCHAR(50),
                    created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
                )
            """);

            // Kiểm tra số lượng đánh giá, nếu rỗng thì chèn các đánh giá mẫu chất lượng cao
            Integer reviewCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM public.product_reviews", Integer.class);
            if (reviewCount == null || reviewCount == 0) {
                jdbcTemplate.execute("""
                    INSERT INTO public.product_reviews (product_id, customer_name, customer_phone, rating, comment, status, store_reply_author, store_reply_date, store_reply_content, created_at)
                    VALUES 
                    (1, 'Trần Minh Anh', '0901234567', 5, 'Chất vải nỉ cực kỳ mịn màng và không bám bụi. Thợ của FurniStore đến lắp ráp rất cẩn thận, đo góc phòng vừa vặn!', 'APPROVED', 'FurniStore Chăm Sóc Khách Hàng', 'Hôm qua', 'Cảm ơn anh Minh Anh đã tin dùng sofa FurniStore! Chúc gia đình có những giây phút thư giãn thoải mái.', '2026-10-21 14:30:00'),
                    (4, 'Lê Hoàng Nam', '0918765432', 5, 'Gỗ sồi hoàn thiện sơn mộc đẹp tự nhiên, không bị hắc mùi sơn PU. Ghế ngồi rất đầm và êm lưng, kích thước bàn 6 người rộng rãi.', 'APPROVED', 'FurniStore Chăm Sóc Khách Hàng', '3 ngày trước', 'Dạ FurniStore cảm ơn anh Nam! Bàn ăn gỗ tự nhiên được bảo hành chính hãng 5 năm nên anh hoàn toàn yên tâm nhé.', '2026-10-20 09:15:00'),
                    (3, 'Phạm Thu Trang', '0933887766', 4, 'Mặt đá Ceramic chống trầy rất tốt, đặt nồi súp nóng lên không bị ố vàng. Tuy nhiên mong cửa hàng ra mắt thêm phiên bản màu xám khói để dễ phối đồ.', 'APPROVED', NULL, NULL, NULL, '2026-10-19 16:45:00'),
                    (8, 'Nguyễn Bích Ngọc', '0989112233', 5, 'Đệm đầu giường cực êm, tựa lưng đọc sách mỗi tối rất thoải mái. Đóng gói kiện gỗ cẩn thận, thợ lắp ráp nhanh và dọn dẹp sạch sẽ.', 'APPROVED', 'FurniStore Chăm Sóc Khách Hàng', '5 ngày trước', 'Cảm ơn chị Bích Ngọc rất nhiều ạ! Chúc chị luôn có những giấc ngủ thật ngon và ấm áp.', '2026-10-18 11:20:00')
                """);
            }
        } catch (Exception ex) {
            System.err.println("Notice: Lỗi khởi tạo bảng product_reviews: " + ex.getMessage());
        }
    }

    // =========================================================================
    // PHẦN 1: QUẢN LÝ ĐƠN HÀNG & ĐIỀU PHỐI GIAO LẮP (ORDERS & DISPATCH)
    // =========================================================================

    /**
     * Lấy toàn bộ danh sách đơn hàng thực tế kèm sản phẩm cho Admin.
     * @return Danh sách AdminOrderDto đầy đủ chi tiết
     */
    public List<AdminOrderDto> findAllOrdersForAdmin() {
        String sql = """
            SELECT o.id,
                   o.customer_id,
                   to_char(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
                   o.status,
                   o.total_amount,
                   o.discount_amount,
                   o.voucher_id,
                   v.code AS voucher_code,
                   COALESCE(c.full_name, 'Khách vãng lai') AS customer_name,
                   COALESCE(c.phone, '') AS phone,
                   COALESCE(c.address, '') AS address,
                   COALESCE(o.payment_method, 'VietQR / Chuyển khoản') AS payment_method,
                   COALESCE(o.payment_status, 'PAID') AS payment_status,
                   COALESCE(o.technician, 'Nguyễn Văn Đạt (Thợ trưởng)') AS technician,
                   COALESCE(o.vehicle, 'Xe tải 1.5 tấn (29C-881.42)') AS vehicle,
                   COALESCE(o.delivery_time, '14:00 - 16:30') AS delivery_time,
                   COALESCE(o.delivery_notes, 'Giao giờ hành chính, gọi trước 30 phút.') AS delivery_notes,
                   COALESCE(o.delivery_status, 'Đang xử lý') AS delivery_status
            FROM public.orders o
            LEFT JOIN public.customers c ON c.id = o.customer_id
            LEFT JOIN public.vouchers v ON v.id = o.voucher_id
            ORDER BY o.id DESC
        """;

        List<AdminOrderDto> orders = jdbcTemplate.query(sql, (rs, rowNum) -> {
            AdminOrderDto dto = new AdminOrderDto();
            long id = rs.getLong("id");
            dto.setId(id);
            dto.setOrderCode(String.format("ORD-2026-%04d", id));
            dto.setCustomerId(rs.getLong("customer_id"));
            dto.setCustomerName(rs.getString("customer_name"));
            dto.setPhone(rs.getString("phone"));
            dto.setAddress(rs.getString("address"));
            
            BigDecimal total = rs.getBigDecimal("total_amount");
            BigDecimal discount = rs.getBigDecimal("discount_amount");
            dto.setTotalAmount(total != null ? total : BigDecimal.ZERO);
            dto.setDiscountAmount(discount != null ? discount : BigDecimal.ZERO);
            dto.setFinalAmount(dto.getTotalAmount().subtract(dto.getDiscountAmount()).max(BigDecimal.ZERO));

            dto.setVoucherId(rs.getLong("voucher_id"));
            dto.setVoucherCode(rs.getString("voucher_code"));
            dto.setPaymentMethod(rs.getString("payment_method"));
            dto.setPaymentStatus(rs.getString("payment_status"));
            
            String st = rs.getString("status");
            dto.setOrderStatus(st != null ? st : "PENDING_CONFIRM");
            dto.setDeliveryStatus(rs.getString("delivery_status"));
            dto.setTechnician(rs.getString("technician"));
            dto.setVehicle(rs.getString("vehicle"));
            dto.setDeliveryTime(rs.getString("delivery_time"));
            dto.setDeliveryNotes(rs.getString("delivery_notes"));
            dto.setCreatedAt(rs.getString("order_date"));

            // Khởi tạo Timeline mốc sự kiện cho đơn hàng
            List<Map<String, String>> timeline = new ArrayList<>();
            timeline.add(Map.of("time", dto.getCreatedAt() != null ? dto.getCreatedAt() : "Gần đây",
                                "text", "Khách hàng hoàn tất đặt đơn trên hệ thống FurniStore."));
            if ("CONFIRMED".equals(st) || "PREPARING".equals(st) || "DELIVERING".equals(st) || "INSTALLING".equals(st) || "COMPLETED".equals(st)) {
                timeline.add(0, Map.of("time", "Đã duyệt", "text", "Nhân viên kinh doanh xác nhận đơn hàng & tiếp nhận cọc."));
            }
            if ("PREPARING".equals(st) || "DELIVERING".equals(st) || "INSTALLING".equals(st) || "COMPLETED".equals(st)) {
                timeline.add(0, Map.of("time", "Kho xuất kiện", "text", "Thủ kho xuất kiện gỗ nguyên đai, bọc mút xốp chống trầy."));
            }
            if ("DELIVERING".equals(st) || "INSTALLING".equals(st) || "COMPLETED".equals(st)) {
                timeline.add(0, Map.of("time", "Đang vận chuyển", "text", "Xe tải chuyển hàng rời kho, kỹ thuật viên di chuyển tới căn hộ."));
            }
            if ("INSTALLING".equals(st) || "COMPLETED".equals(st)) {
                timeline.add(0, Map.of("time", "Đang thi công", "text", "Đội thợ thi công bắt vít, cân chỉnh độ thăng bằng nội thất."));
            }
            if ("COMPLETED".equals(st)) {
                timeline.add(0, Map.of("time", "Hoàn tất", "text", "Khách hàng ký nghiệm thu bàn giao và thanh toán phần còn lại."));
            } else if ("CANCELLED".equals(st)) {
                timeline.add(0, Map.of("time", "Đã hủy", "text", "Đơn hàng đã bị hủy, hoàn trả số lượng vào kho."));
            }
            dto.setTimeline(timeline);

            return dto;
        });

        // Gắn chi tiết sản phẩm cho từng đơn hàng
        if (!orders.isEmpty()) {
            List<Long> orderIds = orders.stream().map(AdminOrderDto::getId).collect(Collectors.toList());
            Map<Long, List<AdminOrderItemDto>> itemsMap = findOrderItemsGroupedByOrderId(orderIds);
            for (AdminOrderDto o : orders) {
                o.setItems(itemsMap.getOrDefault(o.getId(), Collections.emptyList()));
            }
        }

        return orders;
    }

    /**
     * Tìm chi tiết 1 đơn hàng theo ID.
     * @param id Mã ID đơn hàng
     * @return AdminOrderDto chi tiết hoặc null
     */
    public AdminOrderDto findOrderById(Long id) {
        List<AdminOrderDto> all = findAllOrdersForAdmin();
        return all.stream().filter(o -> o.getId().equals(id)).findFirst().orElse(null);
    }

    /**
     * Cập nhật trạng thái tiến trình đơn hàng (Stepper 6 bước).
     * @param orderId ID đơn hàng
     * @param nextStatus Trạng thái mới (CONFIRMED, PREPARING, DELIVERING, INSTALLING, COMPLETED...)
     * @param deliveryText Mô tả tiến độ giao hàng
     * @return Số dòng được cập nhật (1 nếu thành công)
     */
    public int updateOrderStatus(Long orderId, String nextStatus, String deliveryText) {
        String sql = "UPDATE public.orders SET status = ?, delivery_status = ? WHERE id = ?";
        return jdbcTemplate.update(sql, nextStatus, deliveryText, orderId);
    }

    /**
     * Cập nhật thông tin điều phối thợ lắp đặt và phương tiện vận chuyển.
     * @param orderId ID đơn hàng
     * @param technician Tên thợ mộc phụ trách
     * @param vehicle Phương tiện xe tải
     * @param deliveryTime Khung giờ hẹn
     * @param deliveryNotes Ghi chú thi công
     * @return Số dòng cập nhật
     */
    public int updateDispatchInfo(Long orderId, String technician, String vehicle, String deliveryTime, String deliveryNotes) {
        String sql = """
            UPDATE public.orders 
            SET technician = ?, vehicle = ?, delivery_time = ?, delivery_notes = ? 
            WHERE id = ?
        """;
        return jdbcTemplate.update(sql, technician, vehicle, deliveryTime, deliveryNotes, orderId);
    }

    /**
     * Hủy đơn hàng và hoàn lại số lượng voucher đã dùng (nếu có).
     * @param orderId ID đơn hàng cần hủy
     * @return Số dòng cập nhật
     */
    public int cancelOrder(Long orderId) {
        // Lấy voucher_id của đơn trước khi hủy
        List<Long> voucherIds = jdbcTemplate.query(
            "SELECT voucher_id FROM public.orders WHERE id = ? AND voucher_id IS NOT NULL",
            (rs, rowNum) -> rs.getLong("voucher_id"), orderId);

        int updated = jdbcTemplate.update(
            "UPDATE public.orders SET status = 'CANCELLED', delivery_status = 'Đã hủy đơn hàng' WHERE id = ?",
            orderId);

        // Hoàn lại used_quantity của voucher nếu đơn bị hủy
        if (updated > 0 && !voucherIds.isEmpty() && voucherIds.get(0) != null) {
            try {
                jdbcTemplate.update("UPDATE public.vouchers SET used_quantity = GREATEST(used_quantity - 1, 0) WHERE id = ?",
                        voucherIds.get(0));
            } catch (Exception e) {
                System.err.println("Notice: Không thể giảm voucher used_quantity: " + e.getMessage());
            }
        }
        return updated;
    }

    /**
     * Truy vấn danh sách order items theo danh sách order ID theo nhóm.
     */
    private Map<Long, List<AdminOrderItemDto>> findOrderItemsGroupedByOrderId(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) return Collections.emptyMap();
        String inSql = orderIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String sql = "SELECT oi.order_id, oi.product_id, p.name AS product_name, p.image_url, " +
                     "p.unit, COALESCE(c.name, 'Nội thất') AS category_name, oi.quantity, oi.unit_price, oi.amount " +
                     "FROM public.order_items oi " +
                     "LEFT JOIN public.products p ON p.id = oi.product_id " +
                     "LEFT JOIN public.categories c ON c.id = p.category_id " +
                     "WHERE oi.order_id IN (" + inSql + ") " +
                     "ORDER BY oi.order_id DESC, oi.product_id ASC";

        Map<Long, List<AdminOrderItemDto>> map = new HashMap<>();
        jdbcTemplate.query(sql, rs -> {
            long oId = rs.getLong("order_id");
            AdminOrderItemDto item = new AdminOrderItemDto(
                rs.getLong("product_id"),
                rs.getString("product_name"),
                rs.getString("category_name"),
                rs.getString("unit"),
                rs.getString("image_url"),
                rs.getInt("quantity"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("amount")
            );
            map.computeIfAbsent(oId, k -> new ArrayList<>()).add(item);
        });
        return map;
    }

    // =========================================================================
    // PHẦN 2: QUẢN LÝ HÓA ĐƠN & MẪU IN A4 (INVOICES & A4 PRINTOUT)
    // =========================================================================

    /**
     * Lấy toàn bộ danh sách hóa đơn từ các đơn hàng thực tế trong database.
     * Tính toán chuẩn tài chính: Tiền trước thuế, VAT 8%, Tiền giảm voucher, Tổng thanh toán.
     * @return Danh sách AdminInvoiceDto
     */
    public List<AdminInvoiceDto> findAllInvoicesForAdmin() {
        List<AdminOrderDto> orders = findAllOrdersForAdmin();
        List<AdminInvoiceDto> invoices = new ArrayList<>();

        for (AdminOrderDto order : orders) {
            // Không tạo hóa đơn cho đơn đã hủy
            if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
                continue;
            }

            AdminInvoiceDto inv = new AdminInvoiceDto();
            inv.setId(order.getId());
            inv.setOrderId(order.getId());
            inv.setInvoiceNumber(String.format("INV-2026-%05d", order.getId()));
            inv.setOrderCode(order.getOrderCode());
            inv.setCustomerName(order.getCustomerName());
            inv.setPhone(order.getPhone());
            inv.setAddress(order.getAddress());
            inv.setTaxCode(""); // Mặc định rỗng hoặc lấy từ database
            
            BigDecimal subtotal = order.getTotalAmount();
            BigDecimal vatRate = new BigDecimal("8.0"); // 8% thuế suất nội thất
            BigDecimal vatAmount = subtotal.multiply(new BigDecimal("0.08")).setScale(0, java.math.RoundingMode.HALF_UP);
            BigDecimal discount = order.getDiscountAmount();
            BigDecimal totalPayment = subtotal.add(vatAmount).subtract(discount).max(BigDecimal.ZERO);

            inv.setSubtotal(subtotal);
            inv.setVatRate(vatRate);
            inv.setVatAmount(vatAmount);
            inv.setDiscountAmount(discount);
            inv.setTotalPayment(totalPayment);
            inv.setIssueDate(order.getCreatedAt());
            inv.setPaymentStatus(order.getPaymentStatus());
            inv.setPaymentMethod(order.getPaymentMethod());
            inv.setPrinted(false);
            inv.setTechnician(order.getTechnician());
            inv.setItems(order.getItems());

            invoices.add(inv);
        }
        return invoices;
    }

    /**
     * Lấy chi tiết 1 hóa đơn theo Order ID (để hiển thị Modal & In A4).
     * @param orderId ID đơn hàng
     * @return AdminInvoiceDto hoặc null
     */
    public AdminInvoiceDto findInvoiceByOrderId(Long orderId) {
        List<AdminInvoiceDto> all = findAllInvoicesForAdmin();
        return all.stream().filter(inv -> inv.getOrderId().equals(orderId)).findFirst().orElse(null);
    }

    /**
     * Cập nhật trạng thái thanh toán của hóa đơn.
     * @param orderId ID đơn hàng gắn với hóa đơn
     * @param paymentStatus 'PAID', 'PARTIAL_PAID', 'UNPAID'
     * @param paymentMethod 'VietQR / Chuyển khoản', 'Tiền mặt', v.v.
     * @return Số dòng cập nhật
     */
    public int updateInvoicePayment(Long orderId, String paymentStatus, String paymentMethod) {
        String sql = "UPDATE public.orders SET payment_status = ?, payment_method = COALESCE(?, payment_method) WHERE id = ?";
        return jdbcTemplate.update(sql, paymentStatus, paymentMethod, orderId);
    }

    /**
     * Đánh dấu hóa đơn đã được in chứng từ A4 biên bản nghiệm thu.
     * @param orderId ID đơn hàng
     * @return Số dòng cập nhật
     */
    public int markInvoicePrinted(Long orderId) {
        String sql = "UPDATE public.orders SET invoice_printed = TRUE WHERE id = ?";
        return jdbcTemplate.update(sql, orderId);
    }

    // =========================================================================
    // PHẦN 3: QUẢN LÝ KHUYẾN MÃI & VOUCHER (PROMOTIONS & VOUCHERS)
    // =========================================================================

    /**
     * Lấy danh sách toàn bộ vouchers kèm chương trình khuyến mãi cho Admin.
     * @return Danh sách AdminVoucherDto
     */
    public List<AdminVoucherDto> findAllVouchersForAdmin() {
        String sql = """
            SELECT v.id,
                   v.code,
                   v.discount_percent,
                   v.minimum_amount,
                   v.maximum_discount,
                   v.quantity,
                   v.used_quantity,
                   (v.quantity - v.used_quantity) AS remaining_quantity,
                   to_char(v.start_date, 'YYYY-MM-DD') AS start_date,
                   to_char(v.end_date, 'YYYY-MM-DD') AS end_date,
                   v.status AS voucher_status,
                   pp.id AS program_id,
                   pp.name AS program_name,
                   pp.description AS program_description,
                   pp.status AS program_status,
                   CASE 
                       WHEN pp.status = 'DRAFT' THEN 'PENDING_APPROVAL'
                       WHEN pp.status = 'ACTIVE' AND v.status = 'ACTIVE' AND v.end_date >= CURRENT_TIMESTAMP THEN 'APPROVED'
                       WHEN v.end_date < CURRENT_TIMESTAMP THEN 'EXPIRED'
                       ELSE 'REJECTED'
                   END AS approval_state
            FROM public.vouchers v
            JOIN public.promotion_programs pp ON pp.id = v.promotion_program_id
            ORDER BY v.id DESC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            AdminVoucherDto dto = new AdminVoucherDto();
            dto.setId(rs.getLong("id"));
            dto.setCode(rs.getString("code"));
            dto.setProgramId(rs.getLong("program_id"));
            dto.setProgramName(rs.getString("program_name"));
            dto.setDescription(rs.getString("program_description"));
            dto.setDiscountPercent(rs.getBigDecimal("discount_percent"));
            dto.setMinimumAmount(rs.getBigDecimal("minimum_amount"));
            dto.setMaximumDiscount(rs.getBigDecimal("maximum_discount"));
            dto.setQuantity(rs.getInt("quantity"));
            dto.setUsedQuantity(rs.getInt("used_quantity"));
            dto.setRemainingQuantity(rs.getInt("remaining_quantity"));
            dto.setStartDate(rs.getString("start_date"));
            dto.setEndDate(rs.getString("end_date"));
            dto.setStatus(rs.getString("voucher_status"));
            dto.setApprovalState(rs.getString("approval_state"));
            return dto;
        });
    }

    /**
     * Tạo mới chương trình khuyến mãi và voucher giảm giá nội thất.
     * @param dto Dữ liệu tạo voucher
     * @return ID của voucher vừa tạo
     */
    public Long createVoucher(AdminVoucherDto dto) {
        // Bước 1: Tạo chương trình khuyến mãi promotion_programs
        String progSql = """
            INSERT INTO public.promotion_programs (name, description, start_date, end_date, status)
            VALUES (?, ?, ?::timestamp, ?::timestamp, 'ACTIVE')
            RETURNING id
        """;
        String sDate = dto.getStartDate() + " 00:00:00";
        String eDate = dto.getEndDate() + " 23:59:59";
        Long programId = jdbcTemplate.queryForObject(progSql, Long.class, dto.getProgramName(), dto.getDescription(), sDate, eDate);

        // Bước 2: Tạo voucher gắn với chương trình vừa tạo
        String voucherSql = """
            INSERT INTO public.vouchers (promotion_program_id, code, discount_percent, minimum_amount, maximum_discount, quantity, used_quantity, start_date, end_date, status)
            VALUES (?, UPPER(?), ?, ?, ?, ?, 0, ?::timestamp, ?::timestamp, 'ACTIVE')
            RETURNING id
        """;
        return jdbcTemplate.queryForObject(voucherSql, Long.class,
                programId,
                dto.getCode().trim().toUpperCase(),
                dto.getDiscountPercent(),
                dto.getMinimumAmount() != null ? dto.getMinimumAmount() : BigDecimal.ZERO,
                dto.getMaximumDiscount(),
                dto.getQuantity() != null ? dto.getQuantity() : 100,
                sDate,
                eDate);
    }

    /**
     * Phê duyệt voucher đang ở trạng thái PENDING_APPROVAL.
     * @param voucherId ID voucher
     * @return boolean true nếu duyệt thành công
     */
    public boolean approveVoucher(Long voucherId) {
        int u1 = jdbcTemplate.update("""
            UPDATE public.promotion_programs pp
            SET status = 'ACTIVE'
            FROM public.vouchers v
            WHERE v.promotion_program_id = pp.id AND v.id = ?
        """, voucherId);

        int u2 = jdbcTemplate.update("UPDATE public.vouchers SET status = 'ACTIVE' WHERE id = ?", voucherId);
        return u1 > 0 || u2 > 0;
    }

    /**
     * Cập nhật trạng thái voucher (ACTIVE / PAUSED / INACTIVE).
     * @param voucherId ID voucher
     * @param status Trạng thái mới
     * @return Số dòng cập nhật
     */
    public int updateVoucherStatus(Long voucherId, String status) {
        return jdbcTemplate.update("UPDATE public.vouchers SET status = ? WHERE id = ?", status, voucherId);
    }

    /**
     * Xóa vĩnh viễn voucher (nếu chưa có đơn hàng nào áp dụng).
     * @param voucherId ID voucher cần xóa
     * @return Số dòng xóa
     */
    public int deleteVoucher(Long voucherId) {
        return jdbcTemplate.update("DELETE FROM public.vouchers WHERE id = ? AND used_quantity = 0", voucherId);
    }

    // =========================================================================
    // PHẦN 4: QUẢN LÝ ĐÁNH GIÁ SẢN PHẨM & CSKH (REVIEWS & RATINGS)
    // =========================================================================

    /**
     * Lấy toàn bộ đánh giá sản phẩm thực tế từ bảng 'product_reviews'.
     * @return Danh sách AdminReviewDto
     */
    public List<AdminReviewDto> findAllReviewsForAdmin() {
        String sql = """
            SELECT r.id,
                   r.product_id,
                   p.name AS product_name,
                   p.image_url AS product_image,
                   r.customer_id,
                   r.customer_name,
                   COALESCE(r.customer_phone, '') AS customer_phone,
                   r.rating,
                   r.comment,
                   to_char(r.created_at, 'YYYY-MM-DD') AS review_date,
                   r.status,
                   r.store_reply_author,
                   r.store_reply_date,
                   r.store_reply_content
            FROM public.product_reviews r
            LEFT JOIN public.products p ON p.id = r.product_id
            ORDER BY r.id DESC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            AdminReviewDto dto = new AdminReviewDto();
            dto.setId(rs.getLong("id"));
            dto.setProductId(rs.getLong("product_id"));
            dto.setProductName(rs.getString("product_name"));
            dto.setProductImage(rs.getString("product_image"));
            dto.setCustomerId(rs.getLong("customer_id"));
            dto.setCustomerName(rs.getString("customer_name"));
            dto.setCustomerPhone(rs.getString("customer_phone"));
            dto.setRating(rs.getInt("rating"));
            dto.setComment(rs.getString("comment"));
            dto.setDate(rs.getString("review_date"));
            dto.setStatus(rs.getString("status"));

            String replyContent = rs.getString("store_reply_content");
            if (replyContent != null && !replyContent.trim().isEmpty()) {
                Map<String, String> replyMap = new HashMap<>();
                replyMap.put("author", rs.getString("store_reply_author"));
                replyMap.put("date", rs.getString("store_reply_date"));
                replyMap.put("content", replyContent);
                dto.setStoreReply(replyMap);
            }
            return dto;
        });
    }

    /**
     * Bật/Tắt trạng thái hiển thị của đánh giá ('APPROVED' <-> 'HIDDEN').
     * @param reviewId ID đánh giá
     * @return Trạng thái mới sau khi đảo
     */
    public String toggleReviewStatus(Long reviewId) {
        String curStatus = jdbcTemplate.queryForObject(
            "SELECT status FROM public.product_reviews WHERE id = ?", String.class, reviewId);
        String nextStatus = "APPROVED".equalsIgnoreCase(curStatus) ? "HIDDEN" : "APPROVED";
        jdbcTemplate.update("UPDATE public.product_reviews SET status = ? WHERE id = ?", nextStatus, reviewId);
        return nextStatus;
    }

    /**
     * Lưu phản hồi chính thức của CSKH vào đánh giá của khách hàng.
     * @param reviewId ID đánh giá
     * @param author Người phản hồi (CSKH FurniStore)
     * @param content Nội dung phản hồi
     * @return Số dòng cập nhật
     */
    public int replyToReview(Long reviewId, String author, String content) {
        String sql = """
            UPDATE public.product_reviews 
            SET store_reply_author = ?, store_reply_content = ?, store_reply_date = 'Hôm nay'
            WHERE id = ?
        """;
        return jdbcTemplate.update(sql, author, content, reviewId);
    }

    /**
     * Xóa vĩnh viễn một đánh giá khỏi hệ thống.
     * @param reviewId ID đánh giá
     * @return Số dòng xóa
     */
    public int deleteReview(Long reviewId) {
        return jdbcTemplate.update("DELETE FROM public.product_reviews WHERE id = ?", reviewId);
    }
}
