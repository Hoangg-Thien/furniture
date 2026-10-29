# TÀI LIỆU MODULE 04: QUẢN LÝ LOẠI NỘI THẤT
## DANH MỤC SẢN PHẨM & CẤU TRÚC PHÂN LOẠI KHÔNG GIAN

> **Trạng thái:** ✅ **ĐÃ TRIỂN KHAI HOÀN CHỈNH (FULLSTACK + UNIT TESTS 100% PASSED)**  
> - **Backend Controller**: [`AdminCategoryController.java`](file:///d:/furniture/backend/src/main/java/furniture/controller/AdminCategoryController.java)  
> - **Backend Service**: [`AdminCategoryService.java`](file:///d:/furniture/backend/src/main/java/furniture/service/AdminCategoryService.java)  
> - **Backend Repository**: [`AdminCategoryRepository.java`](file:///d:/furniture/backend/src/main/java/furniture/repository/AdminCategoryRepository.java)  
> - **DTOs**: [`CategoryRequest.java`](file:///d:/furniture/backend/src/main/java/furniture/model/admin/category/CategoryRequest.java), [`CategoryResponse.java`](file:///d:/furniture/backend/src/main/java/furniture/model/admin/category/CategoryResponse.java)  
> - **Frontend UI**: [`AdminCategoryManagement.jsx`](file:///d:/furniture/frontend/src/admin/AdminCategoryManagement.jsx) (Tích hợp trong [`AdminLayout.jsx`](file:///d:/furniture/frontend/src/admin/AdminLayout.jsx))  
> - **Unit Tests**: [`AdminCategoryServiceTest.java`](file:///d:/furniture/backend/src/test/java/furniture/AdminCategoryServiceTest.java) (9/9 tests passed, kiểm tra đầy đủ tạo, sửa, xóa ràng buộc và tính năng Ẩn/Hiện danh mục đồng bộ sản phẩm)

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 05 - Quản lý Sản phẩm & Hình ảnh ➡️](05_QUAN_LY_SAN_PHAM_HINH_ANH.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý danh mục phân loại đồ nội thất trong bảng `categories`:
  - **Nội thất Phòng khách**: Ghế Sofa, Bàn trà, Kệ tivi, Tủ giày.
  - **Nội thất Phòng ngủ**: Giường ngủ, Tủ quần áo, Bàn trang điểm, Tab đầu giường.
  - **Nội thất Phòng ăn & Bếp**: Bộ bàn ghế ăn, Tủ bếp, Quầy bar mini.
  - **Nội thất Phòng làm việc**: Bàn làm việc công thái học, Ghế xoay văn phòng, Giá sách.
  - **Đồ trang trí**: Thảm trải sàn, Đèn trang trí, Tranh treo tường.
- Thao tác: Thêm mới, Cập nhật thông tin và mô tả danh mục.
- **Tính năng Ẩn / Hiện Loại nội thất & Sản phẩm (Mới bổ sung)**:
  - Cho phép Admin chuyển trạng thái **Ẩn (`is_active = false`)** khi muốn tạm ngừng bán một nhóm nội thất mà không cần xóa danh mục.
  - Hỗ trợ tùy chọn **Đồng bộ ẩn toàn bộ sản phẩm** thuộc loại nội thất đó (`UPDATE products SET is_active = false WHERE category_id = ?`) để khách hàng không thể tìm kiếm hay mua hàng.
- **Ràng buộc an toàn dữ liệu**:
  - Không cho phép xóa một loại nội thất nếu vẫn còn sản phẩm (`products`) đang liên kết với danh mục đó (hướng dẫn Admin sử dụng tính năng "Ẩn" thay vì xóa).
  - Tên danh mục là duy nhất (`unique`).

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Bố cục Danh mục Loại Nội Thất

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý loại nội thất                                         [+ Thêm loại nội thất] |
+--------------------------------------------------------------------------------------------------+
| [Tìm kiếm tên loại nội thất...]                                                     [Nút Tìm]    |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH LOẠI NỘI THẤT TRONG HỆ THỐNG                                                           |
+-----+----------------------+------------------------------------------+------------+-------------+
| ID  | Tên loại nội thất    | Mô tả không gian sử dụng                 | Số món SP  | Thao tác    |
+-----+----------------------+------------------------------------------+------------+-------------+
| C01 | Sofa & Ghế Thư Giãn  | Sofa góc L, sofa văng da và nỉ cao cấp   | 24 sản phẩm| [✏️] [🗑️ Xóa]|
| C02 | Bàn Ghế Phòng Ăn     | Bộ bàn ghế ăn gỗ sồi, mặt đá ceramic     | 18 sản phẩm| [✏️] [🗑️ Xóa]|
| C03 | Giường Ngủ Hiện Đại  | Giường ngủ gỗ tự nhiên, đệm bọc nỉ       | 15 sản phẩm| [✏️] [🗑️ Xóa]|
| C04 | Kệ Tủ Trang Trí      | Kệ sách, tủ giày thông minh, vách ngăn   | 0 sản phẩm | [✏️] [🗑️ Xóa]|
+-----+----------------------+------------------------------------------+------------+-------------+
| Hiển thị 1 - 4 trên 12 danh mục                               [ < Trang trước ] [ 1 ] [ Trang sau > ] |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Modal Thêm / Chỉnh sửa Loại Nội Thất
- Tên loại nội thất: Input text (Bắt buộc, tối đa 150 ký tự, kiểm tra trùng tên theo thời gian thực).
- Mô tả chi tiết: Textarea (Gợi ý mục đích và phong cách thiết kế).
- Nút xác nhận lưu dữ liệu (Hiển thị loading spinner trong khi lưu).

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entity
@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
}

// Request DTO
public record CategoryRequest(
    @NotBlank(message = "Tên loại nội thất không được bỏ trống")
    @Size(max = 150, message = "Tên không quá 150 ký tự")
    String name,
    String description
) {}

// Response DTO
public record CategoryResponse(
    Long id,
    String name,
    String description,
    Long productCount
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
        SELECT new furniture.admin.category.dto.CategoryResponse(
            c.id, c.name, c.description, COUNT(p.id)
        )
        FROM Category c
        LEFT JOIN Product p ON p.category.id = c.id
        WHERE (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
        GROUP BY c.id, c.name, c.description
        ORDER BY c.id ASC
    """)
    List<CategoryResponse> findAllWithProductCount(@Param("search") String search);
}
```

### 3.3. Service Layer (`AdminCategoryService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminCategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryResponse> getAllCategories(String search) {
        return categoryRepository.findAllWithProductCount(search);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.name().trim())) {
            throw new DuplicateResourceException("Tên loại nội thất này đã tồn tại");
        }
        Category category = new Category();
        category.setName(req.name().trim());
        category.setDescription(req.description());
        Category saved = categoryRepository.save(category);
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getDescription(), 0L);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(req.name().trim(), id)) {
            throw new DuplicateResourceException("Tên loại nội thất đã bị trùng");
        }
        category.setName(req.name().trim());
        category.setDescription(req.description());
        categoryRepository.save(category);
        long count = productRepository.countByCategoryId(id);
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription(), count);
    }

    @Transactional
    public void deleteCategory(Long id) {
        long count = productRepository.countByCategoryId(id);
        if (count > 0) {
            throw new BusinessRuleException("Không thể xóa danh mục đang có " + count + " sản phẩm trong kho!");
        }
        categoryRepository.deleteById(id);
    }
}
```

### 3.4. Controller Layer (`AdminCategoryController.java`)

```java
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminCategoryController {
    private final AdminCategoryService adminCategoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminCategoryService.getAllCategories(search));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Chỉ Admin mới được thêm/sửa danh mục gốc
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCategoryService.createCategory(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(adminCategoryService.updateCategory(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/categories` | `ADMIN`, `STAFF` | Lấy danh sách toàn bộ loại nội thất kèm số lượng sản phẩm |
| `POST` | `/api/admin/categories` | `ADMIN` | Tạo loại nội thất mới |
| `PUT` | `/api/admin/categories/{id}` | `ADMIN` | Cập nhật tên và mô tả loại nội thất |
| `DELETE` | `/api/admin/categories/{id}` | `ADMIN` | Xóa loại nội thất (chặn nếu danh mục đang có sản phẩm) |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 05 - Quản lý Sản phẩm & Hình ảnh ➡️](05_QUAN_LY_SAN_PHAM_HINH_ANH.md)
