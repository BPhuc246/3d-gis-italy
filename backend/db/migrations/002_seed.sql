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
   'Đấu trường Flavian (Colosseum) là kiệt tác vĩ đại nhất của kỹ thuật xây dựng La Mã cổ đại. Với quy mô 4 tầng vòm đá travertine, hệ thống 80 cửa thoát hiểm vomitoria và mê cung hầm ngầm Hypogeum tinh vi, nơi đây từng tổ chức các trận quyết chiến giác đấu và đại hội kịch tính cho hơn 50.000 khán giả.',
   'Piazza del Colosseo, 1, 00184 Roma, Italia', 41.8902, 12.4922, 'landmark',
   '08:30 – 19:15 (mùa hè) / 16:30 (mùa đông). Cần đặt trước vé giờ cố định.', 18.00, 'EUR',
   '/_local/images/colosseum-exterior.jpg',
   'REPLACE_COLOSSEUM_EXTERIOR', 'REPLACE_COLOSSEUM_INTERIOR'),
  ('arch-of-constantine', 'Khải hoàn môn Constantine',
   'Khải hoàn môn lớn nhất thế giới La Mã còn tồn tại nguyên vẹn, dựng năm 315 SCN để vinh danh chiến thắng Cầu Milvian của Hoàng đế Constantine I. Công trình nổi bật với ba lối vòm đá cẩm thạch trắng cân xứng cùng các bức phù điêu đỉnh cao được kế thừa từ thời các minh quân Trajan, Hadrian và Marcus Aurelius.',
   'Via di San Gregorio, Roma, Italia', 41.8898, 12.4905, 'landmark',
   'Không gian ngoài trời trên trục đường Via Triumphalis, tham quan tự do 24/7.', 0.00, 'EUR',
   '/_local/images/constantine-wide.jpg',
   'REPLACE_ARCH_EXTERIOR', NULL),
  ('pantheon', 'Đền Pantheon',
   'Ngôi đền cổ đại được bảo tồn hoàn hảo nhất thế giới, tái thiết dưới triều Hoàng đế Hadrian. Không gian kết hợp tiền sảnh 16 cột đá hoa cương Ai Cập nguyên khối nặng 60 tấn với đại sảnh tròn Rotunda dưới mái vòm bê tông không cốt thép lớn nhất thế giới suốt 2.000 năm, được thắp sáng huyền diệu bởi "Con mắt của Rome" – lỗ mở Oculus 9m.',
   'Piazza della Rotonda, 00186 Roma, Italia', 41.8986, 12.4769, 'landmark',
   '09:00 – 19:00 hàng ngày (lượt vào cuối 18:30).', 5.00, 'EUR',
   '/_local/images/pantheon-exterior.jpg',
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
