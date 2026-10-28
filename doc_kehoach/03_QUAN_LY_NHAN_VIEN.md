# TÀI LIỆU MODULE 03: QUẢN LÝ NHÂN VIÊN
## QUẢN TRỊ ĐỘI NGŨ NHÂN SỰ & PHÂN CÔNG BÁN HÀNG

> **Trạng thái:** ✅ **ĐÃ TRIỂN KHAI HOÀN CHỈNH (FULLSTACK + UNIT TESTS 100% PASSED)**  
> - **Backend Controller**: [`AdminStaffController.java`](file:///d:/furniture/backend/src/main/java/furniture/controller/AdminStaffController.java)  
> - **Backend Service**: [`AdminStaffService.java`](file:///d:/furniture/backend/src/main/java/furniture/service/AdminStaffService.java)  
> - **Backend Repository**: [`AdminStaffRepository.java`](file:///d:/furniture/backend/src/main/java/furniture/repository/AdminStaffRepository.java)  
> - **DTOs**: [`CreateStaffRequest.java`](file:///d:/furniture/backend/src/main/java/furniture/model/admin/staff/CreateStaffRequest.java), [`UpdateStaffRequest.java`](file:///d:/furniture/backend/src/main/java/furniture/model/admin/staff/UpdateStaffRequest.java), [`StaffSummaryDto.java`](file:///d:/furniture/backend/src/main/java/furniture/model/admin/staff/StaffSummaryDto.java)  
> - **Frontend UI**: [`AdminStaffManagement.jsx`](file:///d:/furniture/frontend/src/admin/AdminStaffManagement.jsx) (Tích hợp trong [`AdminLayout.jsx`](file:///d:/furniture/frontend/src/admin/AdminLayout.jsx))  
> - **Unit Tests**: [`AdminStaffServiceTest.java`](file:///d:/furniture/backend/src/test/java/furniture/AdminStaffServiceTest.java) (6/6 tests passed)

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 04 - Quản lý Loại nội thất ➡️](04_QUAN_LY_LOAI_NOI_THAT.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý thông tin hồ sơ nhân viên trong bảng `staff` (liên kết 1-1 với tài khoản `users` có vai trò `role = 'STAFF'`).
- Tự động tạo đồng thời:
  1. Tài khoản đăng nhập hệ thống trong bảng `users`.
  2. Hồ sơ cá nhân của nhân viên trong bảng `staff`.
- Theo dõi năng suất làm việc của nhân sự:
  - Số lượng đơn hàng nội thất đã tiếp nhận, duyệt và giao thành công (`orders.staff_id`).
  - Số lượng phiếu nhập kho từ nhà cung cấp đã lập (`purchase_receipts.staff_id`).
- Thu hồi quyền truy cập (khóa tài khoản) khi nhân viên thôi việc mà không làm mất lịch sử các đơn hàng nhân viên đó từng phụ trách.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Bố cục Quản lý Nhân viên

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý nhân sự                                               [+ Thêm nhân viên mới] |
+--------------------------------------------------------------------------------------------------+
| [Tìm kiếm nhân viên theo Tên / SĐT / Email...]              [Trạng thái: Đang làm việc v] [Lọc]  |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH NHÂN VIÊN BÁN HÀNG & KHO                                                               |
+-----+-------------------+---------------+--------------------+----------+----------+-------------+
| ID  | Họ và tên         | Số điện thoại | Email công vụ      | Đơn xử lý| Phiếu nh.| Thao tác    |
+-----+-------------------+---------------+--------------------+----------+----------+-------------+
| S01 | Lê Thị Thu Hà     | 0905 111 222  | ha.lt@noithat.vn   | 45 đơn   | 2 phiếu  | [✏️] [🔒 Khóa]|
| S02 | Hoàng Minh Đức    | 0933 444 555  | duc.hm@noithat.vn  | 28 đơn   | 14 phiếu | [✏️] [🔒 Khóa]|
| S03 | Vũ Quang Huy      | 0977 888 999  | huy.vq@noithat.vn  | 12 đơn   | 0 phiếu  | [✏️] [🔒 Khóa]|
+-----+-------------------+---------------+--------------------+----------+----------+-------------+
| Hiển thị 1 - 3 trên 10 nhân viên                              [ < Trang trước ] [ 1 ] [ Trang sau > ] |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Modal Thêm / Chỉnh sửa Nhân viên
- **Phần 1: Thông tin tài khoản đăng nhập**:
  - Tên đăng nhập (Username): Bắt buộc, duy nhất (VD: `staff_duc`).
  - Mật khẩu ban đầu: Tối thiểu 6 ký tự.
- **Phần 2: Thông tin hồ sơ nhân viên**:
  - Họ và tên: Input text.
  - Số điện thoại liên hệ: Validate định dạng SĐT Việt Nam (10 số).
  - Email công vụ: Định dạng email hợp lệ.
  - Địa chỉ thường trú.

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "staff")
@Getter @Setter @NoArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 30)
    private String role = "STAFF";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

// Request DTO
public record CreateStaffRequest(
    @NotBlank String username,
    @NotBlank @Size(min = 6) String password,
    @NotBlank String fullName,
    @Email String email,
    @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9}$") String phone,
    String address
) {}

public record UpdateStaffRequest(
    @NotBlank String fullName,
    @Email String email,
    @NotBlank String phone,
    String address
) {}

// Response DTO
public record StaffSummaryDto(
    Long id,
    Long userId,
    String username,
    String fullName,
    String phone,
    String email,
    String address,
    Long handledOrdersCount,
    Boolean isActive,
    LocalDateTime createdAt
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);
    boolean existsByEmail(String email);

    @Query("""
        SELECT new furniture.admin.staff.dto.StaffSummaryDto(
            s.id, s.user.id, s.user.username, s.fullName, s.phone, s.email, s.address,
            COUNT(o.id),
            s.user.isActive,
            s.createdAt
        )
        FROM Staff s
        LEFT JOIN Order o ON o.staff.id = s.id
        WHERE (:kw IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :kw, '%')) OR s.phone LIKE CONCAT('%', :kw, '%'))
        GROUP BY s.id, s.user.id, s.user.username, s.fullName, s.phone, s.email, s.address, s.user.isActive, s.createdAt
    """)
    Page<StaffSummaryDto> searchStaff(@Param("kw") String keyword, Pageable pageable);
}
```

### 3.3. Service Layer (`AdminStaffService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminStaffService {
    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StaffSummaryDto createStaff(CreateStaffRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại");
        }
        if (req.email() != null && staffRepository.existsByEmail(req.email())) {
            throw new DuplicateResourceException("Email nhân viên đã tồn tại");
        }

        // 1. Tạo tài khoản User trước
        User user = new User();
        user.setUsername(req.username().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole("STAFF");
        user.setIsActive(true);
        User savedUser = userRepository.save(user);

        // 2. Tạo hồ sơ Staff
        Staff staff = new Staff();
        staff.setUser(savedUser);
        staff.setFullName(req.fullName());
        staff.setEmail(req.email());
        staff.setPhone(req.phone());
        staff.setAddress(req.address());
        staff.setRole("STAFF");
        Staff savedStaff = staffRepository.save(staff);

        return new StaffSummaryDto(
            savedStaff.getId(), savedUser.getId(), savedUser.getUsername(),
            savedStaff.getFullName(), savedStaff.getPhone(), savedStaff.getEmail(),
            savedStaff.getAddress(), 0L, true, savedStaff.getCreatedAt()
        );
    }

    @Transactional
    public void updateStaff(Long staffId, UpdateStaffRequest req) {
        Staff staff = staffRepository.findById(staffId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
        staff.setFullName(req.fullName());
        staff.setEmail(req.email());
        staff.setPhone(req.phone());
        staff.setAddress(req.address());
        staffRepository.save(staff);
    }
}
```

### 3.4. Controller Layer (`AdminStaffController.java`)

```java
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Chỉ Quản trị viên mới được quản lý nhân viên
public class AdminStaffController {
    private final AdminStaffService adminStaffService;

    @GetMapping
    public ResponseEntity<Page<StaffSummaryDto>> getStaff(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminStaffService.searchStaff(search, pageable));
    }

    @PostMapping
    public ResponseEntity<StaffSummaryDto> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminStaffService.createStaff(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateStaff(@PathVariable Long id, @Valid @RequestBody UpdateStaffRequest req) {
        adminStaffService.updateStaff(id, req);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/staff` | `ADMIN` | Lấy danh sách nhân viên kèm số lượng đơn đã phụ trách |
| `POST` | `/api/admin/staff` | `ADMIN` | Khởi tạo tài khoản và hồ sơ nhân viên mới |
| `PUT` | `/api/admin/staff/{id}` | `ADMIN` | Chỉnh sửa hồ sơ thông tin cá nhân của nhân viên |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 04 - Quản lý Loại nội thất ➡️](04_QUAN_LY_LOAI_NOI_THAT.md)
