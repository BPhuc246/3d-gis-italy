import { useRef, useState } from "react";
import * as THREE from "three";
import ThreeCanvas, { type SceneEnv, type SceneHandle } from "../shared/ThreeCanvas";
import { FirstPersonController } from "../shared/FirstPersonController";
import { createSymbolicCandle } from "../shared/SceneEffects";
import { loadFirstAvailable, makeGround, prepareModel } from "../shared/ModelLoader";
import { MODEL_ASSETS } from "../config/modelAssets";
import MemorialCandle from "../shared/MemorialCandle";

export default function VittorianoScene() {
  const [bow, setBow] = useState(false);
  const [climb, setClimb] = useState(false);
  const [lit, setLit] = useState(false);
  const live = useRef({ bow, climb, lit });
  live.current = { bow, climb, lit };

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;
    scene.background = new THREE.Color("#30343a");
    scene.fog = new THREE.Fog("#30343a", 70, 190);
    scene.add(new THREE.HemisphereLight("#fff8eb", "#4c4b49", 1.1));
    const sun = new THREE.DirectionalLight("#fff0d7", 2.5);
    sun.position.set(25, 70, 32);
    sun.castShadow = !mobile;
    scene.add(sun);
    scene.add(makeGround(200, "#918b80"));
    scene.add(camera);

    let disposed = false;
    let monument: THREE.Object3D | null = null;
    void loadFirstAvailable(MODEL_ASSETS.vittoriano.architecture)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 80);
        scene.add(root);
        monument = root;
      })
      .catch(() => console.warn("Chưa có vittoriano.glb. Hãy xuất model từ SketchUp thành GLB."));

    // Bậc thang chỉ là hình học phụ trợ đơn giản; kiến trúc chính lấy từ GLB.
    const stairs = new THREE.Group();
    const stairMat = new THREE.MeshStandardMaterial({ color: "#d8d3c8", roughness: 0.8 });
    for (let i = 0; i < 14; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(22, 0.45, 1.15), stairMat);
      step.position.set(0, (i + 1) * 0.45 / 2, 20 - i * 1.15);
      step.scale.y = i + 1;
      step.position.y = (i + 1) * 0.45 / 2;
      step.castShadow = true;
      step.receiveShadow = true;
      stairs.add(step);
    }
    scene.add(stairs);

    const candle = createSymbolicCandle(camera);
    camera.position.set(80, 10, 0);
    const controller = new FirstPersonController(camera, renderer.domElement, {
      minX: -20, maxX: 20, minZ: -25, maxZ: 36,
    });
    controller.speed = 5;

    const climbPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.65, 34),
      new THREE.Vector3(0, 3.8, 22),
      new THREE.Vector3(0, 7.5, 11),
      new THREE.Vector3(0, 11.5, 3),
      new THREE.Vector3(0, 14, -2),
    ]);
    const lookAt = new THREE.Vector3(0, 16, -15);
    let progress = 0;
    let pitch = 0;

    return {
      update(dt) {
        const state = live.current;
        const targetProgress = state.climb ? 1 : 0;
        progress += (targetProgress - progress) * (1 - Math.exp(-dt * 0.8));
        const isMovingOnPath = Math.abs(targetProgress - progress) > 0.01;
        controller.height = 1.65 + 12.35 * progress;
        controller.enabled = !isMovingOnPath;
        if (isMovingOnPath) {
          camera.position.copy(climbPath.getPointAt(THREE.MathUtils.clamp(progress, 0, 1)));
          camera.lookAt(lookAt);
        } else {
          controller.update(dt);
        }

        const targetPitch = state.bow ? 0.48 : 0;
        pitch += (targetPitch - pitch) * (1 - Math.exp(-dt * 3));
        if (!isMovingOnPath) controller.setPitch(pitch);
        candle.setLit(state.lit);
        candle.update(dt);
      },
      dispose() {
        disposed = true;
        controller.dispose();
        if (monument) scene.remove(monument);
      },
    };
  };

  return (
    <div>
      <ThreeCanvas init={init} />
      <div className="scene-toolbar">
        <button className="button secondary" onClick={() => setBow((v) => !v)}>
          {bow ? "Ngẩng đầu" : "Cúi đầu tưởng niệm"}
        </button>
        <button className="button secondary" onClick={() => setClimb((v) => !v)}>
          {climb ? "Trở về chân bậc thang" : "Bắt đầu hành trình đi lên"}
        </button>
      </div>
      <p className="scene-note">
        POV: kéo chuột hoặc vuốt để nhìn xung quanh · WASD để di chuyển.
        Nến là hiệu ứng biểu tượng trong ứng dụng; không tác động đến ngọn lửa thật tại Mộ Chiến sĩ Vô danh.
      </p>
      <MemorialCandle slug="vittoriano" onLit={setLit} />
    </div>
  );
}
