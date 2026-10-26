package furniture.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.dashboard.DashboardOverviewResponse;
import furniture.model.dashboard.FinancialReportResponse;
import furniture.model.dashboard.PeriodStatsDto;
import furniture.service.DashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Lấy toàn bộ dữ liệu tổng quan cho trang Admin Dashboard:
     * - Chỉ số KPIs (Doanh thu, Đơn hàng, Giao lắp, Cảnh báo kho)
     * - Thống kê theo 4 mốc thời gian (Hôm nay, Tuần này, Tháng này, Năm nay)
     * - Biểu đồ Doanh thu & Giá vốn 6 tháng
     * - Tỷ trọng doanh thu theo danh mục sản phẩm
     * - Đơn hàng & điều phối giao lắp gần đây
     * - Cảnh báo các sản phẩm có tồn kho thấp nhất
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getDashboardOverview() {
        try {
            DashboardOverviewResponse overview = dashboardService.getDashboardOverview();
            return ResponseEntity.ok(overview);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lấy dữ liệu thống kê Dashboard: " + ex.getMessage()));
        }
    }

    /**
     * Lấy chỉ số thống kê theo mốc thời gian được chọn:
     * @param period: TODAY | WEEK | MONTH | YEAR
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getPeriodStats(@RequestParam(defaultValue = "MONTH") String period) {
        try {
            PeriodStatsDto stats = dashboardService.getPeriodStats(period);
            return ResponseEntity.ok(stats);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lấy dữ liệu thống kê theo kỳ: " + ex.getMessage()));
        }
    }

    /**
     * Lấy báo cáo tài chính chuyên sâu cho trang Admin Reports:
     * - Tổng hợp doanh thu, giá vốn COGS, lãi gộp 6 tháng
     * - Bảng kê chi tiết chỉ số từng tháng kèm đánh giá hiệu suất
     */
    @GetMapping("/reports")
    public ResponseEntity<?> getFinancialReports() {
        try {
            FinancialReportResponse report = dashboardService.getFinancialReports();
            return ResponseEntity.ok(report);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lấy báo cáo tài chính chuyên sâu: " + ex.getMessage()));
        }
    }
}
