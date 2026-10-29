package furniture.service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import furniture.model.admin.statistics.CategoryRevenueDto;
import furniture.model.admin.statistics.DailyRevenuePointDto;
import furniture.model.admin.statistics.DashboardOverviewDto;
import furniture.model.admin.statistics.DeadStockProductDto;
import furniture.model.admin.statistics.TopProductDto;
import furniture.model.admin.statistics.VoucherReportDto;
import furniture.repository.AdminStatisticsRepository;

@Service
public class AdminStatisticsService {

    private final AdminStatisticsRepository statisticsRepository;

    public AdminStatisticsService(AdminStatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    public DashboardOverviewDto getOverview(LocalDate fromDate, LocalDate toDate) {
        return statisticsRepository.getOverview(fromDate, toDate);
    }

    public List<DailyRevenuePointDto> getDailyRevenueTrend(LocalDate fromDate, LocalDate toDate) {
        return statisticsRepository.getDailyRevenueTrend(fromDate, toDate);
    }

    public List<CategoryRevenueDto> getCategoryRevenueShare(LocalDate fromDate, LocalDate toDate) {
        return statisticsRepository.getCategoryRevenueShare(fromDate, toDate);
    }

    public List<TopProductDto> getTopSellingProducts(int limit) {
        return statisticsRepository.getTopSellingProducts(limit);
    }

    public List<DeadStockProductDto> getDeadStockProducts(int limit) {
        return statisticsRepository.getDeadStockProducts(limit);
    }

    public List<VoucherReportDto> getVoucherEfficiency() {
        return statisticsRepository.getVoucherEfficiency();
    }

    public byte[] exportSalesExcel(LocalDate fromDate, LocalDate toDate) {
        List<Map<String, Object>> records = statisticsRepository.getSalesExportRecords(fromDate, toDate);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            // Chuẩn Microsoft Excel XML Spreadsheet 2003 (đầy đủ màu sắc, định dạng số tiền VND, mở trực tiếp bằng Excel)
            writer.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            writer.println("<?mso-application progid=\"Excel.Sheet\"?>");
            writer.println("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"");
            writer.println(" xmlns:o=\"urn:schemas-microsoft-com:office:office\"");
            writer.println(" xmlns:x=\"urn:schemas-microsoft-com:office:excel\"");
            writer.println(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"");
            writer.println(" xmlns:html=\"http://www.w3.org/TR/REC-html40\">");

            // Styles
            writer.println(" <Styles>");
            // Normal
            writer.println("  <Style ss:ID=\"Default\" ss:Name=\"Normal\">");
            writer.println("   <Alignment ss:Vertical=\"Center\"/>");
            writer.println("   <Font ss:FontName=\"Segoe UI\" ss:Size=\"10\" ss:Color=\"#333333\"/>");
            writer.println("  </Style>");

            // Title Style
            writer.println("  <Style ss:ID=\"sTitle\">");
            writer.println("   <Alignment ss:Horizontal=\"Center\" ss:Vertical=\"Center\"/>");
            writer.println("   <Font ss:FontName=\"Segoe UI\" ss:Size=\"16\" ss:Bold=\"1\" ss:Color=\"#0F766E\"/>");
            writer.println("  </Style>");

            // Subtitle Style
            writer.println("  <Style ss:ID=\"sSub\">");
            writer.println("   <Alignment ss:Horizontal=\"Center\" ss:Vertical=\"Center\"/>");
            writer.println("   <Font ss:FontName=\"Segoe UI\" ss:Size=\"10\" ss:Italic=\"1\" ss:Color=\"#64748B\"/>");
            writer.println("  </Style>");

            // Header Column Style
            writer.println("  <Style ss:ID=\"sHeader\">");
            writer.println("   <Alignment ss:Horizontal=\"Center\" ss:Vertical=\"Center\"/>");
            writer.println("   <Borders>");
            writer.println("    <Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#CBD5E1\"/>");
            writer.println("    <Border ss:Position=\"Top\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#CBD5E1\"/>");
            writer.println("   </Borders>");
            writer.println("   <Font ss:FontName=\"Segoe UI\" ss:Size=\"10\" ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/>");
            writer.println("   <Interior ss:Color=\"#0D9488\" ss:Pattern=\"Solid\"/>");
            writer.println("  </Style>");

            // Data Cell Styles
            writer.println("  <Style ss:ID=\"sCell\">");
            writer.println("   <Borders><Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#F1F5F9\"/></Borders>");
            writer.println("  </Style>");

            writer.println("  <Style ss:ID=\"sCellCenter\">");
            writer.println("   <Alignment ss:Horizontal=\"Center\" ss:Vertical=\"Center\"/>");
            writer.println("   <Borders><Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#F1F5F9\"/></Borders>");
            writer.println("  </Style>");

            writer.println("  <Style ss:ID=\"sCellMoney\">");
            writer.println("   <Alignment ss:Horizontal=\"Right\" ss:Vertical=\"Center\"/>");
            writer.println("   <Borders><Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#F1F5F9\"/></Borders>");
            writer.println("   <NumberFormat ss:Format=\"#,##0 &quot;VND&quot;\"/>");
            writer.println("  </Style>");

            writer.println("  <Style ss:ID=\"sCellTotal\">");
            writer.println("   <Alignment ss:Horizontal=\"Right\" ss:Vertical=\"Center\"/>");
            writer.println("   <Borders>");
            writer.println("    <Border ss:Position=\"Top\" ss:LineStyle=\"Continuous\" ss:Weight=\"2\" ss:Color=\"#0D9488\"/>");
            writer.println("    <Border ss:Position=\"Bottom\" ss:LineStyle=\"Double\" ss:Weight=\"3\" ss:Color=\"#0D9488\"/>");
            writer.println("   </Borders>");
            writer.println("   <Font ss:FontName=\"Segoe UI\" ss:Size=\"11\" ss:Bold=\"1\" ss:Color=\"#0F766E\"/>");
            writer.println("   <NumberFormat ss:Format=\"#,##0 &quot;VND&quot;\"/>");
            writer.println("  </Style>");

            writer.println(" </Styles>");

            // Worksheet
            writer.println(" <Worksheet ss:Name=\"Báo Cáo Doanh Thu Bán Hàng\">");
            writer.println("  <Table ss:DefaultRowHeight=\"20\">");
            writer.println("   <Column ss:Width=\"40\"/>");  // STT
            writer.println("   <Column ss:Width=\"130\"/>"); // Mã HĐ
            writer.println("   <Column ss:Width=\"80\"/>");  // Mã Đơn
            writer.println("   <Column ss:Width=\"150\"/>"); // Khách hàng
            writer.println("   <Column ss:Width=\"100\"/>"); // SĐT
            writer.println("   <Column ss:Width=\"120\"/>"); // Ngày thanh toán
            writer.println("   <Column ss:Width=\"110\"/>"); // Hình thức
            writer.println("   <Column ss:Width=\"110\"/>"); // Tiền hàng
            writer.println("   <Column ss:Width=\"100\"/>"); // Giảm giá
            writer.println("   <Column ss:Width=\"90\"/>");  // Thuế VAT
            writer.println("   <Column ss:Width=\"130\"/>"); // Thực thu
            writer.println("   <Column ss:Width=\"120\"/>"); // Thu ngân

            // Row 1: Title
            writer.println("   <Row ss:Height=\"30\">");
            writer.println("    <Cell ss:MergeAcross=\"11\" ss:StyleID=\"sTitle\"><Data ss:Type=\"String\">BÁO CÁO DOANH THU BÁN HÀNG NỘI THẤT</Data></Cell>");
            writer.println("   </Row>");

            // Row 2: Subtitle / Date range
            String dateRangeText = "Thời gian thống kê: Từ " + (fromDate != null ? fromDate : "Tất cả") + " đến " + (toDate != null ? toDate : LocalDate.now());
            writer.println("   <Row ss:Height=\"20\">");
            writer.println("    <Cell ss:MergeAcross=\"11\" ss:StyleID=\"sSub\"><Data ss:Type=\"String\">" + escapeXml(dateRangeText) + "</Data></Cell>");
            writer.println("   </Row>");
            writer.println("   <Row ss:Height=\"10\"/>"); // Empty line

            // Row 4: Header
            writer.println("   <Row ss:Height=\"24\">");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">STT</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Mã Hóa Đơn</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Mã Đơn</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Khách Hàng</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Số Điện Thoại</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Thời Gian</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Hình Thức TT</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Tiền Hàng</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Giảm Giá</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Thuế VAT</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Thực Thu (VND)</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sHeader\"><Data ss:Type=\"String\">Thu Ngân</Data></Cell>");
            writer.println("   </Row>");

            // Data Rows
            int stt = 1;
            BigDecimal sumSubtotal = BigDecimal.ZERO;
            BigDecimal sumDiscount = BigDecimal.ZERO;
            BigDecimal sumTax = BigDecimal.ZERO;
            BigDecimal sumFinal = BigDecimal.ZERO;

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (Map<String, Object> r : records) {
                String invCode = (String) r.get("invoice_code");
                Long orderId = ((Number) r.get("order_id")).longValue();
                String cust = (String) r.get("customer_name");
                String phone = (String) r.get("phone");
                Object txnObj = r.get("txn_date");
                String txnDateStr = "";
                if (txnObj instanceof Timestamp ts) {
                    txnDateStr = ts.toLocalDateTime().format(fmt);
                } else if (txnObj instanceof LocalDateTime ldt) {
                    txnDateStr = ldt.format(fmt);
                }
                String method = (String) r.get("payment_method");
                BigDecimal sub = r.get("subtotal") != null ? (BigDecimal) r.get("subtotal") : BigDecimal.ZERO;
                BigDecimal disc = r.get("discount") != null ? (BigDecimal) r.get("discount") : BigDecimal.ZERO;
                BigDecimal tax = r.get("tax") != null ? (BigDecimal) r.get("tax") : BigDecimal.ZERO;
                BigDecimal fin = r.get("final_amount") != null ? (BigDecimal) r.get("final_amount") : BigDecimal.ZERO;
                String staff = (String) r.get("staff_name");

                sumSubtotal = sumSubtotal.add(sub);
                sumDiscount = sumDiscount.add(disc);
                sumTax = sumTax.add(tax);
                sumFinal = sumFinal.add(fin);

                writer.println("   <Row ss:Height=\"20\">");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"Number\">" + (stt++) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">" + escapeXml(invCode) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">#" + orderId + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCell\"><Data ss:Type=\"String\">" + escapeXml(cust) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">" + escapeXml(phone) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">" + escapeXml(txnDateStr) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">" + escapeXml(method) + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellMoney\"><Data ss:Type=\"Number\">" + sub.longValue() + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellMoney\"><Data ss:Type=\"Number\">" + disc.longValue() + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellMoney\"><Data ss:Type=\"Number\">" + tax.longValue() + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCellMoney\"><Data ss:Type=\"Number\">" + fin.longValue() + "</Data></Cell>");
                writer.println("    <Cell ss:StyleID=\"sCell\"><Data ss:Type=\"String\">" + escapeXml(staff) + "</Data></Cell>");
                writer.println("   </Row>");
            }

            // Summary row
            writer.println("   <Row ss:Height=\"24\">");
            writer.println("    <Cell ss:MergeAcross=\"6\" ss:StyleID=\"sCellCenter\"><Data ss:Type=\"String\">TỔNG CỘNG (" + records.size() + " đơn hàng):</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sCellTotal\"><Data ss:Type=\"Number\">" + sumSubtotal.longValue() + "</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sCellTotal\"><Data ss:Type=\"Number\">" + sumDiscount.longValue() + "</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sCellTotal\"><Data ss:Type=\"Number\">" + sumTax.longValue() + "</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sCellTotal\"><Data ss:Type=\"Number\">" + sumFinal.longValue() + "</Data></Cell>");
            writer.println("    <Cell ss:StyleID=\"sCellTotal\"><Data ss:Type=\"String\"></Data></Cell>");
            writer.println("   </Row>");

            writer.println("  </Table>");
            writer.println(" </Worksheet>");
            writer.println("</Workbook>");
            writer.flush();
        }

        return baos.toByteArray();
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
