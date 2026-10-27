# TÀI LIỆU MODULE 05: QUẢN LÝ SẢN PHẨM & ALBUM HÌNH ẢNH
## QUẢN TRỊ DANH MỤC NỘI THẤT, KHO HÀNG & THƯ VIỆN ẢNH ĐA GÓC

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 06 - Quản lý Nhà cung cấp ➡️](06_QUAN_LY_NHA_CUNG_CAP.md)

---

## 1. MỤC TIÊU & NGHIỆP VỤ CỐT LÕI

- Quản lý danh mục hàng hóa nội thất trong bảng `products`: Tên, Loại nội thất (`category_id`), Đơn vị tính (Bộ, Cái, Chiếc), Giá niêm yết, Số lượng tồn kho, Trạng thái bán (`is_active`).
- **Quản lý Thư viện Hình ảnh (`product_images`)**:
  - Đặc thù kinh doanh nội thất đòi hỏi nhiều góc ảnh: Phối cảnh phòng khách/phòng ngủ thực tế, chi tiết đường vân gỗ, chất liệu da/nỉ, ảnh bản vẽ kích thước chiều sâu - rộng - cao.
  - Hỗ trợ tải nhiều ảnh một lúc, sắp xếp thứ tự hiển thị (`display_order`), và chọn 1 ảnh làm "Ảnh đại diện chính" (Primary Image).
- **Kiểm soát Tồn kho & Cảnh báo**:
  - Tự động đánh dấu nhãn cảnh báo đỏ khi số lượng tồn kho `< 5` chiếc (Low Stock Alert).
  - Tự động trừ kho khi đơn hàng được tạo và hoàn kho khi đơn bị hủy.

---

## 2. THIẾT KẾ GIAO DIỆN (VIEW - UI/UX)

### 2.1. Wireframe Danh sách Sản phẩm Nội thất

```
+--------------------------------------------------------------------------------------------------+
| Trang chủ > Quản lý sản phẩm nội thất                                      [+ Thêm sản phẩm mới] |
+--------------------------------------------------------------------------------------------------+
| [🔍 Tìm theo tên...]  [Danh mục: Tất cả v]  [Tồn kho: Sắp hết hàng v]  [Giá: Tất cả v]  [Lọc]    |
+--------------------------------------------------------------------------------------------------+
| DANH SÁCH SẢN PHẨM NỘI THẤT                                                                      |
+----+--------+--------------------------+----------+---------+----------+----------+--------------+
| ID | Ảnh    | Tên sản phẩm             | Loại     | ĐVT     | Giá bán  | Kho tồn  | Thao tác     |
+----+--------+--------------------------+----------+---------+----------+----------+--------------+
| 01 | [🖼️]   | Sofa Da Bò Ý Nhập Khẩu   | Sofa     | Bộ      | 24.500.000| 12 chiếc | [✏️] [🖼️ ẢNH]|
| 02 | [🖼️]   | Bàn Ăn Gỗ Sồi Bắc Âu 6G  | Bàn ghế  | Bộ      | 14.800.000| 3* [SẮP] | [✏️] [🖼️ ẢNH]|
| 03 | [🖼️]   | Giường Ngủ Bọc Nỉ Minimal| Giường   | Chiếc   | 18.200.000| 8 chiếc  | [✏️] [🖼️ ẢNH]|
+----+--------+--------------------------+----------+---------+----------+----------+--------------+
| Hiển thị 1 - 3 trên 85 sản phẩm                               [ < Trước ] [ 1 ] [ 2 ] [ Sau > ]  |
+--------------------------------------------------------------------------------------------------+
```

### 2.2. Giao diện Thêm / Sửa Sản phẩm & Quản lý Album Ảnh
Giao diện phân thành 2 tab trực quan:
- **Tab 1: Thông tin sản phẩm**:
  - Tên sản phẩm, Loại nội thất (Dropdown), Đơn vị tính, Giá niêm yết (VNĐ), Số lượng nhập kho ban đầu.
  - Trình soạn thảo mô tả chi tiết: Kích thước (D x R x C cm), Chất liệu khung xương, Màu sắc, Xuất xứ, Bảo hành.
- **Tab 2: Quản lý Thư viện Hình ảnh (Product Image Gallery)**:
  - Khung kéo thả tải ảnh (Hỗ trợ kéo nhiều file ảnh cùng lúc từ máy tính).
  - Lưới hiển thị các ảnh đã tải lên:
    - Mỗi ảnh có icon ngôi sao ⭐ để click chọn làm "Ảnh chính" (Primary Thumbnail).
    - Nút xóa ảnh [🗑️].
    - Kéo thả thay đổi thứ tự hiển thị ảnh khi khách lướt xem trên ứng dụng.

---

## 3. THIẾT KẾ BACKEND THEO MÔ HÌNH MVC

### 3.1. Model & Data Transfer Objects (DTO)

