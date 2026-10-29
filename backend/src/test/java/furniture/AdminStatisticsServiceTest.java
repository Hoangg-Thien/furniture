package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.statistics.CategoryRevenueDto;
import furniture.model.admin.statistics.DailyRevenuePointDto;
import furniture.model.admin.statistics.DashboardOverviewDto;
import furniture.model.admin.statistics.DeadStockProductDto;
import furniture.model.admin.statistics.TopProductDto;
import furniture.model.admin.statistics.VoucherReportDto;
import furniture.repository.AdminStatisticsRepository;
import furniture.service.AdminStatisticsService;

@ExtendWith(MockitoExtension.class)
class AdminStatisticsServiceTest {

    @Mock
    private AdminStatisticsRepository adminStatisticsRepository;

    private AdminStatisticsService adminStatisticsService;

    @BeforeEach
    void setUp() {
        adminStatisticsService = new AdminStatisticsService(adminStatisticsRepository);
    }

    @Test
    @DisplayName("getOverview returns populated DashboardOverviewDto")
    void testGetOverview() {
        LocalDate fromDate = LocalDate.now().minusDays(30);
        LocalDate toDate = LocalDate.now();

        DashboardOverviewDto mockDto = new DashboardOverviewDto(
                new BigDecimal("50000000"),
                12.5,
                45L,
                95.0,
                120L,
                3L,
                80L,
                new BigDecimal("30000000"),
                new BigDecimal("20000000")
        );

        when(adminStatisticsRepository.getOverview(fromDate, toDate)).thenReturn(mockDto);

        DashboardOverviewDto result = adminStatisticsService.getOverview(fromDate, toDate);

        assertNotNull(result);
        assertEquals(new BigDecimal("50000000"), result.totalRevenue());
        assertEquals(new BigDecimal("30000000"), result.totalPurchaseCost());
        assertEquals(new BigDecimal("20000000"), result.grossProfit());
        assertEquals(45L, result.completedOrdersCount());
        assertEquals(120L, result.totalItemsSold());
        assertEquals(3L, result.lowStockProductsCount());
        verify(adminStatisticsRepository).getOverview(fromDate, toDate);
    }

    @Test
    @DisplayName("getDailyRevenueTrend returns list of DailyRevenuePointDto")
    void testGetDailyRevenueTrend() {
        LocalDate fromDate = LocalDate.now().minusDays(7);
        LocalDate toDate = LocalDate.now();

        List<DailyRevenuePointDto> points = List.of(
                new DailyRevenuePointDto(fromDate.toString(), new BigDecimal("10000000"), new BigDecimal("6000000"), 5L),
                new DailyRevenuePointDto(toDate.toString(), new BigDecimal("15000000"), new BigDecimal("9000000"), 8L)
        );

        when(adminStatisticsRepository.getDailyRevenueTrend(fromDate, toDate)).thenReturn(points);

        List<DailyRevenuePointDto> result = adminStatisticsService.getDailyRevenueTrend(fromDate, toDate);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(new BigDecimal("10000000"), result.get(0).salesRevenue());
        verify(adminStatisticsRepository).getDailyRevenueTrend(fromDate, toDate);
    }

    @Test
    @DisplayName("getCategoryRevenueShare returns category breakdown")
    void testGetCategoryRevenueShare() {
        LocalDate fromDate = LocalDate.now().minusDays(30);
        LocalDate toDate = LocalDate.now();

        List<CategoryRevenueDto> categories = List.of(
                new CategoryRevenueDto(1L, "Sofa & Ghế", new BigDecimal("30000000"), 50L, 60.0),
                new CategoryRevenueDto(2L, "Bàn trà", new BigDecimal("20000000"), 30L, 40.0)
        );

        when(adminStatisticsRepository.getCategoryRevenueShare(fromDate, toDate)).thenReturn(categories);

        List<CategoryRevenueDto> result = adminStatisticsService.getCategoryRevenueShare(fromDate, toDate);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Sofa & Ghế", result.get(0).categoryName());
        assertEquals(60.0, result.get(0).percentage());
        verify(adminStatisticsRepository).getCategoryRevenueShare(fromDate, toDate);
    }

