-- =====================================================================
-- Maison Interior SALES - PostgreSQL Database Integrity Test Suite
-- Target: PostgreSQL 17 (cung chay duoc tren PostgreSQL >= 11)
--
-- CACH CHAY
--   - Chay ca file nay (psql -f) tren DB da nap sales.sql, tu tren xuong duoi.
--   - Toan bo du lieu test duoc ROLLBACK o cuoi. Sequence co the tang, khong sao.
--   - File KHONG nem loi de bao ket qua; in bang ket qua day du roi ROLLBACK.
-- =====================================================================

BEGIN;

CREATE TEMP TABLE _sales_test_ids (k TEXT PRIMARY KEY, v BIGINT NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _sales_test_results (
    test_no INTEGER PRIMARY KEY,
    test_name TEXT NOT NULL,
    expected TEXT NOT NULL,
    result TEXT NOT NULL,
    detail TEXT
) ON COMMIT DROP;

-- Chay SQL BAT BUOC loi. Co loi = PASS; chay duoc = FAIL.
CREATE OR REPLACE FUNCTION pg_temp.assert_error(p_no INTEGER, p_name TEXT, p_sql TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE p_sql;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _sales_test_results VALUES (p_no,p_name,'ERROR','PASS',format('[%s] %s',SQLSTATE,SQLERRM));
        RETURN;
    END;
    INSERT INTO _sales_test_results VALUES (p_no,p_name,'ERROR','FAIL','Statement succeeded but an error was expected');
END $$;

-- Chay SQL BAT BUOC thanh cong. Co loi = FAIL.
CREATE OR REPLACE FUNCTION pg_temp.assert_success(p_no INTEGER, p_name TEXT, p_sql TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE p_sql;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _sales_test_results VALUES (p_no,p_name,'SUCCESS','FAIL',format('[%s] %s',SQLSTATE,SQLERRM));
        RETURN;
    END;
    INSERT INTO _sales_test_results VALUES (p_no,p_name,'SUCCESS','PASS','');
END $$;

-- Lay id fixture
CREATE OR REPLACE FUNCTION pg_temp.id(p_k TEXT) RETURNS BIGINT
LANGUAGE sql AS $$ SELECT v FROM _sales_test_ids WHERE k = p_k $$;

-- =====================================================================
-- TEST 0: Schema sanity
-- =====================================================================
DO $$
DECLARE v_tables INTEGER; v_triggers INTEGER;
BEGIN
    SELECT count(*) INTO v_tables FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE';
    SELECT count(*) INTO v_triggers FROM pg_trigger WHERE NOT tgisinternal;
    INSERT INTO _sales_test_results VALUES (0,'Installed schema object count','17 tables + 4 triggers',
        CASE WHEN v_tables = 17 AND v_triggers = 4 THEN 'PASS' ELSE 'FAIL' END,
        format('%s tables, %s triggers',v_tables,v_triggers));
END $$;

-- =====================================================================
-- TEST DATA
-- =====================================================================
DO $$
DECLARE
    v_uc BIGINT; v_us BIGINT; v_ua BIGINT; v_c BIGINT; v_s BIGINT; v_a BIGINT;
    v_cat BIGINT; v_p1 BIGINT; v_p2 BIGINT; v_prog BIGINT; v_prog1 BIGINT; v_vch BIGINT; v_vch_used BIGINT;
    v_o1 BIGINT; v_o2 BIGINT; v_o3 BIGINT; v_cart BIGINT; v_sup BIGINT; v_r1 BIGINT; v_r2 BIGINT;
BEGIN
    INSERT INTO users(username,password_hash,role) VALUES ('__T_C_'||txid_current(),'x','CUSTOMER') RETURNING id INTO v_uc;
    INSERT INTO users(username,password_hash,role) VALUES ('__T_S_'||txid_current(),'x','STAFF')    RETURNING id INTO v_us;
    INSERT INTO users(username,password_hash,role) VALUES ('__T_A_'||txid_current(),'x','ADMIN')    RETURNING id INTO v_ua;
    INSERT INTO customers(user_id,full_name) VALUES (v_uc,'T Customer') RETURNING id INTO v_c;
    INSERT INTO staff(user_id,full_name)     VALUES (v_us,'T Staff')    RETURNING id INTO v_s;
    INSERT INTO admins(user_id,full_name)    VALUES (v_ua,'T Admin')    RETURNING id INTO v_a;

    INSERT INTO categories(name) VALUES ('__T_CAT_'||txid_current()) RETURNING id INTO v_cat;
    INSERT INTO products(category_id,name,unit,selling_price,quantity) VALUES (v_cat,'__T_P1','cai',1000,10) RETURNING id INTO v_p1;
    INSERT INTO products(category_id,name,unit,selling_price,quantity) VALUES (v_cat,'__T_P2','cai',500,5)   RETURNING id INTO v_p2;

    INSERT INTO promotion_programs(name,start_date,end_date,status)
      VALUES ('__T_PROMO','2026-01-01','2026-12-31','ACTIVE') RETURNING id INTO v_prog1;
    INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,start_date,end_date)
      VALUES (v_prog1,'__T_V_'||txid_current(),10,5,'2026-01-01','2026-12-31') RETURNING id INTO v_vch;

    -- o1: PENDING co 1 dong (chuoi chuyen trang thai PENDING -> CONFIRMED -> COMPLETED)
    INSERT INTO orders(customer_id,total_amount) VALUES (v_c,2000) RETURNING id INTO v_o1;
    INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (v_o1,v_p1,2,1000,2000);
    -- o2: PENDING (se bi huy)
    INSERT INTO orders(customer_id,total_amount) VALUES (v_c,500) RETURNING id INTO v_o2;
    INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (v_o2,v_p2,1,500,500);
    -- o3: PENDING (se bi xoa, kiem tra cascade)
    INSERT INTO orders(customer_id,total_amount) VALUES (v_c,500) RETURNING id INTO v_o3;
    INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (v_o3,v_p2,1,500,500);
    -- voucher da duoc don hang dung (de test xoa chuong trinh)
    INSERT INTO promotion_programs(name,start_date,end_date,status)
      VALUES ('__T_PROMO_USED','2026-01-01','2026-12-31','ACTIVE') RETURNING id INTO v_prog;
    INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,used_quantity,start_date,end_date)
      VALUES (v_prog,'__T_VU_'||txid_current(),10,5,1,'2026-01-01','2026-12-31') RETURNING id INTO v_vch_used;
    INSERT INTO orders(customer_id,total_amount,voucher_id,discount_amount) VALUES (v_c,0,v_vch_used,0);

    INSERT INTO carts(customer_id) VALUES (v_c) RETURNING id INTO v_cart;

    INSERT INTO suppliers(name) VALUES ('__T_SUPPLIER_'||txid_current()) RETURNING id INTO v_sup;
    -- r1: phieu nhap PENDING co 1 dong (se COMPLETED); r2: PENDING (se bi huy)
    INSERT INTO purchase_receipts(supplier_id,staff_id,total_amount) VALUES (v_sup,v_s,1000) RETURNING id INTO v_r1;
    INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount) VALUES (v_r1,v_p1,10,100,1000);
    INSERT INTO purchase_receipts(supplier_id,staff_id,total_amount) VALUES (v_sup,v_s,0) RETURNING id INTO v_r2;

    INSERT INTO _sales_test_ids(k,v) VALUES
      ('user_c',v_uc),('user_s',v_us),('user_a',v_ua),('customer',v_c),('staff',v_s),('admin',v_a),
      ('cat',v_cat),('p1',v_p1),('p2',v_p2),('prog',v_prog1),('voucher',v_vch),('prog_used',v_prog),
      ('o1',v_o1),('o2',v_o2),('o3',v_o3),('cart',v_cart),('supplier',v_sup),('r1',v_r1),('r2',v_r2);
