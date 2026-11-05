-- Replace only the original sample URLs; preserve images changed by the admin.
UPDATE public.products p
SET image_url = replacement.image_url
FROM (VALUES
    (13, 'https://images.unsplash.com/photo-1580481077190-736134b223c6?auto=format&fit=crop&w=900&q=85', '/images/ghe_ergo.jpg'),
    (14, 'https://images.unsplash.com/photo-1594671581654-27d5303d3d45?auto=format&fit=crop&w=900&q=85', '/images/ke_5_tang.jpg')
) AS replacement(id, old_url, image_url)
WHERE p.id = replacement.id AND p.image_url = replacement.old_url;

DO $$
BEGIN
    IF to_regclass('public.product_images') IS NOT NULL THEN
        UPDATE public.product_images pi
        SET image_url = replacement.image_url
        FROM (VALUES
            (13, 'https://images.unsplash.com/photo-1580481077190-736134b223c6?auto=format&fit=crop&w=900&q=85', '/images/ghe_ergo.jpg'),
            (14, 'https://images.unsplash.com/photo-1594671581654-27d5303d3d45?auto=format&fit=crop&w=900&q=85', '/images/ke_5_tang.jpg')
        ) AS replacement(id, old_url, image_url)
        WHERE pi.product_id = replacement.id AND pi.image_url = replacement.old_url;
    END IF;
END $$;