    @Test
    @DisplayName("getTopSellingProducts returns top performers")
    void testGetTopSellingProducts() {
        List<TopProductDto> topList = List.of(
                new TopProductDto(10L, "Sofa Da Thật Văng 3 Chỗ", "http://img.jpg", "Chiếc", 25L, new BigDecimal("375000000"), 10),
                new TopProductDto(12L, "Bàn Ăn Gỗ Sồi 6 Ghế", "http://img2.jpg", "Bộ", 18L, new BigDecimal("153000000"), 5)
        );

        when(adminStatisticsRepository.getTopSellingProducts(5)).thenReturn(topList);

        List<TopProductDto> result = adminStatisticsService.getTopSellingProducts(5);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Sofa Da Thật Văng 3 Chỗ", result.get(0).productName());
        assertEquals(25L, result.get(0).soldQuantity());
        verify(adminStatisticsRepository).getTopSellingProducts(5);
    }

    @Test
    @DisplayName("getDeadStockProducts returns products with zero or slow sales")
    void testGetDeadStockProducts() {
        List<DeadStockProductDto> deadList = List.of(
                new DeadStockProductDto(50L, "Đèn Chùm Pha Lê Cổ Điển", "http://img.jpg", "Bộ", 15, new BigDecimal("12000000"), 120L)
        );

        when(adminStatisticsRepository.getDeadStockProducts(5)).thenReturn(deadList);

        List<DeadStockProductDto> result = adminStatisticsService.getDeadStockProducts(5);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Đèn Chùm Pha Lê Cổ Điển", result.get(0).productName());
        assertEquals(15, result.get(0).currentStock());
        assertEquals(120L, result.get(0).daysSinceLastSold());
        verify(adminStatisticsRepository).getDeadStockProducts(5);
    }

    @Test
    @DisplayName("getVoucherEfficiency returns voucher performance statistics")
    void testGetVoucherEfficiency() {
        List<VoucherReportDto> vouchers = List.of(
                new VoucherReportDto(1L, "TET2026", "Tết 2026", new BigDecimal("10"), 42, 100, new BigDecimal("21000000")),
                new VoucherReportDto(2L, "VIP500K", "VIP Khách hàng", new BigDecimal("15"), 15, 50, new BigDecimal("7500000"))
        );

        when(adminStatisticsRepository.getVoucherEfficiency()).thenReturn(vouchers);

        List<VoucherReportDto> result = adminStatisticsService.getVoucherEfficiency();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("TET2026", result.get(0).voucherCode());
        assertEquals(42, result.get(0).usedQuantity());
        verify(adminStatisticsRepository).getVoucherEfficiency();
    }

    @Test
    @DisplayName("exportSalesExcel generates non-empty valid XML Spreadsheet bytes")
    void testExportSalesExcel() {
        LocalDate fromDate = LocalDate.now().minusDays(15);
        LocalDate toDate = LocalDate.now();

        List<Map<String, Object>> mockRecords = new ArrayList<>();
        Map<String, Object> r1 = new HashMap<>();
        r1.put("invoice_code", "INV-20260228-001");
        r1.put("order_id", 101L);
        r1.put("txn_date", LocalDateTime.now());
        r1.put("customer_name", "Nguyễn Văn A");
        r1.put("phone", "0912345678");
        r1.put("subtotal", new BigDecimal("15000000"));
        r1.put("discount", new BigDecimal("500000"));
        r1.put("tax", BigDecimal.ZERO);
        r1.put("final_amount", new BigDecimal("14500000"));
        r1.put("payment_method", "BANK_TRANSFER");
        r1.put("payment_status", "PAID");
        r1.put("staff_name", "Admin");
        mockRecords.add(r1);

        when(adminStatisticsRepository.getSalesExportRecords(fromDate, toDate)).thenReturn(mockRecords);

        byte[] bytes = adminStatisticsService.exportSalesExcel(fromDate, toDate);

        assertNotNull(bytes);
        assertTrue(bytes.length > 0);
        String xmlContent = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(xmlContent.contains("urn:schemas-microsoft-com:office:spreadsheet"));
        assertTrue(xmlContent.contains("INV-20260228-001"));
        assertTrue(xmlContent.contains("Nguyễn Văn A"));
        verify(adminStatisticsRepository).getSalesExportRecords(fromDate, toDate);
    }
}
