# Kế hoạch phân quyền nhân viên theo nghiệp vụ

Ngày lập: 05/11/2026. Triển khai trên mã nguồn hiện tại, giữ dữ liệu và lịch sử giao dịch.

## 1. Phạm vi đã chốt

Giữ `users.role`: `ADMIN`, `STAFF`, `CUSTOMER`. Thêm `staff.staff_type`: `SALES`, `WAREHOUSE`, `CONTENT`. Mỗi nhân viên có một vị trí; Admin phân công trong màn hình nhân viên.

| Chức năng | Admin | Bán hàng / CSKH | Kho | Nội dung |
|---|---|---|---|---|
| Xem sản phẩm, giá, tồn kho, danh mục | Có | Có | Có | Có |
| Tạo sản phẩm, sửa giá/đơn vị/danh mục/ẩn hiện | Có | Không | Không | Không |
| Sửa tên, mô tả và ảnh sản phẩm | Có | Không | Không | Có |
| Quản lý khách hàng, đơn hàng, hóa đơn | Có | Có | Không | Không |
| Xem đơn cần chuẩn bị hàng | Có | Có | Có, chỉ xem | Không |
| Nhà cung cấp, phiếu nhập, hoàn tất/hủy phiếu | Có | Không | Có | Không |
| Tài khoản, nhân viên, sửa danh mục, khuyến mãi, báo cáo | Có | Không | Không | Không |

Tồn kho tăng qua phiếu nhập và thay đổi theo nghiệp vụ đơn hàng hiện có. Kho không ghi đè tồn kho qua biểu mẫu sản phẩm hoặc xóa nhà cung cấp. Content sửa sản phẩm do Admin tạo, không thêm quy trình bản nháp/duyệt giá. Xóa ảnh thuộc quyền nội dung; xóa sản phẩm không cấp cho nhân viên. Tiếp tục dùng ngừng kinh doanh sản phẩm hiện có, không thêm xóa cứng.

Nhân viên cũ được gán `SALES` khi bổ sung cột: thu hẹp quyền theo nhiệm vụ bán hàng, không tự cấp quyền tổng hợp. Admin phân công lại nhân viên kho/nội dung. Không đổi ID nhân viên hoặc quan hệ đơn/phiếu nhập. Nhân viên thiếu vị trí hợp lệ không được cấp quyền mặc định rộng hơn.

## 2. Các nơi thay đổi và tác động tương thích

- Database: migration bổ sung cột vị trí và bảng phiên đăng nhập quản trị, áp dụng được cả database đã có dữ liệu và khởi tạo mới. Không chạy với database thật trong kiểm thử.
- Backend: đăng nhập/đăng xuất/kiểm tra phiên quản trị; chặn API theo danh tính đã xác thực; DTO/repository/service nhân viên; API cập nhật riêng nội dung sản phẩm. Kiểm tra lại tài khoản khóa và vị trí từ DB ở mỗi request.
- Frontend: lưu/gửi token quản trị đúng máy chủ API; kiểm tra phiên cũ; sidebar, điều hướng, trang mặc định, thông báo, tìm kiếm toàn cục; biểu mẫu phân công nhân viên; giới hạn trường và nút trong sản phẩm, đơn hàng.
- Kiểm thử/fixtures: cập nhật request đăng nhập và tài khoản giả lập; bổ sung test ma trận quyền, giả mạo quyền, giới hạn trường, khóa/đổi vị trí, giao diện từng vị trí. Giữ test các luồng hiện có.
- Tài liệu: cập nhật tiến độ, lệnh kiểm thử và giới hạn đã xác minh.

Phiên cũ (quản trị và khách hàng) phải đăng nhập lại để nhận token do backend cấp. Không dùng role/userId/header do client tự khai làm bằng chứng phân quyền. Hai phiên được giữ riêng và token chỉ gửi về máy chủ đã cấp.

API đơn hàng và hồ sơ khách hàng cũng được bảo vệ để tránh đi vòng qua quyền quản trị: khách chỉ truy cập dữ liệu của mình; Content không truy cập đơn; Kho không hủy đơn qua API khách hàng. Dùng chung cơ chế token ngẫu nhiên 256 bit, lưu SHA-256 trong bảng phiên, hết hạn sau 8 giờ theo đồng hồ database. Đăng xuất hoặc đặt lại mật khẩu thu hồi token. Quyền được đọc lại từ database, không đóng gói cố định trong token.

## 3. Thứ tự thực hiện

