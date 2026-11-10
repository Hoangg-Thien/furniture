package furniture.service;

import java.io.IOException;
import java.io.BufferedInputStream;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private final Path uploadDir = Paths.get("uploads/products");

    public FileStorageService() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu ảnh uploads/products", e);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File tải lên không có dữ liệu");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Mỗi ảnh không được vượt quá 5 MB");
        }

        try (BufferedInputStream inputStream = new BufferedInputStream(file.getInputStream())) {
            inputStream.mark(32);
            String type = URLConnection.guessContentTypeFromStream(inputStream);
            byte[] header = inputStream.readNBytes(12);
            inputStream.reset();
            boolean webp = header.length == 12 && new String(header, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                    && new String(header, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP");
            String extension = webp ? ".webp" : switch (type == null ? "" : type) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/gif" -> ".gif";
                default -> throw new IllegalArgumentException("Chỉ chấp nhận file ảnh JPG, PNG, WEBP hoặc GIF");
            };
            String fileName = UUID.randomUUID() + extension;
            Path targetLocation = this.uploadDir.resolve(fileName);
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/products/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file ảnh, vui lòng thử lại", ex);
        }
    }
}
