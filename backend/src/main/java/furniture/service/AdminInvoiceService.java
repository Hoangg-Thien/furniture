package furniture.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class AdminInvoiceService {

    private final AdminInvoiceRepository adminInvoiceRepository;
    private final AdminOrderRepository adminOrderRepository;
    private final AdminStaffRepository adminStaffRepository;

    public AdminInvoiceService(
            AdminInvoiceRepository adminInvoiceRepository,
            AdminOrderRepository adminOrderRepository,
            AdminStaffRepository adminStaffRepository) {
        this.adminInvoiceRepository = adminInvoiceRepository;
        this.adminOrderRepository = adminOrderRepository;
        this.adminStaffRepository = adminStaffRepository;
    }

    public PageResponse<InvoiceSummaryDto> getInvoices(
            String search,
            String paymentMethod,
            String paymentStatus,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {
        return adminInvoiceRepository.findInvoices(search, paymentMethod, paymentStatus, fromDate, toDate, page, size);
    }

    public InvoiceStatusCountDto getStatusCounts() {
        return adminInvoiceRepository.countStats();
    }

    public List<EligibleOrderDto> getEligibleOrders() {
        return adminInvoiceRepository.findEligibleOrders();
    }

    public InvoiceDetailDto getInvoiceDetail(Long id) {
        InvoiceDetailDto detail = adminInvoiceRepository.findDetailById(id);
        if (detail == null) {
            throw new IllegalArgumentException("Không tìm thấy hóa đơn với ID #" + id);
        }
        return detail;
    }

    public InvoiceCalculationDto previewCalculation(PreviewInvoiceRequest req) {
        if (req.orderId() == null) {
            throw new IllegalArgumentException("Mã đơn hàng không được để trống!");
        }

        OrderDetailDto order = adminOrderRepository.findDetailById(req.orderId());
        if (order == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng #" + req.orderId());
        }

        BigDecimal subtotal = order.subtotal() != null ? order.subtotal() : BigDecimal.ZERO;
        BigDecimal orderDiscount = order.discountAmount() != null ? order.discountAmount() : BigDecimal.ZERO;
        BigDecimal baseAmount = subtotal.subtract(orderDiscount).max(BigDecimal.ZERO);

        BigDecimal voucherDiscount = BigDecimal.ZERO;
        String appliedVoucherCode = null;
        boolean voucherValid = false;
        String voucherMessage = null;

        if (req.voucherCode() != null && !req.voucherCode().trim().isEmpty()) {
            appliedVoucherCode = req.voucherCode().trim().toUpperCase();
            Optional<VoucherDto> voucherOpt = adminInvoiceRepository.findVoucherByCode(appliedVoucherCode);

            if (voucherOpt.isEmpty()) {
                voucherMessage = "Mã voucher '" + appliedVoucherCode + "' không tồn tại trong hệ thống!";
            } else {
                VoucherDto v = voucherOpt.get();
                voucherMessage = checkVoucherValidity(v, baseAmount);
                if (voucherMessage == null) {
                    voucherValid = true;
                    // Thuật toán: MIN(baseAmount * % / 100, maximumDiscount)
                    BigDecimal discount = baseAmount.multiply(v.discountPercent())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    if (v.maximumDiscount() != null && discount.compareTo(v.maximumDiscount()) > 0) {
                        discount = v.maximumDiscount();
                    }
                    voucherDiscount = discount;
                    voucherMessage = "Áp dụng thành công voucher giảm " + v.discountPercent() + "% (tối đa " + formatCurrency(v.maximumDiscount()) + ")";
                }
            }
        }

        BigDecimal afterVoucher = baseAmount.subtract(voucherDiscount).max(BigDecimal.ZERO);
        boolean includeVat = Boolean.TRUE.equals(req.includeVat());
        BigDecimal vatPercent = req.vatPercent() != null ? req.vatPercent() : BigDecimal.valueOf(8.0);
        BigDecimal vatAmount = BigDecimal.ZERO;

        if (includeVat) {
            vatAmount = afterVoucher.multiply(vatPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal finalAmount = afterVoucher.add(vatAmount);

        return new InvoiceCalculationDto(
                order.id(),
                subtotal,
                orderDiscount,
                voucherDiscount,
                appliedVoucherCode,
                voucherValid,
                voucherMessage,
                includeVat,
                vatPercent,
                vatAmount,
                finalAmount
        );
    }

    @Transactional
    public InvoiceDetailDto createInvoice(CreateInvoiceRequest req, Long staffUserId) {
        if (req.orderId() == null) {
            throw new IllegalArgumentException("Mã đơn hàng không được để trống!");
        }

        if (adminInvoiceRepository.existsByOrderId(req.orderId())) {
            throw new IllegalStateException("Đơn hàng này đã được xuất hóa đơn trước đó!");
        }

        OrderDetailDto order = adminOrderRepository.findDetailById(req.orderId());
        if (order == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng #" + req.orderId());
        }

        if ("CANCELLED".equalsIgnoreCase(order.status())) {
            throw new IllegalStateException("Không thể xuất hóa đơn cho đơn hàng đã hủy!");
        }

        // Tìm nhân viên xuất hóa đơn
        Long staffId = null;
        if (staffUserId != null) {
            Optional<Map<String, Object>> staffOpt = adminStaffRepository.findByUserId(staffUserId);
            if (staffOpt.isPresent()) {
                staffId = ((Number) staffOpt.get().get("id")).longValue();
            }
        }
        if (staffId == null && req.staffId() != null) {
            staffId = req.staffId();
        }
        if (staffId == null) {
            staffId = order.staffId();
        }
        if (staffId == null) {
            staffId = 1L; // Nhân viên thu ngân mặc định thỏa mãn ràng buộc ck_orders_staff
        }

        // Tính toán chiết khấu & voucher
        BigDecimal subtotal = order.subtotal() != null ? order.subtotal() : BigDecimal.ZERO;
        BigDecimal orderDiscount = order.discountAmount() != null ? order.discountAmount() : BigDecimal.ZERO;
        BigDecimal baseAmount = subtotal.subtract(orderDiscount).max(BigDecimal.ZERO);

        BigDecimal voucherDiscount = BigDecimal.ZERO;
        String appliedVoucherCode = null;
        Long voucherIdToIncrement = null;

        if (req.voucherCode() != null && !req.voucherCode().trim().isEmpty()) {
            appliedVoucherCode = req.voucherCode().trim().toUpperCase();
            Optional<VoucherDto> voucherOpt = adminInvoiceRepository.findVoucherByCode(appliedVoucherCode);

            if (voucherOpt.isEmpty()) {
                throw new IllegalArgumentException("Mã voucher '" + appliedVoucherCode + "' không tồn tại!");
            }

            VoucherDto v = voucherOpt.get();
            String errorMsg = checkVoucherValidity(v, baseAmount);
            if (errorMsg != null) {
                throw new IllegalStateException(errorMsg);
            }

            BigDecimal discount = baseAmount.multiply(v.discountPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (v.maximumDiscount() != null && discount.compareTo(v.maximumDiscount()) > 0) {
                discount = v.maximumDiscount();
            }
            voucherDiscount = discount;
            voucherIdToIncrement = v.id();
        }

        BigDecimal afterVoucher = baseAmount.subtract(voucherDiscount).max(BigDecimal.ZERO);
        boolean includeVat = Boolean.TRUE.equals(req.includeVat());
        BigDecimal vatPercent = req.vatPercent() != null ? req.vatPercent() : BigDecimal.valueOf(8.0);
        BigDecimal vatAmount = BigDecimal.ZERO;

        if (includeVat) {
            vatAmount = afterVoucher.multiply(vatPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal finalAmount = afterVoucher.add(vatAmount);

        // Sinh mã hóa đơn chuẩn showroom
        String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        long randomSuffix = System.currentTimeMillis() % 10000;
        String invoiceCode = String.format("HD-%s-%04d", dateStr, randomSuffix);

        Long invoiceId = adminInvoiceRepository.insertInvoice(
                invoiceCode,
                order.id(),
                order.customerId(),
                staffId,
                subtotal,
                orderDiscount,
                appliedVoucherCode,
                voucherDiscount,
                vatAmount,
                finalAmount,
                req.paymentMethod(),
                "PAID",
                req.notes()
        );

        // Cập nhật số lượt dùng của voucher
        if (voucherIdToIncrement != null) {
            adminInvoiceRepository.incrementVoucherUsedQuantity(voucherIdToIncrement);
        }

        // Chuyển đơn hàng sang trạng thái COMPLETED kèm gán nhân viên thu ngân
        adminOrderRepository.updateStatusAndStaff(order.id(), "COMPLETED", staffId);

        return adminInvoiceRepository.findDetailById(invoiceId);
    }

    private String checkVoucherValidity(VoucherDto v, BigDecimal orderAmount) {
        LocalDateTime now = LocalDateTime.now();
        if (!"ACTIVE".equalsIgnoreCase(v.status())) {
            return "Mã voucher hiện đang bị khóa hoặc không ở trạng thái ACTIVE!";
        }
        if (v.startDate() != null && now.isBefore(v.startDate())) {
            return "Mã voucher chưa đến thời gian áp dụng!";
        }
        if (v.endDate() != null && now.isAfter(v.endDate())) {
            return "Mã voucher đã hết hạn sử dụng!";
        }
        if (v.quantity() > 0 && v.usedQuantity() >= v.quantity()) {
            return "Mã voucher đã hết lượt sử dụng!";
        }
        if (v.minimumAmount() != null && orderAmount.compareTo(v.minimumAmount()) < 0) {
            return "Giá trị đơn hàng (" + formatCurrency(orderAmount) + ") chưa đạt mức tối thiểu "
                    + formatCurrency(v.minimumAmount()) + " để dùng voucher!";
        }
        return null;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 đ";
        return String.format("%,d đ", amount.longValue());
    }

    public byte[] generatePdfBytes(Long invoiceId) {
        InvoiceDetailDto invoice = getInvoiceDetail(invoiceId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            // Xây dựng PDF 1.4 chuẩn mực với bảng kê chi tiết sản phẩm
            List<InvoiceItemDto> items = invoice.items() != null ? invoice.items() : List.of();

            StringBuilder streamContent = new StringBuilder();
            // Thiết lập font và màu sắc
            streamContent.append("BT\n");

            // Header Showroom
            streamContent.append("/F2 16 Tf\n");
            streamContent.append("50 790 Td\n");
            streamContent.append("(SHOWROOM NOI THAT CAO CAP) Tj\n");

            streamContent.append("/F1 10 Tf\n");
            streamContent.append("0 -16 Td\n");
            streamContent.append("(Dia chi: 123 Duong Noi That, TP. Ho Chi Minh - Hotline: 1900 6868 - MST: 0312345678) Tj\n");

            // Tiêu đề hóa đơn
            streamContent.append("/F2 18 Tf\n");
            streamContent.append("0 -36 Td\n");
            streamContent.append("(HOA DON BAN HANG NOI THAT) Tj\n");

            streamContent.append("/F1 10 Tf\n");
            streamContent.append("0 -18 Td\n");
            streamContent.append("(").append(escapePdf("So: " + invoice.invoiceCode() + "   |   Ngay: " + (invoice.paymentDate() != null ? invoice.paymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : ""))).append(") Tj\n");

            // Thông tin khách hàng & thu ngân
            streamContent.append("0 -24 Td\n");
            streamContent.append("(").append(escapePdf("Khach hang: " + stripAccents(invoice.customerName()) + "   -   SDT: " + invoice.phone())).append(") Tj\n");

            streamContent.append("0 -15 Td\n");
            streamContent.append("(").append(escapePdf("Dia chi giao: " + stripAccents(invoice.address()))).append(") Tj\n");

            streamContent.append("0 -15 Td\n");
            streamContent.append("(").append(escapePdf("Thu ngan: " + stripAccents(invoice.staffName() != null ? invoice.staffName() : "Admin") + "   |   PTTT: " + invoice.paymentMethod())).append(") Tj\n");

            // Bảng danh sách hàng hóa
            streamContent.append("0 -30 Td\n");
            streamContent.append("/F2 10 Tf\n");
            streamContent.append("(STT    Ten mat hang noi that                 DVT    SL      Don gia          Thanh tien) Tj\n");
            streamContent.append("0 -5 Td\n");
            streamContent.append("(--------------------------------------------------------------------------------------------------) Tj\n");

            streamContent.append("/F1 9 Tf\n");
            int stt = 1;
            for (InvoiceItemDto item : items) {
                String line = String.format("%-6d %-37s %-6s %-6d %12s %16s",
                        stt++,
                        truncate(stripAccents(item.productName()), 35),
                        stripAccents(item.unit() != null ? item.unit() : "cai"),
                        item.quantity(),
                        formatNumber(item.unitPrice()),
                        formatNumber(item.amount())
                );
                streamContent.append("0 -15 Td\n");
                streamContent.append("(").append(escapePdf(line)).append(") Tj\n");
            }

            streamContent.append("0 -10 Td\n");
            streamContent.append("(--------------------------------------------------------------------------------------------------) Tj\n");

            // Tổng thanh toán
            streamContent.append("/F1 10 Tf\n");
            streamContent.append("0 -18 Td\n");
            streamContent.append("(").append(escapePdf(String.format("%65s: %16s VND", "Tong tien hang", formatNumber(invoice.subtotalAmount())))).append(") Tj\n");

            if (invoice.voucherDiscount() != null && invoice.voucherDiscount().compareTo(BigDecimal.ZERO) > 0) {
                streamContent.append("0 -15 Td\n");
                streamContent.append("(").append(escapePdf(String.format("%65s: -%15s VND", "Giam gia Voucher (" + (invoice.voucherCode() != null ? invoice.voucherCode() : "") + ")", formatNumber(invoice.voucherDiscount())))).append(") Tj\n");
            }

            if (invoice.taxAmount() != null && invoice.taxAmount().compareTo(BigDecimal.ZERO) > 0) {
                streamContent.append("0 -15 Td\n");
                streamContent.append("(").append(escapePdf(String.format("%65s: %16s VND", "Thue VAT (8%)", formatNumber(invoice.taxAmount())))).append(") Tj\n");
            }

            streamContent.append("/F2 12 Tf\n");
            streamContent.append("0 -20 Td\n");
            streamContent.append("(").append(escapePdf(String.format("%55s: %16s VND", "TONG THANH TOAN", formatNumber(invoice.finalAmount())))).append(") Tj\n");

            // Chính sách bảo hành
            streamContent.append("/F1 9 Tf\n");
            streamContent.append("0 -35 Td\n");
            streamContent.append("(Cam on Quy khach da tin tuong mua sam tai Showroom Noi That Cao Cap!) Tj\n");
            streamContent.append("0 -14 Td\n");
            streamContent.append("(Chinh sach bao hanh: Khung go tu nhien bao hanh 05 nam, nem mut bao hanh 02 nam.) Tj\n");

            streamContent.append("ET\n");

            byte[] streamBytes = streamContent.toString().getBytes(StandardCharsets.ISO_8859_1);

            // Ghi cấu trúc PDF
            PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.ISO_8859_1));
            writer.print("%PDF-1.4\n");
            writer.flush();

            List<Integer> offsets = new java.util.ArrayList<>();

            // Obj 1: Catalog
            offsets.add(baos.size());
            writer.print("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
            writer.flush();

            // Obj 2: Pages
            offsets.add(baos.size());
            writer.print("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
            writer.flush();

            // Obj 3: Page
            offsets.add(baos.size());
            writer.print("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");
            writer.flush();

            // Obj 4: Font F1 (Helvetica)
            offsets.add(baos.size());
            writer.print("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
            writer.flush();

            // Obj 5: Font F2 (Helvetica-Bold)
            offsets.add(baos.size());
            writer.print("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");
            writer.flush();

            // Obj 6: Contents stream
            offsets.add(baos.size());
            writer.print("6 0 obj\n<< /Length " + streamBytes.length + " >>\nstream\n");
            writer.flush();
            baos.write(streamBytes);
            baos.flush();
            writer.print("\nendstream\nendobj\n");
            writer.flush();

            // Xref
            int startXref = baos.size();
            writer.print("xref\n0 7\n");
            writer.print("0000000000 65535 f \n");
            for (int offset : offsets) {
                writer.print(String.format("%010d 00000 n \n", offset));
            }
            writer.print("trailer\n<< /Size 7 /Root 1 0 R >>\n");
            writer.print("startxref\n" + startXref + "\n%%EOF\n");
            writer.flush();

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi tạo file PDF hóa đơn: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private String formatNumber(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount.longValue());
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max - 3) + "...";
    }

    private String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private String stripAccents(String s) {
        if (s == null) return "";
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace("đ", "d").replace("Đ", "D");
    }
}
