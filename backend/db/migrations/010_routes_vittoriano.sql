-- Cập nhật thông số khoảng cách cho Tuyến La Mã cổ đại và thêm Tuyến kết nối 4 di sản (có Vittoriano)
UPDATE tour_route
SET total_distance_km = 2.05,
    estimated_duration_minutes = 200,
    description = 'Ba công trình biểu tượng thời La Mã cổ đại ở trung tâm Roma, nối liền bằng trục phố đi bộ lịch sử Via dei Fori Imperiali và Via del Plebiscito.'
WHERE route_id = '11111111-1111-4111-8111-111111111111';

INSERT INTO tour_route (route_id, name, description, total_distance_km, estimated_duration_minutes, arcgis_feature_id)
VALUES
  ('22222222-2222-4222-8222-222222222222',
   'Hành trình Đại lộ Đế chế & Quảng trường Venezia',
   'Cung đường tham quan trọn vẹn 4 công trình biểu tượng tại trung tâm Roma: từ Đấu trường La Mã, Khải hoàn môn Constantine, qua Đại lộ Via dei Fori Imperiali tới Đài tưởng niệm Vittorio Emanuele II và kết thúc tại Đền Pantheon.',
   2.05, 260, NULL)
ON CONFLICT (route_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  total_distance_km = EXCLUDED.total_distance_km,
  estimated_duration_minutes = EXCLUDED.estimated_duration_minutes;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '22222222-2222-4222-8222-222222222222', destination_id, 1, 90
FROM tourist_destination WHERE slug = 'colosseum'
ON CONFLICT (route_id, stop_order) DO UPDATE SET destination_id = EXCLUDED.destination_id, stay_minutes = EXCLUDED.stay_minutes;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '22222222-2222-4222-8222-222222222222', destination_id, 2, 20
FROM tourist_destination WHERE slug = 'arch-of-constantine'
ON CONFLICT (route_id, stop_order) DO UPDATE SET destination_id = EXCLUDED.destination_id, stay_minutes = EXCLUDED.stay_minutes;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '22222222-2222-4222-8222-222222222222', destination_id, 3, 60
FROM tourist_destination WHERE slug = 'vittoriano'
ON CONFLICT (route_id, stop_order) DO UPDATE SET destination_id = EXCLUDED.destination_id, stay_minutes = EXCLUDED.stay_minutes;

INSERT INTO route_stop (route_id, destination_id, stop_order, stay_minutes)
SELECT '22222222-2222-4222-8222-222222222222', destination_id, 4, 55
FROM tourist_destination WHERE slug = 'pantheon'
ON CONFLICT (route_id, stop_order) DO UPDATE SET destination_id = EXCLUDED.destination_id, stay_minutes = EXCLUDED.stay_minutes;
