# Bản thử giao diện — 06/11/2026

Cập nhật tiếp: iframe tải trước khi chọn địa điểm, giữ tài nguyên khi đóng/mở cửa sổ; vị trí khối đã căn theo dấu công trình OSM bằng cấu hình dùng chung cho API và bản thử. Xem [phương pháp, tọa độ và giới hạn xác nhận](alignment.md). Colosseum dùng elip bao phần di tích hiện còn; Pantheon dùng đường kính ngoài thay cho kích thước lòng trong. Tọa độ POI gốc và database giữ nguyên.

## Đã triển khai

- Giao diện màu kem, xanh olive và đất nung, bảng tìm kiếm/chi tiết bên trái, bản đồ bên phải; bố cục xếp dọc trên màn hình nhỏ.
- Bản đồ nạp WebScene `c7400d08c9d546808961e3f01e201857` giống nguồn trong GIS_LEARNING, với SceneView toàn cầu, chất lượng cao và không bóng đổ trực tiếp; ẩn nhà/cây Open3D cục bộ quanh công trình thay thế. Không có GLB, texture hoặc vòng hoạt ảnh liên tục cho công trình.
- Ba mô hình nhận diện được dựng thành mesh theo thủ tục: Colosseum có tầng cửa vòm và khán đài; Constantine có ba lối vòm, cột và gờ đá; Pantheon có mái cong liền với oculus và tiền sảnh mái tam giác. Tổng 12.648 tam giác / 37.944 đỉnh có pháp tuyến, tối đa bốn nhóm vật liệu mỗi công trình. Hình học sinh bằng mã, không thêm tệp model hoặc texture phải tải. Hướng, tỷ lệ và vị trí xấp xỉ.
- Chọn từ danh sách, tìm kiếm không phân biệt dấu hoặc bấm khối/điểm trên bản đồ để xem địa điểm. Có thu gọn bảng trái, về tổng quan và đưa camera về địa điểm đã chọn.
- Cửa sổ Sketchfab tải trước iframe cho địa điểm đang chọn, giữ cùng iframe khi đóng/mở; tạm dừng trình xem đã sẵn sàng lúc ẩn và chạy lại khi mở. Đổi địa điểm hoặc rời trang mới giải phóng iframe. Pantheon có lựa chọn bên ngoài/bên trong theo dữ liệu. Có ghi công và liên kết mở trình xem nguồn.
- Tour ảnh Colosseum: ba cảnh, năm điểm thông tin, hai điểm chuyển cảnh, lịch sử quay lại, zoom/vừa khung, danh sách điểm tương đương cho bàn phím, câu hỏi phản hồi và tiến độ lưu cục bộ theo phiên bản.
- Cửa sổ dùng native dialog để giữ focus, đóng bằng nút/Escape và trả focus về thao tác trước. Bản đồ vẫn được giữ khi mở/đóng cửa sổ.
- Bảng chi tiết tích hợp API đánh giá/yêu thích hiện có ở chế độ máy chủ. Bản thử cục bộ không gửi thao tác lưu vào tài khoản. Luồng đăng nhập từ đánh giá/yêu thích trên bản đồ nhớ địa điểm để quay lại.
- Nếu WebGL hoặc việc nạp thành phần bản đồ lỗi, bảng địa điểm và tour ảnh vẫn có thể sử dụng.

## Dữ liệu thử và ranh giới triển khai

`_local/region.json`, ba tệp tour, `_local/sources.json` và 23 ảnh trong `_local/images/` được phục vụ bởi middleware Vite **khi dev hoặc preview trên máy**. Chỉ cho phép tệp JSON/JPEG/PNG/WebP trong thư mục; từ chối đường dẫn ra ngoài thư mục.

Ba ảnh Wikimedia có tổng 879.530 byte (~859 KiB), dùng bản thu nhỏ 1280px, có tác giả, nguồn và liên kết giấy phép. Thông tin nội dung được viết tóm tắt từ nghiên cứu người dùng cung cấp; không nhập bảng lịch mở cửa/giá vé theo mùa chưa xác minh. Trỏ người dùng đến nguồn chính thức cho thông tin hiện hành.

Không sửa Docker, không chạy migration, không nhập dữ liệu thử vào PostgreSQL và không thêm phụ thuộc ứng dụng mới. `_local/` nằm ngoài thư mục public và không được sao chép vào dist. Production vẫn dùng API; tour ảnh thử chưa phải tính năng đã sẵn sàng deploy. Bộ SDK bản đồ vẫn có dung lượng riêng dù khối công trình nhẹ; đã tách thành phần bản đồ để tải riêng khỏi giao diện chính.

## Kiểm tra và giới hạn

