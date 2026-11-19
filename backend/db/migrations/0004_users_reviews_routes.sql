-- 0004: người dùng, yêu thích, đánh giá, tuyến tham quan (có hình học PostGIS)
BEGIN;

CREATE TABLE app_user (
  user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      varchar(255) NOT NULL,
  email          varchar(255) NOT NULL UNIQUE,
  password_hash  varchar(255) NOT NULL,
  avatar_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorite (
  favorite_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_favorite_user_destination UNIQUE (user_id, destination_id)
);

CREATE INDEX idx_favorite_destination ON favorite (destination_id);

CREATE TABLE review (
  review_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_destination ON review (destination_id);
CREATE INDEX idx_review_user        ON review (user_id);

CREATE TABLE tour_route (
  route_id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     varchar(255) NOT NULL,
  description              text NOT NULL,
  total_distance_m         double precision CHECK (total_distance_m >= 0),   -- tự cập nhật bằng trigger
  estimated_duration_min   integer CHECK (estimated_duration_min > 0),
  arcgis_feature_id        varchar(100),
  route_line               geography(LineString, 4326),                       -- tự cập nhật bằng trigger
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tour_route_line ON tour_route USING GIST (route_line);

CREATE TABLE route_stop (
  route_stop_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id         uuid NOT NULL REFERENCES tour_route(route_id) ON DELETE CASCADE,
  destination_id   uuid NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE RESTRICT,
  stop_order       smallint NOT NULL CHECK (stop_order > 0),
  stay_duration_min integer CHECK (stay_duration_min >= 0),
  CONSTRAINT uq_route_stop_order UNIQUE (route_id, stop_order)
);

CREATE INDEX idx_route_stop_destination ON route_stop (destination_id);

COMMIT;