ALTER TABLE public.customers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_token_hash VARCHAR(64);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_label VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_guest_token_hash ON public.orders (guest_token_hash);
