ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS checked_by BIGINT;
ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS reviewed_by BIGINT;
ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE public.purchase_receipts ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE public.purchase_receipt_items ADD COLUMN IF NOT EXISTS received_quantity INTEGER;
CREATE TABLE IF NOT EXISTS public.receipt_inspection_events (
    id BIGSERIAL PRIMARY KEY,
    receipt_id BIGINT NOT NULL REFERENCES public.purchase_receipts(id),
    actor_user_id BIGINT NOT NULL REFERENCES public.users(id),
    action VARCHAR(30) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.receipt_inspection_events ENABLE ROW LEVEL SECURITY;