| Nội dung | Kết quả |
| --- | --- |
| TypeScript | `npm run typecheck` đạt |
| Hình học, dữ liệu cảnh, ảnh và URL nhúng | `npm run test:explore` đạt: 37.944 đỉnh có pháp tuyến; bộ tour mới kiểm tra riêng bằng test:tour |
| Build frontend | `npm run build` đạt; SDK có cảnh báo một số gói trên 500 KB |
| Trang dev và 6 tài nguyên JSON/ảnh chính | HTTP 200, đúng kiểu nội dung |
| Truy cập `/_local/../.env`, đường dẫn mã hóa tương tự, Markdown và ảnh không tồn tại | HTTP 404 |
| Hiển thị 3D, điều khiển iframe, thao tác tour và bố cục màn hình nhỏ trong trình duyệt | Chưa xác nhận trực quan: công cụ Windows không hỗ trợ kiểm tra trình duyệt Cốc Cốc trong phiên này |
| API tài khoản, yêu thích, đánh giá với database thật | Giữ API hiện có; chưa kiểm tra tích hợp với database trong đợt này |

Các kiểm tra dữ liệu không thay thế nghiệm thu bằng trình duyệt có WebGL. Cần xem vị trí/hướng khối trên bản đồ và tinh chỉnh hotspot nếu muốn chú giải kiến trúc chính xác hơn. Không có ảnh chụp giao diện để khẳng định đã nghiệm thu trực quan.

## Chưa triển khai

Màn lịch sử đóng góp, màn quản trị, dữ liệu tour qua API và nơi lưu ảnh dùng khi deploy tiếp tục theo kế hoạch. Không hiển thị các tour chưa có dữ liệu như hành trình đã hoàn chỉnh.

## Chỉnh sửa theo ảnh phản hồi

Thay các khai báo Georgia/serif ở tiêu đề bằng bộ chữ sans hỗ trợ tiếng Việt dùng xuyên suốt, tăng cỡ chữ và chiều cao dòng của tour ảnh. Nội dung JSON đã kiểm tra ở dạng NFC; vấn đề được xử lý ở bộ chữ hiển thị, không thay đổi nội dung thuyết minh. Có ảnh kiểm tra hình học tại `_local/qa/models-preview.png`; đây là ảnh dựng kiểm tra mesh độc lập, không phải ảnh chụp ứng dụng trong trình duyệt. Nghiệm thu trực quan WebGL và font trên máy người dùng vẫn cần kiểm tra.

## Sửa lỗi tour bị khóa và trình xem còn nút Play

Nguyên nhân nút tour Colosseum biến mất/không dùng được là điều kiện phụ thuộc chế độ dữ liệu cục bộ. Đã tách việc kiểm tra tour theo tài nguyên có sẵn, bổ sung thao tác trên trang chi tiết riêng và phục vụ _local ở cả dev/preview trên máy. Không thay đổi Docker/database.

Thay iframe chỉ có query tự chạy bằng Sketchfab Viewer API: lệnh start tường minh, sự kiện viewerready, tiến độ model/texture, xử lý tải lâu, fallback và thử lại. Liên kết mở tại nguồn cũng có query tự chạy. Kiểm tra mô phỏng xác nhận start không cần tương tác thứ hai, không báo ready quá sớm, bỏ qua callback sau khi đóng/đổi và xử lý SDK lỗi. Chưa kiểm tra trình xem thật trong trình duyệt Cốc Cốc; không khẳng định autostart hoạt động trong mọi môi trường.

## Trải nghiệm ảnh toàn màn hình và tải trước mô hình

Tour ảnh dùng toàn viewport với ảnh phủ nền, bảng trái thu gọn được và ba mục Hành trình / Thông tin / Trò chơi. Có kéo ảnh, thu phóng, xem trọn ảnh, đổi cảnh qua thumbnail, mắt bật/tắt dấu, dấu ẩn hiện lại khi hover/focus và con trỏ bàn tay luôn hiện, đổi sang trạng thái nắm khi kéo ảnh. Nút mắt chỉ ẩn icon; icon hiện tại có kích thước 60px trên máy tính, 52px trên màn hình nhỏ. Điểm vẫn bám hệ tọa độ ảnh khi crop, kéo và zoom.

Iframe được khởi tạo trước khi mở cửa sổ xem, giữ cùng một cây DOM qua các lần đóng/mở. Cửa sổ tải trước được đặt ngoài vùng nhìn thay vì display:none để giữ khả năng khởi tạo trình xem, có inert/aria-hidden và không lấy focus. Không tải cùng lúc toàn bộ model của ba địa điểm. Sau viewerready, chế độ ẩn gọi stop và chế độ mở gọi start để giữ tài nguyên mà giảm việc dựng hình nền. Nếu bấm xem trước khi mạng tải xong thì vẫn phải đợi; chưa xác nhận tốc độ thực tế bằng trình xem trực tiếp trong phiên này.

