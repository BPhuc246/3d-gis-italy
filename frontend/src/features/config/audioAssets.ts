// File âm thanh nằm trong frontend/public/_local/audio/, nên URL bắt đầu bằng /_local/audio/
export const AUDIO = {
  beep: "/_local/audio/beep.mp3",
  roar: "/_local/audio/roar.mp3",
  // Người chơi đánh trúng sư tử
  playerHitLion: "/_local/audio/hit.mp3",
  // Người chơi chặn đòn thành công
  playerBlock: "/_local/audio/block.mp3",
  // Sư tử đánh trúng người chơi
  lionHitPlayer: "/_local/audio/lion_hit.mp3",
  // Sư tử thủ (đòn của người chơi bị chặn)
  lionGuard: "/_local/audio/defend.mp3",
  victory: "/_local/audio/victory.mp3",
  defeat: "/_local/audio/defeat.mp3",
  // Tiếng lửa tưởng niệm (lặp)
  fire: "/_local/audio/fire.mp3",
} as const;
