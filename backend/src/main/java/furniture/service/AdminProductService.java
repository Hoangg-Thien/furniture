package furniture.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import furniture.model.admin.PageResponse;
import furniture.model.admin.product.ProductDetailDto;
import furniture.model.admin.product.ProductImageDto;
import furniture.model.admin.product.ProductSummaryDto;
import furniture.model.admin.product.SaveProductRequest;
import furniture.repository.AdminCategoryRepository;
import furniture.repository.AdminProductRepository;
import furniture.repository.ProductAuditRepository;
import furniture.model.admin.product.ProductAuditDto;

@Service
public class AdminProductService {

    private final AdminProductRepository adminProductRepository;
    private final AdminCategoryRepository adminCategoryRepository;
    private final FileStorageService fileStorageService;
    private final ProductAuditRepository audit;

    public AdminProductService(
            AdminProductRepository adminProductRepository,
            AdminCategoryRepository adminCategoryRepository,
            FileStorageService fileStorageService,
            ProductAuditRepository audit) {
        this.adminProductRepository = adminProductRepository;
        this.adminCategoryRepository = adminCategoryRepository;
        this.fileStorageService = fileStorageService;
        this.audit = audit;
    }

    public PageResponse<ProductSummaryDto> searchProducts(
            Long categoryId, String search, Boolean lowStock, Boolean isActive, int page, int size) {
        return adminProductRepository.searchProducts(categoryId, search, lowStock, isActive, page, size);
    }

