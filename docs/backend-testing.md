# Tài khoản, đánh giá, yêu thích và dữ liệu demo

Đã hoàn thiện và kiểm tra luồng cơ bản đăng ký → đăng nhập → đánh giá/thả tim → tải lại trang → sửa/xóa/bỏ tim → đăng xuất. Tài khoản, đánh giá và yêu thích được lưu thực trong PostgreSQL. Dữ liệu demo là nội dung thử được đánh dấu rõ, sử dụng cùng API với tài khoản tự đăng ký.

## Những phần đã sửa

- Bổ sung `@types/jsonwebtoken` và lockfile, kiểm tra TypeScript/build backend đạt.
- Đăng ký kiểm tra mật khẩu tối thiểu 8 ký tự, tối đa 72 byte UTF-8 theo giới hạn bcrypt; mật khẩu lưu dạng hash.
- Cấu hình CORS cho hai địa chỉ localhost/127.0.0.1 tương ứng khi phát triển cục bộ; production vẫn theo `FRONTEND_URL`.
- API chi tiết trả riêng `myReview` để người dùng vẫn sửa/xóa đánh giá của mình khi bài đó không còn trong 20 đánh giá công khai mới nhất.
- API lưu đánh giá trả đủ thông tin tác giả; mỗi người chỉ có một đánh giá cho một địa điểm, cập nhật không tạo bản sao.
- Giao diện đồng bộ lại biểu mẫu theo người dùng/đánh giá; danh sách yêu thích hủy kết quả tải cũ khi chuyển tài khoản.
- Chế độ dữ liệu cục bộ chỉ chọn nguồn thông tin địa điểm. Đăng nhập, đánh giá và yêu thích luôn gọi API thật; không cần chuyển toàn bộ bản đồ sang dữ liệu máy chủ mới dùng được các chức năng này.
- Giữ nguyên tour ảnh `_local`, mô hình nhẹ, trình xem nhúng và Docker.

## Tài khoản và nội dung mẫu

| Email | Tên hiển thị | Mật khẩu |
| --- | --- | --- |
| `demo.an@example.test` | `[DEMO] Minh An` | `RomaDemo2026!` |
| `demo.ha@example.test` | `[DEMO] Thu Hà` | `RomaDemo2026!` |
| `demo.bao@example.test` | `[DEMO] Gia Bảo` | `RomaDemo2026!` |

Đã tạo ba tài khoản, chín đánh giá trên ba công trình và năm cặp yêu thích mặc định. Mỗi bình luận bắt đầu bằng `[DỮ LIỆU MẪU]`; đây là nội dung minh họa do dự án tạo, không phải trải nghiệm khách tham quan thực tế. Điểm trung bình khi chạy demo có tính các đánh giá mẫu này.

Từ thư mục `backend`:

```powershell
npm install
npm run db:demo
```

Lệnh chỉ chạy với PostgreSQL cục bộ và ngoài môi trường production. Không tự thêm vào migration hoặc quá trình khởi động. UUID/email demo cố định; nếu trùng một tài khoản khác thì rollback. Chạy lại cập nhật mật khẩu/tên/đánh giá demo và thêm lại các cặp yêu thích mặc định, không nhân bản. Những cặp yêu thích khác đã thêm bằng tài khoản demo vẫn được giữ.

Xóa riêng dữ liệu demo khi không muốn nó ảnh hưởng điểm trung bình:

```powershell
npm run db:demo:clear
```

Lệnh xác nhận đồng thời UUID và email trước khi xóa ba người dùng demo. Các đánh giá/yêu thích thuộc họ được xóa theo quan hệ dữ liệu; không xóa tài khoản khác, ba địa điểm, ảnh hoặc tour. Tạo lại bằng `npm run db:demo`.

## Chạy ứng dụng

Backend cần `.env` của dự án với kết nối PostgreSQL và JWT secret đã cấu hình; chạy migration nếu là database mới. Sau đó chạy backend/frontend ở hai cửa sổ:

```powershell
# Thư mục backend
npm run dev

# Thư mục frontend, ở cửa sổ khác
npm run dev
```

Mở trang Tài khoản, đăng nhập bằng một tài khoản demo hoặc tự đăng ký. Chọn công trình để xem mục Bình luận & đánh giá, lưu/bỏ yêu thích. Từ menu tài khoản có danh sách yêu thích và đăng xuất. Làm mới trang vẫn giữ phiên đăng nhập còn hạn và đọc lại nội dung từ database.

## Kiểm tra đã chạy

Từ `backend`:

```powershell
npm run typecheck
npm run build
npm run test:integration
npm run test:browser
```

- `test:integration`: 39 kiểm tra API với database thật và máy chủ test ở cổng tự chọn. Bao gồm validation, email trùng/chuẩn hóa, mật khẩu hash, token sai/hết hạn, quyền sở hữu đánh giá, cập nhật không trùng, bài của mình ngoài 20 bài mới, thống kê sao, yêu thích không trùng/cách ly theo người dùng và đọc lại trong phiên mới. Chỉ xóa các ID tài khoản do lần chạy đó tạo, kèm tiền tố email ngẫu nhiên tương ứng.
- `test:browser`: dùng Edge cài trên máy, hồ sơ trình duyệt tạm riêng. Cần frontend ở `127.0.0.1:5173` và backend ở URL frontend đang cấu hình. Kiểm tra bằng giao diện ứng dụng thật: đăng ký/đăng nhập/đăng xuất, sửa/xóa đánh giá, yêu thích/danh sách/bỏ yêu thích, tải lại trang và hoạt động trong chế độ bản đồ cục bộ. Tài khoản QA được xóa sau khi chạy. Có thể đặt `ACCOUNT_QA_URL`/`ACCOUNT_QA_BROWSER` nếu dùng cổng hoặc trình duyệt khác. Phạm vi kiểm tra này là các chức năng tài khoản, không nghiệm thu bản đồ WebGL/Sketchfab.
- Đã chạy seed hai lần và kiểm tra kết quả vẫn là 3 tài khoản, 9 đánh giá, 5 cặp yêu thích; không còn tài khoản QA sau các lần kiểm thử.
- Frontend đã đạt TypeScript, kiểm tra tour ảnh và hình học khung ảnh. Bản build frontend và backend được kiểm tra riêng.

## Lưu trữ

PostgreSQL giữ người dùng, hash mật khẩu, đánh giá và quan hệ yêu thích. Ảnh/tour hiện vẫn nằm trong `_local`; thêm dữ liệu demo tài khoản không chuyển ảnh hoặc mô hình vào database hay Docker. Tiến độ tour vẫn lưu trên trình duyệt, độc lập với tài khoản và dữ liệu demo này.
