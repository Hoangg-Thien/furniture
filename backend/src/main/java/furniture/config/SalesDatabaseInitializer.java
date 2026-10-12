package furniture.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class SalesDatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SalesDatabaseInitializer.class);
    private final DataSource dataSource;

    public SalesDatabaseInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection();
             Statement st = conn.createStatement()) {

            // Kiểm tra xem bảng products đã tồn tại và có dữ liệu chưa
            boolean alreadyPopulated = false;
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.products")) {
                if (rs.next() && rs.getInt(1) > 0) {
                    alreadyPopulated = true;
                }
            } catch (Exception ignored) {
                // Bảng chưa tồn tại, cần chạy sales.sql
            }

            if (alreadyPopulated) {
                log.info("Supabase database đã có dữ liệu từ sales.sql. Bỏ qua khởi tạo.");
                try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.users")) {
                    if (rs.next()) log.info("users count: {}", rs.getInt(1));
                }
                try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.customers")) {
                    if (rs.next()) log.info("customers count: {}", rs.getInt(1));
                }
                return;
            }

            // Tìm file sales.sql
            Path[] candidatePaths = new Path[] {
                Paths.get("../database/sales.sql"),
                Paths.get("database/sales.sql"),
                Paths.get("furniture/database/sales.sql"),
                Paths.get("c:/Users/Lenovo/OneDrive/Desktop/SE_project/furniture/database/sales.sql")
            };

            Path salesSqlPath = null;
            for (Path candidate : candidatePaths) {
                if (Files.exists(candidate)) {
                    salesSqlPath = candidate;
                    break;
                }
            }

            if (salesSqlPath == null) {
                log.error("Không tìm thấy file sales.sql!");
                return;
            }

            log.info("Đang nạp schema và dữ liệu từ: {}", salesSqlPath.toAbsolutePath());
            String sqlContent = Files.readString(salesSqlPath);

            // Lọc bỏ các dòng comment
            StringBuilder sb = new StringBuilder();
            for (String line : sqlContent.split("\r?\n")) {
                String trimmed = line.trim();
                if (trimmed.startsWith("--")) continue;
                sb.append(line).append("\n");
            }

            String[] statements = sb.toString().split(";");
            int successCount = 0;
            int warnCount = 0;
            for (String statement : statements) {
                String stmt = statement.trim();
                if (stmt.isEmpty()) continue;
                try {
                    st.execute(stmt);
                    successCount++;
                } catch (Exception ex) {
                    warnCount++;
                    log.warn("SQL skip ({}): {}",
                            stmt.substring(0, Math.min(stmt.length(), 60)).replace("\n", " "),
                            ex.getMessage());
                }
            }
            log.info("Nạp sales.sql thành công: {} câu lệnh, bỏ qua: {}", successCount, warnCount);

            // Với PostgreSQL (Supabase): đồng bộ lại sequence sau khi INSERT thủ công có ID
            try {
                String[] tables = {"users", "customers", "admins", "staff", "categories", "products", "carts", "suppliers", "promotion_programs", "vouchers"};
                for (String table : tables) {
                    try {
                        st.execute(String.format(
                            "SELECT setval(pg_get_serial_sequence('public.%s', 'id'), COALESCE((SELECT MAX(id) FROM public.%s), 0) + 1, false)",
                            table, table));
                    } catch (Exception ignored) {}
                }
                log.info("Đã đồng bộ lại sequence cho tất cả bảng trong Supabase.");
            } catch (Exception ex) {
                log.warn("Không thể đồng bộ sequence: {}", ex.getMessage());
            }

            // Kiểm tra kết quả
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.products")) {
                if (rs.next()) log.info("public.products count: {}", rs.getInt(1));
            }
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.users")) {
                if (rs.next()) log.info("public.users count: {}", rs.getInt(1));
            }
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.customers")) {
                if (rs.next()) log.info("public.customers count: {}", rs.getInt(1));
            }

        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo database từ sales.sql", e);
        }
    }
}
