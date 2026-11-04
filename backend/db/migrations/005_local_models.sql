-- Trỏ model về thư mục nội bộ frontend/public/models (không cần host).
-- File chưa tồn tại thì bản đồ tự dùng khối trụ tạm.
UPDATE tourist_destination SET model_url = '/models/colosseum.glb',
       interior_model_url = '/models/colosseum-interior.glb'
WHERE slug = 'colosseum';

UPDATE tourist_destination SET model_url = '/models/arch-of-constantine.glb'
WHERE slug = 'arch-of-constantine';

UPDATE tourist_destination SET model_url = '/models/pantheon.glb',
       interior_model_url = '/models/pantheon-interior.glb'
WHERE slug = 'pantheon';
