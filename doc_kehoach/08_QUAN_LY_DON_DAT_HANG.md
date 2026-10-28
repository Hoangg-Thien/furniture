# TÀI LIỆU MODULE 08: QUẢN LÝ ĐƠN ĐẶT HÀNG (ORDERS)
## QUY TRÌNH XỬ LÝ VÒNG ĐỜI ĐƠN HÀNG, ĐIỀU PHỐI VÀ HOÀN TRẢ

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 09 - Quản lý Hóa đơn ➡️](09_QUAN_LY_HOA_DON.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý toàn bộ vòng đời đơn đặt hàng nội thất trong bảng `orders` và `order_items`:
  ```
  [PENDING: Chờ tiếp nhận]
             │
             ├──► [CONFIRMED: Nhân viên xác nhận & Điều phối lắp đặt] ──► [COMPLETED: Giao thành công]
             │
             └──► [CANCELLED: Khách hủy / Hết hàng trong kho]
  ```
- **Quy tắc & Ràng buộc nghiệp vụ**:
  - Khi chuyển sang `CONFIRMED`, hệ thống bắt buộc phải gán mã `staff_id` của nhân viên chịu trách nhiệm đơn hàng.
  - Khi đơn hàng bị HỦY (`CANCELLED`):
    - Tự động hoàn trả số lượng sản phẩm về kho (`products.quantity = quantity + item.quantity`).
    - Hoàn lại lượt sử dụng voucher nếu đơn đó có áp mã voucher (`vouchers.used_quantity = used_quantity - 1`).
  - Đơn hàng khi đã ở trạng thái cuối (`COMPLETED` hoặc `CANCELLED`) là bất biến (không cho phép sửa xóa các chi tiết bên trong).

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Bảng Danh sách Đơn đặt hàng

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý đơn hàng                                               [📥 Xuất Excel đơn]   |
+--------------------------------------------------------------------------------------------------+
| [TAB CHUYỂN TRẠNG THÁI]                                                                          |
| [Tất cả (150)] | [Chờ xác nhận (12)]* | [Đã duyệt (24)] | [Hoàn thành (110)] | [Đã hủy (4)]       |
+--------------------------------------------------------------------------------------------------+
| [🔍 Tìm mã đơn / Tên khách / SĐT...]        [Từ ngày: ... Đến ngày: ...]              [Nút Lọc]  |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH ĐƠN ĐẶT HÀNG NỘI THẤT                                                                  |
+-----+---------------+---------------+------------+--------------+-----------+----------+---------+
| Mã  | Khách hàng    | Số điện thoại | Ngày đặt   | Nhân viên PT | Tổng tiền | T.Thái   | Thao tác|
+-----+---------------+---------------+------------+--------------+-----------+----------+---------+
| #101| Trần Văn Bình | 0988 234 567  | 27/10 14:30| -- Chưa gán--| 28.500.000| [PENDING]| [Duyệt] |
| #100| Nguyễn Thị Lan| 0912 345 678  | 27/10 10:15| Thu Hà (S01) | 16.200.000| [CONFIRM]| [Xem]   |
| #099| Lê Hoàng Nam  | 0903 888 999  | 26/10 16:00| Minh Đức(S02)| 45.000.000| [COMPLETE| [Hóa đơn|
+-----+---------------+---------------+------------+--------------+-----------+----------+---------+
| Hiển thị 1 - 3 trên 150 đơn hàng                                [ < Trước ] [ 1 ] [ 2 ] [ Sau > ]|
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Giao diện Chi tiết Đơn hàng (Order Detail Page)
- **Thông tin giao hàng**: Tên người nhận, SĐT, Địa chỉ nhà riêng/chung cư, Ghi chú lắp đặt (VD: "Giao tầng 12 chung cư có thang máy").
- **Danh sách món đồ nội thất**: Ảnh, Tên sản phẩm, Đơn vị tính, Số lượng, Đơn giá, Thành tiền.
- **Bảng tổng kết tài chính**:
  - Tổng tiền hàng: `30.000.000 đ`
  - Giảm giá Voucher (`SUMMER2026`): `- 1.500.000 đ`
  - **Khách cần thanh toán**: `28.500.000 đ`
- **Cụm nút hành động**:
  - `[Duyệt đơn hàng]`: Mở popup chọn nhân viên phụ trách và xác nhận.
  - `[Hủy đơn hàng]`: Nhập lý do hủy (Khách đổi ý, Hết hàng, Sai thông tin).
  - `[In Phiếu Xuất Kho & Lắp Đặt]`: In khổ A4 để đội thợ mộc/vận chuyển đi giao.
  - `[Lập Hóa Đơn Thanh Toán]`: Chuyển dữ liệu đơn hàng sang Module Hóa Đơn (Module 09).

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entities
@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, CONFIRMED, COMPLETED, CANCELLED

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items = new ArrayList<>();
}

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor
public class OrderItem {
    @EmbeddedId
    private OrderItemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("orderId")
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productId")
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal amount;
}

// Request & Response DTOs
public record ConfirmOrderRequest(
    @NotNull Long staffId,
    String notes
) {}

public record CancelOrderRequest(
    @NotBlank String reason
) {}

public record OrderItemDto(
    Long productId,
    String productName,
    String imageUrl,
    String unit,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal amount
) {}

