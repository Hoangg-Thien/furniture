package furniture.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.AdminVoucherDto;
import furniture.model.ReplyReviewRequest;
import furniture.model.UpdateDispatchInfoRequest;
import furniture.model.UpdateInvoicePaymentRequest;
import furniture.model.UpdateOrderStatusRequest;
import furniture.service.AdminSalesService;

/**
 * =====================================================================
 * CONTROLLER: AdminSalesController
 * Tầng giao tiếp RESTful API (Presentation Layer) chuẩn mô hình MVC.
 * Cung cấp toàn bộ các API phục vụ phân hệ "Bán hàng & Dịch vụ" cho Admin Dashboard:
 * 
 * 1. Nhóm API Đơn Hàng & Điều Phối Giao Lắp (/api/admin/orders)
 * 2. Nhóm API Hóa Đơn & Mẫu In A4 (/api/admin/invoices)
 * 3. Nhóm API Khuyến Mãi & Voucher (/api/admin/promotions)
 * 4. Nhóm API Đánh Giá Sản Phẩm & CSKH (/api/admin/reviews)
 * =====================================================================
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminSalesController {

    private final AdminSalesService adminSalesService;

    public AdminSalesController(AdminSalesService adminSalesService) {
        this.adminSalesService = adminSalesService;
    }

    // =========================================================================
    // 1. NHÓM API: ĐƠN HÀNG & ĐIỀU PHỐI GIAO LẮP (/api/admin/orders)
    // =========================================================================

    /**
     * [GET] /api/admin/orders
     * Mục đích: Lấy toàn bộ danh sách đơn hàng nội thất trong cơ sở dữ liệu thật.
     * Sử dụng tại: Màn hình "Đơn Hàng & Giao Lắp" (/admin/orders).
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        try {
            return ResponseEntity.ok(adminSalesService.getAllOrders());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách đơn hàng: " + ex.getMessage()));
        }
    }

    /**
     * [GET] /api/admin/orders/{id}
     * Mục đích: Lấy thông tin chi tiết một đơn hàng kèm danh sách sản phẩm và timeline sự kiện.
     * Sử dụng tại: Modal xem chi tiết đơn hàng nội thất.
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.getOrderById(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải chi tiết đơn hàng: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/orders/{id}/status
     * Mục đích: Cập nhật trạng thái tiến trình đơn hàng (Chuyển bước trong Stepper 6 bước).
     * Tham số: { nextStatus, deliveryStatusText, note }
     * Sử dụng tại: Thao tác duyệt đơn, giao hàng, lắp đặt, nghiệm thu.
     */
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest req) {
        try {
            return ResponseEntity.ok(adminSalesService.updateOrderStatus(id, req));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật trạng thái đơn hàng: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/orders/{id}/dispatch
     * Mục đích: Lưu thông tin điều phối thợ lắp ráp, xe tải và ghi chú căn hộ khách hàng.
     * Tham số: { technician, vehicle, deliveryTime, deliveryNotes }
     * Sử dụng tại: Tab "Điều phối đội thợ & Xe tải" trong modal chi tiết đơn hàng.
     */
    @PutMapping("/orders/{id}/dispatch")
    public ResponseEntity<?> updateDispatchInfo(@PathVariable Long id, @RequestBody UpdateDispatchInfoRequest req) {
        try {
            return ResponseEntity.ok(adminSalesService.updateDispatchInfo(id, req));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lưu điều phối thợ: " + ex.getMessage()));
        }
    }

    /**
     * [POST] /api/admin/orders/{id}/cancel
     * Mục đích: Hủy đơn hàng và tự động hoàn lại số lượng voucher đã dùng.
     * Sử dụng tại: Nút "Hủy đơn hàng" với hộp thoại xác nhận an toàn.
     */
    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.cancelOrder(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hủy đơn hàng: " + ex.getMessage()));
        }
    }

    // =========================================================================
    // 2. NHÓM API: HÓA ĐƠN & MẪU IN A4 (/api/admin/invoices)
    // =========================================================================

    /**
     * [GET] /api/admin/invoices
     * Mục đích: Lấy toàn bộ danh sách hóa đơn tài chính (tính VAT 8%, tiền giảm, tổng thanh toán).
     * Sử dụng tại: Màn hình "Hóa Đơn & Mẫu In A4" (/admin/invoices).
     */
    @GetMapping("/invoices")
    public ResponseEntity<?> getAllInvoices() {
        try {
            return ResponseEntity.ok(adminSalesService.getAllInvoices());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách hóa đơn: " + ex.getMessage()));
        }
    }

    /**
     * [GET] /api/admin/invoices/{orderId}
     * Mục đích: Lấy thông tin hóa đơn chi tiết theo ID đơn hàng (đầy đủ dòng sản phẩm, tiền thuế VAT).
     * Sử dụng tại: Mẫu in A4 biên bản bàn giao & nghiệm thu nội thất tích hợp mã VietQR.
     */
    @GetMapping("/invoices/{orderId}")
    public ResponseEntity<?> getInvoiceByOrderId(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(adminSalesService.getInvoiceByOrderId(orderId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải chi tiết hóa đơn: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/invoices/{orderId}/payment
     * Mục đích: Cập nhật trạng thái thanh toán hóa đơn ('PAID', 'PARTIAL_PAID', 'UNPAID').
     * Sử dụng tại: Cập nhật khi khách đặt cọc 50% hoặc thanh toán dứt điểm khi nhận hàng.
     */
    @PutMapping("/invoices/{orderId}/payment")
    public ResponseEntity<?> updateInvoicePayment(@PathVariable Long orderId, @RequestBody UpdateInvoicePaymentRequest req) {
        try {
            return ResponseEntity.ok(adminSalesService.updateInvoicePayment(orderId, req));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật thanh toán hóa đơn: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/invoices/{orderId}/print
     * Mục đích: Đánh dấu hóa đơn đã in chứng từ ra giấy A4.
     * Sử dụng tại: Nút "In Hóa Đơn A4" trên giao diện.
     */
    @PutMapping("/invoices/{orderId}/print")
    public ResponseEntity<?> markInvoicePrinted(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(adminSalesService.markInvoicePrinted(orderId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi đánh dấu in hóa đơn: " + ex.getMessage()));
        }
    }

    // =========================================================================
    // 3. NHÓM API: KHUYẾN MÃI & VOUCHER (/api/admin/promotions)
    // =========================================================================

    /**
     * [GET] /api/admin/promotions
     * Mục đích: Lấy toàn bộ danh sách mã giảm giá và chương trình khuyến mãi nội thất.
     * Sử dụng tại: Màn hình "Khuyến Mãi & Voucher" (/admin/promotions).
     */
    @GetMapping("/promotions")
    public ResponseEntity<?> getAllVouchers() {
        try {
            return ResponseEntity.ok(adminSalesService.getAllVouchers());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách khuyến mãi: " + ex.getMessage()));
        }
    }

    /**
     * [POST] /api/admin/promotions
     * Mục đích: Tạo mới một chương trình ưu đãi và mã voucher giảm giá.
     * Sử dụng tại: Modal "Tạo Chương Trình Voucher Mới".
     */
    @PostMapping("/promotions")
    public ResponseEntity<?> createVoucher(@RequestBody AdminVoucherDto dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminSalesService.createVoucher(dto));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo voucher: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/promotions/{id}/status
     * Mục đích: Thay đổi trạng thái voucher (Tạm dừng PAUSED hoặc Tiếp tục ACTIVE).
     * Sử dụng tại: Nút Tạm dừng / Kích hoạt voucher.
     */
    @PutMapping("/promotions/{id}/status")
    public ResponseEntity<?> updateVoucherStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(adminSalesService.updateVoucherStatus(id, status));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi đổi trạng thái voucher: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/promotions/{id}/approve
     * Mục đích: Phê duyệt voucher từ trạng thái PENDING_APPROVAL sang APPROVED.
     * Sử dụng tại: Nút "Duyệt Voucher" cho Admin.
     */
    @PutMapping("/promotions/{id}/approve")
    public ResponseEntity<?> approveVoucher(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.approveVoucher(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi duyệt voucher: " + ex.getMessage()));
        }
    }

    /**
     * [DELETE] /api/admin/promotions/{id}
     * Mục đích: Xóa vĩnh viễn voucher khỏi hệ thống nếu chưa có đơn hàng nào áp dụng.
     * Sử dụng tại: Nút Xóa voucher.
     */
    @DeleteMapping("/promotions/{id}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.deleteVoucher(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xóa voucher: " + ex.getMessage()));
        }
    }

    // =========================================================================
    // 4. NHÓM API: ĐÁNH GIÁ SẢN PHẨM & CSKH (/api/admin/reviews)
    // =========================================================================

    /**
     * [GET] /api/admin/reviews
     * Mục đích: Lấy toàn bộ đánh giá sản phẩm của khách hàng từ database PostgreSQL.
     * Sử dụng tại: Màn hình "Đánh Giá Sản Phẩm" (/admin/reviews).
     */
    @GetMapping("/reviews")
    public ResponseEntity<?> getAllReviews() {
        try {
            return ResponseEntity.ok(adminSalesService.getAllReviews());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách đánh giá: " + ex.getMessage()));
        }
    }

    /**
     * [PUT] /api/admin/reviews/{id}/toggle-status
     * Mục đích: Bật hoặc tắt trạng thái hiển thị đánh giá trên sàn ('APPROVED' <-> 'HIDDEN').
     * Sử dụng tại: Nút "Cho phép hiển thị" / "Ẩn đánh giá".
     */
    @PutMapping("/reviews/{id}/toggle-status")
    public ResponseEntity<?> toggleReviewStatus(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.toggleReviewStatus(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi đổi trạng thái đánh giá: " + ex.getMessage()));
        }
    }

    /**
     * [POST] /api/admin/reviews/{id}/reply
     * Mục đích: Gửi phản hồi chính thức từ bộ phận Chăm sóc khách hàng FurniStore.
     * Tham số: { author, content }
     * Sử dụng tại: Hộp thoại "Phản hồi khách hàng" của màn hình đánh giá.
     */
    @PostMapping("/reviews/{id}/reply")
    public ResponseEntity<?> replyToReview(@PathVariable Long id, @RequestBody ReplyReviewRequest req) {
        try {
            return ResponseEntity.ok(adminSalesService.replyToReview(id, req));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi gửi phản hồi đánh giá: " + ex.getMessage()));
        }
    }

    /**
     * [DELETE] /api/admin/reviews/{id}
     * Mục đích: Xóa vĩnh viễn một đánh giá spam hoặc vi phạm tiêu chuẩn cộng đồng.
     * Sử dụng tại: Nút "Xóa vĩnh viễn" đánh giá.
     */
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminSalesService.deleteReview(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xóa đánh giá: " + ex.getMessage()));
        }
    }
}
