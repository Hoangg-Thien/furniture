package furniture.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.admin.CreateUserRequest;
import furniture.model.admin.PageResponse;
import furniture.model.admin.UserSummaryResponse;
import furniture.repository.AdminUserRepository;
import furniture.util.PasswordUtil;

@Service
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminUserService(AdminUserRepository adminUserRepository, JdbcTemplate jdbcTemplate) {
        this.adminUserRepository = adminUserRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public PageResponse<UserSummaryResponse> searchUsers(String keyword, String role, Boolean isActive, int page, int size) {
        return adminUserRepository.searchUsers(keyword, role, isActive, page, size);
    }

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        if (request.username() == null || request.username().trim().length() < 4) {
            throw new IllegalArgumentException("Tên đăng nhập phải có ít nhất 4 ký tự");
        }
        if (request.password() == null || request.password().trim().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu tối thiểu phải từ 6 ký tự");
        }

        String username = request.username().trim().toLowerCase();
        if (adminUserRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Tên đăng nhập '" + username + "' đã tồn tại trong hệ thống");
        }

        String role = request.role() != null ? request.role().trim().toUpperCase() : "STAFF";
        if (!"ADMIN".equals(role) && !"STAFF".equals(role) && !"CUSTOMER".equals(role)) {
            throw new IllegalArgumentException("Vai trò không hợp lệ: " + role);
        }

        String passwordHash = PasswordUtil.hash(request.password().trim());
        Long userId = adminUserRepository.insertUser(username, passwordHash, role, true);

        // Khởi tạo bản ghi tương ứng trong bảng staff / admins / customers nếu cần
        try {
            if ("STAFF".equals(role)) {
                jdbcTemplate.update(
                    "INSERT INTO public.staff (user_id, full_name, role) VALUES (?, ?, 'STAFF') ON CONFLICT (user_id) DO NOTHING",
                    userId, username);
            } else if ("ADMIN".equals(role)) {
                jdbcTemplate.update(
                    "INSERT INTO public.admins (user_id, full_name, role) VALUES (?, ?, 'ADMIN') ON CONFLICT (user_id) DO NOTHING",
                    userId, username);
            }
        } catch (Exception e) {
            // Log nhưng không làm hỏng flow tạo user
            System.err.println("Notice: Could not insert supplementary role table record: " + e.getMessage());
        }

        return new UserSummaryResponse(userId, username, role, true, LocalDateTime.now());
    }

    @Transactional
    public boolean toggleActiveStatus(Long targetUserId, Long currentLoggedInUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("ID tài khoản không hợp lệ");
        }

        if (currentLoggedInUserId != null && targetUserId.equals(currentLoggedInUserId)) {
            throw new IllegalArgumentException("Không được phép tự vô hiệu hóa tài khoản của chính mình!");
        }

        Map<String, Object> user = adminUserRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + targetUserId));

        Object activeObj = user.get("is_active");
        boolean currentStatus = activeObj != null && Boolean.TRUE.equals(activeObj);
        boolean newStatus = !currentStatus;

        adminUserRepository.updateActiveStatus(targetUserId, newStatus);
        return newStatus;
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("ID tài khoản không hợp lệ");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu mới phải có tối thiểu 6 ký tự");
        }

        adminUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại với ID: " + userId));

        String hashed = PasswordUtil.hash(newPassword.trim());
        adminUserRepository.updatePassword(userId, hashed);
    }
}
