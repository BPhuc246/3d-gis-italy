-- Thêm Đài tưởng niệm Vittorio Emanuele II (Altare della Patria / Il Vittoriano)
INSERT INTO tourist_destination
  (slug, name, description, address, latitude, longitude, category,
   opening_hours, entry_fee, entry_fee_currency, cover_image_url,
   region_id, building_shape, footprint_length_m, footprint_width_m,
   height_m, heading_deg, interior_height_m, display_color)
VALUES
  ('vittoriano',
   'Đài tưởng niệm Vittorio Emanuele II',
   'Đài tưởng niệm Quốc gia tôn vinh Vị vua đầu tiên thống nhất nước Ý và Bàn thờ Tổ quốc (Altare della Patria), kiệt tác kiến trúc tân cổ điển đồ sộ bằng đá cẩm thạch trắng Botticino tọa lạc uy nghi tại Quảng trường Venezia với hàng cột Corinthian hình vòng cung, tượng đồng kỵ mã và Mộ Chiến sĩ Vô danh có ngọn lửa vĩnh cửu.',
   'Piazza Venezia, 00186 Roma, Italia',
   41.894650, 12.483120, 'landmark',
   '09:30 – 19:30 hàng ngày (lượt vào cuối 18:45). Bậc thang ngoài trời: miễn phí; vé VIVE (bảo tàng & thang máy sân thượng): 18 €.', 18.00, 'EUR',
   '/_local/images/vittoriano-exterior.jpg',
   (SELECT region_id FROM map_region WHERE slug = 'roma-trung-tam'),
   'rectangle', 138.00, 170.00, 81.00, 343.0, NULL, '#e6e2d8')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  category = EXCLUDED.category,
  opening_hours = EXCLUDED.opening_hours,
  entry_fee = EXCLUDED.entry_fee,
  entry_fee_currency = EXCLUDED.entry_fee_currency,
  cover_image_url = EXCLUDED.cover_image_url,
  region_id = EXCLUDED.region_id,
  building_shape = EXCLUDED.building_shape,
  footprint_length_m = EXCLUDED.footprint_length_m,
  footprint_width_m = EXCLUDED.footprint_width_m,
  height_m = EXCLUDED.height_m,
  heading_deg = EXCLUDED.heading_deg,
  interior_height_m = EXCLUDED.interior_height_m,
  display_color = EXCLUDED.display_color;

-- Thêm mô hình Sketchfab vào destination_embed
INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'exterior',
       'https://sketchfab.com/models/b1328999fad84b6daf21f73708d42f30/embed',
       'Victor Emmanuel II Monument,altare,roma,scan by asensio on Sketchfab', 0
FROM tourist_destination WHERE slug = 'vittoriano'
ON CONFLICT (destination_id, kind) DO UPDATE SET
  embed_url = EXCLUDED.embed_url,
  credit = EXCLUDED.credit,
  sort_order = EXCLUDED.sort_order;

-- Thêm ảnh vào destination_image
INSERT INTO destination_image (destination_id, image_url, image_type, caption, is_primary)
SELECT destination_id, '/_local/images/vittoriano-exterior.jpg', 'cover', 'Mặt tiền Đài tưởng niệm Vittorio Emanuele II từ Quảng trường Venezia', TRUE
FROM tourist_destination WHERE slug = 'vittoriano'
ON CONFLICT DO NOTHING;
