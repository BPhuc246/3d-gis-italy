import { useRef, useState } from "react";
import * as THREE from "three";
import ThreeCanvas, { type SceneEnv, type SceneHandle } from "./ThreeCanvas";

// Nến mô phỏng vẽ hoàn toàn bằng Three.js, không dùng API hay đăng nhập.
// Số nến đã thắp được lưu cục bộ trong trình duyệt theo từng công trình.

const storageKey = (slug: string) => `memorial-candles:${slug}`;

function readTotal(slug: string): number {
  try {
    const n = Number(window.localStorage.getItem(storageKey(slug)));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeTotal(slug: string, total: number) {
  try {
    window.localStorage.setItem(storageKey(slug), String(total));
  } catch {
    // trình duyệt chặn localStorage: bỏ qua, bộ đếm chỉ sống trong phiên
  }
}

const candleCss = `
.memorial-candle-view {
  position: relative;
  width: 140px;
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
  background: #14110e;
}
.memorial-candle-view .three-host {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
}
.memorial-candle-view canvas {
  display: block;
  width: 100%;
  height: 100%;
}
`;

export default function MemorialCandle({
  slug,
  onLit,
}: {
  slug: string;
  onLit?: (lit: boolean) => void;
}) {
  const [total, setTotal] = useState(() => readTotal(slug));
  const [lit, setLit] = useState(false);

  // init chỉ chạy một lần, nên trạng thái React đi qua ref
  const live = useRef({ lit });
  live.current = { lit };

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera } = env;

    scene.background = new THREE.Color("#14110e");
    scene.add(new THREE.HemisphereLight("#fff1dc", "#2a2118", 0.5));

    // Thân nến
    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 1.4, 32),
      new THREE.MeshStandardMaterial({ color: "#f1e6cf", roughness: 0.7 }),
    );
    wax.position.y = 0.7;

    // Đĩa đế
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.75, 0.1, 32),
      new THREE.MeshStandardMaterial({
        color: "#a98542",
        metalness: 0.7,
        roughness: 0.35,
      }),
    );
    dish.position.y = 0.05;

    // Bấc nến
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: "#2b211a" }),
    );
    wick.position.y = 1.48;

    // Ngọn lửa: hình giọt nước kéo dài, chỉ hiện khi đã thắp
    const flameMat = new THREE.MeshBasicMaterial({
      color: "#ffb347",
      transparent: true,
      opacity: 0.95,
    });
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12),
      flameMat,
    );
    flame.scale.set(1, 1.9, 1);
    flame.position.y = 1.72;
    flame.visible = false;

    const glow = new THREE.PointLight("#ff9a3c", 0, 6, 2);
    glow.position.set(0, 1.8, 0);

    const group = new THREE.Group();
    group.add(dish, wax, wick, flame, glow);
    scene.add(group);

    camera.position.set(0, 1.5, 4.2);
    camera.lookAt(0, 1.1, 0);

    let t = 0;
    let level = 0;

    return {
      update(dt) {
        t += dt;
        const target = live.current.lit ? 1 : 0;
        level += (target - level) * (1 - Math.exp(-dt * 4));

        flame.visible = level > 0.02;
        const flicker = 1 + Math.sin(t * 14) * 0.06 + Math.sin(t * 23) * 0.04;
        flame.scale.set(level, level * 1.9 * flicker, level);
        flame.position.x = Math.sin(t * 9) * 0.01 * level;
        glow.intensity = level * (1.6 + Math.sin(t * 13) * 0.25);

        group.rotation.y += dt * 0.25;
      },
      dispose() {
        scene.remove(
          group,
          ...scene.children.filter((c) => c.type === "HemisphereLight"),
        );
        group.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        });
      },
    };
  };

  function light() {
    if (lit) return;
    const next = total + 1;
    setLit(true);
    setTotal(next);
    writeTotal(slug, next);
    onLit?.(true);
  }

  return (
    <div className="mt-4">
      <style>{candleCss}</style>
      <p className="scene-disclaimer">
        Nến này chỉ là mô phỏng trên màn hình. Không phải ngọn lửa thật và không
        ảnh hưởng đến ngọn lửa thực tế tại công trình.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="memorial-candle-view">
          <ThreeCanvas init={init} />
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            className="button secondary"
            disabled={lit}
            onClick={light}
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            {lit ? "Đã thắp nến mô phỏng" : "Thắp nến tưởng niệm"}
          </button>
          <span className="text-sm text-slate-600">
            {total} nến đã được thắp trên thiết bị này
          </span>
        </div>
      </div>
    </div>
  );
}
