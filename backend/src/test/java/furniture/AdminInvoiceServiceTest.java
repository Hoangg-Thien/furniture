package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.PageResponse;
import furniture.model.admin.invoice.CreateInvoiceRequest;
import furniture.model.admin.invoice.EligibleOrderDto;
import furniture.model.admin.invoice.InvoiceCalculationDto;
import furniture.model.admin.invoice.InvoiceDetailDto;
import furniture.model.admin.invoice.InvoiceItemDto;
import furniture.model.admin.invoice.InvoiceStatusCountDto;
import furniture.model.admin.invoice.InvoiceSummaryDto;
import furniture.model.admin.invoice.PreviewInvoiceRequest;
import furniture.model.admin.order.OrderDetailDto;
import furniture.model.admin.promotion.VoucherDto;
import furniture.repository.AdminInvoiceRepository;
import furniture.repository.AdminOrderRepository;
import furniture.repository.AdminStaffRepository;
import furniture.service.AdminInvoiceService;

@ExtendWith(MockitoExtension.class)
class AdminInvoiceServiceTest {

    @Mock
    private AdminInvoiceRepository adminInvoiceRepository;

    @Mock
    private AdminOrderRepository adminOrderRepository;

    @Mock
    private AdminStaffRepository adminStaffRepository;