public record OrderDetailDto(
    Long id,
    String customerName,
    String phone,
    String address,
    Long staffId,
    String staffName,
    LocalDateTime orderDate,
    String status,
    BigDecimal subtotal,
    String voucherCode,
    BigDecimal discountAmount,
    BigDecimal finalTotal,
    List<OrderItemDto> items
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByStatus(String status, Pageable pageable);
    
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
    Optional<Order> findDetailById(@Param("id") Long id);
}
```

### 3.3. Service Layer (`AdminOrderService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private final OrderRepository orderRepository;
    private final StaffRepository staffRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;

    @Transactional
    public void confirmOrder(Long orderId, ConfirmOrderRequest req) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessRuleException("Chỉ đơn hàng ở trạng thái PENDING mới có thể xác nhận duyệt!");
        }

        Staff staff = staffRepository.findById(req.staffId())
            .orElseThrow(() -> new ResourceNotFoundException("Nhân viên phụ trách không hợp lệ"));

        order.setStaff(staff);
        order.setStatus("CONFIRMED");
        orderRepository.save(order);
    }

    @Transactional
    public void cancelOrder(Long orderId, CancelOrderRequest req) {
        Order order = orderRepository.findDetailById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        if ("COMPLETED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) {
            throw new BusinessRuleException("Đơn hàng ở trạng thái " + order.getStatus() + " là bất biến, không thể hủy!");
        }

        // 1. Hoàn lại số lượng tồn kho cho các sản phẩm trong đơn
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setQuantity(product.getQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        // 2. Hoàn lại số lượt sử dụng voucher nếu đơn có dùng
        if (order.getVoucher() != null) {
            Voucher voucher = order.getVoucher();
            if (voucher.getUsedQuantity() > 0) {
                voucher.setUsedQuantity(voucher.getUsedQuantity() - 1);
                voucherRepository.save(voucher);
            }
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    @Transactional
    public void completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        if (!"CONFIRMED".equals(order.getStatus())) {
            throw new BusinessRuleException("Chỉ đơn hàng đã duyệt (CONFIRMED) mới có thể hoàn tất giao lắp!");
        }
        order.setStatus("COMPLETED");
        orderRepository.save(order);
    }
}
```

### 3.4. Controller Layer (`AdminOrderController.java`)

```java
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    @GetMapping
    public ResponseEntity<Page<OrderSummaryDto>> getOrders(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminOrderService.getOrders(status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminOrderService.getOrderDetail(id));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Void> confirmOrder(@PathVariable Long id, @Valid @RequestBody ConfirmOrderRequest req) {
        adminOrderService.confirmOrder(id, req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long id, @Valid @RequestBody CancelOrderRequest req) {
        adminOrderService.cancelOrder(id, req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> completeOrder(@PathVariable Long id) {
        adminOrderService.completeOrder(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/orders` | `ADMIN`, `STAFF` | Lấy danh sách đơn hàng có phân trang & lọc trạng thái, ngày đặt, từ khóa |
| `GET` | `/api/admin/orders/counts` | `ADMIN`, `STAFF` | Thống kê số lượng đơn hàng theo từng tab trạng thái |
| `GET` | `/api/admin/orders/{id}` | `ADMIN`, `STAFF` | Xem chi tiết thông tin đơn hàng, khách hàng, nhân viên và danh sách sản phẩm |
| `PUT` | `/api/admin/orders/{id}/confirm` | `ADMIN`, `STAFF` | Duyệt đơn và gán nhân viên phụ trách giao lắp |
| `PUT` | `/api/admin/orders/{id}/cancel` | `ADMIN`, `STAFF` | Hủy đơn hàng, tự động hoàn trả số lượng vào kho và hoàn voucher |
| `PUT` | `/api/admin/orders/{id}/complete` | `ADMIN`, `STAFF` | Hoàn tất đơn hàng khi khách đã nghiệm thu nội thất |

---

## 5. TÌNH TRẠNG TRIỂN KHAI THỰC TẾ (STATUS: ✅ ĐÃ HOÀN THIỆN 100%)

- **Backend (Spring Boot JDBC Direct):**
  - Model DTOs: `ConfirmOrderRequest`, `CancelOrderRequest`, `OrderItemDto`, `OrderDetailDto`, `OrderSummaryDto`, `OrderStatusCountDto`.
  - Repository: `AdminOrderRepository.java` (truy vấn phân trang, tìm kiếm đa trường, đếm trạng thái, khôi phục tồn kho sản phẩm `products.quantity` và khôi phục lượt dùng `vouchers.used_quantity`).
  - Service: `AdminOrderService.java` (ràng buộc trạng thái vòng đời PENDING ➔ CONFIRMED ➔ COMPLETED, bảo vệ trạng thái bất biến của đơn hoàn tất/đã hủy, kiểm tra nhân viên phụ trách).
  - Controller: `AdminOrderController.java` (RESTful API đầy đủ).
  - Unit Tests: `AdminOrderServiceTest.java` (11/11 unit tests đạt chuẩn 100%).
- **Frontend (React Vite Admin UI):**
  - Component: `AdminOrderManagement.jsx` (Thanh Tab phân loại 5 trạng thái kèm số lượng thời gian thực, bộ lọc ngày đặt & tìm kiếm, bảng đơn hàng chi tiết, Drawer chi tiết món đồ nội thất kèm nút In phiếu giao hàng A4, Modal duyệt & gán nhân viên điều phối, Modal xác nhận hủy đơn hoàn kho).
  - Điều hướng: Tích hợp hoàn tất vào `AdminLayout.jsx` và `AdminSidebar.jsx` (Module `orders`).

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 09 - Quản lý Hóa đơn ➡️](09_QUAN_LY_HOA_DON.md)
