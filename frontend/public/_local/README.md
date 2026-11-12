# Bộ dữ liệu tour ảnh trên máy

Ba tour hoàn chỉnh: Colosseum **8 cảnh**, Constantine **7 cảnh**, Pantheon **12 cảnh**. Tổng **27 ảnh**, **66 điểm chuyển ảnh hai chiều**, **54 điểm thông tin**, **9 câu hỏi**.

Ảnh chính: 1920px, tổng 25.12 MiB. Thumbnail danh sách: tối đa 360 × 240px, tổng 573 KiB. Trình xem chỉ mở ảnh hiện tại và chuẩn bị trước tối đa hai ảnh lân cận; không tải cả ba bộ ảnh đầy đủ ngay khi vào trang.

## Tệp dữ liệu

- `region.json`: dữ liệu địa điểm thử và ảnh bìa thật.
- `tours.json`: danh mục ba tour.
- `colosseum-tour.json`, `arch-of-constantine-tour.json`, `pantheon-tour.json`: cảnh, đồ thị điểm nối, mô tả, nguồn và câu hỏi.
- `images/` và `images/thumbs/`: ảnh chính và thumbnail.
- `sources.json`, `tour-assets.json`, `IMAGE_SOURCES.md`: metadata, giấy phép và danh mục ảnh chọn.
- `research/`: metadata tham khảo; `qa/`: ảnh ghép kiểm tra nội dung/vị trí hotspot.
- `sources/*.osm`: dữ liệu đã dùng căn chỉnh mô hình, độc lập với tour ảnh.

## Chạy và tái tạo

Chạy `npm run dev` trong `frontend`. Tour cũng đọc được dữ liệu cục bộ khi dùng `npm run preview` trên máy; dữ liệu địa điểm có thể dùng API thật mà tour vẫn mở được. Không cần nhập tour vào database, không sửa Docker.

Tải lại ảnh: `python scripts/prepare-local-assets.py` từ thư mục gốc, cần mạng và Pillow. Script kiểm tra giấy phép, JPEG, kích thước và hash; dùng lại ảnh cục bộ còn đúng hash. Chỉ tạo lại thumbnail: thêm `--thumbnails-only`.

Tạo lại JSON: `python scripts/prepare-photo-tours.py`. Biên tập lời giới thiệu, điểm thông tin và cạnh nối trong script này. Một cạnh khai báo giữa hai cảnh sẽ được sinh thành hai hotspot có chiều đi và chiều về. Tọa độ hotspot theo phần trăm ảnh gốc, đã được xem trực quan nhưng chỉ mang tính minh họa.

`_local` nằm ngoài `frontend/public`, không sao chép vào `dist`. Muốn deploy tour thật, host ba JSON và ảnh/thumbnail, sửa đường dẫn ảnh trong JSON và cấu hình `VITE_PHOTO_TOUR_BASE_URL`; URL tệp có dạng `<base>/<slug>-tour.json`.

Xem [nguồn và giấy phép ảnh](IMAGE_SOURCES.md), [mô tả tour và sơ đồ nối cảnh](../docs/photo-tours.md).

Pantheon đã thay ảnh đêm và bổ sung các góc nhìn ngang: cửa vào, toàn cảnh trung tâm, vòng tường bên, bàn thờ bên, nền đá. Xem IMAGE_SOURCES.md để phân biệt ảnh được xác nhận cùng buổi sáng với ảnh chỉ biết ngày. Chạy `python scripts/review-photo-tours.py` để tạo ảnh ghép kiểm tra điểm thông tin/điểm chuyển.