    private AdminInvoiceService adminInvoiceService;

    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        adminInvoiceService = new AdminInvoiceService(
                adminInvoiceRepository,
                adminOrderRepository,
                adminStaffRepository
        );
    }

    @Test
    @DisplayName("TC01 - Lấy danh sách hóa đơn phân trang & bộ lọc")
    void getInvoices_ShouldReturnPage() {
        List<InvoiceSummaryDto> mockList = List.of(
                new InvoiceSummaryDto(1L, "HD-20261027-001", 100L, 2L, "Nguyễn Thị Lan", "0912345678",
                        now, "BANK_TRANSFER", "PAID", new BigDecimal("18000000"), BigDecimal.ZERO,
                        new BigDecimal("1800000"), new BigDecimal("1296000"), new BigDecimal("17496000"),
                        "VIP10", 1L, "Hoàng Minh Đức")
        );
        PageResponse<InvoiceSummaryDto> page = new PageResponse<>(mockList, 0, 10, 1L, 1);
        when(adminInvoiceRepository.findInvoices(null, "ALL", "ALL", null, null, 0, 10)).thenReturn(page);

        PageResponse<InvoiceSummaryDto> res = adminInvoiceService.getInvoices(null, "ALL", "ALL", null, null, 0, 10);
        assertNotNull(res);
        assertEquals(1, res.content().size());
        assertEquals("HD-20261027-001", res.content().get(0).invoiceCode());
    }

    @Test
    @DisplayName("TC02 - Thống kê số lượng và doanh thu hóa đơn")
    void getStatusCounts_ShouldReturnStats() {
        InvoiceStatusCountDto stats = new InvoiceStatusCountDto(
                50L, new BigDecimal("450000000"), 15L, 25L, 8L, 2L, 48L, 2L
        );
        when(adminInvoiceRepository.countStats()).thenReturn(stats);

        InvoiceStatusCountDto res = adminInvoiceService.getStatusCounts();
        assertNotNull(res);
        assertEquals(50L, res.total());
        assertEquals(new BigDecimal("450000000"), res.totalRevenue());
    }

    @Test
    @DisplayName("TC03 - Lấy danh sách đơn hàng đủ điều kiện xuất hóa đơn")
    void getEligibleOrders_ShouldReturnList() {
        List<EligibleOrderDto> mockList = List.of(
                new EligibleOrderDto(105L, "Lê Hoàng Nam", "0933112233", now, "CONFIRMED", new BigDecimal("45000000"), 5)
        );
        when(adminInvoiceRepository.findEligibleOrders()).thenReturn(mockList);

        List<EligibleOrderDto> res = adminInvoiceService.getEligibleOrders();
        assertEquals(1, res.size());
        assertEquals(105L, res.get(0).orderId());
    }

    @Test
    @DisplayName("TC04 - Xem chi tiết hóa đơn theo ID")
    void getInvoiceDetail_ShouldReturnDto() {
        InvoiceDetailDto detail = new InvoiceDetailDto(
                1L, "HD-20261027-001", 100L, 2L, "Nguyễn Thị Lan", "0912345678", "123 Đường Nội Thất", "lan@example.com",
                1L, "Hoàng Minh Đức", now, "BANK_TRANSFER", "PAID",
                new BigDecimal("18000000"), BigDecimal.ZERO, "VIP10", new BigDecimal("1800000"),
                BigDecimal.ZERO, new BigDecimal("16200000"), "Giao buổi sáng",
                List.of(new InvoiceItemDto(1L, "Sofa Da", "", "bộ", 1, new BigDecimal("18000000"), new BigDecimal("18000000"))),
                "https://img.vietqr.io"
        );
        when(adminInvoiceRepository.findDetailById(1L)).thenReturn(detail);

        InvoiceDetailDto res = adminInvoiceService.getInvoiceDetail(1L);
        assertNotNull(res);
        assertEquals("HD-20261027-001", res.invoiceCode());
        assertEquals(1, res.items().size());
    }

    @Test
    @DisplayName("TC05 - Xem trước tính tiền với Voucher hợp lệ và VAT 8%")
    void previewCalculation_WithValidVoucherAndVat() {
        OrderDetailDto order = new OrderDetailDto(
                100L, 2L, "Nguyễn Thị Lan", "0912345678", "Địa chỉ",
                1L, "Thu ngân", now, "CONFIRMED",
                new BigDecimal("20000000"), null, BigDecimal.ZERO, new BigDecimal("20000000"),
                List.of()
        );
        when(adminOrderRepository.findDetailById(100L)).thenReturn(order);

        VoucherDto voucher = new VoucherDto(
                10L, 1L, "KM Hè", "SUMMER10",
                new BigDecimal("10.00"), new BigDecimal("5000000"), new BigDecimal("3000000"),
                100, 10, 90, now.minusDays(5), now.plusDays(5), "ACTIVE", false
        );
        when(adminInvoiceRepository.findVoucherByCode("SUMMER10")).thenReturn(Optional.of(voucher));

        PreviewInvoiceRequest req = new PreviewInvoiceRequest(100L, "SUMMER10", true, new BigDecimal("8.0"));
        InvoiceCalculationDto calc = adminInvoiceService.previewCalculation(req);

        assertNotNull(calc);
        assertTrue(calc.voucherValid());
        // 20,000,000 * 10% = 2,000,000 <= 3,000,000 max
        assertEquals(new BigDecimal("2000000.00"), calc.voucherDiscount());
        // After voucher: 18,000,000. VAT 8% = 1,440,000
        assertEquals(new BigDecimal("1440000.00"), calc.vatAmount());
        // Final: 18,000,000 + 1,440,000 = 19,440,000
        assertEquals(new BigDecimal("19440000.00"), calc.finalAmount());
    }

    @Test
    @DisplayName("TC06 - Xem trước tính tiền với Voucher hết hạn")
    void previewCalculation_WithExpiredVoucher() {
        OrderDetailDto order = new OrderDetailDto(
                100L, 2L, "Nguyễn Thị Lan", "0912345678", "Địa chỉ",
                1L, "Thu ngân", now, "CONFIRMED",
                new BigDecimal("20000000"), null, BigDecimal.ZERO, new BigDecimal("20000000"),
                List.of()
        );
        when(adminOrderRepository.findDetailById(100L)).thenReturn(order);

        VoucherDto voucher = new VoucherDto(
                10L, 1L, "KM Hè", "EXPIREDVOUCHER",
                new BigDecimal("10.00"), new BigDecimal("5000000"), new BigDecimal("3000000"),
                100, 10, 90, now.minusDays(15), now.minusDays(5), "ACTIVE", true
        );
        when(adminInvoiceRepository.findVoucherByCode("EXPIREDVOUCHER")).thenReturn(Optional.of(voucher));

        PreviewInvoiceRequest req = new PreviewInvoiceRequest(100L, "EXPIREDVOUCHER", false, null);
        InvoiceCalculationDto calc = adminInvoiceService.previewCalculation(req);

        assertNotNull(calc);
        assertFalse(calc.voucherValid());
        assertEquals(BigDecimal.ZERO, calc.voucherDiscount());
        assertEquals(new BigDecimal("20000000"), calc.finalAmount());
    }

    @Test
    @DisplayName("TC07 - Từ chối khi xuất hóa đơn lần thứ hai cho cùng một đơn hàng")
    void createInvoice_ThrowsException_WhenOrderAlreadyInvoiced() {
        when(adminInvoiceRepository.existsByOrderId(100L)).thenReturn(true);

        CreateInvoiceRequest req = new CreateInvoiceRequest(
                100L, "CASH", null, false, null, null, null
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminInvoiceService.createInvoice(req, 1L));

        assertEquals("Đơn hàng này đã được xuất hóa đơn trước đó!", ex.getMessage());
    }

    @Test
    @DisplayName("TC08 - Áp dụng mức trần giảm giá maximum_discount khi chiết khấu tính ra vượt trần")
    void createInvoice_CapsDiscount_AtMaximumDiscount() {
        when(adminInvoiceRepository.existsByOrderId(100L)).thenReturn(false);

        OrderDetailDto order = new OrderDetailDto(
                100L, 2L, "Lê Hoàng Nam", "0933112233", "Địa chỉ",
                1L, "Thu ngân", now, "CONFIRMED",
                new BigDecimal("50000000"), null, BigDecimal.ZERO, new BigDecimal("50000000"),
                List.of()
        );
        when(adminOrderRepository.findDetailById(100L)).thenReturn(order);

        // Voucher giảm 20% nhưng trần tối đa là 3,000,000
        // Đơn 50,000,000 * 20% = 10,000,000 > 3,000,000 => Chỉ được giảm đúng 3,000,000
        VoucherDto voucher = new VoucherDto(
                10L, 1L, "KM Trần", "MAXCAP20",
                new BigDecimal("20.00"), new BigDecimal("10000000"), new BigDecimal("3000000"),
                100, 5, 95, now.minusDays(1), now.plusDays(10), "ACTIVE", false
        );
        when(adminInvoiceRepository.findVoucherByCode("MAXCAP20")).thenReturn(Optional.of(voucher));

        when(adminInvoiceRepository.insertInvoice(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(10L);

        InvoiceDetailDto createdDetail = new InvoiceDetailDto(
                10L, "HD-20261028-0001", 100L, 2L, "Lê Hoàng Nam", "0933112233", "Địa chỉ", "",
                1L, "Thu ngân", now, "BANK_TRANSFER", "PAID",
                new BigDecimal("50000000"), BigDecimal.ZERO, "MAXCAP20", new BigDecimal("3000000"),
                BigDecimal.ZERO, new BigDecimal("47000000"), null, List.of(), ""
        );
        when(adminInvoiceRepository.findDetailById(10L)).thenReturn(createdDetail);

        CreateInvoiceRequest req = new CreateInvoiceRequest(
                100L, "BANK_TRANSFER", "MAXCAP20", false, null, 1L, "Đã cọc trước"
        );

        InvoiceDetailDto result = adminInvoiceService.createInvoice(req, 1L);
        assertNotNull(result);
        assertEquals(new BigDecimal("3000000"), result.voucherDiscount());
        assertEquals(new BigDecimal("47000000"), result.finalAmount());

        verify(adminInvoiceRepository).incrementVoucherUsedQuantity(10L);
        verify(adminOrderRepository).updateStatusAndStaff(100L, "COMPLETED", 1L);
    }

    @Test
    @DisplayName("TC09 - Không thể xuất hóa đơn cho đơn hàng đã bị hủy")
    void createInvoice_ThrowsException_WhenOrderCancelled() {
        when(adminInvoiceRepository.existsByOrderId(100L)).thenReturn(false);

        OrderDetailDto cancelledOrder = new OrderDetailDto(
                100L, 2L, "Khách", "0900000000", "Địa chỉ",
                1L, "Thu ngân", now, "CANCELLED",
                new BigDecimal("10000000"), null, BigDecimal.ZERO, new BigDecimal("10000000"),
                List.of()
        );
        when(adminOrderRepository.findDetailById(100L)).thenReturn(cancelledOrder);

        CreateInvoiceRequest req = new CreateInvoiceRequest(
                100L, "CASH", null, false, null, null, null
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminInvoiceService.createInvoice(req, 1L));

        assertTrue(ex.getMessage().contains("đã hủy"));
    }

    @Test
    @DisplayName("TC10 - Xuất hóa đơn thành công và tạo mã VietQR")
    void createInvoice_Success() {
        when(adminInvoiceRepository.existsByOrderId(101L)).thenReturn(false);

        OrderDetailDto order = new OrderDetailDto(
                101L, 3L, "Phạm Minh Tuấn", "0911223344", "Hồ Chí Minh",
                null, null, now, "PENDING",
                new BigDecimal("15000000"), null, BigDecimal.ZERO, new BigDecimal("15000000"),
                List.of()
        );
        when(adminOrderRepository.findDetailById(101L)).thenReturn(order);

        when(adminInvoiceRepository.insertInvoice(
                anyString(), eq(101L), eq(3L), any(),
                eq(new BigDecimal("15000000")), eq(BigDecimal.ZERO),
                eq(null), eq(BigDecimal.ZERO),
                eq(BigDecimal.ZERO), eq(new BigDecimal("15000000")),
                eq("CASH"), eq("PAID"), any()
        )).thenReturn(11L);

        InvoiceDetailDto createdDetail = new InvoiceDetailDto(
                11L, "HD-20261028-0002", 101L, 3L, "Phạm Minh Tuấn", "0911223344", "Hồ Chí Minh", "",
                null, null, now, "CASH", "PAID",
                new BigDecimal("15000000"), BigDecimal.ZERO, null, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("15000000"), null, List.of(), ""
        );
        when(adminInvoiceRepository.findDetailById(11L)).thenReturn(createdDetail);

        CreateInvoiceRequest req = new CreateInvoiceRequest(
                101L, "CASH", null, false, null, null, null
        );

        InvoiceDetailDto result = adminInvoiceService.createInvoice(req, null);
        assertNotNull(result);
        assertEquals(11L, result.id());
        verify(adminOrderRepository).updateStatusAndStaff(101L, "COMPLETED", 1L);
    }

    @Test
    @DisplayName("TC11 - Xuất PDF hóa đơn hợp lệ chuẩn %PDF-1.4")
    void generatePdfBytes_ShouldReturnValidPdf() {
        InvoiceDetailDto invoice = new InvoiceDetailDto(
                1L, "HD-20261027-001", 100L, 2L, "Nguyễn Thị Lan", "0912345678", "123 Đường Nội Thất", "lan@example.com",
                1L, "Hoàng Minh Đức", now, "BANK_TRANSFER", "PAID",
                new BigDecimal("18000000"), BigDecimal.ZERO, "VIP10", new BigDecimal("1800000"),
                new BigDecimal("1296000"), new BigDecimal("17496000"), "Ghi chú",
                List.of(
                        new InvoiceItemDto(1L, "Sofa Da Bò Ý Cao Cấp", "", "bộ", 1, new BigDecimal("18000000"), new BigDecimal("18000000"))
                ),
                "https://img.vietqr.io"
        );
        when(adminInvoiceRepository.findDetailById(1L)).thenReturn(invoice);

        byte[] pdfBytes = adminInvoiceService.generatePdfBytes(1L);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        String pdfString = new String(pdfBytes, 0, Math.min(pdfBytes.length, 50));
        assertTrue(pdfString.startsWith("%PDF-1.4"), "File PDF phải bắt đầu bằng tiêu đề %PDF-1.4");
    }
}
