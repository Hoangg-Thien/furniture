# Báo cáo kiểm thử đồ án FuniStore — 28/10/2026

**Kết luận:** Các luồng cơ bản hoạt động, nhưng còn lỗi nghiêm trọng về phân quyền, tính tiền, tồn kho và độ chính xác dữ liệu. Chưa nên triển khai cho người dùng thật trước khi xử lý các lỗi ưu tiên cao.

## 1. Phạm vi và kết quả

| Nhóm kiểm tra | Tổng | Đạt | Không đạt |
|---|---:|---:|---:|
| Bộ JUnit có sẵn trong backend | 99 | 98 | 1 |
| API HTTP với cơ sở dữ liệu riêng | 165 | 136 | 29 |
| Trình duyệt Chrome tự động | 38 | 31 | 7 |
| **Tổng các ca kiểm tra trên** | **302** | **265** | **37** |

37 ca không đạt **không tương đương 37 lỗi độc lập**: nhiều ca cùng phát hiện một nguyên nhân. Báo cáo dưới đây gom thành **27 nhóm lỗi ứng dụng**, gồm 26 nhóm có bằng chứng chạy thử và một nhóm lộ thông tin cấu hình xác nhận bằng đọc mã. Lỗi của bài test và Maven Wrapper được ghi riêng.

- Frontend: `npm.cmd run build` **thành công**. Bundle JavaScript khoảng 722,5 kB trước gzip, Vite cảnh báo kích thước.
- Lint: chạy được, **163 cảnh báo**. Đây không phải 163 lỗi chức năng; phần lớn là biến không sử dụng, dependencies của hooks và cập nhật state trong effect.
- Có thêm kiểm tra nhập nguyên file SQL và khởi động với database hoàn toàn trống; kết quả ở mục 3, không cộng vào 302 ca phía trên.
- Đã kiểm tra cả 11 màn hình quản trị: tổng quan, đơn hàng, hóa đơn, khách hàng, sản phẩm, nhà cung cấp, tài khoản, nhân viên, danh mục, khuyến mãi và báo cáo. Việc màn hình mở được không có nghĩa mọi số liệu trên màn hình đều đúng.

### Môi trường

Windows, Java 26, Spring Boot 3.5.13, Node 24 và Chrome headless. API chạy tại `127.0.0.1:18080`, frontend tại `127.0.0.1:5175`.

Các thao tác ghi chạy trên **PostgreSQL WASM/PGlite 0.5.12 trong bộ nhớ**, kết nối bằng JDBC PostgreSQL của dự án. Không kết nối hoặc ghi vào Supabase cấu hình sẵn. Không sửa mã nguồn nghiệp vụ hay file `database/sales.sql` gốc.

Để kiểm tra tiếp sau lỗi dữ liệu mẫu, bộ kiểm thử nạp từng câu SQL, bỏ qua bốn dòng trùng, chạy `admin_schema_extension.sql` và đồng bộ sequence. Những điều chỉnh này chỉ áp dụng cho database thử nghiệm. Có kiểm tra khởi động riêng không dùng các điều chỉnh đó.

## 2. Danh sách lỗi ứng dụng

**P0:** cần xử lý trước khi đưa ứng dụng lên mạng. **P1:** sai nghiệp vụ/dữ liệu hoặc rủi ro đáng kể. **P2:** lỗi chức năng, kiểm tra đầu vào hoặc hiển thị.

