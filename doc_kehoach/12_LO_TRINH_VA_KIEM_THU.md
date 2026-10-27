# TÀI LIỆU 12: LỘ TRÌNH TRIỂN KHAI VÀ KẾ HOẠCH KIỂM THỬ
## ROADMAP 4 GIAI ĐOẠN, TIÊU CHÍ NGHIỆM THU & TEST CASES

[⬅️ Quay lại Trang Mục Lục](README.md)

---

## 1. LỘ TRÌNH TRIỂN KHAI DỰ ÁN (PROJECT ROADMAP)

Dự án được phân bổ thực thi trong vòng **6 tuần** theo mô hình Agile/Scrum chia thành 4 Sprint:

```
Tuần 1 - 2          Tuần 3              Tuần 4 - 5          Tuần 6
+-----------------+ +-----------------+ +-----------------+ +-----------------+
| SPRINT 1:       | | SPRINT 2:       | | SPRINT 3:       | | SPRINT 4:       |
| Nền tảng DB,    | | Nhân sự,        | | Khuyến mãi,     | | Báo cáo,        |
| Phân quyền &    | | Khách hàng &    | | Đơn đặt hàng &  | | Xuất dữ liệu &  |
| Kho sản phẩm    | | Nhà cung cấp    | | Hóa đơn         | | UAT Nghiệm thu  |
+-----------------+ +-----------------+ +-----------------+ +-----------------+
```

### Chi tiết các Sprint:

| Sprint | Thời gian | Hạng mục công việc trọng tâm | Sản phẩm đầu ra (Deliverables) |
| :---: | :---: | :--- | :--- |
| **Sprint 1** | Tuần 1 - 2 | - Tạo bảng `product_images` và `invoices` trên PostgreSQL.<br>- Cấu hình Spring Security RBAC cho route `/api/admin/**`.<br>- Dựng layout Admin React SPA (Sidebar, Header, Routing).<br>- Hoàn thiện **Module 01** (Tài khoản) & **Module 04** (Loại nội thất).<br>- Hoàn thiện **Module 05** (Sản phẩm & Kéo thả tải album ảnh). | Admin đăng nhập được; Quản lý xong danh mục; CRUD sản phẩm kèm tải bộ sưu tập nhiều ảnh. |
| **Sprint 2** | Tuần 3 | - Hoàn thiện **Module 02** (Khách hàng CRM & Lịch sử mua sắm).<br>- Hoàn thiện **Module 03** (Nhân viên & Tự động cấp tài khoản).<br>- Hoàn thiện **Module 06** (Nhà cung cấp & Lịch sử phiếu nhập hàng). | Quản trị trọn vẹn các đối tượng con người, nhân sự và đối tác cung ứng trong chuỗi bán hàng. |
| **Sprint 3** | Tuần 4 - 5 | - Hoàn thiện **Module 07** (Chiến dịch khuyến mãi, chiết khấu, sinh mã Voucher).<br>- Hoàn thiện **Module 08** (Luồng duyệt đơn hàng, hủy đơn hoàn kho/voucher).<br>- Hoàn thiện **Module 09** (Lập hóa đơn bán hàng, thuật toán tính giảm giá, in PDF). | Luồng bán hàng nội thất khép kín từ đặt đơn ➔ duyệt ➔ áp voucher ➔ xuất hóa đơn ➔ in ấn. |
| **Sprint 4** | Tuần 6 | - Hoàn thiện **Module 10** (Dashboard KPI, biểu đồ doanh thu theo ngày, top bán chạy).<br>- Tích hợp tính năng xuất file Excel (.xlsx) báo cáo tài chính.<br>- Kiểm thử tải, tối ưu truy vấn Database, sửa lỗi UAT và bàn giao. | Hệ thống Quản trị hoàn thiện 100%, sẵn sàng chạy chính thức cho showroom nội thất. |

---

## 2. TIÊU CHÍ NGHIỆM THU CHỨC NĂNG (ACCEPTANCE CRITERIA)

Một module được coi là hoàn thành (Definition of Done) khi đáp ứng đủ các tiêu chí:

