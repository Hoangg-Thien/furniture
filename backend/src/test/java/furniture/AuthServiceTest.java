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
import furniture.model.LoginRequest;
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
        verify(repository).updatePassword(eq(1L), argThat(hash ->
                !PasswordUtil.needsUpgrade(hash) && PasswordUtil.verify(" newPassword ", hash)));
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

    @Test
    void loginReturnsTheCurrentTierForTheAccountBeingSignedIn() {
        var repository = mock(AuthRepository.class);
        var vouchers = mock(VoucherRepository.class);
        var service = new AuthService(repository, vouchers);
        String hash = PasswordUtil.hash("test123");
        when(repository.findUserWithCustomerByIdentifier("diamond")).thenReturn(List.of(Map.of(
                "user_id", 1L, "customer_id", 7L, "username", "diamond", "role", "CUSTOMER", "password_hash", hash)));
        when(repository.findUserWithCustomerByIdentifier("new")).thenReturn(List.of(Map.of(
                "user_id", 2L, "customer_id", 8L, "username", "new", "role", "CUSTOMER", "password_hash", hash)));
        when(vouchers.findCustomerTierProgress(7L)).thenReturn(new CustomerTierProgress(
                "VIP_DIAMOND", new BigDecimal("300000000"), 3, null, null));
        when(vouchers.findCustomerTierProgress(8L)).thenReturn(new CustomerTierProgress(
                "NEW", BigDecimal.ZERO, 0, "SILVER", new BigDecimal("10000000")));

        assertEquals("VIP_DIAMOND", service.login(new LoginRequest("diamond", "test123")).customerTier());
        assertEquals("NEW", service.login(new LoginRequest("new", "test123")).customerTier());
        verify(repository).upgradePassword(eq(2L), eq(hash), argThat(updated ->
                !PasswordUtil.needsUpgrade(updated) && PasswordUtil.verify("test123", updated)));
    }
}
