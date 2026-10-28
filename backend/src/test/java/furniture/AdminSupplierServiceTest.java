package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.supplier.CreateReceiptRequest;
import furniture.model.admin.supplier.PurchaseReceiptSummaryDto;
import furniture.model.admin.supplier.SupplierRequest;
import furniture.model.admin.supplier.SupplierResponse;
import furniture.repository.AdminSupplierRepository;
import furniture.service.AdminSupplierService;

@ExtendWith(MockitoExtension.class)
class AdminSupplierServiceTest {

    @Mock
    private AdminSupplierRepository adminSupplierRepository;

    private AdminSupplierService adminSupplierService;

    @BeforeEach
    void setUp() {
        adminSupplierService = new AdminSupplierService(adminSupplierRepository);
    }

    @Test
    @DisplayName("TC01 - Lấy danh sách toàn bộ nhà cung cấp kèm số lượng phiếu nhập")
    void getAllSuppliers_ShouldReturnList() {
        List<SupplierResponse> mockData = List.of(
                new SupplierResponse(1L, "Công ty Gỗ Trường Thành", "02838000001", "sales@gotruongthanh.example.com", "Bình Dương", 2L, new BigDecimal("45000000")),
                new SupplierResponse(2L, "Xưởng Sofa Hoàng Gia", "02838000002", "sales@sofahoanggia.example.com", "TP.HCM", 3L, new BigDecimal("85000000"))
        );
        when(adminSupplierRepository.findAllWithReceiptCount("Gỗ")).thenReturn(mockData);

        List<SupplierResponse> result = adminSupplierService.getAllSuppliers("Gỗ");

        assertEquals(2, result.size());
        assertEquals("Công ty Gỗ Trường Thành", result.get(0).name());
        assertEquals(2L, result.get(0).totalReceiptsCount());
        assertEquals(new BigDecimal("45000000"), result.get(0).totalReceiptValue());
    }

    @Test
    @DisplayName("TC02 - Tìm kiếm nhà cung cấp theo ID hợp lệ")
    void getSupplierById_Success() {
        SupplierResponse mockSupplier = new SupplierResponse(1L, "Công ty Gỗ Trường Thành", "02838000001", "sales@gotruongthanh.example.com", "Bình Dương", 2L);
        when(adminSupplierRepository.findById(1L)).thenReturn(mockSupplier);

        SupplierResponse result = adminSupplierService.getSupplierById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Công ty Gỗ Trường Thành", result.name());
    }

    @Test
    @DisplayName("TC03 - Tìm kiếm nhà cung cấp theo ID không tồn tại phải ném ngoại lệ")
    void getSupplierById_NotFound_ThrowsException() {
        when(adminSupplierRepository.findById(999L)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminSupplierService.getSupplierById(999L)
        );

        assertTrue(ex.getMessage().contains("Không tìm thấy"));
    }

    @Test
    @DisplayName("TC04 - Thêm mới nhà cung cấp thành công khi dữ liệu hợp lệ")
    void createSupplier_Success() {
        SupplierRequest req = new SupplierRequest(
                "Xưởng Phụ Kiện Hafele",
                "0909123456",
                "hafele@example.com",
                "KCN VSIP, Bình Dương"
        );
        when(adminSupplierRepository.existsByName("Xưởng Phụ Kiện Hafele")).thenReturn(false);
        when(adminSupplierRepository.insertSupplier(req)).thenReturn(11L);

        SupplierResponse result = adminSupplierService.createSupplier(req);

        assertNotNull(result);
        assertEquals(11L, result.id());
        assertEquals("Xưởng Phụ Kiện Hafele", result.name());
        assertEquals("0909123456", result.phone());
        assertEquals(0L, result.totalReceiptsCount());
    }

    @Test
    @DisplayName("TC05 - Thêm nhà cung cấp để trống tên phải ném ngoại lệ")
    void createSupplier_BlankName_ThrowsException() {
        SupplierRequest req = new SupplierRequest("   ", "0909123456", "test@example.com", "Địa chỉ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminSupplierService.createSupplier(req)
        );

        assertTrue(ex.getMessage().contains("không được để trống"));
        verify(adminSupplierRepository, never()).insertSupplier(any());
    }

    @Test
    @DisplayName("TC06 - Thêm nhà cung cấp trùng tên đã có phải ném ngoại lệ")
    void createSupplier_DuplicateName_ThrowsException() {
        SupplierRequest req = new SupplierRequest("Công ty Gỗ Trường Thành", "0909123456", "test@example.com", "Địa chỉ");
        when(adminSupplierRepository.existsByName("Công ty Gỗ Trường Thành")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminSupplierService.createSupplier(req)
        );

        assertTrue(ex.getMessage().contains("đã tồn tại"));
        verify(adminSupplierRepository, never()).insertSupplier(any());
    }

