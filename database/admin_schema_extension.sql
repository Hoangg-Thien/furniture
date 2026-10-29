-- ====================================================================
-- SCRIPT BỔ SUNG CƠ SỞ DỮ LIỆU CHO PHÂN HỆ QUẢN TRỊ ADMIN (POSTGRESQL)
-- Hệ thống Quản lý Cửa hàng Nội thất
-- File tham chiếu: doc_kehoach/00_KIEN_TRUC_VA_CO_SO_DU_LIEU.md
-- ====================================================================

BEGIN;

-- 1. BẢNG PRODUCT_IMAGES: BỘ SƯU TẬP NHIỀU ẢNH CHO SẢN PHẨM NỘI THẤT
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" BIGSERIAL PRIMARY KEY,
    "product_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT fk_product_images_product FOREIGN KEY ("product_id") 
        REFERENCES "products" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_product_images_product" ON "product_images" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_images_primary" ON "product_images" ("product_id", "is_primary");

-- Đồng bộ ảnh đại diện hiện tại của bảng products sang product_images nếu chưa có
INSERT INTO "product_images" ("product_id", "image_url", "is_primary", "display_order")
SELECT p.id, p.image_url, true, 0
FROM "products" p
WHERE p.image_url IS NOT NULL 
  AND p.image_url <> ''
  AND NOT EXISTS (
      SELECT 1 FROM "product_images" pi WHERE pi.product_id = p.id
  );

-- 2. BẢNG INVOICES: HÓA ĐƠN BÁN HÀNG, THANH TOÁN & VOUCHER
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" BIGSERIAL PRIMARY KEY,
    "invoice_code" VARCHAR(50) UNIQUE NOT NULL,      -- VD: HD-20261027-001
    "order_id" BIGINT UNIQUE NOT NULL,               -- 1 đơn hàng tương ứng 1 hóa đơn chính thức
    "customer_id" BIGINT NOT NULL,
    "staff_id" BIGINT,                              -- Nhân viên thu ngân / duyệt đơn
    "subtotal_amount" NUMERIC(15,2) NOT NULL CHECK (subtotal_amount >= 0),
    "discount_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    "voucher_code" VARCHAR(50),
    "voucher_discount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (voucher_discount >= 0),
    "tax_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0), -- Thuế VAT
    "final_amount" NUMERIC(15,2) NOT NULL CHECK (final_amount >= 0),
    "payment_method" VARCHAR(50) NOT NULL DEFAULT 'CASH',
    "payment_status" VARCHAR(30) NOT NULL DEFAULT 'PAID',
    "payment_date" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "notes" TEXT,
    CONSTRAINT ck_invoices_payment_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'VNPAY', 'MOMO')),
    CONSTRAINT ck_invoices_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
    CONSTRAINT fk_invoices_order FOREIGN KEY ("order_id") REFERENCES "orders" ("id"),
    CONSTRAINT fk_invoices_customer FOREIGN KEY ("customer_id") REFERENCES "customers" ("id"),
    CONSTRAINT fk_invoices_staff FOREIGN KEY ("staff_id") REFERENCES "staff" ("id")
);

CREATE INDEX IF NOT EXISTS "idx_invoices_order" ON "invoices" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_customer" ON "invoices" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_payment_date" ON "invoices" ("payment_date");

COMMIT;
