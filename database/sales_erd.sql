-- =====================================================================
-- MAISON INTERIOR SALES - ERD FILE (dung de import vao dbdiagram.io)
-- Chi gom bang, rang buoc, index, khoa ngoai. KHONG co trigger/ham.
-- Nap database that: dung sales.sql (da gom file nay + trigger).
-- =====================================================================
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" VARCHAR(30) NOT NULL CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')) DEFAULT 'CUSTOMER',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CONSTRAINT uq_users_id_role UNIQUE ("id", "role")
);

CREATE TABLE "customers" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT UNIQUE NOT NULL,
  "full_name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) UNIQUE,
  "phone" VARCHAR(20),
  "address" TEXT,
  "role" VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER' CHECK (role = 'CUSTOMER'),
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "staff" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT UNIQUE NOT NULL,
  "full_name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) UNIQUE,
  "phone" VARCHAR(20),
  "address" TEXT,
  "role" VARCHAR(30) NOT NULL DEFAULT 'STAFF' CHECK (role = 'STAFF'),
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "admins" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT UNIQUE NOT NULL,
  "full_name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) UNIQUE,
  "phone" VARCHAR(20),
  "address" TEXT,
  "role" VARCHAR(30) NOT NULL DEFAULT 'ADMIN' CHECK (role = 'ADMIN'),
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "categories" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(150) UNIQUE NOT NULL,
  "description" TEXT
);

CREATE TABLE "products" (
  "id" BIGSERIAL PRIMARY KEY,
  "category_id" BIGINT NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "unit" VARCHAR(50) NOT NULL,
  "selling_price" NUMERIC(15,2) NOT NULL CHECK (selling_price >= 0),
  "quantity" INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "carts" (
  "id" BIGSERIAL PRIMARY KEY,
  "customer_id" BIGINT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "cart_items" (
  "cart_id" BIGINT NOT NULL,
  "product_id" BIGINT NOT NULL,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY ("cart_id", "product_id")
);

CREATE TABLE "orders" (
  "id" BIGSERIAL PRIMARY KEY,
  "customer_id" BIGINT NOT NULL,
  "staff_id" BIGINT,
  "order_date" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "total_amount" NUMERIC(15,2) NOT NULL CHECK (total_amount >= 0) DEFAULT 0,
  "voucher_id" BIGINT,
  "discount_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  CONSTRAINT ck_orders_status CHECK (status IN ('PENDING','CONFIRMED','COMPLETED','CANCELLED')),
  CONSTRAINT ck_orders_staff CHECK (status IN ('PENDING','CANCELLED') OR staff_id IS NOT NULL)
);

CREATE TABLE "order_items" (
  "order_id" BIGINT NOT NULL,
  "product_id" BIGINT NOT NULL,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "unit_price" NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  "amount" NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  PRIMARY KEY ("order_id", "product_id"),
  CONSTRAINT ck_oi_amount CHECK (amount = quantity * unit_price)
);

CREATE TABLE "suppliers" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "phone" VARCHAR(20),
  "email" VARCHAR(150),
  "address" TEXT
);

CREATE TABLE "purchase_receipts" (
  "id" BIGSERIAL PRIMARY KEY,
  "supplier_id" BIGINT NOT NULL,
  "staff_id" BIGINT NOT NULL,
  "receipt_date" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "total_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  CONSTRAINT ck_pr_status CHECK (status IN ('PENDING','COMPLETED','CANCELLED'))
);

CREATE TABLE "purchase_receipt_items" (
  "purchase_receipt_id" BIGINT NOT NULL,
  "product_id" BIGINT NOT NULL,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "unit_price" NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  "amount" NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  PRIMARY KEY ("purchase_receipt_id", "product_id"),
  CONSTRAINT ck_pri_amount CHECK (amount = quantity * unit_price)
);

CREATE TABLE "promotion_programs" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT','ACTIVE','INACTIVE')) DEFAULT 'DRAFT',
  CHECK (end_date >= start_date)
);

