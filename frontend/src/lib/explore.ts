import { api } from "./api";
import type { RegionDetail, RouteDetail, TourDetail } from "./api";

// Nội dung giới thiệu (chỉ hiển thị, không phải dữ liệu nghiệp vụ)
export type PlaceStory = {
  eyebrow: string;
  subtitle: string;
  era: string;
  color: string;
  description: string;
  facts: { label: string; value: string }[];
  sourceUrl: string;
};

export const stories: Record<string, PlaceStory> = {
  colosseum: {
    eyebrow: "01 / ĐẤU TRƯỜNG",
    subtitle: "Colosseo · Anfiteatro Flavio",
    era: "Năm 70 - 80 SCN",
    color: "#bc704c",
    description:
      "Đấu trường Flavian (Colosseum) là kiệt tác vĩ đại nhất của kỹ thuật xây dựng La Mã cổ đại. Với quy mô 4 tầng vòm đá travertine, hệ thống 80 cửa thoát hiểm vomitoria và mê cung hầm ngầm Hypogeum tinh vi, nơi đây từng tổ chức các trận quyết chiến giác đấu và đại hội kịch tính cho hơn 50.000 khán giả.",
    facts: [
      { label: "Khánh thành", value: "Năm 80 SCN (Titus)" },
      { label: "Quy mô", value: "Dài 189m · Rộng 156m · Cao 48m" },
      { label: "Sức chứa", value: "50.000 - 70.000 khán giả" },
      { label: "Điểm nổi bật", value: "Tầng vòm đá & Hầm ngầm Hypogeum" },
    ],
    sourceUrl:
      "https://www.turismoroma.it/en/places/flavian-amphitheatre-colosseum",
  },
  "arch-of-constantine": {
    eyebrow: "02 / KHẢI HOÀN MÔN",
    subtitle: "Arco di Costantino · Via Triumphalis",
    era: "Năm 315 SCN",
    color: "#b49b62",
    description:
      "Khải hoàn môn lớn nhất thế giới La Mã còn tồn tại nguyên vẹn, dựng năm 315 SCN để vinh danh chiến thắng Cầu Milvian của Hoàng đế Constantine I. Công trình nổi bật với ba lối vòm đá cẩm thạch trắng cân xứng cùng các bức phù điêu đỉnh cao được kế thừa từ thời các minh quân Trajan, Hadrian và Marcus Aurelius.",
    facts: [
      { label: "Khánh thành", value: "Năm 315 SCN (Constantine I)" },
      { label: "Kích thước", value: "Cao 21m · Rộng 25.9m · Sâu 7.4m" },
      { label: "Vật liệu", value: "Đá cẩm thạch trắng & Cột Numidian vàng" },
      {
        label: "Điểm nổi bật",
        value: "Ba cổng vòm, Tượng Dacia & Phù điêu Spolia",
      },
    ],
    sourceUrl: "https://www.turismoroma.it/en/places/arch-costantine",
  },
  pantheon: {
    eyebrow: "03 / ĐỀN THẦN LA MÃ",
    subtitle: "Pantheon · Piazza della Rotonda",
    era: "Năm 125 SCN",
    color: "#748778",
    description:
      'Ngôi đền cổ đại được bảo tồn hoàn hảo nhất thế giới, tái thiết dưới triều Hoàng đế Hadrian. Không gian kết hợp tiền sảnh 16 cột đá hoa cương Ai Cập nguyên khối nặng 60 tấn với đại sảnh tròn Rotunda dưới mái vòm bê tông không cốt thép lớn nhất thế giới suốt 2.000 năm, được thắp sáng huyền diệu bởi "Con mắt của Rome" - lỗ mở Oculus 9m.',
    facts: [
      { label: "Niên đại", value: "Khoảng năm 125 SCN (Hadrian)" },
      { label: "Mái vòm", value: "Bê tông không cốt thép (Đường kính 43.3m)" },
      { label: "Lỗ mở Oculus", value: "Đường kính 9m mở lên bầu trời" },
      {
        label: "Điểm nổi bật",
        value: "Không gian hình cầu & Nơi an nghỉ của Raphael",
      },
    ],
    sourceUrl: "https://www.turismoroma.it/en/places/pantheon",
  },
  vittoriano: {
    eyebrow: "04 / ĐÀI TƯỞNG NIỆM QUỐC GIA",
    subtitle: "Monumento a Vittorio Emanuele II · Altare della Patria",
    era: "Năm 1885 - 1935",
    color: "#8c7a6b",
    description:
      "Đài tưởng niệm Quốc gia tôn vinh Vị vua đầu tiên thống nhất nước Ý và Bàn thờ Tổ quốc (Altare della Patria), kiệt tác đá cẩm thạch trắng Botticino tọa lạc uy nghi tại Quảng trường Venezia với hàng cột Corinthian đồ sộ, tượng đài kỵ mã và ngọn lửa vĩnh cửu canh gác Mộ Chiến sĩ Vô danh.",
    facts: [
      { label: "Khánh thành", value: "Năm 1911 (Hoàn thành 1935)" },
      { label: "Quy mô", value: "Rộng 135m · Sâu 130m · Cao 81m (gồm tứ mã)" },
      { label: "Vật liệu", value: "Đá cẩm thạch trắng Botticino" },
      {
        label: "Điểm nổi bật",
        value: "Bàn thờ Tổ quốc & Cỗ xe Tứ mã Quadriga",
      },
    ],
    sourceUrl:
      "https://www.turismoroma.it/en/places/monumental-complex-vittoriano",
  },
};

