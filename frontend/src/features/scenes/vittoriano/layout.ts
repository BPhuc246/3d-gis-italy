import type { Blocker } from "../../shared/FirstPersonController";

// Kích thước khu vực đi lên (mét), tính trong hệ tọa độ cục bộ của khu vực
export const LAYOUT = {
  halfWidth: 10.5, // lối đi: x trong [-halfWidth, halfWidth]
  startZ: 32, // điểm bắt đầu ở quảng trường
  lowestZ: -23.5, // mép sau sân thượng

  lowStairStartZ: 30, // mép dưới bậc thang thấp
  lowSteps: 14,
  lowStepDepth: 1.2,
  lowStepRise: 0.5,

  midMinZ: -4, // sân giữa / ban công
  midMaxZ: 13.2,
  midTop: 7,

  upperSteps: 10,
  upperStepDepth: 1,
  upperStepRise: 0.5,

  roofMinZ: -24, // sân thượng
  roofMaxZ: -14,
  roofTop: 12,

  tomb: { minX: -2.5, maxX: 2.5, minZ: -20.5, maxZ: -17.5, height: 1.2 },
  flameZ: -19, // ngọn lửa đặt trên mộ

  balconyZone: { minZ: 2, maxZ: 6 },
  roofZone: { minZ: -22, maxZ: -16 },

  // Mô hình GLB: tâm đặt tại (glbOffset.x, glbOffset.z) × glbScale
  glbHeight: 40,
  glbOffset: { x: 0, y: 0, z: -44 },
  glbScale: 5,

  flameRotationY: Math.PI,
} as const;

// Khu vực đi lên đặt tại tâm của mô hình GLB, nâng 0 m (mặt đất)
const ASCENT_POSITION = { x: 100, z: 0 };

export const ASCENT = {
  rotationY: Math.PI / 2,
  scale: 5,
  offsetX: ASCENT_POSITION.x,
  offsetZ: ASCENT_POSITION.z,
  lift: 0,
} as const;

export const COLUMNS = [-8, -4, 4, 8].map((x) => ({ x, z: -22.5, r: 0.7 }));

// Vật cản trong hệ tọa độ cục bộ
export const BLOCKERS: Blocker[] = [
  {
    kind: "box",
    minX: LAYOUT.tomb.minX,
    maxX: LAYOUT.tomb.maxX,
    minZ: LAYOUT.tomb.minZ,
    maxZ: LAYOUT.tomb.maxZ,
  },
  ...COLUMNS.map((c) => ({
    kind: "circle" as const,
    x: c.x,
    z: c.z,
    radius: c.r,
  })),
];

// Độ cao mặt sàn theo z cục bộ (bậc thang là các bậc rời nhau, đứng trên được)
export function floorAt(z: number): number {
  const L = LAYOUT;
  if (z > L.midMaxZ) {
    const k = Math.floor((L.lowStairStartZ - z) / L.lowStepDepth);
    if (k < 0) return 0;
    return (Math.min(k, L.lowSteps - 1) + 1) * L.lowStepRise;
  }
  if (z >= L.midMinZ) return L.midTop;
  if (z > L.roofMaxZ) {
    const k = Math.floor((L.midMinZ - z) / L.upperStepDepth);
    return L.midTop + (Math.min(k, L.upperSteps - 1) + 1) * L.upperStepRise;
  }
  return L.roofTop;
}

export type ViewpointId = "balcony" | "rooftop";

export const VIEWPOINTS: Record<ViewpointId, { title: string; text: string }> =
  {
    balcony: {
      title: "Ban công giữa",
      text: "Từ ban công này, bạn nhìn rõ mặt đứng với các cột Corinthian và hàng tượng trên lan can, đồng thời thấy quảng trường Piazza Venezia phía dưới.",
    },
    rooftop: {
      title: "Sân thượng",
      text: "Sân thượng là nơi đặt Mộ Chiến sĩ Vô danh và hai cỗ xe tứ mã. Từ đây có tầm nhìn bao quát khu trung tâm Roma.",
    },
  };

export function zoneAt(z: number): ViewpointId | null {
  const { balconyZone, roofZone } = LAYOUT;
  if (z >= balconyZone.minZ && z <= balconyZone.maxZ) return "balcony";
  if (z >= roofZone.minZ && z <= roofZone.maxZ) return "rooftop";
  return null;
}

// ---- Chuyển đổi tọa độ: cục bộ <-> thế giới ----
// Thứ tự trong group: scale, xoay quanh Y, rồi dịch chuyển

const COS = Math.cos(ASCENT.rotationY);
const SIN = Math.sin(ASCENT.rotationY);

export function localToWorld(x: number, z: number) {
  const u = x * COS + z * SIN;
  const v = -x * SIN + z * COS;
  return {
    x: ASCENT.offsetX + ASCENT.scale * u,
    z: ASCENT.offsetZ + ASCENT.scale * v,
  };
}

export function worldToLocal(x: number, z: number) {
  const u = (x - ASCENT.offsetX) / ASCENT.scale;
  const v = (z - ASCENT.offsetZ) / ASCENT.scale;
  return {
    x: u * COS - v * SIN,
    z: u * SIN + v * COS,
  };
}

// Mặt sàn trong thế giới: độ cao cục bộ được scale, cộng với độ nâng
export function worldFloorAt(x: number, z: number): number {
  return ASCENT.lift + ASCENT.scale * floorAt(worldToLocal(x, z).z);
}

export function zoneAtWorld(x: number, z: number): ViewpointId | null {
  return zoneAt(worldToLocal(x, z).z);
}

// Hộp giới hạn đi bộ trong thế giới (AABB của hình chữ nhật đã xoay và scale)
export function worldWalkBounds() {
  const L = LAYOUT;
  const corners = [
    [-L.halfWidth, L.lowestZ],
    [L.halfWidth, L.lowestZ],
    [-L.halfWidth, L.startZ],
    [L.halfWidth, L.startZ],
  ].map(([x, z]) => localToWorld(x, z));
  return {
    minX: Math.min(...corners.map((p) => p.x)),
    maxX: Math.max(...corners.map((p) => p.x)),
    minZ: Math.min(...corners.map((p) => p.z)),
    maxZ: Math.max(...corners.map((p) => p.z)),
  };
}

// Vật cản trong thế giới
export function worldBlockers(): Blocker[] {
  return BLOCKERS.map((b): Blocker => {
    if (b.kind === "circle") {
      const p = localToWorld(b.x, b.z);
      return {
        kind: "circle",
        x: p.x,
        z: p.z,
        radius: b.radius * ASCENT.scale,
      };
    }
    const corners = [
      [b.minX, b.minZ],
      [b.maxX, b.minZ],
      [b.minX, b.maxZ],
      [b.maxX, b.maxZ],
    ].map(([x, z]) => localToWorld(x, z));
    return {
      kind: "box",
      minX: Math.min(...corners.map((p) => p.x)),
      maxX: Math.max(...corners.map((p) => p.x)),
      minZ: Math.min(...corners.map((p) => p.z)),
      maxZ: Math.max(...corners.map((p) => p.z)),
    };
  });
}
