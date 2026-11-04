package furniture.model.admin.order;

public record OrderStatusCountDto(
        long total,
        long pending,
        long confirmed,
        long shipping,
        long completed,
        long cancelled
) {}
