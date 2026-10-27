# TÀI LIỆU MODULE 02: QUẢN LÝ KHÁCH HÀNG
## HỒ SƠ KHÁCH HÀNG & PHÂN HẠNG TIÊU DÙNG (CRM)

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 03 - Quản lý Nhân viên ➡️](03_QUAN_LY_NHAN_VIEN.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý tập trung dữ liệu khách hàng trong bảng `customers` (liên kết 1-1 với `users` có `role = 'CUSTOMER'`).
- Theo dõi các chỉ số quan trọng phục vụ bán hàng nội thất:
  - Tổng số đơn hàng đã đặt thành công (`COMPLETED`).
  - Tổng giá trị chi tiêu trọn đời (Customer Lifetime Value - LTV).
  - Phân hạng khách hàng:
    - **VIP Diamond**: Tổng chi tiêu >= 50.000.000 VNĐ.
    - **Thân thiết (Gold)**: Tổng chi tiêu từ 15.000.000 đến dưới 50.000.000 VNĐ.
    - **Tiềm năng (Silver)**: Có ít nhất 1 đơn thành công.
    - **Khách hàng Mới**: Chưa phát sinh đơn hàng.
- Xem giỏ hàng hiện tại của khách hàng để nhân viên tư vấn hỗ trợ chốt đơn nội thất.
- Hỗ trợ nhân viên giao lắp liên hệ chính xác qua Họ tên, Số điện thoại và Địa chỉ chi tiết.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Danh sách Khách hàng

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý khách hàng                                            [📥 Xuất DS Khách hàng]|
+--------------------------------------------------------------------------------------------------+
| [Thanh tìm kiếm & Bộ lọc nâng cao]                                                               |
| [🔍 Tìm Tên / SĐT / Email...]   [Hạng: Tất cả v]   [Chi tiêu: Từ... Đến...]   [Nút Lọc]          |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH KHÁCH HÀNG                                                                             |
+-----+-------------------+---------------+------------------+---------+-----------+---------------+
| ID  | Họ và tên         | Số điện thoại | Email            | Số đơn  | Tổng mua  | Thao tác      |
+-----+-------------------+---------------+------------------+---------+-----------+---------------+
| C01 | Nguyễn Văn An     | 0901 234 567  | an.nv@gmail.com  | 4 đơn   | 68.500.000| [👁️ Xem] [✏️] |
| C02 | Trần Thị Mai      | 0912 888 999  | mai.tran@abc.vn  | 2 đơn   | 24.200.000| [👁️ Xem] [✏️] |
| C03 | Lê Hoàng Long     | 0988 111 222  | long.le@corp.com | 0 đơn   | 0 VNĐ     | [👁️ Xem] [✏️] |
+-----+-------------------+---------------+------------------+---------+-----------+---------------+
| Hiển thị 1 - 3 trên 120 khách hàng                            [ < Trước ] [ 1 ] [ 2 ] [ Sau > ]  |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Drawer / Modal Chi tiết Khách hàng (Customer Profile)
- **Tab 1: Thông tin liên lạc**:
  - Tên đầy đủ, Tên tài khoản, SĐT, Email, Địa chỉ giao hàng mặc định, Ngày tạo tài khoản.
  - Cho phép Admin/Staff chỉnh sửa và lưu trực tiếp.
- **Tab 2: Lịch sử đơn hàng**:
  - Bảng danh sách các đơn đã đặt: Mã đơn (#ID), Ngày đặt, Trạng thái (Pills), Tổng tiền, Chiết khấu voucher.
  - Nhấp vào mã đơn sẽ mở chi tiết đơn hàng tương ứng.
- **Tab 3: Giỏ hàng quan tâm**:
  - Hiển thị danh sách các món đồ nội thất đang nằm trong giỏ hàng (`carts` và `cart_items`) của khách nhưng chưa bấm đặt hàng (hỗ trợ telesale).

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "customers")
@Getter @Setter @NoArgsConstructor
public class Customer {
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
    private String role = "CUSTOMER";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

// Response Projection DTO
public record CustomerTableItemDto(
    Long id,
    String fullName,
    String phone,
    String email,
    String address,
    Long totalOrders,
    BigDecimal totalSpent,
    Boolean isUserActive,
    LocalDateTime createdAt
) {}

// Detail DTO
public record CustomerDetailResponse(
    Long id,
    String username,
    String fullName,
    String phone,
    String email,
    String address,
    BigDecimal totalSpent,
    List<OrderSummaryDto> recentOrders,
    List<CartItemDto> currentCartItems
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    @Query("""
        SELECT new furniture.admin.customer.dto.CustomerTableItemDto(
            c.id, c.fullName, c.phone, c.email, c.address,
            COUNT(o.id),
            COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.totalAmount ELSE 0 END), 0),
            c.user.isActive,
            c.createdAt
        )
        FROM Customer c
        LEFT JOIN Order o ON o.customer.id = c.id
        WHERE (:kw IS NULL OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :kw, '%')) 
           OR c.phone LIKE CONCAT('%', :kw, '%') 
           OR LOWER(c.email) LIKE LOWER(CONCAT('%', :kw, '%')))
        GROUP BY c.id, c.fullName, c.phone, c.email, c.address, c.user.isActive, c.createdAt
    """)
    Page<CustomerTableItemDto> findAllCustomersWithStats(@Param("kw") String keyword, Pageable pageable);
}
```

### 3.3. Service Layer (`AdminCustomerService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminCustomerService {
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;

    public Page<CustomerTableItemDto> getCustomers(String search, Pageable pageable) {
        return customerRepository.findAllCustomersWithStats(search, pageable);
    }

    public CustomerDetailResponse getCustomerDetails(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
        
        List<OrderSummaryDto> orders = orderRepository.findByCustomerIdOrderByOrderDateDesc(customerId);
        List<CartItemDto> cartItems = cartRepository.findItemsByCustomerId(customerId);
        BigDecimal totalSpent = orders.stream()
            .filter(o -> "COMPLETED".equals(o.status()))
            .map(OrderSummaryDto::totalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CustomerDetailResponse(
            customer.getId(),
            customer.getUser().getUsername(),
            customer.getFullName(),
            customer.getPhone(),
            customer.getEmail(),
            customer.getAddress(),
            totalSpent,
            orders,
            cartItems
        );
    }

    @Transactional
    public void updateCustomerProfile(Long customerId, UpdateCustomerRequest req) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
        customer.setFullName(req.fullName());
        customer.setPhone(req.phone());
        customer.setEmail(req.email());
        customer.setAddress(req.address());
        customerRepository.save(customer);
    }
}
```

### 3.4. Controller Layer (`AdminCustomerController.java`)

```java
@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminCustomerController {
    private final AdminCustomerService adminCustomerService;

    @GetMapping
    public ResponseEntity<Page<CustomerTableItemDto>> getCustomers(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCustomerService.getCustomers(search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDetailResponse> getCustomerDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminCustomerService.getCustomerDetails(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateCustomer(@PathVariable Long id, @Valid @RequestBody UpdateCustomerRequest req) {
        adminCustomerService.updateCustomerProfile(id, req);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/customers` | `ADMIN`, `STAFF` | Lấy danh sách khách hàng kèm số đơn và tổng chi tiêu |
| `GET` | `/api/admin/customers/{id}` | `ADMIN`, `STAFF` | Xem chi tiết khách hàng, lịch sử đơn hàng và giỏ hàng |
| `PUT` | `/api/admin/customers/{id}` | `ADMIN`, `STAFF` | Cập nhật thông tin liên hệ (Họ tên, SĐT, Email, Địa chỉ) |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 03 - Quản lý Nhân viên ➡️](03_QUAN_LY_NHAN_VIEN.md)
