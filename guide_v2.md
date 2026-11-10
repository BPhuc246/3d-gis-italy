# Hướng Dẫn Vận Hành & Kiểm Thử Dự Án 3D GIS Roma (Phiên bản v2)

Tài liệu hướng dẫn chi tiết cách cài đặt, chạy dữ liệu mẫu (demo data), đăng nhập tài khoản kiểm thử và đẩy mã nguồn (Git commit & push) lên repository.

---

## 1. Yêu cầu môi trường
* **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20+).
* **PostgreSQL**: Đang chạy trên cổng `55432` (hoặc cấu hình lại trong file `.env`).
  * Nếu dùng Docker: `docker compose up -d` (nếu đã cấu hình docker-compose).

---

## 2. Khởi động Backend & Nạp dữ liệu mẫu

### Bước 2.1: Cài đặt và cấu hình
Mở terminal tại thư mục gốc dự án:
```powershell
cd backend
npm install
```

Kiểm tra file `.env` ở thư mục gốc (đã cấu hình sẵn kết nối PostgreSQL):
```env
DB_POSTGRES=postgresql://postgres:postgres@127.0.0.1:55432/app_dev
PORT=4000
```

### Bước 2.2: Nạp dữ liệu mẫu chân thật (Users, Reviews, Favorites)
Chạy lệnh nạp dữ liệu demo vào PostgreSQL:
```powershell
npm run db:demo
```
> Lệnh này sẽ tự động khởi tạo:
> * **3 tài khoản người dùng thực tế** (Minh An, Thu Hà, Gia Bảo).
> * **12 đánh giá chân thật kèm số sao rating** chia đều cho Colosseum, Khải hoàn môn, Pantheon và Đài tưởng niệm Vittorio Emanuele II.
> * Các lượt thả tim yêu thích để kiểm thử danh sách yêu thích.
> * *Lưu ý:* Nếu muốn xóa sạch dữ liệu demo để nạp lại từ đầu, chạy: `npm run db:demo:clear`.

### Bước 2.3: Khởi động máy chủ API
```powershell
npm run dev
```
Máy chủ backend sẽ chạy tại: **`http://localhost:4000`**

---

## 3. Khởi động Frontend

Mở một cửa sổ terminal mới:
```powershell
cd frontend
npm install
npm run dev
```
Trang web sẽ chạy tại: **`http://localhost:5173/`**

---

## 4. Tài khoản kiểm thử (Demo Accounts)

Tất cả tài khoản đều sử dụng mật khẩu ngắn gọn, dễ nhớ: **`demo`**

| Họ và tên | Email đăng nhập | Mật khẩu | Dữ liệu kiểm thử có sẵn |
| :--- | :--- | :--- | :--- |
| **Minh An** | `demo.an@example.test` | `demo` | Đã đánh giá Colosseum & Pantheon; Thả tim 2 địa điểm |
| **Thu Hà** | `demo.ha@example.test` | `demo` | Đã đánh giá cả 3 địa điểm; Thả tim Colosseum & Constantine |
| **Gia Bảo** | `demo.bao@example.test` | `demo` | Đã đánh giá Khải hoàn môn & Colosseum; Thả tim Pantheon |

### Các kịch bản kiểm thử nhanh:
1. **Đăng nhập & Chuyển tài khoản:** Bấm nút avatar góc trên bên phải để chuyển nhanh giữa các tài khoản hoặc đăng xuất/đăng nhập lại.
2. **Thả tim yêu thích:** Vào trang danh sách (`#/list`) hoặc chi tiết địa điểm để bấm tim; sau đó mở menu góc phải chọn **Địa điểm yêu thích** (`#/favorites`) để kiểm tra đồng bộ từ database.
3. **Đánh giá & Xếp hạng sao:** Đăng nhập và vào chi tiết một di sản, bạn có thể chỉnh sửa/xóa nhận xét của chính mình hoặc viết nhận xét mới kèm số sao rating từ 1 đến 5.
4. **Mô hình 3D & Tour ảnh:**
   * Bấm **Xem chi tiết mô hình 3D** để tương tác xoay, zoom trực quan mô hình Sketchfab.
   * Bấm **Khám phá qua ảnh** để trải nghiệm tour ảnh 45 góc chụp thực tế tại 4 địa điểm và trả lời câu đố di sản. Riêng Vittoriano có 18 cảnh, gồm cả bảo tàng, nội thất và sân thượng.

---
*Dự án hoàn thành bởi nhóm phát triển Di sản Roma 3D GIS.*
