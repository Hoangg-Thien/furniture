# Kiểm thử FuniStore

Bộ kiểm thử này không sửa mã nghiệp vụ. Các request ghi chạy trên PGlite trong bộ nhớ, không dùng Supabase. Server và bản sao `sales.sql` nằm dưới `qa/`. Kết quả đọc tại [BAO_CAO_KIEM_THU.md](BAO_CAO_KIEM_THU.md).

## Chạy lại trên máy hiện tại

Chạy `node qa/harness/checkout-voucher-check.mjs` để kiểm tra checkout ở desktop/tablet/mobile/320px, gợi ý số tiền giảm thực tế, áp dụng/gỡ voucher và tìm chiến dịch admin bằng mã voucher. Script tự mở Vite, dùng API giả lập và không ghi Supabase; ảnh kiểm tra nằm trong `qa/runtime/checkout-voucher/`.

Ảnh sản phẩm: chạy `node qa/harness/product-file-check.mjs` để kiểm tra chọn file ngay trong form thêm/sửa, ưu tiên file hơn URL, chặn định dạng sai, thử lại tải ảnh không tạo trùng sản phẩm và hiển thị ảnh từ backend. Sau khi bật `start.mjs`, chạy `node qa/harness/product-file-api-check.mjs` để kiểm tra API thật, giữ URL cũ trong album, phục vụ file, chặn giả ảnh và giới hạn 5 MB. File JPG/PNG/WEBP/GIF tối đa 5 MB được lưu trong `uploads/products` trên máy chủ; cần giữ thư mục này khi triển khai và sao lưu. Test backend nằm trong `FileStorageServiceTest` và `AdminProductServiceTest`.

Báo cáo admin: chạy `node qa/harness/reports-check.mjs` để kiểm tra kết nối backend/header phiên, bộ lọc GMT+7, KPI/biểu đồ/tab, tải Excel, khoảng ngày sai, lỗi/thử lại và dữ liệu rỗng. Script dùng API giả lập, không ghi database. Kiểm thử SQL và ranh giới ngày nằm trong `AdminStatisticsRepositoryTest.java`.

Giới hạn tồn kho: `node qa/harness/cart-stock-check.mjs` tự bật Vite và giả lập API để kiểm tra tồn 2 chỉ thêm tối đa 2, nút tăng/giảm, hàng hết/chưa xác nhận, giỏ đã lưu vượt giới hạn, cập nhật khi quay lại tab, mua lại và mất kết nối. Không ghi database. API tồn kho được kiểm tra bằng `ProductStockTest`; chống bán vượt kho/rollback bằng `OrderStockTest`.

Dashboard: chạy `node qa/harness/dashboard-check.mjs`. Script tự bật Vite và dùng API giả lập để kiểm tra dữ liệu/KPI, header phiên admin, khoảng 30 ngày theo GMT+7, đơn khách vãng lai, trạng thái đơn, tồn kho, điều hướng, loading, lỗi/thử lại, dữ liệu rỗng và bố cục 320–1440px. Không ghi database; ảnh kiểm tra ở `qa/runtime/dashboard/`.

Nhật ký sản phẩm: sau khi bật `node qa/harness/start.mjs`, chạy `node qa/harness/product-audit-check.mjs`. Script kiểm tra API/giao diện Admin với backend thật và PGlite: diff/no-op, người sửa, album/upload, rollback khi log lỗi, quyền đọc, RLS, cursor, thử lại, keyboard và mobile. Kết quả/ảnh tại `qa/artifacts/product-audit/`. Test transaction H2 nằm trong `ProductAuditTest.java`; kiểm tra database trống cũng xác nhận bảng audit có RLS và không tạo lịch sử giả.

Phân quyền nhân viên: sau khi chạy `node qa/harness/start.mjs`, chạy lần lượt `node qa/harness/permissions-api-check.mjs` và `node qa/harness/permissions-ui-check.mjs`. Hai script dùng Spring Boot thật với PGlite trong bộ nhớ, tạo tài khoản Sales/Kho/Content và kiểm tra cả API lẫn giao diện; không kết nối database thật. Kết quả nằm trong `qa/artifacts/permissions-api-results.json` và `qa/artifacts/permissions/`.

Các script API cũ lấy token Admin từ backend QA qua `admin-auth.mjs`; kiểm tra ẩn danh chủ động bỏ token. Các script giao diện dùng API giả lập có fixture phiên đăng nhập riêng. Chạy `node qa/harness/clean-start.mjs` để xác nhận database trống tạo được vị trí nhân viên, bảng phiên, danh mục, hóa đơn và đăng nhập; script này dùng database thứ hai ở port 15434/18081.

