import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import ThreeCanvas, {
  type SceneEnv,
  type SceneHandle,
} from "../shared/ThreeCanvas";
import {
  FirstPersonController,
  type WorldLayout,
} from "../shared/FirstPersonController";
import { CreativeFlyController } from "../shared/CreativeFlyController";
import {
  loadFirstAvailable,
  makeGround,
  prepareModel,
} from "../shared/ModelLoader";
import { makeStoneTexture } from "../shared/textures";
import MemorialCandle from "../shared/MemorialCandle";
import { MODEL_ASSETS } from "../config/modelAssets";
import { EternalFlame } from "./vittoriano/EternalFlame";
import {
  MODEL,
  STAIR_CONFIG,
  VIEWPOINTS,
  buildStairMeshes,
  buildStairPlan,
  fallbackBox,
  floorAtPlan,
  noBlockers,
  zoneAtPlan,
  type ModelBox,
  type StairPlan,
  type ZoneId,
} from "./vittoriano/stairs";

const DAY = {
  sky: "#9ec7e6",
  ground: "#b5ae9f",
  hemi: 1.1,
  sun: 2.5,
  sunColor: "#fff0d7",
};
const NIGHT = {
  sky: "#0a1126",
  ground: "#2a2e38",
  hemi: 0.2,
  sun: 0.1,
  sunColor: "#7f97c8",
};
const SPOT_NIGHT = 1.2;
const BOW_PITCH = -0.5; // âm là nhìn xuống
const BOW_DURATION_MS = 3000; // cúi đầu rồi tự ngẩng lên sau 3 giây
const FLAME_SCALE = 5;

const sceneCss = `
.vittoriano-scene .three-host {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
}
.vittoriano-scene canvas {
  display: block;
  width: 100%;
  height: 100%;
}
`;

const frameStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, calc(70vh * 16 / 9))",
  aspectRatio: "16 / 9",
  minHeight: 300,
  margin: "0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
  borderRadius: 12,
  background: "#30343a",
};

const controlStackStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 30,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
  maxWidth: "calc(100% - 24px)",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = { whiteSpace: "nowrap", maxWidth: "100%" };

const viewCardStyle: CSSProperties = {
  position: "absolute",
  left: 12,
  bottom: 52,
  zIndex: 25,
  maxWidth: 320,
  padding: "12px 14px",
  borderRadius: 10,
  background: "rgba(20, 17, 14, 0.82)",
  color: "#f4ead8",
  fontSize: 13,
  lineHeight: 1.45,
  pointerEvents: "none",
};

// Bỏ focus sau khi bấm để phím Space không kích hoạt lại nút
const blurOnMouseUp = (e: { currentTarget: HTMLButtonElement }) =>
  e.currentTarget.blur();