| ID | Mức | Lỗi, cách tái hiện và kết quả thực tế |
|---|---|---|
| B01 | P0 | **API không xác thực và không kiểm tra quyền sở hữu.** Gọi không có cookie/token vẫn đọc được `/api/admin/users`, toàn bộ `/api/orders`, sửa hồ sơ qua `/api/auth/update/{userId}`, tạo tài khoản ADMIN và đặt lại mật khẩu ADMIN. Các thử nghiệm này đều trả 200/201. Việc ẩn menu theo role ở frontend không bảo vệ API. |
| B02 | P0 | **Có thể tự sửa giá, giảm giá và tổng tiền khi đặt hàng.** Sản phẩm QA giá 100.000đ: gửi `totalAmount:1` được đơn 1đ; gửi `unitPrice:0` chỉ còn phí ship 35.000đ; gửi `discountAmount:9999999` tạo đơn tổng 0đ. Backend dùng trực tiếp dữ liệu giá do client gửi. |
| B03 | P0 | **Thông tin kết nối database, gồm mật khẩu, được ghi trực tiếp trong file cấu hình được theo dõi bởi Git.** Xác nhận bằng đọc file; không thử đăng nhập database thật. Không chép lại giá trị bí mật trong báo cáo. Cần thu hồi/đổi mật khẩu đã lộ và chuyển cấu hình sang biến môi trường. |
| B04 | P1 | **Chuỗi hash được chấp nhận như mật khẩu đăng nhập.** Với tài khoản QA, gửi SHA-256 của mật khẩu vào ô password vẫn đăng nhập 200. Nguyên nhân là nhánh `password.equals(storedHash)`. Điều kiện khai thác cần biết hash; không đồng nghĩa có thể đăng nhập với mật khẩu bất kỳ. |
| B05 | P1 | **`sales.sql` không nhập nguyên file được.** Trùng `users.id=34`, `users.id=35`, `customers.id=21`, `customers.id=22`. PostgreSQL trả `23505`, dừng ở bản ghi trùng đầu tiên. Phần seed nằm trong transaction nên các INSERT trong transaction bị rollback. |
| B06 | P1 | **Khởi tạo schema chạy sai thứ tự.** `@PostConstruct` thêm `categories.is_active`, tạo `product_images` và `invoices` trước khi `SalesDatabaseInitializer` tạo các bảng nền. Trên database trống: API categories và invoices trả 500; kiểm tra schema thiếu các bảng mở rộng. Lỗi khởi tạo bị bắt rồi ứng dụng tiếp tục chạy. |
| B07 | P1 | **Tồn kho không giảm khi bán và tăng sai khi hủy.** Kho 13 vẫn nhận đơn 999.999 sản phẩm. Tạo đơn 1 sản phẩm không trừ kho; hủy qua admin lại cộng lên 14. Không tìm thấy câu SQL trừ kho trong các luồng bán hàng. |
| B08 | P2 | **Tạo được đơn không có dòng hàng hợp lệ.** Gửi `items:[{productId:...,quantity:0,unitPrice:100000}]` vẫn trả 200, tạo đơn 35.000đ nhưng không lưu order item. Cần từ chối toàn bộ request không hợp lệ. |
| B09 | P1 | **Sản phẩm bị lặp trong request làm lệch tiền và số lượng.** Gửi cùng productId hai dòng số lượng 1 và 2: tổng đơn tính cho 3 sản phẩm + ship, nhưng `ON CONFLICT` ghi đè, database chỉ giữ quantity=2 và amount=200.000đ. |
| B10 | P1 | **Không lưu thông tin người nhận độc lập cho từng đơn.** `fullName` của checkout bị bỏ qua. Tải lại trang thành công thì tên người nhận thành tên tài khoản. Đặt đơn mới với địa chỉ/số điện thoại khác làm thông tin giao hàng của đơn cũ thay đổi theo, vì API đọc từ bảng customers hiện tại. |
| B11 | P1 | **Đơn thiếu danh tính bị gán cho khách hàng đầu tiên.** Gửi `customerId:null,userId:null` vẫn trả 200 và lưu `customer_id=1`; đồng thời có thể ghi đè thông tin liên hệ khách đó. Cần lấy danh tính từ phiên đã xác thực hoặc có quy trình khách vãng lai riêng. |
| B12 | P1 | **API tạo đơn bỏ qua tính hợp lệ của voucher.** Sau khi đặt `used_quantity=quantity`, endpoint validate từ chối đúng nhưng POST `/api/orders` vẫn chấp nhận voucher và giảm 10.000đ. Kiểm tra ở màn hình/endpoint validate không thay thế việc kiểm tra trong transaction tạo đơn. |
| B13 | P2 | **Voucher chưa đến ngày bắt đầu vẫn dùng được.** Voucher bắt đầu năm 2030 vẫn xuất hiện trong `/api/vouchers/active` và validate trả 200, giảm 10.000đ. Query chỉ kiểm tra ngày hết hạn, thiếu ngày bắt đầu. |
| B14 | P2 | **Khách hủy đơn không được hoàn lượt voucher.** Đơn dùng voucher làm used_quantity tăng lên 1; POST `/api/orders/{id}/cancel` thành công nhưng used_quantity vẫn là 1 thay vì 0. Luồng admin và luồng khách xử lý khác nhau. |
| B15 | P1 | **Phiếu nhập có thể cộng kho nhiều lần.** Phiếu COMPLETED nhập 3 sản phẩm; chuyển COMPLETED → PENDING → COMPLETED được chấp nhận và cộng thêm 3 dù không nhập hàng mới. Chuyển cùng trạng thái COMPLETED hai lần liên tiếp không lỗi; lỗi nằm ở vòng chuyển trạng thái qua lại. |
| B16 | P2 | **Phiếu nhập chấp nhận toàn bộ dòng số lượng 0.** API trả 201 cho danh sách có một dòng quantity=0; tạo chứng từ không có dòng hàng hợp lệ. |
| B17 | P1 | **Hóa đơn chưa áp dụng khuyến mãi sản phẩm và bậc đơn như tài liệu thiết kế.** Tạo chiến dịch ACTIVE, giảm sản phẩm 20% và giảm đơn 10%, nhưng preview vẫn orderDiscount=0, finalAmount=135.000đ. Xác nhận đối chiếu các bước B2–B4 trong tài liệu Module 09. Nếu nghiệp vụ đã thay đổi, cần cập nhật tài liệu và giao diện tương ứng. |
| B18 | P2 | **Preview hóa đơn chấp nhận VAT âm.** Gửi `includeVat:true,vatPercent:-10` trả 200 với VAT=-13.500đ, tổng giảm còn 121.500đ. Cần kiểm tra miền giá trị tại DTO/service. Chưa khẳng định hóa đơn VAT âm lưu được vì ràng buộc database có thể chặn. |
| B19 | P1 | **Doanh thu danh mục bỏ qua trạng thái và khoảng ngày.** Gọi category-share trong 01–02/01/2040, khi không có đơn nào, vẫn trả doanh thu lớn. SQL LEFT JOIN có điều kiện ở bảng orders nhưng SUM vẫn lấy order_items không khớp, nên cộng cả đơn PENDING/CANCELLED và ngoài kỳ. |
| B20 | P1 | **Dashboard và tìm kiếm Ctrl+K gọi sai địa chỉ API.** Request `/api/...` đi vào Vite 5175, nhận HTML thay vì JSON. Dashboard hiện số mẫu 452.800.000đ trong khi API thật trả 31.509.000đ. Ctrl+K không tìm thấy sản phẩm QA tồn tại. Danh sách đơn mới và cảnh báo kho trên Dashboard cũng đang là mảng viết sẵn. |
| B21 | P1 | **Upload ảnh chấp nhận HTML.** Upload `qa.html` MIME `text/html` được trả 200 và ghi thành URL `.html`. Không kiểm tra loại nội dung/đuôi ảnh. Chỉ thử tài liệu HTML vô hại, chưa kiểm thử thực thi script. |
| B22 | P2 | **Ảnh upload bị hỏng trên storefront khi frontend/backend khác origin.** Backend phục vụ PNG thành công; storefront lại tải `/uploads/...png` từ Vite 5175 thay vì backend 18080. Chrome ghi nhận naturalWidth=0. `loadProducts` chưa ghép URL backend với đường dẫn tương đối. |
| B23 | P2 | **Catalog trống bị thay bằng sản phẩm cache/demo.** Cho API trả HTTP 200 với `[]`, giao diện vẫn hiện 22 sản phẩm cũ. Khi admin ẩn hết hàng, khách có thể vẫn thấy và đặt các sản phẩm không còn được công khai. Cần phân biệt dữ liệu rỗng hợp lệ với mất kết nối. |
| B24 | P1 | **Mất mạng khi hủy đơn vẫn báo thành công.** Chặn request hủy, `cancelOrderApi` trả `{success:true}` và sửa localStorage dù server chưa nhận yêu cầu. Khách có thể tưởng đơn đã hủy trong khi hệ thống vẫn xử lý. |
| B25 | P2 | **Lịch sử đơn dùng hai key không đồng bộ.** Khi `funi_orders_history` đã có dữ liệu, `saveOrderToLocalHistory` chỉ ghi `nep_orders_history`. Luồng đọc ưu tiên funi nên bỏ mất đơn mới. Đã tái hiện với hai bản ghi OLD/NEW. |
| B26 | P1 | **Tạo tài khoản CUSTOMER từ trang admin không tạo hồ sơ customers.** API tạo trả 201, đăng nhập được nhưng customerId=null. Ghép với fallback ở B11 có thể dẫn tới đơn bị gán cho khách khác. |
| B27 | P2 | **Một số đầu vào không hợp lệ trả 500 và lộ chi tiết nội bộ.** `/api/admin/products?page=-1`, đặt sản phẩm không tồn tại, đặt ảnh chính với imageId không tồn tại đều trả 500. Trường hợp sản phẩm không tồn tại còn trả cả SQL và tên ràng buộc khóa ngoại. Cần 400/404 có thông báo phù hợp và kiểm tra trước khi ghi. |

