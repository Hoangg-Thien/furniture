package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.PageResponse;
import furniture.model.admin.product.ProductDetailDto;
import furniture.model.admin.product.ProductImageDto;
import furniture.model.admin.product.ProductSummaryDto;
import furniture.model.admin.product.SaveProductRequest;
import furniture.repository.AdminCategoryRepository;
import furniture.repository.AdminProductRepository;
import furniture.service.AdminProductService;
import furniture.service.FileStorageService;

@ExtendWith(MockitoExtension.class)
class AdminProductServiceTest {

    @Mock
    private AdminProductRepository adminProductRepository;

    @Mock
    private AdminCategoryRepository adminCategoryRepository;

    @Mock
    private FileStorageService fileStorageService;

    private AdminProductService adminProductService;

    @BeforeEach
    void setUp() {
        adminProductService = new AdminProductService(
                adminProductRepository, adminCategoryRepository, fileStorageService
        );
    }

    @Test
    @DisplayName("TC01 - Tìm kiếm và phân trang danh sách sản phẩm nội thất")
    void searchProducts_ShouldReturnPage() {
        List<ProductSummaryDto> items = List.of(
                new ProductSummaryDto(1L, "Sofa Da Bò Ý", 1L, "Sofa", "Bộ", new BigDecimal("25000000"), "url1.jpg", 10, true, LocalDateTime.now()),
                new ProductSummaryDto(2L, "Bàn Ăn 6 Ghế", 2L, "Bàn ghế", "Bộ", new BigDecimal("12000000"), "url2.jpg", 2, true, LocalDateTime.now())
        );
        PageResponse<ProductSummaryDto> mockPage = new PageResponse<>(items, 0, 10, 2, 1);

        when(adminProductRepository.searchProducts(null, null, null, null, 0, 10)).thenReturn(mockPage);

        PageResponse<ProductSummaryDto> result = adminProductService.searchProducts(null, null, null, null, 0, 10);

        assertEquals(2, result.content().size());
        assertEquals("Sofa Da Bò Ý", result.content().get(0).name());
        assertEquals(2, result.content().get(1).quantity());
    }

    @Test
    @DisplayName("TC02 - Thêm sản phẩm nội thất mới thành công")
    void createProduct_Success() {
        SaveProductRequest req = new SaveProductRequest(
                "Giường Ngủ Hiện Đại 1m8", 1L, "Chiếc",
                new BigDecimal("15000000"), 8, "Gỗ sồi tự nhiên", "main.jpg", true
        );

        ProductDetailDto mockDetail = new ProductDetailDto(
                100L, "Giường Ngủ Hiện Đại 1m8", 1L, "Giường ngủ", "Chiếc",
                new BigDecimal("15000000"), "main.jpg", 8, true, "Gỗ sồi tự nhiên", new ArrayList<>()
        );

        when(adminCategoryRepository.existsById(1L)).thenReturn(true);
        when(adminProductRepository.insertProduct(req)).thenReturn(100L);
        when(adminProductRepository.findDetailById(100L)).thenReturn(mockDetail);

        ProductDetailDto result = adminProductService.createProduct(req);

        assertNotNull(result);
        assertEquals(100L, result.id());
        assertEquals("Giường Ngủ Hiện Đại 1m8", result.name());
        verify(adminProductRepository).insertProductImage(100L, "main.jpg", true, 1);
    }

    @Test
    @DisplayName("TC03 - Chặn tạo sản phẩm khi loại nội thất (Category) không tồn tại")
    void createProduct_InvalidCategory_ShouldThrowException() {
        SaveProductRequest req = new SaveProductRequest(
                "Kệ Sách", 999L, "Cái", new BigDecimal("2000000"), 5, "Mô tả", null, true
        );

        when(adminCategoryRepository.existsById(999L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminProductService.createProduct(req);
        });

        assertTrue(ex.getMessage().contains("Category ID: 999"));
        verify(adminProductRepository, never()).insertProduct(any());
    }

    @Test
    @DisplayName("TC04 - Cập nhật thông tin và giá bán sản phẩm thành công")
    void updateProduct_Success() {
        SaveProductRequest req = new SaveProductRequest(
                "Sofa Da Góc Chữ L Mới", 1L, "Bộ",
                new BigDecimal("28000000"), 12, "Mô tả mới", "url_updated.jpg", true
        );

        ProductDetailDto updated = new ProductDetailDto(
                5L, "Sofa Da Góc Chữ L Mới", 1L, "Sofa", "Bộ",
                new BigDecimal("28000000"), "url_updated.jpg", 12, true, "Mô tả mới", new ArrayList<>()
        );

        when(adminProductRepository.existsById(5L)).thenReturn(true);
        when(adminCategoryRepository.existsById(1L)).thenReturn(true);
        when(adminProductRepository.findDetailById(5L)).thenReturn(updated);

        ProductDetailDto result = adminProductService.updateProduct(5L, req);

        assertNotNull(result);
        assertEquals("Sofa Da Góc Chữ L Mới", result.name());
        verify(adminProductRepository).updateProduct(5L, req);
    }

    @Test
    @DisplayName("TC05 - Đổi trạng thái Ẩn / Hiện bán sản phẩm thành công")
    void toggleProductStatus_Success() {
        ProductDetailDto current = new ProductDetailDto(
                1L, "Tủ Giày", 1L, "Tủ", "Cái",
                new BigDecimal("3000000"), null, 5, true, "", new ArrayList<>()
        );

        when(adminProductRepository.findDetailById(1L)).thenReturn(current);

        boolean newStatus = adminProductService.toggleProductStatus(1L);

        assertFalse(newStatus);
        verify(adminProductRepository).updateProductActive(1L, false);
    }

    @Test
    @DisplayName("TC06 - Thêm ảnh góc chụp trực tiếp bằng URL thành công")
    void addDirectImageUrl_Success() {
        ProductDetailDto current = new ProductDetailDto(
                1L, "Tủ Giày", 1L, "Tủ", "Cái",
                new BigDecimal("3000000"), null, 5, true, "", new ArrayList<>()
        );

        when(adminProductRepository.findDetailById(1L)).thenReturn(current);
        when(adminProductRepository.findImagesByProductId(1L)).thenReturn(List.of(
                new ProductImageDto(10L, "https://example.com/photo1.jpg", true, 1)
        ));

        List<ProductImageDto> result = adminProductService.addDirectImageUrl(1L, "https://example.com/photo1.jpg");

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(adminProductRepository).insertProductImage(1L, "https://example.com/photo1.jpg", true, 1);
        verify(adminProductRepository).updateProductImageUrl(1L, "https://example.com/photo1.jpg");
    }

    @Test
    @DisplayName("TC07 - Đặt ảnh đại diện chính (Primary Image) thành công")
    void setPrimaryImage_Success() {
        when(adminProductRepository.existsById(1L)).thenReturn(true);

        adminProductService.setPrimaryImage(1L, 10L);

        verify(adminProductRepository).setPrimaryImage(1L, 10L);
    }

    @Test
    @DisplayName("TC08 - Xóa ảnh khỏi album sản phẩm thành công")
    void deleteProductImage_Success() {
        when(adminProductRepository.existsById(1L)).thenReturn(true);

        adminProductService.deleteProductImage(1L, 10L);

        verify(adminProductRepository).deleteProductImage(1L, 10L);
    }
}
