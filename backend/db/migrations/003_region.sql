-- Khu vực bản đồ 3D: nhiều công trình cùng nằm trên một mặt phẳng/địa hình chung
CREATE TABLE map_region (
  region_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(120) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  center_latitude  DOUBLE PRECISION NOT NULL CHECK (center_latitude BETWEEN -90 AND 90),
  center_longitude DOUBLE PRECISION NOT NULL CHECK (center_longitude BETWEEN -180 AND 180),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_region_updated_at BEFORE UPDATE ON map_region
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO map_region (slug, name, description, center_latitude, center_longitude)
VALUES ('roma-trung-tam', 'Trung tâm lịch sử Roma',
        'Khu vực trung tâm có Colosseum, Khải hoàn môn Constantine và Pantheon.',
        41.8930, 12.4870)
ON CONFLICT (slug) DO NOTHING;

-- Thuộc tính của công trình trong bản đồ
ALTER TABLE tourist_destination
  ADD COLUMN region_id UUID REFERENCES map_region(region_id),
  ADD COLUMN model_url TEXT,
  ADD COLUMN model_height_m NUMERIC(6,2) NOT NULL DEFAULT 20 CHECK (model_height_m > 0),
  ADD COLUMN model_heading_deg DOUBLE PRECISION NOT NULL DEFAULT 0
    CHECK (model_heading_deg >= 0 AND model_heading_deg < 360);

-- Gán các công trình cũ vào khu vực mặc định
UPDATE tourist_destination
SET region_id = (SELECT region_id FROM map_region WHERE slug = 'roma-trung-tam')
WHERE region_id IS NULL;

ALTER TABLE tourist_destination ALTER COLUMN region_id SET NOT NULL;
CREATE INDEX idx_destination_region ON tourist_destination(region_id);