END $$;

-- =====================================================================
-- TEST 1-6: Role / profile
-- =====================================================================
SELECT pg_temp.assert_error(1,'Staff profile cannot point to a CUSTOMER user',
  format($s$INSERT INTO staff(user_id,full_name) VALUES (%s,'bad')$s$, pg_temp.id('user_c')));
SELECT pg_temp.assert_error(2,'Customer profile cannot point to a STAFF user',
  format($s$INSERT INTO customers(user_id,full_name) VALUES (%s,'bad')$s$, pg_temp.id('user_s')));
SELECT pg_temp.assert_error(3,'One user cannot hold two profiles (STAFF user -> admins)',
  format($s$INSERT INTO admins(user_id,full_name) VALUES (%s,'bad')$s$, pg_temp.id('user_s')));
SELECT pg_temp.assert_error(4,'Role WAREHOUSE_MANAGER no longer exists in users.role',
  $s$INSERT INTO users(username,password_hash,role) VALUES ('__T_WM','x','WAREHOUSE_MANAGER')$s$);
SELECT pg_temp.assert_error(5,'Cannot change users.role while a profile exists',
  format($s$UPDATE users SET role='STAFF' WHERE id=%s$s$, pg_temp.id('user_c')));
SELECT pg_temp.assert_success(6,'Valid CUSTOMER / STAFF / ADMIN profiles exist',
  format($s$SELECT 1/(SELECT count(*)::int FROM users u
              JOIN customers c ON c.user_id=u.id AND u.role='CUSTOMER' AND c.id=%s
              JOIN staff s ON s.user_id=%s AND s.id=%s
              JOIN admins a ON a.user_id=%s AND a.id=%s)$s$,
     pg_temp.id('customer'), pg_temp.id('user_s'), pg_temp.id('staff'), pg_temp.id('user_a'), pg_temp.id('admin')));

