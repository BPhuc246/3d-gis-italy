import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { pool } from './pool';

const accounts = [
  { id: '00000000-0000-4000-8000-000000000101', name: 'Minh An', email: 'demo.an@example.test' },
  { id: '00000000-0000-4000-8000-000000000102', name: 'Thu Hà', email: 'demo.ha@example.test' },
  { id: '00000000-0000-4000-8000-000000000103', name: 'Gia Bảo', email: 'demo.bao@example.test' },
];

const realisticReviews: Record<string, Record<string, { rating: number; comment: string }>> = {
  'demo.an@example.test': {
    colosseum: {
      rating: 5,
      comment: 'Trải nghiệm ngắm nhìn Đấu trường La Mã tận mắt thực sự choáng ngợp hơn nhiều so với trong sách ảnh. Mình khuyên các bạn nên đặt vé Full Experience sớm ít nhất 2-3 tuần để được xuống khu vực tầng hầm Hypogeum và đứng trực tiếp trên sàn đấu. Đứng từ phía dưới ngước nhìn lên các vòng khán đài mới cảm nhận hết được sự kỳ vĩ của kết cấu La Mã cổ đại.',
    },
    'arch-of-constantine': {
      rating: 5,
      comment: 'Khải hoàn môn đứng sừng sững ngay cạnh Colosseum, hoàn toàn miễn phí tham quan ngoài trời. Càng nhìn gần các bức phù điêu chạm khắc tinh xảo và các dòng văn tự Latinh trên tầng đỉnh (attic) càng thấy mê hoặc. Rất thú vị khi biết nhiều mảng điêu khắc ở đây được tái sử dụng từ thời các hoàng đế Trajan, Hadrian và Marcus Aurelius.',
    },
    pantheon: {
      rating: 5,
      comment: 'Không gian bên trong Pantheon thực sự khiến người ta phải nín thở vì kinh ngạc. Mái vòm bê tông không cốt thép lớn nhất thế giới tồn tại gần 2.000 năm mà vẫn sừng sững nguyên vẹn. Khoảnh khắc đứng ngay dưới lỗ mở Oculus vào giữa trưa khi luồng ánh sáng mặt trời rọi thẳng xuống nền đá hoa cương tạo nên một khung cảnh vô cùng linh thiêng.',
    },
  },
  'demo.ha@example.test': {
    colosseum: {
      rating: 4,
      comment: 'Công trình lịch sử vĩ đại và mang đậm dấu ấn thời gian. Điểm trừ duy nhất là lượng khách tham quan luôn rất đông, xếp hàng qua cổng an ninh mất khoảng 30 phút dù đã có vé giờ cố định. Bạn nên đến vào sáng sớm tầm 8h30 hoặc chiều tà khi ánh hoàng hôn chiếu rọi lên các vòm đá travertine, chụp ảnh cực kỳ đẹp.',
    },
    'arch-of-constantine': {
      rating: 4,
      comment: 'Vị trí tuyệt vời nằm trên trục đường diễu binh chiến thắng Via Triumphalis cổ đại. Buổi tối công trình được thắp đèn vàng rất lung linh, không khí lãng mạn và yên bình hơn ban ngày rất nhiều. Một điểm check-in lịch sử không thể bỏ lỡ khi ghé thăm cụm di tích Đấu trường.',
    },
    pantheon: {
      rating: 5,
      comment: 'Một trong những công trình La Mã được bảo tồn nguyên vẹn và hoàn hảo nhất. Tiền sảnh với 16 cột đá granite nguyên khối nặng hơn 60 tấn được vận chuyển từ tận Ai Cập về La Mã thời cổ đại là một kỳ tích. Hiện tại vé vào cổng 5€ rất xứng đáng, lưu ý nên ăn mặc lịch sự che vai và đầu gối vì đây là nơi thờ tự linh thiêng.',
    },
  },
  'demo.bao@example.test': {
    colosseum: {
      rating: 5,
      comment: 'Tuyệt tác kiến trúc của nhân loại! Hệ thống hơn 80 cổng vòm thoát hiểm (vomitoria) giúp 50.000 khán giả có thể sơ tán chỉ trong mười lăm phút chứng minh trình độ kỹ thuật bậc thầy của người La Mã từ thế kỷ thứ nhất. Rất đáng dành trọn vẹn nửa ngày để khám phá kết hợp cùng Đồi Palatine.',
    },
    'arch-of-constantine': {
      rating: 4,
      comment: 'Kiến trúc ba cổng vòm cân xứng hoàn hảo với các hàng cột Corinthian bằng đá cẩm thạch trắng. Bạn nên kết hợp ngắm nhìn toàn cảnh từ góc đồi phía bắc để thấy rõ sự tương phản quy mô hài hòa giữa khải hoàn môn và đấu trường La Mã phía sau.',
    },
    pantheon: {
      rating: 5,
      comment: 'Kiến trúc đạt đến độ hoàn mỹ về hình học: đường kính của mái vòm đúng bằng chiều cao từ sàn lên đỉnh vòm (43,3m), tạo thành một hình cầu hoàn hảo bên trong khối trụ tròn. Hệ thống các lỗ thoát nước tinh tế trên mặt sàn đá để dẫn nước mưa từ Oculus là một minh chứng xuất sắc cho kỹ thuật cấp thoát nước La Mã.',
    },
  },
};

