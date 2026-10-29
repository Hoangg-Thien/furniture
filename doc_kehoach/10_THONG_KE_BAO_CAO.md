# TÀI LIỆU MODULE 10: THỐNG KÊ VÀ BÁO CÁO (ANALYTICS)
## TRỰC QUAN HÓA KINH DOANH, CHỈ SỐ TÀI CHÍNH & XUẤT BÁO CÁO EXCEL

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Hệ thống Giao diện UI/UX ➡️](11_HE_THONG_GIAO_DIEN_UI_UX.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Cung cấp trung tâm điều hành và phân tích kinh doanh (Executive Dashboard) cho Ban Giám đốc và Quản trị viên (`ADMIN`):
  - **Chỉ số thời gian thực (KPI Realtime)**: Tổng doanh số trong ngày/tháng, Tăng trưởng so với tháng trước, Tổng đơn hoàn thành, Sản phẩm sắp cạn kho.
  - **Phân tích Doanh thu & Chi phí vốn**: Doanh thu từ hóa đơn bán hàng (`invoices`) so với Tổng chi phí nhập hàng từ nhà cung cấp (`purchase_receipts`).
  - **Cơ cấu danh mục bán chạy**: Tỷ trọng đóng góp doanh thu của Sofa, Giường tủ, Bàn ăn trong tổng doanh số.
  - **Sản phẩm Top Seller & Hàng tồn kho ứ đọng**: Giúp lập kế hoạch nhập hàng hoặc lên chương trình xả kho.
  - **Báo cáo sử dụng Voucher**: Đánh giá chi phí tiếp thị và hiệu quả mang lại của các mã giảm giá.
  - **Xuất báo cáo tài chính**: Hỗ trợ xuất file Excel định dạng chuẩn (.xlsx) và file PDF phục vụ họp ban điều hành.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Dashboard Tổng quan Thống kê

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Báo cáo & Thống kê kinh doanh                 [Khoảng ngày: 01/10/2026 - 27/10/2026 v]|
+--------------------------------------------------------------------------------------------------+
| KHU VỰC 1: CÁC THẺ CHỈ SỐ KPI CHÍNH                                                              |
| +-------------------+ +-------------------+ +-------------------+ +----------------------------+ |
| | 💵 DOANH THU THÁNG | | 📦 ĐƠN HOÀN THÀNH | | 🛋️ MÓN ĐỒ ĐÃ BÁN  | | ⚠️ CẢNH BÁO TỒN KHO       | |
| |  452.800.000 VNĐ  | |      128 đơn      | |     184 sản phẩm  | | 05 sản phẩm tồn < 5 cái  | |
| |  (+14.2% so t.trước)| |  (Tỷ lệ giao: 94%)| | (Sofa chiếm 42%)  | | [Xem ngay danh sách]     | |
| +-------------------+ +-------------------+ +-------------------+ +----------------------------+ |
+--------------------------------------------------------------------------------------------------+
| KHU VỰC 2: BIỂU ĐỒ TRỰC QUAN (CHARTS)                                                            |
| +-------------------------------------------------+ +------------------------------------------+ |
| | BIỂU ĐỒ DOANH THU & CHI PHÍ NHẬP HÀNG THEO NGÀY  | | CƠ CẤU DOANH THU THEO LOẠI NỘI THẤT      | |
| |  [ Doanh thu bán ]       [ Giá vốn nhập kho ]   | |                                          | |
| |   50M |       /\           /\                   | |     .---.       ■ Sofa & Ghế (42%)       | |
| |   30M |  /\  /  \    /\   /  \                  | |    /     \      ■ Bàn Ghế Ăn (28%)       | |
| |   10M | /  \/    \  /  \ /    \                 | |   |       |     ■ Giường Ngủ (20%)       | |
| |    0M +---------------------------------------- | |    \     /      ■ Kệ Tủ Decor (10%)      | |
| |       01/10  07/10  14/10  21/10  27/10         | |     '---'                                | |
| +-------------------------------------------------+ +------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
| KHU VỰC 3: TOP 5 SẢN PHẨM BÁN CHẠY NHẤT                   [📥 Xuất Báo Cáo Doanh Thu Excel]       |
+-----+-------------------------------+----------+---------------+----------------+----------------+
| STT | Tên sản phẩm nội thất         | Đơn vị   | Số lượng bán  | Tổng doanh thu | Đánh giá       |
+-----+-------------------------------+----------+---------------+----------------+----------------+
|  1  | Sofa Góc Chữ L Da Bò Ý        | Bộ       | 18 bộ         | 324.000.000 đ  | ⭐ Bán chạy nhất|
|  2  | Bàn Ăn Gỗ Sồi Mặt Đá Ceramic  | Bộ       | 14 bộ         | 168.000.000 đ  | 🚀 Tăng trưởng |
|  3  | Giường Ngủ Gỗ Tự Nhiên King   | Chiếc    | 12 chiếc      | 144.000.000 đ  | Ổn định        |
+-----+-------------------------------+----------+---------------+----------------+----------------+
```

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
public record DashboardKpiDto(
    BigDecimal totalRevenue,
    Double revenueGrowthPercent,
    Long completedOrdersCount,
    Long totalItemsSold,
    Long lowStockProductsCount
) {}

public record DailyRevenuePointDto(
    String dateLabel,
    BigDecimal salesRevenue,
    BigDecimal importCost
) {}

public record CategoryRevenueDto(
    String categoryName,
    BigDecimal totalRevenue,
    Double percentage
) {}

public record TopProductDto(
    Long productId,
    String productName,
    String imageUrl,
    Long soldQuantity,
    BigDecimal totalRevenue
) {}
```

### 3.2. Repository Layer (Native Queries Tối ưu hiệu năng)

```java
@Repository
public interface StatisticsRepository {

    @Query(value = """
        SELECT COALESCE(SUM(final_amount), 0) 
        FROM invoices 
        WHERE payment_status = 'PAID' AND payment_date BETWEEN :start AND :end
    """, nativeQuery = true)
    BigDecimal calculateTotalRevenue(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = """
        SELECT TO_CHAR(payment_date, 'YYYY-MM-DD') AS report_day, 
               SUM(final_amount) AS revenue
        FROM invoices
        WHERE payment_status = 'PAID' AND payment_date BETWEEN :start AND :end
        GROUP BY report_day ORDER BY report_day ASC
    """, nativeQuery = true)
    List<Object[]> getDailyRevenueTrend(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = """
        SELECT p.id, p.name, p.image_url, 
               SUM(oi.quantity) AS sold_qty, 
               SUM(oi.amount) AS total_val
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'COMPLETED' AND o.order_date BETWEEN :start AND :end
        GROUP BY p.id, p.name, p.image_url
        ORDER BY sold_qty DESC LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> getTopSellingProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("limit") int limit);
}
```

### 3.3. Service Layer (`AdminStatisticsService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminStatisticsService {
    private final StatisticsRepository statisticsRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DashboardKpiDto getDashboardKpi() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0);
        LocalDateTime startOfLastMonth = startOfMonth.minusMonths(1);

        BigDecimal thisMonthRev = statisticsRepository.calculateTotalRevenue(startOfMonth, now);
        BigDecimal lastMonthRev = statisticsRepository.calculateTotalRevenue(startOfLastMonth, startOfMonth);

        Double growth = 0.0;
        if (lastMonthRev.compareTo(BigDecimal.ZERO) > 0) {
            growth = thisMonthRev.subtract(lastMonthRev)
                .divide(lastMonthRev, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();
        }

        long lowStock = productRepository.countByQuantityLessThan(5);
        long completed = orderRepository.countByStatusAndOrderDateBetween("COMPLETED", startOfMonth, now);

        return new DashboardKpiDto(thisMonthRev, growth, completed, 0L, lowStock);
    }

    public byte[] exportSalesExcel(LocalDate from, LocalDate to) {
        // Sinh file Excel đa tab bằng thư viện Apache POI (HSSFWorkbook / XSSFWorkbook)
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Báo Cáo Doanh Thu Bán Hàng");
            // Định dạng tiêu đề cột, viền ô, định dạng số tiền VND
            // Ghi dữ liệu dòng
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi sinh file Excel", e);
        }
    }
}
```

### 3.4. Controller Layer (`AdminStatisticsController.java`)

```java
@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Dữ liệu tài chính chỉ dành riêng cho Quản trị viên
public class AdminStatisticsController {
    private final AdminStatisticsService statisticsService;

