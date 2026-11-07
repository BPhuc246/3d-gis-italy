# Hướng Dẫn & Đánh Giá Các Phương Pháp Thực Hiện Tuyến Đường (Hành Trình) Trong 3D GIS

Tài liệu này tổng hợp toàn diện các phương pháp kỹ thuật để xây dựng tính năng dẫn đường / vẽ tuyến tham quan kết nối các địa điểm di sản trên nền tảng bản đồ không gian 3D (ArcGIS WebScene / SceneView).

---

## 1. Thách Thức Khi Vẽ Tuyến Đường Trên Bản Đồ 3D

Khác với bản đồ 2D phẳng, bài toán dẫn đường trong không gian 3D (3D GIS) đối mặt với các thách thức đặc thù:
1. **Va chạm hình học với công trình 3D (Building Collision):** Tuyến đường nối giữa hai điểm nếu vẽ dạng đường thẳng hoặc mạng lưới không chuẩn sẽ cắt xuyên qua các tòa nhà, khối phố cổ, hoặc tường thành.
2. **Xử lý cao độ (Z-Elevation Clamping):** Nếu đặt độ cao $Z = 0$, đường vẽ sẽ bị lún chìm vào mặt đá lòng đường hoặc bậc thềm công trình. Nếu đặt quá cao, đường sẽ lơ lửng trên không trung. Cần sử dụng chế độ `elevationInfo: { mode: 'relative-to-ground', offset: 2 - 4m }`.
3. **Tính thẩm mỹ & Góc gấp khúc:** Các góc rẽ ngã ba, ngã tư 90° nếu nối thô sẽ tạo cảm giác sắc nhọn, gãy khúc, thiếu tự nhiên.
4. **Quy tắc giao thông khu di sản:** Tại các trung tâm lịch sử như Rome (Roma), nhiều khu vực xung quanh Colosseum và Quảng trường La Mã có hàng rào bảo vệ, công trường khảo cổ (như tuyến Metro C) khiến các công cụ định tuyến tự động đại trà dễ bị "lạc đường" hoặc đi vòng rất xa.

---

## 2. So Sánh 4 Phương Pháp Kỹ Thuật

| Tiêu chí | Cách 1: Nối điểm thực tế (Curated Topological Corridor) | Cách 2: ArcGIS Routing Service (Esri REST API) | Cách 3: OSRM Network Engine (Mã nguồn mở) | Cách 4: pgRouting trong PostgreSQL / PostGIS |
| :--- | :--- | :--- | :--- | :--- |
| **Bản quyền & Chi phí** | **Miễn phí 100%**, không cần tài khoản | **Cần API Key** & tài khoản ArcGIS Location Platform | **Miễn phí 100%**, không cần API Key | **Miễn phí 100%** (Chạy trên DB nội bộ) |
| **Độ chính xác lộ trình** | **100% chuẩn xác** theo đúng ý đồ du lịch | Rất cao theo dữ liệu bản quyền của Esri | Phụ thuộc vào tag phân làn của OpenStreetMap | Do lập trình viên làm chủ 100% |
| **Tính linh hoạt** | Tuyến cố định (Fixed Tour) | Tự động tính mọi cặp điểm | Tự động tính mọi cặp điểm | Tự động tính mọi cặp điểm |
| **Rủi ro kỹ thuật** | Mất công thu thập dữ liệu ban đầu | Dễ kẹt lỗi tài khoản (Public vs Location Platform) | Dễ bị đi vòng nếu OSM có tag cấm/công trường | Cần kỹ năng xây dựng mạng lưới Topology DB |
| **Độ mượt mà góc bo** | Kết hợp Chaikin Spline bo cong hoàn hảo | Cần xử lý hậu kỳ (smoothing) | Cần xử lý hậu kỳ (smoothing) | Cần xử lý hậu kỳ (smoothing) |

---

## 3. Chi Tiết Từng Phương Pháp & Cách Triển Khai

### Cách 1: Tuyến Hành Lang Chọn Lọc (Curated Topological Corridor + Chaikin Smoothing)
*Phương pháp được các ứng dụng bảo tàng, du lịch di sản cao cấp ưa chuộng khi có tuyến tham quan cố định.*

