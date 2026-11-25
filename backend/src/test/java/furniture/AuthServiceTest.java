package furniture;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import furniture.model.UpdateProfileRequest;
import furniture.model.RegisterRequest;
import furniture.model.CustomerTierProgress;
import furniture.repository.AuthRepository;
import furniture.repository.VoucherRepository;
import furniture.service.AuthService;
import furniture.util.PasswordUtil;

class AuthServiceTest {
    @Test
    void registrationRejectsMissingContactDetailsBeforeWritingAnyData() {
        var repository = mock(AuthRepository.class);
        var service = new AuthService(repository, mock(VoucherRepository.class));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest("customer", "test123", "Customer", null, "0901234567", "123 Main St")));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest("customer", "test123", "Customer", "test@example.test", " ", "123 Main St")));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest("customer", "test123", "Customer", "test@example.test", "0901234567", " ")));
        verifyNoInteractions(repository);
    }

    @Test
    void passwordChangePreservesThePasswordExactlyAsEntered() {
        var repository = mock(AuthRepository.class);
        when(repository.findUserWithCustomerById(1L)).thenReturn(List.of(Map.of(
                "user_id", 1L, "customer_id", 2L, "username", "customer", "role", "CUSTOMER",
                "password_hash", PasswordUtil.hash("oldPassword"))));
        new AuthService(repository, mock(VoucherRepository.class)).updateProfile(1L,
                new UpdateProfileRequest(null, null, null, null, "oldPassword", " newPassword "));
        verify(repository).updatePassword(1L, PasswordUtil.hash(" newPassword "));
    }

    @Test
    void profileUsesTheCurrentTierOfTheAuthenticatedUsersCustomerRecord() {
        var repository = mock(AuthRepository.class);
        var vouchers = mock(VoucherRepository.class);
        when(repository.findUserWithCustomerById(1L)).thenReturn(List.of(Map.of(
                "user_id", 1L, "customer_id", 7L, "username", "customer", "role", "CUSTOMER")));
        var progress = new CustomerTierProgress("GOLD", new BigDecimal("60000000"), 2, "PLATINUM", new BigDecimal("100000000"));
        when(vouchers.findCustomerTierProgress(7L)).thenReturn(progress);
        var profile = new AuthService(repository, vouchers).getProfile(1L);
        assertEquals("GOLD", profile.customerTier());
        assertEquals(progress, profile.tierProgress());
    }
}
