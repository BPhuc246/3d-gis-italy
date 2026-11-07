import type { RegionDetail } from './api';

export type PlaceStory = {
  eyebrow: string;
  subtitle: string;
  era: string;
  color: string;
  description: string;
  facts: { label: string; value: string }[];
  sourceUrl: string;
};

// Short paraphrases from the user's supplied research, not copied source passages.
export const stories: Record<string, PlaceStory> = {
  colosseum: {
    eyebrow: '01 / ĐẤU TRƯỜNG', subtitle: 'Colosseo · Anfiteatro Flavio', era: 'Năm 70 – 80 SCN', color: '#bc704c',
    description: 'Đấu trường Flavian (Colosseum) là kiệt tác vĩ đại nhất của kỹ thuật xây dựng La Mã cổ đại. Với quy mô 4 tầng vòm đá travertine, hệ thống 80 cửa thoát hiểm vomitoria và mê cung hầm ngầm Hypogeum tinh vi, nơi đây từng tổ chức các trận quyết chiến giác đấu và đại hội kịch tính cho hơn 50.000 khán giả.',
    facts: [
      { label: 'Khánh thành', value: 'Năm 80 SCN (Titus)' },
      { label: 'Quy mô', value: 'Dài 189m · Rộng 156m · Cao 48m' },
      { label: 'Sức chứa', value: '50.000 – 70.000 khán giả' },
      { label: 'Điểm nổi bật', value: 'Tầng vòm đá & Hầm ngầm Hypogeum' }
    ],
    sourceUrl: 'https://www.turismoroma.it/en/places/flavian-amphitheatre-colosseum',
  },
  'arch-of-constantine': {
    eyebrow: '02 / KHẢI HOÀN MÔN', subtitle: 'Arco di Costantino · Via Triumphalis', era: 'Năm 315 SCN', color: '#b49b62',
    description: 'Khải hoàn môn lớn nhất thế giới La Mã còn tồn tại nguyên vẹn, dựng năm 315 SCN để vinh danh chiến thắng Cầu Milvian của Hoàng đế Constantine I. Công trình nổi bật với ba lối vòm đá cẩm thạch trắng cân xứng cùng các bức phù điêu đỉnh cao được kế thừa từ thời các minh quân Trajan, Hadrian và Marcus Aurelius.',
    facts: [
      { label: 'Khánh thành', value: 'Năm 315 SCN (Constantine I)' },
      { label: 'Kích thước', value: 'Cao 21m · Rộng 25.9m · Sâu 7.4m' },
      { label: 'Vật liệu', value: 'Đá cẩm thạch trắng & Cột Numidian vàng' },
      { label: 'Điểm nổi bật', value: 'Ba cổng vòm, Tượng Dacia & Phù điêu Spolia' }
    ],
    sourceUrl: 'https://www.turismoroma.it/en/places/arch-costantine',
  },
  pantheon: {
    eyebrow: '03 / ĐỀN THẦN LA MÃ', subtitle: 'Pantheon · Piazza della Rotonda', era: 'Năm 125 SCN', color: '#748778',
    description: 'Ngôi đền cổ đại được bảo tồn hoàn hảo nhất thế giới, tái thiết dưới triều Hoàng đế Hadrian. Không gian kết hợp tiền sảnh 16 cột đá hoa cương Ai Cập nguyên khối nặng 60 tấn với đại sảnh tròn Rotunda dưới mái vòm bê tông không cốt thép lớn nhất thế giới suốt 2.000 năm, được thắp sáng huyền diệu bởi "Con mắt của Rome" – lỗ mở Oculus 9m.',
    facts: [
      { label: 'Niên đại', value: 'Khoảng năm 125 SCN (Hadrian)' },
      { label: 'Mái vòm', value: 'Bê tông không cốt thép (Đường kính 43.3m)' },
      { label: 'Lỗ mở Oculus', value: 'Đường kính 9m mở lên bầu trời' },
      { label: 'Điểm nổi bật', value: 'Không gian hình cầu & Nơi an nghỉ của Raphael' }
    ],
    sourceUrl: 'https://www.turismoroma.it/en/places/pantheon',
  },
};

export function searchKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

export const localDemoAvailable = import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO !== 'false';
// Local photo fixtures are independent of the selected POI/account data source.

export async function loadLocalRegion(): Promise<RegionDetail> {
  const response = await fetch('/_local/region.json');
  if (!response.ok) throw new Error('Chưa có dữ liệu thử. Kiểm tra thư mục _local theo HUONG_DAN.md.');
  return response.json();
}