-- =====================================================================
-- TEST 7-14: products.quantity
-- =====================================================================
SELECT pg_temp.assert_success(7,'products.quantity defaults to 0',
  format($s$WITH ins AS (INSERT INTO products(category_id,name,unit,selling_price) VALUES (%s,'__T_DEF','cai',1) RETURNING quantity)
            SELECT 1/(CASE WHEN (SELECT quantity FROM ins)=0 THEN 1 ELSE 0 END)$s$, pg_temp.id('cat')));
SELECT pg_temp.assert_error(8,'Cannot insert product with negative quantity',
  format($s$INSERT INTO products(category_id,name,unit,selling_price,quantity) VALUES (%s,'__T_NEG','cai',1,-1)$s$, pg_temp.id('cat')));
SELECT pg_temp.assert_error(9,'Deduct more than stock is rejected (10 - 11)',
  format($s$UPDATE products SET quantity = quantity - 11 WHERE id=%s$s$, pg_temp.id('p1')));
SELECT pg_temp.assert_success(10,'Deduct exactly the stock is allowed (boundary: 5 - 5 = 0)',
  format($s$UPDATE products SET quantity = quantity - 5 WHERE id=%s$s$, pg_temp.id('p2')));
SELECT pg_temp.assert_error(11,'Deduct 1 from zero stock is rejected',
  format($s$UPDATE products SET quantity = quantity - 1 WHERE id=%s$s$, pg_temp.id('p2')));
SELECT pg_temp.assert_success(12,'Restock increases quantity',
  format($s$UPDATE products SET quantity = quantity + 5 WHERE id=%s$s$, pg_temp.id('p2')));
SELECT pg_temp.assert_error(13,'Negative selling_price is rejected',
  format($s$INSERT INTO products(category_id,name,unit,selling_price) VALUES (%s,'__T_PRICE','cai',-1)$s$, pg_temp.id('cat')));
SELECT pg_temp.assert_error(14,'Cannot delete a product that appears in order_items',
  format($s$DELETE FROM products WHERE id=%s$s$, pg_temp.id('p1')));

