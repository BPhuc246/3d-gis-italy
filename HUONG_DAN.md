# Hướng dẫn sử dụng: Di sản Roma

Trang chủ hiển thị một khung phẳng nhúng mô hình 3D từ Sketchfab. Chọn công trình ở danh sách bên trái để đổi mô hình. Bấm "Xem chi tiết" để mở trang đầy đủ gồm ảnh, đánh giá và yêu thích.

---

## 1. Cách nhúng

Mỗi công trình có thể có tối đa hai mô hình nhúng, lưu trong bảng `destination_embed`:

- `kind = 'exterior'`: mô hình bên ngoài
- `kind = 'interior'`: mô hình bên trong

Mỗi cặp (công trình, loại) chỉ có một dòng. Khi công trình có mô hình bên trong, trang chủ hiện nút chuyển "Bên ngoài / Bên trong".

Hiện có:

- Colosseum: bên ngoài
- Khải hoàn môn Constantine: bên ngoài
- Đền Pantheon: bên ngoài và bên trong
- Đài tưởng niệm Vittorio Emanuele II: bên ngoài

---

## 2. Chạy dự án

```bash
cd backend
npm i
npm run db:migrate   # chạy 008_destination_embeds.sql
npm run dev

cd ../frontend
npm i                # đã bỏ thư viện ArcGIS
npm run dev
```

---

## 3. Thêm hoặc đổi mô hình

Lấy URL embed từ Sketchfab: mở mô hình, chọn **Share** > **Embed**, rồi lấy giá trị `src` của iframe (dạng `https://sketchfab.com/models/<32 ký tự>/embed`).

Thêm mô hình bên trong cho một công trình:

```sql
INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'interior',
       'https://sketchfab.com/models/<uid>/embed',
       'Tên mô hình by Tác giả on Sketchfab', 1
FROM tourist_destination WHERE slug = 'colosseum';
```

Đổi URL của một mô hình hiện có:

```sql
UPDATE destination_embed SET embed_url = 'https://sketchfab.com/models/<uid>/embed'
WHERE destination_id = (SELECT destination_id FROM tourist_destination WHERE slug = 'pantheon')
  AND kind = 'exterior';
```

Công trình chưa có mô hình sẽ hiện thông báo "chưa có mô hình nhúng".

---

## 4. Lưu ý

- **Giấy phép**: nhiều mô hình Sketchfab dùng CC-BY, bắt buộc ghi công tác giả. Hãy giữ `embed_credit` đúng với thông tin trên trang mô hình.
- **Mô hình phải cho phép embed.** Nếu tác giả tắt tùy chọn này, khung sẽ trống.
- **Bản đồ 3D đã bị gỡ.** Cảnh bản đồ, các khối dựng bằng code và nút "Vào bên trong" không còn trong phiên bản này. Nếu cần khôi phục, cần nói rõ để làm lại.
- Các cột `building_shape`, `height_m`… từ migration 006 vẫn còn trong database nhưng không dùng nữa.

## 5. Tương tác

Đấu trường La Mã ( Colosseum )

- Phát video giới thiệu Colosseum và trải nghiệm tham quan thực tế.
- Đội mũ giác đấu 3D và chụp ảnh ( Cảm giác Pov khi có chiếc mũ hạ xuống che tầm nhìn và có thể nhìn xung quanh cảm giác như đội một chiếc nón giác đáu thực sự )
- Phát hiệu ứng âm thanh tiếng khán giả reo hò ( Khi và chỉ mình đã đội mũ và cửa đã kéo lên )

Khải hoàn môn Constantine (Arch of Constantine)

- Phát video về lịch sử và kiến trúc Khải hoàn môn.
- Kích hoạt đoàn diễu hành 3D đi qua cổng. ( tạo pov camera nhân vật đi xung qunanh model, có thể tua nhanh chậm )

Đài tưởng niệm Vittorio Emanuele II (Vittoriano)

- Tạo hiệu ứng cúi đầu tưởng niệm tại Mộ Chiến sĩ vô danh. ( pov ở gần đài tưởng niệm, camera nhìn xuống )
- Thắp nến tưởng niệm mang tính biểu tượng, không thay đổi ngọn lửa thực tế. ( animation có ngọn lửa nến ngay trước mặt )
- Camera mô phỏng hành trình đi lên các bậc thang. ( pov camera hướng lên đi tới đài )

Đền Pantheon

- Camera tự động hướng lên Oculus và mái vòm -> Mưa rơi qua Oculus
- Nhân vật thực hiện động tác cầu nguyện tại khu vực phù hợp. ( tương tự camera nhìn xuống, 2 tay nắm lại )
- Tương tác nến tưởng niệm, nếu đặt trong bối cảnh phù hợp và có chú thích đây là mô phỏng.
