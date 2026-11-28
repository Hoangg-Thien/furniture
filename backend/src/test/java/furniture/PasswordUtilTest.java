package furniture;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import furniture.util.PasswordUtil;

class PasswordUtilTest {
    @Test
    void saltsEachPasswordAndVerifiesIt() {
        String first = PasswordUtil.hashPassword("same-password");
        String second = PasswordUtil.hashPassword("same-password");
        assertNotEquals(first, second);
        assertTrue(PasswordUtil.verify("same-password", first));
        assertFalse(PasswordUtil.verify("wrong-password", second));
        assertFalse(PasswordUtil.verify(first, first));
    }

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
