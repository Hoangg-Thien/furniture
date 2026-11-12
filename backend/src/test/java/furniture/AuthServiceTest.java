package furniture;

import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import furniture.model.UpdateProfileRequest;
import furniture.repository.AuthRepository;
import furniture.service.AuthService;
import furniture.util.PasswordUtil;

class AuthServiceTest {
    @Test
    void passwordChangePreservesThePasswordExactlyAsEntered() {
        var repository = mock(AuthRepository.class);
        when(repository.findUserWithCustomerById(1L)).thenReturn(List.of(Map.of(
                "user_id", 1L, "customer_id", 2L, "username", "customer", "role", "CUSTOMER",
                "password_hash", PasswordUtil.hash("oldPassword"))));
        new AuthService(repository).updateProfile(1L,
                new UpdateProfileRequest(null, null, null, null, "oldPassword", " newPassword "));
        verify(repository).updatePassword(1L, PasswordUtil.hash(" newPassword "));
    }
}
