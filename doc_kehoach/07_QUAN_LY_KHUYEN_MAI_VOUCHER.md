# TÀI LIỆU MODULE 07: QUẢN LÝ CHƯƠNG TRÌNH KHUYẾN MÃI & VOUCHER
## TIẾP THỊ, GIẢM GIÁ SẢN PHẨM, CHIẾT KHẤU ĐƠN HÀNG & PHIẾU QUÀ TẶNG

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 08 - Quản lý Đơn đặt hàng ➡️](08_QUAN_LY_DON_DAT_HANG.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

Hệ thống quản lý chương trình khuyến mãi nội thất (`promotion_programs`) được thiết kế linh hoạt với 3 cơ chế chiết khấu:
1. **Giảm giá trực tiếp theo Sản phẩm (`product_discounts`)**: Áp dụng cho danh sách các món đồ nội thất cụ thể (VD: Giảm 20% cho toàn bộ Sofa da Ý trong mùa hè).
2. **Chiết khấu theo Giá trị đơn hàng (`order_discounts`)**: Kích thích khách hàng mua trọn bộ nội thất căn hộ (VD: Đơn từ 30 triệu giảm 5%, đơn từ 60 triệu giảm 10%).
3. **Mã giảm giá / Voucher (`vouchers`)**: Phát hành các mã ký tự (VD: `CHAOXUAN2026`, `NOITHAT10`), giới hạn số lượt sử dụng (`quantity`), mức giảm tối đa (`maximum_discount`), giá trị đơn tối thiểu (`minimum_amount`) và thời hạn hiệu lực.
- Trạng thái vòng đời chiến dịch: `DRAFT` (Bản nháp) ➔ `ACTIVE` (Đang chạy) ➔ `INACTIVE` (Đã kết thúc).

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Danh sách Chiến dịch Khuyến mãi

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Chương trình khuyến mãi                                       [+ Tạo chiến dịch mới] |
+--------------------------------------------------------------------------------------------------+
| [Trạng thái: Tất cả v]   [Thời gian: Đang diễn ra v]   [Tìm kiếm theo tên chiến dịch...]   [Lọc] |
+--------------------------------------------------------------------------------------------------+
| CÁC CHIẾN DỊCH KHUYẾN MÃI                                                                        |
+-----+---------------------------+------------+------------+---------------+------------+---------+
| ID  | Tên chương trình          | Bắt đầu    | Kết thúc   | Loại áp dụng  | Trạng thái | Thao tác|
+-----+---------------------------+------------+------------+---------------+------------+---------+
| P01 | Tri Ân Mùa Cưới 2026      | 2026-10-01 | 2026-11-15 | SP + Voucher  | [ACTIVE]   | [✏️][👁️] |
| P02 | Khai Trương Showroom Mới  | 2026-11-01 | 2026-11-30 | Bậc đơn hàng  | [DRAFT]    | [✏️][👁️] |
| P03 | Xả Kho Bàn Ghế Gỗ Sồi     | 2026-09-01 | 2026-09-30 | Giảm giá SP   | [INACTIVE] | [👁️]    |
+-----+---------------------------+------------+------------+---------------+------------+---------+
| Hiển thị 1 - 3 trên 8 chiến dịch                              [ < Trang trước ] [ 1 ] [ Trang sau > ] |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Giao diện Chi tiết & Cấu hình Chiến dịch
- **Khu vực 1: Thông tin tổng quan**: Tên chiến dịch, Mô tả chương trình, Thời gian bắt đầu - kết thúc, Trạng thái (Bật/Tắt).
- **Khu vực 2: Danh sách sản phẩm giảm giá (`product_discounts`)**:
  - Bảng chọn sản phẩm, nhập % giảm giá cho từng mặt hàng (1% - 100%).
- **Khu vực 3: Chiết khấu bậc đơn hàng (`order_discounts`)**:
  - Nhập mức chi tiêu tối thiểu (VNĐ) và % giảm giá tương ứng.
- **Khu vực 4: Quản lý Kho Voucher của chiến dịch (`vouchers`)**:
  - Bảng danh sách mã: Mã Code, % Giảm, Giảm tối đa, Số lượng phát hành, Đã dùng, Hạn dùng.
  - Nút "+ Thêm mã Voucher mới" hoặc "Sinh mã hàng loạt".
  - Thanh tiến trình thể hiện % lượng voucher đã được khách kích hoạt.

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entities
@Entity
@Table(name = "promotion_programs")
@Getter @Setter @NoArgsConstructor
public class PromotionProgram {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false, length = 30)
    private String status = "DRAFT"; // 'DRAFT', 'ACTIVE', 'INACTIVE'
}

