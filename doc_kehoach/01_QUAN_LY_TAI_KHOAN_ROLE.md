# TÀI LIỆU MODULE 01: QUẢN LÝ TÀI KHOẢN VÀ ROLE
## QUẢN TRỊ NGƯỜI DÙNG & PHÂN QUYỀN TRUY CẬP

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 02 - Quản lý Khách hàng ➡️](02_QUAN_LY_KHACH_HANG.md)

> **Trạng thái thực tế**: ✅ **ĐÃ TRIỂN KHAI HOÀN THIỆN (FULLSTACK & TESTED)**
> - Backend: `AdminUserController`, `AdminUserService`, `AdminUserRepository`, DTOs
> - Frontend: `AdminUserManagement.jsx` (Tìm kiếm, Bộ lọc vai trò & trạng thái, Phân trang, Modal tạo tài khoản, Modal đổi mật khẩu, Khóa/Kích hoạt tài khoản)
> - Unit Testing: `AdminUserServiceTest` (Pass 100% các kịch bản và ràng buộc an toàn TC01)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý tập trung toàn bộ tài khoản đăng nhập trong bảng `users`.
- Định danh 3 vai trò (Role): `ADMIN` (Quản trị viên tối cao), `STAFF` (Nhân viên cửa hàng), `CUSTOMER` (Khách hàng mua sắm).
- Các chức năng chính:
  - Xem danh sách tài khoản kèm bộ lọc theo Role và trạng thái hoạt động.
  - Tạo tài khoản mới cho nhân viên nội bộ (`STAFF`) hoặc quản trị viên phụ tá (`ADMIN`).
  - Khóa (`is_active = false`) hoặc kích hoạt lại tài khoản.
  - Đặt lại mật khẩu (Reset Password) ngẫu nhiên hoặc gán mật khẩu mới an toàn.
- **Ràng buộc bảo mật**:
  - Không cho phép người dùng tự vô hiệu hóa/khóa chính tài khoản đang đăng nhập của mình.
  - Mật khẩu lưu trữ bắt buộc băm bằng `BCryptPasswordEncoder`.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Bố cục Trang Quản lý Tài khoản

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý tài khoản & Phân quyền                                   [+ Tạo tài khoản]   |
+--------------------------------------------------------------------------------------------------+
| [Thanh tìm kiếm & Bộ lọc]                                                                        |
| [🔍 Nhập username...]   [Tất cả vai trò v]   [Trạng thái: Hoạt động v]       [Nút Tìm kiếm]      |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH TÀI KHOẢN HỆ THỐNG                                                                     |
+-----+----------------+----------+-----------------------+-------------+--------------------------+
| ID  | Tên đăng nhập  | Vai trò  | Trạng thái            | Ngày tạo    | Hành động                |
+-----+----------------+----------+-----------------------+-------------+--------------------------+
| 001 | admin01        | [ADMIN]  | (•) Đang hoạt động    | 2026-10-01  | [Đổi MK] [🔒 Khóa]       |
| 002 | staff_hung     | [STAFF]  | (•) Đang hoạt động    | 2026-10-15  | [Đổi MK] [🔒 Khóa]       |
| 003 | staff_lan      | [STAFF]  | (x) Đã bị tạm khóa    | 2026-10-20  | [Đổi MK] [🔓 Kích hoạt]  |
| 004 | cus_hoang      | [CUSTOM] | (•) Đang hoạt động    | 2026-10-22  | [Đổi MK] [🔒 Khóa]       |
+-----+----------------+----------+-----------------------+-------------+--------------------------+
| Hiển thị 1 - 4 trên 35 tài khoản                              [ < Trang trước ] [ 1 ] [ Trang sau > ] |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Modal Popup Thêm mới / Đặt lại mật khẩu
- **Modal Thêm tài khoản**:
  - Tên đăng nhập: Input text (tối thiểu 4 ký tự, không dấu, không khoảng trắng).
  - Mật khẩu khởi tạo: Password input (kèm icon con mắt xem trước).
  - Chọn vai trò: Radio/Select chọn giữa `STAFF` hoặc `ADMIN`.
  - Trạng thái mặc định: Checkbox "Kích hoạt tài khoản ngay".
- **Hộp thoại Reset Password**:
  - Nút "Tạo mật khẩu ngẫu nhiên" và hiển thị mật khẩu mới để gửi cho nhân viên.

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 30)
    private String role; // 'ADMIN', 'STAFF', 'CUSTOMER'

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

// Request DTO
public record CreateUserRequest(
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 50, message = "Tên đăng nhập từ 4 đến 50 ký tự")
    String username,

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    String password,

    @Pattern(regexp = "ADMIN|STAFF", message = "Chỉ được tạo tài khoản ADMIN hoặc STAFF")
    String role
) {}

public record ResetPasswordRequest(
    @NotBlank @Size(min = 6) String newPassword
) {}

// Response DTO
public record UserSummaryResponse(
    Long id,
    String username,
    String role,
    Boolean isActive,
    LocalDateTime createdAt
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    
    @Query("SELECT u FROM User u WHERE (:role IS NULL OR u.role = :role) AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> searchUsers(String role, Boolean isActive, Pageable pageable);
}
```

### 3.3. Service Layer (`AdminUserService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại trong hệ thống");
        }
        User user = new User();
        user.setUsername(request.username().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setIsActive(true);
        userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public void toggleActiveStatus(Long targetUserId, Long currentLoggedInUserId) {
        if (targetUserId.equals(currentLoggedInUserId)) {
            throw new BusinessRuleException("Không được phép tự vô hiệu hóa tài khoản của chính mình!");
        }
        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + targetUserId));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
```

### 3.4. Controller Layer (`AdminUserController.java`)

```java
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN mới có quyền truy cập
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<UserSummaryResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.searchUsers(role, isActive, pageable));
    }

    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createUser(req));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleStatus(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        adminUserService.toggleActiveStatus(id, getCurrentUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req) {
        adminUserService.resetPassword(id, req.newPassword());
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/users` | `ADMIN` | Lấy danh sách tài khoản phân trang, lọc theo role & trạng thái |
| `POST` | `/api/admin/users` | `ADMIN` | Tạo tài khoản mới (Role STAFF / ADMIN) |
| `PUT` | `/api/admin/users/{id}/toggle-status` | `ADMIN` | Khóa hoặc mở khóa tài khoản người dùng |
| `PUT` | `/api/admin/users/{id}/reset-password` | `ADMIN` | Đặt lại mật khẩu mới cho tài khoản |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 02 - Quản lý Khách hàng ➡️](02_QUAN_LY_KHACH_HANG.md)
