package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.PageResponse;
import furniture.model.admin.order.CancelOrderRequest;
import furniture.model.admin.order.ConfirmOrderRequest;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.order.OrderItemDto;
import furniture.model.admin.order.OrderStatusCountDto;
import furniture.model.admin.order.OrderSummaryDto;
import furniture.repository.AdminOrderRepository;
import furniture.service.AdminOrderService;

@ExtendWith(MockitoExtension.class)
class AdminOrderServiceTest {

    @Mock
    private AdminOrderRepository adminOrderRepository;

    private AdminOrderService adminOrderService;

    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        adminOrderService = new AdminOrderService(adminOrderRepository);
    }

    @Test
    @DisplayName("TC01 - Lấy danh sách đơn hàng có phân trang & bộ lọc")
    void getOrders_ShouldReturnPage() {
        List<OrderSummaryDto> mockList = List.of(
                new OrderSummaryDto(101L, 1L, "Trần Văn Bình", "0988234567", now, null, null, new BigDecimal("28500000"), new BigDecimal("1500000"), "PENDING", 2, "SUMMER2026"),
                new OrderSummaryDto(100L, 2L, "Nguyễn Thị Lan", "0912345678", now.minusHours(2), 1L, "Thu Hà", new BigDecimal("16200000"), BigDecimal.ZERO, "CONFIRMED", 1, null)
        );
        PageResponse<OrderSummaryDto> mockPage = new PageResponse<>(mockList, 0, 10, 2L, 1);
        when(adminOrderRepository.findOrders(null, "ALL", null, null, 0, 10)).thenReturn(mockPage);

        PageResponse<OrderSummaryDto> result = adminOrderService.getOrders(null, "ALL", null, null, 0, 10);

        assertEquals(2, result.content().size());
        assertEquals(101L, result.content().get(0).id());
        assertEquals("PENDING", result.content().get(0).status());
    }

    @Test
    @DisplayName("TC02 - Xem chi tiết đơn hàng theo ID hợp lệ")
    void getOrderDetail_Success() {
        List<OrderItemDto> mockItems = List.of(
                new OrderItemDto(1L, "Sofa Da Ý", "/sofa.jpg", "bộ", 1, new BigDecimal("25000000"), new BigDecimal("25000000")),
                new OrderItemDto(2L, "Bàn Trà Kính", "/table.jpg", "cái", 1, new BigDecimal("5000000"), new BigDecimal("5000000"))
        );
        OrderDetailDto mockDetail = new OrderDetailDto(
                101L, 1L, "Trần Văn Bình", "0988234567", "Quận 1, TP.HCM",
                null, null, now, "PENDING",
                new BigDecimal("30000000"), "SUMMER2026", new BigDecimal("1500000"), new BigDecimal("28500000"),
                mockItems
        );
        when(adminOrderRepository.findDetailById(101L)).thenReturn(mockDetail);

        OrderDetailDto detail = adminOrderService.getOrderDetail(101L);

        assertNotNull(detail);
        assertEquals(101L, detail.id());
        assertEquals(2, detail.items().size());
        assertEquals(new BigDecimal("30000000"), detail.subtotal());
        assertEquals(new BigDecimal("28500000"), detail.finalTotal());
    }

    @Test
    @DisplayName("TC03 - Xem chi tiết đơn hàng không tồn tại phải ném ngoại lệ")
    void getOrderDetail_NotFound_ThrowsException() {
        when(adminOrderRepository.findDetailById(999L)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminOrderService.getOrderDetail(999L)
        );
        assertTrue(ex.getMessage().contains("Không tìm thấy đơn hàng"));
    }

    @Test
    @DisplayName("TC04 - Đếm số lượng đơn hàng theo từng trạng thái vòng đời")
    void getStatusCounts_Success() {
        OrderStatusCountDto mockCounts = new OrderStatusCountDto(150, 12, 24, 110, 4);
        when(adminOrderRepository.countByStatus()).thenReturn(mockCounts);

        OrderStatusCountDto counts = adminOrderService.getStatusCounts();

        assertEquals(150, counts.total());
        assertEquals(12, counts.pending());
        assertEquals(24, counts.confirmed());
        assertEquals(110, counts.completed());
        assertEquals(4, counts.cancelled());
    }

    @Test
    @DisplayName("TC05 - Duyệt đơn hàng PENDING và gán nhân viên phụ trách thành công")
    void confirmOrder_Success() {
        OrderDetailDto pendingOrder = new OrderDetailDto(
                101L, 1L, "Khách hàng", "0901", "HCM", null, null, now, "PENDING",
                new BigDecimal("10000000"), null, BigDecimal.ZERO, new BigDecimal("10000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(101L)).thenReturn(pendingOrder);
        when(adminOrderRepository.existsStaffById(2L)).thenReturn(true);

        ConfirmOrderRequest req = new ConfirmOrderRequest(2L, "Giao buổi sáng thứ 7");
        adminOrderService.confirmOrder(101L, req);

        verify(adminOrderRepository).updateStatusAndStaff(101L, "CONFIRMED", 2L);
    }

    @Test
    @DisplayName("TC06 - Duyệt đơn hàng không ở trạng thái PENDING phải ném ngoại lệ IllegalStateException")
    void confirmOrder_NotPending_ThrowsIllegalStateException() {
        OrderDetailDto confirmedOrder = new OrderDetailDto(
                102L, 1L, "Khách hàng", "0901", "HCM", 1L, "Thu Hà", now, "CONFIRMED",
                new BigDecimal("10000000"), null, BigDecimal.ZERO, new BigDecimal("10000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(102L)).thenReturn(confirmedOrder);

        ConfirmOrderRequest req = new ConfirmOrderRequest(2L, "Ghi chú");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminOrderService.confirmOrder(102L, req)
        );
        assertTrue(ex.getMessage().contains("Chỉ đơn hàng ở trạng thái PENDING"));
        verify(adminOrderRepository, never()).updateStatusAndStaff(anyLong(), any(), anyLong());
    }

    @Test
    @DisplayName("TC07 - Duyệt đơn hàng với nhân viên không tồn tại phải ném ngoại lệ")
    void confirmOrder_StaffNotFound_ThrowsIllegalArgumentException() {
        OrderDetailDto pendingOrder = new OrderDetailDto(
                101L, 1L, "Khách hàng", "0901", "HCM", null, null, now, "PENDING",
                new BigDecimal("10000000"), null, BigDecimal.ZERO, new BigDecimal("10000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(101L)).thenReturn(pendingOrder);
        when(adminOrderRepository.existsStaffById(999L)).thenReturn(false);

        ConfirmOrderRequest req = new ConfirmOrderRequest(999L, "Ghi chú");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminOrderService.confirmOrder(101L, req)
        );
        assertTrue(ex.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("TC08 - Hủy đơn hàng PENDING, tự động hoàn trả tồn kho và hoàn voucher")
    void cancelOrder_Success_RestoresStockAndVoucher() {
        List<OrderItemDto> items = List.of(
                new OrderItemDto(1L, "Sofa", null, "bộ", 2, new BigDecimal("10000000"), new BigDecimal("20000000")),
                new OrderItemDto(3L, "Bàn trà", null, "cái", 1, new BigDecimal("5000000"), new BigDecimal("5000000"))
        );
        OrderDetailDto order = new OrderDetailDto(
                101L, 1L, "Khách", "0901", "HCM", null, null, now, "PENDING",
                new BigDecimal("25000000"), "SALE500", new BigDecimal("500000"), new BigDecimal("24500000"), items
        );
        when(adminOrderRepository.findDetailById(101L)).thenReturn(order);
        when(adminOrderRepository.findVoucherIdByOrderId(101L)).thenReturn(5L);

        CancelOrderRequest req = new CancelOrderRequest("Khách hàng đổi ý mua mẫu khác");
        adminOrderService.cancelOrder(101L, req);

        // Verify stock restoration
        verify(adminOrderRepository).restoreProductStock(1L, 2);
        verify(adminOrderRepository).restoreProductStock(3L, 1);
        // Verify voucher restoration
        verify(adminOrderRepository).restoreVoucherUsedQuantity(5L);
        // Verify status update
        verify(adminOrderRepository).updateStatus(101L, "CANCELLED");
    }

    @Test
    @DisplayName("TC09 - Hủy đơn hàng đã COMPLETED phải chặn và ném ngoại lệ bất biến")
    void cancelOrder_AlreadyCompleted_ThrowsIllegalStateException() {
        OrderDetailDto completedOrder = new OrderDetailDto(
                103L, 1L, "Khách", "0901", "HCM", 1L, "Staff", now, "COMPLETED",
                new BigDecimal("20000000"), null, BigDecimal.ZERO, new BigDecimal("20000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(103L)).thenReturn(completedOrder);

        CancelOrderRequest req = new CancelOrderRequest("Lý do");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminOrderService.cancelOrder(103L, req)
        );
        assertTrue(ex.getMessage().contains("là bất biến, không thể hủy"));
        verify(adminOrderRepository, never()).updateStatus(anyLong(), any());
    }

    @Test
    @DisplayName("TC10 - Hoàn tất giao lắp đơn hàng CONFIRMED thành công")
    void completeOrder_Success() {
        OrderDetailDto confirmedOrder = new OrderDetailDto(
                105L, 1L, "Khách", "0901", "HCM", 2L, "Staff", now, "CONFIRMED",
                new BigDecimal("15000000"), null, BigDecimal.ZERO, new BigDecimal("15000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(105L)).thenReturn(confirmedOrder);

        adminOrderService.completeOrder(105L);

        verify(adminOrderRepository).updateStatus(105L, "COMPLETED");
    }

    @Test
    @DisplayName("TC11 - Hoàn tất đơn hàng khi chưa duyệt (PENDING) phải ném ngoại lệ")
    void completeOrder_NotConfirmed_ThrowsIllegalStateException() {
        OrderDetailDto pendingOrder = new OrderDetailDto(
                106L, 1L, "Khách", "0901", "HCM", null, null, now, "PENDING",
                new BigDecimal("15000000"), null, BigDecimal.ZERO, new BigDecimal("15000000"), List.of()
        );
        when(adminOrderRepository.findDetailById(106L)).thenReturn(pendingOrder);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminOrderService.completeOrder(106L)
        );
        assertTrue(ex.getMessage().contains("Chỉ đơn hàng đã duyệt"));
        verify(adminOrderRepository, never()).updateStatus(anyLong(), any());
    }
}