@Entity
@Table(name = "vouchers")
@Getter @Setter @NoArgsConstructor
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_program_id", nullable = false)
    private PromotionProgram promotionProgram;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private BigDecimal discountPercent;

    @Column(name = "minimum_amount", nullable = false)
    private BigDecimal minimumAmount = BigDecimal.ZERO;

    @Column(name = "maximum_discount")
    private BigDecimal maximumDiscount;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "used_quantity", nullable = false)
    private Integer usedQuantity = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";
}

// Request & Response DTOs
public record CreateProgramRequest(
    @NotBlank String name,
    String description,
    @NotNull LocalDateTime startDate,
    @NotNull LocalDateTime endDate,
    String status
) {}

public record CreateVoucherRequest(
    @NotBlank String code,
    @NotNull @DecimalMin("1.0") @DecimalMax("100.0") BigDecimal discountPercent,
    @DecimalMin("0.0") BigDecimal minimumAmount,
    BigDecimal maximumDiscount,
    @NotNull @Min(1) Integer quantity,
    @NotNull LocalDateTime startDate,
    @NotNull LocalDateTime endDate
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface PromotionProgramRepository extends JpaRepository<PromotionProgram, Long> {
    List<PromotionProgram> findByStatus(String status);
}

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    List<Voucher> findByPromotionProgramId(Long programId);
}
```

### 3.3. Service Layer (`AdminPromotionService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminPromotionService {
    private final PromotionProgramRepository programRepository;
    private final VoucherRepository voucherRepository;

    @Transactional
    public PromotionProgram createProgram(CreateProgramRequest req) {
        if (req.endDate().isBefore(req.startDate())) {
            throw new BusinessRuleException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
        }
        PromotionProgram p = new PromotionProgram();
        p.setName(req.name());
        p.setDescription(req.description());
        p.setStartDate(req.startDate());
        p.setEndDate(req.endDate());
        p.setStatus(req.status() != null ? req.status() : "DRAFT");
        return programRepository.save(p);
    }

    @Transactional
    public Voucher createVoucher(Long programId, CreateVoucherRequest req) {
        PromotionProgram p = programRepository.findById(programId)
            .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch khuyến mãi không tồn tại"));

        if (voucherRepository.existsByCodeIgnoreCase(req.code())) {
            throw new DuplicateResourceException("Mã voucher '" + req.code() + "' đã tồn tại!");
        }

        Voucher v = new Voucher();
        v.setPromotionProgram(p);
        v.setCode(req.code().trim().toUpperCase());
        v.setDiscountPercent(req.discountPercent());
        v.setMinimumAmount(req.minimumAmount() != null ? req.minimumAmount() : BigDecimal.ZERO);
        v.setMaximumDiscount(req.maximumDiscount());
        v.setQuantity(req.quantity());
        v.setUsedQuantity(0);
        v.setStartDate(req.startDate());
        v.setEndDate(req.endDate());
        v.setStatus("ACTIVE");
        return voucherRepository.save(v);
    }
}
```

### 3.4. Controller Layer (`AdminPromotionController.java`)

```java
@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Cấu hình khuyến mãi dành riêng cho Quản trị viên
public class AdminPromotionController {
    private final AdminPromotionService adminPromotionService;

    @GetMapping
    public ResponseEntity<List<PromotionProgram>> getAllPrograms() {
        return ResponseEntity.ok(adminPromotionService.getAllPrograms());
    }