export function searchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// Dữ liệu cục bộ đã bỏ: mọi thứ đi từ API. Các tên cũ được giữ để màn hình hiện tại vẫn biên dịch.
export const localDemoAvailable = false;

export const loadLocalRegion = (): Promise<RegionDetail> =>
  api.regions.get("roma-trung-tam");

export async function loadLocalRoutes(): Promise<RouteDetail[]> {
  const list = await api.routes.list();
  return Promise.all(list.map((r) => api.routes.get(r.routeId)));
}

// Kiểu tour dùng bởi component PhotoTour
export type NavigationDirection =
  | "left"
  | "right"
  | "forward"
  | "up"
  | "down"
  | "return"
  | "view";
export type Hotspot = {
  id: string;
  x: number;
  y: number;
  title: string;
  text: string;
  target?: string;
  direction?: NavigationDirection;
  sourceUrl?: string;
};
export type PhotoScene = {
  id: string;
  title: string;
  image: string;
  thumbnail?: string;
  alt: string;
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  width?: number;
  height?: number;
  captureDate?: string;
  description: string;
  hotspots: Hotspot[];
};
export type TourQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  sceneId?: string;
};
export type PhotoTour = {
  id: string;
  version: number;
  destinationSlug: string;
  destinationName: string;
  title: string;
  startSceneId: string;
  routeNote: string;
  contentSources: { title: string; url: string }[];
  scenes: PhotoScene[];
  questions: TourQuestion[];
};

function toPhotoTour(t: TourDetail): PhotoTour {
  return {
    id: t.id,
    version: t.version,
    destinationSlug: t.destinationSlug,
    destinationName: t.destinationName,
    title: t.title,
    startSceneId: t.startSceneId ?? t.scenes[0]?.id ?? "",
    routeNote: t.routeNote ?? "",
    contentSources: t.contentSources,
    scenes: t.scenes.map((s) => ({
      id: s.id,
      title: s.title,
      image: s.image ?? "",
      thumbnail: s.thumbnail ?? undefined,
      alt: s.alt ?? s.title,
      author: s.author ?? "Không rõ tác giả",
      sourceUrl: s.sourceUrl ?? "",
      license: s.license,
      licenseUrl: s.licenseUrl ?? "",
      width: s.width ?? undefined,
      height: s.height ?? undefined,
      captureDate: s.captureDate ?? undefined,
      description: s.description ?? "",
      hotspots: s.hotspots.map(
        (h): Hotspot =>
          "target" in h
            ? {
                id: h.id,
                x: h.x,
                y: h.y,
                title: h.title,
                text: h.text,
                target: h.target,
                direction: h.direction,
              }
            : {
                id: h.id,
                x: h.x,
                y: h.y,
                title: h.title,
                text: h.text ?? "",
                sourceUrl: h.sourceUrl ?? undefined,
              },
      ),
    })),
    questions: t.questions
      .filter((q): q is TourQuestion & { answer: number } => q.answer !== null)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation ?? "",
        sceneId: q.sceneId ?? undefined,
      })),
  };
}

export function validatePhotoTour(data: PhotoTour, slug: string): PhotoTour {
  const fail = (): never => {
    throw new Error("Dữ liệu tour ảnh chưa hợp lệ.");
  };
  if (
    data.destinationSlug !== slug ||
    !data.scenes.length ||
    !data.questions.length
  )
    fail();
  const ids = new Set(data.scenes.map((s) => s.id));
  if (ids.size !== data.scenes.length || !ids.has(data.startSceneId)) fail();
  for (const scene of data.scenes) {
    if (!scene.image) fail();
    for (const h of scene.hotspots) {
      if (h.x <= 0 || h.x >= 100 || h.y <= 0 || h.y >= 100) fail();
      if (h.target && !ids.has(h.target)) fail();
    }
  }
  for (const q of data.questions) {
    if (q.answer < 0 || q.answer >= q.choices.length) fail();
  }
  return data;
}

const tourCache = new Map<string, Promise<PhotoTour>>();

export function loadTour(slug: string, reload = false): Promise<PhotoTour> {
  if (reload) tourCache.delete(slug);
  if (!tourCache.has(slug)) {
    const request = api.tours
      .forDestination(slug)
      .then((t) => validatePhotoTour(toPhotoTour(t), slug))
      .catch((err: unknown) => {
        tourCache.delete(slug);
        throw err;
      });
    tourCache.set(slug, request);
  }
  return tourCache.get(slug)!;
}

// Tên cũ, giữ để PhotoTour không cần sửa
export const loadLocalTour = loadTour;
