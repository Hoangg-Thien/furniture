# Đối chiếu đơn hàng và hóa đơn

Đã lập đủ 5 hóa đơn còn thiếu sau khi người dùng xác nhận thu đủ tiền mặt/COD. API xem trước và dữ liệu sau khi lưu đều khớp tổng tiền đơn hàng.

| Đơn | Khách hàng | Số tiền đã ghi nhận thanh toán | Voucher đã áp dụng |
|---|---|---:|---|
| #49 | Luu Gia Huy | 16.600.000đ | Không |
| #50 | Nguyễn Duy Khôi | 14.000.000đ | FUNI500K |
| #51 | Nguyễn Duy Khôi | 14.000.000đ | FUNI500K |
| #52 | Nguyễn Duy Khôi | 9.800.000đ | Không |
| #53 | Nguyễn Duy Khôi | 14.500.000đ | Không |

Đã tạo HD-49, HD-50, HD-51, HD-52 và HD-53, tổng **68.900.000đ**. Mỗi đơn có đúng một hóa đơn PAID/CASH; không thêm VAT, không áp dụng giảm giá lần hai.

Hiện có 6 đơn giao thành công và 6 hóa đơn, không còn đơn hoàn tất thiếu hóa đơn. Tổng hóa đơn PAID: **80.402.000đ**, bao gồm hóa đơn chuyển khoản cũ của đơn #48.

Đã kiểm tra quy trình trên database QA riêng: duyệt → vận chuyển → xác nhận giao thành công và thu đủ COD → hóa đơn. Lỗi lưu hóa đơn sẽ rollback trạng thái hoàn tất; không tạo trùng; giữ nguyên giảm giá kể cả voucher đã hết hạn. Kiểm tra giao diện thật xác nhận đủ 6 hóa đơn đúng khách hàng, phân trang 5/10 hoạt động; frontend build thành công.

Đơn #48: 10.650.000đ; hóa đơn chuyển khoản HD-20261027-100: 11.502.000đ; lệch 852.000đ do VAT trên hóa đơn cũ. Giữ nguyên chứng từ gốc; xác nhận thu đủ của người dùng chỉ áp dụng #49–#53, chưa có căn cứ điều chỉnh khoản chuyển khoản #48.

Chi tiết trước/sau: [invoice-recovery.json](invoice-recovery.json).
