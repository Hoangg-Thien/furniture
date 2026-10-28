package furniture;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import furniture.model.admin.CreateUserRequest;
import furniture.model.admin.UserSummaryResponse;
import furniture.repository.AdminUserRepository;
import furniture.service.AdminUserService;

@ExtendWith(MockitoExtension.class)
public class AdminUserServiceTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserService(adminUserRepository, jdbcTemplate);
    }

    @Test
    void testToggleActiveStatus_SelfDeactivationBlocked_TC01() {
        Long adminId = 1L;
        // TC01: Admin tries to disable their own account
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.toggleActiveStatus(adminId, adminId);
        });

        assertEquals("Không được phép tự vô hiệu hóa tài khoản của chính mình!", ex.getMessage());
    }

    @Test
    void testToggleActiveStatus_Success() {
        Long targetId = 2L;
        Long currentAdminId = 1L;

        when(adminUserRepository.findById(targetId)).thenReturn(Optional.of(Map.of(
                "id", targetId,
                "username", "staff_lan",
                "is_active", true
        )));

        boolean newStatus = adminUserService.toggleActiveStatus(targetId, currentAdminId);

        assertFalse(newStatus);
        verify(adminUserRepository).updateActiveStatus(targetId, false);
    }

    @Test
    void testCreateUser_DuplicateUsername_ThrowsException() {
        CreateUserRequest req = new CreateUserRequest("existing_user", "password123", "STAFF");
        when(adminUserRepository.existsByUsername("existing_user")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(req);
        });

        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    void testCreateUser_Success() {
        CreateUserRequest req = new CreateUserRequest("new_staff", "pass123456", "STAFF");
        when(adminUserRepository.existsByUsername("new_staff")).thenReturn(false);
        when(adminUserRepository.insertUser(eq("new_staff"), anyString(), eq("STAFF"), eq(true))).thenReturn(10L);

        UserSummaryResponse res = adminUserService.createUser(req);

        assertEquals(10L, res.id());
        assertEquals("new_staff", res.username());
        assertEquals("STAFF", res.role());
        assertTrue(res.isActive());
    }

    @Test
    void testResetPassword_PasswordTooShort_ThrowsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.resetPassword(5L, "123");
        });

        assertEquals("Mật khẩu mới phải có tối thiểu 6 ký tự", ex.getMessage());
    }

    @Test
    void testResetPassword_Success() {
        Long userId = 5L;
        when(adminUserRepository.findById(userId)).thenReturn(Optional.of(Map.of("id", userId)));

        adminUserService.resetPassword(userId, "newSecretPass99");

        verify(adminUserRepository).updatePassword(eq(userId), anyString());
    }
}
