package furniture.model;

import java.math.BigDecimal;
import java.util.Arrays;

public enum CustomerTier {
    NEW(0),
    SILVER(10_000_000),
    GOLD(50_000_000),
    PLATINUM(100_000_000),
    VIP_DIAMOND(300_000_000);

    private static final CustomerTier[] TIERS = values();
    private final BigDecimal minimumSpend;

    CustomerTier(long minimumSpend) {
        this.minimumSpend = BigDecimal.valueOf(minimumSpend);
    }

    public BigDecimal minimumSpend() {
        return minimumSpend;
    }

    public CustomerTier next() {
        return this == VIP_DIAMOND ? null : TIERS[ordinal() + 1];
    }

    public static CustomerTier forSpend(BigDecimal totalSpent) {
        if (totalSpent != null) {
            for (int i = TIERS.length - 1; i > 0; i--) {
                if (totalSpent.compareTo(TIERS[i].minimumSpend) >= 0) return TIERS[i];
            }
        }
        return NEW;
    }

    public static boolean isVoucherTier(String code) {
        return Arrays.stream(TIERS).anyMatch(tier -> tier != NEW && tier.name().equals(code));
    }
}
