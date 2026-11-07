# Kế hoạch chỉnh sửa giao diện Di sản Roma

Ngày lập: 06/11/2026. Trạng thái cập nhật: đã triển khai bản thử giao diện theo phạm vi người dùng chốt tiếp — bản đồ, khối nhẹ cho ba công trình, cửa sổ mô hình nhúng và ba tour ảnh cục bộ hoàn chỉnh gồm 27 cảnh có liên kết hai chiều. Lịch sử đóng góp và quản trị chưa triển khai. Xem `HUONG_DAN.md` và `docs/implementation.md` để biết kết quả kiểm tra và giới hạn hiện tại.

## 1. Mục tiêu và phạm vi

Chuyển trang chủ hiện tại từ khung nhúng mô hình sang không gian khám phá trên bản đồ nền 3D. Trên bản đồ có các mô hình minh họa do AI hỗ trợ dựng theo ảnh tham khảo; người dùng mở mô hình Sketchfab bằng nút riêng. Phần tương tác khám phá chủ yếu nằm trong tour ảnh 2D do ứng dụng tự quản lý.

Dự án cần chỉnh sửa là `E:\08_Project\3d-gis-italy`; tài liệu hiện trạng là `HUONG_DAN.md`. Dự án `E:\08_Project\GIS_LEARNING\virtual-tourism-demo` chỉ dùng làm tham khảo về bản đồ, chọn địa điểm và tour ảnh. Nội dung mục 3.2 người dùng đính kèm là cơ sở đối chiếu các màn hình.

Ba địa điểm trong phạm vi: Colosseum, Khải hoàn môn Constantine và Pantheon. Không mở rộng thêm địa điểm trong đợt đầu.

## 2. Hiện trạng đã kiểm tra

| Hạng mục | Hiện trạng | Hướng xử lý |
| --- | --- | --- |
| Trang chủ `MapPage.tsx` | Danh sách bên trái, iframe mô hình bên phải; chưa có bản đồ thật | Thay phần trung tâm bằng bản đồ nền 3D |
| `EmbedPlane.tsx` | Có khung iframe, ghi công và thông báo thiếu URL | Tái sử dụng trong cửa sổ xem mô hình |
| `DestinationDetail.tsx` | Có thông tin, ảnh, yêu thích và đánh giá | Dùng lại chức năng trong bảng chi tiết bên trái |
| Dữ liệu địa điểm | Có tọa độ, kích thước khối, hướng và màu trong kiểu dữ liệu vùng | Kiểm tra dữ liệu thật trước khi tái sử dụng để dựng mô hình |
| Mô hình nhúng | Colosseum và Constantine có bên ngoài; Pantheon có bên ngoài/bên trong theo hướng dẫn | Chỉ hiện lựa chọn có dữ liệu |
| Tài khoản và yêu thích | Có trang và các lời gọi API tương ứng | Tích hợp vào bố cục mới, kiểm tra luồng đăng nhập quay lại |
| Tour ảnh, lịch sử đóng góp, quản trị | Chưa thấy màn hình tương ứng trong router hiện tại | Lập phần bổ sung riêng, không coi là đã có |

Demo tham khảo hiện có cả model cục bộ đặt trên bản đồ và tour ảnh có hotspot. Không sao chép toàn bộ demo, dữ liệu Việt Nam hoặc chức năng tìm đường sang dự án Roma.

## 3. Chốt cách tổ chức bản đồ và mô hình

### 3.1. Bản đồ nền là không gian chính

Hiểu yêu cầu “chỉ nhúng basemap” là dùng nền bản đồ trực tuyến trong ứng dụng, còn danh sách, mô hình minh họa và tương tác do ứng dụng quản lý. Đề xuất dùng SDK bản đồ tương tự demo, thay vì một iframe bản đồ độc lập, để ứng dụng điều khiển camera, gắn mô hình và bắt sự kiện chọn địa điểm. Cần xác minh cấu hình SDK, nguồn nền và quyền truy cập ở bước thử nghiệm đầu tiên.

Nếu buộc dùng iframe bản đồ thuần, cần kiểm tra API giao tiếp của nhà cung cấp trước; không mặc định có thể gắn mô hình hoặc đồng bộ lựa chọn vào bên trong iframe.

### 3.2. Hai loại mô hình có vai trò riêng

