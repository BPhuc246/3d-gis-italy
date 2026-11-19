-- =====================================================================
-- Truy vấn PostGIS cho Roma Heritage
-- Quy ước tham số: $1, $2... dùng với driver pg (node-postgres)
-- Lưu ý: kiểu geography dùng đơn vị mét, tính theo mặt cầu.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Địa điểm trong bán kính R mét quanh một tọa độ (bản đầy đủ)
--    $1 = lat, $2 = lng, $3 = bán kính (m)
-- ---------------------------------------------------------------------
SELECT d.slug,
       d.name,
       ROUND(ST_Distance(d.location, p.geog)::numeric, 1) AS distance_m
  FROM tourist_destination d
 CROSS JOIN (SELECT ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography AS geog) p
 WHERE ST_DWithin(d.location, p.geog, $3)
 ORDER BY distance_m;


-- ---------------------------------------------------------------------
-- 2. K láng giềng gần nhất (KNN, dùng GIST index)
--    $1 = lat, $2 = lng, $3 = số lượng
-- ---------------------------------------------------------------------
SELECT d.slug,
       d.name,
       ST_Distance(d.location, p.geog) AS distance_m
  FROM tourist_destination d
 CROSS JOIN (SELECT ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography AS geog) p
 ORDER BY d.location <-> p.geog
 LIMIT $3;


-- ---------------------------------------------------------------------
-- 3. Địa điểm trong khung nhìn bản đồ (bounding box)
--    $1 = minLng, $2 = minLat, $3 = maxLng, $4 = maxLat
-- ---------------------------------------------------------------------
SELECT d.slug, d.name, d.latitude, d.longitude
  FROM tourist_destination d
 WHERE d.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography;


-- ---------------------------------------------------------------------
-- 4. Địa điểm nằm trong ranh giới vùng (điểm trong đa giác)
--    $1 = region slug
--    Lưu ý: cần điền cột region.boundary trước; nếu boundary NULL thì không trả về dòng nào.
-- ---------------------------------------------------------------------
SELECT d.slug, d.name
  FROM tourist_destination d
  JOIN region r ON r.region_id = d.region_id
 WHERE r.slug = $1
   AND ST_Covers(r.boundary, d.location);


-- ---------------------------------------------------------------------
-- 5. Vùng đệm 300 m quanh một địa điểm (xuất GeoJSON)
--    $1 = slug
-- ---------------------------------------------------------------------
SELECT d.slug,
       ST_AsGeoJSON(ST_Buffer(d.location, 300))::jsonb AS zone_300m
  FROM tourist_destination d
 WHERE d.slug = $1;


-- ---------------------------------------------------------------------
-- 6. Ma trận khoảng cách giữa mọi cặp địa điểm trong một vùng
--    $1 = region slug
-- ---------------------------------------------------------------------
SELECT a.slug AS from_slug,
       b.slug AS to_slug,
       ROUND(ST_Distance(a.location, b.location)::numeric) AS distance_m
  FROM tourist_destination a
  JOIN tourist_destination b
    ON a.destination_id < b.destination_id
  JOIN region r ON r.region_id = a.region_id
 WHERE r.slug = $1
 ORDER BY distance_m;


-- ---------------------------------------------------------------------
-- 7. Hướng la bàn (bearing) từ điểm A tới điểm B, độ theo chiều kim đồng hồ từ Bắc
-- ---------------------------------------------------------------------
SELECT a.slug AS from_slug,
       b.slug AS to_slug,
       MOD((DEGREES(ST_Azimuth(a.location::geometry, b.location::geometry)) + 360)::numeric, 360) AS bearing_deg
  FROM tourist_destination a
  JOIN tourist_destination b ON a.destination_id <> b.destination_id;


-- ---------------------------------------------------------------------
-- 8. Trọng tâm của các địa điểm trong vùng (lat/lng)
--    $1 = region slug
-- ---------------------------------------------------------------------
SELECT ST_Y(s.c) AS center_lat,
       ST_X(s.c) AS center_lng
  FROM (
    SELECT ST_Centroid(ST_Collect(d.location::geometry)) AS c
      FROM tourist_destination d
      JOIN region r ON r.region_id = d.region_id
     WHERE r.slug = $1
  ) s;


-- ---------------------------------------------------------------------
-- 9. Chặng của tuyến: khoảng cách từng chặng, thời gian đi bộ ước tính (1,3 m/s)
--    $1 = route_id
-- ---------------------------------------------------------------------
SELECT rs.stop_order,
       d.slug,
       d.name,
       rs.stay_duration_min,
       ROUND((ST_Distance(d.location, LAG(d.location) OVER w))::numeric)        AS leg_distance_m,
       ROUND((ST_Distance(d.location, LAG(d.location) OVER w) / 1.3 / 60)::numeric, 1) AS leg_walk_min
  FROM route_stop rs
  JOIN tourist_destination d ON d.destination_id = rs.destination_id
 WHERE rs.route_id = $1
