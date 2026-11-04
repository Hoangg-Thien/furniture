ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ck_orders_status;
ALTER TABLE public.orders ADD CONSTRAINT ck_orders_status
    CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'));
