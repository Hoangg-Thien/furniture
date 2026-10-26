-- =====================================================================
-- SCRIPT THÊM VÀ ĐỒNG BỘ TÀI KHOẢN ADMIN (MẬT KHẨU: 123456) VÀO SUPABASE
-- Tài khoản 1: admin / 123456
-- Tài khoản 2: admin01 / 123456
-- =====================================================================

-- 1. Thêm hoặc cập nhật tài khoản 'admin' với mật khẩu '123456'
-- Hash SHA-256 của '123456': 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
INSERT INTO public.users (username, password_hash, role, is_active)
VALUES ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'ADMIN', true)
ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  role = 'ADMIN',
  is_active = true;

-- 2. Thêm profile quản trị viên vào bảng 'admins' cho tài khoản 'admin'
INSERT INTO public.admins (user_id, full_name, email, phone, address, role)
SELECT id, 'Tổng Quản Trị Viên (Admin)', 'admin@furniture.com', '0901888999', 'Hệ thống Quản trị Furniture', 'ADMIN'
FROM public.users WHERE username = 'admin'
ON CONFLICT (user_id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = 'ADMIN';

-- 3. Cập nhật mật khẩu '123456' cho các tài khoản admin01, admin02, admin03
UPDATE public.users 
SET password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
WHERE username IN ('admin01', 'admin02', 'admin03');

-- 4. Đảm bảo admin01 có liên kết trong bảng admins
INSERT INTO public.admins (user_id, full_name, email, phone, address, role)
SELECT id, 'Nguyễn Quang Minh (Admin 01)', 'minh.admin@example.com', '0901000001', '25 Le Loi, Quan 1, TP.HCM', 'ADMIN'
FROM public.users WHERE username = 'admin01'
ON CONFLICT (user_id) DO NOTHING;

-- 5. Đồng bộ lại sequence tự tăng cho PostgreSQL
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('public.admins', 'id'), COALESCE((SELECT MAX(id) FROM public.admins), 0) + 1, false);