```java
// Entities
@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String unit; // 'Bộ', 'Chiếc', 'Cái'

    @Column(name = "selling_price", nullable = false)
    private BigDecimal sellingPrice;

    @Column(name = "image_url")
    private String imageUrl; // URL ảnh đại diện mặc định

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> galleryImages = new ArrayList<>();
}

@Entity
@Table(name = "product_images")
@Getter @Setter @NoArgsConstructor
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
}

// Request & Response DTOs
public record SaveProductRequest(
    @NotBlank String name,
    @NotNull Long categoryId,
    @NotBlank String unit,
    @NotNull @DecimalMin("0.0") BigDecimal sellingPrice,
    @NotNull @Min(0) Integer quantity,
    String description
) {}

public record ProductImageDto(
    Long id,
    String imageUrl,
    Boolean isPrimary,
    Integer displayOrder
) {}

public record ProductDetailDto(
    Long id,
    String name,
    Long categoryId,
    String categoryName,
    String unit,
    BigDecimal sellingPrice,
    Integer quantity,
    Boolean isActive,
    String description,
    List<ProductImageDto> images
) {}
```

### 3.2. Repository Layer

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    long countByCategoryId(Long categoryId);
}

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Long productId);
    void deleteByProductId(Long productId);
}
```

### 3.3. Service Layer (`AdminProductService.java`)

```java
@Service
@RequiredArgsConstructor
public class AdminProductService {
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService; // Lưu ảnh vào cloud hoặc thư mục cục bộ

    @Transactional
    public ProductDetailDto createProduct(SaveProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));

        Product p = new Product();
        p.setName(req.name());
        p.setCategory(category);
        p.setUnit(req.unit());
        p.setSellingPrice(req.sellingPrice());
        p.setQuantity(req.quantity());
        p.setDescription(req.description());
        p.setIsActive(true);
        Product saved = productRepository.save(p);
        return toDetailDto(saved);
    }

    @Transactional
    public List<ProductImageDto> uploadProductImages(Long productId, List<MultipartFile> files) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        int currentCount = product.getGalleryImages().size();
        List<ProductImage> newImages = new ArrayList<>();

        for (int i = 0; i < files.size(); i++) {
            String url = fileStorageService.storeFile(files.get(i));
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setImageUrl(url);
            img.setDisplayOrder(currentCount + i + 1);
            img.setIsPrimary(currentCount == 0 && i == 0); // Ảnh đầu tiên là ảnh chính nếu chưa có ảnh nào
            newImages.add(img);
        }
        productImageRepository.saveAll(newImages);

        // Cập nhật lại ảnh đại diện cho product
        if (product.getImageUrl() == null && !newImages.isEmpty()) {
            product.setImageUrl(newImages.get(0).getImageUrl());
            productRepository.save(product);
        }

        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId).stream()
            .map(img -> new ProductImageDto(img.getId(), img.getImageUrl(), img.getIsPrimary(), img.getDisplayOrder()))
            .toList();
    }

    @Transactional
    public void setPrimaryImage(Long productId, Long imageId) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

        for (ProductImage img : images) {
            boolean isTarget = img.getId().equals(imageId);
            img.setIsPrimary(isTarget);
            if (isTarget) {
                product.setImageUrl(img.getImageUrl());
            }
        }
        productImageRepository.saveAll(images);
        productRepository.save(product);
    }

    @Transactional
    public void deleteProductImage(Long productId, Long imageId) {
        productImageRepository.deleteById(imageId);
    }
}
```

### 3.4. Controller Layer (`AdminProductController.java`)

```java
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminProductController {
    private final AdminProductService adminProductService;

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDto>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStock,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminProductService.searchProducts(categoryId, search, lowStock, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.getProductDetail(id));
    }

    @PostMapping
    public ResponseEntity<ProductDetailDto> createProduct(@Valid @RequestBody SaveProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createProduct(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailDto> updateProduct(@PathVariable Long id, @Valid @RequestBody SaveProductRequest req) {
        return ResponseEntity.ok(adminProductService.updateProduct(id, req));
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<List<ProductImageDto>> uploadImages(
            @PathVariable Long id, 
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(adminProductService.uploadProductImages(id, files));
    }

    @PutMapping("/{id}/images/{imageId}/set-primary")
    public ResponseEntity<Void> setPrimaryImage(@PathVariable Long id, @PathVariable Long imageId) {
        adminProductService.setPrimaryImage(id, imageId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        adminProductService.deleteProductImage(id, imageId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 4. DANH SÁCH RESTFUL API ENDPOINTS

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/products` | `ADMIN`, `STAFF` | Danh sách sản phẩm, lọc theo danh mục, từ khóa, hàng sắp hết |
| `GET` | `/api/admin/products/{id}` | `ADMIN`, `STAFF` | Chi tiết sản phẩm kèm album đầy đủ ảnh |
| `POST` | `/api/admin/products` | `ADMIN`, `STAFF` | Thêm mới sản phẩm nội thất |
| `PUT` | `/api/admin/products/{id}` | `ADMIN`, `STAFF` | Chỉnh sửa thông tin, giá bán, số lượng tồn kho |
| `POST` | `/api/admin/products/{id}/images` | `ADMIN`, `STAFF` | Tải nhiều ảnh mới vào album sản phẩm |
| `PUT` | `/api/admin/products/{id}/images/{imageId}/set-primary` | `ADMIN`, `STAFF` | Đặt ảnh này làm ảnh đại diện chính |
| `DELETE` | `/api/admin/products/{id}/images/{imageId}` | `ADMIN`, `STAFF` | Xóa 1 ảnh khỏi album sản phẩm |

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Module 06 - Quản lý Nhà cung cấp ➡️](06_QUAN_LY_NHA_CUNG_CAP.md)