### Vị trí mã nguồn cần xem

| Nhóm | Vị trí |
|---|---|
| B01 | [AdminUserController.java:37](D:/furniture/backend/src/main/java/furniture/controller/AdminUserController.java:37), [AuthController.java:68](D:/furniture/backend/src/main/java/furniture/controller/AuthController.java:68), [OrderController.java:31](D:/furniture/backend/src/main/java/furniture/controller/OrderController.java:31). Các controller không có cơ chế xác thực ở backend. |
| B02, B07–B12 | [OrderService.java:30](D:/furniture/backend/src/main/java/furniture/service/OrderService.java:30), [OrderRepository.java:129](D:/furniture/backend/src/main/java/furniture/repository/OrderRepository.java:129), [AdminOrderService.java:70](D:/furniture/backend/src/main/java/furniture/service/AdminOrderService.java:70). |
| B03–B04 | [application.yaml:11](D:/furniture/backend/src/main/resources/application.yaml:11), [PasswordUtil.java:26](D:/furniture/backend/src/main/java/furniture/util/PasswordUtil.java:26). |
| B05–B06 | [sales.sql:683](D:/furniture/database/sales.sql:683), [SalesDatabaseInitializer.java:108](D:/furniture/backend/src/main/java/furniture/config/SalesDatabaseInitializer.java:108), [AdminCategoryRepository.java:29](D:/furniture/backend/src/main/java/furniture/repository/AdminCategoryRepository.java:29), [AdminProductRepository.java:36](D:/furniture/backend/src/main/java/furniture/repository/AdminProductRepository.java:36), [AdminInvoiceRepository.java:41](D:/furniture/backend/src/main/java/furniture/repository/AdminInvoiceRepository.java:41). |
| B13–B14 | [VoucherRepository.java:65](D:/furniture/backend/src/main/java/furniture/repository/VoucherRepository.java:65), [OrderRepository.java:195](D:/furniture/backend/src/main/java/furniture/repository/OrderRepository.java:195). |
| B15–B16 | [AdminSupplierRepository.java:258](D:/furniture/backend/src/main/java/furniture/repository/AdminSupplierRepository.java:258), [AdminSupplierRepository.java:323](D:/furniture/backend/src/main/java/furniture/repository/AdminSupplierRepository.java:323). |
| B17–B19 | [AdminInvoiceService.java:90](D:/furniture/backend/src/main/java/furniture/service/AdminInvoiceService.java:90), [AdminStatisticsRepository.java:230](D:/furniture/backend/src/main/java/furniture/repository/AdminStatisticsRepository.java:230). |
| B20 | [AdminDashboard.jsx:20](D:/furniture/frontend/src/admin/AdminDashboard.jsx:20), [AdminGlobalSearchModal.jsx:46](D:/furniture/frontend/src/admin/AdminGlobalSearchModal.jsx:46), [vite.config.js](D:/furniture/frontend/vite.config.js). |
| B21–B23 | [FileStorageService.java:32](D:/furniture/backend/src/main/java/furniture/service/FileStorageService.java:32), [products.js:15](D:/furniture/frontend/src/lib/products.js:15). |
| B24–B26 | [orders.js:110](D:/furniture/frontend/src/lib/orders.js:110), [orders.js:143](D:/furniture/frontend/src/lib/orders.js:143), [AdminUserService.java:51](D:/furniture/backend/src/main/java/furniture/service/AdminUserService.java:51). |
| B27 | [AdminProductRepository.java:108](D:/furniture/backend/src/main/java/furniture/repository/AdminProductRepository.java:108), [AdminProductRepository.java:278](D:/furniture/backend/src/main/java/furniture/repository/AdminProductRepository.java:278), [OrderController.java:42](D:/furniture/backend/src/main/java/furniture/controller/OrderController.java:42). |