const slugs = ['colosseum', 'arch-of-constantine', 'pantheon'] as const;

async function main() {
  const dbHost = new URL(env.DB_POSTGRES).hostname;
  if (env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(dbHost)) {
    throw new Error('Dữ liệu demo chỉ được tạo/xóa trên PostgreSQL cục bộ, ngoài production.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Both ID and email must match before modifying an existing demo identity.
    for (const account of accounts) {
      const { rows } = await client.query('SELECT user_id, email FROM users WHERE user_id = $1 OR email = $2', [account.id, account.email]);
      if (rows.some(row => row.user_id !== account.id || row.email !== account.email)) {
        throw new Error('ID/email demo trùng tài khoản khác; chưa sửa dữ liệu.');
      }
    }
    if (process.argv.includes('--clear')) {
      for (const account of accounts) await client.query('DELETE FROM users WHERE user_id = $1 AND email = $2', [account.id, account.email]);
      await client.query('COMMIT');
      console.log('Đã xóa dữ liệu tài khoản demo cùng đánh giá/yêu thích.');
      return;
    }
    const { rows: destinations } = await client.query('SELECT destination_id, slug FROM tourist_destination WHERE slug = ANY($1::text[])', [slugs as unknown as string[]]);
    if (destinations.length !== 3) throw new Error('Cần đủ ba địa điểm; chạy migration trước.');
    const passwordHash = await bcrypt.hash('demo', 12);
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      await client.query(`INSERT INTO users(user_id, full_name, email, password_hash) VALUES($1,$2,$3,$4)
        ON CONFLICT(user_id) DO UPDATE SET full_name=EXCLUDED.full_name, password_hash=EXCLUDED.password_hash`,
        [account.id, account.name, account.email, passwordHash]);
      for (let n = 0; n < slugs.length; n++) {
        const slug = slugs[n];
        const destination = destinations.find(d => d.slug === slug)!;
        const reviewData = realisticReviews[account.email][slug];
        await client.query(`INSERT INTO review(user_id,destination_id,rating,comment) VALUES($1,$2,$3,$4)
          ON CONFLICT(user_id,destination_id) DO UPDATE SET rating=EXCLUDED.rating,comment=EXCLUDED.comment`,
          [account.id, destination.destination_id, reviewData.rating, reviewData.comment]);
        if ((i + n) % 2 === 0) await client.query(`INSERT INTO favorite(user_id,destination_id) VALUES($1,$2) ON CONFLICT(user_id,destination_id) DO NOTHING`, [account.id, destination.destination_id]);
      }
    }
    await client.query('COMMIT');
    console.log('Đã cập nhật 3 tài khoản người dùng và 9 bài đánh giá chi tiết thực tế; thêm 5 cặp yêu thích.');
    console.log('Tài khoản: demo.an@example.test / demo.ha@example.test / demo.bao@example.test');
    console.log('Mật khẩu: demo');
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { client.release(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