| Loại | Nơi hiển thị | Mục đích |
| --- | --- | --- |
| Mô hình minh họa do AI hỗ trợ dựng | Đặt trực tiếp trên bản đồ bằng tài nguyên/khối 3D do ứng dụng quản lý | Nhận diện công trình, chọn địa điểm, quan sát trong bối cảnh địa lý |
| Mô hình nhúng Sketchfab | Cửa sổ lớn khi bấm “Xem chi tiết mô hình 3D” | Xem chi tiết mô hình nguồn và thao tác mà trình xem cung cấp |

Link iframe là đầu vào của trình xem nhúng; kế hoạch không coi nó là tệp mô hình để đặt trực tiếp lên bản đồ. Khi có tệp mô hình được phép sử dụng, có thể đánh giá thay thế bản minh họa sau.

“AI dựng theo hình” nghĩa là dựng một tài nguyên/khối 3D có thể nạp và kiểm tra trong ứng dụng. Một ảnh render hoặc ảnh chụp màn hình chỉ dùng làm tư liệu, không tự trở thành mô hình 3D.

Quy trình dự kiến: tập hợp ảnh nhiều góc hoặc ảnh chụp từ trình xem được phép sử dụng → chọn đặc điểm nhận diện → AI hỗ trợ tạo mô hình nhẹ → kiểm tra trực quan → căn tọa độ, tỷ lệ và hướng trên bản đồ. Chỗ thiếu thông tin được đơn giản hóa, không trình bày như bản khảo sát chính xác. Giữ nguồn tham khảo và nhãn “Mô hình minh họa”.

Đặc điểm nhận diện dự kiến: Colosseum có khối elip và các tầng vòm; Constantine có ba vòm và khối đỉnh; Pantheon có tiền sảnh cột và khối mái vòm. Đây là định hướng tạo hình, cần đối chiếu ảnh thực tế trước khi dựng.

### 3.3. Tương tác không phụ thuộc mô hình nhúng

Trong phạm vi đầu, chỉ yêu cầu trình xem nhúng hỗ trợ thao tác quan sát sẵn có. Chưa cam kết chọn từng cấu kiện, gắn hotspot tùy ý hoặc đồng bộ camera trong iframe. Nếu muốn mở rộng, phải thử API của trình xem trên đúng model trước khi đưa vào phạm vi.

Phần khám phá do ứng dụng kiểm soát đặt trên ảnh 2D: chọn vùng chi tiết, chuyển cảnh, trả lời câu hỏi và ghi nhận tiến độ. Không gọi ảnh thường là ảnh 360 độ và không tạo cảm giác có thể đi vào nội thất khi chưa có dữ liệu.

## 4. Chỉnh sửa từng giao diện trong mục 3.2

| Mục | Nội dung chỉnh sửa dự kiến |
| --- | --- |
| 3.2 – Tổng quan | Mô tả rõ ba không gian: bản đồ nền với mô hình minh họa, cửa sổ mô hình nhúng, tour ảnh tương tác |
| 3.2.1 – Bản đồ và tìm kiếm | Bản đồ chiếm phần chính; bảng trái có tìm kiếm/danh sách/chi tiết; chọn marker hoặc mô hình cập nhật cùng một địa điểm và camera; có thu gọn và nút về tổng quan |
| 3.2.2 – Chi tiết địa điểm | Giữ ảnh, tổng quan, đánh giá; tách “Đến vị trí trên bản đồ”, “Xem chi tiết mô hình 3D” và “Khám phá qua ảnh” thành ba hành động rõ nghĩa |
| 3.2.3 – Tham quan ảo | Ghi rõ là tour ảnh 2D có hotspot, chuyển cảnh, thuyết minh, nhiệm vụ và tiến độ; có quay lại, vừa khung và thoát |
| 3.2.4 – Menu tài khoản | Đặt góc trên phải; khách có đăng nhập/đăng ký; thành viên có yêu thích, đóng góp, chuyển tài khoản, đăng xuất; mục quản trị theo quyền |
| 3.2.5 – Xác thực | Mở từ menu hoặc thao tác cần đăng nhập; giữ địa điểm, truy vấn và ngữ cảnh để quay lại; giữ bản nháp đánh giá nếu có |
| 3.2.6 – Yêu thích | Hiển thị trong bảng bên hoặc màn riêng phù hợp màn hình; chọn mục đưa về đúng địa điểm trên bản đồ; bỏ lưu có trạng thái xử lý/lỗi |
| 3.2.7 – Lịch sử đóng góp | Bổ sung màn/API lấy nội dung của tài khoản hiện tại; mở địa điểm, chỉnh sửa hoặc xóa nội dung của mình |
| 3.2.8 – Quản trị | Tách quản lý mô hình minh họa, URL mô hình nhúng và tour ảnh; không dùng tỷ lệ/hướng đặt bản đồ để mô tả cấu hình iframe |

