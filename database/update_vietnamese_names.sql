-- =====================================================================
-- SCRIPT CẬP NHẬT TÊN SẢN PHẨM & DANH MỤC CÓ DẤU TIẾNG VIỆT CHUẨN TRÊN SUPABASE
-- =====================================================================

-- 1. CẬP NHẬT TÊN DANH MỤC CÓ DẤU
UPDATE public.categories SET name = 'Sofa và ghế thư giãn', description = 'Các loại sofa phòng khách, ghế thư giãn cao cấp' WHERE id = 1;
UPDATE public.categories SET name = 'Bàn ăn', description = 'Bàn ăn gỗ, bàn ăn mặt đá, bàn ăn thông minh' WHERE id = 2;
UPDATE public.categories SET name = 'Ghế ăn và ghế bar', description = 'Ghế ăn gia đình, ghế bar cao' WHERE id = 3;
UPDATE public.categories SET name = 'Giường ngủ', description = 'Giường gỗ, giường bọc nệm, giường tầng' WHERE id = 4;
UPDATE public.categories SET name = 'Tủ quần áo và tủ giày', description = 'Tủ gỗ công nghiệp, tủ cánh kính, tủ thông minh' WHERE id = 5;
UPDATE public.categories SET name = 'Bàn và ghế văn phòng', description = 'Bàn làm việc, ghế xoay, ghế công thái học' WHERE id = 6;
UPDATE public.categories SET name = 'Kệ sách và kệ tivi', description = 'Kệ sách, kệ tivi, tủ trưng bày' WHERE id = 7;
UPDATE public.categories SET name = 'Đèn trang trí', description = 'Đèn chùm, đèn sàn, đèn bàn, đèn tường' WHERE id = 8;
UPDATE public.categories SET name = 'Thảm và rèm cửa', description = 'Thảm trải sàn, rèm vải, rèm cuốn' WHERE id = 9;
UPDATE public.categories SET name = 'Nệm và phụ kiện giường', description = 'Nệm cao su, nệm lò xo, gối, chăn ga' WHERE id = 10;

-- 2. CẬP NHẬT TÊN VÀ MÔ TẢ SẢN PHẨM CÓ DẤU TIẾNG VIỆT
UPDATE public.products SET name = 'Sofa góc chữ L vải bọc Milan', description = 'Sofa góc 3m, khung gỗ sồi, vải bọc chống thấm' WHERE id = 1;
UPDATE public.products SET name = 'Sofa băng 3 chỗ da PU Oslo', description = 'Sofa băng dài 2m1, da PU cao cấp' WHERE id = 2;
UPDATE public.products SET name = 'Ghế thư giãn bập bênh Relax', description = 'Ghế thư giãn ngả lưng, bọc vải bập bênh' WHERE id = 3;
UPDATE public.products SET name = 'Bàn ăn gỗ cao su 6 chỗ Nordic', description = 'Bàn ăn chữ nhật 1m6, gỗ cao su tự nhiên' WHERE id = 4;
UPDATE public.products SET name = 'Bàn ăn mặt đá ceramic 4 chỗ Venus', description = 'Bàn ăn mặt đá ceramic 1m2, chân thép sơn tĩnh điện' WHERE id = 5;
UPDATE public.products SET name = 'Ghế ăn gỗ sồi đệm bọc Luna', description = 'Ghế ăn khung gỗ sồi, đệm bọc vải' WHERE id = 6;
UPDATE public.products SET name = 'Ghế bar chân sắt Loft', description = 'Ghế bar cao 75cm, chân sắt sơn đen' WHERE id = 7;
UPDATE public.products SET name = 'Giường ngủ gỗ sồi 1m8 Hana', description = 'Giường gỗ sồi tự nhiên, kích thước 1m8 x 2m' WHERE id = 8;
UPDATE public.products SET name = 'Giường bọc nệm 1m6 Royal', description = 'Giường bọc nệm đầu giường, kích thước 1m6 x 2m' WHERE id = 9;
UPDATE public.products SET name = 'Tủ quần áo 3 cánh gỗ MDF Alice', description = 'Tủ quần áo 3 cánh, gỗ MDF chống ẩm' WHERE id = 10;
UPDATE public.products SET name = 'Tủ giày thông minh 5 tầng', description = 'Tủ giày cánh lật, gỗ công nghiệp' WHERE id = 11;
UPDATE public.products SET name = 'Bàn làm việc chân sắt 1m2 Office', description = 'Bàn làm việc mặt gỗ MDF, chân sắt chữ U' WHERE id = 12;
UPDATE public.products SET name = 'Ghế công thái học Ergo', description = 'Ghế lưới tựa lưng, kê tay 3D, nâng hạ khí nén' WHERE id = 13;
UPDATE public.products SET name = 'Kệ sách gỗ 5 tầng Bookie', description = 'Kệ sách 5 tầng, gỗ công nghiệp phủ melamine' WHERE id = 14;
UPDATE public.products SET name = 'Kệ tivi gỗ óc chó 1m8 Nova', description = 'Kệ tivi 1m8 có ngăn kéo, gỗ óc chó' WHERE id = 15;
UPDATE public.products SET name = 'Đèn chùm pha lê 8 bóng', description = 'Đèn chùm phòng khách, khung mạ vàng' WHERE id = 16;
UPDATE public.products SET name = 'Đèn sàn thông trụ Arc', description = 'Đèn sàn cao 1m8, thân kim loại' WHERE id = 17;
UPDATE public.products SET name = 'Thảm lông ngắn phòng khách 2x3m', description = 'Thảm lông ngắn chống bụi, kích thước 2m x 3m' WHERE id = 18;
UPDATE public.products SET name = 'Rèm cửa vải chống nắng 2.4m', description = 'Rèm vải 2 lớp chống nắng, cao 2m4' WHERE id = 19;
UPDATE public.products SET name = 'Nệm cao su non 1m6 Dreamy', description = 'Nệm cao su non 1m6 x 2m, dày 15cm' WHERE id = 20;