## 3. Cài đặt mới và bộ test có sẵn

**Cài đặt mới:** Chạy backend với database trống và bản sao nguyên trạng của sales.sql. Sau khi khởi động, users=0, products=0; categories và invoices trả 500, đăng nhập admin01/123456 trả 401. Nguyên nhân kết hợp B05 và B06. Xem [clean-start-results.json](artifacts/clean-start-results.json), [seed-results.json](artifacts/seed-results.json) và [clean-start.log](artifacts/clean-start.log).

**JUnit:** Ca `AdminOrderServiceTest.confirmOrder_StaffNotFound_ThrowsIllegalArgumentException` thất bại ở [dòng 163](D:/furniture/backend/src/test/java/furniture/AdminOrderServiceTest.java:163). Ngoại lệ vẫn được ném đúng loại; assertion yêu cầu thông báo chứa `không tồn tại`, trong khi service hiện trả `Không tìm thấy nhân viên phụ trách hợp lệ...`. Đây là lệch kỳ vọng test/thông báo, cần thống nhất trước khi kết luận sai nghiệp vụ. Các bài service còn lại dùng repository giả lập; `contextLoads` dùng H2 và không bảo đảm schema PostgreSQL đã khởi tạo đúng.

**Maven Wrapper trên máy này:** `backend\.\mvnw.cmd test` dừng với `Cannot index into a null array`. [mvnw.cmd:92](D:/furniture/backend/mvnw.cmd:92) truy cập `.Target[0]` khi Target null. Đã chạy được toàn bộ test bằng Maven đã cài trong cache, không sửa wrapper. Đây là vấn đề tương thích môi trường; không ngăn việc kiểm thử backend lần này.

