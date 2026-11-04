-- Extension cho tìm kiếm tên địa điểm (ILIKE nhanh hơn với pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Hàm tự cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Người dùng
CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE CHECK (email = LOWER(email)),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Danh mục cố định (thay cho VARCHAR tự do)
CREATE TABLE destination_category (
  code  VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

-- Địa điểm du lịch
CREATE TABLE tourist_destination (
  destination_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                          VARCHAR(120) NOT NULL UNIQUE
                                  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                          VARCHAR(255) NOT NULL,
  description                   TEXT NOT NULL,
  address                       VARCHAR(500) NOT NULL,
  latitude                      DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude                     DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  category                      VARCHAR(50) NOT NULL REFERENCES destination_category(code),
  opening_hours                 VARCHAR(255),
  entry_fee                     NUMERIC(12,2) CHECK (entry_fee IS NULL OR entry_fee >= 0),
  entry_fee_currency            CHAR(3) NOT NULL DEFAULT 'EUR',
  cover_image_url               TEXT NOT NULL,
  arcgis_exterior_scene_item_id VARCHAR(64),
  arcgis_interior_scene_item_id VARCHAR(64),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_destination_updated_at BEFORE UPDATE ON tourist_destination
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Thư viện ảnh
CREATE TABLE destination_image (
  image_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  image_type     VARCHAR(50) NOT NULL CHECK (image_type IN ('cover', 'gallery', 'thumbnail', 'other')),
  caption        VARCHAR(255),
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE
);
-- Mỗi địa điểm chỉ có tối đa một ảnh primary
CREATE UNIQUE INDEX uq_primary_image ON destination_image(destination_id) WHERE is_primary = TRUE;

-- Yêu thích
CREATE TABLE favorite (
  favorite_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_favorite_user_destination UNIQUE (user_id, destination_id)
);

-- Đánh giá
CREATE TABLE review (
  review_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_review_user_destination UNIQUE (user_id, destination_id)
);
CREATE TRIGGER trg_review_updated_at BEFORE UPDATE ON review
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Tuyến tham quan
CREATE TABLE tour_route (
  route_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(255) NOT NULL,
  description              TEXT NOT NULL,
  total_distance_km        NUMERIC(8,2) CHECK (total_distance_km IS NULL OR total_distance_km >= 0),
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  arcgis_feature_id        VARCHAR(64),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_tour_route_updated_at BEFORE UPDATE ON tour_route
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Điểm dừng trong tuyến
CREATE TABLE route_stop (
  route_stop_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id       UUID NOT NULL REFERENCES tour_route(route_id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  stop_order     INTEGER NOT NULL CHECK (stop_order > 0),
  stay_minutes   INTEGER CHECK (stay_minutes IS NULL OR stay_minutes >= 0),
  CONSTRAINT uq_route_stop_order UNIQUE (route_id, stop_order)
);

-- Index
-- Lưu ý: không cần index riêng cho favorite(user_id), review(user_id), route_stop(route_id)
-- vì các UNIQUE constraint đã tạo index với các cột đó ở vị trí đầu.
CREATE INDEX idx_destination_category ON tourist_destination(category);
CREATE INDEX idx_destination_name_trgm ON tourist_destination USING GIN (name gin_trgm_ops);
CREATE INDEX idx_destination_image_destination ON destination_image(destination_id);
CREATE INDEX idx_review_destination ON review(destination_id);
CREATE INDEX idx_route_stop_destination ON route_stop(destination_id);