Sau khi triển khai, sửa `HUONG_DAN.md` để phản ánh hành vi mới. Nội dung hiện nói bản đồ đã bị gỡ là mô tả phiên bản đang chạy, chưa sửa thành khẳng định đã khôi phục trong giai đoạn lập kế hoạch.

## 5. Bố cục và luồng sử dụng

Máy tính: bảng trái khoảng 340–400 px, bản đồ chiếm phần còn lại, tài khoản ở góc phải. Màn hình nhỏ: danh sách/chi tiết dùng bảng trượt phía dưới; mô hình nhúng và tour ảnh có thể mở toàn màn hình.

Luồng chính:

1. Mở ứng dụng → thấy bản đồ tổng quan ba công trình và danh sách địa điểm.
2. Tìm hoặc chọn địa điểm → cập nhật bảng trái, đánh dấu lựa chọn và đưa camera đến công trình.
3. Bấm “Xem chi tiết mô hình 3D” → mở iframe đúng địa điểm; chọn bên ngoài/bên trong nếu có; đóng để trở lại bản đồ.
4. Bấm “Khám phá qua ảnh” → mở cảnh đầu hoặc tiếp tục tiến độ đã lưu; chọn chi tiết, chuyển cảnh và làm nhiệm vụ.
5. Thoát tour → giữ địa điểm, camera và nội dung tìm kiếm trước đó.

Chỉ tải iframe khi mở cửa sổ mô hình. Khi đóng thì giải phóng trình xem; tour ảnh hoạt động độc lập với việc iframe có tải được hay không. Bản đồ lỗi vẫn cho phép xem danh sách, thông tin và mở tour từ bảng bên.

## 6. Tương tác giúp ba địa điểm có nội dung để khám phá

Không chỉ thêm các dấu thông tin để đọc. Mỗi địa điểm có một hành trình ngắn với mục tiêu, phản hồi sau thao tác và trạng thái hoàn thành. Các nội dung dưới đây là đề xuất, chỉ bật khi đã có ảnh và nội dung được kiểm chứng.

| Địa điểm | Trải nghiệm đề xuất | Thao tác và kết quả |
| --- | --- | --- |
| Colosseum | “Khám phá cấu trúc đấu trường”: tổng thể → tầng vòm → không gian bên trong nếu có ảnh | Chọn chi tiết trên ảnh, mở góc nhìn liên quan, trả lời câu hỏi nhận diện; cập nhật các chi tiết đã khám phá |
| Constantine | “Giải mã Khải hoàn môn”: tổng thể → ba vòm → chi tiết trang trí có ảnh | Tìm các chi tiết được gợi ý; bấm đúng vùng để xem ảnh cận và giải thích; câu hỏi tổng kết có phản hồi |
| Pantheon | “Từ tiền sảnh đến mái vòm”: mặt tiền → nội thất → lỗ mở mái nếu có ảnh | Chọn điểm quan sát và vùng kiến trúc; trả lời câu hỏi nhận diện; có nút mở mô hình bên trong để đối chiếu |

Mức tối thiểu đề xuất cho mỗi địa điểm: 2–3 cảnh có tư liệu phù hợp, ít nhất một điểm chuyển cảnh, ba điểm khám phá và một nhiệm vụ/câu hỏi. Nếu chưa đủ tư liệu thì ghi rõ phần thiếu, chưa hiển thị hành trình như đã hoàn chỉnh.

Tiến độ gồm số cảnh/chi tiết đã khám phá và nhiệm vụ đã hoàn thành; khách có thể lưu cục bộ. Tách tiến độ theo địa điểm và phiên bản nội dung để tránh tính lại cùng một điểm hoặc giữ kết quả sai sau khi thay tour. Không cần tài khoản chỉ để khám phá.

So sánh ảnh xưa/nay và thuyết minh âm thanh là mở rộng sau khi đủ tư liệu; không thuộc tiêu chí hoàn thành đợt đầu. Không cam kết tương tác ánh sáng vật lý hay đi lại trong mô hình nhúng.

## 7. Dữ liệu và phần mã dự kiến ảnh hưởng