**Lưu ý về dữ liệu seed:** Đăng ký và tạo đơn đang gọi `appendToSalesSql`, ghi thêm dữ liệu người dùng/đơn vào file seed trên ổ đĩa nếu tìm thấy. Trong phiên này chỉ bản sao `qa/database/sales.sql` được ghi. Nên bỏ cơ chế sửa file seed trong request nghiệp vụ; dữ liệu phát sinh cần ở database và backup riêng.

## 4. Các phần đã chạy được

- Đăng ký hợp lệ, chặn trùng username, đăng nhập bằng username/email, chặn mật khẩu sai và tài khoản bị khóa.
- CRUD cơ bản danh mục, sản phẩm, nhà cung cấp; bật/tắt hiển thị; chặn xóa danh mục có hàng và nhà cung cấp có phiếu nhập.
- Thêm/xóa ảnh bằng URL, đặt ảnh chính hợp lệ, upload và truy cập PNG trực tiếp từ backend.
- Tạo phiếu nhập và cộng kho lần đầu; không cộng lặp khi gửi nguyên cùng trạng thái COMPLETED.
- Tạo/sửa/xóa chiến dịch trống, thêm/xóa giảm giá sản phẩm và bậc đơn, tạo/duyệt/từ chối voucher; endpoint validate chặn voucher draft/inactive/hết lượt.
- Tạo đơn thường, duyệt và hoàn thành; chặn duyệt lần hai, hoàn thành khi còn PENDING và hủy đơn COMPLETED.
- Tạo hóa đơn, chặn trùng hóa đơn, xem chi tiết và tải dữ liệu PDF; xuất dữ liệu báo cáo và khách hàng qua HTTP.
- Trên trình duyệt: tìm kiếm/lọc/sắp xếp sản phẩm, yêu thích, tăng giảm giỏ, yêu cầu đăng nhập khi thanh toán, đăng nhập và đặt đơn tới trang thành công, mở các module admin, trang 404. Không có uncaught JavaScript error trong các luồng chạy.
- Viewport điện thoại 390×844 không tràn ngang ở storefront.

