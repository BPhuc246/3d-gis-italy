import { useRef, useState } from "react";
import * as THREE from "three";
import ThreeCanvas, { type SceneEnv, type SceneHandle } from "../shared/ThreeCanvas";
import { FirstPersonController } from "../shared/FirstPersonController";
import { loadFirstAvailable, makeGround, prepareModel } from "../shared/ModelLoader";
import { MODEL_ASSETS } from "../config/modelAssets";

const SOLDIER_COUNT = 10;

export default function ArchParadeScene() {
  const [marching, setMarching] = useState(false);
  const [speed, setSpeed] = useState(1);
  const live = useRef({ marching, speed });
  live.current = { marching, speed };

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;
    scene.background = new THREE.Color("#292722");
    scene.fog = new THREE.Fog("#292722", 65, 180);
    scene.add(new THREE.HemisphereLight("#fff1dc", "#514638", 1.05));
    const sun = new THREE.DirectionalLight("#ffe1b7", 2.5);
    sun.position.set(-25, 55, 24);
    sun.castShadow = !mobile;
    scene.add(sun);
    scene.add(makeGround(180, "#887861"));
    scene.add(camera);

    let disposed = false;
    let arch: THREE.Object3D | null = null;
    void loadFirstAvailable(MODEL_ASSETS.archConstantine.architecture)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 25);
        scene.add(root);
        arch = root;
      })
      .catch(() => console.warn("Thiếu arch_of_constantine.glb hoặc triumphal_arch.glb."));

    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0, 26),
      new THREE.Vector3(-7, 0, 17),
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(0, 0, -12),
      new THREE.Vector3(7, 0, -20),
      new THREE.Vector3(15, 0, -27),
    ], false, "catmullrom", 0.35);

    const parade = new THREE.Group();
    scene.add(parade);
    let soldiers: THREE.Group[] = [];
    void loadFirstAvailable(MODEL_ASSETS.archConstantine.soldier)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 1.8);
        soldiers = Array.from({ length: SOLDIER_COUNT }, () => {
          const clone = root.clone(true) as THREE.Group;
          parade.add(clone);
          return clone;
        });
        scene.remove(root);
      })
      .catch(() => {
        console.warn("Thiếu roman_legionary.glb; đoàn diễu hành sẽ không hiển thị.");
      });

    camera.position.set(0, 1.65, 34);
    const controls = new FirstPersonController(camera, renderer.domElement, {
      minX: -34, maxX: 34, minZ: -38, maxZ: 38,
    });
    controls.speed = 7;

    let progress = 0;
    const point = new THREE.Vector3();
    const tangent = new THREE.Vector3();

    return {
      update(dt) {
        controls.update(dt);
        const state = live.current;
        if (state.marching) progress += dt * 0.045 * state.speed;

        soldiers.forEach((soldier, index) => {
          const u = (progress + index / SOLDIER_COUNT) % 1;
          path.getPointAt(u, point);
          path.getTangentAt(u, tangent);
          soldier.position.copy(point);
          soldier.position.y += Math.abs(Math.sin(progress * 40 + index)) * 0.035;
          soldier.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI;
        });
      },
      dispose() {
        disposed = true;
        controls.dispose();
        if (arch) scene.remove(arch);
      },
    };
  };

  return (
    <div>
      <ThreeCanvas init={init} />
      <div className="scene-toolbar">
        <button className="button secondary" onClick={() => setMarching((v) => !v)}>
          {marching ? "Tạm dừng diễu hành" : "Bắt đầu diễu hành"}
        </button>
        <label className="scene-speed-control">
          Tốc độ đoàn diễu hành: {speed.toFixed(1)}×
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="scene-note">
        POV: kéo chuột hoặc vuốt để nhìn xung quanh · WASD để di chuyển.
        Nhân vật diễu hành là model tĩnh được di chuyển theo đường đi và nhún nhẹ, không cần animation rig.
      </p>
    </div>
  );
}
