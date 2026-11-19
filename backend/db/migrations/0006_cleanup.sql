-- 0006: bỏ bảng/cột ngoài schema đã chốt (chạy sau 0001-0005, an toàn khi chạy lại)
BEGIN;

DROP TABLE IF EXISTS building_brep;
DROP TABLE IF EXISTS building_model;
DROP TABLE IF EXISTS model_image;
DROP TABLE IF EXISTS destination_category;
DROP TABLE IF EXISTS map_region;
DROP TABLE IF EXISTS photo_tour;
DROP TABLE IF EXISTS tour_link;
DROP TABLE IF EXISTS tour_info_point;
DROP TABLE IF EXISTS tour_question_option;
DROP TABLE IF EXISTS destination_experience;
DROP TABLE IF EXISTS memorial_candle;

ALTER TABLE tourist_destination DROP COLUMN IF EXISTS ground_elevation_m;

COMMIT;
