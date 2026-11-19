-- 0005: view, hàm PostGIS, trigger cập nhật hình học tuyến, trigger updated_at
BEGIN;

-- ===== Trigger updated_at =====
CREATE TRIGGER trg_region_updated_at       BEFORE UPDATE ON region             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_media_asset_updated_at  BEFORE UPDATE ON media_asset        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_destination_updated_at  BEFORE UPDATE ON tourist_destination FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tour_updated_at         BEFORE UPDATE ON tour               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_user_updated_at     BEFORE UPDATE ON app_user           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_review_updated_at       BEFORE UPDATE ON review             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tour_route_updated_at   BEFORE UPDATE ON tour_route         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===== Tính lại hình học và độ dài tuyến =====
CREATE OR REPLACE FUNCTION refresh_tour_route_geometry(p_route_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_count integer;
  v_line  geography;
BEGIN
  SELECT COUNT(*),
         ST_MakeLine(d.location::geometry ORDER BY rs.stop_order)::geography
    INTO v_count, v_line
    FROM route_stop rs
    JOIN tourist_destination d ON d.destination_id = rs.destination_id
   WHERE rs.route_id = p_route_id;

  UPDATE tour_route
     SET route_line       = CASE WHEN v_count >= 2 THEN v_line END,
         total_distance_m = CASE WHEN v_count >= 2 THEN ST_Length(v_line) END
   WHERE route_id = p_route_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_route_stop_changed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_tour_route_geometry(OLD.route_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_tour_route_geometry(NEW.route_id);
  IF TG_OP = 'UPDATE' AND OLD.route_id <> NEW.route_id THEN
    PERFORM refresh_tour_route_geometry(OLD.route_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_route_stop_changed
AFTER INSERT OR UPDATE OR DELETE ON route_stop
FOR EACH ROW EXECUTE FUNCTION fn_route_stop_changed();

-- Khi tọa độ địa điểm đổi, cập nhật lại mọi tuyến đi qua địa điểm đó
CREATE OR REPLACE FUNCTION fn_destination_location_changed()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT route_id FROM route_stop WHERE destination_id = NEW.destination_id LOOP
    PERFORM refresh_tour_route_geometry(r.route_id);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_destination_location_changed
AFTER UPDATE OF latitude, longitude ON tourist_destination
FOR EACH ROW EXECUTE FUNCTION fn_destination_location_changed();

-- ===== Hàm truy vấn tiện ích =====

-- Địa điểm trong bán kính (mét) quanh một tọa độ, sắp xếp theo khoảng cách
CREATE OR REPLACE FUNCTION fn_nearby_destinations(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m double precision DEFAULT 2000,
  p_limit    integer DEFAULT 20
)
RETURNS TABLE (destination_id uuid, slug varchar, name varchar, distance_m double precision)
LANGUAGE sql STABLE AS $$
  WITH p AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT d.destination_id,
         d.slug,
         d.name,
         ST_Distance(d.location, p.g) AS distance_m
    FROM tourist_destination d
    CROSS JOIN p
   WHERE ST_DWithin(d.location, p.g, p_radius_m)
   ORDER BY ST_Distance(d.location, p.g)
   LIMIT p_limit;
$$;

-- FeatureCollection GeoJSON của mọi địa điểm trong một vùng
CREATE OR REPLACE FUNCTION fn_region_geojson(p_region_slug text)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(d.location)::jsonb,
          'properties', jsonb_build_object(
            'slug', d.slug,
            'name', d.name,
            'category', d.category,
            'buildingShape', d.building_shape,
            'heightM', d.height_m,
            'headingDeg', d.heading_deg,
            'displayColor', d.display_color
          )
        ) ORDER BY d.name
      ),
      '[]'::jsonb
    )
  )
  FROM tourist_destination d
  JOIN region r ON r.region_id = d.region_id
  WHERE r.slug = p_region_slug;
$$;

-- ===== View =====

-- Tổng hợp rating, số lượt yêu thích, số ảnh, số mô hình của mỗi địa điểm
CREATE OR REPLACE VIEW v_destination_summary AS
SELECT
  d.destination_id,
  d.slug,
  d.name,
  d.category,
  d.location,
  d.cover_asset_id,
  (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM review r WHERE r.destination_id = d.destination_id) AS avg_rating,
  (SELECT COUNT(*) FROM review r WHERE r.destination_id = d.destination_id)                        AS review_count,
  (SELECT COUNT(*) FROM favorite f WHERE f.destination_id = d.destination_id)                      AS favorite_count,
  (SELECT COUNT(*) FROM destination_image i WHERE i.destination_id = d.destination_id AND i.image_kind = 'thumbnail') AS thumbnail_count,
  (SELECT COUNT(*) FROM destination_image i WHERE i.destination_id = d.destination_id AND i.image_kind = 'scene')     AS scene_count,
  (SELECT COUNT(*) FROM model_3d m WHERE m.destination_id = d.destination_id)                      AS model_count
FROM tourist_destination d;

-- Ảnh kèm đường dẫn đúng theo loại (thumbnail dùng thumbnail_path, scene dùng storage_path)
CREATE OR REPLACE VIEW v_destination_images AS
SELECT
  i.destination_id,
  d.slug,
  i.image_kind,
  i.sort_order,
  i.is_primary,
  i.scene_id,
  s.scene_key,
  i.alt_text,
  i.caption,
  CASE WHEN i.image_kind = 'thumbnail' THEN COALESCE(a.thumbnail_path, a.storage_path)
       ELSE a.storage_path END AS image_path,
  a.storage_path,
  a.thumbnail_path,
  a.width,
  a.height,
  a.author,
  a.license,
  a.license_url,
  a.source_url
FROM destination_image i
JOIN tourist_destination d ON d.destination_id = i.destination_id
JOIN media_asset a         ON a.asset_id = i.asset_id
LEFT JOIN tour_scene s     ON s.scene_id = i.scene_id;

COMMIT;