Giữ `destination_embed` cho URL, loại bên ngoài/bên trong và ghi công. Tách cấu hình mô hình minh họa khỏi cấu hình nhúng, gồm: loại tài nguyên, đường dẫn hoặc tham số dựng khối, tọa độ neo, tỷ lệ, hướng, cao độ, nguồn và ghi chú độ chính xác. Kiểm tra các migration cũ trước khi quyết định tái sử dụng hay thêm migration mới; không chạy lại migration cũ để khôi phục giao diện.

Dữ liệu tour đề xuất:

- `tour`: địa điểm, cảnh bắt đầu, tiêu đề và phiên bản nội dung.
- `scene`: ảnh, chú thích, nguồn, danh sách hotspot và thứ tự hiển thị.
- `hotspot`: loại thông tin/chuyển cảnh/nhiệm vụ, vị trí chuẩn hóa trên ảnh, cảnh đích hoặc nội dung liên quan.
- `task`: lời nhắc, mục tiêu/lựa chọn, điều kiện hoàn thành và phản hồi.
- `source`: tác giả, URL nguồn, ghi công và thông tin quyền sử dụng đã xác minh.

Điểm tương tác phải bám đúng nội dung ảnh khi đổi kích thước, zoom hoặc có khoảng trống quanh ảnh. Liên kết cảnh phải hợp lệ; cảnh khởi đầu phải tồn tại. Giai đoạn đầu có thể dùng JSON quản lý phiên bản; khi làm quản trị, chọn một nguồn dữ liệu chính và bổ sung API lưu trữ tương ứng.

| Khu vực | Công việc dự kiến |
| --- | --- |
| `frontend/src/pages/MapPage.tsx` | Tổ chức bản đồ, bảng bên và trạng thái lựa chọn |
| Các thành phần mới | Bản đồ nền, mô hình minh họa, bảng chi tiết, cửa sổ mô hình, tour ảnh, hotspot và tiến độ |
| `frontend/src/components/EmbedPlane.tsx` | Dùng lại khung nhúng, bổ sung hành vi tải/lỗi phù hợp và mở nguồn ngoài khi cần |
| `frontend/src/App.tsx`, `Header.tsx` | Bố cục, menu tài khoản và điều hướng giữ ngữ cảnh |
| `frontend/src/lib/api.ts` | Kiểu dữ liệu mô hình/tour và API mới khi cần |
| Backend, migration mới | Dữ liệu tour, lịch sử đóng góp, quyền quản trị và API chỉnh sửa theo giai đoạn |
| `HUONG_DAN.md` | Cập nhật hướng dẫn chạy, thao tác và giới hạn sau triển khai |

Không coi giới hạn iframe là lý do khóa chức năng toàn trang. Chuẩn bị trạng thái đang tải, thiếu dữ liệu, tài nguyên lỗi, thử lại và liên kết mở mô hình tại nguồn. Trước triển khai xác minh cách nhận biết lỗi của trình xem, không mặc định sự kiện tải iframe có nghĩa mô hình bên trong đã tải thành công.

## 8. Thứ tự triển khai và đầu ra

### Giai đoạn 1 — Kiểm chứng bản đồ và tài nguyên

- Chạy phiên bản hiện tại; kiểm tra API vùng và tọa độ ba địa điểm.
- Thử một bản đồ nền 3D trong React, chọn marker và đưa camera tới địa điểm.
- Dựng thử một mô hình minh họa, đặt trên bản đồ và kiểm tra hướng/tỷ lệ; dùng Constantine làm mẫu nếu tư liệu đủ rõ.
- Lập danh sách ảnh tham khảo, ảnh tour và URL nhúng có thể dùng cho từng địa điểm.

Đầu ra: bản thử nhỏ chứng minh bản đồ và mô hình minh họa hoạt động cùng nhau, cùng danh sách dữ liệu còn thiếu. Nếu cách nạp tài nguyên không đạt, xử lý tại đây trước khi dựng đủ ba model.

### Giai đoạn 2 — Luồng chính bản đồ → chi tiết → mô hình nhúng

- Làm bố cục bản đồ và bảng trái; đồng bộ tìm kiếm, chọn mô hình/marker và camera.
- Hoàn thiện mô hình minh họa cho cả ba địa điểm.
- Chuyển iframe sang cửa sổ “Xem chi tiết mô hình 3D”; giữ lựa chọn bên ngoài/bên trong theo dữ liệu.
- Giữ ngữ cảnh khi đóng cửa sổ hoặc quay lại danh sách; xử lý màn hình nhỏ và lỗi tải.

