export type SceneKey =
  | "colosseum"
  | "arch-of-constantine"
  | "vittoriano"
  | "pantheon";

export type Feature =
  | {
      id: string;
      label: string;
      hint: string;
      type: "video";
      featureKey: string;
    }
  | { id: string; label: string; hint: string; type: "scene"; scene: SceneKey };

// Video nằm trong frontend/public/_local/videos/, Vite phục vụ tại /_local/videos/
export const VIDEO_URLS: Record<string, string> = {
  "arch-of-constantine": "/_local/videos/arch-intro.mp4",
  colosseum: "/_local/videos/colosseum-intro.mp4",
  pantheon: "/_local/videos/patheon.mp4", // Nếu file đã đổi thành pantheon.mp4 thì sửa lại đường dẫn
  vittoriano: "/_local/videos/victoriano.mp4",
};

export const FEATURES: Record<string, Feature[]> = {
  colosseum: [
    {
      id: "intro",
      label: "Video giới thiệu",
      hint: "Lịch sử và kiến trúc",
      type: "video",
      featureKey: "colosseum",
    },
    {
      id: "arena",
      label: "Đấu trường 3D",
      hint: "Mở cổng hầm, đội mũ, tư thế chiến đấu, khán giả",
      type: "scene",
      scene: "colosseum",
    },
  ],
  "arch-of-constantine": [
    {
      id: "intro",
      label: "Video lịch sử",
      hint: "Lịch sử và kiến trúc khải hoàn môn",
      type: "video",
      featureKey: "arch-of-constantine",
    },
  ],
  vittoriano: [
    {
      id: "intro",
      label: "Video giới thiệu",
      hint: "Lịch sử và kiến trúc",
      type: "video",
      featureKey: "vittoriano",
    },
    {
      id: "memorial",
      label: "Tưởng niệm 3D",
      hint: "Cúi đầu, thắp nến mô phỏng, lên bậc thang",
      type: "scene",
      scene: "vittoriano",
    },
  ],
  pantheon: [
    {
      id: "intro",
      label: "Video giới thiệu",
      hint: "Lịch sử và kiến trúc",
      type: "video",
      featureKey: "pantheon",
    },
    {
      id: "oculus",
      label: "Ánh sáng Oculus",
      hint: "Ngước nhìn mái vòm, mưa mô phỏng",
      type: "scene",
      scene: "pantheon",
    },
  ],
};
