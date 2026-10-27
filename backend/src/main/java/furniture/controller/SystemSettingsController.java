package furniture.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import furniture.repository.SystemSettingsRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class SystemSettingsController {

    private final SystemSettingsRepository settingsRepository;

    public SystemSettingsController(SystemSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(settingsRepository.getSettings());
    }

    @PostMapping("/settings")
    public ResponseEntity<Map<String, Object>> saveSettings(@RequestBody Map<String, Object> req) {
        settingsRepository.saveSettings(req);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Đã lưu cài đặt hệ thống thành công!",
            "settings", settingsRepository.getSettings()
        ));
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, List<String>>> getPermissions() {
        return ResponseEntity.ok(settingsRepository.getPermissions());
    }

    @PostMapping("/permissions")
    public ResponseEntity<Map<String, Object>> savePermissions(@RequestBody Map<String, List<String>> matrix) {
        settingsRepository.savePermissions(matrix);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Đã cập nhật ma trận phân quyền RBAC thành công!"
        ));
    }
}
