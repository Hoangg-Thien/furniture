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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import furniture.model.admin.staff.CreateStaffRequest;
import furniture.model.admin.staff.StaffSummaryDto;
import furniture.model.admin.staff.UpdateStaffRequest;
import furniture.repository.AdminStaffRepository;
import furniture.repository.AdminUserRepository;
import furniture.service.AdminStaffService;

@ExtendWith(MockitoExtension.class)
public class AdminStaffServiceTest {

    @Mock
    private AdminStaffRepository adminStaffRepository;

    @Mock
    private AdminUserRepository adminUserRepository;

    private AdminStaffService adminStaffService;

    @BeforeEach
    void setUp() {
        adminStaffService = new AdminStaffService(adminStaffRepository, adminUserRepository);
    }

    @Test
    void testCreateStaff_DuplicateUsername_ThrowsException() {
        CreateStaffRequest req = new CreateStaffRequest("staff_lan", "pass123456", "Trần Thị Lan", "lan@noithat.vn", "0901234567", "Hà Nội");
        when(adminUserRepository.existsByUsername("staff_lan")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminStaffService.createStaff(req);
        });

        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    void testCreateStaff_DuplicateEmail_ThrowsException() {
        CreateStaffRequest req = new CreateStaffRequest("staff_lan", "pass123456", "Trần Thị Lan", "lan@noithat.vn", "0901234567", "Hà Nội");
        when(adminUserRepository.existsByUsername("staff_lan")).thenReturn(false);
        when(adminStaffRepository.existsByEmail("lan@noithat.vn")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminStaffService.createStaff(req);
        });

        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }

    @Test
    void testCreateStaff_Success() {
        CreateStaffRequest req = new CreateStaffRequest("staff_duc", "pass123456", "Hoàng Minh Đức", "duc@noithat.vn", "0933444555", "Hồ Chí Minh");
        when(adminUserRepository.existsByUsername("staff_duc")).thenReturn(false);
        when(adminStaffRepository.existsByEmail("duc@noithat.vn")).thenReturn(false);
        when(adminUserRepository.insertUser(eq("staff_duc"), anyString(), eq("STAFF"), eq(true))).thenReturn(20L);
        when(adminStaffRepository.insertStaff(eq(20L), eq("Hoàng Minh Đức"), eq("duc@noithat.vn"), eq("0933444555"), eq("Hồ Chí Minh"))).thenReturn(5L);

        StaffSummaryDto dto = adminStaffService.createStaff(req);

        assertEquals(5L, dto.id());
        assertEquals(20L, dto.userId());
        assertEquals("staff_duc", dto.username());
        assertEquals("Hoàng Minh Đức", dto.fullName());
        assertTrue(dto.isActive());
    }

    @Test
    void testUpdateStaff_DuplicateEmail_ThrowsException() {
        Long staffId = 2L;
        UpdateStaffRequest req = new UpdateStaffRequest("Lê Thị Thu Hà", "other@noithat.vn", "0905111222", "Đà Nẵng");

        when(adminStaffRepository.findById(staffId)).thenReturn(Optional.of(Map.of(
                "id", staffId,
                "email", "ha.old@noithat.vn"
        )));

        when(adminStaffRepository.countByEmailExcludingStaffId("other@noithat.vn", staffId)).thenReturn(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminStaffService.updateStaff(staffId, req);
        });

        assertEquals("Email 'other@noithat.vn' đã được sử dụng bởi nhân viên khác", ex.getMessage());
    }

    @Test
    void testToggleStaffStatus_SelfDeactivationBlocked() {
        Long staffId = 1L;
        Long currentLoggedInUserId = 10L;

        when(adminStaffRepository.findById(staffId)).thenReturn(Optional.of(Map.of(
                "id", staffId,
                "user_id", currentLoggedInUserId,
                "is_active", true
        )));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminStaffService.toggleStaffStatus(staffId, currentLoggedInUserId);
        });

        assertEquals("Không được phép tự vô hiệu hóa tài khoản của chính mình!", ex.getMessage());
    }

    @Test
    void testToggleStaffStatus_Success() {
        Long staffId = 2L;
        Long staffUserId = 15L;
        Long currentAdminUserId = 1L;

        when(adminStaffRepository.findById(staffId)).thenReturn(Optional.of(Map.of(
                "id", staffId,
                "user_id", staffUserId,
                "is_active", true
        )));

        boolean newStatus = adminStaffService.toggleStaffStatus(staffId, currentAdminUserId);

        assertFalse(newStatus);
        verify(adminStaffRepository).updateStaffUserActive(staffUserId, false);
    }
}
