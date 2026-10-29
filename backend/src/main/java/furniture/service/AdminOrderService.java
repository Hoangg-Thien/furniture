package furniture.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.PageResponse;
import furniture.model.admin.order.CancelOrderRequest;
import furniture.model.admin.order.ConfirmOrderRequest;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.order.OrderItemDto;
import furniture.model.admin.order.OrderStatusCountDto;
import furniture.model.admin.order.OrderSummaryDto;
import furniture.repository.AdminOrderRepository;

@Service
public class AdminOrderService {

    private final AdminOrderRepository adminOrderRepository;

    public AdminOrderService(AdminOrderRepository adminOrderRepository) {
        this.adminOrderRepository = adminOrderRepository;
    }

    public PageResponse<OrderSummaryDto> getOrders(
            String search,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {
        return adminOrderRepository.findOrders(search, status, fromDate, toDate, page, size);
    }

    public OrderDetailDto getOrderDetail(Long id) {
        OrderDetailDto detail = adminOrderRepository.findDetailById(id);
        if (detail == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng với mã ID: " + id);
        }
        return detail;
    }

    public OrderStatusCountDto getStatusCounts() {
        return adminOrderRepository.countByStatus();
    }

    @Transactional
    public void confirmOrder(Long orderId, ConfirmOrderRequest req) {
        OrderDetailDto order = getOrderDetail(orderId);

        if (!"PENDING".equalsIgnoreCase(order.status())) {
            throw new IllegalStateException("Chỉ đơn hàng ở trạng thái PENDING (Chờ xác nhận) mới có thể duyệt đơn!");
        }

        Long targetStaffId = req != null ? req.staffId() : null;
        if (targetStaffId == null || !adminOrderRepository.existsStaffById(targetStaffId)) {
            targetStaffId = adminOrderRepository.findFirstStaffId();
        }

        if (targetStaffId == null || !adminOrderRepository.existsStaffById(targetStaffId)) {
            throw new IllegalArgumentException("Không tìm thấy nhân viên phụ trách hợp lệ trong hệ thống. Vui lòng tạo nhân viên trong Quản lý Nhân Viên.");
        }

        adminOrderRepository.updateStatusAndStaff(orderId, "CONFIRMED", targetStaffId);
    }

    @Transactional
    public void cancelOrder(Long orderId, CancelOrderRequest req) {
        OrderDetailDto order = getOrderDetail(orderId);

        if ("COMPLETED".equalsIgnoreCase(order.status()) || "CANCELLED".equalsIgnoreCase(order.status())) {
            throw new IllegalStateException("Đơn hàng ở trạng thái " + order.status() + " là bất biến, không thể hủy!");
        }

        if (req.reason() == null || req.reason().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp lý do hủy đơn hàng");
        }

        // 1. Hoàn lại số lượng tồn kho cho các sản phẩm trong đơn
        List<OrderItemDto> items = order.items();
        if (items != null) {
            for (OrderItemDto item : items) {
                if (item.productId() != null && item.quantity() != null && item.quantity() > 0) {
                    adminOrderRepository.restoreProductStock(item.productId(), item.quantity());
                }
            }
        }

        // 2. Hoàn lại số lượt voucher nếu đơn có dùng
        Long voucherId = adminOrderRepository.findVoucherIdByOrderId(orderId);
        if (voucherId != null) {
            adminOrderRepository.restoreVoucherUsedQuantity(voucherId);
        }

        // 3. Cập nhật trạng thái CANCELLED
        adminOrderRepository.updateStatus(orderId, "CANCELLED");
    }

    @Transactional
    public void completeOrder(Long orderId) {
        OrderDetailDto order = getOrderDetail(orderId);

        if (!"CONFIRMED".equalsIgnoreCase(order.status())) {
            throw new IllegalStateException("Chỉ đơn hàng đã duyệt (CONFIRMED) mới có thể chuyển sang Hoàn thành (COMPLETED) sau khi giao lắp xong!");
        }

        adminOrderRepository.updateStatus(orderId, "COMPLETED");
    }
}
