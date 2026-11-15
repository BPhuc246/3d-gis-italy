import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import ThreeCanvas, {
  type SceneEnv,
  type SceneHandle,
} from "../shared/ThreeCanvas";
import { CreativeFlyController } from "../shared/CreativeFlyController";
import {
  loadFirstAvailable,
  makeGround,
  prepareModel,
} from "../shared/ModelLoader";
import { MODEL_ASSETS } from "../config/modelAssets";

// ========================================
// HẰNG SỐ
// ========================================

const SMOKE_COUNT = 190;

// Camera
const OUTSIDE_HEIGHT = 10;
const OUTSIDE_SPAWN = new THREE.Vector3(10, OUTSIDE_HEIGHT, 34);
const OUTSIDE_LOOK_AT = new THREE.Vector3(0, OUTSIDE_HEIGHT, 0);
const OUTSIDE_SPEED = 8;
const WALK_HEIGHT = 3; // độ cao khi đi bộ trong nội thất
const INTERIOR_SPEED = 4;

// Nội thất (cần chỉnh theo tọa độ thực của model)
const INTERIOR_MODEL_PATH = "/models/pantheon/pantheon_interior.glb";
const ALTAR_POSITION = new THREE.Vector3(-10, 0, 7.5);
const BURNER_LOCAL = new THREE.Vector3(1, 1.2, -6);
const BURNER_WORLD = ALTAR_POSITION.clone().add(BURNER_LOCAL);
const INTERACT_DISTANCE = 3.5;
const INTERIOR_SPAWN = new THREE.Vector3(20, WALK_HEIGHT, 0);

// Cổng
const GATE_MODEL_PATHS = [
  "/models/pantheon/pantheon_gate.glb",
  "/_local/models/pantheon/pantheon_gate.glb",
];
const GATE_HEIGHT = 20;
const GATE_FRONT_DISTANCE = 5;
const GATE_DROP_HEIGHT = 8; // dùng khi model không có animation
const GATE_FLASH_DELAY = 1.0;
const GATE_SWITCH_OFFSET = 0.5;
const GATE_FLASH_DURATION = 1.0;
const GATE_LOCK_DURATION = 3.0;

// Cầu nguyện
const PRAYER_DURATION = 3;
const PRAYER_HEAD_ANGLE = -0.55;

// Âm thanh
type SoundKey = "crowd" | "fountain" | "noise" | "drop" | "light";

const SOUND_SRC: Record<SoundKey, string> = {
  crowd: "/_local/audio/crowd.mp3",
  fountain: "/_local/audio/fountain.mp3",
  noise: "/_local/audio/noise.mp3",
  drop: "/_local/audio/drop.mp3",
  light: "/_local/audio/light.mp3",
};

const SOUND_VOLUME: Record<SoundKey, number> = {
  crowd: 0.45,
  fountain: 0.35,
  noise: 0.4,
  drop: 0.8,
  light: 0.7,
};

const soundCache: Partial<Record<SoundKey, HTMLAudioElement>> = {};

function getSound(key: SoundKey): HTMLAudioElement {
  let audio = soundCache[key];
  if (!audio) {
    audio = new Audio(SOUND_SRC[key]);
    audio.preload = "auto";
    audio.loop = key === "crowd" || key === "fountain" || key === "noise";
    audio.volume = 0;
    soundCache[key] = audio;
  }
  return audio;
}

function playOnce(key: SoundKey) {
  const audio = getSound(key);
  audio.volume = SOUND_VOLUME[key];
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

// ========================================
// HELPERS
// ========================================

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const disposeTree = (obj: THREE.Object3D) => {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose?.();
  });
};

// Căn model theo chiều cao GATE_HEIGHT, đáy đặt tại y = 0, tâm đặt tại x = z = 0
const fitGate = (obj: THREE.Object3D) => {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  if (size.y < 1e-3) return;

  obj.scale.multiplyScalar(GATE_HEIGHT / size.y);
  obj.updateMatrixWorld(true);

  box.setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  obj.updateMatrixWorld(true);
};