-- =====================================================================
-- TEST 15-18: cart
-- =====================================================================
SELECT pg_temp.assert_success(15,'Add item to cart',
  format($s$INSERT INTO cart_items(cart_id,product_id,quantity) VALUES (%s,%s,2)$s$, pg_temp.id('cart'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(16,'Same product twice in one cart is rejected',
  format($s$INSERT INTO cart_items(cart_id,product_id,quantity) VALUES (%s,%s,1)$s$, pg_temp.id('cart'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(17,'Cart item quantity 0 is rejected',
  format($s$INSERT INTO cart_items(cart_id,product_id,quantity) VALUES (%s,%s,0)$s$, pg_temp.id('cart'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(18,'A customer cannot have two carts',
  format($s$INSERT INTO carts(customer_id) VALUES (%s)$s$, pg_temp.id('customer')));

-- =====================================================================
-- TEST 19-28: orders / order_items
-- =====================================================================
SELECT pg_temp.assert_error(19,'order_items.amount must equal quantity * unit_price',
  format($s$INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,2,500,1)$s$, pg_temp.id('o1'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(20,'order_items.quantity 0 is rejected',
  format($s$INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,0,500,0)$s$, pg_temp.id('o1'), pg_temp.id('p2')));
SELECT pg_temp.assert_success(21,'Add a valid line to a PENDING order',
  format($s$INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,2,500,1000)$s$, pg_temp.id('o1'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(22,'Invalid order status is rejected (ck_orders_status)',
  format($s$UPDATE orders SET status='SHIPPED', staff_id=%s WHERE id=%s$s$, pg_temp.id('staff'), pg_temp.id('o1')));
SELECT pg_temp.assert_error(23,'CONFIRMED order requires staff_id',
  format($s$UPDATE orders SET status='CONFIRMED' WHERE id=%s$s$, pg_temp.id('o1')));
SELECT pg_temp.assert_success(24,'PENDING -> CONFIRMED with staff_id',
  format($s$UPDATE orders SET status='CONFIRMED', staff_id=%s WHERE id=%s$s$, pg_temp.id('staff'), pg_temp.id('o1')));
SELECT pg_temp.assert_error(25,'Cannot add a line to a CONFIRMED order',
  format($s$INSERT INTO order_items(order_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,1,500,500)$s$, pg_temp.id('o1'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(26,'Cannot edit a line of a CONFIRMED order',
  format($s$UPDATE order_items SET quantity=3, amount=3000 WHERE order_id=%s AND product_id=%s$s$, pg_temp.id('o1'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(27,'Cannot delete a line of a CONFIRMED order',
  format($s$DELETE FROM order_items WHERE order_id=%s AND product_id=%s$s$, pg_temp.id('o1'), pg_temp.id('p1')));
SELECT pg_temp.assert_success(28,'CONFIRMED -> COMPLETED',
  format($s$UPDATE orders SET status='COMPLETED' WHERE id=%s$s$, pg_temp.id('o1')));
SELECT pg_temp.assert_error(29,'COMPLETED order is immutable',
  format($s$UPDATE orders SET total_amount=1 WHERE id=%s$s$, pg_temp.id('o1')));
SELECT pg_temp.assert_success(30,'PENDING -> CANCELLED does not need staff_id',
  format($s$UPDATE orders SET status='CANCELLED' WHERE id=%s$s$, pg_temp.id('o2')));
SELECT pg_temp.assert_error(31,'CANCELLED order is immutable',
  format($s$UPDATE orders SET status='PENDING' WHERE id=%s$s$, pg_temp.id('o2')));
SELECT pg_temp.assert_success(32,'Deleting a PENDING order cascades to its lines',
  format($s$DO $x$ BEGIN
      DELETE FROM orders WHERE id=%s;
      IF EXISTS (SELECT 1 FROM orders WHERE id=%s) OR EXISTS (SELECT 1 FROM order_items WHERE order_id=%s) THEN
        RAISE EXCEPTION 'order or its lines still exist';
      END IF;
    END $x$$s$, pg_temp.id('o3'), pg_temp.id('o3'), pg_temp.id('o3')));
SELECT pg_temp.assert_error(33,'Order staff_id must reference a staff profile (not a customer id)',
  format($s$INSERT INTO orders(customer_id,staff_id,status) VALUES (%s,999999999,'CONFIRMED')$s$, pg_temp.id('customer')));
SELECT pg_temp.assert_error(34,'Negative discount_amount is rejected',
  format($s$INSERT INTO orders(customer_id,discount_amount) VALUES (%s,-1)$s$, pg_temp.id('customer')));

-- =====================================================================
-- TEST 35-44: promotion / voucher
-- =====================================================================
SELECT pg_temp.assert_error(35,'Voucher used_quantity cannot exceed quantity',
  format($s$UPDATE vouchers SET used_quantity = quantity + 1 WHERE id=%s$s$, pg_temp.id('voucher')));
SELECT pg_temp.assert_success(36,'Voucher used_quantity may equal quantity (boundary)',
  format($s$UPDATE vouchers SET used_quantity = quantity WHERE id=%s$s$, pg_temp.id('voucher')));
SELECT pg_temp.assert_error(37,'Voucher discount_percent 0 is rejected',
  format($s$INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,start_date,end_date) VALUES (%s,'__T_V0',0,1,'2026-01-01','2026-02-01')$s$, pg_temp.id('prog')));
SELECT pg_temp.assert_error(38,'Voucher discount_percent > 100 is rejected',
  format($s$INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,start_date,end_date) VALUES (%s,'__T_V101',101,1,'2026-01-01','2026-02-01')$s$, pg_temp.id('prog')));
SELECT pg_temp.assert_error(39,'Voucher end_date before start_date is rejected',
  format($s$INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,start_date,end_date) VALUES (%s,'__T_VD',10,1,'2026-02-01','2026-01-01')$s$, pg_temp.id('prog')));
SELECT pg_temp.assert_error(40,'Duplicate voucher code is rejected',
  format($s$INSERT INTO vouchers(promotion_program_id,code,discount_percent,quantity,start_date,end_date)
            SELECT %s, code, 10, 1, '2026-01-01','2026-02-01' FROM vouchers WHERE id=%s$s$, pg_temp.id('prog'), pg_temp.id('voucher')));
SELECT pg_temp.assert_success(41,'Product discount in a program',
  format($s$INSERT INTO product_discounts(promotion_program_id,product_id,discount_percent,start_date,end_date) VALUES (%s,%s,10,'2026-01-01','2026-06-30')$s$, pg_temp.id('prog'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(42,'Same product twice in one program is rejected',
  format($s$INSERT INTO product_discounts(promotion_program_id,product_id,discount_percent,start_date,end_date) VALUES (%s,%s,20,'2026-01-01','2026-06-30')$s$, pg_temp.id('prog'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(43,'Promotion program end_date before start_date is rejected',
  $s$INSERT INTO promotion_programs(name,start_date,end_date) VALUES ('__T_BAD','2026-02-01','2026-01-01')$s$);
SELECT pg_temp.assert_error(44,'Cannot delete a program whose voucher is used by an order',
  format($s$DELETE FROM promotion_programs WHERE id=%s$s$, pg_temp.id('prog_used')));
SELECT pg_temp.assert_success(45,'Deleting a program cascades to unused vouchers and discounts',
  format($s$DO $x$ BEGIN
      DELETE FROM promotion_programs WHERE id=%s;
      IF EXISTS (SELECT 1 FROM vouchers WHERE id=%s)
         OR EXISTS (SELECT 1 FROM product_discounts WHERE promotion_program_id=%s) THEN
        RAISE EXCEPTION 'voucher or product discount still exists';
      END IF;
    END $x$$s$,
    (SELECT promotion_program_id FROM vouchers WHERE id=pg_temp.id('voucher')), pg_temp.id('voucher'),
    (SELECT promotion_program_id FROM vouchers WHERE id=pg_temp.id('voucher'))));

-- =====================================================================
-- TEST 46-60: suppliers / purchase receipts (nhap hang theo san pham)
-- =====================================================================
SELECT pg_temp.assert_success(46,'Add a valid line to a PENDING purchase receipt',
  format($s$INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,3,400,1200)$s$, pg_temp.id('r1'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(47,'purchase_receipt_items.amount must equal quantity * unit_price',
  format($s$INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,2,400,1)$s$, pg_temp.id('r2'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(48,'purchase_receipt_items.quantity 0 is rejected',
  format($s$INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,0,400,0)$s$, pg_temp.id('r2'), pg_temp.id('p2')));
SELECT pg_temp.assert_error(49,'Same product twice in one receipt is rejected',
  format($s$INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount) VALUES (%s,%s,1,100,100)$s$, pg_temp.id('r1'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(51,'Invalid receipt status is rejected',
  format($s$UPDATE purchase_receipts SET status='DONE' WHERE id=%s$s$, pg_temp.id('r1')));

SELECT pg_temp.assert_success(52,'PENDING -> COMPLETED',
  format($s$UPDATE purchase_receipts SET status='COMPLETED' WHERE id=%s$s$, pg_temp.id('r1')));
SELECT pg_temp.assert_error(53,'Cannot add a line to a COMPLETED receipt',
  format($s$INSERT INTO purchase_receipt_items(purchase_receipt_id,product_id,quantity,unit_price,amount)
            SELECT %s, id, 1, 1, 1 FROM products WHERE name='__T_DEF'$s$, pg_temp.id('r1')));
SELECT pg_temp.assert_error(54,'Cannot edit a line of a COMPLETED receipt',
  format($s$UPDATE purchase_receipt_items SET quantity=99, amount=99*unit_price WHERE purchase_receipt_id=%s AND product_id=%s$s$, pg_temp.id('r1'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(55,'Cannot delete a line of a COMPLETED receipt',
  format($s$DELETE FROM purchase_receipt_items WHERE purchase_receipt_id=%s AND product_id=%s$s$, pg_temp.id('r1'), pg_temp.id('p1')));
SELECT pg_temp.assert_error(56,'COMPLETED receipt is immutable',
  format($s$UPDATE purchase_receipts SET total_amount=1 WHERE id=%s$s$, pg_temp.id('r1')));
SELECT pg_temp.assert_success(57,'PENDING -> CANCELLED',
  format($s$UPDATE purchase_receipts SET status='CANCELLED' WHERE id=%s$s$, pg_temp.id('r2')));
SELECT pg_temp.assert_error(58,'CANCELLED receipt is immutable',
  format($s$UPDATE purchase_receipts SET status='PENDING' WHERE id=%s$s$, pg_temp.id('r2')));
SELECT pg_temp.assert_error(59,'Receipt staff_id is NOT NULL',
  format($s$INSERT INTO purchase_receipts(supplier_id,staff_id) VALUES (%s,NULL)$s$, pg_temp.id('supplier')));
SELECT pg_temp.assert_error(60,'Receipt supplier must exist',
  format($s$INSERT INTO purchase_receipts(supplier_id,staff_id) VALUES (999999999,%s)$s$, pg_temp.id('staff')));
SELECT pg_temp.assert_error(62,'Cannot delete a supplier that has receipts',
  format($s$DELETE FROM suppliers WHERE id=%s$s$, pg_temp.id('supplier')));
SELECT pg_temp.assert_success(63,'Restock products after a COMPLETED receipt (application step)',
  format($s$UPDATE products SET quantity = quantity + 10 WHERE id=%s$s$, pg_temp.id('p1')));

-- =====================================================================
-- TEST 64-67: discount periods / order <-> voucher
-- =====================================================================
SELECT pg_temp.assert_error(64,'product_discounts end_date before start_date is rejected',
  format($s$INSERT INTO product_discounts(promotion_program_id,product_id,discount_percent,start_date,end_date) VALUES (%s,%s,5,'2026-02-01','2026-01-01')$s$, pg_temp.id('prog_used'), pg_temp.id('p2')));
SELECT pg_temp.assert_success(65,'Order discount tier with a valid period',
  format($s$INSERT INTO order_discounts(promotion_program_id,minimum_amount,discount_percent,start_date,end_date) VALUES (%s,1000000,5,'2026-01-01','2026-06-30')$s$, pg_temp.id('prog_used')));
SELECT pg_temp.assert_error(66,'order_discounts end_date before start_date is rejected',
  format($s$INSERT INTO order_discounts(promotion_program_id,minimum_amount,discount_percent,start_date,end_date) VALUES (%s,2000000,5,'2026-02-01','2026-01-01')$s$, pg_temp.id('prog_used')));
SELECT pg_temp.assert_success(67,'Order can reference a voucher with a discount_amount',
  format($s$INSERT INTO orders(customer_id,voucher_id,discount_amount,total_amount) VALUES (%s,%s,100,900)$s$, pg_temp.id('customer'),
     (SELECT id FROM vouchers WHERE promotion_program_id=pg_temp.id('prog_used') LIMIT 1)));

-- =====================================================================
-- FINAL REPORT
-- =====================================================================
SELECT test_no, test_name, expected, result, detail FROM _sales_test_results ORDER BY test_no;

DO $$
DECLARE v_total INTEGER; v_pass INTEGER; v_fail INTEGER;
BEGIN
    SELECT count(*), count(*) FILTER (WHERE result='PASS'), count(*) FILTER (WHERE result='FAIL')
      INTO v_total, v_pass, v_fail FROM _sales_test_results;
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'SALES DATABASE TEST SUMMARY: % total | % PASS | % FAIL', v_total, v_pass, v_fail;
    IF v_fail = 0 THEN RAISE NOTICE 'ALL SALES DATABASE TESTS PASSED';
    ELSE RAISE NOTICE 'SALES DATABASE TESTS HAVE FAILURES - inspect the result table above'; END IF;
    RAISE NOTICE 'All test data will now be rolled back.';
    RAISE NOTICE '============================================================';
END $$;

ROLLBACK;
