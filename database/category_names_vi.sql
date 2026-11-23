-- Correct the original categories only; abort if any expected record differs.
BEGIN;
DO $$
DECLARE updated_count integer;
BEGIN
    UPDATE public.categories AS c
    SET name = names.new_name, description = names.new_description
    FROM (VALUES
        (1, 'Sofa va ghe thu gian', 'Sofa goc, sofa bang, ghe thu gian phong khach', 'Sofa và ghế thư giãn', 'Sofa góc, sofa băng, ghế thư giãn phòng khách'),
        (2, 'Ban an', 'Ban an go, ban an mat da cac kich thuoc', 'Bàn ăn', 'Bàn ăn gỗ, bàn ăn mặt đá các kích thước'),
        (3, 'Ghe an va ghe bar', 'Ghe an, ghe bar, ghe quay bar', 'Ghế ăn và ghế bar', 'Ghế ăn, ghế bar, ghế quầy bar'),
        (4, 'Giuong ngu', 'Giuong go, giuong boc nem, giuong ngu thong minh', 'Giường ngủ', 'Giường gỗ, giường bọc nệm, giường ngủ thông minh'),
        (5, 'Tu quan ao va tu giay', 'Tu quan ao canh mo, canh lua, tu giay', 'Tủ quần áo và tủ giày', 'Tủ quần áo cánh mở, cánh lùa, tủ giày'),
        (6, 'Ban va ghe van phong', 'Ban lam viec, ghe cong thai hoc', 'Bàn và ghế văn phòng', 'Bàn làm việc, ghế công thái học'),
        (7, 'Ke sach va ke tivi', 'Ke sach, ke tivi, tu trung bay', 'Kệ sách và kệ tivi', 'Kệ sách, kệ tivi, tủ trưng bày'),
        (8, 'Den trang tri', 'Den chum, den san, den ban, den tuong', 'Đèn trang trí', 'Đèn chùm, đèn sàn, đèn bàn, đèn tường'),
        (9, 'Tham va rem cua', 'Tham trai san, rem vai, rem cuon', 'Thảm và rèm cửa', 'Thảm trải sàn, rèm vải, rèm cuốn'),
        (10, 'Nem va phu kien giuong', 'Nem cao su, nem lo xo, goi, chan ga', 'Nệm và phụ kiện giường', 'Nệm cao su, nệm lò xo, gối, chăn ga')
    ) AS names(id, old_name, old_description, new_name, new_description)
    WHERE c.id = names.id
      AND c.name IN (names.old_name, names.new_name)
      AND c.description IN (names.old_description, names.new_description);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 10 THEN
        RAISE EXCEPTION 'Expected 10 matching categories, found %. No categories were changed.', updated_count;
    END IF;
END $$;
COMMIT;