## 5. Giới hạn kiểm thử

Đây là kiểm thử rộng theo các module đang triển khai, **không phải chứng nhận đã bao phủ mọi tổ hợp đầu vào**. Chưa kiểm tra:

- Kết nối Supabase thật, cấu hình RLS/quyền database thật, ngrok và triển khai Internet.
- Đồng thời nhiều giao dịch, race condition, stress/load; pool của môi trường thử nghiệm giới hạn một kết nối.
- APK trên thiết bị/emulator Android; viewport điện thoại chỉ kiểm tra web responsive.
- Thanh toán thực qua ngân hàng/MoMo/VNPAY, giao hàng thực hoặc dịch vụ ngoài.
- Toàn bộ thao tác CRUD qua từng form UI; phần lớn quy tắc CRUD kiểm tra trực tiếp API. PDF mới xác nhận tải được và có signature `%PDF`, chưa kiểm tra mọi bố cục in; file Excel mới kiểm tra endpoint trả dữ liệu, chưa mở bằng Microsoft Excel.

Giỏ hàng/yêu thích hiện nằm trong bộ nhớ nên mất khi refresh. README đã mô tả giới hạn này; không tính là lỗi hồi quy trong báo cáo.

## 6. Bằng chứng và chạy lại

- [Kết quả API chính](artifacts/api-results.json), [API bổ sung](artifacts/extra-api-results.json), [kết quả trình duyệt](artifacts/browser-results.json), [tóm tắt JUnit](artifacts/existing-tests-summary.json).
- [Log build](artifacts/frontend-build.log), [lint](artifacts/frontend-lint.log), [JUnit](artifacts/qa-existing-tests.log).
- Ảnh: [checkout trước reload](artifacts/checkout-success.png), [sau reload](artifacts/checkout-after-reload.png), [admin báo cáo](artifacts/admin-reports.png), [mobile](artifacts/mobile-storefront.png).
- Mã kiểm thử và hướng dẫn môi trường: [qa/README.md](README.md).

Ưu tiên sửa: **B01–B03**, sau đó khởi tạo dữ liệu, tính tiền/tồn kho, thông tin giao hàng, voucher và báo cáo. Sau khi sửa cần chạy lại các ca tương ứng rồi chạy toàn bộ kiểm thử hồi quy.
