const failed = new Set<string>();

// Mỗi lần phát tạo một thẻ Audio mới để các âm thanh có thể chồng lên nhau.
// Trình duyệt chỉ cho phát sau một thao tác của người dùng (click), nên hãy gọi từ sự kiện click
// hoặc từ vòng lặp đã được kích hoạt bởi click.
export function playSfx(url: string, volume = 0.9) {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.onerror = () => {
    if (!failed.has(url)) {
      failed.add(url);
      console.warn(`Không tải được âm thanh: ${url}`);
    }
  };
  void audio.play().catch(() => {
    // Bỏ qua: lỗi chặn autoplay hoặc file thiếu đã được báo ở onerror.
  });
  return audio;
}
