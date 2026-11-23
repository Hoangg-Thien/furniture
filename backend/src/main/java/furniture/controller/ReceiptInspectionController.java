package furniture.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import furniture.model.admin.AdminIdentity;
import furniture.service.ReceiptInspectionService;

@RestController
@RequestMapping("/api/admin/suppliers")
@CrossOrigin(origins = "*")
public class ReceiptInspectionController {
    private final ReceiptInspectionService service;
    public ReceiptInspectionController(ReceiptInspectionService service) { this.service = service; }
    public record Counts(Map<Long, Integer> counts) {}
    public record Review(Boolean approve, String reason) {}
    @GetMapping("/receipt-approvals")
    public Object queue(@RequestAttribute(AdminIdentity.ATTRIBUTE) AdminIdentity actor) { return service.queue(actor); }
    @GetMapping("/{supplierId}/receipts/{id}/inspection")
    public Object detail(@PathVariable Long supplierId, @PathVariable Long id) { return service.detail(supplierId, id); }
    @PostMapping("/{supplierId}/receipts/{id}/inspection")
    public Object submit(@PathVariable Long supplierId, @PathVariable Long id, @RequestBody Counts body, @RequestAttribute(AdminIdentity.ATTRIBUTE) AdminIdentity actor) {
        service.submit(supplierId, id, body.counts(), actor); return Map.of("message", "Đã gửi admin duyệt. Tồn kho chưa thay đổi.");
    }
    @PostMapping("/{supplierId}/receipts/{id}/review")
    public Object review(@PathVariable Long supplierId, @PathVariable Long id, @RequestBody Review body, @RequestAttribute(AdminIdentity.ATTRIBUTE) AdminIdentity actor) {
        if (body.approve() == null) throw new IllegalArgumentException("Vui lòng chọn quyết định duyệt.");
        service.review(supplierId, id, body.approve(), body.reason(), actor); return Map.of("message", "Đã xử lý phiếu nhập.");
    }
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
    public Object invalid(IllegalArgumentException error) { return Map.of("error", error.getMessage()); }
}
