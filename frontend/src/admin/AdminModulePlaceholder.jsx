import { Download, Filter, Plus, Search } from 'lucide-react'

// Metadata và dữ liệu demo chuẩn bị sẵn cho từng module từ 01 đến 10
const MODULE_CONFIGS = {
  users: {
    title: 'Quản Lý Tài Khoản & Phân Quyền',
    doc: '01_QUAN_LY_TAI_KHOAN_ROLE.md',
    addText: 'Tạo tài khoản mới',
    columns: ['ID', 'Tên đăng nhập', 'Vai trò (Role)', 'Trạng thái', 'Ngày tạo', 'Thao tác'],
    rows: [
      ['01', 'admin01', 'ADMIN', 'Hoạt động', '2026-10-01', 'active'],
      ['02', 'staff_thuha', 'STAFF', 'Hoạt động', '2026-10-15', 'active'],
      ['03', 'staff_minhduc', 'STAFF', 'Đang khóa', '2026-10-20', 'inactive'],
      ['04', 'customer_lan', 'CUSTOMER', 'Hoạt động', '2026-10-22', 'active']
    ]
  },
  customers: {
    title: 'Quản Lý Khách Hàng (CRM)',
    doc: '02_QUAN_LY_KHACH_HANG.md',
    addText: 'Thêm khách hàng',
    columns: ['Mã KH', 'Họ và tên', 'Số điện thoại', 'Email', 'Tổng đơn', 'Tổng chi tiêu', 'Thao tác'],
    rows: [
      ['C01', 'Nguyễn Văn An', '0901 234 567', 'an.nv@gmail.com', '4 đơn', '68.500.000 ₫', 'VIP Diamond'],
      ['C02', 'Trần Thị Mai', '0912 888 999', 'mai.tran@abc.vn', '2 đơn', '24.200.000 ₫', 'Thân thiết'],
      ['C03', 'Lê Hoàng Long', '0988 111 222', 'long.le@corp.com', '1 đơn', '18.200.000 ₫', 'Mới']
    ]
  },
  staff: {
    title: 'Quản Lý Đội Ngũ Nhân Viên',
    doc: '03_QUAN_LY_NHAN_VIEN.md',
    addText: 'Thêm nhân viên mới',
    columns: ['Mã NV', 'Họ và tên', 'Số điện thoại', 'Email công vụ', 'Đơn xử lý', 'Phiếu nhập', 'Thao tác'],
    rows: [
      ['S01', 'Lê Thị Thu Hà', '0905 111 222', 'ha.lt@noithat.vn', '45 đơn', '2 phiếu', 'active'],
      ['S02', 'Hoàng Minh Đức', '0933 444 555', 'duc.hm@noithat.vn', '28 đơn', '14 phiếu', 'active'],
      ['S03', 'Vũ Quang Huy', '0977 888 999', 'huy.vq@noithat.vn', '12 đơn', '0 phiếu', 'active']
    ]
  },
  categories: {
    title: 'Quản Lý Loại Nội Thất',
    doc: '04_QUAN_LY_LOAI_NOI_THAT.md',
    addText: 'Thêm loại nội thất',
    columns: ['ID', 'Tên loại nội thất', 'Mô tả không gian sử dụng', 'Số lượng sản phẩm', 'Thao tác'],
    rows: [
      ['C01', 'Sofa & Ghế Thư Giãn', 'Sofa góc chữ L, sofa văng da và nỉ cao cấp', '24 sản phẩm'],
      ['C02', 'Bàn Ghế Phòng Ăn', 'Bộ bàn ghế ăn gỗ sồi, mặt đá ceramic', '18 sản phẩm'],
      ['C03', 'Giường Ngủ Hiện Đại', 'Giường ngủ gỗ tự nhiên bọc nỉ cao cấp', '15 sản phẩm'],
      ['C04', 'Kệ Tủ & Trang Trí', 'Kệ tivi, tủ giày thông minh, vách ngăn', '12 sản phẩm']
    ]
  },
  products: {
    title: 'Quản Lý Sản Phẩm & Album Ảnh',
    doc: '05_QUAN_LY_SAN_PHAM_HINH_ANH.md',
    addText: 'Thêm sản phẩm mới',
    columns: ['ID', 'Tên sản phẩm nội thất', 'Danh mục', 'ĐVT', 'Giá bán niêm yết', 'Kho tồn', 'Thao tác'],
    rows: [
      ['01', 'Sofa Da Bò Ý Nhập Khẩu Góc L', 'Sofa & Ghế', 'Bộ', '24.500.000 ₫', '12 chiếc'],
      ['02', 'Bàn Ăn Gỗ Sồi Bắc Âu 6 Ghế', 'Bàn ghế ăn', 'Bộ', '14.800.000 ₫', '02 chiếc (Sắp hết)'],
      ['03', 'Giường Ngủ Bọc Nỉ Minimal King', 'Giường ngủ', 'Chiếc', '18.200.000 ₫', '08 chiếc'],
      ['04', 'Kệ Tivi Gỗ Óc Chó Tự Nhiên 2m', 'Kệ tủ', 'Chiếc', '9.500.000 ₫', '04 chiếc']
    ]
  },
  suppliers: {
    title: 'Quản Lý Nhà Cung Cấp Nội Thất',
    doc: '06_QUAN_LY_NHA_CUNG_CAP.md',
    addText: 'Thêm nhà cung cấp',
    columns: ['Mã NCC', 'Tên xưởng / Nhà cung cấp', 'Số điện thoại', 'Email liên hệ', 'Số lần nhập hàng', 'Thao tác'],
    rows: [
      ['N01', 'Xưởng Gỗ Sồi Hoàng Anh Gia Lai', '028 3822 9999', 'contact@hagl.vn', '14 lần nhập'],
      ['N02', 'Xưởng Da & Đệm Mút Tân Bình Phát', '0903 555 777', 'sales@tanbinh.com', '8 lần nhập'],
      ['N03', 'Công ty Phụ Kiện Nội Thất Hafele VN', '024 3788 1234', 'info@hafele.vn', '22 lần nhập']
    ]
  },
  promotions: {
    title: 'Chương Trình Khuyến Mãi & Voucher',
    doc: '07_QUAN_LY_KHUYEN_MAI_VOUCHER.md',
    addText: 'Tạo chiến dịch mới',
    columns: ['ID', 'Tên chương trình', 'Ngày bắt đầu', 'Ngày kết thúc', 'Cơ chế áp dụng', 'Trạng thái', 'Thao tác'],
    rows: [
      ['P01', 'Tri Ân Mùa Cưới 2026', '01/10/2026', '15/11/2026', 'Giảm SP + Mã Voucher', 'ACTIVE'],
      ['P02', 'Khai Trương Showroom Chi Nhánh Mới', '01/11/2026', '30/11/2026', 'Chiết khấu bậc đơn', 'DRAFT'],
      ['P03', 'Xả Kho Đồ Gỗ Mùa Thu', '01/09/2026', '30/09/2026', 'Giảm giá theo sản phẩm', 'INACTIVE']
    ]
  },
  orders: {
    title: 'Quản Lý Đơn Đặt Hàng (Orders)',
    doc: '08_QUAN_LY_DON_DAT_HANG.md',
    addText: 'Tạo đơn tại quầy',
    columns: ['Mã đơn', 'Khách hàng', 'SĐT', 'Ngày đặt', 'Nhân viên phụ trách', 'Tổng tiền', 'Trạng thái', 'Thao tác'],
    rows: [
      ['#101', 'Trần Văn Bình', '0988 234 567', '27/10 14:30', 'Chưa phân công', '28.500.000 ₫', 'PENDING'],
      ['#100', 'Nguyễn Thị Lan', '0912 345 678', '27/10 10:15', 'Thu Hà (S01)', '16.200.000 ₫', 'CONFIRMED'],
      ['#099', 'Lê Hoàng Nam', '0903 888 999', '26/10 16:00', 'Minh Đức (S02)', '45.000.000 ₫', 'COMPLETED']
    ]
  },
  invoices: {
    title: 'Quản Lý Hóa Đơn Bán Hàng & In Ấn',
    doc: '09_QUAN_LY_HOA_DON.md',
    addText: 'Lập hóa đơn mới',
    columns: ['Số Hóa Đơn', 'Mã Đơn', 'Khách hàng', 'Ngày xuất', 'PT Thanh toán', 'Tổng thanh toán', 'Thao tác'],
    rows: [
      ['HD-20261027-001', '#100', 'Nguyễn Thị Lan', '27/10 11:00', 'VietQR (Chuyển khoản)', '16.200.000 ₫', 'In PDF'],
      ['HD-20261026-089', '#099', 'Lê Hoàng Nam', '26/10 16:45', 'Tiền mặt tại quầy', '45.000.000 ₫', 'In PDF'],
      ['HD-20261026-088', '#098', 'Phạm Minh Tuấn', '26/10 14:10', 'Thẻ POS ngân hàng', '8.500.000 ₫', 'In PDF']
    ]
  },
  reports: {
    title: 'Thống Kê Kinh Doanh & Báo Cáo Tài Chính',
    doc: '10_THONG_KE_BAO_CAO.md',
    addText: 'Xuất báo cáo Excel',
    columns: ['Kỳ báo cáo', 'Doanh thu thuần', 'Giá vốn nhập hàng', 'Lãi gộp', 'Số đơn hoàn thành', 'Thao tác'],
    rows: [
      ['Tháng 10/2026 (Hiện tại)', '452.800.000 ₫', '294.000.000 ₫', '158.800.000 ₫', '128 đơn', 'Xuất Excel'],
      ['Tháng 09/2026', '396.500.000 ₫', '258.000.000 ₫', '138.500.000 ₫', '114 đơn', 'Xuất Excel'],
      ['Tháng 08/2026', '412.000.000 ₫', '265.000.000 ₫', '147.000.000 ₫', '120 đơn', 'Xuất Excel']
    ]
  }
}

