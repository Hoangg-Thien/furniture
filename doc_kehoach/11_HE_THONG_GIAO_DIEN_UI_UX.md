# TÀI LIỆU 11: HỆ THỐNG GIAO DIỆN UI/UX ADMIN
## DESIGN SYSTEM, BỐ CỤC CHUNG & CÁC THÀNH PHẦN TÁI SỬ DỤNG

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Lộ trình & Kiểm thử ➡️](12_LO_TRINH_VA_KIEM_THU.md)

---

## 1. TRIẾT LÝ THIẾT KẾ & BẢNG MÀU CHỦ ĐẠO (DESIGN SYSTEM)

Giao diện Quản trị viên lấy cảm hứng từ sự sang trọng, tinh tế của ngành **Kiến trúc & Nội thất cao cấp (Modern Interior Architecture)**:
- **Phong cách**: Tối giản (Minimalist), khoảng cách thông thoáng, đường nét dứt khoát kết hợp hiệu ứng đổ bóng mờ (Soft Drop Shadow) và bo góc mềm mại (`border-radius: 8px - 12px`).
- **Phông chữ chuẩn**: Phông sans-serif hiện đại từ Google Fonts (`Inter` hoặc `Plus Jakarta Sans`) cho độ hiển thị rõ nét trên mọi độ phân giải.

### Bảng mã màu chủ đạo (Color Tokens)

| Token | Tên màu | Mã Hex | Ứng dụng trong giao diện |
| :--- | :--- | :--- | :--- |
| `--primary` | Walnut Wood (Nâu gỗ sẫm) | `#2A1E17` | Màu nền Sidebar, tiêu đề chính, các nút hành động cốt lõi |
| `--accent` | Warm Amber (Vàng hổ phách) | `#D97706` | Điểm nhấn thương hiệu, Icon nổi bật, Badge hạng khách VIP |
| `--surface` | Slate Neutral | `#F8FAFC` | Nền trang tổng quan, vùng làm việc chính |
| `--card-bg` | Pure White | `#FFFFFF` | Nền thẻ thống kê, nền bảng dữ liệu, nền Modal |
| `--success` | Emerald Green | `#10B981` | Trạng thái COMPLETED, Đã thanh toán, Tăng trưởng dương |
| `--warning` | Amber Sun | `#F59E0B` | Trạng thái PENDING, Cảnh báo sắp hết hàng tồn kho |
| `--danger` | Ruby Red | `#EF4444` | Trạng thái CANCELLED, Nút xóa, Khóa tài khoản |
| `--border` | Subtle Gray | `#E2E8F0` | Đường phân cách bảng, viền ô nhập liệu Input |

---

## 2. BỐ CỤC KHUNG GIAO DIỆN (APP LAYOUT SHELL)

Giao diện áp dụng kiến trúc khung cố định (Sticky Shell Layout) gồm 3 phần chính:

```
+--------------------------------------------------------------------------------------------------+
|  FURNITURE ADMIN  |  [🔍 Tìm kiếm nhanh mã đơn, khách, sản phẩm...]      | 🔔 (3) | 👤 Admin (v) |
+-------------------+------------------------------------------------------+--------+--------------+
| [SIDEBAR MENU]    | BREADCRUMB: Trang chủ > Đơn hàng > Chi tiết đơn #101                        |
|                   +------------------------------------------------------------------------------+
| 📊 Tổng quan      |                                                                              |
| 👥 Người dùng v   |                                                                              |
|  - Tài khoản & PQ |                               [VÙNG NỘI DUNG CHÍNH]                          |
|  - Khách hàng     |                                (MAIN CONTENT AREA)                           |
|  - Nhân viên      |                                                                              |
| 🛋️ Hàng hóa v     |                                                                              |
|  - Loại nội thất  |                                                                              |
|  - Sản phẩm & Ảnh |                                                                              |
| 🏭 Nhà cung cấp   |                                                                              |
| 🎟️ Khuyến mãi     |                                                                              |
| 📦 Đơn đặt hàng   |                                                                              |
| 🧾 Hóa đơn        |                                                                              |
| 📈 Thống kê       |                                                                              |
|                   +------------------------------------------------------------------------------+
| ⚙️ Cài đặt chung  | FOOTER: Hệ thống Quản trị Cửa hàng Nội thất - Phiên bản 2.0                 |
+-------------------+------------------------------------------------------------------------------+
```

### 2.1. Cấu trúc Cây Menu Sidebar Navigation
- **Nhóm 1: Bảng điều khiển**
  - `Tổng quan Dashboard` (`/admin/dashboard`)
