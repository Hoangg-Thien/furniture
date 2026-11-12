package furniture.service;

import java.math.BigDecimal;
import java.time.Year;
import java.time.ZoneId;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import furniture.model.CreateOrderRequest;
import furniture.model.OrderItemDto;
import furniture.model.OrderResponse;
import furniture.model.OrderQuote;
import furniture.model.ValidateVoucherRequest;
import furniture.util.PasswordUtil;
import furniture.repository.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    private final VoucherService vouchers;
    private final SecureRandom random = new SecureRandom();

    public OrderService(OrderRepository orderRepository, VoucherService vouchers) {
        this.orderRepository = orderRepository;
        this.vouchers = vouchers;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất 1 sản phẩm.");
        }
        String fullName = requiredText(req.fullName(), 150, "họ tên");
        String phone = requiredText(req.phone(), 20, "số điện thoại").replaceAll("\\s+", "");
        if (!phone.matches("(0|\\+84)\\d{8,10}")) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ.");
        }
        String address = requiredText(req.address(), 500, "địa chỉ");
        String district = requiredText(req.district(), 150, "quận/huyện");
        String city = requiredText(req.city(), 150, "tỉnh/thành phố");
        String ward = req.ward() == null ? "" : req.ward().trim();
        if (ward.length() > 150) throw new IllegalArgumentException("Phường/xã quá dài.");
        String fullAddress = address + (ward.isEmpty() ? "" : ", " + ward) + ", " + district + ", " + city;

        boolean guest = req.customerId() == null && req.userId() == null;
        Long customerId = req.customerId();
        if (!guest && (customerId == null || customerId <= 0)) {
            customerId = orderRepository.findCustomerIdByUserId(req.userId());
        }
        if (!guest && (customerId == null || customerId <= 0)) {
            throw new IllegalArgumentException("Không xác định được khách hàng. Vui lòng đăng nhập lại.");
        }
        validateItems(req.items());
        List<OrderItemDto> pricedItems = new ArrayList<>();
        // Khóa cùng thứ tự; đọc giá sau khi trừ kho để giá không đổi giữa lúc tính và lưu.
        for (OrderItemDto item : req.items().stream().sorted(Comparator.comparing(OrderItemDto::productId)).toList()) {
            if (!orderRepository.deductProductStock(item.productId(), item.quantity())) {
                throw new IllegalArgumentException("Sản phẩm #" + item.productId() + " không đủ tồn kho hoặc đã ngừng bán. Vui lòng cập nhật giỏ hàng.");
            }
            BigDecimal price = orderRepository.findProductPrice(item.productId());
            pricedItems.add(new OrderItemDto(item.productId(), item.quantity(), price));
        }
        OrderQuote quote = calculateQuote(pricedItems, req.voucherId());
        BigDecimal subtotal = quote.subtotal();
        BigDecimal discount = quote.discountAmount();
        BigDecimal shippingFee = quote.shippingFee();
        BigDecimal finalTotal = quote.totalAmount();
        if (quote.voucherId() != null) orderRepository.incrementVoucherUsedQuantity(quote.voucherId());
        if (guest) {
            customerId = orderRepository.insertGuestCustomer(fullName, phone, fullAddress);
        }
        Long orderId = orderRepository.insertOrder(customerId, finalTotal, quote.voucherId(), discount, fullAddress, fullName, phone, quote.discountLabel());
        if (orderId == null) throw new IllegalStateException("Không thể tạo mã đơn hàng trong database.");
        String guestToken = null;
        if (guest) {
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            guestToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            orderRepository.saveGuestToken(orderId, PasswordUtil.hash(guestToken));
        }
        for (OrderItemDto item : pricedItems) {
            orderRepository.insertOrderItem(orderId, item.productId(), item.quantity(), item.unitPrice(),
                    item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }
        String orderCode = "FUNI-" + Year.now(ZoneId.of("Asia/Ho_Chi_Minh")).getValue() + "-" + String.format("%06d", orderId);
        return new OrderResponse(orderId, orderCode, "PENDING", finalTotal,
                "Đặt hàng thành công và đã lưu vào cơ sở dữ liệu!", guestToken, subtotal, discount, shippingFee, pricedItems, quote.voucherId(), quote.voucherCode(), quote.discountLabel());
    }

    public OrderQuote previewOrder(CreateOrderRequest req) {
        validateItems(req == null ? null : req.items());
        List<OrderItemDto> items = new ArrayList<>();
        for (var item : req.items()) {
            items.add(new OrderItemDto(item.productId(), item.quantity(),
                    orderRepository.findAvailableProductPrice(item.productId(), item.quantity())));
        }
        return calculateQuote(items, req.voucherId());
    }

    private OrderQuote calculateQuote(List<OrderItemDto> items, Long requestedVoucherId) {
        BigDecimal subtotal = items.stream().map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (subtotal.compareTo(new BigDecimal("9999999999999.99")) > 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng vượt quá giới hạn cho phép.");
        }
        Long voucherId = null;
        String voucherCode = null;
        String discountLabel = null;
        BigDecimal discount = BigDecimal.ZERO;
        if (requestedVoucherId != null) {
            try {
                var voucher = vouchers.validateVoucher(new ValidateVoucherRequest(orderRepository.findVoucherCode(requestedVoucherId), subtotal));
                discount = ((BigDecimal) voucher.get("discountAmount")).min(subtotal);
                voucherId = requestedVoucherId;
                voucherCode = (String) voucher.get("code");
                discountLabel = "Voucher " + voucherCode;
            } catch (IllegalStateException ex) {
                throw new IllegalArgumentException(ex.getMessage());
            }
        }
        BigDecimal shippingFee = subtotal.compareTo(new BigDecimal("2000000")) >= 0 ? BigDecimal.ZERO : new BigDecimal("35000");
        var promotions = orderRepository.findBestPromotion(items, subtotal);
        if (!promotions.isEmpty()) {
            var promotion = promotions.get(0);
            BigDecimal automaticDiscount = ((BigDecimal) promotion.get("discount_amount")).min(subtotal);
            if (automaticDiscount.signum() > 0 && automaticDiscount.compareTo(discount) >= 0) {
                discount = automaticDiscount;
                discountLabel = (String) promotion.get("discount_label");
                voucherId = null;
                voucherCode = null;
            }
        }
        BigDecimal finalTotal = subtotal.subtract(discount).add(shippingFee);
        if (finalTotal.compareTo(new BigDecimal("9999999999999.99")) > 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng vượt quá giới hạn cho phép.");
        }
        return new OrderQuote(items, subtotal, discount, shippingFee, finalTotal, voucherId, voucherCode, discountLabel);
    }

    private static void validateItems(List<OrderItemDto> items) {
        if (items == null || items.isEmpty() || items.size() > 100) {
            throw new IllegalArgumentException("Đơn hàng phải có từ 1 đến 100 sản phẩm.");
        }
        var productIds = new HashSet<Long>();
        for (OrderItemDto item : items) {
            if (item == null || item.productId() == null || item.productId() <= 0
                    || item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Sản phẩm và số lượng đặt hàng không hợp lệ.");
            }
            if (!productIds.add(item.productId())) {
                throw new IllegalArgumentException("Mỗi sản phẩm chỉ được xuất hiện một lần trong đơn hàng.");
            }
        }
    }

    private static String requiredText(String value, int maxLength, String label) {
        if (value == null || value.isBlank() || value.trim().length() > maxLength) {
            throw new IllegalArgumentException("Vui lòng nhập " + label + " hợp lệ (tối đa " + maxLength + " ký tự).");
        }
        return value.trim();
    }

    public List<Map<String, Object>> getOrders(Long customerId) {
        if (customerId == null || customerId <= 0) {
            throw new IllegalArgumentException("Vui lòng cung cấp khách hàng để xem đơn hàng.");
        }
        List<Map<String, Object>> orders = orderRepository.findOrders(customerId);
        if (orders.isEmpty()) {
            return orders;
        }

        List<Long> orderIds = orders.stream()
                .map(o -> ((Number) o.get("id")).longValue())
                .toList();

        List<Map<String, Object>> allItems = orderRepository.findOrderItemsByOrderIds(orderIds);
        Map<Long, List<Map<String, Object>>> itemsByOrderId = new HashMap<>();
        for (Map<String, Object> it : allItems) {
            Long oid = ((Number) it.get("order_id")).longValue();
            itemsByOrderId.computeIfAbsent(oid, k -> new java.util.ArrayList<>()).add(it);
        }

        for (Map<String, Object> order : orders) {
            Long orderId = ((Number) order.get("id")).longValue();
            String orderCode = orderCode(order, orderId);
            order.put("orderCode", orderCode);
            order.put("items", itemsByOrderId.getOrDefault(orderId, Collections.emptyList()));
        }

        return orders;
    }

    public Map<String, Object> getOrderById(Long id) {
        List<Map<String, Object>> orders = orderRepository.findOrderById(id);
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng #" + id);
        }

        Map<String, Object> order = orders.get(0);
        String orderCode = orderCode(order, id);
        order.put("orderCode", orderCode);

        List<Map<String, Object>> items = orderRepository.findOrderItemsByOrderId(id);
        return Map.of("order", order, "items", items);
    }

    @Transactional
    public boolean cancelOrder(Long id) {
        int updated = orderRepository.cancelOrder(id);
        if (updated > 0) {
            orderRepository.restoreOrderStock(id);
            orderRepository.restoreOrderVoucher(id);
        }
        return updated > 0;
    }

    private static String orderCode(Map<String, Object> order, Long id) {
        String date = String.valueOf(order.get("order_date"));
        String year = date.matches("\\d{4}-.*") ? date.substring(0, 4) : "UNKNOWN";
        return "FUNI-" + year + "-" + String.format("%06d", id);
    }

}
