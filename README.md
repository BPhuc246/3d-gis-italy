# 🇮🇹 Italy Virtual Tourism – 3D GIS

Website du lịch thực tế ảo 3D về các địa danh nổi tiếng tại Italy, được phát triển trong khuôn khổ môn học **IE402 – Hệ thống thông tin địa lý 3 chiều (Three-Dimensional Geographic Information System)**.

Dự án kết hợp bản đồ ArcGIS 3D và các mô hình 3D tương tác, mang đến trải nghiệm khám phá các địa danh lịch sử tại Italy một cách trực quan và sinh động. Người dùng có thể tham quan các địa điểm, tìm hiểu thông tin, tương tác với mô hình 3D và mô phỏng các tuyến đường tham quan ảo.

## 🎥 Demo dự án

- **Website:** [Truy cập website](https://threed-gis-italy.onrender.com)
- **Video Demo:** [Xem video giới thiệu dự án](Link)

## 👥 Thành viên thực hiện

| Họ và tên             | MSSV     | Công việc đảm nhiệm                                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Nguyễn Huỳnh Bảo Phúc | 24521391 | Quản lý mã nguồn, phát triển các tính năng tương tác với mô hình 3D và triển khai (Deploy) dự án           |
| Trần Gia Phú          | 24521365 | Tích hợp bản đồ ArcGIS 3D và xây dựng giao diện chính của website                                          |
| Võ Nguyễn Nhật Phi    | 24521326 | Cung cấp thông tin, mô hình 3D của các địa điểm; phát triển tính năng tạo và đề xuất tuyến đường tham quan |

## ✨ Tính năng chính

- **Bản đồ GIS 3D:** Tích hợp bản đồ ArcGIS 3D, hỗ trợ khám phá các địa danh nổi tiếng tại Italy.
- **Tương tác với mô hình 3D:** Cho phép người dùng quan sát và tương tác trực tiếp với các mô hình địa điểm du lịch.
- **Xác thực người dùng:** Cho phép người dùng tạo tài khoản để tương tác
- **Thông tin địa điểm:** Hiển thị thông tin giới thiệu về các địa danh một cách nhanh chóng và trực quan.
- **Đánh giá và bình luận:** Cho phép người dùng đánh giá mô hình 3D và chia sẻ nhận xét.
- **Địa điểm yêu thích:** Hỗ trợ lưu và quản lý danh sách các địa điểm yêu thích.
- **Tuyến đường tham quan ảo:** Mô phỏng các tuyến đường giữa những địa điểm du lịch, hỗ trợ người dùng khám phá nhiều địa danh trong cùng một hành trình.

## 🏛️ Các địa điểm được xây dựng

Dự án tập trung vào 4 địa danh nổi tiếng tại Rome, Italy:

1. **Colosseum:** Đấu trường La Mã cổ đại, biểu tượng lịch sử nổi tiếng của Italy.
2. **Arch of Constantine:** Khải hoàn môn Constantine, nằm gần đấu trường Colosseum.
3. **Pantheon:** Công trình kiến trúc La Mã cổ đại với mái vòm nổi tiếng.
4. **Vittoriano:** Đài tưởng niệm Quốc gia Victor Emmanuel II.

## 🛠️ Công nghệ sử dụng

### Frontend

- **React:** Thư viện JavaScript dùng để xây dựng giao diện người dùng (UI) theo mô hình component, giúp tổ chức và quản lý các thành phần giao diện một cách linh hoạt và dễ bảo trì.
- **TypeScript:** Ngôn ngữ lập trình mở rộng từ JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh (Static Typing), giúp phát hiện lỗi sớm, cải thiện khả năng quản lý mã nguồn và hỗ trợ phát triển ứng dụng quy mô lớn.
- **ArcGIS Maps SDK for JavaScript:** Bộ SDK do Esri phát triển, cung cấp các công cụ và API để xây dựng ứng dụng bản đồ tương tác. Được sử dụng để tích hợp bản đồ địa lý 2D/3D, hiển thị địa điểm du lịch, dữ liệu không gian và hỗ trợ người dùng khám phá các khu vực trên bản đồ.
- **Three.js:** Thư viện JavaScript hỗ trợ xây dựng và hiển thị đồ họa 3D trên trình duyệt thông qua WebGL. Được sử dụng để tải, hiển thị và tương tác với các mô hình 3D, góp phần mang đến trải nghiệm tham quan các địa điểm du lịch trực quan và sinh động.

### Backend

- **Node.js:** Môi trường thực thi JavaScript phía máy chủ (Server-side), cho phép xây dựng các ứng dụng Backend với khả năng xử lý bất đồng bộ và hỗ trợ nhiều kết nối đồng thời.
- **Express.js:** Framework xây dựng ứng dụng web trên Node.js, hỗ trợ định tuyến (Routing), xây dựng RESTful API và xử lý các yêu cầu HTTP từ Frontend.
- **TypeScript:** Được sử dụng trong Backend để định nghĩa kiểu dữ liệu cho các đối tượng, request, response và các thành phần xử lý nghiệp vụ, giúp mã nguồn nhất quán, dễ bảo trì và hạn chế lỗi trong quá trình phát triển.

### Triển khai

- **Render:** Nền tảng Cloud hỗ trợ triển khai và vận hành ứng dụng web. Được sử dụng để deploy các dịch vụ Frontend và Backend, đồng thời hỗ trợ kết nối với cơ sở dữ liệu và cung cấp môi trường để ứng dụng hoạt động trên Internet.

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_FOLDER>
```

### 2. Cấu hình biến môi trường

Tạo file `.env` dựa trên file mẫu `.env.example` có sẵn trong từng thư mục.

**Frontend:**

```bash
cd frontend
cp .env.example .env
```

**Backend:**

```bash
cd backend
cp .env.example .env
```

Sau đó, cập nhật các biến môi trường phù hợp với cấu hình máy tính và môi trường chạy dự án.

### 3. Cài đặt và chạy Frontend

Mở terminal tại thư mục gốc dự án:

```bash
cd frontend
npm install
npm run dev
```

### 4. Cài đặt và chạy Backend

Mở một terminal khác:

```bash
cd backend
npm install
npm run dev
```

Sau khi hoàn tất, Frontend và Backend sẽ được khởi chạy độc lập trên môi trường local.

> **Lưu ý:** Đảm bảo các biến môi trường của Frontend và Backend đã được cấu hình chính xác trước khi chạy dự án.

## 📸 Hình ảnh kết quả

Một số giao diện và chức năng chính của dự án:

<!-- Bổ sung hình ảnh thực tế của dự án tại đây -->

| Bản đồ GIS 3D | Tương tác mô hình 3D |
| ------------- | -------------------- |
| Thêm hình ảnh | Thêm hình ảnh        |

| Thông tin địa điểm | Tuyến đường tham quan |
| ------------------ | --------------------- |
| Thêm hình ảnh      | Thêm hình ảnh         |

## 🎓 Thông tin đồ án

- **Môn học:** IE402 – Hệ thống thông tin địa lý 3 chiều
- **Tên đề tài:** Italy Virtual Tourism – 3D GIS
- **Lĩnh vực:** Hệ thống thông tin địa lý 3D và du lịch thực tế ảo.

---

_Được phát triển bởi nhóm sinh viên trong khuôn khổ đồ án môn học IE402._
