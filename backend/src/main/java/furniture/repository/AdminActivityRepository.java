package furniture.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import furniture.model.admin.AdminActivityDto;

@Repository
public class AdminActivityRepository {
    private final JdbcTemplate jdbc;

    public AdminActivityRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void record(Long actorUserId, String module, Long recordId, String title) {
        jdbc.update("""
                INSERT INTO public.admin_activity_notifications (actor_user_id, actor_username, module, record_id, title)
                SELECT id, username, ?, ?, ? FROM public.users WHERE id = ?
                """, module, recordId, title, actorUserId);
    }

    // shortcut: preview the latest 50 activities, add pagination when a full activity inbox is needed.
    public List<AdminActivityDto> findRecent() {
        return jdbc.query("""
                SELECT id, actor_username, module, record_id, title, created_at
                FROM public.admin_activity_notifications ORDER BY id DESC LIMIT 50
                """, (rs, row) -> new AdminActivityDto(rs.getLong("id"), rs.getString("actor_username"),
                    rs.getString("module"), rs.getObject("record_id", Long.class), rs.getString("title"),
                    rs.getTimestamp("created_at").toInstant()));
    }
}
