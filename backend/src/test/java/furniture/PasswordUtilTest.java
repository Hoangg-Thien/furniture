package furniture;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import furniture.util.PasswordUtil;

class PasswordUtilTest {
    @Test
    void hashesCannotBeUsedAsPasswordsAndExistingCredentialsStillWork() {
        String hash = PasswordUtil.hash("secret123");
        assertTrue(PasswordUtil.verify("secret123", hash));
        assertFalse(PasswordUtil.verify(hash, hash));
        String seed = "$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW";
        assertTrue(PasswordUtil.verify("123456", seed));
        assertFalse(PasswordUtil.verify(seed, seed));
        assertFalse(PasswordUtil.verify(null, hash));
    }
}
