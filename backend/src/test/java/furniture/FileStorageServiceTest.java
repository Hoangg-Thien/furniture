package furniture;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import furniture.service.FileStorageService;

class FileStorageServiceTest {
    @Test
    void storesImageBytesWithSafeGeneratedNameInsteadOfUntrustedExtension() throws Exception {
        byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7S8AAAAASUVORK5CYII=");
        String url = new FileStorageService().storeFile(new MockMultipartFile("files", "../../unsafe.html", "image/png", png));
        assertTrue(url.matches("/uploads/products/[0-9a-f-]+\\.png"));
        Path stored = Path.of(url.substring(1));
        try { assertArrayEquals(png, Files.readAllBytes(stored)); }
        finally { Files.deleteIfExists(stored); }
    }

    @Test
    void rejectsEmptyOversizedAndDisguisedHtmlFiles() {
        var storage = new FileStorageService();
        assertThrows(IllegalArgumentException.class, () -> storage.storeFile(new MockMultipartFile("files", new byte[0])));
        assertThrows(IllegalArgumentException.class, () -> storage.storeFile(new MockMultipartFile("files", "fake.png", "image/png", "<html>not an image</html>".getBytes())));
        assertThrows(IllegalArgumentException.class, () -> storage.storeFile(new MockMultipartFile("files", "big.png", "image/png", new byte[5 * 1024 * 1024 + 1])));
    }
}
