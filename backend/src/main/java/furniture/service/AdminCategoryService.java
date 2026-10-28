package furniture.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.category.CategoryRequest;
import furniture.model.admin.category.CategoryResponse;
import furniture.repository.AdminCategoryRepository;

@Service
public class AdminCategoryService {

    private final AdminCategoryRepository adminCategoryRepository;

    public AdminCategoryService(AdminCategoryRepository adminCategoryRepository) {
        this.adminCategoryRepository = adminCategoryRepository;
    }

    public List<CategoryResponse> getAllCategories(String search, Boolean isActive) {
        return adminCategoryRepository.findAllWithProductCount(search, isActive);
    }

    public List<CategoryResponse> getAllCategories(String search) {
        return getAllCategories(search, null);
    }

    public CategoryResponse getCategoryById(Long id) {
        CategoryResponse category = adminCategoryRepository.findById(id);
        if (category == null) {
            throw new IllegalArgumentException("Không tìm thấy loại nội thất với ID: " + id);
        }
        return category;
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest req) {
        if (req.name() == null || req.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên loại nội thất không được để trống");
        }
        if (req.name().trim().length() > 150) {
            throw new IllegalArgumentException("Tên loại nội thất không được vượt quá 150 ký tự");
        }

        String name = req.name().trim();
        if (adminCategoryRepository.existsByName(name)) {
            throw new IllegalArgumentException("Tên loại nội thất '" + name + "' đã tồn tại trong hệ thống");
        }

        String description = req.description() != null && !req.description().trim().isEmpty()
                ? req.description().trim()
                : null;

        boolean isActive = req.isActive() == null || Boolean.TRUE.equals(req.isActive());
        Long id = adminCategoryRepository.insertCategory(name, description, isActive);
        return new CategoryResponse(id, name, description, 0L, isActive);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest req) {
        CategoryResponse current = adminCategoryRepository.findById(id);
        if (current == null) {
            throw new IllegalArgumentException("Không tìm thấy loại nội thất với ID: " + id);
        }

        if (req.name() == null || req.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên loại nội thất không được để trống");
        }
        if (req.name().trim().length() > 150) {
            throw new IllegalArgumentException("Tên loại nội thất không được vượt quá 150 ký tự");
        }

        String name = req.name().trim();
        if (adminCategoryRepository.existsByNameExcludingId(name, id)) {
            throw new IllegalArgumentException("Tên loại nội thất '" + name + "' đã được sử dụng bởi danh mục khác");
        }

        String description = req.description() != null && !req.description().trim().isEmpty()
                ? req.description().trim()
                : null;

        Boolean isActive = req.isActive() != null ? req.isActive() : current.isActive();

        adminCategoryRepository.updateCategory(id, name, description, isActive);
        Long productCount = adminCategoryRepository.countProductsByCategoryId(id);

        return new CategoryResponse(id, name, description, productCount, isActive);
    }

    @Transactional
    public CategoryResponse toggleCategoryStatus(Long id, boolean syncProducts) {
        CategoryResponse current = adminCategoryRepository.findById(id);
        if (current == null) {
            throw new IllegalArgumentException("Không tìm thấy loại nội thất với ID: " + id);
        }

        boolean newActive = !Boolean.TRUE.equals(current.isActive());
        adminCategoryRepository.updateCategoryActive(id, newActive);

        if (syncProducts) {
            adminCategoryRepository.updateProductsActiveByCategoryId(id, newActive);
        }

        Long productCount = adminCategoryRepository.countProductsByCategoryId(id);
        return new CategoryResponse(id, current.name(), current.description(), productCount, newActive);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!adminCategoryRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy loại nội thất với ID: " + id);
        }

        Long productCount = adminCategoryRepository.countProductsByCategoryId(id);
        if (productCount > 0) {
            throw new IllegalStateException("Không thể xóa loại nội thất đang có " + productCount + " sản phẩm trong kho! Bạn có thể sử dụng chức năng 'Ẩn loại nội thất' để tạm dừng kinh doanh mà không làm mất dữ liệu.");
        }

        adminCategoryRepository.deleteCategory(id);
    }
}
