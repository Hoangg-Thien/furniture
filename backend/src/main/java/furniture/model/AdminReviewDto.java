package furniture.model;

import java.util.Map;

/**
 * =====================================================================
 * DTO: AdminReviewDto
 * Mục đích: Đại diện cho đánh giá sản phẩm nội thất từ người mua và phản hồi CSKH.
 * Sử dụng trong: Màn hình "Đánh Giá Sản Phẩm" (/admin/reviews)
 * =====================================================================
 */
public class AdminReviewDto {

    /** Khóa chính đánh giá trong DB */
    private Long id;

    /** ID sản phẩm được đánh giá */
    private Long productId;

    /** Tên sản phẩm nội thất */
    private String productName;

    /** Hình ảnh minh họa sản phẩm */
    private String productImage;

    /** ID khách hàng */
    private Long customerId;

    /** Họ tên khách hàng gửi đánh giá */
    private String customerName;

    /** Số điện thoại (nếu có) */
    private String customerPhone;

    /** Số sao đánh giá từ 1 đến 5 sao */
    private Integer rating;

    /** Nội dung nhận xét chi tiết của khách hàng */
    private String comment;

    /** Ngày gửi đánh giá (YYYY-MM-DD) */
    private String date;

    /** Trạng thái kiểm duyệt: 'APPROVED' (Được hiển thị trên sàn), 'HIDDEN' (Đang ẩn) */
    private String status;

    /** Phản hồi chính thức từ cửa hàng CSKH FurniStore */
    private Map<String, String> storeReply;

    public AdminReviewDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, String> getStoreReply() { return storeReply; }
    public void setStoreReply(Map<String, String> storeReply) { this.storeReply = storeReply; }
}