export const PHOTO_TOUR_SLUGS = ['colosseum', 'arch-of-constantine', 'pantheon'] as const;
export type NavigationDirection = 'left' | 'right' | 'forward' | 'up' | 'down' | 'return' | 'view';
export type Hotspot = { id: string; x: number; y: number; title: string; text: string; target?: string; direction?: NavigationDirection; sourceUrl?: string };
export type PhotoScene = {
  id: string; title: string; image: string; thumbnail?: string; alt: string;
  author: string; sourceUrl: string; license: string; licenseUrl: string;
  width?: number; height?: number; captureDate?: string; description: string; hotspots: Hotspot[];
};
export type TourQuestion = { id: string; prompt: string; choices: string[]; answer: number; explanation: string; sceneId?: string };
export type PhotoTour = {
  id: string; version: number; destinationSlug: string; destinationName: string; title: string;
  startSceneId: string; routeNote: string;
  contentSources: { title: string; url: string }[];
  scenes: PhotoScene[]; questions: TourQuestion[];
};

export function validatePhotoTour(value: unknown, slug: string): PhotoTour {
  const data = value as PhotoTour;
  const invalid = () => { throw new Error('Dữ liệu tour ảnh chưa sẵn sàng hoặc có liên kết cảnh không hợp lệ.'); };
  if (!data || data.destinationSlug !== slug || !data.id || !Number.isInteger(data.version) || !Array.isArray(data.scenes) || !data.scenes.length || !Array.isArray(data.questions) || !data.questions.length) return invalid();
  if (typeof data.destinationName !== 'string' || typeof data.title !== 'string' || !Array.isArray(data.contentSources) || !data.scenes.every(scene => scene && typeof scene.id === 'string')) return invalid();
  const ids = new Set(data.scenes.map(scene => scene.id));
  if (ids.size !== data.scenes.length || !ids.has(data.startSceneId)) return invalid();
  const hotspotIds = new Set<string>();
  for (const scene of data.scenes) {
    if (!scene.id || !scene.image || !Array.isArray(scene.hotspots) || !scene.author || !scene.licenseUrl || !scene.sourceUrl) return invalid();
    for (const h of scene.hotspots) {
      if (!h.id || hotspotIds.has(h.id) || !h.title || !Number.isFinite(h.x) || !Number.isFinite(h.y) || h.x <= 0 || h.x >= 100 || h.y <= 0 || h.y >= 100) return invalid();
      hotspotIds.add(h.id);
      if (h.target) {
        if (!['left', 'right', 'forward', 'up', 'down', 'return', 'view'].includes(h.direction ?? '')) return invalid();
        const target = data.scenes.find(s => s.id === h.target);
        if (!target || target.id === scene.id || !Array.isArray(target.hotspots) || !target.hotspots.some(back => back.target === scene.id)) return invalid();
      }
    }
  }
  const visited = new Set<string>();
  const pending = [data.startSceneId];
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    data.scenes.find(scene => scene.id === id)!.hotspots.forEach(h => { if (h.target && !visited.has(h.target)) pending.push(h.target); });
  }
  if (visited.size !== ids.size) return invalid();
  const questionIds = new Set<string>();
  for (const q of data.questions) {
    if (!q.id || questionIds.has(q.id) || !Array.isArray(q.choices) || q.choices.length < 2 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length || (q.sceneId && !ids.has(q.sceneId))) return invalid();
    questionIds.add(q.id);
  }
  return data;
}

const tourCache = new Map<string, Promise<PhotoTour>>();
export async function loadLocalTour(slug = 'colosseum', reload = false): Promise<PhotoTour> {
  if (!(PHOTO_TOUR_SLUGS as readonly string[]).includes(slug)) throw new Error('Địa điểm này chưa có tour ảnh.');
  const base = import.meta.env.VITE_PHOTO_TOUR_BASE_URL;
  const legacy = import.meta.env.VITE_PHOTO_TOUR_URL;
  const url = base ? `${base.replace(/\/$/, '')}/${slug}-tour.json`
    : legacy && (slug === 'colosseum' || legacy.includes('{slug}')) ? legacy.replace('{slug}', slug)
    : `/_local/${slug}-tour.json`;
  const key = `${slug}:${url}`;
  if (reload) tourCache.delete(key);
  if (!tourCache.has(key)) {
    const request = fetch(url).then(async response => {
      if (!response.ok) throw new Error('Không tải được tour ảnh. Hãy thử lại.');
      return validatePhotoTour(await response.json(), slug);
    }).catch(error => { tourCache.delete(key); throw error; });
    tourCache.set(key, request);
  }
  return tourCache.get(key)!;
}
