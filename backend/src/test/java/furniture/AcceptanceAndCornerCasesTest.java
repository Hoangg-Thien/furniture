package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import furniture.model.admin.invoice.CreateInvoiceRequest;
import furniture.model.admin.invoice.InvoiceCalculationDto;
import furniture.model.admin.invoice.PreviewInvoiceRequest;
import furniture.model.admin.order.CancelOrderRequest;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.order.OrderItemDto;
import furniture.model.admin.promotion.VoucherDto;
import furniture.repository.AdminCategoryRepository;
import furniture.repository.AdminInvoiceRepository;
import furniture.repository.AdminOrderRepository;
import furniture.repository.AdminProductRepository;
import furniture.repository.AdminStaffRepository;
import furniture.repository.AdminUserRepository;
import furniture.service.AdminCategoryService;
import furniture.service.AdminInvoiceService;
import furniture.service.AdminOrderService;
import furniture.service.AdminProductService;
import furniture.service.AdminUserService;

/**
 * BỘ TEST CASES NGHIỆM THU THEN CHỐT THEO TÀI LIỆU 12:
 * "TÀI LIỆU 12: LỘ TRÌNH TRIỂN KHAI VÀ KẾ HOẠCH KIỂM THỬ"
 * (Mục 3: Bảng kịch bản kiểm thử góc then chốt - TC01 đến TC08)
 */
@ExtendWith(MockitoExtension.class)
class AcceptanceAndCornerCasesTest {

    // TC01: User Service
    @Mock private AdminUserRepository adminUserRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    // TC02: Category Service
    @Mock private AdminCategoryRepository adminCategoryRepository;

    // TC03: Product Service
    @Mock private AdminProductRepository adminProductRepository;

    // TC06: Order Service
    @Mock private AdminOrderRepository adminOrderRepository;

    // TC04, TC05, TC07, TC08: Invoice Service
    @Mock private AdminInvoiceRepository adminInvoiceRepository;
    @Mock private AdminStaffRepository adminStaffRepository;

    private final LocalDateTime now = LocalDateTime.now();

    @Test
    @DisplayName("TC01 - Admin thử vô hiệu hóa chính tài khoản của mình -> Chặn với lỗi 'Không được phép tự vô hiệu hóa tài khoản của chính mình!'")
    void testTC01_AdminCannotDisableOwnAccount() {
        AdminUserService userService = new AdminUserService(adminUserRepository, jdbcTemplate);
        Long currentAdminId = 1L;
        Long targetUserId = 1L;

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                userService.toggleActiveStatus(targetUserId, currentAdminId)
        );