- [x] Bước 1 — Bổ sung dữ liệu vị trí và phiên quản trị có hạn dùng; đăng nhập/đăng xuất/kiểm tra phiên.
- [x] Bước 2 — Áp dụng kiểm tra API mặc định từ chối; tách cập nhật nội dung khỏi cập nhật giá/kho; bảo vệ các API ngoài `/api/admin` có khả năng cấp quyền/thay đổi dữ liệu quản trị.
- [x] Bước 3 — Cho Admin chọn và sửa vị trí nhân viên; trả vị trí trong dữ liệu phiên và hồ sơ nhân viên.
- [x] Bước 4 — Giao diện theo nghiệp vụ: menu/trang mặc định, tìm kiếm/thông báo, sản phẩm chỉ đọc hoặc sửa nội dung, kho xem đơn nhưng không xử lý đơn.
- [x] Bước 5 — Kiểm thử backend, frontend, giao diện với dữ liệu cô lập; build; ghi kết quả và hướng dẫn sử dụng.

## 4. Điều kiện nghiệm thu

- Không đăng nhập/phiên hết hạn: API quản trị trả 401. Đã đăng nhập nhưng sai quyền: 403.
- Sửa role/staffType/userId trong localStorage hoặc request không làm tăng quyền API.
- Sales không sửa sản phẩm; Warehouse không đổi giá/nội dung hoặc xử lý đơn; Content không gửi lén giá/tồn kho/trạng thái qua API cập nhật nội dung.
- Các API quản trị chưa được cấp rõ ràng đều bị chặn đối với nhân viên.
- Khóa tài khoản hoặc đổi vị trí có tác dụng với phiên đang tồn tại ở request tiếp theo.
- Menu, nút thao tác và form phù hợp vị trí; liên kết trực tiếp không mở được module trái quyền.
- Các thao tác ghi vẫn giữ validation, transaction và ràng buộc bảo vệ lịch sử.
- Test và build thành công; không thêm thư viện nếu nền tảng hiện có đáp ứng được.

## 5. Kết quả thực hiện

Đã triển khai đủ 5 bước và kiểm tra ngày 05/11/2026:

| Kiểm tra | Kết quả |
|---|---|
| Toàn bộ JUnit backend | 114 test đạt; bộ 8 test phân quyền được chạy lại sau kiểm tra cuối |
| Unit test frontend | 33 test đạt |
| API thật, Spring Boot + PGlite | 8 nhóm kiểm tra đạt: đăng nhập, phân công, ma trận quyền, giới hạn trường, nhập kho, danh tính nhân viên, chủ sở hữu đơn, đổi vị trí/khóa/đăng xuất/đặt lại mật khẩu |
| Giao diện với backend thật | Cả 4 vai trò đạt; kiểm tra menu, trang mặc định, form sản phẩm, gallery chỉ đọc, tạo/sửa vị trí, tìm kiếm đúng quyền, liên kết trực tiếp, sửa role trong localStorage và mobile |
| Kiểm tra hồi quy giao diện | Đăng nhập, tìm kiếm, thông báo client/admin, hóa đơn COD/in/PDF, cập nhật đơn hàng và trang `/orders`, 15 nhóm kiểm tra khuyến mãi, 8 nhóm kiểm tra danh mục đều đạt |
| Build frontend | Thành công; giữ nguyên cảnh báo bundle lớn của dự án |
| Kiểm tra diff | Không có lỗi whitespace trong mã nguồn |

Phát hiện khi thử database trống: seed có ID trùng làm hỏng transaction và các phần bổ sung schema chạy trước khi bảng gốc tồn tại. Đã cho seed chạy từng statement, nạp lại script schema admin có sẵn và bổ sung trạng thái danh mục sau seed. Không tạo hóa đơn mẫu. Kiểm tra database trống xác nhận danh mục, sản phẩm, hóa đơn, đăng nhập, bảng phiên và hạn phiên theo giờ database.

Kết quả và ảnh kiểm tra: `qa/artifacts/permissions-api-results.json`, `qa/artifacts/permissions/results.json`, `qa/artifacts/permissions/{sales,warehouse,content,admin}.png`.

## 6. Cách sử dụng

1. Khởi động lại backend và dùng bản frontend mới. Backend tự bổ sung schema; không cần sửa role của tài khoản trong `users`.
2. Đăng nhập Admin, mở **Nhân viên → Thêm/Sửa → Vị trí công việc**.
3. Chọn **Bán hàng / CSKH**, **Nhân viên kho** hoặc **Nhân viên nội dung**, rồi lưu.
4. Nhân viên đăng nhập lại để nhận token. Menu dựa trên phiên do server xác nhận; quay lại tab sẽ kiểm tra lại vị trí. API áp dụng thay đổi quyền ngay ở request tiếp theo.

Nhân viên cũ mặc định Sales; Admin cần phân công lại Kho/Content. Không thêm gói phụ thuộc, màn hình tùy chỉnh quyền, duyệt giá, sản phẩm nháp hoặc xóa cứng.

Chưa chạy migration trên database thật và chưa tạo APK mới. Client/APK cũ cần cập nhật để gửi token trước khi dùng các API riêng tư; chỉ đăng nhập lại trên bản client cũ là chưa đủ.
