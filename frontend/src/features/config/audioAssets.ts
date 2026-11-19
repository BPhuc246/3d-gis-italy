// File âm thanh nằm trong frontend/public/audio/, nên URL bắt đầu bằng /audio/
export const AUDIO = {
  beep: "/audio/beep.mp3",
  roar: "/audio/roar.mp3",
  // Người chơi đánh trúng sư tử
  playerHitLion: "/audio/hit.mp3",
  // Người chơi chặn đòn thành công
  playerBlock: "/audio/block.mp3",
  // Sư tử đánh trúng người chơi
  lionHitPlayer: "/audio/lion_hit.mp3",
  // Sư tử thủ (đòn của người chơi bị chặn)
  lionGuard: "/audio/defend.mp3",
  victory: "/audio/victory.mp3",
  defeat: "/audio/defeat.mp3",
  // Tiếng lửa tưởng niệm (lặp)
  fire: "/audio/fire.mp3",
} as const;
