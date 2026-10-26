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
import furniture.util.PasswordUtil;

@Service
public class AuthService {

    private final AuthRepository authRepository;

    public AuthService(AuthRepository authRepository) {
        this.authRepository = authRepository;
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

        String username = req.username().trim();
        if (authRepository.countByUsername(username) > 0) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        String email = (req.email() != null && !req.email().trim().isEmpty()) ? req.email().trim() : null;
        if (email != null && authRepository.countByEmail(email) > 0) {
            throw new IllegalArgumentException("Email này đã được sử dụng");
        }

        String passwordHash = PasswordUtil.hash(req.password());
        Long userId = authRepository.insertUser(username, passwordHash, "CUSTOMER");

        String phone = (req.phone() != null && !req.phone().trim().isEmpty()) ? req.phone().trim() : null;
        String address = (req.address() != null && !req.address().trim().isEmpty()) ? req.address().trim() : null;

        Long customerId = authRepository.insertCustomer(userId, "CUSTOMER", req.fullName().trim(), email, phone, address);

        appendToSalesSql(userId, customerId, username, passwordHash, req.fullName().trim(), email, phone, address);

        return new AuthResponse(
                userId,
                customerId,
                username,
                req.fullName().trim(),
                email,
                phone,
                address,
                "CUSTOMER",
                "Đăng ký tài khoản thành công!");
    }

    public AuthResponse login(LoginRequest req) {
        if (req.username() == null || req.username().trim().isEmpty() ||
            req.password() == null || req.password().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
        }

        String identifier = req.username().trim();
        boolean isAdminPortal = "ADMIN".equalsIgnoreCase(req.portal());

        List<Map<String, Object>> rows;
        if (isAdminPortal) {
            // Trang Admin Portal: Chỉ query và xác thực trên bảng admins + users (role = ADMIN).
            // Tài khoản ở bảng users (role CUSTOMER) tuyệt đối không được cấp quyền đăng nhập tại đây.
            rows = authRepository.findAdminByIdentifier(identifier);
            if (rows.isEmpty()) {
                throw new SecurityException("Tên đăng nhập hoặc mật khẩu không chính xác");
            }
        } else {
            // Trang Client (Khách hàng): Chỉ query và xác thực trên bảng users (role = CUSTOMER).
            // Nếu nhập email/username thuộc bảng admins mà chưa đăng ký ở Client,
            // trả về lỗi chung: "Email hoặc mật khẩu không chính xác" (tránh lộ thông tin tồn tại).
            rows = authRepository.findClientUserByIdentifier(identifier);
            if (rows.isEmpty()) {
                throw new SecurityException("Email hoặc mật khẩu không chính xác");
            }
        }

        Map<String, Object> user = rows.get(0);
        Object activeObj = user.get("is_active");
        boolean isActive = activeObj == null || Boolean.TRUE.equals(activeObj);
        if (!isActive) {
            throw new IllegalStateException("Tài khoản này đã bị tạm khóa");
        }

        String storedHash = (String) user.get("password_hash");
        if (!PasswordUtil.verify(req.password(), storedHash)) {
            String errorMsg = isAdminPortal
                    ? "Tên đăng nhập hoặc mật khẩu không chính xác"
                    : "Email hoặc mật khẩu không chính xác";
            throw new SecurityException(errorMsg);
        }

        Number userIdNum = (Number) user.get("user_id");
        Number customerIdNum = (Number) (user.containsKey("customer_id") ? user.get("customer_id") : user.get("admin_id"));

        return new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                (String) user.get("role"),
                "Đăng nhập thành công!");
    }

    public AuthResponse getProfile(Long userId) {
        List<Map<String, Object>> rows = authRepository.findUserWithCustomerById(userId);
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }

        Map<String, Object> user = rows.get(0);
        Number userIdNum = (Number) user.get("user_id");
        Number customerIdNum = (Number) user.get("customer_id");

        return new AuthResponse(
                userIdNum != null ? userIdNum.longValue() : null,
                customerIdNum != null ? customerIdNum.longValue() : null,
                (String) user.get("username"),
                (String) user.get("full_name"),
                (String) user.get("email"),
                (String) user.get("phone"),
                (String) user.get("address"),
                (String) user.get("role"),
                "OK");
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
            String newHash = PasswordUtil.hash(req.newPassword().trim());
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
                "Cập nhật thông tin thành công!");
    }

    public List<Map<String, Object>> getAllUsers() {
        return authRepository.findAllUsers();
    }

    public List<Map<String, Object>> getAllCustomers() {
        return authRepository.findAllCustomers();
    }

    public Map<String, Object> syncAdminAccounts() {
        return authRepository.syncAdminAccounts();
    }

    private synchronized void appendToSalesSql(Long userId, Long customerId, String username, String passwordHash,
                                                String fullName, String email, String phone, String address) {
        try {
            java.nio.file.Path[] candidates = new java.nio.file.Path[] {
                java.nio.file.Paths.get("../database/sales.sql"),
                java.nio.file.Paths.get("database/sales.sql"),
                java.nio.file.Paths.get("furniture/database/sales.sql"),
                java.nio.file.Paths.get("c:/Users/Lenovo/OneDrive/Desktop/SE_project/furniture/database/sales.sql")
            };
            java.nio.file.Path targetPath = null;
            for (java.nio.file.Path p : candidates) {
                if (java.nio.file.Files.exists(p)) {
                    targetPath = p;
                    break;
                }
            }
            if (targetPath != null) {
                String emailVal = email != null ? "'" + email.replace("'", "''") + "'" : "NULL";
                String phoneVal = phone != null ? "'" + phone.replace("'", "''") + "'" : "NULL";
                String addressVal = address != null ? "'" + address.replace("'", "''") + "'" : "NULL";
                String fullNameVal = fullName != null ? "'" + fullName.replace("'", "''") + "'" : "''";
                String userInsert = String.format(
                    "INSERT INTO users (id, username, password_hash, role) VALUES (%d, '%s', '%s', 'CUSTOMER');\n",
                    userId, username.replace("'", "''"), passwordHash);
                String customerInsert = String.format(
                    "INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES (%d, %d, %s, %s, %s, %s);\n",
                    customerId, userId, fullNameVal, emailVal, phoneVal, addressVal);

                String currentContent = java.nio.file.Files.readString(targetPath);
                String newContent;
                if (currentContent.contains("COMMIT;")) {
                    newContent = currentContent.replace("COMMIT;", userInsert + customerInsert + "COMMIT;");
                } else {
                    newContent = currentContent + "\n" + userInsert + customerInsert;
                }
                java.nio.file.Files.writeString(targetPath, newContent);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}

