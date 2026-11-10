"""Curated tour content, consumed by prepare-photo-tours.py."""
def create(scene, point, question, build, navigation):
    official = 'https://www.turismoroma.it/it/node/1541'
    vive = 'https://vive.cultura.gov.it/it/vittoriano'
    museum = 'https://vive.cultura.gov.it/_cms/en/central-museum-of-the-risorgimento'
    portico = 'https://vive.cultura.gov.it/it/vittoriano/cosa-vedere/sommoportico'
    terrace = 'https://vive.cultura.gov.it/en/panoramic-terrace'
    scenes = [
        scene('exterior', 'vittoriano-exterior.jpg', 'Từ quảng trường Piazza Venezia',
            'Toàn cảnh mặt tiền trắng với cầu thang, tượng kỵ mã và hai cỗ xe tứ mã trên mái.', [
            point(49, 54, 'Vị vua đầu tiên của nước Ý thống nhất', 'Công trình tưởng niệm Vittorio Emanuele II, vị vua đầu tiên của nước Ý thống nhất. Kiến trúc sư Giuseppe Sacconi thiết kế quần thể này.', official),
            point(72, 43, 'Đá Botticino', 'Đá sáng màu Botticino tạo nên mặt đứng nổi bật giữa các công trình có tông màu ấm của Roma.', official)]),
        scene('oblique', 'vittoriano-oblique.jpg', 'Bậc thang và các tầng sân',
            'Góc nhìn chéo cho thấy những lớp cầu thang và sân nối dần lên hàng cột phía sau.', [
            point(47, 80, 'Bố cục đi lên', 'Cầu thang dẫn qua các sân tới Bàn thờ Tổ quốc, rồi tới hai khối cánh và hàng cột lớn phía sau.', official),
            point(80, 35, 'Hai khối cánh propylaea', 'Hai khối kiến trúc đầu hàng cột tạo nên bố cục cân xứng; mỗi bên mang một cỗ xe tứ mã bằng đồng trên mái.', official)]),
        scene('altar', 'vittoriano-altar.jpg', 'Bàn thờ Tổ quốc',
            'Tượng kỵ mã phía trên và khu Bàn thờ Tổ quốc phía dưới cùng xuất hiện trong một khung hình.', [
            point(51, 89, 'Altare della Patria', 'Bàn thờ Tổ quốc nằm ở trung tâm mặt tiền, bên dưới tượng kỵ mã của nhà vua.', official),
            point(80, 58, 'Hàng cột làm phông nền', 'Hàng cột cong ôm lấy không gian trung tâm, nối hai cánh của đài tưởng niệm.', vive)]),
        scene('equestrian', 'vittoriano-equestrian.jpg', 'Tượng nhà vua cưỡi ngựa',
            'Nhìn lên tượng kỵ mã và bệ đá có các hình tượng điêu khắc.', [
            point(63, 20, 'Tượng kỵ mã', 'Tượng nhà vua trên lưng ngựa là điểm nhấn trung tâm của quần thể, được khánh thành năm 1911.', official),
            point(55, 66, 'Bệ tượng và phù điêu', 'Bệ đá và các tác phẩm điêu khắc kết nối hình tượng nhà vua với chủ đề quốc gia thống nhất.', vive)]),
        scene('portico', 'vittoriano-portico.jpg', 'Ngước lên hàng cột lớn',
            'Góc nhìn thấp nhấn mạnh thân cột có rãnh, đầu cột trang trí và hệ dầm phía trên.', [
            point(25, 53, 'Thân cột có rãnh', 'Các cột lớn tạo nên không gian chuyển tiếp có mái và nhịp điệu cho mặt đứng phía trên.', vive),
            point(57, 26, 'Đầu cột và dầm', 'Nhìn theo đầu cột để nhận ra cách hàng cột nâng hệ dầm và phần mái trang trí.', vive)]),
        scene('ceiling', 'vittoriano-ceiling.jpg', 'Chi tiết trần dưới mái',
            'Mảng trần trang trí hình tròn nằm giữa các cột đá trắng.', [
            point(55, 46, 'Hoa văn trần', 'Các vòng hoa văn đồng tâm làm nổi bật chiều sâu của phần trần dưới mái.', vive),
            point(15, 61, 'Đá sáng và vùng bóng', 'Ánh sáng bên ngoài tương phản với vùng trần có mái, giúp đọc rõ chiều sâu kiến trúc.', vive)]),
        scene('relief', 'vittoriano-relief.jpg', 'Điêu khắc trên kiến trúc',
            'Một chi tiết hình tượng chạm khắc bên cạnh các đường gờ đá.', [
            point(53, 44, 'Hình tượng điêu khắc', 'Điêu khắc là một phần của ngôn ngữ biểu tượng trên toàn bộ Vittoriano; ảnh này cho phép quan sát gần chi tiết.', vive),
            point(32, 81, 'Chi tiết bề mặt đá', 'Các đường gờ, lá trang trí và bề mặt chạm khắc bổ sung những lớp chi tiết khó thấy trong ảnh toàn cảnh.', vive)]),
        scene('quadrigas', 'vittoriano-quadrigas.jpg', 'Hai cỗ xe tứ mã trên đường chân trời',
            'Nhìn mái công trình từ xa để thấy hai nhóm tượng tứ mã nổi bật trên nền trời.', [
            point(28, 14, 'Thống nhất và Tự do', 'Hai cỗ xe tứ mã bằng đồng tượng trưng cho sự Thống nhất của Tổ quốc và Tự do của công dân.', official),
            point(73, 38, 'Chiều cao gồm tượng trên mái', 'Các nhóm tượng được đặt trên mái trong giai đoạn 1924–1927, đưa tổng chiều cao công trình lên khoảng 81 m so với Piazza Venezia.', official)]),
        scene('museum-entry', 'vittoriano-museum-entry.jpg', 'Lối vào khu bảo tàng trong Vittoriano',
            'Mặt bên khu bảo tàng thuộc Vittoriano, chụp ban ngày: dòng chữ Museo Centrale del Risorgimento phía trên cửa vào.', [
            point(44, 44, 'Museo Centrale del Risorgimento', 'Bảo tàng nằm trong lòng quần thể Vittoriano, kể về quá trình hình thành nước Ý thống nhất.', museum),
            point(38, 68, 'Cửa vào khu bảo tàng', 'Góc nhìn này ghi lại mặt bên và cửa khu bảo tàng của đài tưởng niệm. Các biển treo trên mặt đứng thuộc thời điểm chụp.', museum)]),
        scene('museum-stairs', 'vittoriano-museum-stairs.jpg', 'Cầu thang bên trong khu bảo tàng',
            'Từ cửa vào, đổi góc nhìn tới một cầu thang trong Museo Centrale del Risorgimento.', [
            point(50, 77, 'Bậc thang trong nhà', 'Cầu thang là một góc không gian bên trong khu bảo tàng tại Vittoriano; tour chuyển ảnh giữa các khu, không mô phỏng chính xác từng bước chân.', museum),
            point(72, 31, 'Không gian chuyển tiếp', 'Quan sát sự thay đổi từ bậc thang ngoài trời sang các tường và lối đi có mái của khu bảo tàng.', museum)]),
        scene('museum-gallery', 'vittoriano-museum-gallery.jpg', 'Lối đi trong Museo Centrale del Risorgimento',
            'Góc nhìn dọc một lối đi có mái trong khu bảo tàng, hướng về không gian phía trước.', [
            point(48, 36, 'Bảo tàng trong lòng đài tưởng niệm', 'Ngoài cầu thang và tượng đài ngoài trời, Vittoriano còn có các phòng bảo tàng ở bên trong.', museum),
            point(74, 69, 'Hành trình lịch sử', 'Nội dung bảo tàng trải từ thế kỷ XVIII tới Chiến tranh thế giới thứ nhất, qua các giai đoạn thống nhất nước Ý.', museum)]),
        scene('museum-hall', 'vittoriano-museum-hall.jpg', 'Phòng trưng bày của bảo tàng Risorgimento',
            'Một phòng trưng bày bên trong Vittoriano, với nhóm tượng ở giữa phòng và các hiện vật, hình ảnh xung quanh.', [
            point(50, 52, 'Điêu khắc trong không gian trưng bày', 'Các tác phẩm điêu khắc là một phần của bộ sưu tập bảo tàng, bên cạnh tài liệu và những kỷ vật lịch sử.', museum),
            point(83, 48, 'Tư liệu về Risorgimento', 'Bảo tàng lưu giữ thư từ, nhật ký, kỷ vật, vũ khí và tác phẩm nghệ thuật liên quan tới quá trình thống nhất nước Ý.', museum)]),
        scene('vestibule', 'vittoriano-vestibule.jpg', 'Sảnh có mái và cầu thang trong Vittoriano',
            'Không gian nội thất của đài tưởng niệm với vòm trang trí, tượng đá và cầu thang dẫn tới ô cửa sáng.', [
            point(49, 39, 'Vòm trần trang trí', 'Các ô lõm và đường gờ tạo chiều sâu cho phần trần, cho thấy kiến trúc bên trong tiếp tục được chăm chút như mặt ngoài.', vive),
            point(80, 49, 'Tượng đá trong sảnh', 'Các hình tượng điêu khắc đứng hai bên không gian sảnh; có thể chuyển sang cảnh cận để quan sát chi tiết.', vive)]),
        scene('vault', 'vittoriano-vault.jpg', 'Ngước nhìn vòm trần bên trong',
            'Góc nhìn hướng lên trần nội thất Vittoriano, cho thấy các ô trang trí hình học và đường vòm ở hai đầu.', [
            point(51, 48, 'Các ô trần lặp lại', 'Những ô trang trí lặp lại làm rõ kết cấu hình học và nhịp điệu của vòm trần.', vive),
            point(23, 44, 'Ánh sáng và chiều sâu', 'Ánh sáng từ các cửa ở đầu sảnh làm nổi bật các gờ và lớp trang trí của nội thất.', vive)]),
        scene('arts', 'vittoriano-arts.jpg', 'Cận cảnh tượng trong sảnh',
            'Một tác phẩm điêu khắc bằng đá trong nội thất Vittoriano, được nhìn gần từ bệ tới phần đầu tượng.', [
            point(54, 38, 'Hình tượng người trong điêu khắc', 'Quan sát tư thế, trang phục và các chi tiết đi kèm của tượng. Cảnh này tập trung vào tác phẩm trong sảnh thay vì toàn bộ mặt đứng.', vive),
            point(50, 84, 'Bệ tượng bằng đá', 'Bệ đưa tác phẩm lên khỏi mặt sàn và tạo ranh giới rõ với không gian lưu thông xung quanh.', vive)]),
        scene('terrace', 'vittoriano-terrace.jpg', 'Trên sân thượng của Vittoriano',
            'Sân thượng Vittoriano dưới bầu trời xanh ban ngày, với nhóm tượng tứ mã và bệ đá trắng nhìn từ trên mái.', [
            point(52, 81, 'Bệ đá trên mái', 'Điểm quan sát trên sân thượng đưa người xem tới gần các nhóm tượng tứ mã và phần bệ đá của chúng.', terrace),
            point(76, 30, 'Tứ mã và Chiến thắng có cánh', 'Nhóm tượng đồng hiện rõ trên nền trời. Hai cỗ xe trên mái biểu trưng cho Thống nhất và Tự do.', terrace)]),
        scene('quadriga-close', 'vittoriano-quadriga-close.jpg', 'Nhìn gần cỗ xe tứ mã trên mái',
            'Cận cảnh một nhóm tượng đồng với bốn ngựa, cỗ xe và hình tượng Chiến thắng có cánh trên đỉnh Vittoriano.', [
            point(67, 24, 'Chiến thắng có cánh', 'Hình tượng có cánh điều khiển cỗ xe. Hai nhóm tượng trên mái gắn với chủ đề Thống nhất và Tự do.', terrace),
            point(37, 54, 'Ngựa và cỗ xe bằng đồng', 'Góc cận cho thấy rõ những hình khối mà trong ảnh toàn cảnh chỉ hiện thành đường nét trên nền trời.', terrace)]),
        scene('panorama', 'vittoriano-panorama.jpg', 'Từ Vittoriano nhìn xuống Piazza Venezia',
            'Góc nhìn ban ngày từ sân thượng Vittoriano xuống Piazza Venezia. Mặt bằng quảng trường trong ảnh phản ánh thời điểm chụp.', [
            point(49, 17, 'Trục nhìn về trung tâm Roma', 'Nhìn theo các phố phía trước quảng trường để cảm nhận vị trí trung tâm của Vittoriano. Điểm đứng chụp vẫn thuộc đài tưởng niệm.', terrace)]),
    ]
    # Retain the surviving point's identity; the removed statue hotspot must not
    # reappear under the saved panorama-info-1 ID after regenerating the tour.
    next(s for s in scenes if s['id'] == 'panorama')['hotspots'][0]['id'] = 'panorama-info-2'
    edges = [('exterior','oblique'), ('exterior','altar'), ('altar','equestrian'),
             ('oblique','portico'), ('portico','ceiling'), ('portico','relief'),
             ('oblique','quadrigas'), ('quadrigas','exterior')]
    labels = {s['id']: s['title'] for s in scenes}
    # Distribute links on each photo so scenes with several exits stay clickable.
    positions = [((84,82),(16,84)), ((49,82),(16,84)),
                 ((84,82),(16,84)), ((75,64),(16,84)),
                 ((50,12),(16,84)), ((84,82),(16,84)),
                 ((30,17),(84,82)), ((16,84),(20,20))]
    additions = [
        ('oblique','museum-entry',(20,59),(16,84)),
        ('museum-entry','museum-stairs',(52,78),(16,84)),
        ('museum-stairs','museum-gallery',(52,56),(16,84)),
        ('museum-gallery','museum-hall',(53,60),(16,84)),
        ('portico','vestibule',(65,68),(16,84)),
        ('vestibule','vault',(50,16),(16,84)),
        ('vestibule','arts',(84,72),(16,84)),
        ('vestibule','terrace',(76,24),(16,84)),
        ('terrace','quadriga-close',(40,14),(16,84)),
        ('terrace','panorama',(84,88),(16,84)),
        ('panorama','altar',(52,82),(40,65)),
    ]
    edges.extend((a,b) for a,b,_,_ in additions)
    positions.extend((out,back) for _,_,out,back in additions)
    navigation['vittoriano'] = [(a,b,(*out,'view','Đổi góc: '+labels[b]),
        (*back,'view','Đổi góc: '+labels[a])) for (a,b),(out,back) in zip(edges,positions)]
    questions = [
        question('king','Vittoriano tưởng niệm ai?', ['Julius Caesar','Vittorio Emanuele II','Constantine I'],1,
            'Công trình tưởng niệm vị vua đầu tiên của nước Ý thống nhất.','exterior'),
        question('stone','Vật liệu sáng màu đặc trưng của Vittoriano là gì?', ['Đá Botticino','Gạch đỏ','Gỗ sơn trắng'],0,
            'Đá Botticino tạo nên sắc trắng đặc trưng của quần thể.','oblique'),
        question('quadrigas','Hai cỗ xe tứ mã tượng trưng cho điều gì?', ['Bốn mùa','Hai con sông','Thống nhất và Tự do'],2,
            'Hai nhóm tượng bằng đồng thể hiện sự Thống nhất của Tổ quốc và Tự do của công dân.','quadrigas'),
        question('museum','Bảo tàng nào nằm bên trong Vittoriano?', ['Museo Centrale del Risorgimento','Bảo tàng Vatican','Bảo tàng Louvre'],0,
            'Museo Centrale del Risorgimento nằm trong Vittoriano và giới thiệu lịch sử thống nhất nước Ý.','museum-hall'),
        question('interior','Ngoài các tượng đài ngoài trời, có thể thấy gì trong sảnh Vittoriano?', ['Chỉ có tường trơn','Vòm trần trang trí và tượng đá','Đường hầm tàu điện'],1,
            'Ảnh nội thất cho thấy vòm trần có các ô trang trí và các hình tượng điêu khắc bằng đá.','vestibule'),
        question('terrace','Cảnh sân thượng giúp quan sát điều gì?', ['Toàn cảnh Roma và tượng tứ mã gần hơn','Bên trong đấu trường Colosseum','Nội thất đền Pantheon'],0,
            'Điểm quan sát trên Vittoriano mở ra toàn cảnh Roma và góc nhìn gần các tượng trên mái.','terrace'),
    ]
    return build('vittoriano','Đài tưởng niệm Vittorio Emanuele II',
        'Từ Piazza Venezia vào bảo tàng và lên sân thượng', scenes, edges, questions,
        [{'title':'Cổng thông tin du lịch chính thức Roma — Vittoriano','url':official},
         {'title':'Bảo tàng VIVE — Vittoriano','url':vive},
         {'title':'VIVE — Museo Centrale del Risorgimento','url':museum},
         {'title':'VIVE — Sommoportico','url':portico},
         {'title':'VIVE — Sân thượng toàn cảnh','url':terrace}])
