# HỆ THỐNG TÀI LIỆU KẾ HOẠCH THIẾT KẾ ADMIN MVC
## CỬA HÀNG NỘI THẤT CAO CẤP (FURNITURE MANAGEMENT SYSTEM)

Chào mừng bạn đến với bộ tài liệu kế hoạch thiết kế giao diện và chức năng Backend của hệ thống Quản trị (Admin) theo mô hình **MVC (Model - View - Controller)**. Toàn bộ kế hoạch đã được chia nhỏ thành từng module độc lập, chuyên sâu để thuận tiện cho việc phát triển, phân chia task và review mã nguồn.

---

## 📌 MỤC LỤC TÀI LIỆU HỆ THỐNG

| STT | Tài liệu | Nội dung chính | Trạng thái |
| :---: | :--- | :--- | :---: |
| 🌐 | [00. Kiến trúc MVC & Thiết kế CSDL](00_KIEN_TRUC_VA_CO_SO_DU_LIEU.md) | Tổng quan kiến trúc 3 tầng, phân quyền RBAC, sơ đồ quan hệ ERD và script DDL PostgreSQL (`product_images`, `invoices`). | Hoàn thiện |
| 🎨 | [Hệ thống Giao diện UI/UX Admin](11_HE_THONG_GIAO_DIEN_UI_UX.md) | Layout tổng thể (Sidebar, Header, Breadcrumbs), bảng màu Furniture sang trọng, các Component tái sử dụng (DataTable, Modal, Toast). | Hoàn thiện |
| 01 | [Module 01 - Quản lý Tài khoản & Phân quyền](01_QUAN_LY_TAI_KHOAN_ROLE.md) | Quản lý bảng `users`, phân quyền ADMIN/STAFF/CUSTOMER, kích hoạt/khóa tài khoản, đặt lại mật khẩu an toàn. | ✅ Đã triển khai |
| 02 | [Module 02 - Quản lý Khách hàng](02_QUAN_LY_KHACH_HANG.md) | Hồ sơ khách hàng, phân hạng VIP, lịch sử mua hàng, tổng chi tiêu trọn đời (LTV), giỏ hàng quan tâm. | Hoàn thiện |
| 03 | [Module 03 - Quản lý Nhân viên](03_QUAN_LY_NHAN_VIEN.md) | Quản lý nhân viên kinh doanh/kho, phân công xử lý đơn hàng, cấp quyền đăng nhập hệ thống. | Hoàn thiện |
| 04 | [Module 04 - Quản lý Loại nội thất](04_QUAN_LY_LOAI_NOI_THAT.md) | Danh mục phòng khách, phòng ngủ, phòng ăn; kiểm tra ràng buộc chống xóa danh mục đang có sản phẩm. | Hoàn thiện |
| 05 | [Module 05 - Quản lý Sản phẩm & Hình ảnh](05_QUAN_LY_SAN_PHAM_HINH_ANH.md) | Quản lý kho hàng nội thất, đơn giá, số lượng tồn kho, cảnh báo hết hàng, thư viện album ảnh sản phẩm nhiều góc chụp. | Hoàn thiện |
| 06 | [Module 06 - Quản lý Nhà cung cấp Nội thất](06_QUAN_LY_NHA_CUNG_CAP.md) | Hồ sơ xưởng/nhà cung cấp gỗ, vải, phụ kiện; quản lý lịch sử phiếu nhập hàng (`purchase_receipts`) cập nhật kho. | Hoàn thiện |
| 07 | [Module 07 - Quản lý Khuyến mãi & Voucher](07_QUAN_LY_KHUYEN_MAI_VOUCHER.md) | Chiến dịch khuyến mãi với 3 nhánh: Giảm theo sản phẩm, Chiết khấu bậc đơn hàng, Phát hành mã Voucher. | Hoàn thiện |
| 08 | [Module 08 - Quản lý Đơn đặt hàng (Orders)](08_QUAN_LY_DON_DAT_HANG.md) | Quy trình vòng đời đơn hàng (`PENDING` ➔ `CONFIRMED` ➔ `COMPLETED` / `CANCELLED`), hoàn kho & voucher khi hủy đơn. | Hoàn thiện |
| 09 | [Module 09 - Quản lý Hóa đơn (Invoices)](09_QUAN_LY_HOA_DON.md) | Lập hóa đơn bán hàng, thuật toán áp dụng voucher & chiết khấu, phương thức thanh toán QR/POS/Cash, in hóa đơn A4/K80. | Hoàn thiện |
| 10 | [Module 10 - Thống kê & Báo cáo](10_THONG_KE_BAO_CAO.md) | Dashboard chỉ số KPI thời gian thực, biểu đồ doanh thu theo ngày/tháng, Top 5 sản phẩm bán chạy, xuất báo cáo Excel/PDF. | Hoàn thiện |
| 🚀 | [Lộ trình Triển khai & Kiểm thử](12_LO_TRINH_VA_KIEM_THU.md) | Kế hoạch 4 Sprint (6 tuần), phân bổ nhân sự, tiêu chí nghiệm thu (Acceptance Criteria) và kịch bản Test Case then chốt. | Hoàn thiện |