Chạy Vite ở port 5173, sau đó `node qa/harness/category-ui-check.mjs` để kiểm tra trang danh mục: tìm kiếm/lọc và số liệu tổng, thêm/sửa/ẩn/xóa, bảo vệ danh mục có sản phẩm, lỗi/thử lại, bàn phím và bố cục 320–1920px. Script dùng API giả lập, không ghi database; ảnh nằm trong `qa/artifacts/categories/`.

Chạy `node qa/harness/invoice-ui-check.mjs` để kiểm tra lập/xem hóa đơn COD ngay trong trang, giữ chứng từ cũ, không hiển thị QR thanh toán, API lỗi/thử lại, phản hồi cũ khi đổi đơn, khóa tổng tiền đã chốt, xác nhận thu tiền, in A4/K80, tải PDF và bố cục mobile. Script dùng API giả lập, không ghi database; ảnh nằm trong `qa/artifacts/invoice-create-desktop.png` và `invoice-create-mobile.png`.

Chạy riêng `node qa/harness/admin-login-check.mjs` để kiểm tra giao diện đăng nhập admin ở desktop, tablet và mobile (320–390px), hiện/ẩn mật khẩu, validation, loading/lỗi, tài khoản demo và đăng nhập ADMIN/STAFF. Script dùng API giả lập, không ghi database; ảnh xem trước nằm trong `qa/artifacts/admin-login-desktop.png` và `admin-login-mobile.png`.

1. Chạy các lệnh sau trong PowerShell ở `D:\furniture` để biên dịch và tạo classpath. Maven Wrapper có lỗi `.Target[0]` trên môi trường hiện tại nên dùng bản Maven có sẵn:

```powershell
$qaMaven = Get-ChildItem C:/Users/LENOVO/.m2/wrapper/dists/apache-maven-3.9.14 -Recurse -Filter mvn.cmd | Select-Object -First 1 -ExpandProperty FullName
& $qaMaven -f backend/pom.xml -o '-Dmaven.repo.local=C:/Users/LENOVO/.m2/repository' test
& $qaMaven -f backend/pom.xml -o '-Dmaven.repo.local=C:/Users/LENOVO/.m2/repository' dependency:build-classpath '-Dmdep.outputFile=D:/furniture/qa/artifacts/classpath.txt'
```

Kiểm tra kết quả từng bộ test và trường `pass` trong JSON của các script tổng hợp.

2. Phụ thuộc PGlite đã cài tại `qa/harness/node_modules`. Nếu thiếu, chạy `npm.cmd install --prefix qa/harness`. Frontend cũng cần dependencies riêng trong `frontend/node_modules`.

3. Mở terminal riêng, chạy `node qa/harness/start.mjs`. Server thử nghiệm sẽ dùng các port 15432, 15433, 18080, 5175. `Ctrl+C` dừng các server. Có thể chọn Java bằng biến `QA_JAVA`; mặc định script dùng JDK 26 đã cài trên máy này.

4. Từ terminal khác, chạy lần lượt:

```powershell
node qa/harness/api-tests.mjs
node qa/harness/extra-api-tests.mjs
node qa/harness/browser-tests.mjs
node qa/harness/clean-start.mjs
```

`api-tests.mjs` tạo fixtures; các script bổ sung và trình duyệt dùng fixtures đó. Có thể chạy lại nhiều lần, nhưng mỗi lần sẽ tạo thêm dữ liệu QA trong database đang chạy. Dừng rồi khởi động `start.mjs` để có database mới.

Playwright được dùng từ runtime có sẵn tại `C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`; Chrome tại `C:/Program Files/Google/Chrome/Application/chrome.exe`. Đổi các đường dẫn trong script nếu chạy trên máy khác. Không có bước cài trình duyệt hay sửa package.json của frontend.

`clean-start.mjs` chạy database trống và backend thứ hai tại port 15434/18081 để kiểm tra khởi tạo nguyên trạng. Nó không dùng database của `start.mjs`.

Chạy riêng `node qa/harness/order-refresh-check.mjs` để kiểm tra cập nhật ngầm, API chậm/lỗi, tab ẩn, dọn timer và trang `/orders` (URL trực tiếp, reload, Back/Forward, mobile, trạng thái từ admin, hủy đơn, mua lại, khách chưa đăng nhập). Script tự mở Vite, giả lập API và timer trên Chrome, không cần backend hay fixtures.