    public ProductDetailDto getProductDetail(Long id) {
        ProductDetailDto detail = adminProductRepository.findDetailById(id);
        if (detail == null) {
            throw new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + id);
        }
        return detail;
    }

    @Transactional
    public ProductDetailDto createProduct(SaveProductRequest req, Long actorUserId) {
        validateProductRequest(req);

        if (!adminCategoryRepository.existsById(req.categoryId())) {
            throw new IllegalArgumentException("Loại nội thất (Category ID: " + req.categoryId() + ") không tồn tại trong hệ thống");
        }

        Long productId = adminProductRepository.insertProduct(req);

        // Nếu có truyền imageUrl ngay khi tạo, lưu luôn vào product_images làm ảnh chính
        if (req.imageUrl() != null && !req.imageUrl().trim().isEmpty()) {
            adminProductRepository.insertProductImage(productId, req.imageUrl().trim(), true, 1);
        }

        audit.record(productId, actorUserId, Map.of());
        return getProductDetail(productId);
    }

    @Transactional
    public ProductDetailDto updateProduct(Long id, SaveProductRequest req, Long actorUserId) {
        if (!adminProductRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + id);
        }

        validateProductRequest(req);

        if (!adminCategoryRepository.existsById(req.categoryId())) {
            throw new IllegalArgumentException("Loại nội thất (Category ID: " + req.categoryId() + ") không tồn tại trong hệ thống");
        }

        Map<String, Object> before = audit.snapshot(id);
        adminProductRepository.updateProduct(id, req);
        audit.record(id, actorUserId, before);
        return getProductDetail(id);
    }

    @Transactional
    public boolean toggleProductStatus(Long id, Long actorUserId) {
        Map<String, Object> before = audit.snapshot(id);
        ProductDetailDto product = getProductDetail(id);
        boolean newActive = !Boolean.TRUE.equals(product.isActive());
        adminProductRepository.updateProductActive(id, newActive);
        audit.record(id, actorUserId, before);
        return newActive;
    }

    @Transactional
    public ProductDetailDto updateProductContent(Long id, java.util.Map<String, Object> body, Long actorUserId) {
        if (!java.util.Set.of("name", "description", "imageUrl").containsAll(body.keySet())
                || !(body.get("name") instanceof String name) || name.isBlank() || name.trim().length() > 200
                || (body.get("description") != null && !(body.get("description") instanceof String))
                || (body.get("imageUrl") != null && !(body.get("imageUrl") instanceof String))) {
            throw new IllegalArgumentException("Chỉ được cập nhật tên (1–200 ký tự), mô tả và ảnh sản phẩm");
        }
        Map<String, Object> before = audit.snapshot(id);
        ProductDetailDto existing = getProductDetail(id);
        adminProductRepository.updateProductContent(id, name.trim(),
                body.containsKey("description") ? (String) body.get("description") : existing.description(),
                body.containsKey("imageUrl") ? (String) body.get("imageUrl") : existing.imageUrl());
        audit.record(id, actorUserId, before);
        return getProductDetail(id);
    }

    @Transactional
    public List<ProductImageDto> uploadProductImages(Long productId, List<MultipartFile> files, Long actorUserId) {
        Map<String, Object> before = audit.snapshot(productId);
        ProductDetailDto product = getProductDetail(productId);

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 file ảnh");
        }

        List<ProductImageDto> currentImages = product.images();
        int currentCount = currentImages != null ? currentImages.size() : 0;
        boolean hasPrimary = currentImages != null && currentImages.stream().anyMatch(img -> Boolean.TRUE.equals(img.isPrimary()));

        List<String> savedUrls = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) continue;

            String fileUrl = fileStorageService.storeFile(file);
            savedUrls.add(fileUrl);

            boolean isPrimary = (!hasPrimary && i == 0);
            int displayOrder = currentCount + i + 1;

            adminProductRepository.insertProductImage(productId, fileUrl, isPrimary, displayOrder);

            if (isPrimary && (product.imageUrl() == null || product.imageUrl().trim().isEmpty())) {
                adminProductRepository.updateProductImageUrl(productId, fileUrl);
            }
        }

        audit.record(productId, actorUserId, before);
        return adminProductRepository.findImagesByProductId(productId);
    }

    @Transactional
    public List<ProductImageDto> addDirectImageUrl(Long productId, String imageUrl, Long actorUserId) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Đường dẫn URL ảnh không được để trống");
        }

        Map<String, Object> before = audit.snapshot(productId);
        ProductDetailDto product = getProductDetail(productId);
        List<ProductImageDto> currentImages = product.images();
        int currentCount = currentImages != null ? currentImages.size() : 0;
        boolean hasPrimary = currentImages != null && currentImages.stream().anyMatch(img -> Boolean.TRUE.equals(img.isPrimary()));

        boolean isPrimary = !hasPrimary;
        adminProductRepository.insertProductImage(productId, imageUrl.trim(), isPrimary, currentCount + 1);

        if (isPrimary && (product.imageUrl() == null || product.imageUrl().trim().isEmpty())) {
            adminProductRepository.updateProductImageUrl(productId, imageUrl.trim());
        }

        audit.record(productId, actorUserId, before);
        return adminProductRepository.findImagesByProductId(productId);
    }

    @Transactional
    public void setPrimaryImage(Long productId, Long imageId, Long actorUserId) {
        if (!adminProductRepository.existsById(productId)) {
            throw new IllegalArgumentException("Sản phẩm không tồn tại");
        }
        Map<String, Object> before = audit.snapshot(productId);
        adminProductRepository.setPrimaryImage(productId, imageId);
        audit.record(productId, actorUserId, before);
    }

    @Transactional
    public void deleteProductImage(Long productId, Long imageId, Long actorUserId) {
        if (!adminProductRepository.existsById(productId)) {
            throw new IllegalArgumentException("Sản phẩm không tồn tại");
        }
        Map<String, Object> before = audit.snapshot(productId);
        adminProductRepository.deleteProductImage(productId, imageId);
        audit.record(productId, actorUserId, before);
    }

    public List<ProductAuditDto> getProductAuditLog(Long productId, Long beforeId) {
        if (beforeId != null && beforeId < 1) throw new IllegalArgumentException("Mốc nhật ký không hợp lệ");
        getProductDetail(productId);
        return audit.findByProductId(productId, beforeId);
    }

    private void validateProductRequest(SaveProductRequest req) {
        if (req.name() == null || req.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên sản phẩm không được để trống");
        }
        if (req.categoryId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn loại nội thất cho sản phẩm");
        }
        if (req.sellingPrice() == null || req.sellingPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá bán niêm yết phải lớn hơn hoặc bằng 0");
        }
        if (req.quantity() == null || req.quantity() < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho không được âm");
        }
    }
}
