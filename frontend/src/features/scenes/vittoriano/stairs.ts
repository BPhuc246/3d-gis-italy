import * as THREE from "three";
import type { Blocker } from "../../shared/FirstPersonController";

// Vị trí và chiều cao mô hình trong thế giới (đơn vị: m)
export const MODEL = {
  height: 200,
  center: { x: 0, z: -230 },
};

// Kích thước dự phòng khi không tải được vittoriano.glb (đã co về MODEL.height)
export const FALLBACK_SIZE = { x: 388, y: 200, z: 303 };

// Tỷ lệ theo kích thước mô hình. Chỉnh tại đây cho khớp hình thật.
export const STAIR_CONFIG = {
  rotationDeg: 90,
  level1Ratio: 0.08, // độ cao bậc 1 (bục thắp lửa), theo chiều cao mô hình
  flightWidthRatio: 0.06, // bề rộng mỗi cầu thang chính
  gapRatio: 0.04, // khe giữa hai cầu thang chính
  discRatio: 0.1, // kích thước tối thiểu của bục bậc 1
  footRatio: 0.06, // khoảng từ mặt trước mô hình tới chân cầu thang
  mainRunRatio: 0.2, // độ dài cầu thang chính (tăng để bậc thoải hơn)
  clearanceM: 6, // khoảng cách từ mép xa của bục tới mặt tiền mô hình (m)
  shiftBackM: 120, // dịch toàn bộ cầu thang và lư hương về phía sau (m), theo hướng ngược mặt quảng trường
  cornerRadius: 30, // bo góc bục bậc 1 (m)
  mainSteps: 20,
  walkMarginRatio: 0.6,
  eye: 1.65,
} as const;

// Chỉ còn một điểm tham quan: bục bậc 1
export type ZoneId = "balcony";

export const VIEWPOINTS: Record<ZoneId, { title: string; text: string }> = {
  balcony: {
    title: "Bậc 1 · Nơi thắp lửa",
    text: "Bục chữ nhật bo góc ở bậc 1. Ngọn lửa tưởng niệm được thắp ở giữa bục.",
  },
};

export type ModelBox = { min: THREE.Vector3; max: THREE.Vector3 };

// Các khối đi được, tọa độ lưu trong hệ cục bộ (gốc tại tâm mô hình, chưa xoay)
export type Piece =
  | {
      kind: "rect";
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      top: number;
      zone?: ZoneId;
    }
  | {
      kind: "round"; // chữ nhật bo góc
      cx: number;
      cz: number;
      hx: number;
      hz: number;
      r: number;
      top: number;
      zone?: ZoneId;
    };

export type StairPlan = {
  pieces: Piece[];
  origin: { x: number; z: number };
  angle: number;
  center: THREE.Vector3;
  size: THREE.Vector3;
  span: number;
  start: { x: number; z: number };
  flame: THREE.Vector3;
  walkBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  outward: THREE.Vector3;
  lateral: THREE.Vector3;
};

export const noBlockers: Blocker[] = [];

export function fallbackBox(): ModelBox {
  const half = { x: FALLBACK_SIZE.x / 2, z: FALLBACK_SIZE.z / 2 };
  return {
    min: new THREE.Vector3(MODEL.center.x - half.x, 0, MODEL.center.z - half.z),
    max: new THREE.Vector3(
      MODEL.center.x + half.x,
      FALLBACK_SIZE.y,
      MODEL.center.z + half.z,
    ),
  };
}

function localToWorldPoint(
  origin: { x: number; z: number },
  angle: number,
  lx: number,
  lz: number,
) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: origin.x + lx * c + lz * s, z: origin.z - lx * s + lz * c };
}

function worldToLocalPoint(
  origin: { x: number; z: number },
  angle: number,
  x: number,
  z: number,
) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dx = x - origin.x;
  const dz = z - origin.z;
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

function insideLocal(p: Piece, x: number, z: number): boolean {
  if (p.kind === "rect") {
    return x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ;
  }
  const ax = Math.abs(x - p.cx);
  const az = Math.abs(z - p.cz);
  if (ax > p.hx || az > p.hz) return false;
  const qx = ax - (p.hx - p.r);
  const qz = az - (p.hz - p.r);
  if (qx <= 0 || qz <= 0) return true;
  return qx * qx + qz * qz <= p.r * p.r;
}