Chạy `node qa/harness/notifications-check.mjs` để kiểm tra chuông client/admin, cập nhật trạng thái, lưu đã đọc, tách tài khoản, điều hướng, khách chưa đăng nhập, lỗi API và giao diện mobile. Script dùng API giả lập, không ghi database. Thông báo client hiển thị trạng thái mới nhất của từng đơn; dấu đã đọc lưu riêng từng tài khoản trong localStorage của trình duyệt.

Chạy `node qa/harness/search-check.mjs` để kiểm tra tìm kiếm admin: gọi song song ba API, hiện kết quả từng nhóm, debounce, bỏ phản hồi cũ, hủy khi đóng, lỗi từng API và điều khiển bàn phím. Script giữ phản hồi API giả lập để xác nhận truy vấn nhanh không phải chờ truy vấn chậm; không đo hiệu năng phần cứng hoặc backend thật.

Chuông admin mở đúng chi tiết đơn chờ duyệt hoặc biểu mẫu sản phẩm cần cập nhật tồn kho. Cảnh báo phân biệt sắp hết hàng (1–4 sản phẩm) với đã hết hàng (0 sản phẩm); lỗi tải có nút **Thử lại**. Test trình duyệt kiểm tra cả việc mở lại cùng một thông báo sau khi đóng chi tiết.

Admin cũng nhận thông báo cho tối đa 5 đơn có trạng thái `CANCELLED` từ API hiện tại; bấm để mở chi tiết. Thông báo hủy có dấu đã đọc riêng, nên vẫn báo mới nếu thông báo chờ duyệt của đơn đó đã được đọc. API chưa lưu người hủy hoặc thời điểm hủy riêng nên giao diện không gán người hủy hay thời gian sự kiện.

Sau khi chạy `start.mjs`, dùng `node qa/harness/shipping-api-check.mjs` để kiểm tra luồng `PENDING → CONFIRMED → SHIPPING → COMPLETED`, thời điểm duyệt và địa chỉ giao được giữ nguyên. Khi xác nhận hoàn tất và đã thu đủ tiền COD, hóa đơn `PAID` được tạo cùng transaction; lỗi lưu hóa đơn phải rollback trạng thái giao hàng. Test cũng kiểm tra chống trùng, bổ sung hóa đơn đơn cũ với voucher hết hạn và doanh thu từ hóa đơn `PAID`. Script chỉ ghi vào database QA local.

Đơn cũ đã hoàn thành nhưng chưa có hóa đơn: admin vào **Hóa đơn → Lập hóa đơn mới**, chọn đơn, kiểm tra phương thức và xác nhận đã thu đủ tiền. Không tự tạo hóa đơn mẫu khi khởi động; không áp lại voucher, thêm VAT hoặc đổi số tiền đã chốt. Tổng doanh thu, biểu đồ và báo cáo xuất bán hàng dùng hóa đơn đã thanh toán theo ngày thanh toán; đơn cũ thiếu hóa đơn cần đối soát và bổ sung trước khi được tính doanh thu.

Backend tự chạy migration `backend/src/main/resources/order_shipping.sql` khi khởi động để thêm trạng thái vận chuyển, thời điểm duyệt và địa chỉ giao lúc duyệt; không gán thời điểm giả cho đơn cũ. Client ước tính ngày lịch từ lúc duyệt: TP.HCM 1–2 ngày, miền Nam khác 2–3 ngày, miền Trung/Tây Nguyên 2–3 ngày, miền Bắc 4–5 ngày. Đây là quy tắc mô phỏng theo vùng, không phải theo dõi hãng vận chuyển.

## An toàn dữ liệu thử nghiệm

- URL JDBC trong cả hai script bị ghi đè sang `127.0.0.1`; username/password là giá trị giả chỉ dùng local.
- Không dùng file seed gốc làm mục tiêu append của ứng dụng: script sao chép vào cây thư mục QA trước khi khởi động backend.
- Endpoint SQL điều khiển `15433` chỉ bind `127.0.0.1`, phục vụ truy vấn trạng thái giữa các bước kiểm thử; không triển khai nó ra ngoài.
- Fixtures có mật khẩu tài khoản QA, không chứa mật khẩu Supabase. Thư mục runtime, cache npm và node_modules được bỏ qua bởi `qa/.gitignore`.

Kết quả rà soát ngày 12/11/2026: [AUDIT-2026-11-12.md](AUDIT-2026-11-12.md). Chạy `node qa/harness/audit-ui-check.mjs` để kiểm tra request chậm, tab ẩn, dừng polling khi đơn kết thúc, hủy request sản phẩm cũ và bỏ phản hồi lỗi thời. Script dùng API giả lập, không ghi database. `clean-start.mjs` kiểm tra thêm việc đăng ký không sửa seed và restart không thay đổi ngày/tổng tiền đơn cũ.
