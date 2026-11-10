# Tour ảnh Vittoriano

Tour dùng chung trình xem, lưu tiến độ và câu đố với ba địa điểm còn lại. Mở địa điểm **Đài tưởng niệm Vittorio Emanuele II** rồi chọn **Khám phá qua ảnh**. Nếu trang đã mở trước khi cập nhật, tải lại trang để nhận danh sách tour mới.

Có 18 ảnh độc lập: 8 cảnh ngoại thất/chi tiết ban đầu và 10 cảnh bổ sung gồm lối vào khu bảo tàng, cầu thang trong nhà, lối đi và phòng trưng bày Museo Centrale del Risorgimento, sảnh, vòm trần, tượng trong nội thất, sân thượng, cận cảnh tứ mã và góc nhìn xuống Piazza Venezia từ Vittoriano. Tour gồm 35 điểm thuyết minh, 38 liên kết chuyển góc nhìn (19 cặp hai chiều) và 6 câu hỏi. Các ảnh chụp ở nhiều thời điểm; liên kết biểu thị đổi góc nhìn, không phải tuyến đi bộ được khảo sát.

Từ cảnh góc chéo cầu thang có thể đổi sang lối vào bảo tàng rồi xem các cảnh bên trong. Từ cảnh hàng cột có thể chuyển vào sảnh, ngước lên vòm trần, xem tượng trong sảnh và đổi góc lên sân thượng. Các cảnh mới đều có liên kết quay lại. Điểm nhìn xuống Piazza Venezia vẫn đặt trên Vittoriano; tour không mở rộng sang các công trình xung quanh. Các biển treo trên mặt đứng trong ảnh lối vào là thông tin tại thời điểm chụp.

Toàn bộ 18 ảnh được chuẩn bị ở chiều rộng tối thiểu 1920 px, không phóng lớn ảnh nguồn. Giữ nguyên mã cảnh và phiên bản lưu tiến độ để người đã tham quan có thể tiếp tục khám phá các cảnh bổ sung.

## Rà soát phạm vi và ánh sáng

VIVE xác nhận Museo Centrale del Risorgimento nằm trong các phòng ở lòng Vittoriano. Các ảnh bảo tàng được đối chiếu mô tả nguồn và danh mục Commons `Museo Centrale del Risorgimento al Vittoriano`. Ảnh lối vào mới `Museo Centrale del Risorgimento din Roma.jpg` ghi thời điểm chụp 09/07/2014 lúc 12:56. Các cảnh nội thất giữ ánh sáng thực trong nhà.

Đã rà toàn bộ bảng ảnh, chỉ giữ ảnh ngoại thất ban ngày. Thay ảnh sân thượng 1600 px bị nhám bằng `Victor Emanuel II Rome 2011 6.jpg`, chụp trên sân thượng với trời xanh. Thay ảnh ngược sáng nhìn xuống quảng trường bằng `Victor Emanuel II Rome 2011 12.jpg`, cũng chụp từ sân thượng trong tháng 04/2011. Thay ảnh lối vào bảo tàng cũ bằng ảnh ban ngày rõ hơn. Nội dung và tọa độ các điểm tương tác đã được cập nhật theo ba ảnh thay thế.

Ảnh cho thấy trạng thái công trình và quảng trường tại thời điểm chụp, không mô tả tiến độ công trường hay bố trí giao thông hiện tại. Mô tả nguồn hai ảnh sân thượng xác nhận điểm chụp nằm trên tầng mái Vittoriano. Không có cảnh chụp lúc hoàng hôn hoặc ban đêm trong tour này.

Ảnh, ảnh thu nhỏ và tác giả/giấy phép nằm trong `_local/images`, `_local/sources.json`; tour tại `_local/vittoriano-tour.json`. Bản ghi metadata ảnh được chọn nằm trong `_local/vittoriano-photo-selection.json`.

Tạo lại nội dung và danh mục tour:

```powershell
python scripts/prepare-photo-tours.py
python scripts/review-photo-tours.py
```

Nếu thiếu ảnh, dùng `python scripts/prepare-vittoriano-assets.py` hoặc quy trình tải toàn bộ ảnh hiện có trong `scripts/prepare-local-assets.py`. Cần Python và Pillow; tải ảnh cần mạng.

Giống các tour cũ, Vite phục vụ `_local` trong chế độ dev/preview. Khi triển khai bản build, cần xuất bản thư mục tài nguyên `_local` qua máy chủ hoặc cấu hình `VITE_PHOTO_TOUR_BASE_URL`; URL ảnh trong dữ liệu tour cũng phải truy cập được tại `/_local/images/`.

Nguồn nội dung: [Turismo Roma](https://www.turismoroma.it/it/node/1541), [bảo tàng VIVE](https://vive.cultura.gov.it/it/vittoriano), [Museo Centrale del Risorgimento](https://vive.cultura.gov.it/_cms/en/central-museum-of-the-risorgimento), [Sommoportico](https://vive.cultura.gov.it/it/vittoriano/cosa-vedere/sommoportico), [sân thượng toàn cảnh](https://vive.cultura.gov.it/en/panoramic-terrace). Nguồn và giấy phép từng ảnh được hiển thị trong trình xem.

Đã kiểm tra tính hợp lệ của dữ liệu, kích thước và mã kiểm tra ảnh, giấy phép, ảnh thu nhỏ, khả năng đi giữa mọi cảnh, liên kết quay lại và câu hỏi. Đã duyệt bảng ảnh có vị trí các điểm tương tác. Kiểm thử trực tiếp giao diện trong trình duyệt chưa thực hiện được do quyền mở localhost bị từ chối trong phiên làm việc.
