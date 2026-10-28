package furniture.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.PageResponse;
import furniture.model.admin.staff.CreateStaffRequest;
import furniture.model.admin.staff.StaffSummaryDto;
import furniture.model.admin.staff.UpdateStaffRequest;
import furniture.repository.AdminStaffRepository;
import furniture.repository.AdminUserRepository;
import furniture.util.PasswordUtil;

@Service
public class AdminStaffService {

    private final AdminStaffRepository adminStaffRepository;
    private final AdminUserRepository adminUserRepository;

    public AdminStaffService(AdminStaffRepository adminStaffRepository, AdminUserRepository adminUserRepository) {
        this.adminStaffRepository = adminStaffRepository;
        this.adminUserRepository = adminUserRepository;
    }

    public PageResponse<StaffSummaryDto> searchStaff(String keyword, Boolean isActive, int page, int size) {
        return adminStaffRepository.searchStaff(keyword, isActive, page, size);
    }

    @Transactional
    public StaffSummaryDto createStaff(CreateStaffRequest req) {
        if (req.username() == null || req.username().trim().length() < 4) {
            throw new IllegalArgumentException("Tên đăng nhập phải có ít nhất 4 ký tự");
        }
        if (req.password() == null || req.password().trim().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu tối thiểu phải từ 6 ký tự");
        }
        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên nhân viên không được để trống");
        }

        String username = req.username().trim().toLowerCase();
        if (adminUserRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Tên đăng nhập '" + username + "' đã tồn tại trong hệ thống");
        }

        String email = req.email() != null && !req.email().trim().isEmpty() ? req.email().trim() : null;
        if (email != null && adminStaffRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' đã được sử dụng bởi nhân viên khác");
        }

        String phone = req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null;
        String address = req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : null;

        // 1. Tạo tài khoản User đăng nhập
        String passwordHash = PasswordUtil.hash(req.password().trim());
        Long userId = adminUserRepository.insertUser(username, passwordHash, "STAFF", true);

        // 2. Tạo hồ sơ nhân viên Staff
        Long staffId = adminStaffRepository.insertStaff(userId, req.fullName().trim(), email, phone, address);

        return new StaffSummaryDto(
                staffId, userId, username, req.fullName().trim(), phone, email, address,
                0L, 0L, true, LocalDateTime.now());
    }

    @Transactional
    public void updateStaff(Long staffId, UpdateStaffRequest req) {
        if (staffId == null) {
            throw new IllegalArgumentException("ID nhân viên không hợp lệ");
        }
        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên nhân viên không được để trống");
        }

        Map<String, Object> staff = adminStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + staffId));

        String newEmail = req.email() != null && !req.email().trim().isEmpty() ? req.email().trim() : null;
        String currentEmail = (String) staff.get("email");

        if (newEmail != null && !newEmail.equalsIgnoreCase(currentEmail != null ? currentEmail : "")) {
            if (adminStaffRepository.countByEmailExcludingStaffId(newEmail, staffId) > 0) {
                throw new IllegalArgumentException("Email '" + newEmail + "' đã được sử dụng bởi nhân viên khác");
            }
        }

        String phone = req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null;
        String address = req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : null;

        adminStaffRepository.updateStaff(staffId, req.fullName().trim(), newEmail, phone, address);
    }

    @Transactional
    public boolean toggleStaffStatus(Long staffId, Long currentLoggedInUserId) {
        if (staffId == null) {
            throw new IllegalArgumentException("ID nhân viên không hợp lệ");
        }

        Map<String, Object> staff = adminStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + staffId));

        Number userIdNum = (Number) staff.get("user_id");
        Long userId = userIdNum != null ? userIdNum.longValue() : null;
        if (userId == null) {
            throw new IllegalArgumentException("Hồ sơ nhân viên chưa được liên kết tài khoản");
        }

        if (currentLoggedInUserId != null && userId.equals(currentLoggedInUserId)) {
            throw new IllegalArgumentException("Không được phép tự vô hiệu hóa tài khoản của chính mình!");
        }

        Boolean activeObj = (Boolean) staff.get("is_active");
        boolean currentStatus = activeObj != null && activeObj;
        boolean newStatus = !currentStatus;

        adminStaffRepository.updateStaffUserActive(userId, newStatus);
        return newStatus;
    }
}
