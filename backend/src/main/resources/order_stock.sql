-- Đơn cũ chưa trừ kho, nên không được tự cộng trả khi hủy.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT FALSE;
