-- Danh mục
INSERT INTO destination_category (code, label) VALUES
  ('landmark', 'Di tích'),
  ('museum', 'Bảo tàng'),
  ('religious', 'Tôn giáo')
ON CONFLICT (code) DO NOTHING;

-- Địa điểm mẫu.
-- Các giá trị REPLACE_... là placeholder, cần thay bằng Scene Item ID thật (xem HUONG_DAN.md).
-- Giờ mở cửa và giá vé để trống/chung chung vì chưa xác minh.
INSERT INTO tourist_destination
  (slug, name, description, address, latitude, longitude, category,
   opening_hours, entry_fee, entry_fee_currency, cover_image_url,
   arcgis_exterior_scene_item_id, arcgis_interior_scene_item_id)
VALUES
  ('colosseum', 'Đấu trường La Mã (Colosseum)',
   'Đấu trường lớn nhất thế giới cổ đại, nơi tổ chức các trận đấu đấu sĩ và sự kiện công cộng.',
   'Piazza del Colosseo, 1, 00184 Roma, Italia', 41.8902, 12.4922, 'landmark',
   'Xem website chính thức để biết giờ mở cửa theo mùa', NULL, 'EUR',
   'https://placehold.co/1200x800?text=Colosseum',
   'REPLACE_COLOSSEUM_EXTERIOR', 'REPLACE_COLOSSEUM_INTERIOR'),
  ('arch-of-constantine', 'Khải hoàn môn Constantine',
   'Khải hoàn môn kỷ niệm chiến thắng của Hoàng đế Constantine I, nằm cạnh Colosseum.',
   'Via di San Gregorio, Roma, Italia', 41.8898, 12.4905, 'landmark',
   'Ngoài trời, xem website chính thức để biết thêm', NULL, 'EUR',
   'https://placehold.co/1200x800?text=Arch+of+Constantine',
   'REPLACE_ARCH_EXTERIOR', NULL),
  ('pantheon', 'Đền Pantheon',
   'Ngôi đền La Mã cổ với mái vòm bê tông không cốt thép, từng là vòm lớn nhất thế giới trong nhiều thế kỷ.',
   'Piazza della Rotonda, 00186 Roma, Italia', 41.8986, 12.4769, 'landmark',
   'Xem website chính thức để biết giờ mở cửa', NULL, 'EUR',
   'https://placehold.co/1200x800?text=Pantheon',
   'REPLACE_PANTHEON_EXTERIOR', 'REPLACE_PANTHEON_INTERIOR')
ON CONFLICT (slug) DO NOTHING;

-- Tuyến mẫu (UUID cố định để seed chạy lại an toàn)
INSERT INTO tour_route (route_id, name, description, total_distance_km, estimated_duration_minutes, arcgis_feature_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Tuyến La Mã cổ đại',
   'Ba công trình cổ nằm gần nhau ở trung tâm Roma, có thể đi bộ.',
   NULL, 180, NULL)
ON CONFLICT (route_id) DO NOTHING;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '11111111-1111-4111-8111-111111111111', destination_id, 1, 90
FROM tourist_destination WHERE slug = 'colosseum'
ON CONFLICT (route_id, stop_order) DO NOTHING;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '11111111-1111-4111-8111-111111111111', destination_id, 2, 20
FROM tourist_destination WHERE slug = 'arch-of-constantine'
ON CONFLICT (route_id, stop_order) DO NOTHING;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '11111111-1111-4111-8111-111111111111', destination_id, 3, 60
FROM tourist_destination WHERE slug = 'pantheon'
ON CONFLICT (route_id, stop_order) DO NOTHING;
