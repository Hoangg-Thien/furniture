package furniture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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

import furniture.model.admin.promotion.CreateOrderDiscountRequest;
import furniture.model.admin.promotion.CreateProductDiscountRequest;
import furniture.model.admin.promotion.CreateProgramRequest;
import furniture.model.admin.promotion.CreateVoucherRequest;
import furniture.model.admin.promotion.OrderDiscountDto;
import furniture.model.admin.promotion.ProductDiscountDto;
import furniture.model.admin.promotion.ProgramDetailResponse;
import furniture.model.admin.promotion.ProgramResponse;
import furniture.model.admin.promotion.VoucherDto;
import furniture.repository.AdminProductRepository;
import furniture.repository.AdminPromotionRepository;
import furniture.service.AdminPromotionService;

@ExtendWith(MockitoExtension.class)
class AdminPromotionServiceTest {

    @Mock
    private AdminPromotionRepository promotionRepository;

    @Mock
    private AdminProductRepository productRepository;

    private AdminPromotionService promotionService;

    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        promotionService = new AdminPromotionService(promotionRepository, productRepository);
    }

    @Test
    @DisplayName("TC01 - Lấy danh sách toàn bộ chiến dịch khuyến mãi")
    void getAllPrograms_ShouldReturnList() {
        List<ProgramResponse> mockData = List.of(
                new ProgramResponse(1L, "Tri Ân Mùa Cưới", "Ưu đãi", now, now.plusMonths(1), "ACTIVE", 3, 2, 5, true),
                new ProgramResponse(2L, "Khai Trương Showroom", "Showroom mới", now, now.plusDays(15), "DRAFT", 0, 1, 0, false)
        );
        when(promotionRepository.findAllPrograms(null, null)).thenReturn(mockData);

        List<ProgramResponse> result = promotionService.getAllPrograms(null, null);

        assertEquals(2, result.size());
        assertEquals("Tri Ân Mùa Cưới", result.get(0).name());
        assertEquals(3, result.get(0).productDiscountsCount());
    }

    @Test
    @DisplayName("TC02 - Tìm chiến dịch theo ID hợp lệ")
    void getProgramById_Success() {
        ProgramResponse mockProgram = new ProgramResponse(1L, "Tri Ân Mùa Cưới", "Ưu đãi", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(mockProgram);

        ProgramResponse result = promotionService.getProgramById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Tri Ân Mùa Cưới", result.name());
    }

    @Test
    @DisplayName("TC03 - Tìm chiến dịch không tồn tại phải ném ngoại lệ")
    void getProgramById_NotFound_ThrowsException() {
        when(promotionRepository.findById(999L)).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                promotionService.getProgramById(999L)
        );
        assertTrue(ex.getMessage().contains("Không tìm thấy"));
    }

    @Test
    @DisplayName("TC04 - Lấy chi tiết chiến dịch gồm SP giảm giá, bậc đơn hàng và kho voucher")
    void getProgramDetail_Success() {
        ProgramResponse mockProgram = new ProgramResponse(1L, "Mùa Cưới 2026", "Mô tả", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(mockProgram);

        List<ProductDiscountDto> mockPd = List.of(new ProductDiscountDto(1L, 1L, 5L, "Sofa Da", "/img.jpg", "bộ", new BigDecimal("15000000"), new BigDecimal("10"), new BigDecimal("13500000"), now, now.plusMonths(1)));
        List<OrderDiscountDto> mockOd = List.of(new OrderDiscountDto(1L, 1L, new BigDecimal("10000000"), new BigDecimal("5"), now, now.plusMonths(1)));
        List<VoucherDto> mockVc = List.of(new VoucherDto(1L, 1L, "Mùa Cưới 2026", "CUOI2026", new BigDecimal("10"), new BigDecimal("5000000"), new BigDecimal("1000000"), 100, 20, 80, now, now.plusMonths(1), "ACTIVE", false));

        when(promotionRepository.findProductDiscountsByProgramId(1L)).thenReturn(mockPd);
        when(promotionRepository.findOrderDiscountsByProgramId(1L)).thenReturn(mockOd);
        when(promotionRepository.findVouchersByProgramId(1L)).thenReturn(mockVc);

        ProgramDetailResponse detail = promotionService.getProgramDetail(1L);

        assertNotNull(detail);
        assertEquals(1, detail.productDiscounts().size());
        assertEquals(1, detail.orderDiscounts().size());
        assertEquals(1, detail.vouchers().size());
        assertEquals("CUOI2026", detail.vouchers().get(0).code());
    }

    @Test
    @DisplayName("TC05 - Tạo chiến dịch mới thành công khi dữ liệu hợp lệ")
    void createProgram_Success() {
        CreateProgramRequest req = new CreateProgramRequest("Black Friday 2026", "Sale lớn nhất năm", now, now.plusDays(7), "ACTIVE");
        when(promotionRepository.existsByName("Black Friday 2026")).thenReturn(false);
        when(promotionRepository.insertProgram(req)).thenReturn(10L);
        when(promotionRepository.findById(10L)).thenReturn(new ProgramResponse(10L, "Black Friday 2026", "Sale lớn nhất năm", now, now.plusDays(7), "ACTIVE"));

        ProgramResponse result = promotionService.createProgram(req);

        assertNotNull(result);
        assertEquals(10L, result.id());
        assertEquals("Black Friday 2026", result.name());
    }

    @Test
    @DisplayName("TC06 - Tạo chiến dịch để trống tên phải ném ngoại lệ")
    void createProgram_BlankName_ThrowsException() {
        CreateProgramRequest req = new CreateProgramRequest("   ", "Mô tả", now, now.plusDays(7), "DRAFT");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                promotionService.createProgram(req)
        );
        assertTrue(ex.getMessage().contains("không được để trống"));
        verify(promotionRepository, never()).insertProgram(any());
    }

    @Test
    @DisplayName("TC07 - Tạo chiến dịch trùng tên đã có phải ném ngoại lệ")
    void createProgram_DuplicateName_ThrowsException() {
        CreateProgramRequest req = new CreateProgramRequest("Black Friday", "Mô tả", now, now.plusDays(7), "DRAFT");
        when(promotionRepository.existsByName("Black Friday")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                promotionService.createProgram(req)
        );
        assertTrue(ex.getMessage().contains("đã tồn tại"));
        verify(promotionRepository, never()).insertProgram(any());
    }

    @Test
    @DisplayName("TC08 - Tạo chiến dịch có ngày kết thúc trước ngày bắt đầu phải ném ngoại lệ")
    void createProgram_EndDateBeforeStartDate_ThrowsException() {
        CreateProgramRequest req = new CreateProgramRequest("Chiến dịch lỗi", "Mô tả", now.plusDays(10), now, "DRAFT");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                promotionService.createProgram(req)
        );
        assertTrue(ex.getMessage().contains("Ngày kết thúc phải lớn hơn"));
    }

    @Test
    @DisplayName("TC09 - Bật/Tắt trạng thái chiến dịch thành công")
    void updateProgramStatus_Success() {
        when(promotionRepository.existsById(1L)).thenReturn(true);

        promotionService.updateProgramStatus(1L, "INACTIVE");

        verify(promotionRepository).updateProgramStatus(1L, "INACTIVE");
    }

    @Test
    @DisplayName("TC10 - Xóa chiến dịch đã có voucher được khách dùng trong đơn hàng phải chặn")
    void deleteProgram_HasUsedVouchers_ThrowsIllegalStateException() {
        when(promotionRepository.existsById(2L)).thenReturn(true);
        when(promotionRepository.countUsedVouchersByProgramId(2L)).thenReturn(5L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                promotionService.deleteProgram(2L)
        );
        assertTrue(ex.getMessage().contains("Không thể xóa chương trình khuyến mãi đã có 5 voucher"));
        verify(promotionRepository, never()).deleteProgram(2L);
    }

    @Test
    @DisplayName("TC11 - Xóa chiến dịch thành công khi chưa phát sinh đơn hàng")
    void deleteProgram_Success() {
        when(promotionRepository.existsById(3L)).thenReturn(true);
        when(promotionRepository.countUsedVouchersByProgramId(3L)).thenReturn(0L);

        promotionService.deleteProgram(3L);

        verify(promotionRepository).deleteProgram(3L);
    }

    @Test
    @DisplayName("TC12 - Thêm sản phẩm giảm giá thành công")
    void addProductDiscount_Success() {
        ProgramResponse prog = new ProgramResponse(1L, "Khuyến mãi", "Desc", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(prog);
        when(productRepository.existsById(10L)).thenReturn(true);
        when(promotionRepository.existsProductDiscount(1L, 10L)).thenReturn(false);

        CreateProductDiscountRequest req = new CreateProductDiscountRequest(10L, new BigDecimal("15"), null, null);
        when(promotionRepository.insertProductDiscount(eq(1L), eq(req), eq(now), eq(now.plusMonths(1)))).thenReturn(101L);

        ProductDiscountDto mockDto = new ProductDiscountDto(101L, 1L, 10L, "Tủ Áo", "/img.jpg", "cái", new BigDecimal("6800000"), new BigDecimal("15"), new BigDecimal("5780000"), now, now.plusMonths(1));
        when(promotionRepository.findProductDiscountsByProgramId(1L)).thenReturn(List.of(mockDto));

        ProductDiscountDto created = promotionService.addProductDiscount(1L, req);

        assertNotNull(created);
        assertEquals(101L, created.id());
        assertEquals("Tủ Áo", created.productName());
        assertEquals(new BigDecimal("15"), created.discountPercent());
    }

    @Test
    @DisplayName("TC13 - Thêm chiết khấu bậc đơn hàng thành công")
    void addOrderDiscount_Success() {
        ProgramResponse prog = new ProgramResponse(1L, "Khuyến mãi", "Desc", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(prog);

        CreateOrderDiscountRequest req = new CreateOrderDiscountRequest(new BigDecimal("30000000"), new BigDecimal("8"), null, null);
        when(promotionRepository.insertOrderDiscount(eq(1L), eq(req), eq(now), eq(now.plusMonths(1)))).thenReturn(201L);

        OrderDiscountDto mockDto = new OrderDiscountDto(201L, 1L, new BigDecimal("30000000"), new BigDecimal("8"), now, now.plusMonths(1));
        when(promotionRepository.findOrderDiscountsByProgramId(1L)).thenReturn(List.of(mockDto));

        OrderDiscountDto created = promotionService.addOrderDiscount(1L, req);

        assertNotNull(created);
        assertEquals(201L, created.id());
        assertEquals(new BigDecimal("30000000"), created.minimumAmount());
    }

    @Test
    @DisplayName("TC14 - Phát hành mã Voucher mới thành công")
    void createVoucher_Success() {
        ProgramResponse prog = new ProgramResponse(1L, "Khuyến mãi", "Desc", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(prog);
        when(promotionRepository.existsVoucherCode("GIAM10")).thenReturn(false);

        CreateVoucherRequest req = new CreateVoucherRequest("giam10", new BigDecimal("10"), new BigDecimal("2000000"), new BigDecimal("500000"), 100, null, null, "ACTIVE");
        when(promotionRepository.insertVoucher(eq(1L), eq(req), eq(now), eq(now.plusMonths(1)))).thenReturn(501L);

        VoucherDto mockVoucher = new VoucherDto(501L, 1L, "Khuyến mãi", "GIAM10", new BigDecimal("10"), new BigDecimal("2000000"), new BigDecimal("500000"), 100, 0, 100, now, now.plusMonths(1), "ACTIVE", false);
        when(promotionRepository.findVoucherById(501L)).thenReturn(mockVoucher);

        VoucherDto result = promotionService.createVoucher(1L, req);

        assertNotNull(result);
        assertEquals(501L, result.id());
        assertEquals("GIAM10", result.code());
    }

    @Test
    @DisplayName("TC15 - Tạo voucher trùng mã code phải ném ngoại lệ")
    void createVoucher_DuplicateCode_ThrowsException() {
        ProgramResponse prog = new ProgramResponse(1L, "Khuyến mãi", "Desc", now, now.plusMonths(1), "ACTIVE");
        when(promotionRepository.findById(1L)).thenReturn(prog);
        when(promotionRepository.existsVoucherCode("KHAITRUONG5")).thenReturn(true);

        CreateVoucherRequest req = new CreateVoucherRequest("KHAITRUONG5", new BigDecimal("5"), BigDecimal.ZERO, null, 100, null, null, "ACTIVE");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                promotionService.createVoucher(1L, req)
        );
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }
}
