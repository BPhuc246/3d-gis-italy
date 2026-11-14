import { useRef, useState } from "react";
import * as THREE from "three";
import ThreeCanvas, {
  type SceneEnv,
  type SceneHandle,
} from "../shared/ThreeCanvas";
import { useLoopAudio } from "../shared/useLoopAudio";
import { CreativeFlyController } from "../shared/CreativeFlyController";
import {
  loadFirstAvailable,
  makeGate,
  makeGround,
  prepareModel,
} from "../shared/ModelLoader";
import { MODEL_ASSETS } from "../config/modelAssets";

export default function ColosseumScene({
  audioUrl,
}: {
  audioUrl: string | null;
}) {
  const [gateOpen, setGateOpen] = useState(false);
  const [helmetOn, setHelmetOn] = useState(false);
  const audio = useLoopAudio(audioUrl);
  const live = useRef({ gateOpen, helmetOn });
  live.current = { gateOpen, helmetOn };

  const syncCrowdAudio = (nextGate: boolean, nextHelmet: boolean) => {
    const shouldPlay = nextGate && nextHelmet && audio.available;
    if (shouldPlay && !audio.playing) void audio.toggle();
    if (!shouldPlay && audio.playing) void audio.toggle();
  };

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;
    // 1. Đổi màu nền tối hơn, ngả sang xám lạnh/nâu sẫm
    scene.background = new THREE.Color("#151312");

    // 2. Tăng độ dày và đổi màu sương mù thành xám tối để cảnh vật mờ ảo, u ám hơn
    scene.fog = new THREE.Fog("#151312", 40, 150);

    // 3. Giảm cường độ đèn vòm (giảm ánh sáng trời, tăng độ tối các vùng khuất)
    scene.add(new THREE.HemisphereLight("#8c8275", "#211a14", 0.6));

    // 4. Đổi ánh sáng mặt trời thành màu lạnh/u tối hơn (hoặc vàng nhợt nhạt, giảm cường độ)
    const sun = new THREE.DirectionalLight("#a3978b", 1.2);
    sun.position.set(-35, 65, 30);
    sun.castShadow = !mobile;
    scene.add(sun);
    scene.add(makeGround(230, "#8c7961"));
    scene.add(camera);

    let disposed = false;
    let loadedArchitecture: THREE.Object3D | null = null;
    void loadFirstAvailable(MODEL_ASSETS.colosseum.architecture)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 48);
        scene.add(root);
        loadedArchitecture = root;
      })
      .catch(() =>
        console.warn(
          "Chưa tìm thấy colosseum.glb trong public/models/colosseum/",
        ),
      );

    // Cổng nâng hạ là một đạo cụ nhỏ tạo bằng code, không cần model/animation riêng.
    const gate = makeGate(4.4, 3.1);
    gate.position.set(0, 0, -27);
    scene.add(gate);

    // Mũ GLB được gắn trước camera. Hạ mũ xuống bằng cách di chuyển cả nhóm.
    const helmetRig = new THREE.Group();
    helmetRig.position.set(0, 3.5, 0);
    helmetRig.visible = false;
    camera.add(helmetRig);

    const fallbackHelmet = new THREE.Group();
    const bronze = new THREE.MeshStandardMaterial({
      color: "#a98542",
      metalness: 0.75,
      roughness: 0.32,
    });
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
      bronze,
    );
    shell.position.y = 0.08;
    fallbackHelmet.add(shell);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.09, 0.035),
      new THREE.MeshStandardMaterial({ color: "#211a14", roughness: 0.9 }),
    );
    visor.position.set(0, -0.02, -0.16);
    fallbackHelmet.add(visor);
    helmetRig.add(fallbackHelmet);

    void loadFirstAvailable(MODEL_ASSETS.colosseum.helmet)
      .then(({ root }) => {
        if (disposed) return;
        helmetRig.remove(fallbackHelmet);
        prepareModel(root, 0.48);
        root.position.set(0, 0.02, 0);
        root.rotation.y = Math.PI;
        helmetRig.add(root);
      })
      .catch(() =>
        console.warn(
          "Chưa có gladiator_helmet.glb; đang dùng mũ mô phỏng đơn giản.",
        ),
      );

    camera.position.set(20, 50, 0);
    camera.rotation.order = "YXZ";
    const controls = new CreativeFlyController(camera, renderer.domElement);
    controls.speed = 10;
    controls.boostSpeed = 30;
    controls.speed = 8;

    let gateY = 0;
    let helmetProgress = 0;
    const ease = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

    return {
      update(dt) {
        const state = live.current;
        gateY += ((state.gateOpen ? 3.6 : 0) - gateY) * ease(dt, 2.8);
        gate.position.y = gateY;

        helmetProgress +=
          ((state.helmetOn ? 1 : 0) - helmetProgress) * ease(dt, 5);
        helmetRig.visible = helmetProgress > 0.02;
        helmetRig.position.y = 0.65 - helmetProgress * 0.78;
        controls.update(dt);
      },
      dispose() {
        disposed = true;
        controls.dispose();
        if (loadedArchitecture) scene.remove(loadedArchitecture);
      },
    };
  };

  return (
    <div>
      <ThreeCanvas init={init} />
      <div className="scene-toolbar">
        <button
          className="button secondary"
          onClick={() => {
            const next = !gateOpen;
            setGateOpen(next);
            syncCrowdAudio(next, helmetOn);
          }}
        >
          {gateOpen ? "Hạ cổng xuống" : "Kéo cổng lên"}
        </button>
        <button
          className="button secondary"
          onClick={() => {
            const next = !helmetOn;
            setHelmetOn(next);
            syncCrowdAudio(gateOpen, next);
          }}
        >
          {helmetOn ? "Nâng mũ lên" : "Đội mũ giác đấu"}
        </button>
      </div>
      <p className="scene-note">
        Creative Mode: Click vào màn hình để điều khiển camera. WASD để di
        chuyển · Space để bay lên · Shift để bay xuống · Ctrl để tăng tốc · ESC
        để thả chuột.
        {!audio.available
          ? " Chưa có audioUrl (feature_key: crowd_audio)."
          : ""}
      </p>
    </div>
  );
}
