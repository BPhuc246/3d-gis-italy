# Kế hoạch tăng tương tác cho tour ảnh Roma

Trạng thái: đề xuất, chưa triển khai các trò chơi và mô hình tương tác trong tài liệu này. Phạm vi hiện có: ba tour, 27 ảnh, 66 điểm chuyển, 54 điểm thông tin và 9 câu hỏi. Mục tiêu tiếp theo là để người xem thực hiện một thao tác có kết quả nhìn thấy được, rồi dùng điều vừa khám phá để tiếp tục tour.

## 1. Trải nghiệm muốn đạt

Mỗi công trình có một hoạt động riêng, kéo dài khoảng 1–3 phút. Nhịp chính: quan sát ảnh → thử thao tác → thấy thay đổi → tìm chi tiết ở cảnh liên quan → nhận một dấu hoàn thành trong hộ chiếu Roma. Không yêu cầu đọc hết thuyết minh hoặc làm câu hỏi mới được chuyển cảnh.

Ảnh vẫn là nền toàn màn hình. Con mắt bật/tắt các icon tương tác; kính lúp chỉ bật/tắt thẻ tên cảnh hiện tại, độc lập nhau. Mặc định đều tắt, rê đúng vùng vẫn tìm được icon. Chỉ giữ một nút thoát, bỏ nút về bản đồ bị trùng chức năng. Mũi tên, kéo ảnh, thu gọn thanh trái giữ cách hoạt động đã chốt. Pantheon hiện có 12 cảnh thiên về nhìn ngang và ánh sáng ban ngày. Các hoạt động bên dưới vẫn là kế hoạch.

## 2. Bộ hoạt động theo từng công trình

| Công trình | Hoạt động chính đề xuất | Thao tác của người xem | Kết quả nhìn thấy | Bản đầu |
| --- | --- | --- | --- | --- |
| Colosseum | Khám phá lớp sàn và khu ngầm | Kéo thanh nâng/hạ phần sàn; xoay mô hình cắt lớp đơn giản | Sàn tách ra để lộ các khoang bên dưới | Sơ đồ SVG kéo lớp sàn trước; mô hình 3D ở bước kế tiếp |
| Constantine | Ghép chi tiết vào mặt đứng | Chọn hoặc kéo 3 mảnh ảnh tới đúng vùng trên ảnh toàn mặt Nam | Vùng đúng sáng lên, mảnh gắn vào mặt đứng; có thể mở ảnh cận | Làm ngay với ảnh đã có và giấy phép đã ghi |
| Pantheon | Tìm đường đi của ánh sáng | Kéo nguồn sáng trên mô hình mặt cắt; chạm lỗ Oculus | Tia sáng và vệt sáng đổi vị trí trên mô hình | Sơ đồ SVG tương tác trước; không gắn với giờ thực |

Ba hoạt động trên tạo ba kiểu trải nghiệm khác nhau: khám phá cấu trúc, nhận diện bằng hình ảnh và thử nguyên nhân–kết quả. Không dùng cùng một bộ trắc nghiệm đổi tên cho cả ba địa điểm.

### 2.1 Colosseum — mở lớp sàn, khám phá Hypogeum