* **Cách thực hiện:**
  1. Sử dụng công cụ bản đồ (QGIS, geojson.io, Google Earth Pro) xuất chuỗi tọa độ tim đường chính xác đi qua các tuyến phố đi bộ đẹp nhất (ví dụ: Colosseum ➔ Khải hoàn môn ➔ Đại lộ Via dei Fori Imperiali ➔ Piazza Venezia ➔ Via del Plebiscito ➔ Via dei Cestari ➔ Pantheon).
  2. Đưa mảng tọa độ qua thuật toán **Chaikin's Corner Cutting** để bo tròn các góc rẽ 90° thành đường cong lượn sóng mềm mại.
  3. Dùng `@arcgis/core/geometry/Polyline` kết hợp `LineSymbol3D` hai lớp (lớp hào quang halo phát sáng + lớp nét đứt tương phản) vẽ lên `GraphicsLayer`.
* **Ưu điểm:**
  * Kiểm soát 100% đường đi, tuyệt đối không bao giờ bị cắt qua nhà hay đi nhầm vào các ngõ hẹp không mong muốn.
  * Tốc độ hiển thị 0 mili-giây, không phụ thuộc vào kết nối mạng bên ngoài, không lo sập server API.
* **Nhược điểm:**
  * Chỉ áp dụng cho các hành trình tham quan có sẵn (fixed itinerary); nếu người dùng muốn tự bấm chọn 2 điểm bất kỳ thì không tự sinh đường mới được.

---

### Cách 2: Sử dụng ArcGIS Routing Service (`@arcgis/core/rest/route`)
*Phương pháp chính thống trong hệ sinh thái Esri ArcGIS.*

* **Cách thực hiện:**
  1. Đăng ký tài khoản lập trình viên tại `location.arcgis.com`, kích hoạt quyền **Routing** và lấy chuỗi API Key (`AAPK...`).
  2. Cấu hình vào dự án:
     ```typescript
     import esriConfig from "@arcgis/core/config.js";
     import * as route from "@arcgis/core/rest/route.js";
     import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js";
     import Stop from "@arcgis/core/rest/support/Stop.js";

     esriConfig.apiKey = "AAPK_YOUR_API_KEY";

     const routeParams = new RouteParameters({
       stops: [
         new Stop({ geometry: { x: 12.4922, y: 41.8902 } }), // Colosseum
         new Stop({ geometry: { x: 12.4769, y: 41.8986 } }), // Pantheon
       ],
       travelMode: "Walking Time", // Profile đi bộ
       returnRoutes: true,
     });

     const response = await route.solve("https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", routeParams);
     const polyline = response.routeResults[0].route.geometry;
     ```
* **Ưu điểm:**
  * Đồng bộ hoàn hảo với `@arcgis/core`, dữ liệu giao thông được cập nhật liên tục bởi Esri.
  * Hỗ trợ tính toán độ dốc địa hình 3D, cự ly và bảng hướng dẫn rẽ chi tiết (Turn-by-turn).
* **Nhược điểm:**
  * Yêu cầu API Key; nếu dùng tài khoản ArcGIS Online Public thường sẽ bị lỗi `Token Required 499`.
  * Có giới hạn số lượt gọi miễn phí (20.000 credits/tháng).

---

### Cách 3: Sử dụng Động Cơ Mạng Lưới Nguồn Mở (OSRM / OpenRouteService)
*Phương pháp phổ biến trong các ứng dụng Web GIS cộng đồng.*