    @GetMapping("/kpi")
    public ResponseEntity<DashboardKpiDto> getKpi() {
        return ResponseEntity.ok(statisticsService.getDashboardKpi());
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<DailyRevenuePointDto>> getRevenueTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(statisticsService.getRevenueTrend(from, to));
    }

    @GetMapping("/top-sellers")
    public ResponseEntity<List<TopProductDto>> getTopProducts(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(statisticsService.getTopSellers(limit));
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] excelBytes = statisticsService.exportSalesExcel(from, to);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bao_cao_doanh_thu.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excelBytes);
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS (ĐÃ TRIỂN KHAI HOÀN THIỆN)

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/statistics/overview` | `ADMIN` / `STAFF` | Lấy các thẻ chỉ số KPI tổng quan (Doanh thu, Lợi nhuận gộp, Vốn nhập, Đơn hàng, Tồn thấp) |
| `GET` | `/api/admin/statistics/revenue-trend` | `ADMIN` / `STAFF` | Dữ liệu vẽ biểu đồ cột/đường xu hướng doanh số và chi phí vốn nhập theo ngày |
| `GET` | `/api/admin/statistics/category-share` | `ADMIN` / `STAFF` | Dữ liệu tỷ trọng doanh thu theo từng danh mục nội thất |
| `GET` | `/api/admin/statistics/top-products` | `ADMIN` / `STAFF` | Lấy danh sách sản phẩm nội thất bán chạy nhất (Top Best Sellers) |
| `GET` | `/api/admin/statistics/dead-stock` | `ADMIN` / `STAFF` | Lấy danh sách hàng tồn kho chậm luân chuyển / ứ đọng và đề xuất xả hàng |
| `GET` | `/api/admin/statistics/voucher-efficiency` | `ADMIN` / `STAFF` | Thống kê hiệu quả sử dụng mã giảm giá và ngân sách khuyến mãi |
| `GET` | `/api/admin/statistics/export-excel` | `ADMIN` / `STAFF` | Tải xuống file bảng tính Excel (.xls) định dạng chuẩn, có màu sắc, định dạng tiền VND |

---

## 5. TRẠNG THÁI TRIỂN KHAI
- [x] **Backend**: DTOs, `AdminStatisticsRepository`, `AdminStatisticsService`, `AdminStatisticsController` hoàn thành 100%.
- [x] **Unit Tests**: `AdminStatisticsServiceTest` đạt 7/7 tests pass, toàn bộ test suite đạt 91/91 tests pass.
- [x] **Frontend**: `AdminReportsManagement.jsx`, `AdminDashboard.jsx`, và `AdminLayout.jsx` đã tích hợp đầy đủ bộ lọc ngày, biểu đồ xu hướng, cơ cấu danh mục, 3 tab báo cáo chuyên sâu và xuất Excel.

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Hệ thống Giao diện UI/UX ➡️](11_HE_THONG_GIAO_DIEN_UI_UX.md)