export function buildStairPlan(box: ModelBox): StairPlan {
  const C = STAIR_CONFIG;
  const size = box.max.clone().sub(box.min);
  const W = size.x;
  const H = size.y;
  const D = size.z;
  const origin = {
    x: (box.min.x + box.max.x) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
  const angle = (C.rotationDeg * Math.PI) / 180;
  // Mặt trước mô hình (cục bộ), lùi về phía sau theo shiftBackM
  const zf = D / 2 - C.shiftBackM;
  const h1 = H * C.level1Ratio;
  const fw = W * C.flightWidthRatio;
  const gap = W * C.gapRatio;
  const R = C.cornerRadius;
  const stairOuter = gap / 2 + fw;

  // Bục bậc 1: đủ rộng để bao trọn hai cầu thang chính
  const A = Math.max(W * C.discRatio, stairOuter + R + 4);
  const B = Math.max(W * C.discRatio, R + fw / 2 + 4);

  const Lr0 = D * C.mainRunRatio;
  // Bục bậc 1 nằm hoàn toàn phía trước mặt tiền, không chui vào thân mô hình
  const zP1F = zf + 2 * B + C.clearanceM; // mép trước bục (phía quảng trường)
  const zc1 = zP1F - B; // tâm bục
  const zFoot = zP1F + Lr0; // chân cầu thang chính, xa hơn về phía quảng trường

  const pieces: Piece[] = [];

  // 1. Bậc 0: hai cầu thang chính đi lên bục. Mỗi bậc nối sâu 1 m để không có khe.
  const dMain = Lr0 / C.mainSteps;
  const rMain = h1 / C.mainSteps;
  for (const s of [-1, 1]) {
    const xc = s * (gap / 2 + fw / 2);
    for (let i = 0; i < C.mainSteps; i++) {
      const near = zFoot - i * dMain;
      const last = i === C.mainSteps - 1;
      pieces.push({
        kind: "rect",
        minX: xc - fw / 2,
        maxX: xc + fw / 2,
        minZ: near - dMain - (last ? 1 : 0),
        maxZ: near,
        top: (i + 1) * rMain,
      });
    }
  }

  // 2. Bậc 1: bục chữ nhật bo góc, đứng được và thắp lửa ở giữa
  pieces.push({
    kind: "round",
    cx: 0,
    cz: zc1,
    hx: A,
    hz: B,
    r: R,
    top: h1,
    zone: "balcony",
  });

  // Điểm đặc biệt (đổi từ cục bộ sang thế giới)
  const start = localToWorldPoint(origin, angle, 0, zf + D * 0.25);
  const flameW = localToWorldPoint(origin, angle, 0, zc1);

  const corners = [
    [-A - 10, zc1 - B - 10],
    [A + 10, zc1 - B - 10],
    [-A - 10, zf + D * 0.5],
    [A + 10, zf + D * 0.5],
  ].map(([x, z]) => localToWorldPoint(origin, angle, x, z));
  const walkBounds = {
    minX: Math.min(...corners.map((p) => p.x)),
    maxX: Math.max(...corners.map((p) => p.x)),
    minZ: Math.min(...corners.map((p) => p.z)),
    maxZ: Math.max(...corners.map((p) => p.z)),
  };

  const outward = new THREE.Vector3(
    start.x - origin.x,
    0,
    start.z - origin.z,
  ).normalize();
  const lateral = new THREE.Vector3(-outward.z, 0, outward.x);

  return {
    pieces,
    origin,
    angle,
    center: new THREE.Vector3(origin.x, 0, origin.z),
    size,
    span: Math.max(W, D),
    start,
    flame: new THREE.Vector3(flameW.x, h1, flameW.z),
    walkBounds,
    outward,
    lateral,
  };
}

// Độ cao mặt sàn tại (x, z) thế giới: mặt cao nhất của các khối đang đứng trên
export function floorAtPlan(plan: StairPlan, x: number, z: number): number {
  const l = worldToLocalPoint(plan.origin, plan.angle, x, z);
  let y = 0;
  for (const p of plan.pieces) {
    if (p.top > y && insideLocal(p, l.x, l.z)) y = p.top;
  }
  return y;
}

export function zoneAtPlan(
  plan: StairPlan,
  x: number,
  z: number,
): ZoneId | null {
  const l = worldToLocalPoint(plan.origin, plan.angle, x, z);
  for (const p of plan.pieces) {
    if (p.zone && insideLocal(p, l.x, l.z)) return p.zone;
  }
  return null;
}

// Đường bao chữ nhật bo góc trong mặt phẳng (x, -z), để sau khi xoay thì đúng hướng
function roundRectPoints(
  p: Extract<Piece, { kind: "round" }>,
): THREE.Vector2[] {
  const N = 10;
  const corners = [
    { cx: p.cx + p.hx - p.r, cz: p.cz + p.hz - p.r, a0: 0 },
    { cx: p.cx - p.hx + p.r, cz: p.cz + p.hz - p.r, a0: Math.PI / 2 },
    { cx: p.cx - p.hx + p.r, cz: p.cz - p.hz + p.r, a0: Math.PI },
    { cx: p.cx + p.hx - p.r, cz: p.cz - p.hz + p.r, a0: (3 * Math.PI) / 2 },
  ];
  const pts: THREE.Vector2[] = [];
  for (const c of corners) {
    for (let i = 0; i <= N; i++) {
      const a = c.a0 + ((Math.PI / 2) * i) / N;
      pts.push(
        new THREE.Vector2(
          c.cx + p.r * Math.cos(a),
          -(c.cz + p.r * Math.sin(a)),
        ),
      );
    }
  }
  return pts;
}

function extrudeMesh(
  pts: THREE.Vector2[],
  top: number,
  material: THREE.Material,
): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth: top,
    bevelEnabled: false,
  });
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

// Dựng mesh: một group đặt tại tâm mô hình và xoay cùng góc với plan
export function buildStairMeshes(
  plan: StairPlan,
  material: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(plan.origin.x, 0, plan.origin.z);
  group.rotation.y = plan.angle;

  for (const p of plan.pieces) {
    let mesh: THREE.Mesh;
    if (p.kind === "rect") {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(p.maxX - p.minX, p.top, p.maxZ - p.minZ),
        material,
      );
      mesh.position.set(
        (p.minX + p.maxX) / 2,
        p.top / 2,
        (p.minZ + p.maxZ) / 2,
      );
    } else {
      mesh = extrudeMesh(roundRectPoints(p), p.top, material);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
