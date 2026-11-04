-- Bỏ hoàn toàn file GLB. Công trình được dựng bằng hình học trong code từ các số liệu dưới đây.
ALTER TABLE tourist_destination
  DROP COLUMN IF EXISTS model_url,
  DROP COLUMN IF EXISTS model_height_m,
  DROP COLUMN IF EXISTS model_heading_deg,
  DROP COLUMN IF EXISTS interior_model_url,
  DROP COLUMN IF EXISTS interior_model_height_m;

ALTER TABLE tourist_destination
  ADD COLUMN building_shape VARCHAR(20) NOT NULL DEFAULT 'rectangle'
    CHECK (building_shape IN ('circle', 'ellipse', 'rectangle')),
  ADD COLUMN footprint_length_m NUMERIC(7,2) NOT NULL DEFAULT 20 CHECK (footprint_length_m > 0),
  ADD COLUMN footprint_width_m NUMERIC(7,2) NOT NULL DEFAULT 20 CHECK (footprint_width_m > 0),
  ADD COLUMN height_m NUMERIC(7,2) NOT NULL DEFAULT 20 CHECK (height_m > 0),
  ADD COLUMN heading_deg DOUBLE PRECISION NOT NULL DEFAULT 0
    CHECK (heading_deg >= 0 AND heading_deg < 360),
  -- NULL nghĩa là không có không gian bên trong (không hiện nút "Vào bên trong")
  ADD COLUMN interior_height_m NUMERIC(7,2) CHECK (interior_height_m IS NULL OR interior_height_m > 0),
  ADD COLUMN display_color VARCHAR(7) NOT NULL DEFAULT '#c8b48c'
    CHECK (display_color ~ '^#[0-9a-fA-F]{6}$');

-- Kích thước ƯỚC LƯỢNG để dựng hình, cần đối chiếu lại nếu dùng cho mục đích chính thức.
UPDATE tourist_destination
SET building_shape = 'ellipse', footprint_length_m = 188, footprint_width_m = 156,
    height_m = 48, heading_deg = 0, interior_height_m = 48, display_color = '#c9b08a'
WHERE slug = 'colosseum';

UPDATE tourist_destination
SET building_shape = 'rectangle', footprint_length_m = 25, footprint_width_m = 11,
    height_m = 21, heading_deg = 0, interior_height_m = NULL, display_color = '#d8c9a3'
WHERE slug = 'arch-of-constantine';

UPDATE tourist_destination
SET building_shape = 'circle', footprint_length_m = 43.3, footprint_width_m = 43.3,
    height_m = 43.3, heading_deg = 0, interior_height_m = 43.3, display_color = '#e4dccb'
WHERE slug = 'pantheon';
