package furniture.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import furniture.model.ValidateVoucherRequest;
import furniture.model.admin.promotion.VoucherCheckRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.promotion.CreateOrderDiscountRequest;
import furniture.model.admin.promotion.CreateProductDiscountRequest;
import furniture.model.admin.promotion.CreateProgramRequest;
import furniture.model.admin.promotion.CreateVoucherRequest;
import furniture.model.admin.promotion.OrderDiscountDto;
import furniture.model.admin.promotion.ProductDiscountDto;
import furniture.model.admin.promotion.ProgramDetailResponse;
import furniture.model.admin.promotion.ProgramResponse;
import furniture.model.admin.promotion.VoucherDto;
import furniture.repository.AdminCustomerRepository;
import furniture.repository.AdminProductRepository;
import furniture.repository.AdminPromotionRepository;

@Service
public class AdminPromotionService {

    private final AdminPromotionRepository promotionRepository;
    private final AdminProductRepository productRepository;
    private final VoucherService voucherService;

    public AdminPromotionService(AdminPromotionRepository promotionRepository, AdminProductRepository productRepository, VoucherService voucherService) {
        this.promotionRepository = promotionRepository;
        this.productRepository = productRepository;
        this.voucherService = voucherService;
    }

    public List<ProgramResponse> getAllPrograms(String search, String status) {
        return promotionRepository.findAllPrograms(search, status);
    }

    public ProgramResponse getProgramById(Long id) {
        ProgramResponse program = promotionRepository.findById(id);
        if (program == null) {
            throw new IllegalArgumentException("Không tìm thấy chiến dịch khuyến mãi với ID: " + id);
        }
        return program;
    }

    public ProgramDetailResponse getProgramDetail(Long id) {
        ProgramResponse program = getProgramById(id);
        List<ProductDiscountDto> productDiscounts = promotionRepository.findProductDiscountsByProgramId(id);
        List<OrderDiscountDto> orderDiscounts = promotionRepository.findOrderDiscountsByProgramId(id);
        List<VoucherDto> vouchers = promotionRepository.findVouchersByProgramId(id);
        return new ProgramDetailResponse(program, productDiscounts, orderDiscounts, vouchers);
    }

    @Transactional
    public ProgramResponse createProgram(CreateProgramRequest req) {
        validateProgramRequest(req, null);

        Long id = promotionRepository.insertProgram(req);
        return promotionRepository.findById(id);
    }

    @Transactional
    public ProgramResponse updateProgram(Long id, CreateProgramRequest req) {
        if (!promotionRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy chiến dịch khuyến mãi với ID: " + id);
        }

        validateProgramRequest(req, id);

        promotionRepository.updateProgram(id, req);
        return promotionRepository.findById(id);
    }

