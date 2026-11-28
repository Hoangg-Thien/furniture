package furniture.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.AuthResponse;
import furniture.model.LoginRequest;
import furniture.model.RegisterRequest;
import furniture.model.UpdateProfileRequest;
import furniture.repository.AuthRepository;
import furniture.repository.VoucherRepository;
import furniture.util.PasswordUtil;

@Service
public class AuthService {

    private final AuthRepository authRepository;
    private final VoucherRepository voucherRepository;

    public AuthService(AuthRepository authRepository, VoucherRepository voucherRepository) {
        this.authRepository = authRepository;
        this.voucherRepository = voucherRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.username() == null || req.username().trim().length() < 3) {
            throw new IllegalArgumentException("Tên đăng nhập phải có ít nhất 3 ký tự");
        }
        if (req.password() == null || req.password().trim().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (req.fullName() == null || req.fullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên không được để trống");
        }
        if (req.email() == null || req.email().isBlank()
                || req.phone() == null || req.phone().isBlank()
                || req.address() == null || req.address().isBlank()) {
            throw new IllegalArgumentException("Email, số điện thoại và địa chỉ giao hàng không được để trống");
        }

        String username = req.username().trim();
        if (authRepository.countByUsername(username) > 0) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        String email = req.email().trim();
        if (authRepository.countByEmail(email) > 0) {
            throw new IllegalArgumentException("Email này đã được sử dụng");
        }

        String passwordHash = PasswordUtil.hashPassword(req.password());
        Long userId = authRepository.insertUser(username, passwordHash, "CUSTOMER");

        String phone = req.phone().trim();
        String address = req.address().trim();

        Long customerId = authRepository.insertCustomer(userId, "CUSTOMER", req.fullName().trim(), email, phone, address);

        return new AuthResponse(
                userId,
                customerId,
                username,
                req.fullName().trim(),
                email,
                phone,
                address,
                "CUSTOMER",
                "Đăng ký tài khoản thành công!", null, null, null);
    }

    public AuthResponse login(LoginRequest req) {
        if (req.username() == null || req.username().trim().isEmpty() ||
            req.password() == null || req.password().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
        }

        String identifier = req.username().trim();
        List<Map<String, Object>> rows = authRepository.findUserWithCustomerByIdentifier(identifier);
        if (rows.isEmpty()) {
            throw new SecurityException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        Map<String, Object> user = rows.get(0);
        Object activeObj = user.get("is_active");
        boolean isActive = activeObj == null || Boolean.TRUE.equals(activeObj);
        if (!isActive) {
            throw new IllegalStateException("Tài khoản này đã bị tạm khóa");
        }

        String storedHash = (String) user.get("password_hash");
        if (!PasswordUtil.verify(req.password(), storedHash)) {
            throw new SecurityException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        Number userIdNum = (Number) user.get("user_id");
        if (userIdNum != null && PasswordUtil.needsUpgrade(storedHash)) {
            authRepository.upgradePassword(userIdNum.longValue(), storedHash, PasswordUtil.hashPassword(req.password()));
        }
        Number customerIdNum = (Number) user.get("customer_id");
        String role = (String) user.get("role");
        var tier = customerIdNum != null && "CUSTOMER".equals(role)
                ? voucherRepository.findCustomerTierProgress(customerIdNum.longValue()) : null;

        return new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                role,
                "Đăng nhập thành công!", null, tier == null ? null : tier.tier(), tier);
    }

    public AuthResponse getProfile(Long userId) {
        List<Map<String, Object>> rows = authRepository.findUserWithCustomerById(userId);
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }

        Map<String, Object> user = rows.get(0);
        Number userIdNum = (Number) user.get("user_id");
        Number customerIdNum = (Number) user.get("customer_id");
        var tier = customerIdNum == null ? null : voucherRepository.findCustomerTierProgress(customerIdNum.longValue());

        return new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                (String) user.get("role"),
                "OK", null, tier == null ? null : tier.tier(), tier);
    }

    @Transactional
    public AuthResponse updateProfile(Long userId, UpdateProfileRequest req) {
        List<Map<String, Object>> rows = authRepository.findUserWithCustomerById(userId);
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }

        Map<String, Object> user = rows.get(0);

        if (req.newPassword() != null && !req.newPassword().trim().isEmpty()) {
            if (req.newPassword().trim().length() < 6) {
                throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự");
            }
            if (req.currentPassword() == null || req.currentPassword().trim().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu");
            }
            String storedHash = (String) user.get("password_hash");
            if (!PasswordUtil.verify(req.currentPassword(), storedHash)) {
                throw new SecurityException("Mật khẩu hiện tại không chính xác");
            }
            String newHash = PasswordUtil.hashPassword(req.newPassword());
            authRepository.updatePassword(userId, newHash);
        }

        String fullName = (req.fullName() != null && !req.fullName().trim().isEmpty()) ? req.fullName().trim() : (String) user.get("full_name");
        String email = (req.email() != null && !req.email().trim().isEmpty()) ? req.email().trim() : (String) user.get("email");
        String phone = (req.phone() != null) ? (req.phone().trim().isEmpty() ? null : req.phone().trim()) : (String) user.get("phone");
        String address = (req.address() != null) ? (req.address().trim().isEmpty() ? null : req.address().trim()) : (String) user.get("address");

        String oldEmail = (String) user.get("email");
        if (email != null && !email.equalsIgnoreCase(oldEmail != null ? oldEmail : "")) {
            if (authRepository.countByEmailExcludingUserId(email, userId) > 0) {
                throw new IllegalArgumentException("Email này đã được sử dụng bởi tài khoản khác");
            }
        }

        Number customerIdNum = (Number) user.get("customer_id");
        if (customerIdNum != null) {
            authRepository.updateCustomer(userId, fullName, email, phone, address);
        }

        Number userIdNum = (Number) user.get("user_id");
        return new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                fullName,
                email,
                phone,
                address,
                (String) user.get("role"),
                "Cập nhật thông tin thành công!", null, null, null);
    }

    public List<Map<String, Object>> getAllUsers() {
        return authRepository.findAllUsers();
    }

    public List<Map<String, Object>> getAllCustomers() {
        return authRepository.findAllCustomers();
    }

}