CREATE TABLE "product_discounts" (
  "id" BIGSERIAL PRIMARY KEY,
  "promotion_program_id" BIGINT NOT NULL,
  "product_id" BIGINT NOT NULL,
  "discount_percent" NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE "order_discounts" (
  "id" BIGSERIAL PRIMARY KEY,
  "promotion_program_id" BIGINT NOT NULL,
  "minimum_amount" NUMERIC(15,2) NOT NULL CHECK (minimum_amount >= 0),
  "discount_percent" NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE "vouchers" (
  "id" BIGSERIAL PRIMARY KEY,
  "promotion_program_id" BIGINT NOT NULL,
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "discount_percent" NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  "minimum_amount" NUMERIC(15,2) NOT NULL CHECK (minimum_amount >= 0) DEFAULT 0,
  "maximum_discount" NUMERIC(15,2),
  "quantity" INTEGER NOT NULL CHECK (quantity >= 0) DEFAULT 0,
  "used_quantity" INTEGER NOT NULL CHECK (used_quantity >= 0 AND used_quantity <= quantity) DEFAULT 0,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" VARCHAR(30) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')) DEFAULT 'ACTIVE',
  CHECK (end_date >= start_date),
  CHECK (maximum_discount IS NULL OR maximum_discount >= 0)
);

-- ===== INDEXES =====
CREATE INDEX "idx_products_category" ON "products" ("category_id");
CREATE INDEX "idx_cart_items_product" ON "cart_items" ("product_id");
CREATE INDEX "idx_orders_customer" ON "orders" ("customer_id");
CREATE INDEX "idx_orders_staff" ON "orders" ("staff_id");
CREATE INDEX "idx_orders_voucher" ON "orders" ("voucher_id");
CREATE INDEX "idx_orders_status" ON "orders" ("status");
CREATE INDEX "idx_order_items_product" ON "order_items" ("product_id");
CREATE INDEX "idx_purchase_receipts_supplier" ON "purchase_receipts" ("supplier_id");
CREATE INDEX "idx_purchase_receipts_staff" ON "purchase_receipts" ("staff_id");
CREATE INDEX "idx_purchase_receipts_status" ON "purchase_receipts" ("status");
CREATE INDEX "idx_purchase_receipt_items_product" ON "purchase_receipt_items" ("product_id");
CREATE INDEX "idx_product_discounts_product" ON "product_discounts" ("product_id");
CREATE UNIQUE INDEX "uq_pd_program_product" ON "product_discounts" ("promotion_program_id", "product_id");
CREATE INDEX "idx_order_discounts_program" ON "order_discounts" ("promotion_program_id");
CREATE UNIQUE INDEX "uq_od_program_min" ON "order_discounts" ("promotion_program_id", "minimum_amount");
CREATE INDEX "idx_vouchers_program" ON "vouchers" ("promotion_program_id");

-- ===== FOREIGN KEYS =====
-- Role profile: (user_id, role) phai khop users(id, role)
ALTER TABLE "customers" ADD CONSTRAINT fk_customers_user_role FOREIGN KEY ("user_id", "role") REFERENCES "users" ("id", "role");
ALTER TABLE "staff"     ADD CONSTRAINT fk_staff_user_role     FOREIGN KEY ("user_id", "role") REFERENCES "users" ("id", "role");
ALTER TABLE "admins"    ADD CONSTRAINT fk_admins_user_role    FOREIGN KEY ("user_id", "role") REFERENCES "users" ("id", "role");

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "carts" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");
ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("staff_id") REFERENCES "staff" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("voucher_id") REFERENCES "vouchers" ("id");
ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "purchase_receipts" ADD FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id");
ALTER TABLE "purchase_receipts" ADD FOREIGN KEY ("staff_id") REFERENCES "staff" ("id");
ALTER TABLE "purchase_receipt_items" ADD FOREIGN KEY ("purchase_receipt_id") REFERENCES "purchase_receipts" ("id") ON DELETE CASCADE;
ALTER TABLE "purchase_receipt_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "product_discounts" ADD FOREIGN KEY ("promotion_program_id") REFERENCES "promotion_programs" ("id") ON DELETE CASCADE;
ALTER TABLE "product_discounts" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");
ALTER TABLE "order_discounts" ADD FOREIGN KEY ("promotion_program_id") REFERENCES "promotion_programs" ("id") ON DELETE CASCADE;
ALTER TABLE "vouchers" ADD FOREIGN KEY ("promotion_program_id") REFERENCES "promotion_programs" ("id") ON DELETE CASCADE;