    @Test
    @DisplayName("TC07 - Thêm nhà cung cấp với số điện thoại sai định dạng phải ném ngoại lệ")
    void createSupplier_InvalidPhone_ThrowsException() {
        SupplierRequest req = new SupplierRequest("Xưởng Mộc Mới", "123456", "test@example.com", "Địa chỉ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminSupplierService.createSupplier(req)
        );

        assertTrue(ex.getMessage().contains("Số điện thoại không hợp lệ"));
    }

    @Test
    @DisplayName("TC08 - Cập nhật nhà cung cấp thành công")
    void updateSupplier_Success() {
        SupplierResponse current = new SupplierResponse(1L, "Công ty Gỗ", "02838000001", "old@example.com", "Bình Dương", 2L);
        SupplierRequest req = new SupplierRequest("Công ty Gỗ Trường Thành Mới", "0909888999", "new@example.com", "Đồng Nai");

        when(adminSupplierRepository.findById(1L)).thenReturn(current).thenReturn(
                new SupplierResponse(1L, "Công ty Gỗ Trường Thành Mới", "0909888999", "new@example.com", "Đồng Nai", 2L)
        );
        when(adminSupplierRepository.existsByNameExcludingId("Công ty Gỗ Trường Thành Mới", 1L)).thenReturn(false);

        SupplierResponse updated = adminSupplierService.updateSupplier(1L, req);

        assertNotNull(updated);
        assertEquals("Công ty Gỗ Trường Thành Mới", updated.name());
        assertEquals("0909888999", updated.phone());
        verify(adminSupplierRepository).updateSupplier(1L, req);
    }

    @Test
    @DisplayName("TC09 - Xóa nhà cung cấp thành công khi chưa có phiếu nhập kho nào")
    void deleteSupplier_Success_WhenNoReceipts() {
        when(adminSupplierRepository.existsById(5L)).thenReturn(true);
        when(adminSupplierRepository.countReceiptsBySupplierId(5L)).thenReturn(0L);

        adminSupplierService.deleteSupplier(5L);

        verify(adminSupplierRepository).deleteSupplier(5L);
    }

    @Test
    @DisplayName("TC10 - Xóa nhà cung cấp đã có phiếu nhập kho phải chặn và ném ngoại lệ IllegalStateException")
    void deleteSupplier_HasReceipts_ThrowsIllegalStateException() {
        when(adminSupplierRepository.existsById(2L)).thenReturn(true);
        when(adminSupplierRepository.countReceiptsBySupplierId(2L)).thenReturn(3L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminSupplierService.deleteSupplier(2L)
        );

        assertTrue(ex.getMessage().contains("Không thể xóa nhà cung cấp đã có 3 phiếu nhập kho"));
        verify(adminSupplierRepository, never()).deleteSupplier(2L);
    }

    @Test
    @DisplayName("TC11 - Xem lịch sử phiếu nhập kho theo nhà cung cấp")
    void getReceiptHistory_Success() {
        when(adminSupplierRepository.existsById(1L)).thenReturn(true);
        List<PurchaseReceiptSummaryDto> mockReceipts = List.of(
                new PurchaseReceiptSummaryDto(2L, 1L, 2L, "Trần Thị Lan", LocalDateTime.now(), "COMPLETED", new BigDecimal("32000000"), 2),
                new PurchaseReceiptSummaryDto(12L, 1L, 9L, "Phạm Quốc Bảo", LocalDateTime.now().minusDays(10), "COMPLETED", new BigDecimal("44000000"), 2)
        );
        when(adminSupplierRepository.findReceiptsBySupplierId(1L)).thenReturn(mockReceipts);

        List<PurchaseReceiptSummaryDto> result = adminSupplierService.getReceiptHistory(1L);

        assertEquals(2, result.size());
        assertEquals("Trần Thị Lan", result.get(0).staffName());
        assertEquals("COMPLETED", result.get(0).status());
    }

    @Test
    @DisplayName("TC12 - Tạo phiếu nhập kho mới từ nhà cung cấp thành công")
    void createReceipt_Success() {
        when(adminSupplierRepository.existsById(1L)).thenReturn(true);

        CreateReceiptRequest.ReceiptItemRequest item1 = new CreateReceiptRequest.ReceiptItemRequest(1L, 5, new BigDecimal("10000000"));
        CreateReceiptRequest req = new CreateReceiptRequest(2L, "COMPLETED", List.of(item1));

        when(adminSupplierRepository.insertPurchaseReceipt(eq(1L), eq(2L), eq("COMPLETED"), eq(List.of(item1)))).thenReturn(16L);

        Long receiptId = adminSupplierService.createReceipt(1L, req);

        assertEquals(16L, receiptId);
        verify(adminSupplierRepository).insertPurchaseReceipt(eq(1L), eq(2L), eq("COMPLETED"), eq(List.of(item1)));
    }
}