* **Cách thực hiện:**
  1. Frontend gọi trực tiếp đến API công cộng của OSRM:
     ```typescript
     const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`);
     const data = await res.json();
     const coordinates = data.routes[0].geometry.coordinates;
     ```
  2. Nạp mảng tọa độ vào `Polyline` của ArcGIS và hiển thị lên SceneView.
* **Ưu điểm:**
  * Hoàn toàn miễn phí, không cần đăng ký tài khoản hay API Key.
  * Tính toán cực nhanh (dưới 50ms) nhờ thuật toán Contraction Hierarchies (CH).
* **Nhược điểm:**
  * Dữ liệu OpenStreetMap công cộng tại Rome bị ảnh hưởng bởi các công trường rào chắn và khu di tích cấm xe, khiến OSRM dễ dẫn người đi bộ đi vòng rất xa (ví dụ: vòng qua đấu trường Circus Maximus rồi mới về Pantheon).
  * Server public có thể bị hạn chế tần suất (Rate Limit) nếu có quá nhiều request đồng thời.

---

### Cách 4: Tự Xây Dựng Mạng Lưới Với pgRouting Trong PostgreSQL/PostGIS
*Phương pháp dành cho các hệ thống GIS chuyên sâu, hoạt động offline hoàn toàn.*

* **Cách thực hiện:**
  1. Tải dữ liệu đường xá Rome dạng Shapefile hoặc OSM (`.pbf`) từ Geofabrik.
  2. Dùng công cụ `osm2pgrouting` nạp vào cơ sở dữ liệu PostgreSQL của dự án:
     ```bash
     osm2pgrouting -f rome.osm -d app_dev -U postgres -W postgres --conf mapconfig.xml
     ```
  3. Tạo topology mạng lưới bằng hàm PostGIS:
     ```sql
     SELECT pgr_createTopology('ways', 0.00001, 'the_geom', 'gid');
     ```
  4. Viết API Endpoint tại Backend (`/api/routes/solve`) sử dụng giải thuật Dijkstra:
     ```sql
     SELECT seq, node, edge, cost, ST_AsGeoJSON(geom) 
     FROM pgr_dijkstra(
       'SELECT gid AS id, source, target, cost_len AS cost FROM ways',
       1204, 5892, directed := false
     );
     ```
* **Ưu điểm:**
  * Toàn quyền làm chủ dữ liệu mạng lưới 100%, không phụ thuộc vào bất kỳ bên thứ ba nào.
  * Hoạt động offline hoàn toàn trên server nội bộ, bảo mật tuyệt đối.
  * Tự do gán trọng số ưu tiên: đường râm mát, đường phố cổ lát đá, tránh dốc cao.
* **Nhược điểm:**
  * Đòi hỏi kỹ năng chuyên sâu về cấu trúc dữ liệu không gian PostGIS và tiền xử lý Topology đồ thị.

---

## 4. Kỹ Thuật Đồ Họa Nâng Cao Cho Đường Dẫn 3D

Để đường đi đạt độ thẩm mỹ cao như các sản phẩm thương mại (Apple Maps / Google Earth), cần áp dụng 3 kỹ thuật bổ trợ:

### 4.1. Khử gấp khúc bằng thuật toán Chaikin (Chaikin's Corner Cutting)
Giúp biến các khúc quanh gãy góc thành các đường vòng cung mượt mà:
$$Q_i = 0.75 \cdot P_i + 0.25 \cdot P_{i+1}$$
$$R_i = 0.25 \cdot P_i + 0.75 \cdot P_{i+1}$$
Chạy 2 vòng lặp (iterations) sẽ tạo ra đường dẫn uốn cong tự nhiên theo độ cong của góc phố.

### 4.2. Kỹ thuật nâng cao độ thông minh (Z-Offset Clamping)
Tránh hiện tượng "Z-fighting" (đường vẽ chớp giật nhấp nháy vì nằm đè ngang mặt phẳng mặt đường):
```typescript
const routeLayer = new GraphicsLayer({
  title: 'WalkingRoute3D',
  elevationInfo: { mode: 'relative-to-ground', offset: 3.5 } // Nâng cao 3.5 mét so với mặt đất
});
```

### 4.3. Hiệu ứng đồ họa đa tầng (Multi-layer Glowing Tube)
* **Lớp 1 (Bên dưới):** Line rộng 10px màu hổ phách bán trong suốt (`rgba(245, 158, 11, 0.45)`) tạo vệt phát sáng (halo glow).
* **Lớp 2 (Bên trên):** Line nét đứt màu vàng sáng (`#fef08a`, `style: 'dash'`) tạo cảm giác năng động và chỉ dẫn hướng đi.

---

## 5. Khuyến Nghị Cho Dự Án

* **Trong giai đoạn bảo vệ đồ án / demo hiện tại:**
  * Giữ giao diện bản đồ 3D tập trung vào **mô hình kiến trúc, ghim di sản và tour ảnh tương tác**.
  * Trang Hành trình (`#/routes`) đóng vai trò là **lịch trình tham quan văn hóa** theo các chặng điểm dừng rõ ràng. Người dùng bấm vào từng di sản thì camera 3D sẽ bay mượt mà đến công trình đó.
* **Nếu muốn mở rộng tính năng chỉ đường trong tương lai:**
  * Khuyên dùng **Cách 1 (Curated Topological Corridor)** kết hợp **Chaikin Smoothing**: Đây là cách vừa đảm bảo đường đi ôm sát từng góc phố Roma cổ kính, vừa không lo lỗi API Key hay mạng lưới công trường bị đi vòng.
  * Nếu phát triển hệ thống tìm đường tự do cho mọi vị trí trong thành phố: Nên đầu tư triển khai **Cách 4 (pgRouting)** để tích hợp thẳng vào PostgreSQL hiện có của dự án.
