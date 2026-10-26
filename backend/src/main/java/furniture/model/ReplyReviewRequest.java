package furniture.model;

/**
 * =====================================================================
 * Request Model: ReplyReviewRequest
 * Mục đích: Nhận phản hồi CSKH gửi tới đánh giá của khách hàng.
 * Sử dụng trong: POST /api/admin/reviews/{id}/reply
 * =====================================================================
 */
public class ReplyReviewRequest {

    /** Tên người phản hồi (mặc định: 'FurniStore Chăm Sóc Khách Hàng') */
    private String author;

    /** Nội dung phản hồi chính thức của cửa hàng */
    private String content;

    public ReplyReviewRequest() {}

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