    @PostMapping
    public ResponseEntity<PromotionProgram> createProgram(@Valid @RequestBody CreateProgramRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminPromotionService.createProgram(req));
    }

    @PostMapping("/{id}/vouchers")
    public ResponseEntity<Voucher> createVoucher(@PathVariable Long id, @Valid @RequestBody CreateVoucherRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminPromotionService.createVoucher(id, req));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        adminPromotionService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/promotions` | `ADMIN`, `STAFF` | Danh sách các chương trình khuyến mãi (kèm lọc tìm kiếm & trạng thái) |
| `GET` | `/api/admin/promotions/{id}` | `ADMIN`, `STAFF` | Chi tiết thông tin chung của chiến dịch |
| `GET` | `/api/admin/promotions/{id}/detail` | `ADMIN`, `STAFF` | Chi tiết đầy đủ chiến dịch (SP giảm giá, Bậc đơn hàng, Kho voucher) |
| `POST` | `/api/admin/promotions` | `ADMIN` | Tạo chiến dịch khuyến mãi mới |
| `PUT` | `/api/admin/promotions/{id}` | `ADMIN` | Cập nhật thông tin chiến dịch |
| `PUT` | `/api/admin/promotions/{id}/status` | `ADMIN` | Bật/Tắt trạng thái chiến dịch (`ACTIVE`/`INACTIVE`/`DRAFT`) |
| `DELETE` | `/api/admin/promotions/{id}` | `ADMIN` | Xóa chiến dịch (chặn xóa nếu có voucher đã dùng trong đơn hàng) |
| `POST` | `/api/admin/promotions/{id}/product-discounts` | `ADMIN` | Thêm sản phẩm giảm giá vào chiến dịch |
| `DELETE` | `/api/admin/promotions/{id}/product-discounts/{discountId}` | `ADMIN` | Gỡ bỏ giảm giá sản phẩm |
| `POST` | `/api/admin/promotions/{id}/order-discounts` | `ADMIN` | Thêm chiết khấu theo bậc giá trị đơn hàng |
| `DELETE` | `/api/admin/promotions/{id}/order-discounts/{discountId}` | `ADMIN` | Gỡ bỏ chiết khấu bậc đơn hàng |
| `GET` | `/api/admin/promotions/vouchers` | `ADMIN`, `STAFF` | Xem toàn bộ danh sách kho Voucher |
| `POST` | `/api/admin/promotions/{id}/vouchers` | `ADMIN` | Phát hành mã Voucher mới gắn vào chiến dịch |
| `PUT` | `/api/admin/promotions/vouchers/{voucherId}/status` | `ADMIN` | Bật/Tắt trạng thái voucher (`ACTIVE`/`INACTIVE`) |
| `DELETE` | `/api/admin/promotions/vouchers/{voucherId}` | `ADMIN` | Xóa voucher (chặn xóa nếu đã có khách dùng) |

---

## 5. TÌNH TRẠNG TRIỂN KHAI THỰC TẾ (STATUS: ✅ ĐÃ HOÀN THIỆN 100%)

- **Backend (Spring Boot JDBC Direct):**
  - Model DTOs: `CreateProgramRequest`, `ProgramResponse`, `ProgramDetailResponse`, `ProductDiscountDto`, `CreateProductDiscountRequest`, `OrderDiscountDto`, `CreateOrderDiscountRequest`, `VoucherDto`, `CreateVoucherRequest`.
  - Repository: `AdminPromotionRepository.java` (đồng bộ sequence, truy vấn 3 cơ chế chiết khấu: sản phẩm, bậc đơn hàng, voucher, tính giá sau giảm, kiểm tra ràng buộc đơn hàng).
  - Service: `AdminPromotionService.java` (kiểm tra tính hợp lệ ngày bắt đầu/kết thúc, chống trùng lặp mã voucher và tên chiến dịch, chặn xóa dữ liệu kế toán đã phát sinh đơn).
  - Controller: `AdminPromotionController.java` (15 RESTful endpoints chuyên sâu).
  - Unit Tests: `AdminPromotionServiceTest.java` (15/15 unit tests đạt chuẩn 100%).
- **Frontend (React Vite Admin UI):**
  - Component: `AdminPromotionManagement.jsx` (4 Thẻ KPI thống kê, lọc tìm kiếm đa năng theo trạng thái & thời gian, bảng chiến dịch trực quan, modal cấu hình 4 Tab: Tổng quan, SP giảm giá, Bậc đơn hàng và Phát hành Kho Voucher với thanh tiến trình lượt dùng).
  - Điều hướng: Tích hợp hoàn tất vào `AdminLayout.jsx` và `AdminSidebar.jsx` (Module `promotions`).

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 08 - Quản lý Đơn đặt hàng ➡️](08_QUAN_LY_DON_DAT_HANG.md)
