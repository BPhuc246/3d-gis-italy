import * as THREE from "three";

export type Pose = "stand" | "stance" | "bow" | "kneel" | "pray";
export type FigureOptions = {
  shield?: boolean;
  sword?: boolean;
  skin?: string;
};

type Joints = {
  rootY: number;
  hipX: number;
  headX: number;
  armLX: number;
  armLZ: number;
  armRX: number;
  armRZ: number;
  legLX: number;
  legRX: number;
};

const STAND_HEIGHT = 0.95; // chiều cao hông khi đứng
const LEG_LENGTH = 0.95; // chiều dài chân từ hông xuống đất

const REST: Joints = {
  rootY: STAND_HEIGHT,
  hipX: 0,
  headX: 0,
  armLX: 0.06,
  armLZ: 0.14,
  armRX: 0.06,
  armRZ: -0.14,
  legLX: 0,
  legRX: 0,
};
const KNEEL: Partial<Joints> = {
  rootY: 0.55,
  legLX: -1.45,
  legRX: -1.45,
  hipX: 0.12,
};
const POSES: Record<Pose, Partial<Joints>> = {
  stand: {},
  stance: {
    legLX: -0.42,
    legRX: 0.36,
    hipX: 0.12,
    headX: -0.06,
    armLX: -1.0,
    armLZ: 0.32,
    armRX: -0.55,
    armRZ: -0.38,
  },
  bow: {
    hipX: 0.72,
    headX: 0.32,
    armLX: 0.25,
    armRX: 0.25,
    armLZ: 0.12,
    armRZ: -0.12,
  },
  kneel: KNEEL,
  pray: {
    ...KNEEL,
    hipX: 0.38,
    headX: 0.5,
    armLX: -1.55,
    armRX: -1.55,
    armLZ: 0.1,
    armRZ: -0.1,
  },
};