        assertTrue(ex.getMessage().contains("Không được phép tự vô hiệu hóa tài khoản của chính mình!"));
        verify(adminUserRepository, never()).updateActiveStatus(anyLong(), any(Boolean.class));
    }

    @Test
    @DisplayName("TC02 - Xóa danh mục đang có sản phẩm trong kho -> Chặn với lỗi 'Không thể xóa loại nội thất đang có ... sản phẩm trong kho'")
    void testTC02_CannotDeleteCategoryWithProducts() {
        AdminCategoryService categoryService = new AdminCategoryService(adminCategoryRepository);
        Long categoryId = 4L;

        when(adminCategoryRepository.existsById(categoryId)).thenReturn(true);
        when(adminCategoryRepository.countProductsByCategoryId(categoryId)).thenReturn(12L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                categoryService.deleteCategory(categoryId)
        );

        assertTrue(ex.getMessage().contains("Không thể xóa loại nội thất đang có 12 sản phẩm trong kho!"));
        verify(adminCategoryRepository, never()).deleteCategory(anyLong());
    }

    @Test
    @DisplayName("TC03 - Đặt ảnh làm ảnh chính (Primary) -> Cập nhật is_primary = true và cập nhật products.image_url")
    void testTC03_SetPrimaryProductImageUpdatesProductAndGallery() {
        AdminProductService productService = new AdminProductService(adminProductRepository, adminCategoryRepository, null);
        Long productId = 100L;
        Long imageId = 3L;

        when(adminProductRepository.existsById(productId)).thenReturn(true);

        productService.setPrimaryImage(productId, imageId);

        verify(adminProductRepository).setPrimaryImage(productId, imageId);
    }

    @Test
    @DisplayName("TC04 - Áp dụng Voucher đã đạt số lượng tối đa (used_quantity >= quantity) -> Báo lỗi 'Mã voucher đã hết lượt sử dụng!'")
    void testTC04_CannotApplyVoucherExceedingQuantity() {
        AdminInvoiceService invoiceService = new AdminInvoiceService(adminInvoiceRepository, adminOrderRepository, adminStaffRepository);

        OrderDetailDto order = new OrderDetailDto(
                101L, 1L, "Nguyễn Văn A", "0901234567", "Hà Nội",
                null, null, now, "CONFIRMED",
                new BigDecimal("15000000"), null, BigDecimal.ZERO, new BigDecimal("15000000"),
                List.of()
        );

        VoucherDto fullVoucher = new VoucherDto(
                10L, 1L, "Chương trình Tri Ân", "VOUCHERFULL",
                new BigDecimal("10"), new BigDecimal("5000000"), new BigDecimal("2000000"),
                50, 50, 0, now.minusDays(5), now.plusDays(5), "ACTIVE", false // usedQuantity == quantity
        );

        when(adminOrderRepository.findDetailById(101L)).thenReturn(order);
        when(adminInvoiceRepository.findVoucherByCode("VOUCHERFULL")).thenReturn(Optional.of(fullVoucher));

        PreviewInvoiceRequest previewReq = new PreviewInvoiceRequest(101L, "VOUCHERFULL", false, null);
        InvoiceCalculationDto calc = invoiceService.previewCalculation(previewReq);

        assertTrue(calc.voucherMessage().contains("Mã voucher đã hết lượt sử dụng!"));
        assertEquals(BigDecimal.ZERO, calc.voucherDiscount());

        CreateInvoiceRequest createReq = new CreateInvoiceRequest(101L, "BANK_TRANSFER", "VOUCHERFULL", false, null, 1L, "Ghi chú");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invoiceService.createInvoice(createReq, 1L)
        );
        assertTrue(ex.getMessage().contains("Mã voucher đã hết lượt sử dụng!"));
    }

    @Test
    @DisplayName("TC05 - Đơn hàng chưa đạt mức tối thiểu dùng voucher -> Báo lỗi 'Giá trị đơn hàng ... chưa đạt mức tối thiểu ... để dùng voucher!'")
    void testTC05_CannotApplyVoucherBelowMinimumOrderAmount() {
        AdminInvoiceService invoiceService = new AdminInvoiceService(adminInvoiceRepository, adminOrderRepository, adminStaffRepository);

        OrderDetailDto order = new OrderDetailDto(
                102L, 1L, "Trần Thị B", "0912345678", "Đà Nẵng",
                null, null, now, "CONFIRMED",
                new BigDecimal("5000000"), null, BigDecimal.ZERO, new BigDecimal("5000000"), // Đơn 5.000.000đ
                List.of()
        );

        VoucherDto minOrderVoucher = new VoucherDto(
                11L, 1L, "Voucher Đơn Lớn", "VIP10M",
                new BigDecimal("15"), new BigDecimal("10000000"), new BigDecimal("3000000"), // Tối thiểu 10.000.000đ
                100, 10, 90, now.minusDays(5), now.plusDays(5), "ACTIVE", false
        );

        when(adminOrderRepository.findDetailById(102L)).thenReturn(order);
        when(adminInvoiceRepository.findVoucherByCode("VIP10M")).thenReturn(Optional.of(minOrderVoucher));

        PreviewInvoiceRequest previewReq = new PreviewInvoiceRequest(102L, "VIP10M", false, null);
        InvoiceCalculationDto calc = invoiceService.previewCalculation(previewReq);

        assertTrue(calc.voucherMessage().contains("chưa đạt mức tối thiểu"));
        assertEquals(BigDecimal.ZERO, calc.voucherDiscount());
    }

    @Test
    @DisplayName("TC06 - Hủy đơn đặt hàng -> Tự động hoàn tồn kho cho từng sản phẩm và hoàn lại lượt voucher")
    void testTC06_CancelOrderRestoresStockAndVoucher() {
        AdminOrderService orderService = new AdminOrderService(adminOrderRepository);
        Long orderId = 200L;

        List<OrderItemDto> items = List.of(
                new OrderItemDto(10L, "Bộ Bàn Ăn Gỗ Sồi 6 Ghế", "img.jpg", "Bộ", 2, new BigDecimal("7000000"), new BigDecimal("14000000"))
        );

        OrderDetailDto order = new OrderDetailDto(
                orderId, 2L, "Lê Văn C", "0988776655", "Hồ Chí Minh",
                null, null, now, "CONFIRMED",
                new BigDecimal("14000000"), null, BigDecimal.ZERO, new BigDecimal("14000000"),
                items
        );

        when(adminOrderRepository.findDetailById(orderId)).thenReturn(order);
        when(adminOrderRepository.findVoucherIdByOrderId(orderId)).thenReturn(55L);

        CancelOrderRequest cancelReq = new CancelOrderRequest("Khách hàng đổi ý, yêu cầu hủy đơn");
        orderService.cancelOrder(orderId, cancelReq);

        // 1. Phải hoàn lại 2 bộ tồn kho cho sản phẩm #10
        verify(adminOrderRepository).restoreProductStock(10L, 2);
        // 2. Phải hoàn lại lượt dùng cho voucher #55
        verify(adminOrderRepository).restoreVoucherUsedQuantity(55L);
        // 3. Phải cập nhật trạng thái đơn thành CANCELLED
        verify(adminOrderRepository).updateStatus(orderId, "CANCELLED");
    }

    @Test
    @DisplayName("TC07 - Xuất hóa đơn lần thứ hai cho cùng 1 đơn hàng -> Chặn với lỗi 'Đơn hàng này đã được xuất hóa đơn trước đó!'")
    void testTC07_CannotCreateDuplicateInvoiceForOrder() {
        AdminInvoiceService invoiceService = new AdminInvoiceService(adminInvoiceRepository, adminOrderRepository, adminStaffRepository);
        Long orderId = 300L;

        when(adminInvoiceRepository.existsByOrderId(orderId)).thenReturn(true);

        CreateInvoiceRequest req = new CreateInvoiceRequest(orderId, "BANK_TRANSFER", null, false, null, 1L, "Xuất lần 2");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invoiceService.createInvoice(req, 1L)
        );

        assertTrue(ex.getMessage().contains("Đơn hàng này đã được xuất hóa đơn trước đó!"));
        verify(adminInvoiceRepository, never()).insertInvoice(anyString(), anyLong(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("TC08 - Tính chiết khấu hóa đơn vượt trần maximum_discount -> Áp đúng số tiền trần tối đa (VD: giảm 20% đơn 50tr = 10tr, trần 3tr -> giảm 3tr)")
    void testTC08_InvoiceDiscountCappedAtMaximumDiscount() {
        AdminInvoiceService invoiceService = new AdminInvoiceService(adminInvoiceRepository, adminOrderRepository, adminStaffRepository);
        Long orderId = 400L;

        OrderDetailDto order = new OrderDetailDto(
                orderId, 1L, "Đại gia Nội Thất", "0909999999", "Biệt thự Ecopark",
                null, null, now, "CONFIRMED",
                new BigDecimal("50000000"), null, BigDecimal.ZERO, new BigDecimal("50000000"), // Đơn 50 triệu
                List.of()
        );

        // Voucher giảm 20%, trần tối đa 3.000.000đ (20% của 50tr là 10tr, vượt trần 3tr)
        VoucherDto capVoucher = new VoucherDto(
                22L, 1L, "Giảm 20% Tối Đa 3 Triệu", "GIAM20TR3TR",
                new BigDecimal("20"), BigDecimal.ZERO, new BigDecimal("3000000"), // maximum_discount = 3.000.000đ
                100, 5, 95, now.minusDays(2), now.plusDays(10), "ACTIVE", false
        );

        when(adminOrderRepository.findDetailById(orderId)).thenReturn(order);
        when(adminInvoiceRepository.findVoucherByCode("GIAM20TR3TR")).thenReturn(Optional.of(capVoucher));

        PreviewInvoiceRequest previewReq = new PreviewInvoiceRequest(orderId, "GIAM20TR3TR", false, null);
        InvoiceCalculationDto calc = invoiceService.previewCalculation(previewReq);

        // Kỳ vọng voucherDiscount được áp đúng bằng 3.000.000đ thay vì 10.000.000đ
        assertEquals(0, new BigDecimal("3000000").compareTo(calc.voucherDiscount()));
        assertEquals(0, new BigDecimal("47000000").compareTo(calc.finalAmount()));
    }
}
