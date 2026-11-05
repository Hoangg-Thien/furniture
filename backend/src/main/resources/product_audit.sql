CREATE TABLE IF NOT EXISTS public.product_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    actor_user_id BIGINT NOT NULL REFERENCES public.users(id),
    field_name VARCHAR(80) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_audit_product_id ON public.product_audit_logs(product_id, id DESC);

ALTER TABLE public.product_audit_logs ENABLE ROW LEVEL SECURITY;
