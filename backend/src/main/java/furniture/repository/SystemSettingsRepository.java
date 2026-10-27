package furniture.repository;

import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class SystemSettingsRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public SystemSettingsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
        initTables();
    }

    private void initTables() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.system_settings (
                    setting_key VARCHAR(100) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.system_permissions (
                    permission_id VARCHAR(100) PRIMARY KEY,
                    roles_json TEXT,
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """);
        } catch (Exception e) {
            System.err.println("Warning: Could not verify system_settings tables: " + e.getMessage());
        }
    }

    public Map<String, Object> getSettings() {
        Map<String, Object> defaults = getDefaultSettings();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT setting_key, setting_value FROM public.system_settings"
            );
            for (Map<String, Object> r : rows) {
                String k = (String) r.get("setting_key");
                String v = (String) r.get("setting_value");
                if (k != null && v != null) {
                    try {
                        // parse boolean/number if applicable
                        if ("true".equalsIgnoreCase(v)) {
                            defaults.put(k, true);
                        } else if ("false".equalsIgnoreCase(v)) {
                            defaults.put(k, false);
                        } else if (v.matches("^-?\\d+(\\.\\d+)?$")) {
                            if (v.contains(".")) {
                                defaults.put(k, Double.parseDouble(v));
                            } else {
                                defaults.put(k, Long.parseLong(v));
                            }
                        } else {
                            defaults.put(k, v);
                        }
                    } catch (Exception ignore) {
                        defaults.put(k, v);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching system settings: " + e.getMessage());
        }
        return defaults;
    }

    public void saveSettings(Map<String, Object> settings) {
        if (settings == null) return;
        for (Map.Entry<String, Object> entry : settings.entrySet()) {
            String k = entry.getKey();
            Object val = entry.getValue();
            String v = val != null ? String.valueOf(val) : "";
            try {
                jdbcTemplate.update("""
                    INSERT INTO public.system_settings (setting_key, setting_value, updated_at)
                    VALUES (?, ?, NOW())
                    ON CONFLICT (setting_key) DO UPDATE
                    SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
                """, k, v);
            } catch (Exception e) {
                System.err.println("Error saving setting " + k + ": " + e.getMessage());
            }
        }
    }

    public Map<String, List<String>> getPermissions() {
        Map<String, List<String>> result = new HashMap<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT permission_id, roles_json FROM public.system_permissions"
            );
            for (Map<String, Object> r : rows) {
                String pid = (String) r.get("permission_id");
                String rJson = (String) r.get("roles_json");
                if (pid != null && rJson != null) {
                    try {
                        List<String> roles = objectMapper.readValue(rJson, new TypeReference<List<String>>() {});
                        result.put(pid, roles);
                    } catch (Exception ignore) {}
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching system permissions: " + e.getMessage());
        }
        return result;
    }

    public void savePermissions(Map<String, List<String>> matrix) {
        if (matrix == null) return;
        for (Map.Entry<String, List<String>> entry : matrix.entrySet()) {
            String pid = entry.getKey();
            List<String> roles = entry.getValue() != null ? entry.getValue() : Collections.emptyList();
            try {
                String json = objectMapper.writeValueAsString(roles);
                jdbcTemplate.update("""
                    INSERT INTO public.system_permissions (permission_id, roles_json, updated_at)
                    VALUES (?, ?, NOW())
                    ON CONFLICT (permission_id) DO UPDATE
                    SET roles_json = EXCLUDED.roles_json, updated_at = NOW()
                """, pid, json);
            } catch (Exception e) {
                System.err.println("Error saving permission " + pid + ": " + e.getMessage());
            }
        }
    }

    private Map<String, Object> getDefaultSettings() {
        Map<String, Object> defs = new HashMap<>();
        defs.put("store_name", "FURNITURE Cung Đình & Hiện Đại");
        defs.put("hotline", "0903 889 922");
        defs.put("email", "contact@furniture.vn");
        defs.put("address", "Số 123 Đại Lộ Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh");
        defs.put("warehouse_address", "Kho Tổng Tân Tạo, Lô B2 KCN Tân Tạo, Quận Bình Tân, TP. Hồ Chí Minh");
        
        // VietQR & Banking
        defs.put("bank_name", "Vietcombank (Ngân hàng Ngoại thương Việt Nam)");
        defs.put("bank_code", "VCB");
        defs.put("bank_account_no", "998877665544");
        defs.put("bank_account_owner", "CONG TY TNHH NOI THAT FURNITURE");
        defs.put("vietqr_template", "compact2");
        defs.put("transfer_syntax", "FUNI {ORDER_ID}");

        // Orders & Delivery
        defs.put("free_shipping_threshold", 5000000L);
        defs.put("standard_shipping_fee", 150000L);
        defs.put("vat_rate", 8);
        defs.put("allow_cod", true);
        defs.put("allow_vietqr", true);

        // System Ops
        defs.put("maintenance_mode", false);
        defs.put("allow_registration", true);
        defs.put("auto_print_invoice", false);
        defs.put("inventory_warning_threshold", 5);

        return defs;
    }
}
