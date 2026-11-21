# ĐẶC TẢ NGHIỆP VỤ KHUYẾN MÃI, VOUCHER & PHÂN QUYỀN (FURNISTORE)

## 1. Luồng tính giá & Tự động áp dụng ưu đãi tốt nhất (Auto-Apply Best Deal)

Hệ thống áp dụng cơ chế kết hợp 2 tầng khuyến mãi độc lập theo thứ tự sau:

* **Tầng 1 – Giảm giá trực tiếp theo sản phẩm (Product Discount):**
  * Các sản phẩm thuộc danh sách giảm giá của chiến dịch đang `ACTIVE` sẽ được **giảm giá trực tiếp** ngay từ ngoài Trang chủ, Danh mục và Giỏ hàng (hiển thị giá gốc gạch ngang + giá sau giảm + nhãn `%` giảm), không bắt khách phải bấm chọn thủ công.
  * Khi thêm vào giỏ hàng, hệ thống tính `subtotal` dựa trên **giá sản phẩm đã giảm**.
* **Tầng 2 – Tự động chọn 01 Voucher toàn đơn hàng tốt nhất (Order Voucher):**
  * Tại bước Giỏ hàng / Thanh toán (Checkout), Backend tự động quét toàn bộ các voucher đơn hàng đang `ACTIVE`, còn lượt sử dụng, còn hạn (`startDate <= now <= endDate`) và thỏa điều kiện giá trị đơn tối thiểu (`subtotal >= min_order_value`).
  * Hệ thống tự động tính số tiền giảm thực tế của từng voucher hợp lệ (có áp dụng trần giảm tối đa `max_discount_amount`, mức giảm phổ biến 2%–3% để bảo toàn biên lợi nhuận) và **tự động áp dụng 01 voucher mang lại số tiền giảm lớn nhất** cho khách hàng.
  * Khách hàng vẫn có thể bấm nút **"Xem tất cả mã / Đổi mã"** để xem toàn bộ danh sách voucher (gồm nhóm *Đủ điều kiện* và nhóm *Chưa đủ điều kiện* kèm lý do) và tự chọn sang mã khác nếu muốn (chỉ áp dụng tối đa 01 voucher đơn hàng tại một thời điểm).

## 2. Giao diện hiển thị Thanh toán (Checkout UI/UX)

* **Hiển thị minh bạch 2 dòng giảm giá:**
  1. *Tạm tính (đã bao gồm ưu đãi giảm giá sản phẩm):* Hiển thị tổng tiền sau Tầng 1.
  2. *Voucher đơn hàng tự động áp dụng (`MÃ_TỐT_NHẤT`):* Hiển thị số tiền được trừ thêm ở Tầng 2 kèm nhãn *"Đã tự động chọn ưu đãi tốt nhất"*.
* **Danh sách nhiều Voucher:** Dùng Accordion sổ xuống tại chỗ hoặc Modal với lớp phủ nền tối đơn giản (`background-color: rgba(0, 0, 0, 0.45)`, tuyệt đối không dùng `backdrop-filter: blur` để tránh lag khi cuộn).

## 3. Vòng đời dữ liệu & Quy tắc Sửa / Xóa (Hard Delete vs. Soft Delete)

* **Xóa cứng (Hard Delete):** Chỉ xóa bản ghi khỏi PostgreSQL khi voucher hoặc cấu hình giảm giá sản phẩm **chưa từng phát sinh lượt sử dụng nào** (`used_count == 0`).
* **Xóa mềm / Lưu trữ (Soft Delete - `ARCHIVED`):** Bắt buộc áp dụng nếu đã có ít nhất 1 đơn hàng sử dụng (`used_count > 0`), kể cả đơn đã hủy. Ẩn khỏi danh sách thao tác chính nhưng giữ nguyên bản ghi và khóa các nút Sửa/Xóa (chỉ giữ nút xem `Lịch sử`) để bảo toàn khóa ngoại và đối soát hóa đơn.
* **Ràng buộc chỉnh sửa:**
  * Khi `used_count == 0` và trạng thái `INACTIVE`: Cho phép sửa toàn bộ thông tin (tên mã, loại giảm, % hoặc số tiền giảm, trần tối đa, thời gian).
  * Khi `used_count > 0` hoặc đang `ACTIVE`: Khóa sửa các trường tài chính (`code`, `discount_type`, `discount_value`, `max_discount_amount`); chỉ cho phép chuyển trạng thái sang `INACTIVE` (Tạm dừng) hoặc dùng chức năng **"Tạo mã thay thế"**.

## 4. Ma trận phân quyền RBAC (Admin vs. Staff vs. Customer)

| Chức năng / Thao tác | Admin | Staff (Nhân viên) | Customer |
| :--- | :---: | :---: | :---: |
| **Xem danh sách & chi tiết Chiến dịch / Voucher** | Toàn bộ | Toàn bộ | Chỉ mã `ACTIVE` & hợp lệ |
| **Tạo mới Chiến dịch / Voucher / Giảm giá SP** | Có | Có (Mặc định trạng thái `INACTIVE`) | Không |
| **Sửa cấu hình (Chưa chạy & `used_count = 0`)** | Có | Có | Không |
| **Sửa cấu hình (Đã chạy hoặc `used_count > 0`)** | Chỉ Tạm dừng / Tạo mã thay thế | Không | Không |
| **Bật kích hoạt (`ACTIVE`)** | Có | Không (Cần Admin duyệt) | Không |
| **Tắt / Tạm dừng khẩn cấp (`INACTIVE`)** | Có | Có | Không |
| **Xóa / Lưu trữ (`DELETE`)** | Có (Tự động Hard/Soft delete) | Không | Không |
| **Truy cập trang cửa hàng (Storefront)** | Chế độ xem trước (Khóa đặt hàng) | Chế độ xem trước (Khóa đặt hàng) | Mua hàng & Nhận ưu đãi tự động |

## 5. Kiểm soát phiên đăng nhập & Chế độ xem trước (Admin Preview Mode)

* **Single Auth Session:** Khi đăng nhập tài khoản mới trên cùng trình duyệt, ghi đè hoàn toàn dữ liệu phiên cũ trong `localStorage` để không bị xung đột hiển thị tên/vai trò giữa `CUSTOMER` và `ADMIN`.
* **Chế độ xem trước Quản trị viên:** Khi `ADMIN` hoặc `STAFF` chuyển sang trang cửa hàng, giữ nguyên phiên đăng nhập, hiển thị thanh Top Bar *"Bạn đang xem trang cửa hàng với vai trò Quản trị viên"* kèm nút quay lại Dashboard, đồng thời ẩn giỏ hàng và chặn API đặt hàng (`403 Forbidden`).
