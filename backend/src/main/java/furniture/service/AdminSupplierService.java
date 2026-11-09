package furniture.service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.supplier.CreateReceiptRequest;
import furniture.model.admin.supplier.PurchaseReceiptItemDto;
import furniture.model.admin.supplier.PurchaseReceiptSummaryDto;
import furniture.model.admin.supplier.SupplierRequest;
import furniture.model.admin.supplier.SupplierResponse;
import furniture.repository.AdminSupplierRepository;

@Service
public class AdminSupplierService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(0|\\+84)[0-9]{9,10}$");
    private final AdminSupplierRepository adminSupplierRepository;

    public AdminSupplierService(AdminSupplierRepository adminSupplierRepository) {
        this.adminSupplierRepository = adminSupplierRepository;
    }

    public List<SupplierResponse> getAllSuppliers(String search) {
        return adminSupplierRepository.findAllWithReceiptCount(search);
    }

    public SupplierResponse getSupplierById(Long id) {
        SupplierResponse supplier = adminSupplierRepository.findById(id);
        if (supplier == null) {
            throw new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + id);
        }
        return supplier;
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest req) {
        validateSupplierRequest(req, null);

        Long id = adminSupplierRepository.insertSupplier(req);
        return new SupplierResponse(
                id,
                req.name().trim(),
                req.phone() != null ? req.phone().trim() : null,
                req.email() != null ? req.email().trim() : null,
                req.address() != null ? req.address().trim() : null,
                0L,
                BigDecimal.ZERO
        );
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest req) {
        SupplierResponse current = adminSupplierRepository.findById(id);
        if (current == null) {
            throw new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + id);
        }

        validateSupplierRequest(req, id);

        adminSupplierRepository.updateSupplier(id, req);
        return adminSupplierRepository.findById(id);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        if (!adminSupplierRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + id);
        }

        Long receiptCount = adminSupplierRepository.countReceiptsBySupplierId(id);
        if (receiptCount != null && receiptCount > 0) {
            throw new IllegalStateException("Không thể xóa nhà cung cấp đã có " + receiptCount + " phiếu nhập kho. Vui lòng giữ lại để phục vụ đối soát công nợ và kế toán!");
        }

        adminSupplierRepository.deleteSupplier(id);
    }

    public List<PurchaseReceiptSummaryDto> getReceiptHistory(Long supplierId) {
        if (!adminSupplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + supplierId);
        }
        return adminSupplierRepository.findReceiptsBySupplierId(supplierId);
    }

    public List<PurchaseReceiptItemDto> getReceiptItems(Long supplierId, Long receiptId) {
        adminSupplierRepository.getReceiptStatus(supplierId, receiptId, false);
        return adminSupplierRepository.findReceiptItemsByReceiptId(receiptId);
    }

    @Transactional
    public Long createReceipt(Long supplierId, CreateReceiptRequest req) {
        if (!adminSupplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + supplierId);
        }

        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Phiếu nhập kho phải có ít nhất 1 mặt hàng.");
        }

        var productIds = new HashSet<Long>();
        for (var item : req.items()) {
            if (item == null || item.productId() == null || item.productId() <= 0) {
                throw new IllegalArgumentException("Vui lòng chọn sản phẩm hợp lệ cho từng dòng nhập.");
            }
            if (!productIds.add(item.productId())) {
                throw new IllegalArgumentException("Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu nhập.");
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Số lượng nhập phải là số nguyên lớn hơn 0.");
            }
            if (item.unitPrice() == null || item.unitPrice().signum() < 0) {
                throw new IllegalArgumentException("Đơn giá nhập phải lớn hơn hoặc bằng 0.");
            }
            if (!adminSupplierRepository.productExists(item.productId())) {
                throw new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + item.productId());
            }
        }

        Long staffId = req.staffId() != null ? req.staffId() : 1L;
        if (!adminSupplierRepository.staffExists(staffId)) {
            throw new IllegalArgumentException("Không tìm thấy nhân viên lập phiếu.");
        }
        String status = req.status() == null ? "COMPLETED" : req.status().trim().toUpperCase(Locale.ROOT);
        if (!List.of("PENDING", "COMPLETED").contains(status)) {
            throw new IllegalArgumentException("Phiếu mới phải ở trạng thái PENDING hoặc COMPLETED.");
        }

        return adminSupplierRepository.insertPurchaseReceipt(supplierId, staffId, status, req.items());
    }

    @Transactional
    public void updateReceiptStatus(Long supplierId, Long receiptId, String status) {
        adminSupplierRepository.updateReceiptStatus(supplierId, receiptId, status);
    }

    private void validateSupplierRequest(SupplierRequest req, Long excludeId) {
        if (req.name() == null || req.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên nhà cung cấp / xưởng sản xuất không được để trống");
        }
        if (req.name().trim().length() > 200) {
            throw new IllegalArgumentException("Tên nhà cung cấp không được vượt quá 200 ký tự");
        }

        String name = req.name().trim();
        boolean isDuplicate = (excludeId == null)
                ? adminSupplierRepository.existsByName(name)
                : adminSupplierRepository.existsByNameExcludingId(name, excludeId);

        if (isDuplicate) {
            throw new IllegalArgumentException("Tên nhà cung cấp '" + name + "' đã tồn tại trong danh bạ đối tác!");
        }

        if (req.phone() != null && !req.phone().trim().isEmpty()) {
            String phone = req.phone().trim();
            if (!PHONE_PATTERN.matcher(phone).matches()) {
                throw new IllegalArgumentException("Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84)");
            }
        }

        if (req.email() != null && !req.email().trim().isEmpty()) {
            String email = req.email().trim();
            if (email.length() > 150) {
                throw new IllegalArgumentException("Email không được vượt quá 150 ký tự");
            }
            if (!email.contains("@") || !email.contains(".")) {
                throw new IllegalArgumentException("Định dạng email liên hệ không hợp lệ");
            }
        }
    }
}