export default function AdminModulePlaceholder({ moduleId }) {
  const config = MODULE_CONFIGS[moduleId] || {
    title: 'Module Quản Trị',
    doc: 'README.md',
    addText: 'Thêm mới',
    columns: ['ID', 'Tên', 'Mô tả', 'Thao tác'],
    rows: []
  }

  return (
    <div className="admin-module-view">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            Hệ thống quản trị &gt; <span>{config.title}</span>
          </div>
          <h1 className="admin-page-title">{config.title}</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline">
            <Download size={16} />
            <span>Xuất Excel</span>
          </button>
          <button className="admin-btn admin-btn-accent">
            <Plus size={16} />
            <span>{config.addText}</span>
          </button>
        </div>
      </div>

      {/* Reference Banner to doc_kehoach */}
      <div style={{
        background: 'linear-gradient(90deg, #FEF3C7, #FFFBEB)',
        borderLeft: '4px solid var(--admin-accent)',
        borderRadius: 'var(--admin-radius-sm)',
        padding: '12px 18px',
        marginBottom: '20px',
        fontSize: '0.86rem',
        color: '#92400E',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Tài liệu kỹ thuật MVC:</strong> Đang áp dụng thiết kế theo file <code>doc_kehoach/{config.doc}</code>
        </div>
        <span style={{ fontSize: '0.78rem', background: '#F59E0B', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
          Sẵn sàng kết nối API
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'var(--admin-bg)', 
            border: '1px solid var(--admin-border)',
            padding: '8px 14px',
            borderRadius: 'var(--admin-radius-sm)',
            flex: 1
          }}>
            <Search size={16} color="var(--admin-text-muted)" />
            <input 
              type="text" 
              placeholder="Tìm kiếm dữ liệu trong bảng..."
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem' }}
            />
          </div>

          <button className="admin-btn admin-btn-outline" style={{ padding: '8px 14px' }}>
            <Filter size={16} />
            <span>Bộ Lọc</span>
          </button>
        </div>
      </div>

      {/* DataTable */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container" style={{ border: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                {config.columns.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>
                      {cell === 'active' || cell === 'Hoạt động' || cell === 'COMPLETED' || cell === 'ACTIVE' ? (
                        <span className="admin-badge admin-badge-success">{cell}</span>
                      ) : cell === 'inactive' || cell === 'Đang khóa' || cell === 'INACTIVE' ? (
                        <span className="admin-badge admin-badge-danger">{cell}</span>
                      ) : cell === 'PENDING' || cell === 'DRAFT' ? (
                        <span className="admin-badge admin-badge-warning">{cell}</span>
                      ) : cell === 'CONFIRMED' ? (
                        <span className="admin-badge admin-badge-info">{cell}</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem', marginRight: '6px' }}>
                      Sửa
                    </button>
                    <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#EF4444' }}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