- **Nhóm 2: Quản lý Nhân sự & Khách hàng**
  - `Tài khoản & Phân quyền` (`/admin/users`)
  - `Khách hàng (CRM)` (`/admin/customers`)
  - `Đội ngũ Nhân viên` (`/admin/staff`)
- **Nhóm 3: Kho hàng & Cung ứng**
  - `Loại nội thất` (`/admin/categories`)
  - `Sản phẩm & Album ảnh` (`/admin/products`)
  - `Nhà cung cấp & Nhập kho` (`/admin/suppliers`)
- **Nhóm 4: Bán hàng & Doanh thu**
  - `Chương trình Khuyến mãi` (`/admin/promotions`)
  - `Đơn đặt hàng` (`/admin/orders`)
  - `Hóa đơn bán hàng` (`/admin/invoices`)
  - `Thống kê & Báo cáo` (`/admin/reports`)

---

## 3. CÁC THÀNH PHẦN GIAO DIỆN DÙNG CHUNG (REUSABLE COMPONENTS)

### 3.1. Thành phần Bảng Dữ liệu Đa năng (DataTable Component)
- **Tính năng tích hợp**:
  - Tự động sắp xếp tăng/giảm theo cột (Sorting khi click vào Header).
  - Phân trang (Pagination) mượt mà không load lại trang (Trang 1, 2, 3... kèm tùy chọn 10, 25, 50 dòng/trang).
  - Checkbox chọn nhiều dòng để thực hiện hành động hàng loạt (Bulk Actions: Ẩn nhiều sản phẩm, Xuất Excel).
  - Trạng thái trống (Empty State) với minh họa đồ nội thất khi không tìm thấy kết quả.

### 3.2. Huy hiệu Trạng thái (Status Badges)
Các nhãn màu giúp người vận hành nhận biết nhanh trạng thái chứng từ:
- `PENDING`: Nền vàng nhạt `#FEF3C7`, chữ vàng đậm `#92400E` kèm chấm nhấp nháy.
- `CONFIRMED`: Nền lam nhạt `#DBEAFE`, chữ lam đậm `#1E40AF`.
- `COMPLETED` / `PAID`: Nền lục nhạt `#D1FAE5`, chữ lục đậm `#065F46`.
- `CANCELLED`: Nền xám/đỏ nhạt `#FEE2E2`, chữ đỏ đậm `#991B1B`.

### 3.3. Hộp thoại Xác nhận Nguy hiểm (Confirm Dialog)
- Được kích hoạt trước các hành động không thể hoàn tác:
  - Khóa tài khoản nhân viên.
  - Hủy đơn đặt hàng của khách.
  - Xóa ảnh khỏi album sản phẩm.
- Bắt buộc hiển thị rõ nội dung cảnh báo và nút xác nhận màu đỏ để chống click nhầm.

### 3.4. Hệ thống Thông báo Tức thì (Toast Notifications)
- Nằm cố định ở góc trên bên phải màn hình (`Top-Right`).
- Tự động biến mất sau 3.5 giây:
  - ✅ **Thành công**: "Đã lưu thông tin sản phẩm và tải 4 hình ảnh thành công."
  - ❌ **Lỗi**: "Không thể xóa danh mục đang có sản phẩm liên kết!"
  - ⚠️ **Cảnh báo**: "Mã voucher này chỉ còn 2 lượt sử dụng."

---

## 4. TƯƠNG THÍCH MÀN HÌNH (RESPONSIVE BREAKPOINTS)

Hệ thống được tối ưu hóa cho 3 nhóm màn hình sử dụng thực tế:
1. **Desktop lớn (1920x1080 / 1440x900)**: Màn hình làm việc chính của Ban Quản trị tại văn phòng, hiển thị đầy đủ biểu đồ song song và bảng dữ liệu rộng.
2. **Laptop văn phòng (1366x768)**: Bố cục tự co giãn, bảng dữ liệu hỗ trợ thanh cuộn ngang mượt mà.
3. **Máy tính bảng iPad / Tablet (1024x768 / 768x1024)**: Phục vụ nhân viên bán hàng tại Showroom cầm trực tiếp để tra cứu tồn kho, tư vấn phối cảnh cho khách và tạo hóa đơn tại chỗ. Menu Sidebar tự động thu gọn thành nút Hamburger menu.

---

[⬅️ Quay lại Trang Mục Lục](README.md) | [Tiếp theo: Lộ trình & Kiểm thử ➡️](12_LO_TRINH_VA_KIEM_THU.md)
