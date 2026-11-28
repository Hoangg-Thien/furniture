CREATE TABLE IF NOT EXISTS public.order_checkout_attempts (
    key_hash VARCHAR(64) PRIMARY KEY,
    request_hash VARCHAR(64) NOT NULL,
    response TEXT
);
ALTER TABLE public.order_checkout_attempts ENABLE ROW LEVEL SECURITY;
