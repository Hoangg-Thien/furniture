package furniture.model.admin;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public PageResponse(List<T> content, int page, int size, long totalElements, int totalPages) {
        this(content, page, size, totalElements, totalPages, page == 0, page >= totalPages - 1);
    }
}
