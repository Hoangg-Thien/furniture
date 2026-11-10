package furniture.controller;

import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import furniture.model.admin.AdminActivityDto;
import furniture.repository.AdminActivityRepository;

@RestController
@RequestMapping("/api/admin/notifications")
@CrossOrigin(origins = "*")
public class AdminNotificationController {
    private final AdminActivityRepository activities;

    public AdminNotificationController(AdminActivityRepository activities) { this.activities = activities; }

    @GetMapping("/activities")
    public List<AdminActivityDto> activities() { return activities.findRecent(); }
}
