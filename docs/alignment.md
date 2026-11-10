# Căn chỉnh mô hình và tự mở trình xem — 06/11/2026

## Trình xem nhúng

URL lưu trong dữ liệu vẫn là URL embed gốc đã kiểm tra. Ứng dụng hiện dùng Viewer API chính thức, khởi tạo với `autostart=1`, `preload=1`, `camera=0`, gọi `api.start()` và theo dõi `viewerready`. Không coi sự kiện iframe load là mô hình đã sẵn sàng. Phương án chỉ thêm query URL trước đó chưa được xác nhận hoạt động trên trình duyệt người dùng; đã thay bằng điều khiển API và trạng thái tiến độ thực. Tải trước một trình xem của địa điểm đang chọn và giữ iframe khi đóng/mở; mô hình đã sẵn sàng được tạm dừng lúc ẩn, tiếp tục khi mở. Không tải trước toàn bộ mô hình của ba địa điểm.

Nguồn: [Sketchfab Viewer initialization](https://sketchfab.com/developers/viewer/initialization), [Sketchfab integration optimization](https://www.sketchfab.com/blogs/enterprise/optimize-integration-3d-models). Thời gian tải tài nguyên vẫn phụ thuộc mô hình và kết nối; cấu hình này bỏ lượt bấm Play, không loại bỏ thời gian tải.

## Cách kiểm tra vị trí

Dữ liệu gốc lấy từ OpenStreetMap API ngày 06/11/2026, lưu tại `_local/sources/colosseo.osm` và `pantheon.osm`. Tách các đường biên công trình rồi đổi sang mặt phẳng đông/bắc theo mét để đối chiếu tâm, góc xoay và đường bao hình học của mô hình.

| Công trình | Nguồn đối chiếu | Điều chỉnh |
| --- | --- | --- |
| Constantine | [OSM way 23590989](https://www.openstreetmap.org/way/23590989) | Tâm lấy trung bình bốn góc: 12.490666775, 41.889762225; khối cũ lệch khoảng 5,7 m về tây. Trục dài xoay khoảng 13° theo chiều kim đồng hồ từ hướng đông; kích thước nền khoảng 25,4 × 6,95 m. Giảm chiều dày thân và phần đế/cột để khớp đường bao này. |
| Colosseum | [OSM relation 1834818](https://www.openstreetmap.org/relation/1834818), các outer way 136190591/136190592/136190595/994907267 | Dùng elip bao nhỏ nhất của đường biên hiện còn để căn mô hình trên nền: tâm 12.49235546, 41.89025632; trục 189,53 × 141,53 m; góc 19,95°. Đây là elip minh họa bao di tích hiện tại, không phải số đo trục nguyên thủy của công trình. Đường biên di tích không phải elip hoàn chỉnh, nên mô hình đơn giản vẫn có sai khác cục bộ. |
| Pantheon | [OSM way 251373428](https://www.openstreetmap.org/relation/3373279) | Tâm mái/khối tròn 12.47683457, 41.89855333; đường kính ngoài khoảng 55,3 m. Khối trước dùng đường kính 43,3 m gần với lòng trong, nên bị nhỏ. Sảnh rộng 35,7 m, sâu 27,8 m, tâm sảnh cách tâm khối tròn 35,6 m về phía trước; hướng 356,5° để sảnh quay về quảng trường phía bắc hơi lệch tây. |
| Vittoriano | [OSM relation 1849830](https://www.openstreetmap.org/relation/1849830) | Gốc mesh minh họa 12.48312, 41.89465; hướng 343° (tức −17°), suy ra từ cạnh mặt tiền OSM. Khối ngang 138 m; phạm vi dọc 170 m gồm cầu thang vào, không phải chiều sâu riêng tòa nhà. Đỉnh tượng tứ mã 81 m. Đối chiếu mặt bằng với snapshot OSM, chưa nghiệm thu trực tiếp trên WebScene. |

Quy ước hướng trong mã: 0° giữ trục X theo hướng đông và trục Y theo hướng bắc; giá trị dương xoay theo chiều kim đồng hồ. Đây không phải quy ước bearing của trục X từ hướng bắc. Hướng camera được quản lý riêng.

Các cấu hình nằm tại `frontend/src/lib/landmarkPlacement.ts`. Mesh, marker, vùng ẩn nhà nền và camera cùng dùng cấu hình đã căn chỉnh. Tọa độ POI dùng tra cứu trong dữ liệu gốc được giữ nguyên; không cập nhật database. Cấu hình này áp dụng cả dữ liệu `_local` và dữ liệu API có các thông số seed cũ.

## Giới hạn xác nhận

Kiểm tra riêng Pantheon theo ảnh người dùng gửi tiếp: đường kính đường tròn fit từ OSM khoảng 55,24 m, gần với khối 55,3 m; hướng cạnh trước sảnh đo được 356,47°, gần với cấu hình 356,5°. Tâm không cần dịch thêm. Cạnh trước sảnh trên OSM cách tâm khối tròn khoảng 49,5 m theo trục dọc công trình; đế mô hình trước đó vươn tới 51,25 m. Đã rút sảnh và giảm phần đế nới rộng, đưa cạnh đế trước về khoảng 49,7 m. Các khoảng cách này là đối chiếu hình học với bản chụp dữ liệu OSM, không biểu thị độ chính xác trắc địa ngoài thực địa. Ảnh `alignment-check.png` lưu lần đối chiếu trước khi thu gọn đế sảnh này.

Đã đối chiếu hình học mặt bằng với dữ liệu OSM, kiểm tra tam giác/pháp tuyến/vùng ẩn và build. Ảnh đối chiếu tại `_local/qa/alignment-check.png` là biểu đồ hình học theo tọa độ, không phải ảnh chụp trình duyệt. WebScene có thể dùng phiên bản OSM khác; nền địa hình hoặc cách dựng khối minh họa vẫn có sai số. Chưa nghiệm thu lại bằng điều khiển trình duyệt/WebGL trong phiên này; không coi các giá trị trên là kết quả khảo sát trắc địa.

Nguồn dữ liệu: © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).
