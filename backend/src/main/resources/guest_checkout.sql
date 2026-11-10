ALTER TABLE public.customers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_token_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_guest_token_hash ON public.orders (guest_token_hash);
