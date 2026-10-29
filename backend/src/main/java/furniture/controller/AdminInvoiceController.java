package furniture.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import furniture.model.admin.PageResponse;
import furniture.model.admin.invoice.CreateInvoiceRequest;
import furniture.model.admin.invoice.EligibleOrderDto;
import furniture.model.admin.invoice.InvoiceCalculationDto;
import furniture.model.admin.invoice.InvoiceDetailDto;
import furniture.model.admin.invoice.InvoiceStatusCountDto;
import furniture.model.admin.invoice.InvoiceSummaryDto;
import furniture.model.admin.invoice.PreviewInvoiceRequest;
import furniture.service.AdminInvoiceService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/invoices")
@CrossOrigin(origins = "*")
public class AdminInvoiceController {

    private final AdminInvoiceService adminInvoiceService;

    public AdminInvoiceController(AdminInvoiceService adminInvoiceService) {
        this.adminInvoiceService = adminInvoiceService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<InvoiceSummaryDto>> getInvoices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<InvoiceSummaryDto> result = adminInvoiceService.getInvoices(search, paymentMethod, paymentStatus, fromDate, toDate, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/counts")
    public ResponseEntity<InvoiceStatusCountDto> getStatusCounts() {
        return ResponseEntity.ok(adminInvoiceService.getStatusCounts());
    }

    @GetMapping("/eligible-orders")
    public ResponseEntity<List<EligibleOrderDto>> getEligibleOrders() {
        return ResponseEntity.ok(adminInvoiceService.getEligibleOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceDetail(@PathVariable Long id) {
        try {
            InvoiceDetailDto detail = adminInvoiceService.getInvoiceDetail(id);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/preview-calculation")
    public ResponseEntity<?> previewCalculation(@Valid @RequestBody PreviewInvoiceRequest req) {
        try {
            InvoiceCalculationDto calculation = adminInvoiceService.previewCalculation(req);
            return ResponseEntity.ok(calculation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest req,
            @RequestParam(required = false) Long staffUserId) {
        try {
            InvoiceDetailDto created = adminInvoiceService.createInvoice(req, staffUserId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            // Duplicate invoice / business rule exception
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Lỗi tạo hóa đơn: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> printInvoicePdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = adminInvoiceService.generatePdfBytes(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=invoice_" + id + ".pdf")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .body(pdfBytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Lỗi tạo PDF: " + e.getMessage()));
        }
    }
}
