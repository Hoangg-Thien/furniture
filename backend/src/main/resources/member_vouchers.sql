DO $$
BEGIN
    LOCK TABLE public.promotion_programs IN SHARE ROW EXCLUSIVE MODE;

    WITH presets(code, tier, percent) AS (VALUES
        ('UUDAIBAC', 'SILVER', 5), ('UUDAIVANG', 'GOLD', 7),
        ('UUDAIBACHKIM', 'PLATINUM', 8), ('UUDAIKIMCUONG', 'VIP_DIAMOND', 10)
    ), missing AS (
        SELECT p.* FROM presets p
        WHERE NOT EXISTS (SELECT 1 FROM public.vouchers v WHERE UPPER(v.code) = p.code)
    ), existing_program AS (
        SELECT id, start_date, end_date FROM public.promotion_programs
        WHERE name = 'Ưu đãi thành viên' ORDER BY id LIMIT 1
    ), new_program AS (
        INSERT INTO public.promotion_programs (name, description, start_date, end_date, status)
        SELECT 'Ưu đãi thành viên', 'Voucher mặc định theo hạng thành viên', LOCALTIMESTAMP,
            TIMESTAMP '2099-12-31 23:59:59', 'ACTIVE'
        WHERE EXISTS (SELECT 1 FROM missing) AND NOT EXISTS (SELECT 1 FROM existing_program)
        RETURNING id, start_date, end_date
    ), program AS (
        SELECT * FROM existing_program UNION ALL SELECT * FROM new_program
    )
    INSERT INTO public.vouchers (promotion_program_id, code, voucher_type, customer_tier,
        discount_percent, minimum_amount, maximum_discount, quantity, start_date, end_date, status)
    SELECT program.id, missing.code, 'VIP', missing.tier, missing.percent,
        5000000, 1000000, 100, program.start_date, program.end_date, 'INACTIVE'
    FROM missing CROSS JOIN program
    ON CONFLICT (code) DO NOTHING;
END;
$$;
