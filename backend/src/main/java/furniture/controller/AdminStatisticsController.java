package furniture.controller;

import furniture.model.admin.statistics.CategoryRevenueDto;
import furniture.model.admin.statistics.DailyRevenuePointDto;
import furniture.model.admin.statistics.DashboardOverviewDto;
import furniture.model.admin.statistics.DeadStockProductDto;
import furniture.model.admin.statistics.TopProductDto;
import furniture.model.admin.statistics.VoucherReportDto;
import furniture.service.AdminStatisticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/statistics")
@CrossOrigin(origins = "*")
public class AdminStatisticsController {

    private final AdminStatisticsService statisticsService;

    public AdminStatisticsController(AdminStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDto> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(statisticsService.getOverview(fromDate, toDate));
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<DailyRevenuePointDto>> getRevenueTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(statisticsService.getDailyRevenueTrend(fromDate, toDate));
    }

    @GetMapping("/category-share")
    public ResponseEntity<List<CategoryRevenueDto>> getCategoryShare(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(statisticsService.getCategoryRevenueShare(fromDate, toDate));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDto>> getTopProducts(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(statisticsService.getTopSellingProducts(limit));
    }

    @GetMapping("/dead-stock")
    public ResponseEntity<List<DeadStockProductDto>> getDeadStock(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(statisticsService.getDeadStockProducts(limit));
    }

    @GetMapping("/voucher-efficiency")
    public ResponseEntity<List<VoucherReportDto>> getVoucherEfficiency() {
        return ResponseEntity.ok(statisticsService.getVoucherEfficiency());
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportSalesExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        byte[] excelBytes = statisticsService.exportSalesExcel(fromDate, toDate);
        String filename = "bao_cao_doanh_thu_" + LocalDate.now() + ".xls";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.ms-excel; charset=UTF-8")
                .body(excelBytes);
    }
}
