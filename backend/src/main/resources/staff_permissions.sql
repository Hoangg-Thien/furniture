ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS staff_type VARCHAR(20) NOT NULL DEFAULT 'SALES'
    CHECK (staff_type IN ('SALES', 'WAREHOUSE', 'CONTENT'));

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL
);
