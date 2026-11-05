# Nhật ký thay đổi sản phẩm

## Phạm vi

- Ghi nhận thao tác tạo/sửa sản phẩm, sửa nội dung, giá/tồn kho trực tiếp bởi Admin, ẩn/hiện và thay đổi album ảnh tại API quản lý sản phẩm.
- Mỗi trường thay đổi có mã sản phẩm, user ID người sửa từ phiên xác thực, giá trị trước/sau và thời gian database. Album ảnh được ghi thành ảnh chụp danh sách trước/sau.
- Chỉ ghi thay đổi thực tế. Khóa bản ghi sản phẩm trong transaction trước khi chụp dữ liệu; ghi log và cập nhật cùng transaction. Lỗi log phải rollback dữ liệu và những dòng log đã ghi.
- Admin xem lịch sử, tải thêm các dòng cũ. Sales/Kho/Content không đọc hoặc sửa/xóa nhật ký qua API. Bảng mới bật RLS, không mở policy cho Supabase client.
- Không thay đổi quyền nhân viên, thêm bản nháp/chờ duyệt hoặc xóa cứng sản phẩm. Biến động tồn kho qua đơn hàng/phiếu nhập tiếp tục dùng chứng từ nghiệp vụ hiện có; không gọi đây là nhật ký toàn bộ database.

## Các nơi thay đổi

1. Migration `product_audit.sql`, bộ khởi tạo database và hướng dẫn chạy SQL trên Supabase.
2. Repository nhật ký, các hàm ghi trong `AdminProductService`, controller lấy người thao tác từ `AdminIdentity`; cập nhật các caller/test bị đổi chữ ký.
3. Nút lịch sử dành cho Admin, hộp thoại có loading/lỗi/thử lại/trạng thái trống và tải thêm.
4. Kiểm thử diff/no-op, rollback, album ảnh, giả mạo người sửa, phân quyền đọc, migration và giao diện.

## Tiến độ

- [x] Migration và ghi nhật ký cùng transaction.
- [x] API đọc và giao diện Admin.
- [x] Kiểm thử, build và ghi kết quả.

Không ghi lịch sử giả cho dữ liệu đã có trước migration. Upload file vật lý vẫn dùng cơ chế lưu trữ hiện tại; rollback database không tự xóa file mới đã ghi ra đĩa.

## Sử dụng và cập nhật database

1. Chạy backend/frontend mới. Backend tự áp dụng `backend/src/main/resources/product_audit.sql` cho cả database đã có dữ liệu và database mới.
2. Nếu cập nhật Supabase thủ công, chạy toàn bộ file `product_audit.sql` trong SQL Editor của đúng database, rồi khởi động lại ứng dụng. Không cần thay đổi lại `staff_permissions.sql` cho bước audit này.
3. Admin mở **Sản phẩm & tồn kho → Lịch sử** ở dòng sản phẩm. Nhật ký có người sửa, user ID, trường, giá trị trước/sau và thời gian Việt Nam; tải 50 dòng mỗi lần.
4. Không tạo policy đọc/ghi công khai cho bảng audit. Backend dùng tài khoản database tin cậy; các vai trò client không được truy cập trực tiếp. Không có API sửa/xóa log.

Đồng thời sửa kiểm tra ảnh đại diện: ảnh phải thuộc đúng sản phẩm trước khi thay đổi album. Ảnh của sản phẩm khác bị từ chối, không thay đổi dữ liệu hoặc tạo log giả.

## Kết quả kiểm tra ngày 05/11/2026

- 121 test backend đạt, gồm 7 test mới với database/transaction thật trong H2: diff/no-op, tạo và sửa giá/kho/trạng thái, rollback toàn bộ khi log lỗi, actor không hợp lệ, album và phân trang.
- 33 test frontend đạt; build thành công, chỉ còn cảnh báo bundle lớn có sẵn.
- 8 nhóm kiểm tra API/giao diện với Spring Boot và PostgreSQL PGlite đạt: người sửa lấy từ phiên dù request giả mạo, chặn quyền đọc/ghi log của nhân viên, upload/thêm/xóa/chọn ảnh, lỗi log gây rollback thật trong PostgreSQL, chạy lại migration không mất log, RLS chặn client-role, phân trang, loading/lỗi/thử lại/trống, XSS hiển thị như văn bản, bàn phím và mobile 320–390px.
- Kiểm tra hồi quy phân quyền: 8 nhóm API và giao diện cả 4 vai trò đạt.
- Database trống khởi động thành công; bảng audit tồn tại, bật RLS và không có lịch sử giả.
- Kết quả/ảnh nằm tại `qa/artifacts/product-audit/`; chạy lại bằng `node qa/harness/product-audit-check.mjs` sau khi bật `node qa/harness/start.mjs`.

Chưa áp dụng migration lên Supabase thật hoặc tạo APK mới. Bản nháp/chờ duyệt và audit toàn bộ biến động kho ngoài trang sản phẩm chưa thuộc phạm vi này.
