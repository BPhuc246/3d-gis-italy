-- =====================================================================
-- QUERY HỮU ÍCH (psql, DBeaver, TablePlus, pgAdmin)
-- =====================================================================

-- 1. Chỉnh kích thước và hình dạng công trình
UPDATE tourist_destination
SET building_shape = 'ellipse', footprint_length_m = 188, footprint_width_m = 156,
    height_m = 48, heading_deg = 0
WHERE slug = 'colosseum';

-- 2. Xoay công trình quanh trục đứng (0 đến 359 độ)
UPDATE tourist_destination SET heading_deg = 45 WHERE slug = 'arch-of-constantine';

-- 3. Bật / tắt không gian bên trong (NULL = tắt, nút "Vào bên trong" sẽ ẩn)
UPDATE tourist_destination SET interior_height_m = 30 WHERE slug = 'arch-of-constantine';
UPDATE tourist_destination SET interior_height_m = NULL WHERE slug = 'pantheon';

-- 4. Đổi màu hiển thị (mã hex 6 chữ số)
UPDATE tourist_destination SET display_color = '#b8a07a' WHERE slug = 'colosseum';

-- 5. Di chuyển công trình trên bản đồ
UPDATE tourist_destination SET latitude = 41.8902, longitude = 12.4922 WHERE slug = 'colosseum';

-- 6. Xem các công trình trong khu vực và số liệu dựng hình
SELECT r.slug AS khu_vuc, d.slug, d.building_shape, d.footprint_length_m,
       d.footprint_width_m, d.height_m, d.heading_deg, d.interior_height_m
FROM tourist_destination d
JOIN map_region r ON r.region_id = d.region_id
ORDER BY d.name;

-- 7. Thêm khu vực mới
INSERT INTO map_region (slug, name, description, center_latitude, center_longitude)
VALUES ('firenze-trung-tam', 'Trung tâm Firenze', 'Khu vực trung tâm Firenze.', 43.7731, 11.2560)
ON CONFLICT (slug) DO NOTHING;

-- 8. Chuyển một công trình sang khu vực khác
UPDATE tourist_destination
SET region_id = (SELECT region_id FROM map_region WHERE slug = 'firenze-trung-tam')
WHERE slug = 'pantheon';

-- 9. Cập nhật giờ mở cửa và giá vé khi đã xác minh
UPDATE tourist_destination
SET opening_hours = '08:30 - 19:15 (theo mùa)', entry_fee = 16.00, entry_fee_currency = 'EUR'
WHERE slug = 'colosseum';

-- 10. Thêm danh mục mới
INSERT INTO destination_category (code, label) VALUES ('nature', 'Thiên nhiên')
ON CONFLICT (code) DO NOTHING;