---

## 🏗️ TÓM TẮT MÔ HÌNH KIẾN TRÚC MVC

- **Backend Framework**: Spring Boot 3.5.x (Java 21).
- **Database**: PostgreSQL (kết nối Supabase hoặc Local PostgreSQL qua JPA/Hibernate).
- **Frontend Admin**: React SPA (Vite) / Admin Portal tích hợp hệ component responsive hiện đại.
- **Mô hình luồng dữ liệu**:
  ```
  [Client View: React Admin] 
          │  (HTTP / JSON REST APIs)
          ▼
  [Controller Layer: @RestController + @Valid]
          │  (Service DTOs)
          ▼
  [Service Layer: Business Logic + @Transactional]
          │  (Entities & Criteria)
          ▼
  [Model / Repository: Spring Data JPA + PostgreSQL]
  ```

---

## 👥 MA TRẬN PHÂN QUYỀN (RBAC MATRIX)

| Module | Chức năng | ADMIN | STAFF | CUSTOMER |
| :--- | :--- | :---: | :---: | :---: |
| **01. Tài khoản & Role** | Xem danh sách, tạo tài khoản, khóa/mở khóa, reset mật khẩu | ✅ Toàn quyền | ❌ Chặn | ❌ Chặn |
| **02. Khách hàng** | Xem danh sách, xem lịch sử mua hàng, sửa thông tin liên hệ | ✅ | ✅ | ❌ |
| **03. Nhân viên** | Tạo nhân viên mới, sửa thông tin, phân công vai trò | ✅ | ❌ | ❌ |
| **04. Loại nội thất** | Thêm, sửa danh mục, xóa danh mục rỗng | ✅ | ✅ (Chỉ xem) | ❌ |
| **05. Sản phẩm & Album ảnh** | Thêm mới, cập nhật giá/tồn kho, tải album ảnh, ẩn sản phẩm | ✅ | ✅ | ❌ |
| **06. Nhà cung cấp** | Quản lý nhà cung ứng, tạo phiếu nhập kho | ✅ | ✅ | ❌ |
| **07. Khuyến mãi & Voucher** | Cấu hình % giảm giá, tạo voucher, bật/tắt chiến dịch | ✅ | 👁️ Chỉ xem | ❌ |
| **08. Đơn đặt hàng** | Tiếp nhận, xác nhận đơn, gán nhân viên phụ trách, hủy đơn | ✅ | ✅ | ❌ |
| **09. Hóa đơn** | Áp mã voucher, xuất hóa đơn thanh toán, in hóa đơn | ✅ | ✅ | ❌ |
| **10. Thống kê & Báo cáo** | Xem doanh thu tài chính, lợi nhuận gộp, xuất file Excel | ✅ | ❌ | ❌ |

---

*Hồ sơ tài liệu nội bộ - Dự án Quản lý Cửa Hàng Nội Thất (Furniture Store).*
