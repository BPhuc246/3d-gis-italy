export type SceneKey = "colosseum" | "arch-parade" | "vittoriano" | "pantheon";

export type Feature =
  | {
      id: string;
      label: string;
      hint: string;
      type: "video";
      featureKey: string;
    }
  | { id: string; label: string; hint: string; type: "scene"; scene: SceneKey };

export const FEATURES: Record<string, Feature[]> = {
  colosseum: [
    {
      id: "intro",
      label: "Video giới thiệu",
      hint: "Lịch sử và kiến trúc",
      type: "video",
      featureKey: "intro_video",
    },
    {
      id: "walk",
      label: "Tham quan thực tế",
      hint: "Video quay tại hiện trường",
      type: "video",
      featureKey: "walkthrough_video",
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
      featureKey: "intro_video",
    },
    {
      id: "parade",
      label: "Đoàn diễu hành 3D",
      hint: "Đi xuyên qua cổng vòm",
      type: "scene",
      scene: "arch-parade",
    },
  ],
  vittoriano: [
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
      id: "oculus",
      label: "Ánh sáng Oculus",
      hint: "Ngước nhìn mái vòm, mưa mô phỏng",
      type: "scene",
      scene: "pantheon",
    },
  ],
};