### 2.1. Tiêu chí Bảo mật & Phân quyền (Security & RBAC)
- [ ] Không có bất kỳ endpoint `/api/admin/**` nào có thể truy cập ẩn danh (unauthenticated).
- [ ] Người dùng mang Role `CUSTOMER` khi gửi request vào Admin API phải nhận về mã lỗi HTTP `403 Forbidden`.
- [ ] Mật khẩu người dùng được băm an toàn với `BCrypt` (độ dài salt >= 10). Không để lộ chuỗi mật khẩu trong các Response DTO.
- [ ] Không cho phép tài khoản Admin tự khóa chính mình.

### 2.2. Tiêu chí Dữ liệu & Nghiệp vụ (Data Integrity)
- [ ] **Sản phẩm & Ảnh**: Khi xóa một sản phẩm, toàn bộ các ảnh liên quan trong bảng `product_images` phải được xóa cascade sạch sẽ trong cơ sở dữ liệu.
- [ ] **Loại nội thất**: Chặn hoàn toàn việc xóa danh mục nếu danh mục đó đang chứa ít nhất 1 sản phẩm.
- [ ] **Đơn hàng & Tồn kho**:
  - Khi đơn hàng được duyệt (`CONFIRMED`), bắt buộc phải có `staff_id` phụ trách.
  - Khi đơn bị hủy (`CANCELLED`), hệ thống tự động hoàn lại số lượng tồn kho và hoàn lại lượt dùng voucher.
  - Đơn ở trạng thái `COMPLETED` hoặc `CANCELLED` là bất biến.
- [ ] **Khuyến mãi & Voucher**:
  - Voucher chỉ có thể áp dụng khi nằm trong khoảng thời gian hiệu lực (`start_date <= now <= end_date`).
  - Khi số lượt dùng đạt giới hạn (`used_quantity >= quantity`), hệ thống từ chối áp dụng và thông báo rõ ràng cho thu ngân.
  - Mức giảm giá của voucher không được vượt quá số tiền trần `maximum_discount`.

---

## 3. BẢNG KỊCH BẢN KIỂM THỬ GÓC THEN CHỐT (CORNER TEST CASES)

| ID | Module liên quan | Kịch bản kiểm thử (Test Scenario) | Kết quả kỳ vọng (Expected Output) |
| :---: | :--- | :--- | :--- |
| **TC01** | Module 01 (Users) | Admin thử vô hiệu hóa chính tài khoản của mình | Trả về lỗi `400 Bad Request` với thông báo: "Không được phép tự vô hiệu hóa tài khoản của chính mình!" |
| **TC02** | Module 04 (Categories) | Xóa danh mục "Sofa" đang có 12 sản phẩm trong kho | Hệ thống chặn thao tác, thông báo lỗi: "Không thể xóa danh mục đang có 12 sản phẩm!" |
| **TC03** | Module 05 (Products) | Tải lên 5 ảnh cho sản phẩm và đặt ảnh số 3 làm ảnh chính | Bảng `product_images` cập nhật ảnh 3 có `is_primary = true`, 4 ảnh còn lại là `false`; trường `products.image_url` cập nhật URL ảnh 3. |
| **TC04** | Module 07 (Vouchers) | Áp dụng mã Voucher đã đạt số lượng tối đa (`used_quantity = quantity`) | Báo lỗi nghiệp vụ: "Mã voucher đã hết lượt sử dụng!" |
| **TC05** | Module 07 (Vouchers) | Đơn hàng 5.000.000đ dùng voucher có điều kiện tối thiểu 10.000.000đ | Báo lỗi: "Giá trị đơn hàng chưa đạt mức tối thiểu 10.000.000 VNĐ để dùng voucher!" |
| **TC06** | Module 08 (Orders) | Khách đặt 2 bộ bàn ghế (Kho còn 10 bộ). Nhân viên hủy đơn hàng sau đó. | Sau khi đặt, kho còn 8 bộ. Sau khi hủy đơn, kho tự động hoàn lại đủ 10 bộ. |
| **TC07** | Module 09 (Invoices) | Xuất hóa đơn cho đơn hàng #100 lần thứ hai | Hệ thống từ chối với lỗi: "Đơn hàng này đã được xuất hóa đơn trước đó!" |
| **TC08** | Module 09 (Invoices) | Tính chiết khấu hóa đơn có mức giảm vượt trần `maximum_discount` (VD: Giảm 20% đơn 50tr = 10tr, nhưng trần là 3tr) | Số tiền giảm thực tế được áp đúng bằng 3.000.000 VNĐ. |

---

[⬅️ Quay lại Trang Mục Lục](README.md)
