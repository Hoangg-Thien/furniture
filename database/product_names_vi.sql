-- Correct only names for the original products; abort if any ID or expected name differs.
BEGIN;
DO $$
DECLARE updated_count integer;
BEGIN
    UPDATE public.products AS p
    SET name = names.new_name
    FROM (VALUES
        (1, 'Sofa goc chu L vai boc Milan', 'Sofa góc chữ L vải bọc Milan'),
        (2, 'Sofa bang 3 cho da PU Oslo', 'Sofa băng 3 chỗ da PU Oslo'),
        (3, 'Ghe thu gian boc benh Relax', 'Ghế thư giãn bập bênh Relax'),
        (4, 'Ban an go cao su 6 cho Nordic', 'Bàn ăn gỗ cao su 6 chỗ Nordic'),
        (5, 'Ban an mat da ceramic 4 cho Venus', 'Bàn ăn mặt đá ceramic 4 chỗ Venus'),
        (6, 'Ghe an go soi dem boc Luna', 'Ghế ăn gỗ sồi đệm bọc Luna'),
        (7, 'Ghe bar chan sat Loft', 'Ghế bar chân sắt Loft'),
        (8, 'Giuong ngu go soi 1m8 Hana', 'Giường ngủ gỗ sồi 1m8 Hana'),
        (9, 'Giuong boc nem 1m6 Royal', 'Giường bọc nệm 1m6 Royal'),
        (10, 'Tu quan ao 3 canh go MDF Alice', 'Tủ quần áo 3 cánh gỗ MDF Alice'),
        (11, 'Tu giay thong minh 5 tang', 'Tủ giày thông minh 5 tầng'),
        (12, 'Ban lam viec chan sat 1m2 Office', 'Bàn làm việc chân sắt 1m2 Office'),
        (13, 'Ghe cong thai hoc Ergo', 'Ghế công thái học Ergo'),
        (14, 'Ke sach go 5 tang Bookie', 'Kệ sách gỗ 5 tầng Bookie'),
        (15, 'Ke tivi go oc cho 1m8 Nova', 'Kệ tivi gỗ óc chó 1m8 Nova'),
        (16, 'Den chum pha le 8 bong', 'Đèn chùm pha lê 8 bóng'),
        (17, 'Den san thong tru Arc', 'Đèn sàn thông trụ Arc'),
        (18, 'Tham long ngan phong khach 2x3m', 'Thảm lông ngắn phòng khách 2x3m'),
        (19, 'Rem cua vai chong nang 2.4m', 'Rèm cửa vải chống nắng 2.4m'),
        (20, 'Nem cao su non 1m6 Dreamy', 'Nệm cao su non 1m6 Dreamy')
    ) AS names(id, old_name, new_name)
    WHERE p.id = names.id AND p.name IN (names.old_name, names.new_name);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 20 THEN
        RAISE EXCEPTION 'Expected 20 matching products, found %. No names were changed.', updated_count;
    END IF;
END $$;
COMMIT;