TypeScript và kiểm tra Viewer API, tour, cùng test:immersive đạt; test mới kiểm tra kích thước cover/contain, giới hạn kéo và việc iframe còn trong markup khi cửa sổ đóng. Chưa có ảnh chụp trình duyệt để xác nhận bố cục hoặc hành vi hover/focus/touch thực tế.

Điều chỉnh tương tác tiếp theo: mặc định ẩn icon, hiện khi hover/focus; bấm lại điểm thông tin đang mở để đóng chi tiết. Nguồn ảnh được chuyển vào mục Thông tin ở bảng trái, bỏ lớp ghi nguồn đè trên ảnh. Đóng chi tiết không làm giảm tiến độ đã khám phá.

## Hoàn thiện ba tour ảnh

Đã hoàn thiện Colosseum (8 cảnh), Constantine (7 cảnh), Pantheon (8 cảnh), tổng 23 ảnh có nguồn/giấy phép, 54 điểm chuyển có chiều về, 46 điểm thông tin và 9 câu hỏi. Trình xem được dùng chung theo destinationSlug, không còn khóa ở Colosseum. Có cache JSON, thumbnail riêng, chuẩn bị hai ảnh lân cận, lưu cảnh/tiến độ riêng và gợi ý theo từng câu hỏi. Xem docs/photo-tours.md và _local/IMAGE_SOURCES.md. Các mục trước về tour Colosseum ba ảnh là lịch sử bản mẫu, không phải phạm vi hiện tại.


## Điều hướng ảnh theo vùng tương tác

Đã thay hướng suy từ thứ tự ảnh bằng 54 cấu hình riêng trong scripts/prepare-photo-tours.py. Hướng nhìn lên/xuống, sang bên, quay lại và đổi góc được tách rõ; ảnh phía Bắc của Constantine và ảnh trên cao của Colosseum có nhãn góc nhìn trên cao. Thành phần PhotoHotspot giữ vùng bấm cố định, dịch phần dấu/nhãn theo vị trí chuột bên trong vùng, tránh việc vùng bấm chạy theo chuột. Không ẩn con trỏ hệ thống. Bấm lại chi tiết đang mở thu gọn cả thanh trái, tiến độ giữ nguyên.

Đã có kiểm tra Edge với hồ sơ thử riêng: dựng 23 cảnh; bấm 54 đường chuyển và các điểm quay về; kiểm tra mũi tên quay lại theo lịch sử; bấm thông tin hai lần để đóng thanh; dùng sự kiện chuột thật kiểm tra tọa độ dấu bám chuột và nhãn góc từ trên cao. Ảnh chụp tại _local/qa/navigation-pointer-browser.png. Các giới hạn kiểm tra trình duyệt ở những mục trước là ghi nhận của bản mẫu cũ; kiểm tra mới tập trung vào tour ảnh, không mở rộng sang bản đồ hoặc Sketchfab. Xem docs/photo-tours.md.


## Hiệu chỉnh hai nút và mở rộng Pantheon

Con mắt được khôi phục để điều khiển các icon; kính lúp chỉ điều khiển thẻ tên cảnh hiện tại. Cả hai độc lập, mặc định tắt. Bỏ onLocate và nút tâm ngắm về bản đồ, chỉ giữ nút thoát cùng phím Escape. Thay ảnh đêm Pantheon và ảnh chạng vạng Colosseum; Pantheon có 12 cảnh, bổ sung cửa vào, góc ngang vòng tường, bàn thờ bên và nền đá. Bộ dữ liệu hiện có 27 ảnh, 66 điểm chuyển, 54 điểm thông tin, 9 câu hỏi. Có metadata captureDate và danh sách nguồn/giấy phép được sinh lại. 6 ảnh Pantheon xác nhận cùng buổi sáng, 6 ảnh còn lại cùng bộ nội thất ban ngày nhưng không rõ giờ. Kiểm tra TypeScript, dữ liệu ảnh và Edge đạt, gồm bốn tổ hợp con mắt/kính lúp, một nút thoát và bấm mọi đường chuyển/đường về. Các số liệu cũ ở trên là lịch sử triển khai.


## Hoàn thiện luồng tài khoản và mock

Đã sửa kiểu JWT/build backend; CORS loopback cho dev; trả myReview độc lập với danh sách 20 đánh giá công khai; đồng bộ biểu mẫu và tách API tài khoản khỏi chế độ dữ liệu bản đồ. Seed demo thủ công tạo 3 người dùng/9 đánh giá/5 yêu thích, chạy lại không trùng, có lệnh xóa riêng. Đã đạt 39 kiểm tra API với PostgreSQL và kiểm tra Edge toàn luồng, gồm tải lại trang ở trang chi tiết và bản đồ cục bộ. Xem docs/backend-testing.md. Các mô tả trước về việc chặn tài khoản ở chế độ cục bộ là lịch sử bản mẫu.