    @Transactional
    public void updateProgramStatus(Long id, String status) {
        if (!promotionRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy chiến dịch khuyến mãi với ID: " + id);
        }
        String validStatus = status != null ? status.trim().toUpperCase() : "DRAFT";
        if (!List.of("DRAFT", "ACTIVE", "INACTIVE").contains(validStatus)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status + ". Chỉ chấp nhận DRAFT, ACTIVE hoặc INACTIVE.");
        }
        promotionRepository.updateProgramStatus(id, validStatus);
    }

    @Transactional
    public void deleteProgram(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy chiến dịch khuyến mãi với ID: " + id);
        }

        Long usedCount = promotionRepository.countUsedVouchersByProgramId(id);
        if (usedCount != null && usedCount > 0) {
            throw new IllegalStateException("Không thể xóa chương trình khuyến mãi đã có " + usedCount + " voucher được khách áp dụng trong đơn hàng. Vui lòng chuyển trạng thái sang INACTIVE!");
        }

        promotionRepository.deleteProgram(id);
    }

    // -------------------------------------------------------------------------
    // Product Discounts
    // -------------------------------------------------------------------------
    @Transactional
    public ProductDiscountDto addProductDiscount(Long programId, CreateProductDiscountRequest req) {
        ProgramResponse program = getProgramById(programId);

        if (req.productId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn sản phẩm cần giảm giá");
        }
        if (!productRepository.existsById(req.productId())) {
            throw new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + req.productId());
        }

        if (req.discountPercent() == null || req.discountPercent().compareTo(BigDecimal.ZERO) <= 0 || req.discountPercent().compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("% giảm giá phải lớn hơn 0 và nhỏ hơn hoặc bằng 100%");
        }

        if (promotionRepository.existsProductDiscount(programId, req.productId())) {
            throw new IllegalArgumentException("Sản phẩm này đã được cấu hình giảm giá trong chiến dịch này!");
        }

        LocalDateTime start = req.startDate() != null ? req.startDate() : program.startDate();
        LocalDateTime end = req.endDate() != null ? req.endDate() : program.endDate();
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Ngày kết thúc giảm giá sản phẩm phải sau ngày bắt đầu!");
        }

        Long discountId = promotionRepository.insertProductDiscount(programId, req, program.startDate(), program.endDate());
        List<ProductDiscountDto> list = promotionRepository.findProductDiscountsByProgramId(programId);
        return list.stream().filter(pd -> pd.id().equals(discountId)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Không thể lấy dữ liệu giảm giá vừa tạo"));
    }

    @Transactional
    public void deleteProductDiscount(Long discountId) {
        promotionRepository.deleteProductDiscount(discountId);
    }

    // -------------------------------------------------------------------------
    // Order Discounts
    // -------------------------------------------------------------------------
    @Transactional
    public OrderDiscountDto addOrderDiscount(Long programId, CreateOrderDiscountRequest req) {
        ProgramResponse program = getProgramById(programId);

        if (req.minimumAmount() == null || req.minimumAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Mức đơn hàng tối thiểu phải lớn hơn hoặc bằng 0");
        }

        if (req.discountPercent() == null || req.discountPercent().compareTo(BigDecimal.ZERO) <= 0 || req.discountPercent().compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("% chiết khấu phải lớn hơn 0 và không vượt quá 100%");
        }

        LocalDateTime start = req.startDate() != null ? req.startDate() : program.startDate();
        LocalDateTime end = req.endDate() != null ? req.endDate() : program.endDate();
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Ngày kết thúc chiết khấu bậc đơn hàng phải sau ngày bắt đầu!");
        }

        Long discountId = promotionRepository.insertOrderDiscount(programId, req, program.startDate(), program.endDate());
        List<OrderDiscountDto> list = promotionRepository.findOrderDiscountsByProgramId(programId);
        return list.stream().filter(od -> od.id().equals(discountId)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Không thể lấy dữ liệu chiết khấu vừa tạo"));
    }

    @Transactional
    public void deleteOrderDiscount(Long discountId) {
        promotionRepository.deleteOrderDiscount(discountId);
    }

    // -------------------------------------------------------------------------
    // Vouchers
    // -------------------------------------------------------------------------
    public List<VoucherDto> getAllVouchers(String search, String status) {
        return promotionRepository.findAllVouchers(search, status);
    }

    public Map<String, Object> checkVoucher(Long voucherId, VoucherCheckRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty() || (req.customerId() != null && req.customerId() <= 0)) {
            throw new IllegalArgumentException("Vui lòng cung cấp sản phẩm và mã khách hàng hợp lệ");
        }
        VoucherDto voucher = promotionRepository.findVoucherById(voucherId);
        if (voucher == null) throw new IllegalArgumentException("Không tìm thấy voucher");
        if (voucher.archived()) throw new IllegalStateException("Voucher đã lưu trữ, không thể kiểm tra thử");
        var result = new java.util.LinkedHashMap<String, Object>(voucherService.simulateVoucher(
                new ValidateVoucherRequest(voucher.code(), null, req.items()), req.customerId()));
        var warnings = new java.util.ArrayList<String>();
        ProgramResponse program = getProgramById(voucher.promotionProgramId());
        if (!"ACTIVE".equals(voucher.status())) warnings.add("Voucher đang tạm ngưng");
        if (!"ACTIVE".equals(program.status())) warnings.add("Chiến dịch chưa hoạt động");
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        if (voucher.startDate().isAfter(now) || program.startDate().isAfter(now)) warnings.add("Chưa đến thời gian áp dụng");
        if (voucher.endDate().isBefore(now) || program.endDate().isBefore(now)) warnings.add("Đã hết thời gian áp dụng");
        result.put("simulation", true);
        result.put("warnings", warnings);
        return result;
    }

    @Transactional
    public VoucherDto createVoucher(Long programId, CreateVoucherRequest req) {
        ProgramResponse program = getProgramById(programId);

        if (!List.of("ORDER", "VIP").contains(req.voucherType()) || req.productId() != null) {
            throw new IllegalArgumentException("Chỉ phát hành mã mới theo hóa đơn hoặc hạng thành viên. Ưu đãi sản phẩm được thiết lập theo từng sản phẩm.");
        }
        validateVoucherRequest(program, req, null);

        Long voucherId = promotionRepository.insertVoucher(programId, req, program.startDate(), program.endDate());
        return promotionRepository.findVoucherById(voucherId);
    }

    @Transactional
    public int createOrderVoucherExamples(Long programId) {
        promotionRepository.lockProgram(programId);
        ProgramResponse program = getProgramById(programId);
        List<CreateVoucherRequest> examples = List.of(
                orderVoucherExample(programId, 3, 5, 200_000),
                orderVoucherExample(programId, 7, 10, 700_000),
                orderVoucherExample(programId, 15, 15, 1_500_000));
        int created = 0;
        for (CreateVoucherRequest request : examples) {
            if (promotionRepository.existsVoucherCode(request.code())) continue;
            promotionRepository.insertVoucher(programId, request, program.startDate(), program.endDate());
            created++;
        }
        return created;
    }

    private CreateVoucherRequest orderVoucherExample(Long programId, int minimumMillions, int percent, int maximum) {
        return new CreateVoucherRequest("HD-" + programId + "-" + minimumMillions + "TR",
                BigDecimal.valueOf(percent), BigDecimal.valueOf(minimumMillions * 1_000_000L),
                BigDecimal.valueOf(maximum), 50, null, null, "INACTIVE", "ORDER", null);
    }

    private void validateVoucherRequest(ProgramResponse program, CreateVoucherRequest req, VoucherDto existing) {
        if (!AdminCustomerRepository.MEMBER_TIERS.contains(req.customerTier())) {
            throw new IllegalArgumentException("Hạng khách hàng không hợp lệ");
        }
        if (req.status() != null && !List.of("ACTIVE", "INACTIVE").contains(req.status().trim().toUpperCase())) {
            throw new IllegalArgumentException("Trạng thái voucher không hợp lệ");
        }
        if (existing != null && (!existing.voucherType().equals(req.voucherType()) || !java.util.Objects.equals(existing.productId(), req.productId()))) {
            throw new IllegalArgumentException("Giữ nguyên loại voucher và sản phẩm; hãy tạo mã mới nếu cần đổi loại");
        }
        if (req.code() == null || req.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã Voucher không được để trống");
        }
        String cleanCode = req.code().trim().toUpperCase();
        if (cleanCode.length() > 50) throw new IllegalArgumentException("Mã voucher không được quá 50 ký tự");
        if ((existing == null || !cleanCode.equalsIgnoreCase(existing.code())) && promotionRepository.existsVoucherCode(cleanCode)) {
            throw new IllegalArgumentException("Mã voucher '" + cleanCode + "' đã tồn tại trong hệ thống!");
        }

        if (req.discountPercent() == null || req.discountPercent().compareTo(BigDecimal.ZERO) <= 0 || req.discountPercent().compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("% giảm giá voucher phải lớn hơn 0 và không vượt quá 100%");
        }

        if (req.quantity() == null || req.quantity() < 1) {
            throw new IllegalArgumentException("Số lượng phát hành voucher phải từ 1 trở lên");
        }

        if (req.minimumAmount() != null && req.minimumAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng tối thiểu áp dụng voucher phải >= 0");
        }

        if (req.maximumDiscount() != null && req.maximumDiscount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Mức giảm tối đa của voucher phải >= 0");
        }

        LocalDateTime start = req.startDate() != null ? req.startDate() : existing == null ? program.startDate() : existing.startDate();
        LocalDateTime end = req.endDate() != null ? req.endDate() : existing == null ? program.endDate() : existing.endDate();
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Hạn dùng của voucher phải sau ngày bắt đầu!");
        }

    }

    private VoucherDto requireEditableVoucher(Long id) {
        promotionRepository.lockVoucher(id);
        VoucherDto voucher = promotionRepository.findVoucherById(id);
        if (voucher == null) throw new IllegalArgumentException("Không tìm thấy voucher");
        if (voucher.archived()) throw new IllegalStateException("Voucher đã lưu trữ, không thể chỉnh sửa hoặc kích hoạt lại");
        return voucher;
    }

    @Transactional
    public VoucherDto updateVoucher(Long id, CreateVoucherRequest req) {
        VoucherDto voucher = requireEditableVoucher(id);
        if (!"INACTIVE".equals(voucher.status())) {
            throw new IllegalStateException("Hãy tạm ngưng voucher trước khi chỉnh sửa");
        }
        if (voucher.usedQuantity() > 0 || promotionRepository.countOrdersUsingVoucher(id) > 0) {
            throw new IllegalStateException("Voucher đã có lịch sử sử dụng. Hãy tạo mã mới thay thế, giữ nguyên điều kiện mã cũ.");
        }
        ProgramResponse program = getProgramById(voucher.promotionProgramId());
        validateVoucherRequest(program, req, voucher);
        promotionRepository.updateVoucher(id, req, req.startDate() == null ? voucher.startDate() : req.startDate(),
                req.endDate() == null ? voucher.endDate() : req.endDate());
        return promotionRepository.findVoucherById(id);
    }

    @Transactional
    public VoucherDto replaceVoucher(Long id, CreateVoucherRequest req) {
        VoucherDto old = requireEditableVoucher(id);
        if (req.code() == null || old.code().equalsIgnoreCase(req.code().trim())) throw new IllegalArgumentException("Mã thay thế phải khác mã cũ");
        ProgramResponse program = getProgramById(old.promotionProgramId());
        validateVoucherRequest(program, req, old);
        Long newId = promotionRepository.insertVoucher(old.promotionProgramId(), req, old.startDate(), old.endDate());
        promotionRepository.updateVoucherStatus(id, "INACTIVE");
        return promotionRepository.findVoucherById(newId);
    }

    public List<Map<String, Object>> getVoucherOrders(Long id) {
        if (promotionRepository.findVoucherById(id) == null) throw new IllegalArgumentException("Không tìm thấy voucher");
        return promotionRepository.findVoucherOrders(id);
    }

    @Transactional
    public void updateVoucherStatus(Long voucherId, String status) {
        requireEditableVoucher(voucherId);
        String validStatus = status != null ? status.trim().toUpperCase() : "";
        if (!List.of("ACTIVE", "INACTIVE").contains(validStatus)) {
            throw new IllegalArgumentException("Trạng thái voucher không hợp lệ: " + status);
        }
        promotionRepository.updateVoucherStatus(voucherId, validStatus);
    }

    @Transactional
    public boolean deleteVoucher(Long voucherId) {
        promotionRepository.lockVoucher(voucherId);
        VoucherDto voucher = promotionRepository.findVoucherById(voucherId);
        if (voucher == null) {
            throw new IllegalArgumentException("Không tìm thấy voucher với ID: " + voucherId);
        }

        if (voucher.usedQuantity() > 0 || promotionRepository.countOrdersUsingVoucher(voucherId) > 0) {
            promotionRepository.deleteVoucher(voucherId);
            return true;
        }
        try {
            if (promotionRepository.deleteUnusedVoucher(voucherId) != 1) {
                throw new IllegalStateException("Voucher đã thay đổi. Vui lòng tải lại trước khi xóa");
            }
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new IllegalStateException("Voucher có dữ liệu tham chiếu, không thể xóa vĩnh viễn");
        }
        return false;
    }

    private void validateProgramRequest(CreateProgramRequest req, Long excludeId) {
        if (req.name() == null || req.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên chiến dịch khuyến mãi không được để trống");
        }
        if (req.name().trim().length() > 200) {
            throw new IllegalArgumentException("Tên chiến dịch không được vượt quá 200 ký tự");
        }

        String name = req.name().trim();
        boolean isDuplicate = (excludeId == null)
                ? promotionRepository.existsByName(name)
                : promotionRepository.existsByNameExcludingId(name, excludeId);

        if (isDuplicate) {
            throw new IllegalArgumentException("Tên chiến dịch khuyến mãi '" + name + "' đã tồn tại!");
        }

        if (req.startDate() == null) {
            throw new IllegalArgumentException("Ngày bắt đầu chiến dịch không được để trống");
        }
        if (req.endDate() == null) {
            throw new IllegalArgumentException("Ngày kết thúc chiến dịch không được để trống");
        }
        if (req.endDate().isBefore(req.startDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        if (req.status() != null && !req.status().trim().isEmpty()) {
            String status = req.status().trim().toUpperCase();
            if (!List.of("DRAFT", "ACTIVE", "INACTIVE").contains(status)) {
                throw new IllegalArgumentException("Trạng thái chiến dịch không hợp lệ: " + req.status());
            }
        }
    }
}