WINDOW w AS (ORDER BY rs.stop_order)
 ORDER BY rs.stop_order;


-- ---------------------------------------------------------------------
-- 10. Tuyến dưới dạng GeoJSON Feature (dùng để vẽ trên bản đồ)
--     $1 = route_id
-- ---------------------------------------------------------------------
SELECT jsonb_build_object(
         'type', 'Feature',
         'geometry', ST_AsGeoJSON(r.route_line)::jsonb,
         'properties', jsonb_build_object(
            'name', r.name,
            'distanceM', r.total_distance_m,
            'durationMin', r.estimated_duration_min
         )
       ) AS feature
  FROM tour_route r
 WHERE r.route_id = $1;


-- ---------------------------------------------------------------------
-- 11. Địa điểm nằm gần tuyến (trong $2 mét dọc theo đường đi)
--     $1 = route_id, $2 = khoảng cách (m)
-- ---------------------------------------------------------------------
SELECT d.slug,
       d.name,
       ROUND(ST_Distance(d.location, r.route_line)::numeric) AS distance_to_route_m
  FROM tour_route r
  JOIN tourist_destination d ON ST_DWithin(r.route_line, d.location, $2)
 WHERE r.route_id = $1
 ORDER BY distance_to_route_m;


-- ---------------------------------------------------------------------
-- 12. Yêu thích của một người dùng, sắp xếp theo khoảng cách tới vị trí hiện tại
--     $1 = lat, $2 = lng, $3 = user_id
-- ---------------------------------------------------------------------
SELECT d.slug,
       d.name,
       s.avg_rating,
       ROUND(ST_Distance(d.location, p.geog)::numeric) AS distance_m
  FROM favorite f
  JOIN tourist_destination d        ON d.destination_id = f.destination_id
  JOIN v_destination_summary s      ON s.destination_id = d.destination_id
 CROSS JOIN (SELECT ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography AS geog) p
 WHERE f.user_id = $3
 ORDER BY distance_m;


-- ---------------------------------------------------------------------
-- 13. Số địa điểm lân cận trong bán kính $1 mét của mỗi địa điểm (mật độ)
-- ---------------------------------------------------------------------
SELECT a.slug,
       (SELECT COUNT(*)
          FROM tourist_destination b
         WHERE b.destination_id <> a.destination_id
           AND ST_DWithin(a.location, b.location, $1)) AS neighbors_count
  FROM tourist_destination a;


-- ---------------------------------------------------------------------
-- 14. Hàm tiện ích: địa điểm gần một tọa độ
-- ---------------------------------------------------------------------
SELECT * FROM fn_nearby_destinations($1, $2, $3, $4);   -- lat, lng, radius_m, limit


-- ---------------------------------------------------------------------
-- 15. GeoJSON của toàn bộ địa điểm trong vùng
-- ---------------------------------------------------------------------
SELECT fn_region_geojson($1);                            -- region slug


-- ---------------------------------------------------------------------
-- 16. Cập nhật tọa độ địa điểm (location tự sinh lại, tuyến liên quan tự tính lại)
-- ---------------------------------------------------------------------
UPDATE tourist_destination
   SET latitude = $2,
       longitude = $3
 WHERE slug = $1;


-- ---------------------------------------------------------------------
-- 17. Kiểm tra dữ liệu sau khi nạp
-- ---------------------------------------------------------------------

-- Số mô hình 3D và ảnh của từng địa điểm
SELECT slug, model_count, thumbnail_count, scene_count FROM v_destination_summary ORDER BY slug;

-- Tour nào chưa có điểm bắt đầu
SELECT t.external_id FROM tour t WHERE t.start_scene_id IS NULL;

-- Câu hỏi nào không có đúng một đáp án đúng
SELECT q.question_key
  FROM tour_question q
  JOIN question_choice c ON c.question_id = q.question_id
 GROUP BY q.question_id, q.question_key
HAVING SUM(CASE WHEN c.is_correct THEN 1 ELSE 0 END) <> 1;

-- Kiểm tra index có được dùng không
EXPLAIN ANALYZE
SELECT d.slug FROM tourist_destination d
 WHERE ST_DWithin(d.location, ST_SetSRID(ST_MakePoint(12.4922, 41.8902), 4326)::geography, 1000);