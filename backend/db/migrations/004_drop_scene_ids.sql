-- Bỏ hoàn toàn Scene ID của ArcGIS, thay bằng model GLB nhúng trực tiếp qua URL
ALTER TABLE tourist_destination
  DROP COLUMN IF EXISTS arcgis_exterior_scene_item_id,
  DROP COLUMN IF EXISTS arcgis_interior_scene_item_id;

-- Model cảnh bên trong (GLB/glTF) và chiều cao hiển thị. Để trống thì không có nút "Vào bên trong".
ALTER TABLE tourist_destination
  ADD COLUMN interior_model_url TEXT,
  ADD COLUMN interior_model_height_m NUMERIC(6,2)
    CHECK (interior_model_height_m IS NULL OR interior_model_height_m > 0);
