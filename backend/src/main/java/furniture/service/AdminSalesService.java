package furniture.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.AdminInvoiceDto;
import furniture.model.AdminOrderDto;
import furniture.model.AdminReviewDto;
import furniture.model.AdminVoucherDto;
import furniture.model.ReplyReviewRequest;
import furniture.model.UpdateDispatchInfoRequest;
import furniture.model.UpdateInvoicePaymentRequest;
import furniture.model.UpdateOrderStatusRequest;
import furniture.repository.AdminSalesRepository;

/**
 * =====================================================================
 * SERVICE: AdminSalesService
 * Tầng xử lý nghiệp vụ (Business Logic Layer) chuẩn mô hình MVC.
 * Quản lý toàn bộ quy trình nghiệp vụ của phân hệ "Bán hàng & Dịch vụ":
 * 
 * 1. Đơn Hàng & Điều Phối Giao Lắp:
 *    - Xem danh sách và chi tiết đơn hàng nội thất.
 *    - Quy trình chuyển trạng thái 6 bước (Xác nhận, xuất kho, xe tải, lắp ráp, hoàn tất).
 *    - Phân bổ nhân sự thợ mộc, phương tiện xe tải, hẹn giờ và ghi chú căn hộ.
 *    - Hủy đơn hàng và tự động hoàn trả số lượng voucher.
 * 
 * 2. Hóa Đơn & Mẫu In A4:
 *    - Đồng bộ tự động hóa đơn từ đơn hàng thật trong database.
 *    - Tính thuế suất GTGT 8% ngành gỗ nội thất, tiền giảm giá và tổng thanh toán.
 *    - Cập nhật trạng thái thanh toán (PAID / PARTIAL_PAID / UNPAID).
 *    - Đánh dấu đã in chứng từ A4 biên bản nghiệm thu bàn giao.
 * 
 * 3. Khuyến Mãi & Voucher:
 *    - Quản lý kho voucher và chương trình ưu đãi nội thất.
 *    - Tạo mới voucher, phê duyệt voucher từ phòng kinh doanh.
 *    - Tạm dừng hoặc kích hoạt lại voucher.
 * 
 * 4. Đánh Giá Sản Phẩm & CSKH:
 *    - Kiểm duyệt đánh giá của khách hàng về sản phẩm và độ hoàn thiện.
 *    - Ẩn/Hiện đánh giá trên sàn bán lẻ trực tuyến.
 *    - Trả lời và chăm sóc phản hồi khách hàng.
 * =====================================================================
 */
@Service
public class AdminSalesService {

    private final AdminSalesRepository adminSalesRepository;

    public AdminSalesService(AdminSalesRepository adminSalesRepository) {
        this.adminSalesRepository = adminSalesRepository;
    }

    // =========================================================================
    // 1. NGHIỆP VỤ ĐƠN HÀNG & ĐIỀU PHỐI GIAO LẮP
    // =========================================================================

    /**
     * Lấy toàn bộ danh sách đơn hàng cho giao diện Admin.
     * @return Danh sách AdminOrderDto kèm thông tin sản phẩm và điều phối thợ
     */
    public List<AdminOrderDto> getAllOrders() {
        return adminSalesRepository.findAllOrdersForAdmin();
    }

