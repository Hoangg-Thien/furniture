package furniture.model.admin.order;

public record OrderStatusCountDto(
        long total,
        long pending,
        long confirmed,
        long completed,
        long cancelled
) {}
