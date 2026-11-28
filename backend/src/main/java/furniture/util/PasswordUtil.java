package furniture.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public class PasswordUtil {
    private static final int ITERATIONS = 600_000;
    private static final String PASSWORD_PREFIX = "pbkdf2-sha256$" + ITERATIONS + "$";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    public static String hashPassword(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return PASSWORD_PREFIX + ENCODER.encodeToString(salt) + "$" + ENCODER.encodeToString(derive(password, salt));
    }

    public static boolean needsUpgrade(String storedHash) {
        return !storedHash.startsWith(PASSWORD_PREFIX);
    }

    private static byte[] derive(String password, byte[] salt) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("Password hashing unavailable", e);
        } finally {
            spec.clearPassword();
        }
    }

    public static String hash(String password) {
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean verify(String password, String storedHash) {
        if (password == null || storedHash == null) {
            return false;
        }
        if (!needsUpgrade(storedHash)) {
            String record = storedHash.substring(PASSWORD_PREFIX.length());
            if (!record.matches("[A-Za-z0-9_-]{22}[$][A-Za-z0-9_-]{43}")) return false;
            byte[] salt = DECODER.decode(record.substring(0, 22));
            return MessageDigest.isEqual(derive(password, salt), DECODER.decode(record.substring(23)));
        }
        // Migrate legacy hashes only after a successful login.
        if (hash(password).equalsIgnoreCase(storedHash)) {
            return true;
        }
        // 2. Tương thích dữ liệu khởi tạo từ sales.sql (mật khẩu mặc định là 123456)
        if ("$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW".equals(storedHash) && "123456".equals(password)) {
            return true;
        }
        // 3. Fallback so sánh mật khẩu trực tiếp
        return !storedHash.matches("(?i)[0-9a-f]{64}") && !storedHash.startsWith("$2") && !storedHash.startsWith("pbkdf2-")
                && password.equals(storedHash);
    }
}

