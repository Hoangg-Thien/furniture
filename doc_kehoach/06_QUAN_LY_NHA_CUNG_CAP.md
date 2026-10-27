# TÀI LIỆU MODULE 06: QUẢN LÝ NHÀ CUNG CẤP NỘI THẤT
## ĐỐI TÁC CUNG ỨNG VẬT TƯ & LỊCH SỬ NHẬP KHO NỘI THẤT

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 07 - Quản lý Khuyến mãi & Voucher ➡️](07_QUAN_LY_KHUYEN_MAI_VOUCHER.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý danh bạ đối tác cung cấp nội thất trong bảng `suppliers`: Xưởng mộc gia công gỗ sồi/óc chó, nhà máy đá nhân tạo/ceramic, công ty phụ kiện ray trượt bản lề, nhà cung cấp da bò và vải nỉ.
- Thông tin lưu trữ: Tên đơn vị, Người đại diện, Số điện thoại, Email, Địa chỉ xưởng/kho.
- **Theo dõi Phiếu nhập kho (`purchase_receipts` & `purchase_receipt_items`)**:
  - Ghi nhận mỗi lần nhập lô hàng nội thất mới từ nhà cung cấp: Ngày nhập, Nhân viên lập phiếu (`staff_id`), Tổng tiền hàng nhập.
  - Khi phiếu nhập ở trạng thái `COMPLETED`, số lượng hàng hóa sẽ được tự động cộng vào kho sản phẩm (`products.quantity`).

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Danh sách Nhà Cung Cấp

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý nhà cung cấp nội thất                                 [+ Thêm nhà cung cấp]  |
+--------------------------------------------------------------------------------------------------+
| [🔍 Tìm kiếm theo Tên nhà cung cấp / SĐT / Địa chỉ...]                              [Nút Tìm]    |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH NHÀ CUNG CẤP VẬT TƯ & SẢN PHẨM NỘI THẤT                                                |
+-----+-------------------------------+---------------+-------------------+----------+-------------+
| ID  | Tên nhà cung cấp / Xưởng      | Số điện thoại | Email liên hệ     | Lần nhập | Thao tác    |
+-----+-------------------------------+---------------+-------------------+----------+-------------+
| N01 | Xưởng Gỗ Sồi Hoàng Anh Gia Lai| 028 3822 9999 | contact@hagl.vn   | 14 lần   | [✏️] [📜 Lịch]|
| N02 | Xưởng Da & Sofa Tân Bình Phát | 0903 555 777  | sales@tanbinh.com | 8 lần    | [✏️] [📜 Lịch]|
| N03 | Phụ Kiện Nội Thất Hafele VN   | 024 3788 1234 | info@hafele.vn    | 22 lần   | [✏️] [📜 Lịch]|
+-----+-------------------------------+---------------+-------------------+----------+-------------+
| Hiển thị 1 - 3 trên 18 nhà cung cấp                           [ < Trang trước ] [ 1 ] [ Trang sau > ] |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Modal Lịch sử Nhập hàng theo Nhà cung cấp
- Bấm vào nút `[📜 Lịch sử]` sẽ mở danh sách các phiếu nhập hàng:
  - Mã phiếu nhập (#PR-001), Ngày nhập, Nhân viên lập phiếu, Tổng giá trị nhập (VNĐ), Trạng thái (PENDING / COMPLETED / CANCELLED).
  - Chi tiết từng mặt hàng nhập: Tên sản phẩm, Số lượng, Đơn vị tính, Giá vốn nhập.

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "suppliers")
@Getter @Setter @NoArgsConstructor
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @OneToMany(mappedBy = "supplier")
    private List<PurchaseReceipt> receipts = new ArrayList<>();
}

// DTOs
public record SupplierRequest(
    @NotBlank String name,
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ") String phone,
    @Email String email,
    String address
) {}

public record SupplierResponse(
    Long id,
    String name,
    String phone,
    String email,
    String address,
    Long totalReceiptsCount
) {}

public record PurchaseReceiptSummaryDto(
    Long id,
    String staffName,
    LocalDateTime receiptDate,
    String status,
    BigDecimal totalAmount
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    
    @Query("""
        SELECT new furniture.admin.supplier.dto.SupplierResponse(
            s.id, s.name, s.phone, s.email, s.address, COUNT(pr.id)
        )
        FROM Supplier s
        LEFT JOIN PurchaseReceipt pr ON pr.supplier.id = s.id
        WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR s.phone LIKE CONCAT('%', :search, '%'))
        GROUP BY s.id, s.name, s.phone, s.email, s.address
        ORDER BY s.id ASC
    """)
    List<SupplierResponse> findAllWithReceiptCount(@Param("search") String search);
}
```

### 3.3. Service Layer (`AdminSupplierService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminSupplierService {
    private final SupplierRepository supplierRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;

    public List<SupplierResponse> getAllSuppliers(String search) {
        return supplierRepository.findAllWithReceiptCount(search);
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest req) {
        Supplier s = new Supplier();
        s.setName(req.name());
        s.setPhone(req.phone());
        s.setEmail(req.email());
        s.setAddress(req.address());
        Supplier saved = supplierRepository.save(s);
        return new SupplierResponse(saved.getId(), saved.getName(), saved.getPhone(), saved.getEmail(), saved.getAddress(), 0L);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest req) {
        Supplier s = supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp"));
        s.setName(req.name());
        s.setPhone(req.phone());
        s.setEmail(req.email());
        s.setAddress(req.address());
        supplierRepository.save(s);
        return new SupplierResponse(s.getId(), s.getName(), s.getPhone(), s.getEmail(), s.getAddress(), (long) s.getReceipts().size());
    }

    public List<PurchaseReceiptSummaryDto> getReceiptHistory(Long supplierId) {
        return purchaseReceiptRepository.findBySupplierIdOrderByReceiptDateDesc(supplierId);
    }
}
```

### 3.4. Controller Layer (`AdminSupplierController.java`)

```java
@RestController
@RequestMapping("/api/admin/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminSupplierController {
    private final AdminSupplierService adminSupplierService;

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAll(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminSupplierService.getAllSuppliers(search));
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminSupplierService.createSupplier(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.ok(adminSupplierService.updateSupplier(id, req));
    }

    @GetMapping("/{id}/receipts")
    public ResponseEntity<List<PurchaseReceiptSummaryDto>> getReceipts(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupplierService.getReceiptHistory(id));
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/suppliers` | `ADMIN`, `STAFF` | Lấy danh sách nhà cung cấp kèm số phiếu nhập |
| `POST` | `/api/admin/suppliers` | `ADMIN`, `STAFF` | Thêm nhà cung cấp nội thất mới |
| `PUT` | `/api/admin/suppliers/{id}` | `ADMIN`, `STAFF` | Cập nhật thông tin đối tác cung ứng |
| `GET` | `/api/admin/suppliers/{id}/receipts` | `ADMIN`, `STAFF` | Xem lịch sử các đợt nhập hàng từ nhà cung cấp này |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 07 - Quản lý Khuyến mãi & Voucher ➡️](07_QUAN_LY_KHUYEN_MAI_VOUCHER.md)
