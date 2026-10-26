package furniture.model;

import java.math.BigDecimal;

/**
 * =====================================================================
 * DTO: AdminOrderItemDto
 * Mục đích: Đại diện cho từng sản phẩm (dòng hàng) nằm trong đơn hàng nội thất.
 * Sử dụng trong: Quản lý chi tiết Đơn hàng & Mẫu in Hóa đơn A4.
 * =====================================================================
 */
public class AdminOrderItemDto {

    /** Mã định danh sản phẩm trong bảng products */
    private Long productId;

    /** Tên thương mại của sản phẩm nội thất (Ví dụ: Sofa góc chữ L vải bọc Milan) */
    private String productName;

    /** Tên danh mục nội thất (Sofa, Bàn ăn, Giường ngủ...) */
    private String categoryName;

    /** Đơn vị tính (bộ, cái, tấm...) */
    private String unit;

    /** Đường dẫn ảnh minh họa của sản phẩm */
    private String imageUrl;

    /** Số lượng đặt mua */
    private Integer quantity;

    /** Đơn giá tại thời điểm đặt hàng */
    private BigDecimal unitPrice;

    /** Thành tiền = quantity * unitPrice */
    private BigDecimal amount;

    public AdminOrderItemDto() {}

    public AdminOrderItemDto(Long productId, String productName, String categoryName, String unit,
                             String imageUrl, Integer quantity, BigDecimal unitPrice, BigDecimal amount) {
        this.productId = productId;
        this.productName = productName;
        this.categoryName = categoryName;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.amount = amount;
    }

    // Getters and Setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
