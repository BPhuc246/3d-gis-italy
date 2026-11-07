"""Build the three curated photo tours from verified local image metadata.

Coordinates are percentages of the original photo, reviewed on contact sheets.
Graph edges describe a change of photographic viewpoint, not a surveyed path.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / '_local'
SOURCES = {Path(s['file']).name: s for s in json.loads((ROOT / 'sources.json').read_text(encoding='utf-8'))}

# Reliable, fast-loading, public source URLs
COLOSSEO = 'https://www.turismoroma.it/en/places/flavian-amphitheatre-colosseum'
UNDERGROUND = 'https://en.wikipedia.org/wiki/Colosseum#Interior'
CAVEA = 'https://en.wikipedia.org/wiki/Colosseum'
ARCH = 'https://www.turismoroma.it/en/places/arch-costantine'
ARCH_PARK = 'https://en.wikipedia.org/wiki/Arch_of_Constantine'
PANTHEON = 'https://www.turismoroma.it/en/places/pantheon'
PANTHEON_MUSEUM = 'https://en.wikipedia.org/wiki/Pantheon,_Rome'

def point(x, y, title, text, source):
    return {'x': x, 'y': y, 'title': title, 'text': text, 'sourceUrl': source}

def scene(id, file, title, description, points):
    photo = SOURCES[file]
    return {'id': id, 'title': title, 'image': '/_local/' + photo['file'], 'thumbnail': '/_local/' + photo['thumbnail'],
        'alt': description, 'description': description,
        'author': photo['author'], 'sourceUrl': photo['sourceUrl'],
        'license': photo['license'], 'licenseUrl': photo['licenseUrl'],
        'width': photo['width'], 'height': photo['height'], 'captureDate': photo.get('captureDate', ''),
        'hotspots': [dict(p, id=id + '-info-' + str(i + 1)) for i, p in enumerate(points)]}

def question(id, prompt, choices, answer, explanation, scene_id):
    return {'id': id, 'prompt': prompt, 'choices': choices, 'answer': answer,
        'explanation': explanation, 'sceneId': scene_id}

NAVIGATION = {
 'colosseum': [
  ('exterior','west', (58,81,'view','Đổi góc nhìn ngoại thất'), (20,84,'view','Xem lại toàn cảnh ngoại thất')),
  ('west','corridor', (56,67,'forward','Vào xem hành lang'), (18,82,'return','Trở ra ngoại thất ban ngày')),
  ('corridor','gallery', (49,68,'forward','Khám phá hành lang có mái vòm'), (46,78,'return','Trở lại hành lang mở')),
  ('gallery','interior', (71,64,'right','Nhìn ra lòng đấu trường'), (17,82,'return','Trở lại hành lang có mái')),
  ('interior','arena', (78,64,'right','Xem góc sàn đấu'), (18,80,'return','Trở lại toàn cảnh lòng đấu')),
  ('arena','hypogeum', (43,47,'down','Nhìn xuống khu Hypogeum'), (22,82,'return','Trở lại góc sàn đấu')),
  ('interior','hypogeum', (49,81,'down','Xem gần khu ngầm Hypogeum'), (77,80,'return','Trở lại toàn cảnh lòng đấu')),
  ('west','aerial', (82,22,'view','Đổi góc: toàn cảnh từ trên cao'), (24,79,'return','Trở lại ngoại thất mặt đất')),
  ('aerial','interior', (44,46,'down','Xem bên trong lòng đấu trường'), (85,20,'view','Đổi góc: nhìn toàn bộ từ trên cao')),
  ('gallery','arena', (59,85,'view','Đổi góc: sàn đấu và khán đài'), (78,24,'view','Đổi góc: hành lang có mái')),
 ],
 'arch-of-constantine': [
  ('wide','south', (53,81,'forward','Xem gần mặt phía Nam'), (19,85,'return','Trở lại ảnh toàn cảnh')),
  ('wide','side', (77,68,'right','Đổi sang mặt bên hông'), (48,83,'return','Trở lại ảnh toàn cảnh')),
  ('south','north', (91,73,'view','Đổi góc: mặt phía Bắc từ trên cao'), (20,83,'return','Trở lại mặt phía Nam')),
  ('north','side', (81,67,'right','Đổi sang mặt bên hông'), (76,59,'view','Đổi góc: mặt phía Bắc từ trên cao')),
  ('south','relief', (76,43,'up','Xem gần các huy chương và phù điêu'), (50,84,'return','Trở lại toàn mặt phía Nam')),
  ('relief','attic', (53,16,'up','Nhìn lên tầng tượng và phù điêu'), (49,85,'down','Nhìn xuống tầng huy chương')),
  ('attic','inscription', (10,31,'left','Xem bia khắc ở giữa mặt đứng'), (83,41,'right','Xem tầng tượng bên phải bia')),
  ('inscription','south', (23,87,'return','Trở lại toàn mặt phía Nam'), (51,20,'up','Xem gần bia khắc phía trên')),
 ],
 'pantheon': [
  ('exterior','oblique', (85,63,'view','Đổi góc: sảnh và khối đền ban ngày'), (22,83,'return','Trở lại mặt tiền ban ngày')),
  ('exterior','portico', (49,77,'forward','Vào xem dưới mái tiền sảnh'), (21,85,'return','Trở ra mặt tiền từ quảng trường')),
  ('portico','capitals', (77,37,'up','Nhìn lên đầu cột và hệ dầm'), (26,84,'return','Trở lại dưới mái tiền sảnh')),
  ('portico','entrance', (78,75,'view','Đổi góc: nhìn từ trong ra cửa vào'), (86,65,'forward','Xem gần tiền sảnh bên ngoài')),
  ('entrance','interior', (28,62,'left','Quay nhìn về trung tâm đền'), (81,76,'return','Quay về góc nhìn cửa vào')),
  ('interior','side', (79,46,'right','Nhìn ngang dọc không gian tròn'), (19,76,'return','Trở lại góc chính diện trung tâm')),
  ('side','chapel', (24,48,'left','Xem gần một bàn thờ bên'), (59,91,'return','Trở ra không gian tròn')),
  ('interior','floor', (55,87,'down','Nhìn xuống nền đá'), (20,16,'up','Ngẩng lên không gian trung tâm')),
  ('floor','entrance', (81,36,'view','Đổi góc: cửa vào của đền'), (52,88,'down','Xem gần nền đá dưới chân')),
  ('side','altar', (80,50,'right','Xem gần bàn thờ chính'), (79,78,'return','Trở lại góc nhìn ngang trong đền')),
  ('interior','dome', (53,19,'up','Ngước lên mái vòm'), (19,84,'down','Nhìn xuống không gian bên trong')),
  ('dome','oculus', (56,16,'up','Xem gần lỗ mở Oculus'), (77,82,'return','Trở lại toàn bộ mái vòm')),
  ('interior','altar', (52,78,'forward','Xem gần khu bàn thờ'), (22,85,'return','Trở lại toàn cảnh nội thất')),
  ('oculus','altar', (21,82,'down','Hạ góc nhìn về khu bàn thờ'), (67,23,'up','Ngước lên lỗ mở Oculus')),
  ('capitals','oblique', (80,81,'view','Đổi góc: sảnh và khối đền ban ngày'), (72,72,'up','Xem gần đầu cột tiền sảnh')),
 ],
}

def build(slug, name, title, scenes, edges, questions, sources):
    by_id = {s['id']: s for s in scenes}
    placements = {}
    for a,b,outward,inward in NAVIGATION[slug]:
        placements[(a,b)] = outward
        placements[(b,a)] = inward
    assert set(placements) == {(a,b) for edge in edges for a,b in [edge,edge[::-1]]}
    for a, b in edges:
        for origin, target in [(a, b), (b, a)]:
            x,y,direction,label = placements[(origin,target)]
            by_id[origin]['hotspots'].append({'id': origin + '-to-' + target, 'target': target,
                'direction': direction, 'x': x, 'y': y, 'title': label,
                'text': 'Chuyển góc nhìn; có điểm nối để quay lại ảnh này.'})
    for index, s in enumerate(scenes):
        s['title'] = f'{index + 1:02d} · ' + s['title']
    tour = {'id': slug + '-photo', 'version': 2, 'destinationSlug': slug,
        'destinationName': name, 'title': title, 'startSceneId': scenes[0]['id'],
        'routeNote': 'Mũi tên nối các góc nhìn, không phải tuyến đi bộ được khảo sát. Ảnh chụp ở nhiều thời điểm.',
        'contentSources': sources, 'scenes': scenes, 'questions': questions}
    (ROOT / (slug + '-tour.json')).write_text(json.dumps(tour, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return {'slug': slug, 'name': name, 'url': '/_local/' + slug + '-tour.json',
        'sceneCount': len(scenes), 'coverImage': scenes[0]['image']}

colosseum = [
    scene('exterior', 'colosseum-exterior.jpg', 'Toàn cảnh ngoại thất buổi sáng',
        'Toàn cảnh mặt ngoài Colosseum tráng lệ trong nắng sớm, làm lộ rõ các tầng vòm đá Travertine và cấu trúc hình elip đồ sộ.', [
        point(39, 41, 'Nhịp vòm ba tầng mặt đứng', 'Mặt ngoài Colosseum cao 48m, chia làm 4 tầng kiến trúc. Ba tầng dưới gồm 80 cổng vòm mỗi tầng, kết hợp thức cột Doric ở tầng 1, thức cột Ionic ở tầng 2 và thức cột Corinth ở tầng 3. Cấu trúc vòm lặp lại giúp giảm tải trọng khối lượng đá travertine khổng lồ mà vẫn đảm bảo độ chịu lực vững chắc.', COLOSSEO),
        point(28, 18, 'Tầng áp mái Attic kiên cố', 'Tầng thứ 4 là bức tường kín ốp đá với các cột dẹt Corinthian và cửa sổ nhỏ. Phía trên đỉnh từng gắn 240 cột đỡ bằng gỗ dùng để căng tấm bạt che nắng khổng lồ (Velarium), được điều khiển bởi lực lượng thủy thủ tinh nhuệ để che chở cho hơn 50.000 khán giả khỏi mưa nắng.', COLOSSEO)]),
    scene('west', 'colosseum-west.jpg', 'Góc nhìn ngoại thất phía Tây',
        'Góc nhìn từ phía Tây phản ánh chân thực dấu ấn thời gian: sự tương phản rõ rệt giữa mảng tường nguyên vẹn phía ngoài và phần khán đài bị khuyết sau nhiều thế kỷ.', [
        point(32, 32, 'Vật liệu Travertine và Tufa', 'Người La Mã đã sử dụng hơn 100.000 m³ đá travertine khai thác từ vùng Tivoli lân cận, liên kết bằng 300 tấn ngàm sắt kẹp (không dùng vữa). Khối lượng đá này đã tạo nên khung chịu lực vững bền thách thức động đất suốt hơn 2.000 năm.', COLOSSEO),
        point(76, 71, 'Vết tích hư hại và bảo tồn', 'Qua các trận động đất lớn vào năm 847 và 1349 cùng thời kỳ Trung cổ khi đá bị tận dụng để xây các cung điện La Mã, phần tường ngoài phía nam bị sập đã để lộ mặt cắt các tầng hành lang chịu lực bên trong.', COLOSSEO)]),
    scene('corridor', 'colosseum-corridor.jpg', 'Hành lang thông tầng và trụ gạch chịu lực',
        'Lối đi vành khuyên rộng lớn với lõi gạch nung La Mã kết hợp vữa tro núi lửa Pozzolana, đóng vai trò trục lưu thông chính giữa các tầng.', [
        point(73, 57, 'Hệ thống cửa thoát hiểm Vomitoria', 'Colosseum có 80 cửa vòm đánh số La Mã ở tầng trệt (76 cổng cho công chúng, 4 cổng danh dự). Hệ thống hành lang và cầu thang dốc cho phép 50.000 - 70.000 khán giả vào đúng vị trí hoặc thoát hiểm ra ngoài chỉ trong 10 đến 15 phút.', COLOSSEO),
        point(21, 57, 'Kỹ thuật xây gạch và vòm bê tông', 'Các trụ gạch dày kết hợp lõi bê tông La Mã (opus caementicium) nhẹ và siêu bền. Kỹ thuật này cho phép tạo ra các không gian thông tầng cao vút mà không cần cột chống ở giữa lối đi.', COLOSSEO)]),
    scene('gallery', 'colosseum-gallery.jpg', 'Hành lang vòm cuốn tầng trên',
        'Hành lang có mái vòm cuốn liên hoàn ở tầng cao, nơi từng là lối đi nhộn nhịp của các tầng lớp cư dân La Mã thưởng ngoạn sự kiện.', [
        point(52, 25, 'Vòm bán nguyệt phân bố tải trọng', 'Hệ vòm nôi (barrel vault) liên kết với vòm giao thoa (groin vault) giúp chuyển tải trọng của hàng ngàn tấn khán đài đá phía trên thẳng xuống các trụ móng ngầm vững chắc.', COLOSSEO),
        point(83, 50, 'Không gian dịch vụ công cộng', 'Dọc theo hành lang này thời cổ đại từng có các quầy bán thức ăn nhẹ, đồ uống và các vòi phun nước uống công cộng dẫn từ hệ thống cống dẫn nước dẫn về đấu trường.', COLOSSEO)]),
    scene('interior', 'colosseum-interior.jpg', 'Toàn cảnh lòng đấu trường và khán đài',
        'Góc nhìn toàn cảnh bao quát từ khán đài xuống trung tâm đấu trường, nơi diễn ra các trận quyết đấu đỉnh cao của các đấu sĩ gladiator.', [
        point(52, 72, 'Khu hầm ngầm Hypogeum lộ thiên', 'Nguyên bản sàn đấu bằng gỗ phủ cát đã bị thời gian phá hủy, làm lộ ra toàn bộ mê cung Hypogeum bên dưới với mạng lưới phòng giam, chuồng thú và đường ray thang nâng.', UNDERGROUND),
        point(80, 28, 'Phân tầng giai cấp trên khán đài Cavea', 'Khán đài được phân định đẳng cấp nghiêm ngặt: hàng đầu tiên (Podium) dành cho Hoàng đế và Nguyên lão; tầng tiếp theo (Maenianum primum) cho tầng lớp quý tộc; tầng giữa cho bình dân và tầng cao nhất bằng gỗ cho phụ nữ và nô lệ.', CAVEA)]),
    scene('arena', 'colosseum-arena.jpg', 'Khu vực sàn đấu phục dựng',
        'Một phần sàn gỗ phủ cát được phục dựng ở đầu phía đông, giúp người xem hình dung rõ ranh giới giữa mặt sân thi đấu và thế giới ngầm bên dưới.', [
        point(77, 49, 'Mặt sàn đấu Arena phủ cát', 'Từ "Arena" xuất phát từ tiếng Latin "harena" nghĩa là hạt cát. Lớp cát dày trên sàn gỗ có nhiệm vụ thấm hút mồ hôi, máu và nước để chống trơn trượt cho đấu sĩ và dã thú trong các trận tử chiến.', UNDERGROUND),
        point(32, 21, 'Lưới rào bảo vệ khán giả', 'Xung quanh mép sàn đấu từng có hệ thống lưới chắn kim loại kiên cố và các con lăn ngà voi xoay tròn để ngăn thú dữ nhảy vọt lên hàng ghế danh dự của các quan chức cấp cao.', CAVEA)]),
    scene('hypogeum', 'colosseum-hypogeum.jpg', 'Cận cảnh mê cung ngầm Hypogeum',
        'Khu hầm ngầm hai tầng được xây dựng dưới thời Hoàng đế Domitian, là hậu trường công nghệ phức tạp phục vụ các màn trình diễn kịch tính.', [
        point(51, 61, 'Hệ thống thang nâng cơ học', 'Hypogeum từng có 28 thang nâng ròng rọc bằng gỗ do nô lệ vận hành. Thang nâng có thể đưa các lồng nhốt hổ, sư tử hoặc voi bất ngờ trồi lên mặt sân qua các cửa sập bí mật trước sự sững sờ của khán giả.', UNDERGROUND),
        point(26, 62, 'Hệ thống cấp thoát nước ngầm', 'Dưới đáy Hypogeum là 4 cống ngầm lớn dẫn nước ra sông Tiber. Thời kỳ đầu trước khi xây Hypogeum kiên cố, người La Mã thậm chí còn bơm nước ngập đấu trường để tái hiện các trận hải chiến (naumachia).', UNDERGROUND)]),
    scene('aerial', 'colosseum-above.jpg', 'Góc nhìn toàn cảnh từ trên cao',
        'Góc nhìn từ trên cao làm nổi bật bố cục hình elip hoàn hảo cùng mối liên kết không gian mật thiết với Quảng trường La Mã và Khải hoàn môn kế cận.', [
        point(66, 68, 'Kích thước hình học elip hoàn mỹ', 'Trục dài của elip đo được 189m, trục ngắn 156m, chu vi ngoài lên tới 527m. Bố cục elip mở rộng tầm nhìn toàn diện cho mọi vị trí khán giả tốt hơn nhiều so với hình tròn Hy Lạp.', COLOSSEO),
        point(52, 53, 'Trục cảnh quan trung tâm Roma cổ', 'Đấu trường nằm ở thung lũng giữa ba ngọn đồi Caelian, Esquiline và Palatine, nguyên là vị trí hồ nhân tạo của cung điện Vàng Domus Aurea do bạo chúa Nero xây dựng trước đó.', CAVEA)]),
]
col_edges = [('exterior','west'), ('west','corridor'), ('corridor','gallery'), ('gallery','interior'),
    ('interior','arena'), ('arena','hypogeum'), ('interior','hypogeum'), ('west','aerial'), ('aerial','interior'), ('gallery','arena')]
col_questions = [
    question('underground','Hypogeum là khu vực nào trong Colosseum?', ['Mái che nắng trên đỉnh đấu trường','Khu mê cung ngầm hai tầng dưới sàn đấu','Hàng ghế danh dự của hoàng đế'],1,'Hypogeum là hệ thống hầm ngầm chứa phòng giam đấu sĩ, chuồng thú và thang máy ròng rọc cơ học.','hypogeum'),
    question('shape','Mặt bằng hình học tổng thể của Colosseum có dạng gì?', ['Hình elip hoàn hảo','Hình tròn đồng tâm','Hình chữ nhật bo góc'],0,'Colosseum có mặt bằng elip với trục dài 189m và trục ngắn 156m, tối ưu tầm nhìn cho khán giả.','aerial'),
    question('gallery','Đặc điểm kiến trúc nào nổi bật nhất ở các tầng mặt ngoài Colosseum?', ['Mỗi tầng sử dụng một thức cột kinh điển khác nhau (Doric, Ionic, Corinth)','Chỉ sử dụng cột gỗ thuần túy','Toàn bộ tường là kính phẳng'],0,'Ba tầng dưới của Colosseum lần lượt ứng dụng ba thức cột Hy Lạp kinh điển: Doric ở tầng 1, Ionic ở tầng 2 và Corinth ở tầng 3.','exterior'),
]

constantine = [
    scene('wide','constantine-wide.jpg','Khải hoàn môn Constantine và bối cảnh',
        'Toàn cảnh Khải hoàn môn sừng sững bên cạnh Colosseum trên con đường khải hoàn cổ xưa Via Triumphalis.', [
        point(51,58,'Cấu trúc ba cửa vòm cân xứng','Khải hoàn môn cao 21m, rộng 25.9m và sâu 7.4m, gồm một vòm lớn ở giữa cao 11.5m và hai vòm phụ hai bên, tạo nên tỷ lệ vàng kinh điển của kiến trúc La Mã.',ARCH),
        point(92,47,'Vị trí đắc địa cạnh Colosseum','Khải hoàn môn được xây dựng ngay điểm giao giữa Đồi Palatine và thung lũng Colosseum, là cửa ngõ diễu binh đón các đạo quân chiến thắng trở về Điện thờ Jupiter.',ARCH_PARK)]),
    scene('south','constantine-south.jpg','Mặt đứng chính phía Nam',
        'Mặt tiền hướng về phía nam đón ánh nắng rực rỡ, phô diễn các hàng cột Corinthian nhô cao và hệ thống tranh tượng phù điêu đồ sộ.', [
        point(50,63,'Cột đá cẩm thạch Numidian màu vàng','Bốn cột độc lập ở mỗi mặt tiền được tạc từ đá cẩm thạch vàng quý hiếm Numidian (giallo antico) với đầu cột chạm khắc hoa lá Corinthian tinh xảo.',ARCH),
        point(76,56,'Huy chương tròn thời Hoàng đế Hadrian','Phía trên hai cửa vòm nhỏ là các cặp phù điêu tròn (tondi) có đường kính hơn 2m mô tả các chuyến săn bắn dũng cảm và nghi lễ tế thần Apollo, Hercules và Diana.',ARCH)]),
    scene('north','constantine-north.jpg','Mặt đứng phía Bắc nhìn từ trên cao',
        'Góc nhìn từ trên cao hướng về mặt phía bắc, phô diễn trọn vẹn tầng đỉnh Attic và hệ thống phù điêu mô tả lễ mừng chiến thắng.', [
        point(51,24,'Tầng Attic đồ sộ chứa bia khắc văn tự','Tầng cao nhất (attic) làm bằng gạch ốp đá cẩm thạch trắng, nơi ghi bài văn khắc vinh danh chiến công thống nhất đế quốc của Constantine.',ARCH_PARK),
        point(30,64,'Sự cân đối hoàn hảo hai mặt Bắc - Nam','Cả hai mặt tiền đều có cấu trúc đối xứng tuyệt đối qua trục giữa, đảm bảo người xem từ cả hai chiều diễu hành đều chiêm ngưỡng trọn vẹn sự uy nghi.',ARCH)]),
    scene('side','constantine-side.jpg','Mặt bên hông và chiều dày công trình',
        'Góc nhìn từ cạnh bên làm nổi bật chiều dày vững chãi hơn 7 mét và các mảng trang trí chạm nổi tinh tế ở hai đầu hồi.', [
        point(50,48,'Huy chương tròn cỗ xe thần Mặt trời','Mặt hông phía đông có phù điêu tròn tạc cỗ xe tứ mã của Thần Mặt trời Sol đang bay lên, biểu trưng cho bình minh của một kỷ nguyên mới dưới triều đại Constantine.',ARCH_PARK),
        point(50,22,'Mảng phù điêu chữ nhật thời Trajan','Phần trên cùng của mặt hông gắn các tấm phù điêu tạc các chiến binh La Mã trong cuộc chiến tranh Dacia hiển hách của Hoàng đế Trajan.',ARCH_PARK)]),
    scene('relief','constantine-relief.jpg','Chi tiết các huy chương tròn và dải phù điêu',
        'Góc chụp cận cảnh minh chứng cho nghệ thuật điêu khắc đỉnh cao: hai huy chương tròn thời Hadrian phía trên và dải băng phù điêu Constantine chạy ngang bên dưới.', [
        point(33,34,'Nghệ thuật tái sử dụng tác phẩm Spolia','Constantine đã tái sử dụng các kiệt tác điêu khắc từ thời ba vị minh quân Trajan, Hadrian và Marcus Aurelius để khẳng định tính kế thừa ngai vàng chính thống và phẩm chất đế vương của mình.',ARCH_PARK),
        point(49,63,'Dải phù điêu phong cách Hậu kỳ Cổ đại','Dải băng ngang do các nghệ nhân thời Constantine trực tiếp chạm khắc, mô tả đoàn quân xuất trận và bài phát biểu của Hoàng đế tại Quảng trường La Mã với phong cách tạo hình trực diện, biểu cảm.',ARCH)]),
    scene('attic','constantine-attic.jpg','Tầng đỉnh Attic và hàng tượng người Dacia',
        'Chi tiết các pho tượng tạc từ đá cẩm thạch trắng đứng uy nghiêm trên các đỉnh cột, tương phản với nền đá cẩm thạch vân tím Pavonazzetto.', [
        point(16,49,'Các pho tượng tù binh Dacia','8 pho tượng lớn trên tầng đỉnh mô tả các tù binh chiến tranh người Dacia thời Hoàng đế Trajan với trang phục áo choàng và quần dài đặc trưng của các bộ tộc phương Bắc.',ARCH),
        point(53,66,'Phù điêu Marcus Aurelius phân phát cứu trợ','Các tấm phù điêu chữ nhật hai bên bia khắc mô tả lòng nhân đức của Hoàng đế Marcus Aurelius khi phân phát lương thực và tiền bạc cho dân chúng nghèo khó.',ARCH_PARK)]),
    scene('inscription','constantine-inscription.jpg','Bia văn khắc Latinh trên đỉnh cổng',
        'Tấm bia đá cẩm thạch lớn ở trung tâm tầng attic với dòng chữ khắc Latinh sâu từng được khảm chữ đồng mạ vàng rực rỡ.', [
        point(49,42,'Cụm từ lịch sử "Instinctu Divinitatis"','Văn bia tôn vinh Constantine đã giải phóng Roma khỏi tay bạo chúa "bằng nguồn cảm hứng thiêng liêng từ thần linh" (instinctu divinitatis), gợi nhắc đến điềm báo Thập tự giá trong trận chiến Cầu Milvian.',ARCH_PARK),
        point(49,76,'Hệ thống phào chỉ kiến trúc tinh xảo','Các đường gờ đá viền quanh bia khắc được chạm khắc hoa văn lá ô-rô (acanthus) và trứng cá (egg-and-dart) chuẩn mực kiến trúc La Mã cổ điển.',ARCH)]),
]
arch_edges = [('wide','south'),('wide','side'),('south','north'),('north','side'),('south','relief'),('relief','attic'),('attic','inscription'),('inscription','south')]
arch_questions = [
    question('arches','Khải hoàn môn Constantine được xây dựng để kỷ niệm sự kiện lịch sử nào?', ['Chiến thắng trong trận Cầu Milvian năm 312 SCN','Khánh thành Đấu trường Colosseum','Cuộc viễn chinh sang Ai Cập'],0,'Công trình được Thượng viện La Mã khánh thành năm 315 SCN để kỷ niệm chiến thắng của Constantine trước Maxentius tại Cầu Milvian.','wide'),
    question('reuse','Tại sao trên Khải hoàn môn lại có các phù điêu từ thời Trajan, Hadrian và Marcus Aurelius?', ['Do thợ xây không có đá mới','Kỹ thuật Spolia nhằm tôn vinh sự kế thừa những vị hoàng đế vĩ đại nhất của Roma','Do công trình bị sửa đổi thời Phục Hưng'],1,'Việc sử dụng lại phù điêu (spolia) là một thông điệp chính trị có chủ đích, gắn liền hình ảnh Constantine với ba vị minh quân vĩ đại nhất của La Mã.','relief'),
    question('statues','Các pho tượng đứng uy nghiêm trên đỉnh các cột ở tầng attic tạc ai?', ['Các tù binh chiến tranh người Dacia','Các võ sĩ giác đấu Colosseum','Các vị thần trên đỉnh Olympus'],0,'Đây là 8 pho tượng tù binh Dacia có từ thời Hoàng đế Trajan được đưa về trang hoàng trên tầng đỉnh công trình.','attic'),
]

pantheon = [
    scene('exterior','pantheon-exterior.jpg','Mặt tiền tiền sảnh nhìn từ quảng trường Piazza della Rotonda',
        'Mặt tiền kiêu hãnh của Đền Pantheon với mái tam giác cổ điển và hàng cột đá granite đồ sộ, biểu tượng bất biến suốt gần 2.000 năm.', [
        point(51,26,'Dòng chữ khắc tên Marcus Agrippa','Dòng chữ Latinh lớn trên dầm: "M·AGRIPPA·L·F·COS·TERTIUM·FECIT" (Marcus Agrippa, con trai của Lucius, chấp chính quan lần thứ ba, đã xây dựng ngôi đền này) nhằm tôn vinh người đặt nền móng đầu tiên.',PANTHEON),
        point(32,64,'16 cột đá Granite nguyên khối khổng lồ','Hàng hiên gồm 16 cột đá hoa cương nguyên khối không chắp nối, cao 12m và nặng hơn 60 tấn mỗi cột, được khai thác từ mỏ đá Mons Claudianus ở Ai Cập và vượt biển Địa Trung Hải về Rome.',PANTHEON)]),
    scene('oblique','pantheon-square.jpg','Góc nhìn tổng thể tiền sảnh và khối tròn Rotunda',
        'Góc nhìn chếch từ quảng trường hé lộ sự kết hợp táo bạo: một tiền sảnh hình chữ nhật kiểu Hy Lạp gắn liền với khối đại sảnh tròn (Rotunda) đồ sộ của La Mã.', [
        point(24,31,'Bức tường gạch Rotunda dày hơn 6 mét','Khối trụ tròn phía sau có tường gạch dày tới 6.4m, bên trong ẩn chứa mạng lưới các vòm giảm tải hình bán nguyệt giúp phân tán áp lực khổng lồ của mái vòm.',PANTHEON_MUSEUM),
        point(64,63,'Đài phun nước Fontana del Pantheon','Đài phun nước thế kỷ 16 đặt tại trung tâm quảng trường Piazza della Rotonda, trên đỉnh có tháp bia Ai Cập cổ đại Obelisk của Pharaoh Ramses II.',PANTHEON)]),
    scene('portico','pantheon-portico.jpg','Không gian bên dưới mái tiền sảnh Portico',
        'Bước vào bóng râm của hàng hiên tiền sảnh, người tham quan cảm nhận rõ rệt độ kỳ vĩ của không gian đệm trước khi bước vào đại sảnh linh thiêng.', [
        point(24,56,'Ba lối đi phân nhánh trang nghiêm','16 cột đá chia tiền sảnh thành 3 nhịp: lối giữa rộng lớn dẫn thẳng vào cửa chính, hai lối bên từng đặt tượng khổng lồ của Augustus và Agrippa.',PANTHEON),
        point(47,65,'Hệ khung mái gỗ tuyết tùng thay thế đồng cổ','Phần trần hiên xưa kia từng được ốp hàng ngàn tấn đồng mạ vàng lộng lẫy, trước khi bị Giáo hoàng Urban VIII (dòng họ Barberini) tháo dỡ vào thế kỷ 17 để đúc súng thần công.',PANTHEON)]),
    scene('capitals','pantheon-columns.jpg','Chi tiết đầu cột Corinthian và dầm đá',
        'Góc nhìn cận cảnh các đầu cột đá cẩm thạch trắng Pentelic được chạm khắc hoa văn lá gai acanthus vô cùng sống động và sắc nét.', [
        point(38,50,'Đầu cột thức Corinthian nguyên bản','Các đầu cột đá hoa mỹ được chạm khắc thủ công với tỷ lệ mẫu mực, tạo nên sự chuyển tiếp hài hòa giữa thân cột tròn và khối dầm đá vuông vức.',PANTHEON),
        point(58,23,'Dầm đá Architrave và gờ chỉ Cornice','Hệ thống dầm đỡ bằng đá cẩm thạch đồ sộ nâng đỡ toàn bộ kết cấu mái dốc tam giác phía trên mà không hề xuất hiện vết nứt nẻ sau hai thiên niên kỷ.',PANTHEON)]),
    scene('entrance','pantheon-entrance.jpg','Cánh cửa đồng cổ đại nhìn từ bên trong',
        'Đứng từ thềm cửa nhìn ngược ra quảng trường rực nắng qua đôi cánh cửa đồng cổ đại lớn nhất thế giới La Mã.', [
        point(87,53,'Cánh cửa đồng La Mã nặng 20 tấn','Đôi cánh cửa đồng hai cánh khổng lồ cao hơn 7 mét, mỗi cánh dày gần nửa mét và nặng hơn 10 tấn, quay trên các chốt ngõng bằng đồng từ thời cổ đại đến nay vẫn hoạt động trơn tru.',PANTHEON),
        point(35,83,'Ngưỡng cửa đá cẩm thạch xanh quý hiếm','Ngưỡng cửa vào được chế tác từ một phiến đá cẩm thạch châu Phi khổng lồ, đón hàng triệu lượt bước chân du khách và giáo dân qua nhiều thời đại.',PANTHEON_MUSEUM)]),
    scene('interior','pantheon-interior.jpg','Đại sảnh Rotunda và tỷ lệ hình cầu hoàn mỹ',
        'Toàn cảnh nội thất kỳ vĩ: chiều cao từ sàn lên đỉnh vòm đúng bằng 43.3m và đường kính lòng vòm cũng đúng 43.3m, tạo nên một quả cầu không gian toán học hoàn hảo.', [
        point(49,52,'7 hốc thờ lớn thờ các vị thần tinh tú','Tường tròn được khoét 7 hốc lớn (niche) xen kẽ hình bán nguyệt và hình chữ nhật, nguyên thủy là nơi đặt tượng thờ 7 vị thần hành tinh La Mã (Mặt Trời, Mặt Trăng, Sao Hỏa, Sao Thủy, Sao Mộc, Sao Kim, Sao Thổ).',PANTHEON),
        point(27,88,'Mộ danh họa thời Phục hưng Raphael','Pantheon là nơi yên nghỉ vĩnh hằng của thiên tài hội họa thời Phục Hưng Raphael (qua đời năm 1520) cùng hai vị vua thống nhất nước Ý: Vittorio Emanuele II và Umberto I.',PANTHEON_MUSEUM)]),
    scene('side','pantheon-side.jpg','Vòng cột đá cẩm thạch và hốc tường bên',
        'Góc nhìn dọc theo chu vi tường tròn, thấy rõ các cặp cột đá cẩm thạch vàng Giallo Antico và cẩm thạch vân tím nâng đỡ các trán mái vòm nhỏ.', [
        point(43,46,'Cột đá cẩm thạch nguyên khối bao quanh','Mỗi hốc thờ được che bởi hai cột đá cẩm thạch rực rỡ, tạo nhịp điệu ánh sáng và bóng đổ sinh động quanh chu vi công trình.',PANTHEON),
        point(57,77,'Sự chuyển hóa thành Vương cung thánh đường','Năm 609 SCN, Hoàng đế Byzantine Phocas đã tặng ngôi đền cho Giáo hoàng Boniface IV, chuyển hóa thành Nhà thờ Thánh Maria và các Thánh Tử Đạo, nhờ đó bảo vệ công trình không bị phá hủy.',PANTHEON_MUSEUM)]),
    scene('chapel','pantheon-chapel.jpg','Bàn thờ bên và các tác phẩm nghệ thuật tôn giáo',
        'Cận cảnh một nhà nguyện bên trong lòng đền, phô diễn các bức bích họa Phục hưng và các tượng thánh bằng đá cẩm thạch trắng.', [
        point(49,58,'Nhà nguyện Truyền Tin (Annunciation)','Tác phẩm bích họa tuyệt đẹp thời Phục hưng của họa sĩ Melozzo da Forlì vẽ cảnh Thiên thần truyền tin cho Đức Mẹ Maria.',PANTHEON),
        point(49,74,'Tượng Đức Mẹ với Tảng Đá (Madonna del Sasso)','Bức tượng Đức Mẹ linh thiêng do nhà điêu khắc Lorenzetto tạc theo di nguyện của bạn thân ông là danh họa Raphael đặt ngay trên mộ của danh họa.',PANTHEON_MUSEUM)]),
    scene('altar','pantheon-altar.jpg','Bàn thờ chính Apse ở trục đối diện cửa vào',
        'Bàn thờ chính tôn nghiêm nằm trong hốc vòm bán cầu đối diện lối vào, trung tâm của các thánh lễ Công giáo hiện đại.', [
        point(51,64,'Bức tranh Icon Đức Mẹ đồng trinh thế kỷ 7','Tại bàn thờ lưu giữ bức tranh gỗ thiêng vẽ Đức Mẹ và Chúa Hài Đồng từ thế kỷ thứ 7, được Giáo hoàng Boniface IV dâng tặng khi cung hiến đền.',PANTHEON),
        point(92,33,'Vòm bán nguyệt trang trí hoa văn khảm vàng','Đỉnh vòm của bàn thờ chính giữ lại những mảnh mosaic vàng lấp lánh phản chiếu ánh sáng từ lỗ mở Oculus trên trần.',PANTHEON_MUSEUM)]),
    scene('floor','pantheon-floor.jpg','Nền đá cẩm thạch La Mã đa sắc nguyên bản',
        'Mặt sàn lát đá cẩm thạch hình học bảo tồn gần như nguyên vẹn từ thời cổ đại với các phiến đá Porphyry đỏ Ai Cập, cẩm thạch vàng và đá hoa cương xám.', [
        point(55,22,'Hệ thống 22 lỗ thoát nước mưa tinh tế','Do lỗ Oculus mở thẳng lên trời, nước mưa sẽ rơi tự do xuống sàn. Mặt sàn được thiết kế hơi cong lồi ở giữa và dốc nhẹ ra xung quanh với 22 lỗ thoát nước ngầm giúp sàn luôn khô ráo nhanh chóng.',PANTHEON_MUSEUM),
        point(36,73,'Đá Đỏ Imperial Porphyry biểu tượng hoàng gia','Các vòng tròn lớn bằng đá porphyry màu đỏ tía quý hiếm – loại đá chỉ dành riêng cho Hoàng đế La Mã khai thác từ sa mạc phía đông Ai Cập.',PANTHEON)]),
    scene('dome','pantheon-dome.jpg','Mái vòm bê tông không cốt thép lớn nhất thế giới',
        'Ngước nhìn tuyệt tác vòm bê tông vĩ đại: 5 tầng ô lõm (coffers) gồm 28 ô mỗi tầng xoay đồng tâm hướng về lỗ mở Oculus ở đỉnh.', [
        point(44,6,'Bí quyết vật liệu bê tông siêu nhẹ dần lên đỉnh','Bê tông La Mã ở chân vòm sử dụng đá travertine nặng và bền; lên đến giữa vòm dùng đá tufa xốp; và gần đỉnh vòm người La Mã sử dụng tro núi lửa và đá bọt pumice siêu nhẹ nổi trên nước.',PANTHEON),
        point(73,47,'140 ô lõm hình học Coffers (Caissons)','5 tầng với tổng cộng 140 ô lõm không chỉ tạo hiệu ứng thẩm mỹ hút mắt mà còn giúp giảm bớt hơn 500 tấn trọng lượng của toàn bộ mái vòm bê tông.',PANTHEON_MUSEUM)]),
    scene('oculus','pantheon-oculus.jpg','Cận cảnh lỗ mở thiên văn Oculus - Con mắt của Rome',
        'Lỗ hổng tròn đường kính 9m trên đỉnh vòm mở thẳng lên vòm trời xanh, là nguồn cung cấp ánh sáng duy nhất cho toàn bộ không gian đền.', [
        point(49,28,'Đồng hồ mặt trời khổng lồ của thế giới cổ đại','Vệt ánh sáng mặt trời chiếu qua Oculus dịch chuyển quanh các bức tường tròn theo từng giờ và từng mùa, tạo nên chiếc đồng hồ thiên văn kỳ vĩ tôn vinh các vị thần vũ trụ.',PANTHEON),
        point(28,69,'Vòng đai gia cố bằng đồng nguyên bản','Miệng lỗ Oculus được viền bằng một vòng đai kim loại bằng đồng nguyên bản từ thời La Mã, vừa bảo vệ mép bê tông vừa phân bổ đều ứng suất nén của đỉnh vòm.',PANTHEON_MUSEUM)]),
]
pan_edges = [('exterior','oblique'),('exterior','portico'),('portico','capitals'),('portico','entrance'),
    ('entrance','interior'),('interior','side'),('side','chapel'),('interior','floor'),('floor','entrance'),('side','altar'),
    ('interior','dome'),('dome','oculus'),('interior','altar'),('oculus','altar'),('capitals','oblique')]
pan_questions = [
    question('oculus','Lỗ mở Oculus trên đỉnh mái vòm Pantheon có tác dụng gì?', ['Đưa ánh sáng tự nhiên vào lòng đền và hoạt động như đồng hồ mặt trời','Chỉ dùng để thoát khói khi tế lễ','Là lối đi bí mật lên nóc đền'],0,'Lỗ mở Oculus đường kính 9m là nguồn chiếu sáng duy nhất, tạo luồng ánh sáng mặt trời dịch chuyển quanh tường theo chu kỳ ngày và mùa.','oculus'),
    question('columns','16 cột đá nguyên khối ở tiền sảnh Pantheon có nguồn gốc đặc biệt như thế nào?', ['Đúc bằng bê tông tại chỗ','Được khai thác từ các mỏ đá granite nguyên khối ở Ai Cập và vận chuyển vượt biển về Rome','Làm bằng gỗ tuyết tùng phủ thạch cao'],1,'Mỗi cột đá hoa cương nguyên khối nặng hơn 60 tấn được đục đẽo từ mỏ đá Mons Claudianus ở Ai Cập và kéo về Rome qua sông Nile và biển Địa Trung Hải.','portico'),
    question('dome_geometry','Không gian bên trong đại sảnh tròn Rotunda của Pantheon có tỷ lệ hình học gì đặc biệt?', ['Chiều cao đúng bằng đường kính vòm (43.3m), chứa trọn một khối cầu toán học hoàn hảo','Chiều cao gấp đôi đường kính đáy','Mặt bằng hình oval elip'],0,'Pantheon đạt đến đỉnh cao hình học cổ điển khi chiều cao từ sàn lên đỉnh vòm đúng bằng đường kính lòng vòm (43.3m), tạo thành một hình cầu hoàn hảo bên trong.','interior'),
]

catalog = [
    build('colosseum','Đấu trường La Mã','Từ tầng vòm đến lòng đấu trường',colosseum,col_edges,col_questions,
        [{'title':'Cổng thông tin du lịch chính thức Roma — Colosseum','url':COLOSSEO},{'title':'Bách khoa toàn thư Wikipedia — Đấu trường La Mã','url':CAVEA},{'title':'Kiến trúc và không gian nội thất Colosseum','url':UNDERGROUND}]),
    build('arch-of-constantine','Khải hoàn môn Constantine','Giải mã những lớp phù điêu',constantine,arch_edges,arch_questions,
        [{'title':'Cổng thông tin du lịch chính thức Roma — Khải hoàn môn Constantine','url':ARCH},{'title':'Bách khoa toàn thư Wikipedia — Khải hoàn môn Constantine','url':ARCH_PARK}]),
    build('pantheon','Đền Pantheon','Từ sảnh cột đến khoảng trời Oculus',pantheon,pan_edges,pan_questions,
        [{'title':'Cổng thông tin du lịch chính thức Roma — Đền Pantheon','url':PANTHEON},{'title':'Bách khoa toàn thư Wikipedia — Đền Pantheon','url':PANTHEON_MUSEUM}]),
]
(ROOT / 'tours.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
region = json.loads((ROOT / 'region.json').read_text(encoding='utf-8'))
for place in region['destinations']:
    entry = next(t for t in catalog if t['slug'] == place['slug'])
    photo = SOURCES[Path(entry['coverImage']).name]
    place.update(coverImageUrl=entry['coverImage'], coverImageCredit=photo['author'] + ' · ' + photo['license'],
        coverImageSourceUrl=photo['sourceUrl'], coverImageLicenseUrl=photo['licenseUrl'])
(ROOT / 'region.json').write_text(json.dumps(region, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Built ' + str(len(catalog)) + ' tours, ' + str(sum(t['sceneCount'] for t in catalog)) + ' scenes; every graph edge is reversible.')
