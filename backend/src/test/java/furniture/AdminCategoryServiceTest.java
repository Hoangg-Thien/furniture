package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.category.CategoryRequest;
import furniture.model.admin.category.CategoryResponse;
import furniture.repository.AdminCategoryRepository;
import furniture.service.AdminCategoryService;

@ExtendWith(MockitoExtension.class)
class AdminCategoryServiceTest {

    @Mock
    private AdminCategoryRepository adminCategoryRepository;

    private AdminCategoryService adminCategoryService;

    @BeforeEach
    void setUp() {
        adminCategoryService = new AdminCategoryService(adminCategoryRepository);
    }

    @Test
    @DisplayName("TC01 - Lấy danh sách toàn bộ loại nội thất kèm số lượng sản phẩm")
    void getAllCategories_ShouldReturnList() {
        List<CategoryResponse> mockData = List.of(
                new CategoryResponse(1L, "Sofa & Ghế", "Phòng khách", 15L, true),
                new CategoryResponse(2L, "Giường ngủ", "Phòng ngủ", 8L, true)
        );
        when(adminCategoryRepository.findAllWithProductCount(null, null)).thenReturn(mockData);

        List<CategoryResponse> result = adminCategoryService.getAllCategories(null);

        assertEquals(2, result.size());
        assertEquals("Sofa & Ghế", result.get(0).name());
        assertEquals(15L, result.get(0).productCount());
        assertTrue(result.get(0).isActive());
    }

    @Test
    @DisplayName("TC02 - Thêm loại nội thất mới thành công")
    void createCategory_Success() {
        CategoryRequest req = new CategoryRequest("Bàn Trà Thông Minh", "Bàn trà mặt kính ceramic", true);

        when(adminCategoryRepository.existsByName("Bàn Trà Thông Minh")).thenReturn(false);
        when(adminCategoryRepository.insertCategory("Bàn Trà Thông Minh", "Bàn trà mặt kính ceramic", true)).thenReturn(10L);

        CategoryResponse result = adminCategoryService.createCategory(req);

        assertNotNull(result);
        assertEquals(10L, result.id());
        assertEquals("Bàn Trà Thông Minh", result.name());
        assertEquals(0L, result.productCount());
        assertTrue(result.isActive());
    }

    @Test
    @DisplayName("TC03 - Chặn tạo loại nội thất trùng tên")
    void createCategory_DuplicateName_ShouldThrowException() {
        CategoryRequest req = new CategoryRequest("Sofa & Ghế", "Mô tả mới", true);

        when(adminCategoryRepository.existsByName("Sofa & Ghế")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminCategoryService.createCategory(req);
        });

        assertEquals("Tên loại nội thất 'Sofa & Ghế' đã tồn tại trong hệ thống", ex.getMessage());
        verify(adminCategoryRepository, never()).insertCategory(anyString(), any(), anyBoolean());
    }

    @Test
    @DisplayName("TC04 - Cập nhật loại nội thất thành công")
    void updateCategory_Success() {
        CategoryRequest req = new CategoryRequest("Sofa Góc Chữ L", "Sofa nỉ cao cấp", true);
        CategoryResponse existing = new CategoryResponse(1L, "Sofa cũ", "Mô tả cũ", 12L, true);

        when(adminCategoryRepository.findById(1L)).thenReturn(existing);
        when(adminCategoryRepository.existsByNameExcludingId("Sofa Góc Chữ L", 1L)).thenReturn(false);
        when(adminCategoryRepository.countProductsByCategoryId(1L)).thenReturn(12L);

        CategoryResponse result = adminCategoryService.updateCategory(1L, req);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Sofa Góc Chữ L", result.name());
        assertEquals(12L, result.productCount());
        verify(adminCategoryRepository).updateCategory(1L, "Sofa Góc Chữ L", "Sofa nỉ cao cấp", true);
    }

    @Test
    @DisplayName("TC05 - Chặn cập nhật trùng tên với loại nội thất khác")
    void updateCategory_DuplicateNameInOtherId_ShouldThrowException() {
        CategoryRequest req = new CategoryRequest("Giường ngủ", "Mô tả", true);
        CategoryResponse existing = new CategoryResponse(1L, "Sofa cũ", "Mô tả cũ", 12L, true);

        when(adminCategoryRepository.findById(1L)).thenReturn(existing);
        when(adminCategoryRepository.existsByNameExcludingId("Giường ngủ", 1L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminCategoryService.updateCategory(1L, req);
        });

        assertEquals("Tên loại nội thất 'Giường ngủ' đã được sử dụng bởi danh mục khác", ex.getMessage());
        verify(adminCategoryRepository, never()).updateCategory(eq(1L), anyString(), any(), any());
    }

    @Test
    @DisplayName("TC06 - Chặn xóa loại nội thất khi còn sản phẩm trong kho (Ràng buộc toàn vẹn)")
    void deleteCategory_WithProducts_ShouldThrowIllegalStateException() {
        when(adminCategoryRepository.existsById(1L)).thenReturn(true);
        when(adminCategoryRepository.countProductsByCategoryId(1L)).thenReturn(5L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            adminCategoryService.deleteCategory(1L);
        });

        assertTrue(ex.getMessage().contains("Không thể xóa loại nội thất đang có 5 sản phẩm trong kho"));
        verify(adminCategoryRepository, never()).deleteCategory(1L);
    }

    @Test
    @DisplayName("TC07 - Xóa thành công khi loại nội thất không có sản phẩm nào (0 sản phẩm)")
    void deleteCategory_WithoutProducts_ShouldDeleteSuccess() {
        when(adminCategoryRepository.existsById(2L)).thenReturn(true);
        when(adminCategoryRepository.countProductsByCategoryId(2L)).thenReturn(0L);

        adminCategoryService.deleteCategory(2L);

        verify(adminCategoryRepository).deleteCategory(2L);
    }

    @Test
    @DisplayName("TC08 - Ẩn loại nội thất và đồng bộ ẩn toàn bộ sản phẩm thuộc danh mục")
    void toggleCategoryStatus_DeactivateAndHideProducts() {
        CategoryResponse current = new CategoryResponse(1L, "Sofa", "Mô tả", 10L, true);
        when(adminCategoryRepository.findById(1L)).thenReturn(current);
        when(adminCategoryRepository.countProductsByCategoryId(1L)).thenReturn(10L);

        CategoryResponse result = adminCategoryService.toggleCategoryStatus(1L, true);

        assertNotNull(result);
        assertFalse(result.isActive());
        verify(adminCategoryRepository).updateCategoryActive(1L, false);
        verify(adminCategoryRepository).updateProductsActiveByCategoryId(1L, false);
    }

    @Test
    @DisplayName("TC09 - Bật lại hiển thị loại nội thất và kích hoạt lại sản phẩm")
    void toggleCategoryStatus_ActivateAndShowProducts() {
        CategoryResponse current = new CategoryResponse(1L, "Sofa", "Mô tả", 10L, false);
        when(adminCategoryRepository.findById(1L)).thenReturn(current);
        when(adminCategoryRepository.countProductsByCategoryId(1L)).thenReturn(10L);

        CategoryResponse result = adminCategoryService.toggleCategoryStatus(1L, true);

        assertNotNull(result);
        assertTrue(result.isActive());
        verify(adminCategoryRepository).updateCategoryActive(1L, true);
        verify(adminCategoryRepository).updateProductsActiveByCategoryId(1L, true);
    }
}