export default function VittorianoScene() {
  const [bow, setBow] = useState(false);
  const [flameOn, setFlameOn] = useState(false);
  const [night, setNight] = useState(false);
  const [flying, setFlying] = useState(false);
  const [viewpoint, setViewpoint] = useState<ZoneId | null>(null);
  const [visited, setVisited] = useState<ZoneId[]>([]);

  // init chỉ chạy một lần, nên trạng thái React đi qua ref
  const live = useRef({ bow, flameOn, night, flying });
  live.current = { bow, flameOn, night, flying };

  // Cúi đầu tự trở lại sau 3 giây
  useEffect(() => {
    if (!bow) return;
    const t = window.setTimeout(() => setBow(false), BOW_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [bow]);

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;

    let disposed = false;
    let setupDone = false;

    scene.background = new THREE.Color(DAY.sky);
    scene.fog = new THREE.Fog(DAY.sky, 150, 600);

    const hemi = new THREE.HemisphereLight("#fff8eb", "#4c4b49", DAY.hemi);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(DAY.sunColor, DAY.sun);
    sun.castShadow = !mobile;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun, sun.target);

    const ground = makeGround(800, DAY.ground);
    scene.add(ground);
    const groundMat = ground.material as THREE.MeshStandardMaterial;

    const marble = new THREE.MeshStandardMaterial({
      color: "#ebe7dd",
      map: makeStoneTexture(4),
      roughness: 0.55,
    });

    const spots: THREE.SpotLight[] = [];
    for (let i = 0; i < 3; i++) {
      const spot = new THREE.SpotLight("#ffe2b0", 0, 0, 0.32, 0.6, 0);
      scene.add(spot, spot.target);
      spots.push(spot);
    }

    let stairs: THREE.Group | null = null;
    let flame: EternalFlame | null = null;
    let monument: THREE.Object3D | null = null;
    let plan: StairPlan | null = null;
    let walk: FirstPersonController | null = null;
    let walkBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    let walkWorld: WorldLayout = {
      floorAt: () => 0,
      blockers: noBlockers,
      stepSmoothing: 9,
    };

    camera.rotation.order = "YXZ";

    const createWalker = () => {
      const c = new FirstPersonController(
        camera,
        renderer.domElement,
        walkBounds,
        walkWorld,
      );
      c.speed = 4.5;
      c.height = STAIR_CONFIG.eye;
      return c;
    };

    const creative = new CreativeFlyController(camera, renderer.domElement);
    creative.speed = 8;
    creative.boostSpeed = 20;
    creative.setEnabled(false);

    // Dựng cầu thang, lửa, mặt đất, mặt trời theo kích thước thật của mô hình
    const setup = (box: ModelBox) => {
      if (disposed) return;
      const p = buildStairPlan(box);
      plan = p;
      const { size, center, span, outward, lateral } = p;

      ground.scale.set((span * 4) / 800, 1, (span * 4) / 800);
      ground.position.x = center.x;
      ground.position.z = center.z;

      sun.target.position.set(center.x, size.y * 0.3, center.z);
      sun.position
        .copy(sun.target.position)
        .add(new THREE.Vector3(span * 0.6, span * 1.2, span * 0.8));
      Object.assign(sun.shadow.camera, {
        left: -span,
        right: span,
        top: span,
        bottom: -span,
        near: 1,
        far: span * 4,
      });
      sun.shadow.camera.updateProjectionMatrix();

      scene.fog = new THREE.Fog(DAY.sky, span * 1.2, span * 4);
      camera.far = Math.max(600, span * 6);
      camera.updateProjectionMatrix();

      // Đèn chiếu mặt đứng đặt ở phía quảng trường, hướng về công trình
      spots.forEach((spot, i) => {
        const k = (i - 1) * size.x * 0.3;
        const base = center
          .clone()
          .addScaledVector(outward, span * 0.45)
          .addScaledVector(lateral, k);
        spot.position.set(base.x, 6, base.z);
        const aim = center
          .clone()
          .addScaledVector(outward, span * 0.1)
          .addScaledVector(lateral, k * 0.6);
        spot.target.position.set(aim.x, size.y * 0.35, aim.z);
      });

      stairs = buildStairMeshes(p, marble);
      scene.add(stairs);

      flame = new EternalFlame(scene, p.flame, { scale: FLAME_SCALE });

      walkBounds = p.walkBounds;
      walkWorld = {
        floorAt: (x, z) => floorAtPlan(p, x, z),
        blockers: noBlockers,
        stepSmoothing: 9,
      };

      const startY = floorAtPlan(p, p.start.x, p.start.z);
      camera.position.set(p.start.x, startY + STAIR_CONFIG.eye, p.start.z);

      if (!live.current.flying) walk = createWalker();
      setupDone = true;
    };

    const useFallback = () => setup(fallbackBox());

    void loadFirstAvailable(MODEL_ASSETS.vittoriano.architecture).then(
      ({ root }) => {
        if (disposed) return;
        try {
          prepareModel(root, MODEL.height);
          root.position.add(
            new THREE.Vector3(MODEL.center.x, 0, MODEL.center.z),
          );
          scene.add(root);
          monument = root;
          root.updateMatrixWorld(true);
          const b = new THREE.Box3().setFromObject(root);
          setup({ min: b.min.clone(), max: b.max.clone() });
        } catch (error) {
          console.warn("Không dựng được mô hình vittoriano.glb:", error);
          useFallback();
        }
      },
      () => {
        console.warn(
          "Chưa có vittoriano.glb. Xuất model từ SketchUp (.skp) sang .glb rồi đặt vào public/models/vittoriano/.",
        );
        useFallback();
      },
    );

    const tmp = new THREE.Color();
    const daySky = new THREE.Color(DAY.sky);
    const nightSky = new THREE.Color(NIGHT.sky);
    const dayGround = new THREE.Color(DAY.ground);
    const nightGround = new THREE.Color(NIGHT.ground);
    const daySun = new THREE.Color(DAY.sunColor);
    const nightSun = new THREE.Color(NIGHT.sunColor);

    let nightMix = 0;
    let lastFlying = false;
    let bowLevel = 0;
    let lastBowLevel = 0;
    let lastZone: ZoneId | null = null;

    return {
      update(dt) {
        const s = live.current;

        // Chuyển đổi đi bộ <-> bay
        if (s.flying !== lastFlying) {
          lastFlying = s.flying;
          if (s.flying) {
            walk?.dispose();
            walk = null;
            creative.setEnabled(true);
            creative.setFlying(true);
          } else {
            creative.setEnabled(false);
            if (setupDone) {
              const e = new THREE.Euler().setFromQuaternion(
                camera.quaternion,
                "YXZ",
              );
              camera.position.x = THREE.MathUtils.clamp(
                camera.position.x,
                walkBounds.minX,
                walkBounds.maxX,
              );
              camera.position.z = THREE.MathUtils.clamp(
                camera.position.z,
                walkBounds.minZ,
                walkBounds.maxZ,
              );
              walk = createWalker();
              walk.setLook(e.y, e.x);
            }
          }
        }

        // Cúi đầu: nghiêng dần xuống, rồi trở về khi hết thời gian
        bowLevel += ((s.bow ? 1 : 0) - bowLevel) * (1 - Math.exp(-dt * 6));
        if (walk && Math.abs(bowLevel - lastBowLevel) > 1e-4) {
          walk.setPitch(bowLevel * BOW_PITCH);
        }
        lastBowLevel = bowLevel;

        if (walk) walk.update(dt);
        else creative.update(dt);

        // Điểm tham quan theo tầng
        if (plan) {
          const zone = zoneAtPlan(plan, camera.position.x, camera.position.z);
          if (zone !== lastZone) {
            lastZone = zone;
            setViewpoint(zone);
            if (zone) {
              setVisited((prev) =>
                prev.includes(zone) ? prev : [...prev, zone],
              );
            }
          }
        }

        flame?.setLit(s.flameOn);
        flame?.update(dt);

        // Chuyển ngày đêm
        nightMix += ((s.night ? 1 : 0) - nightMix) * (1 - Math.exp(-dt * 1.5));
        tmp.copy(daySky).lerp(nightSky, nightMix);
        (scene.background as THREE.Color).copy(tmp);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(tmp);
        hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, nightMix);
        sun.intensity = THREE.MathUtils.lerp(DAY.sun, NIGHT.sun, nightMix);
        sun.color.copy(daySun).lerp(nightSun, nightMix);
        groundMat.color.copy(dayGround).lerp(nightGround, nightMix);
        for (const spot of spots) spot.intensity = SPOT_NIGHT * nightMix;
      },

      dispose() {
        disposed = true;
        walk?.dispose();
        creative.dispose();
        flame?.dispose();
        if (stairs) {
          scene.remove(stairs);
          stairs.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh) mesh.geometry.dispose();
          });
        }
        if (monument) scene.remove(monument);
        scene.remove(
          sun,
          sun.target,
          hemi,
          ground,
          ...spots,
          ...spots.map((s) => s.target),
        );
        marble.map?.dispose();
        marble.dispose();
      },
    };
  };

  return (
    <div>
      <div className="vittoriano-scene" style={frameStyle}>
        <style>{sceneCss}</style>
        <ThreeCanvas init={init} />

        <div style={controlStackStyle}>
          <button
            className="button secondary"
            style={buttonStyle}
            onMouseUp={blurOnMouseUp}
            onClick={() => setFlying((v) => !v)}
          >
            {flying ? "Tắt chế độ bay" : "Bật chế độ bay"}
          </button>

          <button
            className="button secondary"
            style={buttonStyle}
            disabled={flying || bow}
            onMouseUp={blurOnMouseUp}
            onClick={() => setBow(true)}
          >
            {bow ? "Đang cúi đầu..." : "Cúi đầu tưởng niệm"}
          </button>

          <button
            className="button secondary"
            style={buttonStyle}
            onMouseUp={blurOnMouseUp}
            onClick={() => setFlameOn((v) => !v)}
          >
            {flameOn ? "Tắt lửa tưởng niệm" : "Thắp lửa tưởng niệm"}
          </button>

          <button
            className="button secondary"
            style={buttonStyle}
            onMouseUp={blurOnMouseUp}
            onClick={() => setNight((v) => !v)}
          >
            {night ? "Chuyển sang ban ngày" : "Chuyển sang ban đêm"}
          </button>
        </div>

        {viewpoint && (
          <div style={viewCardStyle} role="status">
            <strong>{VIEWPOINTS[viewpoint].title}</strong>
            <p style={{ margin: "6px 0 0" }}>{VIEWPOINTS[viewpoint].text}</p>
            <small>Điểm tham quan đã ghé: {visited.length}/2</small>
          </div>
        )}

        <p
          className="scene-note"
          style={{ maxWidth: "95%", boxSizing: "border-box" }}
        >
          {flying
            ? "Chế độ bay: WASD di chuyển · Space bay lên · Shift bay xuống · Ctrl tăng tốc · Click màn hình để nhìn xung quanh · ESC thả chuột. Không có va chạm."
            : "Đi bộ: WASD di chuyển · Kéo chuột để nhìn xung quanh · Hai cầu thang chính dẫn lên bục tròn, hai cánh cầu thang dẫn lên nền chữ nhật rồi lên nửa hình tròn trên cùng. Lửa là mô phỏng trong ứng dụng, không tác động đến ngọn lửa thật tại Mộ Chiến sĩ Vô danh."}
        </p>
      </div>

      <MemorialCandle slug="vittoriano" />
    </div>
  );
}
