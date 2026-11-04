# Kiểm tra tác vụ phía khách hàng — 29/10/2026

Phạm vi: đọc luồng frontend và API liên quan tới tài khoản, danh mục, bộ lọc, giỏ hàng, mua lại, checkout, voucher và lịch sử đơn. Đã sửa các lỗi tái hiện được bằng mã nguồn và kiểm tra tự động. Chưa kiểm thử thao tác trên trình duyệt với database thật; không tạo hoặc hủy đơn thật trong đợt kiểm tra này.

## Đã sửa

| Tác vụ | Lỗi và kết quả sửa |
| --- | --- |
| Xem đơn mua | Tài khoản chưa có đơn từng tự tải toàn bộ đơn hệ thống. Đã bỏ fallback này và bắt buộc truyền customerId khi gọi API danh sách. |
| Đổi tài khoản | Cache đơn hàng dùng chung có thể hiện đơn của người khác. Chỉ đọc cache có customerId khớp; dữ liệu cũ không rõ chủ sở hữu không được hiển thị. Khi API trả danh sách rỗng, giữ kết quả rỗng. |
| Hủy đơn | Mất kết nối từng trả thành công và tự đổi trạng thái trên máy. Giờ chỉ cập nhật cache sau xác nhận thành công từ backend. |
| Lưu lịch sử | Hai khóa funi/nep không đồng bộ, đơn cũ có thể che đơn mới. Đã gộp, loại trùng và đồng bộ hai khóa. |
| Duy trì đăng nhập | Migration xóa session cũ trước khi lưu session mới. Đã lưu phiên hợp lệ vào khóa mới trước khi xóa khóa cũ. |
| Mua lại | Có thể dùng ID dòng đơn thay ID sản phẩm, cộng chuỗi số lượng hoặc thêm sản phẩm đã ngừng bán. Đã ưu tiên productId, chuyển số lượng sang số và kiểm tra danh mục hiện tại. |
| Khôi phục chi tiết đơn | Có thể mở đơn cuối cùng khác với mã URL, khác tài khoản hoặc báo phí giao hàng bằng 0 sau reload. Đã kiểm tra chủ sở hữu/mã đơn ở giao diện và bỏ giá trị phí giao hàng gán cứng. Đây chưa phải cơ chế phân quyền backend. |
| Checkout | Đã chặn gửi khi thiếu khách hàng, giỏ rỗng hoặc thông tin giao hàng không hợp lệ. Backend không còn gán đơn thiếu danh tính cho khách đầu tiên trong database. |
| Địa chỉ | Chỉnh sửa hoặc dùng địa chỉ tài khoản có thể lặp quận/tỉnh, mặc định sai TP. Hồ Chí Minh. Đã tách phần đường và các lựa chọn hành chính nếu nhận diện được; phần chưa nhận diện được được giữ nguyên. |
| Danh mục rỗng | API trả [] từng bị coi là lỗi và thay bằng sản phẩm mẫu/cached. Giờ hiển thị danh mục trống đúng theo API. |
| Sao chép | Đã bỏ thông báo sao chép thành công khi clipboard thất bại hoặc thao tác chưa hề sao chép. |
| Lọc giá tự nhập | Không còn xóa ký tự rồi vô tình đổi giá nhập dạng số mũ thành số khác; kiểm tra số hữu hạn, không âm. |

## Những lỗi còn tồn tại cần xử lý ở backend

Các mục dưới đây được xác định qua mã nguồn, chưa được sửa trong đợt này. Các test đang qua không chứng minh những luồng này đã đúng.

1. **Ưu tiên cao — API chưa xác thực quyền sở hữu.** `OrderController` nhận ID đơn/customerId do client gửi, không kiểm tra session/token; `AuthController` cũng nhận userId trực tiếp khi xem/sửa hồ sơ. Việc lọc trên giao diện không ngăn người gọi API trực tiếp truy cập dữ liệu của tài khoản khác. Cần xác thực server và suy ra user/customer từ phiên đã xác thực cho cả đọc lẫn ghi.
2. **Ưu tiên cao — Giá và tiền giảm chưa được backend tính lại từ database.** Trong `OrderService.createOrder`, unitPrice, discountAmount và totalAmount lấy từ request. Giá trong giỏ đã cũ hoặc request bị thay đổi có thể tạo đơn sai tiền. Cần lấy giá sản phẩm hiện tại, kiểm tra voucher khi chốt đơn và trả chi tiết số tiền đã xác nhận cho frontend.
3. **Ưu tiên cao — Tồn kho chưa đồng bộ với đơn khách hàng.** `OrderService.createOrder` không kiểm tra/trừ số lượng tồn; trong khi `AdminOrderService.cancelOrder` lại hoàn tồn. Có thể đặt vượt tồn và tăng tồn sau khi hủy qua admin. Cần thống nhất thời điểm giữ/trừ/hoàn tồn, thực hiện nguyên tử trong transaction và kiểm thử đồng thời.
4. **Voucher chưa hoàn lượt khi khách hủy đơn.** `OrderService.cancelOrder` chỉ đổi trạng thái, không giảm used_quantity. `incrementVoucherUsedQuantity` không buộc tạo đơn thất bại khi voucher đã hết lượt. Cần tiêu thụ/hoàn lượt nguyên tử, chỉ một lần cho mỗi chuyển trạng thái.
5. **Địa chỉ nhận hàng chưa có bản lưu riêng cho từng đơn.** Khi đặt hàng, `updateCustomerContact` sửa hồ sơ customers; API đơn lại JOIN hồ sơ hiện tại. Đổi địa chỉ ở đơn mới có thể làm các đơn cũ hiện địa chỉ mới. Trường fullName nhận trong checkout cũng chưa được lưu riêng theo đơn. Cần lưu thông tin người nhận trên đơn bằng migration và cập nhật API.
6. **Backend tự sửa file seed khi đăng ký/đặt hàng.** `AuthService` và `OrderService` ghi vào `database/sales.sql` trước khi transaction hoàn tất. File có thể lệch database sau rollback và thường xuyên gây conflict Git. Nên tách dữ liệu vận hành khỏi file seed; dùng backup/export riêng nếu cần.

## Kiểm tra đã chạy

- `frontend`: `npm test` — 14 test hồi quy cho session, lịch sử theo khách, API rỗng/offline, hủy đơn, đồng bộ cache, danh mục rỗng và tách địa chỉ.
- `frontend`: `npm run build` — thành công. Có cảnh báo kích thước bundle.
- `frontend`: oxlint các file thay đổi — không có lỗi chặn; còn cảnh báo lint của mã hiện tại.
- `backend`: Maven test bằng JDK 21 — 101 test qua, gồm hai test mới chặn truy vấn danh sách thiếu khách và ngăn gán đơn cho khách đầu tiên.

Chưa commit/push các thay đổi. Bộ lọc sản phẩm từ yêu cầu trước vẫn được giữ lại.
