CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')),
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
  "image_url" TEXT,
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
  "order_date" TIMESTAMP(0) NOT NULL DEFAULT (date_trunc('second', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "total_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
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
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','INACTIVE')),
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
  "minimum_amount" NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (minimum_amount >= 0),
  "maximum_discount" NUMERIC(15,2),
  "quantity" INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  "used_quantity" INTEGER NOT NULL DEFAULT 0 CHECK (used_quantity >= 0 AND used_quantity <= quantity),
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
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

-- =====================================================================
-- TRIGGERS (don hang + phieu nhap hang)
-- =====================================================================

-- Don hang / phieu nhap o trang thai cuoi (COMPLETED / CANCELLED) thi bat bien
-- CREATE FUNCTION fn_final_row_immutable() RETURNS trigger AS $$
-- BEGIN
--   IF OLD.status IN ('COMPLETED','CANCELLED') AND NEW IS DISTINCT FROM OLD THEN
--     RAISE EXCEPTION '% #%: chung tu o trang thai % la bat bien', TG_TABLE_NAME, OLD.id, OLD.status;
--   END IF;
--   RETURN NEW;
-- END $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_final_immutable BEFORE UPDATE ON orders
--   FOR EACH ROW EXECUTE FUNCTION fn_final_row_immutable();
-- CREATE TRIGGER trg_final_immutable BEFORE UPDATE ON purchase_receipts
--   FOR EACH ROW EXECUTE FUNCTION fn_final_row_immutable();

-- Chi tiet don hang / phieu nhap chi them/sua/xoa duoc khi chung tu cha dang PENDING
-- CREATE FUNCTION fn_freeze_items() RETURNS trigger AS $$
-- DECLARE r JSONB; v_status TEXT;
-- BEGIN
--   IF TG_OP = 'DELETE' THEN r := to_jsonb(OLD); ELSE r := to_jsonb(NEW); END IF;
--   EXECUTE format('SELECT status FROM %I WHERE id = $1', TG_ARGV[0])
--      INTO v_status USING (r->>TG_ARGV[1])::bigint;
--   IF TG_OP = 'DELETE' AND v_status IS NULL THEN RETURN OLD; END IF;  -- cascade khi xoa ca chung tu
--   IF v_status IS DISTINCT FROM 'PENDING' THEN
--     RAISE EXCEPTION 'khong duoc sua chi tiet cua % khi trang thai la %', TG_ARGV[0], v_status;
--   END IF;
--   IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
--   RETURN NEW;
-- END $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_freeze_items BEFORE INSERT OR UPDATE OR DELETE ON order_items
--   FOR EACH ROW EXECUTE FUNCTION fn_freeze_items('orders','order_id');
-- CREATE TRIGGER trg_freeze_items BEFORE INSERT OR UPDATE OR DELETE ON purchase_receipt_items
--   FOR EACH ROW EXECUTE FUNCTION fn_freeze_items('purchase_receipts','purchase_receipt_id');

-- =====================================================================
-- SEED DATA - CUA HANG NOI THAT (chay SAU khi da chay file tao bang)
-- Mat khau cua TAT CA user (admin/staff/customer) la: 123456
-- Luu y thu tu: do trigger fn_freeze_items chi cho them order_items /
-- purchase_receipt_items khi chung tu cha dang PENDING, nen script:
--   1) tao don/phieu o PENDING  2) them chi tiet  3) tinh tien
--   4) moi chuyen sang CONFIRMED / COMPLETED / CANCELLED.
-- total_amount cua don hang = tong tien hang - discount_amount.
-- =====================================================================
BEGIN;
 