- Điểm vào: các cảnh `interior`, `arena`, `hypogeum`. Nút tại điểm hợp lý có biểu tượng bàn tay hoặc khối cắt lớp, nhãn “Thử mở lớp sàn”. Chỉ một điểm hoạt động chính mỗi cảnh, tránh dày icon.
- Mở một bàn khám phá nổi trên ảnh, khoảng 360–440px trên desktop; điện thoại dùng khung rộng theo màn hình. Ảnh và góc kéo phía sau giữ nguyên.
- Bước 1: kéo thanh 0–100% để nâng một phần sàn minh họa. Các lớp phía dưới xuất hiện dần; dừng ở bất kỳ vị trí nào để so sánh.
- Bước 2: chạm hai bộ phận “Sàn đấu” và “Khu ngầm” để tô sáng phần tương ứng. Phản hồi xuất hiện trực tiếp trên sơ đồ, thuyết minh ngắn theo sau.
- Bước 3: “Tìm khu ngầm trên ảnh thật” đưa về cảnh `hypogeum`, nháy viền vùng cần quan sát một lần. Người xem xác định đúng vùng thì hoàn thành nhiệm vụ.
- Mở rộng 3D: mô hình elip cắt lớp tự dựng, kéo để xoay, thanh nâng/hạ sàn, nút “Góc ban đầu”. Không cần tải mô hình toàn công trình chi tiết.
- Hoạt động phụ: ghép 3 phần của một nhịp vòm đơn giản. Đây là trò hình học minh họa; không tự nhận là mô phỏng lực hoặc tái dựng chính xác kỹ thuật thi công La Mã.
- Nội dung cần kiểm chứng: vị trí sàn/khu ngầm theo [nguồn chính thức về Hypogeum](https://colosseo.it/en/marvels/the-underground-levels-of-the-colosseum/). Mọi cơ cấu thang nâng nếu bổ sung phải có nguồn riêng trước khi minh họa hoạt động.

### 2.2 Constantine — tìm mảnh ghép trên mặt đứng

- Điểm vào: cảnh `south`; có thể bắt đầu từ `relief`, `attic`, `inscription` bằng cùng ID hoạt động.
- Dùng ba mảnh cắt từ ảnh đã có: ô tròn/phù điêu, tầng tượng, bia khắc. Nguồn ảnh, tác giả, giấy phép và ghi chú cắt ảnh được giữ trong chi tiết hoạt động.
- Lần lượt hiện một mảnh nhỏ cùng yêu cầu “Chi tiết này nằm ở đâu?”. Người xem chọn mảnh rồi chạm vùng tương ứng; kéo thả là lựa chọn bổ sung, không bắt buộc.
- Đúng: vùng sáng nhẹ, mảnh trở thành một phần của ảnh toàn mặt, bộ đếm tăng 1/3 và hiện một câu giải thích. Sai: viền rung nhẹ hoặc báo “Thử nhìn lên tầng trên”; không trừ điểm, không tự lộ đáp án ngay.
- Hoàn thành: mở một lần so sánh toàn mặt/cận cảnh và dấu “Người đọc mặt đứng”. Có nút chơi lại; không cộng tiến độ nhiều lần.
- Mở rộng 3D: một cụm cột–vòm ba cửa nhỏ, có thể xoay, chạm từng cửa để so sánh kích thước. Tránh tái tạo tượng/phù điêu chi tiết bằng khối thô khiến ảnh bị kém tự nhiên.
- Kiểm chứng vị trí: chỉ dùng các chi tiết mặt Nam cho bài ghép trên ảnh mặt Nam. Không lấy chi tiết từ mặt Bắc/mặt hông rồi yêu cầu ghép vào mặt Nam. Tham chiếu [Turismo Roma](https://www.turismoroma.it/en/places/arch-costantine) và ảnh gốc.

### 2.3 Pantheon — thử ánh sáng qua Oculus

- Điểm vào: cảnh `dome` hoặc `oculus`; điểm nhiệm vụ có hình tia sáng.
- Mở sơ đồ cắt lớp vòm với một nguồn sáng bên ngoài. Kéo nguồn sáng trên một cung giới hạn; tia sáng qua lỗ và vệt sáng trên nền dịch chuyển theo.
- Nhiệm vụ ngắn: đưa vệt sáng tới một vùng đánh dấu trên nền bằng cách đổi góc nguồn sáng. Khi tới vùng đúng, phản hồi bằng ánh sáng/viền và một câu giải thích.
- Gắn nhãn “Minh họa đường đi ánh sáng”. Bản đầu không hiển thị giờ, mùa hoặc khẳng định vệt sáng trùng với ảnh chụp; mô phỏng thiên văn theo vị trí/ngày thực cần một hạng mục riêng.
- Hoạt động phụ: chạm các vòng ô lõm để lần theo chúng về Oculus; kết thúc bằng chuyển ảnh từ `dome` sang `oculus` và quay lại được.
- Mở rộng 3D: vòm bán cầu cắt một phần, một lỗ ở đỉnh, nền đơn giản. Xoay mô hình và bật/tắt mặt cắt. Không cần bàn thờ, tượng, vật liệu đá độ phân giải cao.
- Nguồn kiến trúc/nội dung: [giới thiệu Pantheon](https://direzionemuseiroma.cultura.gov.it/pantheon/) và [lịch sử công trình](https://direzionemuseiroma.cultura.gov.it/pantheon/cenni-storici/).

## 3. Thêm mô hình 3D vào ảnh như thế nào

Đề xuất dùng một khung khám phá nổi, nền trong hoặc một tấm nền trung tính mỏng, neo vào điểm trên ảnh. Khi mở khung, người xem kéo trong khung để xoay vật thể; kéo bên ngoài vẫn di chuyển ảnh. Có nút đóng, đặt lại góc và xem rộng. Một dòng ngắn ghi rõ “Mô hình minh họa”. Không đặt nhiều khung 3D xoay cùng lúc.

Ví dụ với ảnh thứ hai của Colosseum, ID `west`: chạm một cửa vòm → mở mô hình một nhịp vòm ngay cạnh điểm vừa chạm → kéo xoay để nhìn bề dày → chạm trụ/vòm để tô sáng → đóng lại về đúng ảnh và góc nhìn. Đây là mô hình giải thích bộ phận, không phải một công trình 3D đã được ghép chính xác vào phối cảnh của bức ảnh.

Nếu muốn vật thể nằm thật trong nền ảnh, phải hiệu chỉnh riêng camera, tỷ lệ, ánh sáng và che khuất cho từng ảnh; chuyển góc sẽ lộ sai lệch. Để sau, chỉ thử một ảnh đã hiệu chỉnh. Không tự xem đây là tính năng đã có từ một iframe nhúng.

Hai mức triển khai:

1. **Ưu tiên:** khối nhỏ do dự án tự dựng, không texture hoặc texture rất nhỏ; đóng gói thành GLB khi cần trình xem có sẵn. Dùng Three.js nếu cần trực tiếp điều khiển từng bộ phận/ánh sáng; chọn thư viện sau bản thử, không thêm đồng thời nhiều bộ dựng 3D. Bản đầu của trò chơi vẫn chạy bằng SVG/CSS.
2. **Mô hình chi tiết có sẵn:** mở bằng trình xem Sketchfab hiện có. Chỉ nối sự kiện camera/chọn bộ phận nếu Viewer API và chính mô hình cho phép; cần khảo sát tên/nút bộ phận, không mặc định iframe nào cũng hỗ trợ trò chơi. Không chèn lớp game xuyên vào nội dung iframe khác nguồn. Nếu chỉ xoay/xem một GLB cục bộ, có thể khảo sát `<model-viewer>`: tài liệu chính thức có [điều khiển camera](https://modelviewer.dev/examples/stagingandcameras/) và [điểm tương tác gắn lên mô hình](https://modelviewer.dev/examples/annotations/). Khả năng này không thay thế logic trò chơi, nâng hạ sàn hoặc mô phỏng ánh sáng tùy chỉnh.

## 4. Giao diện và thao tác

- Một mục “Thử tương tác” trong thanh trái, cùng nút ngay tại cảnh có liên quan. Không tự mở game khi đổi ảnh.
- Phân biệt icon: mũi tên là chuyển cảnh; dấu thông tin là đọc; bàn tay/khối là thao tác. Chế độ gợi ý áp dụng nhất quán cho icon và nhãn.
- Trong lúc kéo vật thể hoặc mảnh ghép, ảnh không bị kéo theo. Khi thao tác kết thúc hoặc đóng hoạt động, ảnh trở lại tương tác bình thường.
- Chạm có phản hồi ngay: bộ phận sáng, vật thể đổi vị trí, vệt sáng dịch chuyển hoặc mảnh ghép được gắn. Dòng giải thích ngắn đi sau kết quả.
- Có “Thử lại”, “Gợi ý” và “Đóng”; không bắt buộc âm thanh, không tự bật âm thanh nền.
- Bàn phím: Tab chọn, Enter/Space xác nhận; các thanh kéo dùng phím mũi tên. Bài kéo thả có phương án chọn mảnh rồi chọn ô đích.
- Escape đóng hoạt động trước; Escape tiếp theo mới thoát tour. Đóng hoạt động trả focus về nút đã mở nó. Điều này cần bổ sung quản lý lớp phủ, vì hiện tại Escape thuộc cửa sổ tour.
- Trên điện thoại giữ vùng chạm tối thiểu 44px; mô hình không chiếm toàn ảnh trừ khi người xem chủ động mở rộng. Tôn trọng tùy chọn giảm chuyển động.

## 5. Tiến độ và động lực khám phá

Mỗi nơi có một dấu hộ chiếu với tên riêng: Colosseum — Khám phá dưới sàn đấu; Constantine — Người đọc mặt đứng; Pantheon — Người tìm ánh sáng. Một dấu chỉ nhận một lần sau điều kiện hoàn thành cụ thể, không chỉ sau khi mở khung tương tác.

Lưu riêng `started/completed`, bộ phận đã thử và tiến độ trò chơi theo ID/phiên bản. Giữ tiến độ 27 cảnh, 54 chi tiết và 9 câu hỏi hiện tại. Hoạt động mới có chỉ số riêng, không làm tỷ lệ cũ tự tụt hoặc đánh dấu hoàn thành nhầm. Chơi lại không tăng điểm lặp. Không cần đăng nhập trong bản `_local`.

Không thưởng chỉ vì bấm nhiều; khuyến khích quan sát qua nhiều ảnh. Ví dụ tìm được chi tiết trong ảnh cận rồi xác định lại trên ảnh toàn cảnh mới hoàn thành bài ghép.

## 6. Dữ liệu, tài nguyên và giới hạn nhẹ

- Tiếp tục lưu `_local/`; chưa đưa tài nguyên mới vào Docker hoặc database.
- Đề xuất `_local/interactions/<slug>.json`, `_local/models/` cho GLB và `_local/images/interactions/` cho ảnh cắt. Đường dẫn này là kế hoạch, chưa tạo dữ liệu mẫu giả.
- Mỗi hoạt động có `id`, `version`, `type`, `entrySceneIds`, hướng dẫn ngắn, cấu hình vùng/đáp án, điều kiện hoàn thành, nguồn thuyết minh và danh mục tài nguyên/giấy phép.
- Vùng trên ảnh dùng tọa độ ảnh gốc như hotspot; tiếp tục đúng vị trí khi crop, pan, zoom. Không lưu tọa độ cố định theo màn hình.
- Mục tiêu cho mỗi mô hình minh họa: ≤10.000 tam giác, ≤4 vật liệu, tệp GLB ≤1 MB; texture nếu cần ≤1024px. Đây là ngân sách thiết kế cần đo, không phải thông số của tài nguyên đã có.
- Chỉ tải bộ dựng 3D và tài nguyên khi mở hoạt động; tại một thời điểm chỉ có một khung tương tác 3D. Không tải trước cả ba mô hình mini cùng các model Sketchfab.
- Dừng vòng dựng hình và giải phóng tài nguyên khi đóng/rời hoạt động. Ảnh 2D phải hoạt động nếu WebGL lỗi. Đo ảnh hưởng của bản đồ WebGL đang ở phía sau tour; giảm tải nền bằng API được SDK hỗ trợ sau khi kiểm tra, không giả định chỉ ẩn CSS là ngừng dựng hình.
- Chỉ dùng mô hình tự dựng có nguồn gốc rõ, CC0 hoặc giấy phép cho phép sao chép/chỉnh sửa/phân phối phù hợp. Mô hình cho embed không đồng nghĩa được tải và sửa. Ghi công ảnh cắt và ghi rõ thay đổi; giữ điều kiện chia sẻ tương tự nếu giấy phép yêu cầu.

## 7. Thứ tự triển khai đề xuất

| Đợt | Kết quả cụ thể | Tiêu chí xong |
| --- | --- | --- |
| 1 | Khung hoạt động chung + bài ghép Constantine | 3 mảnh đúng ảnh mặt Nam; chạm/kéo đều chơi được; đóng không mất góc ảnh; lưu tiến độ |
| 2 | Colosseum nâng/hạ sàn bằng SVG | Kéo sàn có phản hồi rõ; phân biệt sàn/khu ngầm; liên kết tới ảnh thật |
| 3 | Pantheon thử nguồn sáng bằng SVG | Góc nguồn sáng đổi vệt sáng; nhiệm vụ hoàn thành được; ghi đúng là minh họa |
| 4 | Một mô hình mini xoay trong một ảnh | Thử với nhịp vòm Colosseum ở `west`; đạt ngân sách tài nguyên; kéo mô hình không kéo ảnh |
| 5 | Hộ chiếu ba nơi + hoàn thiện hiển thị | Lưu độc lập, chơi lại không cộng lặp, bàn phím/cảm ứng dùng được |

Chọn Constantine làm hoạt động đầu vì dùng ngay ảnh đã được kiểm tra và tạo cảm giác “được làm” rõ ràng. Nếu ưu tiên xem thử 3D trước, có thể thực hiện đợt 4 sau đợt 1; vẫn giữ một mô hình nhỏ làm bản thử trước khi mở rộng.

## 8. Kế hoạch sửa mã khi triển khai

- `PhotoTour.tsx`: mở/đóng hoạt động, giữ cảnh/góc ảnh, trả focus, nhường thao tác kéo và Escape.
- Thêm `InteractionHost` để quản lý một hoạt động mở; tách `ReliefMatch`, `ArenaLayers`, `OculusLight`, `ArtifactViewer` theo từng kiểu, tránh dồn vào một thành phần tour lớn.
- `explore.ts` hoặc mô-đun dữ liệu riêng: kiểu cấu hình, kiểm tra ID cảnh/tài nguyên/đáp án hợp lệ, tải theo nhu cầu và trạng thái lỗi.
- Kho lưu tiến độ hoạt động: khóa riêng, phiên bản riêng; không thay cách tính tiến độ cũ trước khi có quy tắc chuyển đổi rõ.
- Script chuẩn bị dữ liệu: sinh ảnh cắt từ nguồn đã xác minh, metadata giấy phép và tọa độ vùng trả lời. Không tự sửa ảnh gốc đang dùng trong tour.
- Chỉ tích hợp bộ xem GLB sau khi bản thử chứng minh không làm tăng tải ban đầu hoặc xung đột bản đồ/iframe.

## 9. Nghiệm thu

1. Bấm mở/đóng, Escape, kéo ảnh, kéo vật thể/mảnh ghép không xung đột; giữ góc ảnh và trả focus đúng.
2. Đi hết hoạt động bằng chuột, cảm ứng và bàn phím; có thể bỏ qua/đóng bất kỳ lúc nào.
3. Đáp án, chi tiết và vị trí khớp đúng ảnh; có nguồn và giấy phép cho tất cả phần cắt/mô hình mới.
4. Đạt điều kiện hoàn thành bằng thao tác thực; lưu lại sau tải trang; chơi lại không cộng tiến độ lặp.
5. Đổi cảnh/công trình trong lúc tải không làm hoạt động cũ xuất hiện nhầm; lỗi tài nguyên vẫn mở được ảnh và chuyển cảnh.
6. Chưa mở hoạt động thì không tải GLB/bộ dựng 3D mới; mở xong đóng lại không tiếp tục dựng hình nền. Đo trên desktop và điện thoại trước khi nhận là nhẹ.
7. Sau tích hợp, kiểm tra lại cả 66 đường chuyển hai chiều, trạng thái gợi ý, nhãn hướng, hai chế độ con mắt/kính lúp và một nút thoát.

## 10. Việc chưa cam kết ở bản đầu

Không làm panorama/di chuyển 3D tự do, ghép vật thể đúng phối cảnh tự động cho mọi ảnh, mô phỏng thiên văn chính xác, vật lý kiến trúc hoặc đồng bộ game trong mọi model Sketchfab. Các phần này cần dữ liệu và một bản khảo sát riêng. Bản đầu tập trung vào ba hoạt động ngắn có phản hồi trực tiếp và một vật thể 3D nhỏ có thể xoay.
