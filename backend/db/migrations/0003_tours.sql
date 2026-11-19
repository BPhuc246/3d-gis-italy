-- 0003: tour, nguồn nội dung, scene, hotspot, ảnh (thumbnail[] + scenes[]), câu hỏi
BEGIN;

CREATE TABLE tour (
  tour_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id   uuid NOT NULL UNIQUE REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  external_id      varchar(150) NOT NULL UNIQUE,   -- ví dụ: arch-of-constantine-photo
  version          smallint NOT NULL DEFAULT 1,
  title            varchar(255) NOT NULL,
  route_note       text,
  start_scene_id   uuid,                           -- FK thêm bên dưới
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tour_source (
  tour_source_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id          uuid NOT NULL REFERENCES tour(tour_id) ON DELETE CASCADE,
  sort_order       smallint NOT NULL CHECK (sort_order > 0),
  title            text NOT NULL,
  url              text NOT NULL,
  CONSTRAINT uq_tour_source_order UNIQUE (tour_id, sort_order),
  CONSTRAINT uq_tour_source_url   UNIQUE (tour_id, url)
);

CREATE TABLE tour_scene (
  scene_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id          uuid NOT NULL REFERENCES tour(tour_id) ON DELETE CASCADE,
  scene_key        varchar(100) NOT NULL,          -- id gốc trong JSON, ví dụ: wide, south
  sort_order       smallint NOT NULL CHECK (sort_order > 0),
  title            varchar(255) NOT NULL,
  description      text,
  alt_text         text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_scene_key   UNIQUE (tour_id, scene_key),
  CONSTRAINT uq_scene_order UNIQUE (tour_id, sort_order)
);

ALTER TABLE tour
  ADD CONSTRAINT fk_tour_start_scene
  FOREIGN KEY (start_scene_id) REFERENCES tour_scene(scene_id) ON DELETE SET NULL;

CREATE TYPE hotspot_kind AS ENUM ('info', 'navigate');

CREATE TABLE scene_hotspot (
  hotspot_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id         uuid NOT NULL REFERENCES tour_scene(scene_id) ON DELETE CASCADE,
  hotspot_key      varchar(150) NOT NULL,
  kind             hotspot_kind NOT NULL,
  x_percent        numeric(5,2) NOT NULL CHECK (x_percent BETWEEN 0 AND 100),
  y_percent        numeric(5,2) NOT NULL CHECK (y_percent BETWEEN 0 AND 100),
  title            varchar(255) NOT NULL,
  body             text,
  source_url       text,
  target_scene_id  uuid REFERENCES tour_scene(scene_id) ON DELETE CASCADE,
  direction        varchar(20) CHECK (direction IN ('forward', 'return', 'view', 'left', 'right', 'up', 'down')),
  sort_order       smallint NOT NULL DEFAULT 0,
  CONSTRAINT uq_hotspot_key UNIQUE (scene_id, hotspot_key),
  CONSTRAINT ck_hotspot_info CHECK (
    kind <> 'info' OR (body IS NOT NULL AND target_scene_id IS NULL)
  ),
  CONSTRAINT ck_hotspot_navigate CHECK (
    kind <> 'navigate' OR (target_scene_id IS NOT NULL AND target_scene_id <> scene_id AND direction IS NOT NULL)
  )
);

-- Ảnh của địa điểm, chia 2 mảng: thumbnail[] và scenes[]
CREATE TYPE destination_image_kind AS ENUM ('thumbnail', 'scene');

CREATE TABLE destination_image (
  image_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id   uuid NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  scene_id         uuid REFERENCES tour_scene(scene_id) ON DELETE CASCADE,
  asset_id         uuid NOT NULL REFERENCES media_asset(asset_id) ON DELETE RESTRICT,
  image_kind       destination_image_kind NOT NULL,
  sort_order       smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_primary       boolean NOT NULL DEFAULT false,
  alt_text         text,
  caption          text,
  CONSTRAINT ck_image_scene_link CHECK (image_kind <> 'scene' OR scene_id IS NOT NULL),
  CONSTRAINT uq_destination_image_order UNIQUE (destination_id, image_kind, sort_order)
);

-- Mỗi scene chỉ có tối đa một ảnh scene và một ảnh thumbnail
CREATE UNIQUE INDEX uq_scene_image_kind
  ON destination_image (scene_id, image_kind)
  WHERE scene_id IS NOT NULL;

CREATE INDEX idx_destination_image_asset ON destination_image (asset_id);

CREATE TABLE tour_question (
  question_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id          uuid NOT NULL REFERENCES tour(tour_id) ON DELETE CASCADE,
  question_key     varchar(100) NOT NULL,
  sort_order       smallint NOT NULL CHECK (sort_order > 0),
  scene_id         uuid REFERENCES tour_scene(scene_id) ON DELETE SET NULL,
  prompt           text NOT NULL,
  explanation      text,
  CONSTRAINT uq_question_key   UNIQUE (tour_id, question_key),
  CONSTRAINT uq_question_order UNIQUE (tour_id, sort_order)
);

CREATE TABLE question_choice (
  choice_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id      uuid NOT NULL REFERENCES tour_question(question_id) ON DELETE CASCADE,
  position         smallint NOT NULL CHECK (position >= 0),
  label            text NOT NULL,
  is_correct       boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_choice_position UNIQUE (question_id, position)
);

-- Mỗi câu hỏi chỉ có đúng một đáp án đúng
CREATE UNIQUE INDEX uq_one_correct_choice
  ON question_choice (question_id)
  WHERE is_correct;

CREATE INDEX idx_tour_scene_tour       ON tour_scene (tour_id);
CREATE INDEX idx_hotspot_scene         ON scene_hotspot (scene_id);
CREATE INDEX idx_hotspot_target_scene  ON scene_hotspot (target_scene_id);
CREATE INDEX idx_tour_question_tour    ON tour_question (tour_id);
CREATE INDEX idx_tour_question_scene   ON tour_question (scene_id);

COMMIT;