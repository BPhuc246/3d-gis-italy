export type LonLat = [number, number];

export type RouteStopInput = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  stayMinutes?: number | null;
};

export type RouteLegGeometry = {
  fromSlug: string;
  toSlug: string;
  fromName: string;
  toName: string;
  rawPath: LonLat[];
  smoothPath: LonLat[];
  distanceMeters: number;
  walkingMinutes: number;
  streetNames: string[];
};

export type ComputedRouteGeometry = {
  legs: RouteLegGeometry[];
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalWalkingMinutes: number;
  totalStayMinutes: number;
  totalEstimatedMinutes: number;
  combinedPath: LonLat[];
};

const EARTH_RADIUS_M = 6371000;
// Tốc độ đi bộ trung bình khi tham quan di sản (~4.5 km/h = 75 m/phút)
const WALKING_METERS_PER_MIN = 75;

/** Tính khoảng cách mặt cầu (mét) giữa hai tọa độ [lon, lat]. */
export function haversineMeters(a: LonLat, b: LonLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Tính tổng chiều dài một chuỗi tọa độ (mét). */
export function pathDistanceMeters(path: LonLat[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineMeters(path[i - 1], path[i]);
  }
  return total;
}

/**
 * Thuật toán Chaikin's Corner Cutting nhẹ để làm mềm đường gấp khúc
 * trong khi vẫn giữ nguyên các điểm mốc và không lấn vào ranh giới nhà phố.
 */
export function chaikinSmooth(points: LonLat[], iterations = 1): LonLat[] {
  if (points.length < 3 || iterations <= 0) return points.slice();
  let current = points.slice();
  for (let iter = 0; iter < iterations; iter++) {
    const next: LonLat[] = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      if (i > 0) {
        next.push([0.85 * p0[0] + 0.15 * p1[0], 0.85 * p0[1] + 0.15 * p1[1]]);
      }
      if (i < current.length - 2) {
        next.push([0.15 * p0[0] + 0.85 * p1[0], 0.15 * p0[1] + 0.85 * p1[1]]);
      }
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

// Tọa độ điểm đón khách / cổng vào thực tế ngoài quảng trường và lòng đường
// (Nằm hoàn toàn ngoài chu vi mô hình 3D, sát vỉa hè và quảng trường mở như Google Maps)
export const LANDMARK_ENTRANCES: Record<string, LonLat> = {
  colosseum: [12.49120, 41.89050], // Cổng phía Tây ngoài Quảng trường Colosseo
  'arch-of-constantine': [12.49036, 41.88980], // Mặt tiền phía Bắc Khải hoàn môn Constantine (Via Triumphalis)
  vittoriano: [12.48300, 41.89555], // Bậc thềm chính Altare della Patria tại Quảng trường Venezia
  pantheon: [12.47691, 41.89920], // Quảng trường ngoài trời Piazza della Rotonda trước hàng cột hiên Đền Pantheon
};

type CorridorEdge = {
  from: string;
  to: string;
  street: string;
  // Dãy tọa độ tim đường thực tế theo đúng bản đồ giao thông đường bộ Roma
  path: LonLat[];
};

// Mạng lưới các đoạn đường đi bộ thực tế tại trung tâm Roma (High-Definition Pedestrian Street Network)
// Toàn bộ các điểm đều nằm chính xác trên tim đường nhựa, vỉa hè hoặc quảng trường đi bộ mở,
// hoàn toàn không cắt ngang qua bất kỳ khối nhà phố hay công trình cổ nào.
const CORRIDOR_EDGES: CorridorEdge[] = [
  // 1. Từ cổng đón khách phía Tây Colosseum ra ngã tư giao thông đi bộ Piazza del Colosseo (đường chéo tự nhiên qua sân đá)
  {
    from: 'colosseum',
    to: 'colosseo_hub',
    street: 'Quảng trường Colosseo',
    path: [
      [12.49120, 41.89050],
      [12.49095, 41.89055],
      [12.49072, 41.89058],
    ],
  },

  // 2. Từ ngã tư đi bộ Colosseo đến Khải hoàn môn Constantine (theo hành lang đá lát mở ven đấu trường)
  {
    from: 'colosseo_hub',
    to: 'arch-of-constantine',
    street: 'Piazza del Colosseo',
    path: [
      [12.49072, 41.89058],
      [12.49051, 41.89019],
      [12.49038, 41.88995],
      [12.49036, 41.88980],
    ],
  },

  // 3. Từ ngã tư Colosseo rẽ mượt theo cung đường Piazza del Colosseo vào đầu Đại lộ Via dei Fori Imperiali
  {
    from: 'colosseo_hub',
    to: 'fori_entry',
    street: 'Piazza del Colosseo',
    path: [
      [12.49072, 41.89058],
      [12.49083, 41.89084],
      [12.49092, 41.89104],
      [12.49095, 41.89112],
      [12.49100, 41.89122],
      [12.49086, 41.89130],
    ],
  },

  // 4. Suốt chiều dài Đại lộ Via dei Fori Imperiali từ Colosseum đến Quảng trường Venezia
  // Bám sát 100% tim lòng đường nhựa theo chuẩn OpenStreetMap (highway=service/tertiary)
  // Khúc cua tiếp cận Quảng trường Venezia lượn vòng cung mềm mại, tự nhiên giữa dải đường
  {
    from: 'fori_entry',
    to: 'venezia_promenade',
    street: 'Đại lộ Via dei Fori Imperiali',
    path: [
      [12.49086, 41.89130],
      [12.49071, 41.89133],
      [12.49052, 41.89137],
      [12.49039, 41.89141],
      [12.48891, 41.89226],
      [12.48853, 41.89253],
      [12.48838, 41.89261],
      [12.48804, 41.89280],
      [12.48776, 41.89295],
      [12.48761, 41.89303],
      [12.48750, 41.89310],
      [12.48734, 41.89319],
      [12.48700, 41.89340],
      [12.48632, 41.89373],
      [12.48605, 41.89388],
      [12.48570, 41.89408],
      [12.48475, 41.89460],
      [12.48433, 41.89483],
      [12.48413, 41.89494],
      [12.48404, 41.89499],
      [12.48395, 41.89505],
      [12.48383, 41.89518],
      [12.48370, 41.89531],
      [12.48355, 41.89542],
      [12.48335, 41.89550],
      [12.48315, 41.89554],
      [12.48300, 41.89555],
    ],
  },

  // 5. Hành lang đi bộ Quảng trường Venezia tiếp cận bậc thềm chính Vittoriano (Altare della Patria)
  {
    from: 'venezia_promenade',
    to: 'vittoriano',
    street: 'Quảng trường Venezia',
    path: [
      [12.48300, 41.89555],
    ],
  },

  // 6. Đi bộ qua Quảng trường Venezia vòng qua phía Tây (trước Palazzo Venezia & Palazzo Bonaparte) sang đầu phố Via del Plebiscito
  // Khúc cua lượn góc tròn tự nhiên theo lòng đường, không gấp khúc, không va chạm Metro C
  {
    from: 'venezia_promenade',
    to: 'plebiscito_entry',
    street: 'Quảng trường Venezia',
    path: [
      [12.48300, 41.89555],
      [12.48280, 41.89555],
      [12.48260, 41.89555],
      [12.48242, 41.89560],
      [12.48228, 41.89572],
      [12.48218, 41.89590],
      [12.48208, 41.89615],
      [12.48198, 41.89640],
      [12.48188, 41.89656],
      [12.48176, 41.89657],
    ],
  },

  // 7. Từ bậc thềm Vittoriano vòng qua phía Tây Quảng trường Venezia sang đầu phố Via del Plebiscito
  {
    from: 'vittoriano',
    to: 'plebiscito_entry',
    street: 'Quảng trường Venezia',
    path: [
      [12.48300, 41.89555],
      [12.48280, 41.89555],
      [12.48260, 41.89555],
      [12.48242, 41.89560],
      [12.48228, 41.89572],
      [12.48218, 41.89590],
      [12.48208, 41.89615],
      [12.48198, 41.89640],
      [12.48188, 41.89656],
      [12.48176, 41.89657],
    ],
  },

  // 8. Trục phố lịch sử Via del Plebiscito (từ Quảng trường Venezia qua Palazzo Grazioli tới góc phố Via dei Cestari)
  // Bám sát 100% tim đường Via del Plebiscito theo chuẩn OpenStreetMap
  {
    from: 'plebiscito_entry',
    to: 'cestari_corner',
    street: 'Via del Plebiscito',
    path: [
      [12.48176, 41.89657],
      [12.48036, 41.89629],
      [12.47995, 41.89618],
      [12.47959, 41.89609],
      [12.47928, 41.89602],
      [12.47881, 41.89598],
      [12.47848, 41.89596],
      [12.47781, 41.89595],
      [12.47742, 41.89594],
    ],
  },

  // 9. Tuyến phố đi bộ thẳng Via dei Cestari dẫn thẳng về phía Bắc tới Quảng trường Minerva
  {
    from: 'cestari_corner',
    to: 'minerva',
    street: 'Via dei Cestari',
    path: [
      [12.47742, 41.89594],
      [12.47739, 41.89640],
      [12.47736, 41.89688],
      [12.47735, 41.89727],
      [12.47733, 41.89767],
      [12.47727, 41.89816],
    ],
  },

  // 10. Từ Quảng trường Minerva qua Via della Minerva tiến vào Piazza della Rotonda trước cổng Đền Pantheon
  {
    from: 'minerva',
    to: 'pantheon',
    street: 'Via della Minerva & Piazza della Rotonda',
    path: [
      [12.47727, 41.89816],
      [12.47732, 41.89823],
      [12.47723, 41.89888],
      [12.47720, 41.89901],
      [12.47704, 41.89915],
      [12.47691, 41.89920],
    ],
  },
];

type AdjacencyItem = {
  to: string;
  weight: number;
  street: string;
  path: LonLat[];
};

const GRAPH: Map<string, AdjacencyItem[]> = (() => {
  const map = new Map<string, AdjacencyItem[]>();
  const add = (from: string, to: string, street: string, path: LonLat[]) => {
    const list = map.get(from) ?? [];
    const weight = pathDistanceMeters(path);
    list.push({ to, weight, street, path });
    map.set(from, list);
  };
  for (const edge of CORRIDOR_EDGES) {
    add(edge.from, edge.to, edge.street, edge.path);
    // Đoạn đường hai chiều: khi đi ngược lại thì đảo ngược mảng tọa độ
    const reversedPath = edge.path.slice().reverse();
    add(edge.to, edge.from, edge.street, reversedPath);
  }
  return map;
})();

const ALL_NODES = new Set<string>();
for (const e of CORRIDOR_EDGES) {
  ALL_NODES.add(e.from);
  ALL_NODES.add(e.to);
}

const STOP_SLUGS = new Set(['colosseum', 'arch-of-constantine', 'vittoriano', 'pantheon']);

/**
 * Tìm đường đi bộ chuẩn xác theo mạng lưới phố cổ Roma bằng giải thuật Dijkstra.
 * Đường đi nối trực tiếp qua các đoạn tim đường, không cắt qua bất kỳ khối nhà nào.
 */
export function solveLegPath(from: RouteStopInput, to: RouteStopInput): RouteLegGeometry {
  const startId = from.slug;
  const endId = to.slug;

  if (startId === endId) {
    const pt: LonLat = LANDMARK_ENTRANCES[startId] ?? [from.longitude, from.latitude];
    return {
      fromSlug: from.slug,
      toSlug: to.slug,
      fromName: from.name,
      toName: to.name,
      rawPath: [pt],
      smoothPath: [pt],
      distanceMeters: 0,
      walkingMinutes: 0,
      streetNames: [],
    };
  }

  if (ALL_NODES.has(startId) && ALL_NODES.has(endId)) {
    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; street: string; path: LonLat[] }>();
    const unvisited = new Set<string>(ALL_NODES);

    for (const id of ALL_NODES) dist.set(id, Infinity);
    dist.set(startId, 0);

    while (unvisited.size > 0) {
      let current: string | null = null;
      let best = Infinity;
      for (const id of unvisited) {
        const d = dist.get(id) ?? Infinity;
        if (d < best) {
          best = d;
          current = id;
        }
      }
      if (!current || best === Infinity || current === endId) break;
      unvisited.delete(current);

      const neighbors = GRAPH.get(current) ?? [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;
        // Không đi xuyên qua điểm đón của một công trình di sản trung gian khác khi đang đi thẳng
        if (STOP_SLUGS.has(edge.to) && edge.to !== endId) continue;
        const alt = best + edge.weight;
        if (alt < (dist.get(edge.to) ?? Infinity)) {
          dist.set(edge.to, alt);
          prev.set(edge.to, { node: current, street: edge.street, path: edge.path });
        }
      }
    }

    if (prev.has(endId)) {
      const segments: { street: string; path: LonLat[] }[] = [];
      let cur: string | undefined = endId;
      while (cur && cur !== startId) {
        const step = prev.get(cur);
        if (!step) break;
        segments.push({ street: step.street, path: step.path });
        cur = step.node;
      }
      segments.reverse();

      const assembledPath: LonLat[] = [];
      const streetNames: string[] = [];
      for (let sIdx = 0; sIdx < segments.length; sIdx++) {
        const seg = segments[sIdx];
        if (!streetNames.includes(seg.street)) streetNames.push(seg.street);
        for (let pIdx = 0; pIdx < seg.path.length; pIdx++) {
          if (sIdx > 0 && pIdx === 0) continue; // Tránh trùng điểm nối giữa 2 đoạn
          assembledPath.push(seg.path[pIdx]);
        }
      }

      // Đường đi thực tế đã có mật độ điểm cao bám sát từng góc phố,
      // dùng trực tiếp assembledPath để tránh hiện tượng xén góc đâm vào tòa nhà ở các góc phố
      const smoothPath = assembledPath;
      const distanceMeters = Math.round(pathDistanceMeters(smoothPath));
      const walkingMinutes = Math.max(1, Math.round(distanceMeters / WALKING_METERS_PER_MIN));

      return {
        fromSlug: from.slug,
        toSlug: to.slug,
        fromName: from.name,
        toName: to.name,
        rawPath: assembledPath,
        smoothPath,
        distanceMeters,
        walkingMinutes,
        streetNames,
      };
    }
  }

  // Fallback an toàn cho điểm tọa độ tùy ý
  const pA: LonLat = LANDMARK_ENTRANCES[from.slug] ?? [from.longitude, from.latitude];
  const pB: LonLat = LANDMARK_ENTRANCES[to.slug] ?? [to.longitude, to.latitude];
  const distanceMeters = Math.round(haversineMeters(pA, pB));
  return {
    fromSlug: from.slug,
    toSlug: to.slug,
    fromName: from.name,
    toName: to.name,
    rawPath: [pA, pB],
    smoothPath: [pA, pB],
    distanceMeters,
    walkingMinutes: Math.max(1, Math.round(distanceMeters / WALKING_METERS_PER_MIN)),
    streetNames: ['Lộ trình kết nối trực tiếp'],
  };
}

/** Tính toán đầy đủ hình học, khoảng cách và thời gian cho một tuyến gồm nhiều điểm dừng. */
export function buildRouteGeometry(stops: RouteStopInput[]): ComputedRouteGeometry {
  const legs: RouteLegGeometry[] = [];
  const combinedPath: LonLat[] = [];
  let totalDistanceMeters = 0;
  let totalWalkingMinutes = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const leg = solveLegPath(stops[i], stops[i + 1]);
    legs.push(leg);
    totalDistanceMeters += leg.distanceMeters;
    totalWalkingMinutes += leg.walkingMinutes;
    for (let j = 0; j < leg.smoothPath.length; j++) {
      if (i > 0 && j === 0) continue;
      combinedPath.push(leg.smoothPath[j]);
    }
  }

  const totalStayMinutes = stops.reduce((acc, s) => acc + (Number(s.stayMinutes) || 0), 0);
  return {
    legs,
    totalDistanceMeters,
    totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(2)),
    totalWalkingMinutes,
    totalStayMinutes,
    totalEstimatedMinutes: totalWalkingMinutes + totalStayMinutes,
    combinedPath,
  };
}

/**
 * Sắp xếp lại danh sách điểm dừng (giữ điểm đầu tiên làm điểm xuất phát)
 * theo thứ tự đi bộ ngắn nhất bằng thuật toán tham lam (Nearest Neighbor).
 */
export function optimizeStopOrder<T extends RouteStopInput>(stops: T[]): T[] {
  if (stops.length <= 2) return stops.slice();
  const remaining = stops.slice(1);
  const ordered: T[] = [stops[0]];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const leg = solveLegPath(last, remaining[i]);
      if (leg.distanceMeters < bestDist) {
        bestDist = leg.distanceMeters;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function getLandmarkEntrance(slug: string): LonLat | null {
  return LANDMARK_ENTRANCES[slug] ?? null;
}