Đầu ra: giao diện chính đúng định hướng, không cần mở iframe để nhận diện công trình trên bản đồ.

### Giai đoạn 3 — Tour ảnh tương tác

- Làm một tour Constantine hoàn chỉnh trước: chuyển cảnh, điểm khám phá, nhiệm vụ, phản hồi và tiến độ.
- Kiểm tra trải nghiệm rồi áp dụng cùng bộ hiển thị cho Colosseum và Pantheon bằng dữ liệu riêng.
- Hoàn thiện điều khiển zoom/vừa khung, quay lại, thoát tour, nguồn ảnh và khả năng sử dụng bằng bàn phím.

Đầu ra: mỗi địa điểm có hành trình thực sự thao tác được, có mục tiêu và phản hồi ngoài việc đọc thông tin.

### Giai đoạn 4 — Tài khoản và đóng góp

- Tích hợp yêu thích, đánh giá và menu vào giao diện mới.
- Bổ sung lịch sử đóng góp và thao tác sửa/xóa của chính người dùng.
- Hoàn thiện luồng đăng nhập quay lại, chuyển tài khoản và xóa trạng thái cá nhân khi đăng xuất.

### Giai đoạn 5 — Quản trị, tài liệu và nghiệm thu

- Bổ sung quản trị địa điểm, hai loại mô hình, cảnh, hotspot và nội dung đánh giá; kiểm tra quyền ở backend.
- Cập nhật `HUONG_DAN.md` và sửa nội dung mục 3.2 theo chức năng thực tế đã hoàn thành.
- Chạy kiểm tra build, kiểm tra dữ liệu và thực hiện kịch bản nghiệm thu dưới đây.

Ưu tiên demo giai đoạn 1–3 để giải quyết vấn đề trải nghiệm trước. Giai đoạn 4–5 vẫn nằm trong kế hoạch hoàn thiện các màn hình đã nêu trong mục 3.2; nếu chưa làm phải ghi rõ là chưa hoàn thành.

## 9. Tiêu chí nghiệm thu

- [ ] Trang chủ có bản đồ nền thật và ba địa điểm đúng tọa độ; mô hình minh họa có ghi chú phù hợp.
- [ ] Chọn từ danh sách, kết quả tìm kiếm, marker hoặc mô hình đều cập nhật cùng địa điểm và bảng chi tiết.
- [ ] Nút tới vị trí, xem mô hình nhúng và khám phá ảnh có hành vi riêng đúng nhãn.
- [ ] Mô hình nhúng đúng địa điểm; Pantheon chỉ hiện lựa chọn bên trong khi có URL; đóng cửa sổ giữ ngữ cảnh.
- [ ] Mỗi địa điểm đạt mức tương tác tối thiểu ở mục 6 hoặc được ghi rõ thiếu tư liệu, chưa nghiệm thu tour đó.
- [ ] Chuyển cảnh/quay lại và nhiệm vụ có phản hồi đúng; tiến độ không tăng lặp khi bấm lại cùng điểm.
- [ ] Hotspot đúng vị trí khi thu phóng và đổi kích thước, dùng được bằng chuột, cảm ứng và bàn phím.
- [ ] Thoát tour giữ lựa chọn, truy vấn và camera; tour vẫn dùng được khi bản đồ hoặc iframe gặp lỗi.
- [ ] Khách khám phá được; chức năng cá nhân yêu cầu đăng nhập và quay lại đúng ngữ cảnh.
- [ ] Người dùng chỉ sửa/xóa đóng góp của mình; quản trị được kiểm tra quyền qua API.
- [ ] Ảnh và mô hình có nguồn; các thông tin chưa xác minh không hiển thị như dữ liệu chắc chắn.
- [ ] Build frontend/backend đạt; kiểm tra dữ liệu tour không có liên kết hỏng; kiểm tra trực quan cả máy tính và màn hình nhỏ.
- [ ] Hướng dẫn và mô tả mục 3.2 phân biệt đúng mô hình minh họa trên bản đồ, mô hình nhúng và tour ảnh 2D.

## 10. Phạm vi của lần lập kế hoạch ban đầu

Ở thời điểm lập kế hoạch ban đầu, chưa thay đổi giao diện, tạo mô hình, tải ảnh hoặc sửa database. Sau đó người dùng yêu cầu triển khai khối đơn giản và thử tour một địa điểm bằng dữ liệu `_local`; trạng thái mới được ghi ở đầu tài liệu. Các phần mở rộng chưa thực hiện vẫn là đề xuất.
