# ĐẶC TẢ NGHIỆP VỤ QUẢN LÝ VOUCHER & PHÂN QUYỀN (FURNISTORE)

## 1. Phân loại Voucher & Quy tắc áp dụng (Checkout)
* **3 hình thức giảm giá:** Giảm theo phần trăm (có giới hạn mức giảm tối đa), Giảm tiền mặt trực tiếp, và Miễn phí/hỗ trợ phí vận chuyển.
* **Cơ chế áp dụng (Tự động thay thế - Single Active Voucher):** Mỗi đơn hàng tại một thời điểm chỉ áp dụng tối đa **01 mã ưu đãi** (hoặc mã giảm riêng cho sản phẩm, hoặc mã giảm toàn đơn hàng) nhằm bảo toàn biên lợi nhuận ngành hàng nội thất. Khi khách hàng chọn mã mới, hệ thống tự động gỡ bỏ mã cũ và tính lại tổng tiền.
* **Giao diện chọn mã (Client UI/UX):**
  * Hiển thị trực tiếp **01 mã gợi ý tốt nhất** tại khung thanh toán kèm nút **"Dùng ngay"**.
  * Cung cấp nút **"Xem tất cả mã"** mở Popup (nền tối bán trong suốt `rgba(0,0,0,0.45)`, không dùng `blur` để tối ưu hiệu năng) hoặc Accordion sổ xuống, phân tách rõ nhóm mã *Đủ điều kiện* và *Chưa đủ điều kiện* (kèm lý do cụ thể).

## 2. Vòng đời dữ liệu & Xử lý xóa/sửa Voucher
* **Tạo mới/thay thế:** Mã mới luôn là `INACTIVE`, kể cả khi request gửi `ACTIVE`. Tạo mã thay thế đồng thời tạm ngưng mã cũ trong cùng transaction.
* **Kiểm tra thử:** Admin và SALES có thể mô phỏng mức giảm của mã tạm ngưng, mã chưa đến hạn hoặc hết hạn. Kết quả có cảnh báo; không kích hoạt mã, trừ lượt dùng hay tồn kho. Điều kiện giỏ hàng, VIP và hạn mức vẫn được kiểm tra. API khách hàng không có chế độ bỏ qua trạng thái/thời gian.
* **Xóa cứng (Hard Delete):** Chỉ `DELETE` khi `used_quantity == 0` và không có bất kỳ đơn nào tham chiếu, kể cả đơn đã hủy. Khóa dòng và kiểm tra/xóa trong cùng transaction; khóa ngoại khác sẽ chặn xóa và trả lỗi rõ ràng.
* **Xóa mềm / Lưu trữ (Soft Delete):** Có lượt dùng hoặc lịch sử đơn thì đặt `status = INACTIVE`, `is_deleted = TRUE`. UI hiển thị “Đã lưu trữ”; không chỉnh sửa/kích hoạt lại, vẫn xem lịch sử. Hết hạn theo thời gian không tự động đồng nghĩa với lưu trữ.
* **Ràng buộc chỉnh sửa khi sai sót:**
  * Chỉ sửa mã `INACTIVE` có `used_quantity == 0` và không có đơn tham chiếu. Lưu sửa vẫn giữ `INACTIVE`; loại/phạm vi voucher cũ được giữ nguyên.
  * Đã có lịch sử sử dụng thì khóa toàn bộ điều kiện và thời gian. Admin có thể tạo mã thay thế. Tạm ngưng/lưu trữ không tính lại tiền giảm trong các đơn cũ.

## 3. Ma trận phân quyền RBAC (Admin vs. Staff vs. Customer)

| Chức năng / Thao tác | Admin | Staff SALES (Nhân viên bán hàng) | Customer |
| :--- | :---: | :---: | :---: |
| **Xem danh sách & chi tiết Voucher** | Toàn bộ | Toàn bộ | Chỉ mã `ACTIVE` & đủ điều kiện |
| **Tạo mới Voucher** | Có | Có (Mặc định trạng thái `INACTIVE`) | Không |
| **Sửa Voucher (Tạm ngưng & chưa có lượt dùng/lịch sử đơn)** | Có | Có | Không |
| **Sửa Voucher (Đang hoạt động hoặc đã có lịch sử)** | Không; tạm ngưng mã chưa dùng trước khi sửa | Không | Không |
| **Bật kích hoạt (`ACTIVE`)** | Có | Không (Cần Admin duyệt) | Không |
| **Tắt / Tạm dừng khẩn cấp (`INACTIVE`)** | Có | Có | Không |
| **Xóa / Lưu trữ Voucher (`DELETE`)** | Có (Tự động phân nhánh Hard/Soft) | Không | Không |
| **Tạo mã thay thế** | Có (Mã mới tạm ngưng, mã cũ tạm ngưng) | Không | Không |
| **Xem trang cửa hàng (Storefront Preview)** | Được xem (Khóa chức năng đặt hàng) | Được xem (Khóa chức năng đặt hàng) | Mua hàng & Áp mã bình thường |

## 4. Quy tắc kiểm soát phiên đăng nhập & Chế độ xem trước
* Giữ riêng phiên khách và quản trị. Chỉ bật xem trước khi bấm “Xem cửa hàng” từ quản trị; ẩn danh tính/chức năng mua hàng của khách trong chế độ này.
* Quay lại quản trị sẽ kết thúc xem trước. Sau đó mở trang chủ bình thường sẽ khôi phục phiên khách hoặc cho đăng nhập/đăng ký khách, không tự đăng xuất quản trị.

## 5. Phạm vi phiên bản hiện tại
* Mã mới là voucher VIP giảm theo phần trăm, có trần giảm. Mã ORDER/PRODUCT cũ tiếp tục được tra cứu và dùng theo điều kiện cũ; các nhóm ưu đãi tự động được quản lý riêng.
* Các hình thức giảm tiền mặt/phí vận chuyển ở mục 1 là yêu cầu mở rộng, chưa triển khai trong đợt sửa vòng đời voucher này.
* Nhân viên WAREHOUSE/CONTENT giữ phạm vi phân quyền hiện có, không được thêm quyền quản lý voucher.
* Không cần migration dữ liệu cho vòng đời này; không thay đổi trạng thái voucher đã có. Xóa cứng chỉ xảy ra sau xác nhận của admin và kiểm tra lại phía server.