    /**
     * Lấy chi tiết đơn hàng theo mã ID.
     * @param id Khóa chính đơn hàng
     * @return AdminOrderDto chi tiết
     */
    public AdminOrderDto getOrderById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("ID đơn hàng không hợp lệ: " + id);
        }
        AdminOrderDto order = adminSalesRepository.findOrderById(id);
        if (order == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng #" + id);
        }
        return order;
    }

    /**
     * Cập nhật tiến trình đơn hàng theo quy trình Stepper 6 bước.
     * @param orderId ID đơn hàng
     * @param req Yêu cầu chứa trạng thái mới và text mô tả tiến độ
     * @return AdminOrderDto sau khi cập nhật
     */
    @Transactional
    public AdminOrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequest req) {
        if (orderId == null || orderId <= 0) {
            throw new IllegalArgumentException("ID đơn hàng không hợp lệ.");
        }
        if (req == null || req.getNextStatus() == null || req.getNextStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái mới không được để trống.");
        }

        String nextStatus = req.getNextStatus().trim().toUpperCase();
        String deliveryText = req.getDeliveryStatusText();
        if (deliveryText == null || deliveryText.trim().isEmpty()) {
            deliveryText = switch (nextStatus) {
                case "CONFIRMED" -> "Đã duyệt đơn & xác nhận lịch hẹn đo đạc thi công";
                case "PREPARING" -> "Đang soạn kiện gỗ tại kho, bọc màng PE chống xước";
                case "DELIVERING" -> "Xe tải đang trên đường vận chuyển đến địa chỉ khách";
                case "INSTALLING" -> "Thợ mộc đang tiến hành lắp ráp căn chỉnh tại phòng";
                case "COMPLETED" -> "Khách hàng đã ký biên bản nghiệm thu bàn giao";
                case "CANCELLED" -> "Đã hủy đơn hàng";
                default -> "Chờ nhân viên kinh doanh duyệt đơn";
            };
        }

        adminSalesRepository.updateOrderStatus(orderId, nextStatus, deliveryText);
        return getOrderById(orderId);
    }

    /**
     * Lưu thông tin điều phối kỹ thuật viên, xe tải và lịch hẹn cho đơn hàng.
     * @param orderId ID đơn hàng
     * @param req Dữ liệu điều phối (thợ phụ trách, xe tải, khung giờ, lưu ý tòa nhà)
     * @return AdminOrderDto sau khi lưu
     */
    @Transactional
    public AdminOrderDto updateDispatchInfo(Long orderId, UpdateDispatchInfoRequest req) {
        if (orderId == null || orderId <= 0) {
            throw new IllegalArgumentException("ID đơn hàng không hợp lệ.");
        }
        if (req == null) {
            throw new IllegalArgumentException("Dữ liệu điều phối không được để trống.");
        }

        adminSalesRepository.updateDispatchInfo(
            orderId,
            req.getTechnician() != null ? req.getTechnician().trim() : "Nguyễn Văn Đạt (Thợ trưởng)",
            req.getVehicle() != null ? req.getVehicle().trim() : "Xe tải 1.5 tấn (29C-881.42)",
            req.getDeliveryTime() != null ? req.getDeliveryTime().trim() : "14:00 - 16:30",
            req.getDeliveryNotes() != null ? req.getDeliveryNotes().trim() : ""
        );

        return getOrderById(orderId);
    }

    /**
     * Hủy đơn hàng và hoàn lại voucher sử dụng.
     * @param orderId ID đơn hàng
     * @return Map chứa thông báo và trạng thái mới
     */
    @Transactional
    public Map<String, Object> cancelOrder(Long orderId) {
        if (orderId == null || orderId <= 0) {
            throw new IllegalArgumentException("ID đơn hàng không hợp lệ.");
        }
        int updated = adminSalesRepository.cancelOrder(orderId);
        if (updated <= 0) {
            throw new IllegalArgumentException("Không thể hủy đơn hàng #" + orderId + " (đơn không tồn tại).");
        }
        return Map.of(
            "message", "Đã hủy đơn hàng #" + orderId + " thành công. Tồn kho và voucher đã được hoàn lại.",
            "orderStatus", "CANCELLED",
            "orderId", orderId
        );
    }

    // =========================================================================
    // 2. NGHIỆP VỤ HÓA ĐƠN & MẪU IN A4 BIÊN BẢN NGHIỆM THU
    // =========================================================================

    /**
     * Lấy danh sách toàn bộ hóa đơn bán lẻ và GTGT nội thất.
     * @return Danh sách AdminInvoiceDto
     */
    public List<AdminInvoiceDto> getAllInvoices() {
        return adminSalesRepository.findAllInvoicesForAdmin();
    }

    /**
     * Lấy thông tin chi tiết một hóa đơn để hiển thị bản xem trước hoặc in A4.
     * @param orderId ID đơn hàng tương ứng
     * @return AdminInvoiceDto
     */
    public AdminInvoiceDto getInvoiceByOrderId(Long orderId) {
        if (orderId == null || orderId <= 0) {
            throw new IllegalArgumentException("ID đơn hàng không hợp lệ.");
        }
        AdminInvoiceDto inv = adminSalesRepository.findInvoiceByOrderId(orderId);
        if (inv == null) {
            throw new IllegalArgumentException("Không tìm thấy hóa đơn cho đơn hàng #" + orderId);
        }
        return inv;
    }

    /**
     * Cập nhật trạng thái thanh toán của hóa đơn.
     * @param orderId ID đơn hàng
     * @param req Trạng thái thanh toán mới
     * @return AdminInvoiceDto sau khi cập nhật
     */
    @Transactional
    public AdminInvoiceDto updateInvoicePayment(Long orderId, UpdateInvoicePaymentRequest req) {
        if (orderId == null || orderId <= 0) {
            throw new IllegalArgumentException("ID hóa đơn không hợp lệ.");
        }
        if (req == null || req.getPaymentStatus() == null || req.getPaymentStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái thanh toán không được để trống.");
        }

        adminSalesRepository.updateInvoicePayment(orderId, req.getPaymentStatus().trim(), req.getPaymentMethod());
        return getInvoiceByOrderId(orderId);
    }

    /**
     * Đánh dấu hóa đơn đã in ra giấy A4 biên bản nghiệm thu bàn giao.
     * @param orderId ID đơn hàng
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> markInvoicePrinted(Long orderId) {
        adminSalesRepository.markInvoicePrinted(orderId);
        return Map.of("message", "Đã đánh dấu in hóa đơn thành công.", "printed", true, "orderId", orderId);
    }

    // =========================================================================
    // 3. NGHIỆP VỤ KHUYẾN MÃI & MÃ GIẢM GIÁ VOUCHER
    // =========================================================================

    /**
     * Lấy toàn bộ danh sách voucher trong hệ thống kèm trạng thái duyệt.
     * @return Danh sách AdminVoucherDto
     */
    public List<AdminVoucherDto> getAllVouchers() {
        return adminSalesRepository.findAllVouchersForAdmin();
    }

    /**
     * Tạo mới voucher và chương trình ưu đãi nội thất.
     * @param dto Dữ liệu tạo voucher
     * @return AdminVoucherDto vừa tạo
     */
    @Transactional
    public Map<String, Object> createVoucher(AdminVoucherDto dto) {
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã voucher không được để trống.");
        }
        if (dto.getDiscountPercent() == null || dto.getDiscountPercent().doubleValue() <= 0) {
            throw new IllegalArgumentException("Tỷ lệ giảm giá phải lớn hơn 0%.");
        }
        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new IllegalArgumentException("Ngày bắt đầu và ngày kết thúc không được để trống.");
        }

        Long id = adminSalesRepository.createVoucher(dto);
        return Map.of("message", "Tạo voucher thành công!", "voucherId", id, "code", dto.getCode().toUpperCase());
    }

    /**
     * Phê duyệt voucher đưa vào hoạt động chính thức.
     * @param voucherId ID voucher
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> approveVoucher(Long voucherId) {
        boolean ok = adminSalesRepository.approveVoucher(voucherId);
        if (!ok) {
            throw new IllegalArgumentException("Không thể duyệt voucher ID #" + voucherId);
        }
        return Map.of("message", "Đã phê duyệt voucher thành công! Voucher hiện đã có mặt trong Kho Vouchers của khách hàng.", "status", "APPROVED");
    }

    /**
     * Cập nhật trạng thái voucher (Tạm dừng PAUSED hoặc kích hoạt lại ACTIVE).
     * @param voucherId ID voucher
     * @param status 'ACTIVE' hoặc 'PAUSED'
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> updateVoucherStatus(Long voucherId, String status) {
        adminSalesRepository.updateVoucherStatus(voucherId, status);
        return Map.of("message", "Đã cập nhật trạng thái voucher thành công.", "status", status);
    }

    /**
     * Xóa voucher nếu chưa có đơn hàng nào áp dụng.
     * @param voucherId ID voucher
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> deleteVoucher(Long voucherId) {
        int deleted = adminSalesRepository.deleteVoucher(voucherId);
        if (deleted <= 0) {
            throw new IllegalArgumentException("Không thể xóa voucher (voucher đang được áp dụng trong đơn hàng hoặc không tồn tại).");
        }
        return Map.of("message", "Đã xóa voucher thành công.");
    }

    // =========================================================================
    // 4. NGHIỆP VỤ ĐÁNH GIÁ SẢN PHẨM & CSKH
    // =========================================================================

    /**
     * Lấy toàn bộ danh sách đánh giá sản phẩm từ người dùng.
     * @return Danh sách AdminReviewDto
     */
    public List<AdminReviewDto> getAllReviews() {
        return adminSalesRepository.findAllReviewsForAdmin();
    }

    /**
     * Bật hoặc tắt trạng thái hiển thị của đánh giá ('APPROVED' <-> 'HIDDEN').
     * @param reviewId ID đánh giá
     * @return Map kết quả kèm trạng thái mới
     */
    @Transactional
    public Map<String, Object> toggleReviewStatus(Long reviewId) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("ID đánh giá không hợp lệ.");
        }
        String newStatus = adminSalesRepository.toggleReviewStatus(reviewId);
        String msg = "APPROVED".equalsIgnoreCase(newStatus)
            ? "Đã cho phép hiển thị đánh giá sản phẩm trên sàn bán lẻ!"
            : "Đã ẩn đánh giá sản phẩm.";
        return Map.of("message", msg, "status", newStatus, "reviewId", reviewId);
    }

    /**
     * Gửi phản hồi chính thức từ CSKH vào đánh giá của khách hàng.
     * @param reviewId ID đánh giá
     * @param req Nội dung phản hồi
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> replyToReview(Long reviewId, ReplyReviewRequest req) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("ID đánh giá không hợp lệ.");
        }
        if (req == null || req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung phản hồi không được để trống.");
        }

        String author = req.getAuthor() != null && !req.getAuthor().trim().isEmpty()
            ? req.getAuthor().trim()
            : "FurniStore Chăm Sóc Khách Hàng";

        adminSalesRepository.replyToReview(reviewId, author, req.getContent().trim());
        return Map.of(
            "message", "Đã gửi phản hồi đánh giá thành công!",
            "author", author,
            "content", req.getContent().trim(),
            "date", "Hôm nay"
        );
    }

    /**
     * Xóa vĩnh viễn một đánh giá khỏi hệ thống.
     * @param reviewId ID đánh giá
     * @return Map kết quả
     */
    @Transactional
    public Map<String, Object> deleteReview(Long reviewId) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("ID đánh giá không hợp lệ.");
        }
        int deleted = adminSalesRepository.deleteReview(reviewId);
        if (deleted <= 0) {
            throw new IllegalArgumentException("Không tìm thấy đánh giá để xóa.");
        }
        return Map.of("message", "Đã xóa vĩnh viễn đánh giá thành công.", "reviewId", reviewId);
    }
}
