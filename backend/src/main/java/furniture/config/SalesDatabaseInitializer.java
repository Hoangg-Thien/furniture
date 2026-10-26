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

import furniture.util.PasswordUtil;

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

            // Cấu hình định dạng và timezone Việt Nam (GMT+7, không lưu mili/micro giây) cho bảng orders trong Supabase
            try {
                st.execute("ALTER TABLE public.orders ALTER COLUMN order_date TYPE TIMESTAMP(0)");
            } catch (Exception ex) {
                log.warn("Không thể đổi kiểu TIMESTAMP(0) order_date: {}", ex.getMessage());
            }
            try {
                st.execute("ALTER TABLE public.orders ALTER COLUMN order_date SET DEFAULT (date_trunc('second', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'))");
            } catch (Exception ex) {
                log.warn("Không thể cập nhật DEFAULT order_date: {}", ex.getMessage());
            }

            // Cắt bỏ mili/micro giây và chuẩn hóa giờ cho toàn bộ đơn hàng
            try {
                st.execute("UPDATE public.orders SET order_date = date_trunc('second', order_date)");
                st.execute("UPDATE public.orders SET order_date = '2026-10-13 13:45:14' WHERE id = 23 AND order_date < '2026-10-13 10:00:00'");
                st.execute("UPDATE public.orders SET order_date = '2026-10-12 16:47:52' WHERE id = 22 AND order_date < '2026-10-12 12:00:00'");
                st.execute("UPDATE public.orders SET order_date = '2026-10-12 16:46:58' WHERE id = 21 AND order_date < '2026-10-12 12:00:00'");
            } catch (Exception ex) {
                log.warn("Không thể cập nhật order_date đơn cũ: {}", ex.getMessage());
            }

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
                log.info("Supabase database đã có dữ liệu từ sales.sql. Bỏ qua khởi tạo schema, tiến hành kiểm tra tài khoản admin.");
                try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.users")) {
                    if (rs.next()) log.info("users count: {}", rs.getInt(1));
                }
                try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM public.customers")) {
                    if (rs.next()) log.info("customers count: {}", rs.getInt(1));
                }
                ensureAdminAccounts(st);
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

            ensureAdminAccounts(st);

        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo database từ sales.sql", e);
        }
    }

    public void ensureAdminAccounts(Statement st) {
        try {
            String admin123Hash = PasswordUtil.hash("admin123");
            String pass123456Hash = PasswordUtil.hash("123456");

            // 1. Kiểm tra hoặc tạo tài khoản admin / admin123
            Long adminUserId = null;
            try (ResultSet rs = st.executeQuery("SELECT id FROM public.users WHERE LOWER(username) = 'admin'")) {
                if (rs.next()) {
                    adminUserId = rs.getLong("id");
                }
            } catch (Exception ex) {
                log.warn("Kiểm tra user admin: {}", ex.getMessage());
            }

            if (adminUserId != null) {
                // Đảm bảo mật khẩu 123456, role ADMIN và active
                st.execute(String.format(
                    "UPDATE public.users SET password_hash = '%s', role = 'ADMIN', is_active = true WHERE id = %d",
                    pass123456Hash, adminUserId));
                st.execute(String.format(
                    "INSERT INTO public.admins (user_id, full_name, email, phone, address, role) " +
                    "VALUES (%d, 'Tổng Quản Trị Viên (Admin)', 'admin@furniture.com', '0901888999', 'Hệ thống Quản trị Furniture', 'ADMIN') " +
                    "ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = 'ADMIN'",
                    adminUserId));
                log.info("Đã đồng bộ tài khoản admin (admin / 123456) trên Supabase thành công.");
            } else {
                try (ResultSet rs = st.executeQuery(String.format(
                    "INSERT INTO public.users (username, password_hash, role, is_active) " +
                    "VALUES ('admin', '%s', 'ADMIN', true) RETURNING id",
                    pass123456Hash))) {
                    if (rs.next()) {
                        long newAdminId = rs.getLong(1);
                        st.execute(String.format(
                            "INSERT INTO public.admins (user_id, full_name, email, phone, address, role) " +
                            "VALUES (%d, 'Tổng Quản Trị Viên (Admin)', 'admin@furniture.com', '0901888999', 'Hệ thống Quản trị Furniture', 'ADMIN') " +
                            "ON CONFLICT (user_id) DO NOTHING",
                            newAdminId));
                        log.info("Tự động tạo tài khoản admin mới (admin / 123456) thành công trên Supabase! ID: {}", newAdminId);
                    }
                }
            }

            // 2. Đồng bộ mật khẩu cho các tài khoản admin01, admin02, admin03 (mật khẩu: 123456)
            try {
                st.execute(String.format(
                    "UPDATE public.users SET password_hash = '%s' WHERE username IN ('admin01', 'admin02', 'admin03')",
                    pass123456Hash));
                log.info("Đã đồng bộ mật khẩu SHA-256 (123456) cho admin01, admin02, admin03 trên Supabase.");
            } catch (Exception ex) {
                log.warn("Lỗi cập nhật mật khẩu admin01-03: {}", ex.getMessage());
            }

            // 3. Đảm bảo admin01 có bản ghi trong bảng admins
            try {
                st.execute(
                    "INSERT INTO public.admins (user_id, full_name, email, phone, address, role) " +
                    "SELECT u.id, 'Nguyễn Quang Minh (Admin 01)', 'minh.admin@example.com', '0901000001', '25 Le Loi, Quan 1, TP.HCM', 'ADMIN' " +
                    "FROM public.users u WHERE u.username = 'admin01' " +
                    "ON CONFLICT (user_id) DO NOTHING");
            } catch (Exception ex) {
                log.warn("Lỗi đồng bộ bảng admins cho admin01: {}", ex.getMessage());
            }

            // 4. Đồng bộ sequence id của PostgreSQL Supabase
            try {
                st.execute("SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 0) + 1, false)");
                st.execute("SELECT setval(pg_get_serial_sequence('public.admins', 'id'), COALESCE((SELECT MAX(id) FROM public.admins), 0) + 1, false)");
            } catch (Exception ignored) {}

            // 5. Chuẩn hóa tên danh mục và sản phẩm có dấu tiếng Việt trên Supabase
            updateVietnameseProductNames(st);

        } catch (Exception e) {
            log.error("Lỗi khi tự động cấu hình tài khoản admin trên Supabase", e);
        }
    }

    public void updateVietnameseProductNames(Statement st) {
        try {
            // Cập nhật tên danh mục có dấu tiếng Việt
            st.execute("UPDATE public.categories SET name = 'Sofa và ghế thư giãn' WHERE id = 1");
            st.execute("UPDATE public.categories SET name = 'Bàn ăn' WHERE id = 2");
            st.execute("UPDATE public.categories SET name = 'Ghế ăn và ghế bar' WHERE id = 3");
            st.execute("UPDATE public.categories SET name = 'Giường ngủ' WHERE id = 4");
            st.execute("UPDATE public.categories SET name = 'Tủ quần áo và tủ giày' WHERE id = 5");
            st.execute("UPDATE public.categories SET name = 'Bàn và ghế văn phòng' WHERE id = 6");
            st.execute("UPDATE public.categories SET name = 'Kệ sách và kệ tivi' WHERE id = 7");
            st.execute("UPDATE public.categories SET name = 'Đèn trang trí' WHERE id = 8");
            st.execute("UPDATE public.categories SET name = 'Thảm và rèm cửa' WHERE id = 9");
            st.execute("UPDATE public.categories SET name = 'Nệm và phụ kiện giường' WHERE id = 10");

            // Cập nhật tên sản phẩm có dấu tiếng Việt
            st.execute("UPDATE public.products SET name = 'Sofa góc chữ L vải bọc Milan', description = 'Sofa góc 3m, khung gỗ sồi, vải bọc chống thấm' WHERE id = 1");
            st.execute("UPDATE public.products SET name = 'Sofa băng 3 chỗ da PU Oslo', description = 'Sofa băng dài 2m1, da PU cao cấp' WHERE id = 2");
            st.execute("UPDATE public.products SET name = 'Ghế thư giãn bập bênh Relax', description = 'Ghế thư giãn ngả lưng, bọc vải bập bênh' WHERE id = 3");
            st.execute("UPDATE public.products SET name = 'Bàn ăn gỗ cao su 6 chỗ Nordic', description = 'Bàn ăn chữ nhật 1m6, gỗ cao su tự nhiên' WHERE id = 4");
            st.execute("UPDATE public.products SET name = 'Bàn ăn mặt đá ceramic 4 chỗ Venus', description = 'Bàn ăn mặt đá ceramic 1m2, chân thép sơn tĩnh điện' WHERE id = 5");
            st.execute("UPDATE public.products SET name = 'Ghế ăn gỗ sồi đệm bọc Luna', description = 'Ghế ăn khung gỗ sồi, đệm bọc vải' WHERE id = 6");
            st.execute("UPDATE public.products SET name = 'Ghế bar chân sắt Loft', description = 'Ghế bar cao 75cm, chân sắt sơn đen' WHERE id = 7");
            st.execute("UPDATE public.products SET name = 'Giường ngủ gỗ sồi 1m8 Hana', description = 'Giường gỗ sồi tự nhiên, kích thước 1m8 x 2m' WHERE id = 8");
            st.execute("UPDATE public.products SET name = 'Giường bọc nệm 1m6 Royal', description = 'Giường bọc nệm đầu giường, kích thước 1m6 x 2m' WHERE id = 9");
            st.execute("UPDATE public.products SET name = 'Tủ quần áo 3 cánh gỗ MDF Alice', description = 'Tủ quần áo 3 cánh, gỗ MDF chống ẩm' WHERE id = 10");
            st.execute("UPDATE public.products SET name = 'Tủ giày thông minh 5 tầng', description = 'Tủ giày cánh lật, gỗ công nghiệp' WHERE id = 11");
            st.execute("UPDATE public.products SET name = 'Bàn làm việc chân sắt 1m2 Office', description = 'Bàn làm việc mặt gỗ MDF, chân sắt chữ U' WHERE id = 12");
            st.execute("UPDATE public.products SET name = 'Ghế công thái học Ergo', description = 'Ghế lưới tựa lưng, kê tay 3D, nâng hạ khí nén' WHERE id = 13");
            st.execute("UPDATE public.products SET name = 'Kệ sách gỗ 5 tầng Bookie', description = 'Kệ sách 5 tầng, gỗ công nghiệp phủ melamine' WHERE id = 14");
            st.execute("UPDATE public.products SET name = 'Kệ tivi gỗ óc chó 1m8 Nova', description = 'Kệ tivi 1m8 có ngăn kéo, gỗ óc chó' WHERE id = 15");
            st.execute("UPDATE public.products SET name = 'Đèn chùm pha lê 8 bóng', description = 'Đèn chùm phòng khách, khung mạ vàng' WHERE id = 16");
            st.execute("UPDATE public.products SET name = 'Đèn sàn thông trụ Arc', description = 'Đèn sàn cao 1m8, thân kim loại' WHERE id = 17");
            st.execute("UPDATE public.products SET name = 'Thảm lông ngắn phòng khách 2x3m', description = 'Thảm lông ngắn chống bụi, kích thước 2m x 3m' WHERE id = 18");
            st.execute("UPDATE public.products SET name = 'Rèm cửa vải chống nắng 2.4m', description = 'Rèm vải 2 lớp chống nắng, cao 2m4' WHERE id = 19");
            st.execute("UPDATE public.products SET name = 'Nệm cao su non 1m6 Dreamy', description = 'Nệm cao su non 1m6 x 2m, dày 15cm' WHERE id = 20");
            log.info("Đã chuẩn hóa tên sản phẩm và danh mục có dấu tiếng Việt trên Supabase.");
        } catch (Exception ex) {
            log.warn("Lỗi cập nhật tên tiếng Việt: {}", ex.getMessage());
        }
    }
}