-- ---------------------------------------------------------------------
-- USERS: 3 admin (id 1-3), 10 staff (id 4-13), 20 customer (id 14-33)
-- ---------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role) VALUES
(1, 'admin01', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'ADMIN'),
(2, 'admin02', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'ADMIN'),
(3, 'admin03', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'ADMIN'),
(4, 'staff01', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(5, 'staff02', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(6, 'staff03', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(7, 'staff04', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(8, 'staff05', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(9, 'staff06', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(10, 'staff07', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(11, 'staff08', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(12, 'staff09', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(13, 'staff10', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'STAFF'),
(14, 'customer01', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(15, 'customer02', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(16, 'customer03', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(17, 'customer04', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(18, 'customer05', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(19, 'customer06', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(20, 'customer07', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(21, 'customer08', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(22, 'customer09', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(23, 'customer10', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(24, 'customer11', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(25, 'customer12', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(26, 'customer13', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(27, 'customer14', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(28, 'customer15', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(29, 'customer16', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(30, 'customer17', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(31, 'customer18', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(32, 'customer19', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER'),
(33, 'customer20', '$2b$10$o9lOP/4bYQEa86fMp0jtt.rB/0dG3G6cAFd1KSMDr42tpCfbZy7zW', 'CUSTOMER');
 
-- ---------------------------------------------------------------------
-- ADMINS
-- ---------------------------------------------------------------------
INSERT INTO admins (id, user_id, full_name, email, phone, address) VALUES
(1, 1, 'Nguyen Quang Minh', 'minh.admin@example.com',  '0901000001', '25 Le Loi, Quan 1, TP.HCM'),
(2, 2, 'Tran Thi Thu Ha',   'ha.admin@example.com',    '0901000002', '88 Cach Mang Thang 8, Quan 3, TP.HCM'),
(3, 3, 'Le Van Thanh',      'thanh.admin@example.com', '0901000003', '14 Nguyen Trai, Quan 5, TP.HCM');
 
-- ---------------------------------------------------------------------
-- STAFF
-- ---------------------------------------------------------------------
INSERT INTO staff (id, user_id, full_name, email, phone, address) VALUES
(1,  4,  'Nguyen Thanh Tung', 'tung.staff@example.com',  '0912000001', '101 Vo Van Tan, Quan 3, TP.HCM'),
(2,  5,  'Tran Minh Chau',    'chau.staff@example.com',  '0912000002', '45 Nguyen Dinh Chieu, Quan 1, TP.HCM'),
(3,  6,  'Le Thi Dung',       'dung.staff@example.com',  '0912000003', '67 Tran Hung Dao, Quan 5, TP.HCM'),
(4,  7,  'Pham Quoc Huy',     'huy.staff@example.com',   '0912000004', '23 Phan Xich Long, Phu Nhuan, TP.HCM'),
(5,  8,  'Hoang Thi Lan',     'lan.staff@example.com',   '0912000005', '9 Hoang Van Thu, Tan Binh, TP.HCM'),
(6,  9,  'Vu Duc Manh',       'manh.staff@example.com',  '0912000006', '156 Quang Trung, Go Vap, TP.HCM'),
(7,  10, 'Dang Thi Nga',      'nga.staff@example.com',   '0912000007', '72 Dien Bien Phu, Binh Thanh, TP.HCM'),
(8,  11, 'Bui Van Oanh',      'oanh.staff@example.com',  '0912000008', '5 Nguyen Van Linh, Quan 7, TP.HCM'),
(9,  12, 'Do Thi Phuong',     'phuong.staff@example.com','0912000009', '31 Le Van Viet, TP. Thu Duc, TP.HCM'),
(10, 13, 'Ngo Van Quan',      'quan.staff@example.com',  '0912000010', '210 Nguyen Thi Minh Khai, Quan 3, TP.HCM');
 
-- ---------------------------------------------------------------------
-- CUSTOMERS (20)
-- ---------------------------------------------------------------------
INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES
(1,  14, 'Nguyen Van An',     'an.nguyen@example.com',     '0933000001', '12 Nguyen Hue, Quan 1, TP.HCM'),
(2,  15, 'Tran Thi Binh',     'binh.tran@example.com',     '0933000002', '34 Ly Tu Trong, Quan 1, TP.HCM'),
(3,  16, 'Le Hoang Cuong',    'cuong.le@example.com',      '0933000003', '56 Pasteur, Quan 3, TP.HCM'),
(4,  17, 'Pham Minh Duc',     'duc.pham@example.com',      '0933000004', '78 Nguyen Thi Minh Khai, Quan 3, TP.HCM'),
(5,  18, 'Hoang Thi Em',      'em.hoang@example.com',      '0933000005', '90 Hai Ba Trung, Quan 1, TP.HCM'),
(6,  19, 'Vu Quoc Phong',     'phong.vu@example.com',      '0933000006', '11 Truong Dinh, Quan 3, TP.HCM'),
(7,  20, 'Dang Thu Giang',    'giang.dang@example.com',    '0933000007', '22 Ba Thang Hai, Quan 10, TP.HCM'),
(8,  21, 'Bui Anh Hai',       'hai.bui@example.com',       '0933000008', '33 To Hien Thanh, Quan 10, TP.HCM'),
(9,  22, 'Do Thanh Huong',    'huong.do@example.com',      '0933000009', '44 Su Van Hanh, Quan 10, TP.HCM'),
(10, 23, 'Ngo Van Khoa',      'khoa.ngo@example.com',      '0933000010', '55 Tan Hung, Quan 5, TP.HCM'),
(11, 24, 'Duong My Linh',     'linh.duong@example.com',    '0933000011', '66 Nguyen Van Cu, Quan 5, TP.HCM'),
(12, 25, 'Ly Hoai Nam',       'nam.ly@example.com',        '0933000012', '77 Huynh Tan Phat, Quan 7, TP.HCM'),
(13, 26, 'Trinh Bao Ngoc',    'ngoc.trinh@example.com',    '0933000013', '88 Phan Van Tri, Go Vap, TP.HCM'),
(14, 27, 'Phan Gia Phuc',     'phuc.phan@example.com',     '0933000014', '99 Le Quang Dinh, Binh Thanh, TP.HCM'),
(15, 28, 'Vo Thi Quynh',      'quynh.vo@example.com',      '0933000015', '110 Xo Viet Nghe Tinh, Binh Thanh, TP.HCM'),
(16, 29, 'Dinh Cong Son',     'son.dinh@example.com',      '0933000016', '121 Cong Hoa, Tan Binh, TP.HCM'),
(17, 30, 'Mai Thanh Tam',     'tam.mai@example.com',       '0933000017', '132 Truong Chinh, Tan Binh, TP.HCM'),
(18, 31, 'Ha Tuan Tu',        'tu.ha@example.com',         '0933000018', '143 Pham Van Dong, TP. Thu Duc, TP.HCM'),
(19, 32, 'Truong Khanh Uyen', 'uyen.truong@example.com',   '0933000019', '154 Vo Van Ngan, TP. Thu Duc, TP.HCM'),
(20, 33, 'Lam Quang Vinh',    'vinh.lam@example.com',      '0933000020', '165 Nguyen Oanh, Go Vap, TP.HCM');
 
-- ---------------------------------------------------------------------
-- CATEGORIES (10)
-- ---------------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
(1,  'Sofa va ghe thu gian',  'Sofa goc, sofa bang, ghe thu gian phong khach'),
(2,  'Ban an',                'Ban an go, ban an mat da cac kich thuoc'),
(3,  'Ghe an va ghe bar',     'Ghe an, ghe bar, ghe quay bar'),
(4,  'Giuong ngu',            'Giuong go, giuong boc nem, giuong ngu thong minh'),
(5,  'Tu quan ao va tu giay', 'Tu quan ao canh mo, canh lua, tu giay'),
(6,  'Ban va ghe van phong',  'Ban lam viec, ghe cong thai hoc'),
(7,  'Ke sach va ke tivi',    'Ke sach, ke tivi, tu trung bay'),
(8,  'Den trang tri',         'Den chum, den san, den ban, den tuong'),
(9,  'Tham va rem cua',       'Tham trai san, rem vai, rem cuon'),
(10, 'Nem va phu kien giuong','Nem cao su, nem lo xo, goi, chan ga');
 
-- ---------------------------------------------------------------------
-- PRODUCTS (20) - gia VND
-- ---------------------------------------------------------------------
INSERT INTO products (id, category_id, name, description, unit, selling_price, image_url, quantity) VALUES
(1,  1,  'Sofa goc chu L vai boc Milan',         'Sofa goc 3m, khung go soi, vai boc chong tham',     'bo',   14500000, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85', 12),
(2,  1,  'Sofa bang 3 cho da PU Oslo',           'Sofa bang dai 2m1, da PU cao cap',                  'cai',  9800000,  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=85', 15),
(3,  1,  'Ghe thu gian boc benh Relax',          'Ghe thu gian ngat lung, boc vai benh',              'cai',  4200000,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85', 20),
(4,  2,  'Ban an go cao su 6 cho Nordic',        'Ban an chu nhat 1m6, go cao su tu nhien',           'cai',  6500000,  'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=900&q=85', 18),
(5,  2,  'Ban an mat da ceramic 4 cho Venus',    'Ban an mat da ceramic 1m2, chan thep son tinh dien','cai',  7800000,  'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=900&q=85', 10),
(6,  3,  'Ghe an go soi dem boc Luna',           'Ghe an khung go soi, dem boc vai',                  'cai',  850000,   'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85', 80),
(7,  3,  'Ghe bar chan sat Loft',                'Ghe bar cao 75cm, chan sat son den',                'cai',  1200000,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', 40),
(8,  4,  'Giuong ngu go soi 1m8 Hana',           'Giuong go soi tu nhien, kich thuoc 1m8 x 2m',       'cai',  8900000,  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85', 14),
(9,  4,  'Giuong boc nem 1m6 Royal',             'Giuong boc nem dau giuong, kich thuoc 1m6 x 2m',    'cai',  7200000,  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=85', 12),
(10, 5,  'Tu quan ao 3 canh go MDF Alice',       'Tu quan ao 3 canh, go MDF chong am',                'cai',  6800000,  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=900&q=85', 16),
(11, 5,  'Tu giay thong minh 5 tang',            'Tu giay canh lat, go cong nghiep',                  'cai',  2400000,  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=85', 25),
(12, 6,  'Ban lam viec chan sat 1m2 Office',     'Ban lam viec mat go MDF, chan sat chu U',           'cai',  1900000,  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=85', 45),
(13, 6,  'Ghe cong thai hoc Ergo',               'Ghe luoi tua lung, ke tay 3D, nang ha khi nen',     'cai',  3600000,  'https://images.unsplash.com/photo-1580481077190-736134b223c6?auto=format&fit=crop&w=900&q=85', 30),
(14, 7,  'Ke sach go 5 tang Bookie',             'Ke sach 5 tang, go cong nghiep phu melamine',       'cai',  2100000,  'https://images.unsplash.com/photo-1594671581654-27d5303d3d45?auto=format&fit=crop&w=900&q=85', 35),
(15, 7,  'Ke tivi go oc cho 1m8 Nova',           'Ke tivi 1m8 co ngan keo, go oc cho',                'cai',  3200000,  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85', 22),
(16, 8,  'Den chum pha le 8 bong',               'Den chum phong khach, khung ma vang',               'cai',  5400000,  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=85', 10),
(17, 8,  'Den san thong tru Arc',                'Den san cao 1m8, than kim loai',                    'cai',  1350000,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85&sat=-40', 28),
(18, 9,  'Tham long ngan phong khach 2x3m',      'Tham long ngan chong boi, kich thuoc 2m x 3m',      'tam',  2800000,  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=900&q=85', 24),
(19, 9,  'Rem cua vai chong nang 2.4m',          'Rem vai 2 lop chong nang, cao 2m4',                 'bo',   1650000,  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85', 50),
(20, 10, 'Nem cao su non 1m6 Dreamy',            'Nem cao su non 1m6 x 2m, day 15cm',                 'cai',  5900000,  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=85', 20);
 
-- ---------------------------------------------------------------------
-- CARTS (moi khach 1 gio hang) + CART_ITEMS
-- ---------------------------------------------------------------------
INSERT INTO carts (id, customer_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5),
(6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15),
(16, 16), (17, 17), (18, 18), (19, 19), (20, 20);
 
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1,2,1),(1,18,1),
(2,4,1),(2,6,4),
(3,8,1),(3,20,1),
(4,10,1),
(5,1,1),(5,19,2),
(6,12,1),(6,13,1),
(7,14,2),
(8,16,1),(8,17,2),
(9,5,1),(9,6,6),
(10,3,2),
(11,11,1),(11,15,1),
(12,9,1),(12,20,1),
(13,7,3),
(14,19,2),
(15,13,2),(15,12,2),
(16,15,1),(16,14,1),
(17,17,1),
(18,2,1),(18,3,1),
(19,10,1),(19,11,1),
(20,18,1),(20,19,1);
 
-- ---------------------------------------------------------------------
-- SUPPLIERS (10)
-- ---------------------------------------------------------------------
INSERT INTO suppliers (id, name, phone, email, address) VALUES
(1,  'Cong ty Go Truong Thanh',         '02838000001', 'sales@gotruongthanh.example.com',  'Thu Dau Mot, Binh Duong'),
(2,  'Xuong Sofa Hoang Gia',            '02838000002', 'sales@sofahoanggia.example.com',   'Quan 12, TP.HCM'),
(3,  'Cong ty Noi that Viet Phat',      '02838000003', 'sales@noithatvietphat.example.com','Bien Hoa, Dong Nai'),
(4,  'Cong ty Nem Dong Phuong',         '02838000004', 'sales@nemdongphuong.example.com',  'Binh Tan, TP.HCM'),
(5,  'Cong ty Den Trang Tri Anh Duong', '02838000005', 'sales@denanhduong.example.com',    'Quan 5, TP.HCM'),
(6,  'Cong ty Tham Rem Hoang Long',     '02838000006', 'sales@thamremhoanglong.example.com','Tan Phu, TP.HCM'),
(7,  'Xuong Go Cao Su Binh Phuoc',      '02838000007', 'sales@gocusubp.example.com',       'Dong Xoai, Binh Phuoc'),
(8,  'Cong ty Ban Ghe Van Phong An Phat','02838000008', 'sales@anphatoffice.example.com',  'Go Vap, TP.HCM'),
(9,  'Cong ty Tu Bep va Tu Ao Minh Long','02838000009','sales@minhlongfurniture.example.com','Thuan An, Binh Duong'),
(10, 'Cong ty Nhap khau Da va Vai Boc', '02838000010', 'sales@davaiboc.example.com',        'Quan 7, TP.HCM');
 
-- ---------------------------------------------------------------------
-- PROMOTION PROGRAMS (10)
-- ---------------------------------------------------------------------
INSERT INTO promotion_programs (id, name, description, start_date, end_date, status) VALUES
(1,  'Khai truong showroom',    'Giam gia mung khai truong showroom',  '2026-01-01 00:00:00', '2026-03-31 23:59:59', 'INACTIVE'),
(2,  'Mua he soi dong',         'Uu dai noi that mua he',              '2026-05-01 00:00:00', '2026-08-31 23:59:59', 'INACTIVE'),
(3,  'Tet Nguyen Dan 2026',     'Uu dai sam noi that don Tet',         '2026-01-15 00:00:00', '2026-02-28 23:59:59', 'INACTIVE'),
(4,  'Black Friday',            'Sieu sale cuoi nam',                  '2026-11-20 00:00:00', '2026-11-30 23:59:59', 'DRAFT'),
(5,  'Sinh nhat showroom',      'Mung sinh nhat showroom',             '2026-10-01 00:00:00', '2026-10-31 23:59:59', 'ACTIVE'),
(6,  'Khach hang than thiet',   'Uu dai quanh nam cho khach quen',     '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(7,  'Giam gia 11.11',          'Ngay doi doi 11.11',                  '2026-11-11 00:00:00', '2026-11-12 23:59:59', 'DRAFT'),
(8,  'Chao ban moi',            'Uu dai cho khach hang moi',           '2026-09-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(9,  'Thanh ly cuoi nam',       'Thanh ly mau trung bay cuoi nam',     '2026-10-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(10, 'Uu dai tan gia',          'Uu dai cho khach mua noi that tan gia','2026-08-15 00:00:00','2026-10-31 23:59:59', 'ACTIVE');
 
-- PRODUCT_DISCOUNTS (15) - ngay lay theo chuong trinh
INSERT INTO product_discounts (promotion_program_id, product_id, discount_percent, start_date, end_date)
SELECT v.prog, v.prod, v.pct, pp.start_date, pp.end_date
FROM (VALUES
  (2,1,10),(2,2,8),(2,3,5),
  (5,4,10),(5,5,12),(5,6,15),
  (9,12,10),(9,13,8),(9,14,12),
  (10,10,6),(10,11,10),
  (6,18,7),(6,19,5),
  (1,8,5),(1,9,8)
) AS v(prog, prod, pct)
JOIN promotion_programs pp ON pp.id = v.prog;
 
-- ORDER_DISCOUNTS (10)
INSERT INTO order_discounts (promotion_program_id, minimum_amount, discount_percent, start_date, end_date)
SELECT v.prog, v.min_amt, v.pct, pp.start_date, pp.end_date
FROM (VALUES
  (1,5000000,3),(1,15000000,5),
  (2,8000000,4),
  (5,6000000,3),(5,20000000,8),
  (6,10000000,5),
  (8,4000000,2),
  (9,7000000,4),
  (10,6000000,3),(10,25000000,6)
) AS v(prog, min_amt, pct)
JOIN promotion_programs pp ON pp.id = v.prog;
 
-- VOUCHERS (10) - used_quantity se duoc cap nhat sau khi co don hang
INSERT INTO vouchers (id, promotion_program_id, code, discount_percent, minimum_amount, maximum_discount, quantity, start_date, end_date, status)
SELECT v.id, v.prog, v.code, v.pct, v.min_amt, v.max_disc, v.qty, pp.start_date, pp.end_date, v.st
FROM (VALUES
  (1,  1,  'KHAITRUONG5',  5,  3000000,  500000::numeric,   100, 'ACTIVE'),
  (2,  2,  'HE2026',       8,  5000000,  1000000::numeric,  200, 'ACTIVE'),
  (3,  3,  'TET2026',      10, 8000000,  2000000::numeric,  150, 'ACTIVE'),
  (4,  5,  'SN2026',       10, 6000000,  1500000::numeric,   80, 'ACTIVE'),
  (5,  6,  'THANTHIET3',   3,  0,        300000::numeric,   500, 'ACTIVE'),
  (6,  8,  'CHAOBAN',      5,  2000000,  NULL::numeric,     300, 'ACTIVE'),
  (7,  9,  'CUOINAM',      7,  5000000,  1200000::numeric,  120, 'ACTIVE'),
  (8,  10, 'TANGIA',       6,  4000000,  1000000::numeric,  150, 'ACTIVE'),
  (9,  4,  'BLACKFRIDAY',  15, 10000000, 3000000::numeric,   50, 'INACTIVE'),
  (10, 7,  'DOI1111',      11, 3000000,  1500000::numeric,  100, 'INACTIVE')
) AS v(id, prog, code, pct, min_amt, max_disc, qty, st)
JOIN promotion_programs pp ON pp.id = v.prog;
 
-- ---------------------------------------------------------------------
-- ORDERS (20)
-- Buoc 1: tao don o trang thai PENDING (de duoc them chi tiet)
-- ---------------------------------------------------------------------
INSERT INTO orders (id, customer_id, order_date) VALUES
(1,  1,  '2026-01-12 09:15:00'),
(2,  2,  '2026-01-20 14:30:00'),
(3,  3,  '2026-02-03 10:05:00'),
(4,  4,  '2026-02-14 16:45:00'),
(5,  5,  '2026-03-05 11:20:00'),
(6,  6,  '2026-03-18 19:10:00'),
(7,  7,  '2026-05-10 08:40:00'),
(8,  8,  '2026-06-02 13:00:00'),
(9,  9,  '2026-06-21 17:25:00'),
(10, 10, '2026-07-08 12:15:00'),
(11, 11, '2026-07-25 20:05:00'),
(12, 12, '2026-08-09 09:50:00'),
(13, 13, '2026-08-20 15:35:00'),
(14, 14, '2026-09-03 10:30:00'),
(15, 15, '2026-09-15 18:00:00'),
(16, 16, '2026-09-28 11:45:00'),
(17, 17, '2026-10-02 14:10:00'),
(18, 18, '2026-10-05 09:20:00'),
(19, 19, '2026-10-08 16:55:00'),
(20, 20, '2026-10-10 13:40:00');
 
-- Buoc 2: chi tiet don hang (don gia lay tu gia ban hien tai)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount)
SELECT v.o, v.p, v.q, p.selling_price, v.q * p.selling_price
FROM (VALUES
  (1,4,1),(1,6,6),
  (2,3,1),(2,14,1),
  (3,2,1),(3,18,1),
  (4,8,1),(4,19,2),
  (5,16,1),(5,17,2),
  (6,10,1),(6,12,1),
  (7,9,1),(7,13,1),
  (8,1,1),(8,18,1),
  (9,5,1),(9,6,4),
  (10,11,1),(10,17,1),
  (11,20,1),(11,19,2),
  (12,15,1),(12,14,2),(12,7,2),
  (13,12,2),(13,13,1),
  (14,3,1),(14,19,1),
  (15,9,1),(15,17,1),
  (16,20,1),(16,11,1),
  (17,4,1),(17,7,2),
  (18,1,1),(18,19,2),
  (19,13,2),(19,12,1),
  (20,3,2),(20,6,2)
) AS v(o, p, q)
JOIN products p ON p.id = v.p;
 
-- Buoc 3: tong tien hang
UPDATE orders o
SET total_amount = s.total
FROM (SELECT order_id, SUM(amount) AS total FROM order_items GROUP BY order_id) s
WHERE o.id = s.order_id;
 
-- Buoc 4: gan voucher (van dang PENDING)
UPDATE orders o
SET voucher_id = v.voucher_id
FROM (VALUES
  (2,1),(3,3),(6,1),(7,2),(9,2),(10,5),
  (13,8),(14,6),(16,5),(17,4),(18,7),(20,6)
) AS v(order_id, voucher_id)
WHERE o.id = v.order_id;
 
-- Buoc 5: tinh giam gia va tong tien phai tra
UPDATE orders o
SET discount_amount = d.disc,
    total_amount    = o.total_amount - d.disc
FROM (
  SELECT o2.id,
         ROUND(LEAST(o2.total_amount * vc.discount_percent / 100,
                     COALESCE(vc.maximum_discount, o2.total_amount)), 2) AS disc
  FROM orders o2
  JOIN vouchers vc ON vc.id = o2.voucher_id
) d
WHERE o.id = d.id;
 
-- Buoc 6: chuyen trang thai (don 18, 19, 20 giu nguyen PENDING)
UPDATE orders o
SET status = v.status, staff_id = v.staff_id
FROM (VALUES
  (1,  'COMPLETED', 1),
  (2,  'COMPLETED', 2),
  (3,  'COMPLETED', 1),
  (4,  'COMPLETED', 3),
  (5,  'CANCELLED', NULL),
  (6,  'COMPLETED', 2),
  (7,  'COMPLETED', 4),
  (8,  'COMPLETED', 5),
  (9,  'COMPLETED', 3),
  (10, 'COMPLETED', 6),
  (11, 'CANCELLED', NULL),
  (12, 'COMPLETED', 7),
  (13, 'COMPLETED', 4),
  (14, 'COMPLETED', 5),
  (15, 'CONFIRMED', 6),
  (16, 'COMPLETED', 8),
  (17, 'CONFIRMED', 9)
) AS v(id, status, staff_id)
WHERE o.id = v.id;
 
-- Cap nhat so luong voucher da dung (khong tinh don da huy)
UPDATE vouchers v
SET used_quantity = (SELECT COUNT(*) FROM orders o
                     WHERE o.voucher_id = v.id AND o.status <> 'CANCELLED');
 
-- ---------------------------------------------------------------------
-- PURCHASE RECEIPTS (15) - cung quy trinh: PENDING -> chi tiet -> chot
-- ---------------------------------------------------------------------
INSERT INTO purchase_receipts (id, supplier_id, staff_id, receipt_date) VALUES
(1,  2,  1,  '2026-01-05 08:30:00'),
(2,  1,  2,  '2026-01-18 09:00:00'),
(3,  3,  3,  '2026-02-02 10:15:00'),
(4,  7,  1,  '2026-02-25 14:20:00'),
(5,  9,  4,  '2026-03-10 11:00:00'),
(6,  8,  5,  '2026-04-07 09:45:00'),
(7,  3,  2,  '2026-05-12 13:30:00'),
(8,  5,  6,  '2026-06-15 15:10:00'),
(9,  6,  7,  '2026-07-01 08:50:00'),
(10, 4,  3,  '2026-07-20 10:40:00'),
(11, 2,  8,  '2026-08-11 09:25:00'),
(12, 1,  9,  '2026-09-02 14:05:00'),
(13, 8,  10, '2026-09-22 16:00:00'),
(14, 2,  4,  '2026-10-06 10:10:00'),
(15, 4,  5,  '2026-10-11 11:30:00');
 
-- Gia nhap = 70% gia ban, lam tron den tram dong
INSERT INTO purchase_receipt_items (purchase_receipt_id, product_id, quantity, unit_price, amount)
SELECT v.r, v.p, v.q, ROUND(p.selling_price * 0.7, -2), v.q * ROUND(p.selling_price * 0.7, -2)
FROM (VALUES
  (1,1,5),(1,2,5),
  (2,4,8),(2,5,5),
  (3,6,40),(3,7,20),
  (4,8,6),(4,9,6),
  (5,10,8),(5,11,10),
  (6,12,20),(6,13,12),
  (7,14,15),(7,15,10),
  (8,16,5),(8,17,12),
  (9,18,10),(9,19,20),
  (10,20,8),
  (11,1,4),(11,3,8),(11,6,30),
  (12,4,6),(12,10,6),
  (13,12,15),(13,13,10),(13,14,10),
  (14,2,5),(14,8,4),
  (15,5,5),(15,20,10)
) AS v(r, p, q)
JOIN products p ON p.id = v.p;
 
UPDATE purchase_receipts pr
SET total_amount = s.total
FROM (SELECT purchase_receipt_id, SUM(amount) AS total
      FROM purchase_receipt_items GROUP BY purchase_receipt_id) s
WHERE pr.id = s.purchase_receipt_id;
 
-- Phieu 14, 15 giu PENDING
UPDATE purchase_receipts
SET status = 'COMPLETED'
WHERE id IN (1,2,3,4,5,6,7,8,9,11,12,13);
 
UPDATE purchase_receipts SET status = 'CANCELLED' WHERE id = 10;
 
-- ---------------------------------------------------------------------
-- Dong bo lai sequence sau khi insert id thu cong
-- ---------------------------------------------------------------------
-- SELECT setval(pg_get_serial_sequence('users', 'id'),              (SELECT MAX(id) FROM users));
-- SELECT setval(pg_get_serial_sequence('customers', 'id'),          (SELECT MAX(id) FROM customers));
-- SELECT setval(pg_get_serial_sequence('staff', 'id'),              (SELECT MAX(id) FROM staff));
-- SELECT setval(pg_get_serial_sequence('admins', 'id'),             (SELECT MAX(id) FROM admins));
-- SELECT setval(pg_get_serial_sequence('categories', 'id'),         (SELECT MAX(id) FROM categories));
-- SELECT setval(pg_get_serial_sequence('products', 'id'),           (SELECT MAX(id) FROM products));
-- SELECT setval(pg_get_serial_sequence('carts', 'id'),              (SELECT MAX(id) FROM carts));
-- SELECT setval(pg_get_serial_sequence('orders', 'id'),             (SELECT MAX(id) FROM orders));
-- SELECT setval(pg_get_serial_sequence('suppliers', 'id'),          (SELECT MAX(id) FROM suppliers));
-- SELECT setval(pg_get_serial_sequence('purchase_receipts', 'id'),  (SELECT MAX(id) FROM purchase_receipts));
-- SELECT setval(pg_get_serial_sequence('promotion_programs', 'id'), (SELECT MAX(id) FROM promotion_programs));
-- SELECT setval(pg_get_serial_sequence('product_discounts', 'id'),  (SELECT MAX(id) FROM product_discounts));
-- SELECT setval(pg_get_serial_sequence('order_discounts', 'id'),    (SELECT MAX(id) FROM order_discounts));
-- SELECT setval(pg_get_serial_sequence('vouchers', 'id'),           (SELECT MAX(id) FROM vouchers));
 
INSERT INTO users (id, username, password_hash, role) VALUES (34, 'khachhangmoi', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'CUSTOMER');
INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES (21, 34, 'Tran Van B', 'tranvanb@example.com', '0911223344', '456 Tran Hung Dao, Quan 5');
INSERT INTO users (id, username, password_hash, role) VALUES (35, 'luugiahuy', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'CUSTOMER');
INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES (22, 35, 'Luu Gia Huy', 'luugiahuy@example.com', '0909090909', '789 Nguyen Hue, Quan 1');
INSERT INTO users (id, username, password_hash, role) VALUES (34, 'huyluu123', '4be1060d0223a3326c0984b286725e7e1c900ce1bf28539eb6442eb7df6b803d', 'CUSTOMER');
INSERT INTO customers (id, user_id, full_name, email, phone, address) VALUES (21, 34, 'Luu Gia Huy', 'huyluu123@gmail.com', '0912345678', '12, lac long quan, quan 11');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (21, 21, '2026-10-12 16:46:58', 'PENDING', 8900000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (21, 8, 1, 8900000, 8900000);
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (22, 21, '2026-10-12 16:47:52', 'PENDING', 28800000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (22, 9, 4, 7200000, 28800000);
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (23, 21, '2026-10-13 13:45:14', 'PENDING', 14500000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (23, 1, 1, 14500000, 14500000);
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (24, 21, '2026-10-13 14:05:51', 'PENDING', 885000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (24, 6, 1, 850000, 850000);
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (25, 21, '2026-10-13 14:22:05', 'PENDING', 9800000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (25, 2, 1, 9800000, 9800000);
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount) VALUES (26, 21, '2026-10-13 14:33:50', 'PENDING', 885000, 0);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (26, 6, 1, 850000, 850000);
COMMIT;