// Nhân vật hình học có khớp: đổi tư thế mượt, không cần file mô hình
export function createFigure(clothColor: string, options: FigureOptions = {}) {
  const { shield = false, sword = true, skin = "#c89f7a" } = options;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skin,
    roughness: 0.6,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.85,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: "#4a3323",
    roughness: 0.8,
  });
  const sandalMat = new THREE.MeshStandardMaterial({
    color: "#5c4030",
    roughness: 0.9,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: "#c3c6cc",
    roughness: 0.3,
    metalness: 0.8,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: "#6b4a2e",
    roughness: 0.9,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: "#2d2118",
    roughness: 0.9,
  });

  const mesh = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const root = new THREE.Group();
  const body = new THREE.Group(); // đổi chiều cao khi quỳ, cúi
  const hip = new THREE.Group(); // xoay thân
  const head = new THREE.Group();
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  const helmetSlot = new THREE.Group();

  // Thân: áo chùng và thắt lưng
  hip.add(
    mesh(new THREE.CapsuleGeometry(0.18, 0.42, 6, 14), clothMat, 0, 0.4, 0),
  );
  hip.add(
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), leatherMat, 0, 0.2, 0),
  );
  hip.add(mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), metalMat, 0, 0.2, 0.2));

  // Đầu, tóc và mắt
  head.position.set(0, 0.84, 0);
  head.add(mesh(new THREE.SphereGeometry(0.13, 20, 16), skinMat, 0, 0.13, 0));
  head.add(
    mesh(
      new THREE.SphereGeometry(
        0.135,
        16,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.45,
      ),
      hairMat,
      0,
      0.15,
      -0.01,
    ),
  );
  for (const x of [-0.05, 0.05]) {
    head.add(
      mesh(new THREE.SphereGeometry(0.014, 8, 6), hairMat, x, 0.14, 0.12),
    );
  }
  helmetSlot.position.set(0, 0.13, 0);
  head.add(helmetSlot);
  hip.add(head);

  // Tay: tay áo và bàn tay
  armL.position.set(-0.28, 0.66, 0);
  armR.position.set(0.28, 0.66, 0);
  for (const arm of [armL, armR]) {
    arm.add(
      mesh(
        new THREE.CapsuleGeometry(0.065, 0.34, 4, 10),
        clothMat,
        0,
        -0.24,
        0,
      ),
    );
    arm.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), skinMat, 0, -0.45, 0));
    hip.add(arm);
  }

  if (sword) {
    const sw = new THREE.Group();
    sw.position.set(0, -0.46, 0.04);
    sw.rotation.x = -0.3;
    sw.add(
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), woodMat, 0, 0, 0),
    );
    sw.add(
      mesh(new THREE.BoxGeometry(0.16, 0.025, 0.035), metalMat, 0, 0.09, 0),
    );
    sw.add(
      mesh(new THREE.BoxGeometry(0.036, 0.62, 0.012), metalMat, 0, 0.42, 0),
    );
    armR.add(sw);
  }

  if (shield) {
    const sh = new THREE.Group();
    sh.position.set(-0.06, -0.3, 0.1);
    sh.rotation.y = 0.2;
    const faceMat = new THREE.MeshStandardMaterial({
      color: "#8b2f2b",
      roughness: 0.7,
    });
    const disc = mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.035, 28),
      faceMat,
    );
    disc.rotation.x = Math.PI / 2;
    sh.add(disc);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.02, 8, 32),
      metalMat,
    );
    rim.castShadow = true;
    sh.add(rim);
    sh.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), metalMat, 0, 0, 0.02));
    armL.add(sh);
  }

  // Chân: đùi và cẳng gộp thành một khối, kèm dép
  legL.position.set(-0.12, 0, 0);
  legR.position.set(0.12, 0, 0);
  const legCapsule = LEG_LENGTH - 0.18;
  for (const leg of [legL, legR]) {
    leg.add(
      mesh(
        new THREE.CapsuleGeometry(0.085, legCapsule, 4, 10),
        clothMat,
        0,
        -LEG_LENGTH / 2,
        0,
      ),
    );
    leg.add(
      mesh(
        new THREE.BoxGeometry(0.15, 0.06, 0.26),
        sandalMat,
        0,
        -LEG_LENGTH + 0.03,
        0.05,
      ),
    );
  }

  hip.add(armL, armR);
  body.add(hip, legL, legR);
  root.add(body);

  let target: Joints = { ...REST };
  const current: Joints = { ...REST };

  const apply = () => {
    body.position.y = current.rootY;
    hip.rotation.x = current.hipX;
    head.rotation.x = current.headX;
    armL.rotation.set(current.armLX, 0, current.armLZ);
    armR.rotation.set(current.armRX, 0, current.armRZ);
    legL.rotation.x = current.legLX;
    legR.rotation.x = current.legRX;
  };
  apply();

  return {
    root,
    helmetSlot,
    setPose(pose: Pose) {
      target = { ...REST, ...POSES[pose] };
    },
    setWalk(phase: number) {
      const s = Math.sin(phase);
      target = {
        ...REST,
        legLX: s * 0.5,
        legRX: -s * 0.5,
        armLX: -s * 0.35,
        armRX: s * 0.35,
        rootY: STAND_HEIGHT + Math.abs(Math.cos(phase)) * 0.025,
      };
    },
    update(dt: number) {
      const k = 1 - Math.exp(-dt * 8);
      (Object.keys(current) as (keyof Joints)[]).forEach((key) => {
        current[key] += (target[key] - current[key]) * k;
      });
      apply();
    },
  };
}

// Mũ giác đấu kiểu murmillo: vòm đồng bằng lathe, mặt nạ, khe mắt, mào lông đỏ
export function createHelmet() {
  const group = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({
    color: "#b08a3e",
    metalness: 0.75,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#1f1812",
    roughness: 0.7,
  });
  const plume = new THREE.MeshStandardMaterial({
    color: "#8b1e1e",
    roughness: 0.7,
  });

  const profile: THREE.Vector2[] = [];
  for (let i = 16; i >= 0; i--) {
    const a = (i / 16) * (Math.PI / 2);
    profile.push(
      new THREE.Vector2(Math.sin(a) * 0.16, 0.02 + Math.cos(a) * 0.17),
    );
  }
  const dome = new THREE.Mesh(new THREE.LatheGeometry(profile, 36), bronze);
  dome.castShadow = true;
  group.add(dome);

  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.03), bronze);
  mask.position.set(0, -0.02, 0.15);
  group.add(mask);

  for (const x of [-0.045, 0.045]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.01), dark);
    slit.position.set(x, 0, 0.166);
    group.add(slit);
  }
  for (const x of [-0.12, 0.12]) {
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.1),
      bronze,
    );
    guard.position.set(x, -0.06, 0.06);
    group.add(guard);
  }

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.24), bronze);
  base.position.set(0, 0.19, 0);
  group.add(base);
  const feather = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), plume);
  feather.scale.set(0.035, 0.12, 0.2);
  feather.position.set(0, 0.25, 0);
  group.add(feather);

  return group;
}
