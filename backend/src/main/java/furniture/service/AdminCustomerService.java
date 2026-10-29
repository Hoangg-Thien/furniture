package furniture.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.PageResponse;
import furniture.model.admin.customer.CustomerCartItemDto;
import furniture.model.admin.customer.CustomerDetailResponse;
import furniture.model.admin.customer.CustomerOrderDto;
import furniture.model.admin.customer.CustomerTableItemDto;
import furniture.model.admin.customer.UpdateCustomerRequest;
import furniture.repository.AdminCustomerRepository;

@Service
public class AdminCustomerService {

    private final AdminCustomerRepository adminCustomerRepository;

    public AdminCustomerService(AdminCustomerRepository adminCustomerRepository) {
        this.adminCustomerRepository = adminCustomerRepository;
    }

    public PageResponse<CustomerTableItemDto> getCustomers(
            String keyword, String tier, BigDecimal minSpent, BigDecimal maxSpent, int page, int size) {
        return adminCustomerRepository.searchCustomers(keyword, tier, minSpent, maxSpent, page, size);
    }

    public CustomerDetailResponse getCustomerDetail(Long customerId) {
        if (customerId == null) {
            throw new IllegalArgumentException("ID khách hàng không hợp lệ");
        }

        Map<String, Object> customer = adminCustomerRepository.findCustomerByIdWithStats(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách hàng với ID: " + customerId));

        Long id = ((Number) customer.get("id")).longValue();
        Number userIdNum = (Number) customer.get("user_id");
        Long userId = userIdNum != null ? userIdNum.longValue() : null;
        String username = (String) customer.get("username");
        String fullName = (String) customer.get("full_name");
        String phone = (String) customer.get("phone");
        String email = (String) customer.get("email");
        String address = (String) customer.get("address");
        long totalOrders = ((Number) customer.get("total_orders")).longValue();
        long completedOrders = ((Number) customer.get("completed_orders")).longValue();
        BigDecimal totalSpent = (BigDecimal) customer.get("total_spent");
        Boolean isUserActive = (Boolean) customer.get("is_user_active");
        Timestamp ts = (Timestamp) customer.get("created_at");
        LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;

        String customerTier = AdminCustomerRepository.computeTier(totalSpent, completedOrders);

        List<CustomerOrderDto> orders = adminCustomerRepository.findOrdersByCustomerId(customerId);
        List<CustomerCartItemDto> cartItems = adminCustomerRepository.findCartItemsByCustomerId(customerId);

        return new CustomerDetailResponse(
                id, userId, username, fullName, phone, email, address,
                totalOrders, completedOrders, totalSpent, customerTier, isUserActive, createdAt,
                orders, cartItems);
    }

    @Transactional
    public void updateCustomerProfile(Long customerId, UpdateCustomerRequest req) {
        if (customerId == null) {
            throw new IllegalArgumentException("ID khách hàng không hợp lệ");
        }

        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên khách hàng không được để trống");
        }

        Map<String, Object> customer = adminCustomerRepository.findCustomerByIdWithStats(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách hàng với ID: " + customerId));

        String newEmail = req.email() != null && !req.email().trim().isEmpty() ? req.email().trim() : null;
        String currentEmail = (String) customer.get("email");

        if (newEmail != null && !newEmail.equalsIgnoreCase(currentEmail != null ? currentEmail : "")) {
            if (adminCustomerRepository.countByEmailExcludingCustomerId(newEmail, customerId) > 0) {
                throw new IllegalArgumentException("Email '" + newEmail + "' đã được sử dụng bởi khách hàng khác");
            }
        }

        String phone = req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null;
        String address = req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : null;

        adminCustomerRepository.updateCustomer(customerId, req.fullName().trim(), phone, newEmail, address);
    }

    public List<CustomerTableItemDto> getAllCustomersForExport(
            String keyword, String tier, BigDecimal minSpent, BigDecimal maxSpent) {
        // Xuất tối đa 5000 bản ghi
        PageResponse<CustomerTableItemDto> res = adminCustomerRepository.searchCustomers(
                keyword, tier, minSpent, maxSpent, 0, 5000);
        return res.content();
    }
}
