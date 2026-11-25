package furniture.model;

import java.math.BigDecimal;

public record CustomerTierProgress(String tier, BigDecimal totalSpent, long completedOrders,
                                   String nextTier, BigDecimal nextThreshold) {}
