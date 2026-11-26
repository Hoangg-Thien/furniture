ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS voucher_type VARCHAR(16) NOT NULL DEFAULT 'ORDER'
    CHECK (voucher_type IN ('ORDER', 'PRODUCT', 'VIP'));
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES public.products(id);

ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS customer_tier VARCHAR(16) NOT NULL DEFAULT 'VIP_DIAMOND';
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_customer_tier_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_customer_tier_check
    CHECK (customer_tier IN ('NEW', 'SILVER', 'GOLD', 'PLATINUM', 'VIP_DIAMOND'));
