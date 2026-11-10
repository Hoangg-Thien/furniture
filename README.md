# furniture

Khách có thể chọn sản phẩm, nhập thông tin nhận hàng và đặt hàng COD mà không cần đăng nhập. Tài khoản đã đăng nhập vẫn dùng luồng đặt hàng và lịch sử đơn mua hiện có.

- Khởi động lại backend để tự chạy `backend/src/main/resources/guest_checkout.sql`: cho phép hồ sơ khách không có tài khoản và thêm mã băm bảo vệ đơn vãng lai. Migration chạy lại được, không xóa dữ liệu cũ.
- Mỗi đơn vãng lai có hồ sơ khách riêng; không tự ghép theo số điện thoại hoặc gán vào tài khoản khác.
- Trang thành công có nút sao chép liên kết để xem trạng thái và hủy khi đơn còn `PENDING`. Cần giữ đầy đủ liên kết và chỉ chia sẻ với người được phép xem đơn.
- Backend lấy giá từ database, kiểm tra voucher, tính phí giao hàng và trừ kho trong cùng transaction. Đơn mới chỉ lưu trong database, không ghi nối vào file dữ liệu mẫu `sales.sql`.

API `POST /api/orders` nhận họ tên, số điện thoại, địa chỉ, quận/huyện, tỉnh/thành phố và danh sách sản phẩm. Khách vãng lai bỏ trống `customerId` và `userId`; khách có tài khoản tiếp tục gửi phiên đăng nhập và ID của mình. Giá/tổng tiền/giảm giá do client gửi không quyết định số tiền lưu. Phản hồi thêm `guestToken`, `subtotal`, `discountAmount`, `shippingFee`, `items` với giá đã tính trên server.

Quyền xem/hủy đơn vãng lai được truyền bằng header `X-Order-Token`. Token nằm sau dấu `#` trong liên kết giao diện, không nằm trong query của API; database chỉ lưu mã băm. Biết mã đơn hàng không đủ để xem đơn.

Kiểm thử: `npm.cmd test` trong `frontend`; Maven `test` trong `backend`. Với backend/frontend QA đang chạy bằng `node qa/harness/start.mjs`, chạy `node qa/harness/guest-checkout-check.mjs` để kiểm tra API, giao diện mobile/desktop, tải lại, liên kết riêng, hủy đơn, quản trị và hóa đơn trên database QA độc lập.