// Cổng tạm khi không tải được file
const buildPlaceholderGate = () => {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: "#7a6a4f",
    roughness: 0.6,
    metalness: 0.3,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: "#3d2f22",
    roughness: 0.8,
  });
  const h = GATE_HEIGHT;

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), mat);
  left.position.set(-2.2, h / 2, 0);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), mat);
  right.position.set(2.2, h / 2, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.8, 0.8), mat);
  lintel.position.set(0, h - 0.4, 0);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, h - 0.8, 0.12),
    doorMat,
  );
  door.position.set(0, (h - 0.8) / 2, 0);

  group.add(left, right, lintel, door);
  return group;
};

type Phase = "outside" | "gate" | "inside";

// ========================================
// COMPONENT
// ========================================

export default function PantheonScene() {
  const [soundOn, setSoundOn] = useState(true);
  const [phase, setPhase] = useState<Phase>("outside");
  const [nearAltar, setNearAltar] = useState(false);
  const [incenseLit, setIncenseLit] = useState(false);
  const [praying, setPraying] = useState(false);
  const [flash, setFlash] = useState(false);
  const [flying, setFlying] = useState(false);

  const live = useRef({ soundOn });
  live.current = { soundOn };

  const intent = useRef({
    enter: false,
    exit: false,
    light: false,
    pray: false,
    fly: false,
  });

  // ========================================
  // THREE.JS
  // ========================================

  const init = useCallback((env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;

    // ----------------------------------------
    // 1. ÁNH SÁNG & CAMERA
    // ----------------------------------------
    renderer.toneMappingExposure = 1.25;

    scene.background = new THREE.Color("#5d6b7a");

    scene.add(new THREE.HemisphereLight("#fff8ec", "#8a8074", 2.2));
    scene.add(new THREE.AmbientLight("#ffffff", 0.35));

    const sun = new THREE.DirectionalLight("#fff3dc", 3.2);
    sun.position.set(5, 75, 6);
    sun.castShadow = !mobile;
    scene.add(sun);

    // Đèn nội thất, chỉ bật khi ở trong Pantheon
    const interiorLight = new THREE.PointLight("#ffd9a0", 90, 80, 1.2);
    interiorLight.position.set(0, 18, 0);
    const interiorFillA = new THREE.PointLight("#ffe7c2", 60, 70, 1.2);
    interiorFillA.position.set(0, 5, 12);
    const interiorFillB = new THREE.PointLight("#ffe7c2", 60, 70, 1.2);
    interiorFillB.position.set(0, 5, -12);
    const interiorLights = [interiorLight, interiorFillA, interiorFillB];
    interiorLights.forEach((l) => {
      l.visible = false;
      scene.add(l);
    });

    scene.add(makeGround(100, "#cfc4ae"));

    camera.fov = 68;
    camera.near = 0.05;
    camera.updateProjectionMatrix();
    camera.position.copy(OUTSIDE_SPAWN);
    camera.lookAt(OUTSIDE_LOOK_AT);
    scene.add(camera);

    // ----------------------------------------
    // 2. TRẠNG THÁI
    // ----------------------------------------
    let disposed = false;
    let phaseLocal: Phase = "outside";
    let nearLocal = false;
    let incenseLitLocal = false;
    let litFx = 0;
    let gateT = 0;
    let flashT = -1;
    let switched = false;
    let switchedAt = 0;
    let interiorFailed = false;
    let interiorLoading = false;
    let elapsed = 0;
    let smokeTime = 0;
    let prayerT = -1;
    let gateLockT = -1;
    const prayerFrom = new THREE.Quaternion();
    const prayerTo = new THREE.Quaternion();

    let pantheon: THREE.Object3D | null = null;
    let interior: THREE.Object3D | null = null;
    let gateMixer: THREE.AnimationMixer | null = null;
    let gateAction: THREE.AnimationAction | null = null;

    // ----------------------------------------
    // 3. LOAD MODEL NGOÀI
    // ----------------------------------------
    void loadFirstAvailable(MODEL_ASSETS.pantheon.architecture)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 43.3);
        scene.add(root);
        pantheon = root;
      })
      .catch(() => {
        console.warn("Chưa có pantheon.glb trong public/models/pantheon/.");
      });

    // ----------------------------------------
    // 4. CỔNG
    // ----------------------------------------
    const gateRig = new THREE.Group();
    gateRig.visible = false;
    scene.add(gateRig);

    const gateLoader = new GLTFLoader();

    const loadGateGltf = async () => {
      for (const path of GATE_MODEL_PATHS) {
        try {
          return await gateLoader.loadAsync(path);
        } catch {
          console.warn(`Không tải được cổng tại: ${path}`);
        }
      }
      return null;
    };

    void loadGateGltf().then((gltf) => {
      if (disposed) return;

      if (gltf) {
        const model = gltf.scene;
        gateRig.add(model);
        fitGate(model);

        if (gltf.animations.length > 0) {
          gateMixer = new THREE.AnimationMixer(model);
          gateAction = gateMixer.clipAction(gltf.animations[0]);
          gateAction.setLoop(THREE.LoopOnce, 1);
          gateAction.clampWhenFinished = true;
          if (phaseLocal === "gate") gateAction.reset().play();
        }
      } else {
        console.warn(
          "Dùng cổng tạm vì không tải được pantheon_gate.glb. Kiểm tra đường dẫn trong thư mục public.",
        );
        gateRig.add(buildPlaceholderGate());
      }
    });

    // ----------------------------------------
    // 5. LOAD NỘI THẤT
    // ----------------------------------------
    const loadInterior = async () => {
      if (interior || interiorLoading) return;
      interiorLoading = true;
      try {
        const { root } = await loadFirstAvailable([INTERIOR_MODEL_PATH]);
        if (disposed) return;
        prepareModel(root, 43.3);
        root.visible = false;
        scene.add(root);
        interior = root;
      } catch (error) {
        console.error("Không thể tải pantheon_interior.glb:", error);
        interiorFailed = true;
      } finally {
        interiorLoading = false;
      }
    };

    // ----------------------------------------
    // 6. VÒNG SÁNG BÀN THỜ
    // ----------------------------------------
    const hotspotMat = new THREE.MeshBasicMaterial({
      color: "#ffd98a",
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const hotspot = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.75, 48),
      hotspotMat,
    );
    hotspot.rotation.x = -Math.PI / 2;
    hotspot.position.set(BURNER_WORLD.x, 0.05, BURNER_WORLD.z);
    hotspot.visible = false;
    scene.add(hotspot);

    // ----------------------------------------
    // 7. LƯ HƯƠNG, NHANG, ĐỐM LỬA, KHÓI
    // ----------------------------------------
    const incense = new THREE.Group();
    incense.position.copy(ALTAR_POSITION);
    incense.visible = false;

    const BURNER_SCALE = 5;
    const BURNER_SHIFT_X = BURNER_LOCAL.x;
    const BURNER_Z = BURNER_LOCAL.z;
    const BURNER_BOTTOM = 0.4;
    const BURNER_HEIGHT = 0.3 * BURNER_SCALE;
    const ASH_Y = BURNER_LOCAL.y; // mặt tro = miệng lư

    // Nhang nhỏ hơn 3 lần so với bản trước
    const STICK_SCALE = 1 / 3;
    const STICK_HEIGHT = 0.9 * BURNER_SCALE * STICK_SCALE;
    const STICK_RADIUS = 0.014 * STICK_SCALE;
    const EMBER_RADIUS = 0.035 * STICK_SCALE;

    // Khói
    const SMOKE_RISE = 3.0; // khói bay lên bao cao
    const SMOKE_DRIFT = 0.25; // độ lắc ngang của khói

    // Lư hương
    const burner = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.45 * BURNER_SCALE,
        0.32 * BURNER_SCALE,
        BURNER_HEIGHT,
        32,
      ),
      new THREE.MeshStandardMaterial({
        color: "#6b5a45",
        roughness: 0.55,
        metalness: 0.25,
      }),
    );
    burner.position.set(
      BURNER_SHIFT_X,
      BURNER_BOTTOM + BURNER_HEIGHT / 2,
      BURNER_Z,
    );

    // Đế lư
    const burnerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.55 * BURNER_SCALE,
        0.6 * BURNER_SCALE,
        0.08 * BURNER_SCALE,
        32,
      ),
      new THREE.MeshStandardMaterial({ color: "#4a3d2e", roughness: 0.7 }),
    );
    burnerBase.position.set(BURNER_SHIFT_X, BURNER_BOTTOM / 2, BURNER_Z);

    // Tro, nằm sát miệng lư
    const ash = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.4 * BURNER_SCALE,
        0.4 * BURNER_SCALE,
        0.1,
        32,
      ),
      new THREE.MeshStandardMaterial({ color: "#d9d2c3", roughness: 1 }),
    );
    ash.position.set(BURNER_SHIFT_X, ASH_Y - 0.05, BURNER_Z);

    // Vị trí chân ba cây nhang (cắm trên mặt tro)
    const STICK_SPOTS = [
      new THREE.Vector3(BURNER_SHIFT_X - 0.12 * BURNER_SCALE, ASH_Y, BURNER_Z),
      new THREE.Vector3(BURNER_SHIFT_X + 0.12 * BURNER_SCALE, ASH_Y, BURNER_Z),
      new THREE.Vector3(BURNER_SHIFT_X, ASH_Y, BURNER_Z + 0.12 * BURNER_SCALE),
    ];

    // Đầu nhang, dùng làm gốc cho khói
    const STICK_TIPS = STICK_SPOTS.map((p) =>
      p.clone().add(new THREE.Vector3(0, STICK_HEIGHT, 0)),
    );

    const stickMat = new THREE.MeshStandardMaterial({
      color: "#3a2a1e",
      roughness: 0.9,
    });

    const sticks: THREE.Mesh[] = [];
    const embers: THREE.Mesh[] = [];

    STICK_SPOTS.forEach((spot) => {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(STICK_RADIUS, STICK_RADIUS, STICK_HEIGHT, 8),
        stickMat,
      );
      stick.position.set(spot.x, spot.y + STICK_HEIGHT / 2, spot.z);
      sticks.push(stick);

      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(EMBER_RADIUS, 12, 8),
        new THREE.MeshBasicMaterial({ color: "#ff7a1a" }),
      );
      ember.position.set(spot.x, spot.y + STICK_HEIGHT, spot.z);
      ember.visible = false;
      embers.push(ember);
    });

    const glow = new THREE.PointLight("#ff9a3c", 0, 6, 2);
    glow.position.copy(BURNER_LOCAL).add(new THREE.Vector3(0, 0.5, 0));

    incense.add(burnerBase, burner, ash, ...sticks, ...embers, glow);
    scene.add(incense);

    // Ba cột khói, mỗi cột ứng với một cây nhang
    const PLUME_COUNT = STICK_SPOTS.length;
    const PARTICLES_PER_PLUME = Math.floor(SMOKE_COUNT / PLUME_COUNT);
    const TOTAL_SMOKE = PARTICLES_PER_PLUME * PLUME_COUNT;

    const smokeArr = new Float32Array(TOTAL_SMOKE * 3);
    const smokeAge = new Float32Array(TOTAL_SMOKE);
    const smokeSeed = new Float32Array(TOTAL_SMOKE);
    for (let i = 0; i < TOTAL_SMOKE; i++) {
      smokeAge[i] = (i % PARTICLES_PER_PLUME) / PARTICLES_PER_PLUME;
      smokeSeed[i] = Math.random() * Math.PI * 2;
    }

    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokeArr, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: "#e8e4dc",
      size: 0.2,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const smoke = new THREE.Points(smokeGeo, smokeMat);
    // Không dịch thêm: tọa độ hạt đã là tọa độ local của incense
    smoke.position.set(0, 0, 0);
    smoke.visible = false;
    incense.add(smoke);
    // ----------------------------------------
    // 8. CONTROLLER (ngoài: đi bộ hoặc bay, trong: chỉ đi bộ)
    // ----------------------------------------
    const controls = new CreativeFlyController(camera, renderer.domElement);
    controls.speed = OUTSIDE_SPEED;
    controls.boostSpeed = 25;
    controls.walkHeight = OUTSIDE_HEIGHT;
    controls.setFlying(false);

    // ----------------------------------------
    // 9. BÀN TAY CẦU NGUYỆN
    // ----------------------------------------
    const prayerHands = new THREE.Group();
    const handMaterial = new THREE.MeshStandardMaterial({
      color: "#c99b7b",
      roughness: 0.8,
    });
    const palmGeometry = new THREE.CapsuleGeometry(0.09, 0.32, 4, 8);

    const leftHand = new THREE.Mesh(palmGeometry, handMaterial);
    leftHand.position.set(-0.075, 0, 0);
    leftHand.rotation.z = -0.12;

    const rightHand = new THREE.Mesh(palmGeometry, handMaterial);
    rightHand.position.set(0.075, 0, 0);
    rightHand.rotation.z = 0.12;

    prayerHands.add(leftHand, rightHand);
    prayerHands.position.set(0, -0.48, -0.85);
    prayerHands.rotation.x = -0.25;
    prayerHands.visible = false;
    camera.add(prayerHands);

    // ----------------------------------------
    // 10. ÂM THANH
    // ----------------------------------------
    let audioUnlocked = false;
    const unlockAudio = () => {
      audioUnlocked = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    const fadeSound = (key: SoundKey, target: number, dt: number) => {
      const audio = getSound(key);
      const next =
        audio.volume + (target - audio.volume) * Math.min(1, dt * 2.5);
      audio.volume = THREE.MathUtils.clamp(next, 0, 1);

      if (target > 0.01 && audio.paused && audioUnlocked) {
        void audio.play().catch(() => {});
      } else if (target <= 0.01 && audio.volume <= 0.01 && !audio.paused) {
        audio.pause();
      }
    };

    // ----------------------------------------
    // 11. PHÍM TẮT: G bay, E thắp nhang, F cầu nguyện
    // ----------------------------------------
    const onShortcut = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "KeyG") intent.current.fly = true;
      if (event.code === "KeyE") intent.current.light = true;
      if (event.code === "KeyF") intent.current.pray = true;
    };
    window.addEventListener("keydown", onShortcut);

    // ----------------------------------------
    // 12. HÀNH ĐỘNG CHUYỂN KHU VỰC
    // ----------------------------------------
    const startEnter = () => {
      gateT = 0;
      flashT = -1;
      switched = false;
      switchedAt = 0;
      interiorFailed = false;
      setFlash(false);

      // Tắt bay trước khi vào, để bên trong chỉ đi bộ
      controls.setFlying(false);
      setFlying(false);

      controls.setEnabled(false);
      gateLockT = 0;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-4) forward.set(0, 0, -1);
      forward.normalize();

      gateRig.position
        .copy(camera.position)
        .addScaledVector(forward, GATE_FRONT_DISTANCE);
      gateRig.position.y = 0;
      gateRig.rotation.set(0, Math.atan2(-forward.x, -forward.z), 0);
      gateRig.visible = true;

      if (gateAction) {
        gateAction.reset().play();
      } else {
        gateRig.position.y = GATE_DROP_HEIGHT;
      }

      void loadInterior();

      phaseLocal = "gate";
      setPhase("gate");
    };

    const switchToInterior = () => {
      if (!interior) return;

      interior.visible = true;
      if (pantheon) pantheon.visible = false;
      gateRig.visible = false;

      interiorLights.forEach((l) => (l.visible = true));
      hotspot.visible = true;
      incense.visible = true;

      // Trong nội thất chỉ đi bộ ở độ cao WALK_HEIGHT
      controls.walkHeight = WALK_HEIGHT;
      controls.setFlying(false);
      camera.position.copy(INTERIOR_SPAWN);
      camera.lookAt(ALTAR_POSITION);
      controls.speed = INTERIOR_SPEED;

      switched = true;
      switchedAt = flashT;
      phaseLocal = "inside";
      setPhase("inside");
    };

    const abortEnter = () => {
      gateLockT = -1;
      flashT = -1;
      setFlash(false);
      gateRig.visible = false;
      controls.setEnabled(true);
      phaseLocal = "outside";
      setPhase("outside");
    };

    const resetIncense = () => {
      incenseLitLocal = false;
      litFx = 0;
      embers.forEach((e) => (e.visible = false));
      smoke.visible = false;
      glow.intensity = 0;
      setIncenseLit(false);
    };

    const exitInterior = () => {
      if (interior) interior.visible = false;
      if (pantheon) pantheon.visible = true;

      interiorLights.forEach((l) => (l.visible = false));
      hotspot.visible = false;
      incense.visible = false;
      resetIncense();

      // Ra ngoài: đi bộ ở độ cao spawn 10, bay vẫn tắt cho đến khi người dùng bật
      controls.walkHeight = OUTSIDE_HEIGHT;
      controls.setFlying(false);
      setFlying(false);
      camera.position.copy(OUTSIDE_SPAWN);
      camera.lookAt(OUTSIDE_LOOK_AT);
      controls.speed = OUTSIDE_SPEED;

      if (prayerT >= 0) {
        prayerT = -1;
        prayerHands.visible = false;
        setPraying(false);
      }

      gateLockT = -1;
      controls.setEnabled(true);

      nearLocal = false;
      setNearAltar(false);

      phaseLocal = "outside";
      setPhase("outside");
    };

    const lightIncense = () => {
      incenseLitLocal = true;
      litFx = 0;
      embers.forEach((e) => (e.visible = true));
      smoke.visible = true;
      setIncenseLit(true);
    };

    const startPray = () => {
      prayerFrom.copy(camera.quaternion);
      const yaw = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ",
      ).y;
      prayerTo.setFromEuler(new THREE.Euler(PRAYER_HEAD_ANGLE, yaw, 0, "YXZ"));
      prayerT = 0;
      prayerHands.visible = true;
      controls.setEnabled(false);
      setPraying(true);
    };

    const endPray = () => {
      prayerT = -1;
      camera.quaternion.copy(prayerFrom);
      prayerHands.visible = false;
      controls.setEnabled(true);
      setPraying(false);
    };

    // ----------------------------------------
    // 13. RETURN SCENE HANDLE
    // ----------------------------------------
    return {
      update(dt) {
        elapsed += dt;
        const state = live.current;
        const it = intent.current;

        // A. Yêu cầu từ nút bấm và phím tắt
        if (it.fly) {
          it.fly = false;
          // Chỉ cho bật/tắt bay khi đang ở bên ngoài
          if (phaseLocal === "outside") {
            setFlying(controls.toggleFlying());
          }
        }
        if (it.enter) {
          it.enter = false;
          if (phaseLocal === "outside") startEnter();
        }
        if (it.exit) {
          it.exit = false;
          if (phaseLocal === "inside" && prayerT < 0) exitInterior();
        }
        if (it.light) {
          it.light = false;
          if (phaseLocal === "inside" && nearLocal && !incenseLitLocal) {
            lightIncense();
          }
        }
        if (it.pray) {
          it.pray = false;
          if (
            phaseLocal === "inside" &&
            nearLocal &&
            incenseLitLocal &&
            prayerT < 0
          ) {
            startPray();
          }
        }

        // B. Cổng: animation hoặc hạ xuống từ trên cao
        if (phaseLocal === "gate") {
          gateT += dt;

          if (gateMixer) {
            gateMixer.update(dt);
          } else {
            const p = Math.min(gateT / 1.2, 1);
            gateRig.position.y = GATE_DROP_HEIGHT * (1 - easeOutCubic(p));
          }

          if (flashT < 0 && !switched && gateT >= GATE_FLASH_DELAY) {
            flashT = 0;
            setFlash(true);
            playOnce("light");
          }

          if (interiorFailed) abortEnter();
        }

        // C. Lớp sáng và chuyển cảnh
        if (flashT >= 0) {
          flashT += dt;

          if (!switched && flashT >= GATE_SWITCH_OFFSET && interior) {
            switchToInterior();
          }

          if (switched && flashT - switchedAt >= GATE_FLASH_DURATION) {
            flashT = -1;
            setFlash(false);
          }
        }

        // D. Khóa điều khiển 3 giây
        if (gateLockT >= 0) {
          gateLockT += dt;
          if (gateLockT >= GATE_LOCK_DURATION && phaseLocal === "inside") {
            gateLockT = -1;
            controls.setEnabled(true);
          }
        }

        // E. Âm thanh
        const soundAllowed = state.soundOn;
        const outside = phaseLocal === "outside";
        fadeSound(
          "crowd",
          outside && soundAllowed ? SOUND_VOLUME.crowd : 0,
          dt,
        );
        fadeSound(
          "fountain",
          outside && soundAllowed ? SOUND_VOLUME.fountain : 0,
          dt,
        );
        fadeSound(
          "noise",
          phaseLocal === "inside" && soundAllowed ? SOUND_VOLUME.noise : 0,
          dt,
        );

        // F. Di chuyển
        controls.update(dt);

        // G. Khoảng cách tới bàn thờ
        if (phaseLocal === "inside") {
          const dx = camera.position.x - BURNER_WORLD.x;
          const dz = camera.position.z - BURNER_WORLD.z;
          const near = Math.hypot(dx, dz) <= INTERACT_DISTANCE;
          if (near !== nearLocal) {
            nearLocal = near;
            setNearAltar(near);
          }
        }

        // H. Vòng sáng và hiệu ứng nhang
        hotspotMat.opacity = nearLocal
          ? 0.85 + 0.15 * Math.sin(elapsed * 6)
          : 0.4 + 0.2 * Math.sin(elapsed * 2.5);

        if (incenseLitLocal) {
          litFx = Math.min(1, litFx + dt);
          const flicker = Math.sin(elapsed * 13) * 0.08;
          glow.intensity = litFx * (0.7 + flicker);
          const emberScale =
            Math.min(1, litFx + 0.1) * (0.9 + 0.1 * Math.sin(elapsed * 9));
          embers.forEach((e) => e.scale.setScalar(emberScale));

          smokeTime += dt;
          for (let i = 0; i < TOTAL_SMOKE; i++) {
            smokeAge[i] = (smokeAge[i] + dt * 0.22) % 1;
            const a = smokeAge[i];
            const tip = STICK_TIPS[Math.floor(i / PARTICLES_PER_PLUME)];
            const seed = smokeSeed[i];

            smokeArr[i * 3] =
              tip.x + Math.sin(smokeTime * 1.3 + seed) * SMOKE_DRIFT * a;
            smokeArr[i * 3 + 1] = tip.y + a * SMOKE_RISE;
            smokeArr[i * 3 + 2] =
              tip.z + Math.cos(smokeTime * 1.1 + seed) * SMOKE_DRIFT * a;
          }
          smokeGeo.attributes.position.needsUpdate = true;
          smokeMat.opacity = 0.25 + 0.08 * Math.sin(elapsed * 1.5);
        }

        // I. Cầu nguyện (slerp quaternion)
        if (prayerT >= 0) {
          prayerT += dt;

          if (prayerT < 0.8) {
            camera.quaternion.slerpQuaternions(
              prayerFrom,
              prayerTo,
              easeInOut(prayerT / 0.8),
            );
          } else if (prayerT < 2.2) {
            camera.quaternion.copy(prayerTo);
          } else if (prayerT < PRAYER_DURATION) {
            camera.quaternion.slerpQuaternions(
              prayerTo,
              prayerFrom,
              easeInOut(Math.min(1, (prayerT - 2.2) / 0.8)),
            );
          } else {
            endPray();
          }
        }
      },

      dispose() {
        disposed = true;

        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
        window.removeEventListener("keydown", onShortcut);

        controls.dispose();

        (["crowd", "fountain", "noise"] as SoundKey[]).forEach((key) => {
          soundCache[key]?.pause();
        });

        if (pantheon) scene.remove(pantheon);
        if (interior) scene.remove(interior);
        scene.remove(gateRig);

        scene.remove(hotspot, incense, smoke);
        interiorLights.forEach((l) => scene.remove(l));

        camera.remove(prayerHands);

        disposeTree(hotspot);
        disposeTree(incense);
        disposeTree(smoke);
        disposeTree(prayerHands);
        disposeTree(gateRig);
      },
    };
  }, []);

  // ========================================
  // HANDLERS (UI)
  // ========================================

  const onFly = () => {
    if (phase !== "outside") return;
    intent.current.fly = true;
  };

  const onEnter = () => {
    if (phase !== "outside") return;
    playOnce("drop");
    intent.current.enter = true;
  };

  const onExit = () => {
    if (phase !== "inside" || praying) return;
    intent.current.exit = true;
  };

  const onLight = () => {
    intent.current.light = true;
  };

  const onPray = () => {
    intent.current.pray = true;
  };

  const canInteract = phase === "inside" && nearAltar;

  const statusText = (() => {
    if (phase === "outside") {
      return flying
        ? "Đang bay bên ngoài. Nhấn G hoặc nút Bay để quay lại đi bộ."
        : "Nhấp vào khung 3D để điều khiển camera. Nhấn Esc để thoát.";
    }
    if (phase === "gate") return "Cổng Pantheon đang mở...";
    if (praying) return "Đang cầu nguyện...";
    if (!nearAltar) {
      return "Di chuyển đến vòng sáng trên bàn thờ để thắp nhang và cầu nguyện.";
    }
    if (!incenseLit) {
      return "Bạn đang đứng trước bàn thờ. Nhấn E hoặc nút Thắp nhang.";
    }
    return "Nhang đã cháy. Nhấn F hoặc nút Cầu nguyện.";
  })();

  return (
    <div>
      <ThreeCanvas init={init} />

      {flash && <div className="pantheon-flash" />}

      <div className="scene-toolbar scene-toolbar--row">
        <button
          className="button secondary"
          onClick={onFly}
          disabled={phase !== "outside"}
        >
          {flying ? "Tắt bay (G)" : "Bật bay (G)"}
        </button>

        <button
          className="button secondary"
          onClick={() => setSoundOn((v) => !v)}
        >
          {soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
        </button>

        <button
          className="button primary"
          onClick={onEnter}
          disabled={phase !== "outside"}
        >
          {phase === "gate" ? "Đang mở cổng..." : "Di chuyển vào bên trong"}
        </button>

        <button
          className="button secondary"
          onClick={onExit}
          disabled={phase !== "inside" || praying}
        >
          Quay lại bên ngoài
        </button>

        <button
          className="button primary"
          onClick={onLight}
          disabled={!canInteract || incenseLit}
        >
          {incenseLit ? "Nhang đang cháy" : "Thắp nhang (E)"}
        </button>

        <button
          className="button primary"
          onClick={onPray}
          disabled={!canInteract || !incenseLit || praying}
        >
          {praying ? "Đang cầu nguyện..." : "Cầu nguyện (F)"}
        </button>
      </div>

      <p className="scene-status">{statusText}</p>

      <p className="scene-note">
        Bên ngoài: W A S D để đi bộ ở độ cao 10m. Nhấn G hoặc nút Bay để bật chế
        độ bay, khi đó Space lên, Shift xuống. Ctrl để tăng tốc. Bên trong chỉ
        đi bộ ở độ cao 3m. Khi chuột đang khóa (sau khi nhấp vào khung 3D), dùng
        phím E, F, G thay cho nút bấm.
      </p>
    </div>
  );
}
