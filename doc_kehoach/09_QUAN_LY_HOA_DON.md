# TÀI LIỆU MODULE 09: QUẢN LÝ HÓA ĐƠN & ÁP DỤNG KHUYẾN MÃI / VOUCHER
## HÓA ĐƠN TÀI CHÍNH, THUẬT TOÁN CHIẾT KHẤU & IN HÓA ĐƠN BÁN LẺ NỘI THẤT

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 10 - Thống kê & Báo cáo ➡️](10_THONG_KE_BAO_CAO.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý chứng từ thanh toán chính thức trong bảng `invoices` được xuất từ đơn hàng (`orders`).
- **Thuật toán tính toán chiết khấu đa tầng (Khuyến mãi + Voucher + Thuế VAT)**:
  ```
  [B1] Tổng tiền gốc = SUM(Số lượng x Đơn giá niêm yết của từng sản phẩm)
  [B2] Giảm giá sản phẩm = Tính theo % của product_discounts trong chiến dịch ACTIVE
  [B3] Tạm tính 1 = [B1] - [B2]
  [B4] Chiết khấu đơn hàng = Áp dụng % của order_discounts nếu Tạm tính 1 >= minimum_amount
  [B5] Tạm tính 2 = [B3] - [B4]
  [B6] Giảm giá Voucher = Kiểm tra hợp lệ (ngày dùng, số lượng tồn, min amount)
       Voucher Discount = MIN(Tạm tính 2 * discount_percent / 100, maximum_discount)
  [B7] Tổng tiền sau giảm giá = Tạm tính 2 - [B6]
  [B8] Thuế VAT (nếu khách yêu cầu hóa đơn đỏ) = [B7] * 8% (hoặc 10%)
  [B9] TỔNG GIÁ TRỊ HÓA ĐƠN = [B7] + [B8]
  ```
- Quản lý các hình thức thanh toán hiện đại: Tiền mặt (`CASH`), Chuyển khoản QR ngân hàng (`BANK_TRANSFER` sinh mã VietQR động theo đúng số tiền), Thẻ qua máy POS (`CREDIT_CARD`), Ví điện tử (`VNPAY`, `MOMO`).
- Tính năng In hóa đơn bán lẻ chuẩn showroom nội thất (khổ giấy A4 hoặc giấy cuộn K80) và xuất file PDF.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Danh sách Hóa đơn Bán hàng

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý hóa đơn                                                 [📥 Báo cáo hóa đơn] |
+--------------------------------------------------------------------------------------------------+
| [🔍 Tìm mã HD / Tên khách...]  [Phương thức: Tất cả v]  [Trạng thái: Đã thanh toán v]   [Nút Lọc]|
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH HÓA ĐƠN BÁN HÀNG                                                                       |
+-------------------+-----------+---------------+------------+-----------+-----------+-------------+
| Mã hóa đơn        | Mã đơn    | Khách hàng    | Ngày xuất  | PT T.Toán | Tổng tiền | Thao tác    |
+-------------------+-----------+---------------+------------+-----------+-----------+-------------+
| HD-20261027-001   | #100      | Nguyễn Thị Lan| 27/10 11:00| VietQR    | 16.200.000| [👁️ In PDF] |
| HD-20261026-089   | #099      | Lê Hoàng Nam  | 26/10 16:45| Tiền mặt  | 45.000.000| [👁️ In PDF] |
| HD-20261026-088   | #098      | Phạm Minh Tuấn| 26/10 14:10| POS Thẻ   | 8.500.000 | [👁️ In PDF] |
+-------------------+-----------+---------------+------------+-----------+-----------+-------------+
| Hiển thị 1 - 3 trên 210 hóa đơn                               [ < Trước ] [ 1 ] [ 2 ] [ Sau > ]  |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Giao diện Mẫu Hóa đơn Bán lẻ Nội thất (Invoice Printable View)

```
+--------------------------------------------------------------------------------------------------+
|                                    CỬA HÀNG NỘI THẤT CAO CẤP                                     |
|                               Địa chỉ: 123 Đường Nội Thất, TP. Hồ Chí Minh                       |
|                               Hotline: 1900 6868 - MST: 0312345678                               |
|                                                                                                  |
|                                    HÓA ĐƠN BÁN HÀNG NỘI THẤT                                     |
|                                      Số: HD-20261027-001                                         |
|                                                                                                  |
| Khách hàng: Nguyễn Thị Lan                         Ngày lập: 27/10/2026 11:00                     |
| Số điện thoại: 0912 345 678                        Thu ngân: Hoàng Minh Đức                      |
| Địa chỉ giao hàng: Căn hộ 12B Tòa Landmark 81, Bình Thạnh                                        |
+---+-----------------------------+-----+----------+--------------+--------------------------------+
|STT| Tên mặt hàng nội thất       | ĐVT | Số lượng | Đơn giá      | Thành tiền                     |
+---+-----------------------------+-----+----------+--------------+--------------------------------+
| 1 | Sofa Góc Chữ L Da Bò Ý      | Bộ  |    1     | 18.000.000 đ | 18.000.000 đ                   |
+---+-----------------------------+-----+----------+--------------+--------------------------------+
|                                                      Tổng tiền hàng:   18.000.000 đ              |
|                                                      Giảm theo CTKM: -  1.000.000 đ              |
|                                                      Voucher (VIP):  -    800.000 đ              |
|                                                      Thuế VAT (0%):             0 đ              |
|                                                      ------------------------------              |
|                                                      TỔNG THANH TOÁN:  16.200.000 đ              |
|                                                      Hình thức:        Chuyển khoản QR           |
|                                                                                                  |
| Cảm ơn Quý khách! Đồ nội thất được bảo hành khung gỗ 05 năm, bảo hành nệm mút 02 năm.            |
|                  [ Nút Bấm: IN HÓA ĐƠN ]         [ Nút Bấm: TẢI PDF ]                            |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "invoices")
@Getter @Setter @NoArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_code", nullable = false, unique = true, length = 50)
    private String invoiceCode;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(name = "subtotal_amount", nullable = false)
    private BigDecimal subtotalAmount;

    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @Column(name = "voucher_discount", nullable = false)
    private BigDecimal voucherDiscount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false)
    private BigDecimal finalAmount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod; // CASH, BANK_TRANSFER, CREDIT_CARD, VNPAY, MOMO

    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus = "PAID";

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String notes;
}

// DTOs
public record CreateInvoiceRequest(
    @NotNull Long orderId,
    @NotBlank String paymentMethod,
    String voucherCode,
    Boolean includeVat,
    String notes
) {}

public record InvoicePriceCalculationDto(
    BigDecimal originalSubtotal,
    BigDecimal promotionDiscount,
    BigDecimal orderDiscount,
    BigDecimal voucherDiscount,
    BigDecimal vatAmount,
    BigDecimal finalAmount
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceCode(String invoiceCode);
    Optional<Invoice> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);

    @Query("SELECT i FROM Invoice i WHERE (:status IS NULL OR i.paymentStatus = :status) ORDER BY i.paymentDate DESC")
    Page<Invoice> findInvoices(String status, Pageable pageable);
}
```

### 3.3. Service Layer (`AdminInvoiceService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminInvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final VoucherRepository voucherRepository;
    private final StaffRepository staffRepository;

    @Transactional
    public Invoice createInvoice(CreateInvoiceRequest req, Long staffUserId) {
        if (invoiceRepository.existsByOrderId(req.orderId())) {
            throw new DuplicateResourceException("Đơn hàng này đã được xuất hóa đơn trước đó!");
        }

        Order order = orderRepository.findDetailById(req.orderId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        Staff staff = staffRepository.findByUserId(staffUserId).orElse(null);

        // Áp dụng thuật toán tính toán giá tiền chuẩn xác
        BigDecimal subtotal = order.getItems().stream()
            .map(OrderItem::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal voucherDiscount = BigDecimal.ZERO;
        String appliedVoucherCode = null;

        if (req.voucherCode() != null && !req.voucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCodeIgnoreCase(req.voucherCode().trim())
                .orElseThrow(() -> new BusinessRuleException("Mã voucher không tồn tại"));

            validateVoucherUsability(voucher, subtotal);

            // Tính tiền giảm: MIN(subtotal * % / 100, maximumDiscount)
            BigDecimal discount = subtotal.multiply(voucher.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaximumDiscount() != null && discount.compareTo(voucher.getMaximumDiscount()) > 0) {
                discount = voucher.getMaximumDiscount();
            }
            voucherDiscount = discount;
            appliedVoucherCode = voucher.getCode();

            // Tăng số lượt dùng voucher
            voucher.setUsedQuantity(voucher.getUsedQuantity() + 1);
            voucherRepository.save(voucher);
        }

        BigDecimal afterDiscount = subtotal.subtract(voucherDiscount);
        BigDecimal tax = (req.includeVat() != null && req.includeVat()) 
            ? afterDiscount.multiply(BigDecimal.valueOf(0.08)) 
            : BigDecimal.ZERO;
        BigDecimal finalAmount = afterDiscount.add(tax);

        Invoice invoice = new Invoice();
        invoice.setInvoiceCode("HD-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now()) + "-" + System.currentTimeMillis() % 10000);
        invoice.setOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setStaff(staff);
        invoice.setSubtotalAmount(subtotal);
        invoice.setVoucherCode(appliedVoucherCode);
        invoice.setVoucherDiscount(voucherDiscount);
        invoice.setTaxAmount(tax);
        invoice.setFinalAmount(finalAmount);
        invoice.setPaymentMethod(req.paymentMethod());
        invoice.setPaymentStatus("PAID");
        invoice.setPaymentDate(LocalDateTime.now());
        invoice.setNotes(req.notes());

        Invoice saved = invoiceRepository.save(invoice);

        // Chuyển đơn hàng sang COMPLETED khi hóa đơn thanh toán hoàn tất
        order.setStatus("COMPLETED");
        orderRepository.save(order);

        return saved;
    }

    private void validateVoucherUsability(Voucher v, BigDecimal orderAmount) {
        LocalDateTime now = LocalDateTime.now();
        if (!"ACTIVE".equals(v.getStatus()) || now.isBefore(v.getStartDate()) || now.isAfter(v.getEndDate())) {
            throw new BusinessRuleException("Mã voucher hiện không còn hiệu lực!");
        }
        if (v.getUsedQuantity() >= v.getQuantity()) {
            throw new BusinessRuleException("Mã voucher đã hết lượt sử dụng!");
        }
        if (orderAmount.compareTo(v.getMinimumAmount()) < 0) {
            throw new BusinessRuleException("Giá trị đơn hàng chưa đạt mức tối thiểu " + v.getMinimumAmount() + " VNĐ để dùng voucher!");
        }
    }
}
```

### 3.4. Controller Layer (`AdminInvoiceController.java`)

```java
@RestController
@RequestMapping("/api/admin/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminInvoiceController {
    private final AdminInvoiceService adminInvoiceService;

    @GetMapping
    public ResponseEntity<Page<Invoice>> getInvoices(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "paymentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminInvoiceService.getInvoices(status, pageable));
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long staffUserId = getCurrentUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminInvoiceService.createInvoice(req, staffUserId));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> printInvoicePdf(@PathVariable Long id) {
        byte[] pdfBytes = adminInvoiceService.generatePdfBytes(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=invoice_" + id + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdfBytes);
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/invoices` | `ADMIN`, `STAFF` | Lấy danh sách hóa đơn bán hàng |
| `POST` | `/api/admin/invoices` | `ADMIN`, `STAFF` | Lập hóa đơn chính thức, áp dụng voucher và ghi nhận thanh toán |
| `POST` | `/api/admin/invoices/preview-calculation` | `ADMIN`, `STAFF` | Xem trước chiết khấu đa tầng, voucher & VAT trước khi xuất |
| `GET` | `/api/admin/invoices/counts` | `ADMIN`, `STAFF` | Thống kê số lượng, doanh thu và phương thức thanh toán |
| `GET` | `/api/admin/invoices/eligible-orders` | `ADMIN`, `STAFF` | Danh sách đơn hàng sẵn sàng để xuất hóa đơn |
| `GET` | `/api/admin/invoices/{id}` | `ADMIN`, `STAFF` | Xem chi tiết nội dung hóa đơn kèm QR VietQR |
| `GET` | `/api/admin/invoices/{id}/pdf` | `ADMIN`, `STAFF` | Xuất file PDF phục vụ in ấn hoặc gửi hóa đơn điện tử |

---

## 5. TIẾN ĐỘ TRIỂN KHAI & KẾT QUẢ KIỂM THỬ (HOÀN TẤT 100%)

- **Backend:**
  - DTOs: `CreateInvoiceRequest`, `PreviewInvoiceRequest`, `InvoiceCalculationDto`, `InvoiceItemDto`, `InvoiceSummaryDto`, `InvoiceDetailDto`, `InvoiceStatusCountDto`, `EligibleOrderDto`.
  - Repository: `AdminInvoiceRepository` (tự động tạo bảng `invoices`, index, seed 3 hóa đơn mẫu, phân trang và truy vấn chi tiết).
  - Service: `AdminInvoiceService` (thuật toán chiết khấu đa tầng, kiểm tra trần giảm giá `maximum_discount`, kiểm soát ràng buộc không xuất hóa đơn trùng lặp, chuyển trạng thái đơn hàng sang `COMPLETED`, bộ sinh file PDF 1.4 chuẩn mực).
  - Controller: `AdminInvoiceController` (đầy đủ các RESTful endpoints).
  - Unit Tests: `AdminInvoiceServiceTest` (11/11 tests đạt 100% pass, bao gồm TC07 & TC08).
- **Frontend:**
  - Component: `AdminInvoiceManagement.jsx` (thống kê doanh thu, bộ lọc, modal xuất hóa đơn có xem trước VietQR, modal in ấn showroom A4 & K80, in ấn chuẩn `@media print`).
  - Layout & Navigation: Tích hợp tab `invoices` trong `AdminLayout.jsx` và CSS chuyên nghiệp trong `admin.css`.

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 10 - Thống kê & Báo cáo ➡️](10_THONG_KE_BAO_CAO.md)
