import { useRef, useState } from "react";
import * as THREE from "three";

import ThreeCanvas, {
  type SceneEnv,
  type SceneHandle,
} from "../shared/ThreeCanvas";

import { FirstPersonController } from "../shared/FirstPersonController";

import {
  loadFirstAvailable,
  makeGround,
  prepareModel,
} from "../shared/ModelLoader";

import { MODEL_ASSETS } from "../config/modelAssets";
import MemorialCandle from "../shared/MemorialCandle";

const OCULUS_RADIUS = 4.5;
const DROP_COUNT = 1200;

// ========================================
// CẤU HÌNH KHU VỰC PANTHEON INTERIOR
// ========================================

// Vị trí camera khi vừa đi vào bên trong.
// Cần điều chỉnh theo tọa độ thực tế của model.
const INTERIOR_SPAWN = new THREE.Vector3(0, 1.7, 10);

// Vị trí bàn thờ trong model interior.
// Cần điều chỉnh theo tọa độ thực tế của model.
const ALTAR_POSITION = new THREE.Vector3(0, 1.7, -8);

// Khoảng cách tối đa để hiện nút cầu nguyện.
const PRAY_DISTANCE = 3.5;

// Đường dẫn model nội thất.
const INTERIOR_MODEL_PATH = "/models/pantheon/pantheon_interior.glb";

// Thời gian thực hiện nghi thức cầu nguyện.
const PRAYER_DURATION = 3;

// Góc cúi đầu khi cầu nguyện.
const PRAYER_HEAD_ANGLE = -0.55;

export default function PantheonScene() {
  // ========================================
  // UI STATES
  // ========================================

  const [lookUp, setLookUp] = useState(false);
  const [inside, setInside] = useState(false);
  const [interiorLoading, setInteriorLoading] = useState(false);
  const [canPray, setCanPray] = useState(false);
  const [praying, setPraying] = useState(false);

  // Dùng ref để lấy state mới nhất trong animation loop.
  const live = useRef({
    lookUp,
    inside,
    praying,
  });

  live.current = {
    lookUp,
    inside,
    praying,
  };

  // ========================================
  // THREE.JS INITIALIZATION
  // ========================================

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile, reduced } = env;

    // ----------------------------------------
    // 1. SCENE LIGHTING
    // ----------------------------------------

    scene.background = new THREE.Color("#202329");

    scene.add(new THREE.HemisphereLight("#fff5e3", "#504b45", 1.15));

    const sun = new THREE.DirectionalLight("#fff1d4", 2.7);

    sun.position.set(5, 75, 6);
    sun.castShadow = !mobile;

    scene.add(sun);

    scene.add(makeGround(100, "#b8ad99"));

    // Thêm camera vào scene.
    scene.add(camera);

    let disposed = false;

    // Model kiến trúc bên ngoài.
    let pantheon: THREE.Object3D | null = null;

    // Model nội thất.
    let interior: THREE.Object3D | null = null;

    // Trạng thái tải model nội thất.
    let interiorLoadStarted = false;

    // Trạng thái thực tế của khu vực.
    let wasInside = false;

    // Theo dõi trạng thái gần bàn thờ.
    let lastCanPray = false;

    // ========================================
    // 2. LOAD PANTHEON EXTERIOR
    // ========================================

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

    // ========================================
    // 3. OCULUS LIGHT SHAFT
    // ========================================

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(OCULUS_RADIUS, OCULUS_RADIUS, 42, 32, 1, true),

      new THREE.MeshBasicMaterial({
        color: "#fff0c6",
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );

    shaft.position.y = 21;

    scene.add(shaft);

    // ========================================
    // 4. RAIN PARTICLES
    // ========================================

    const positions = new Float32Array(DROP_COUNT * 3);
    const speeds = new Float32Array(DROP_COUNT);

    const respawn = (i: number, randomHeight: boolean) => {
      const a = Math.random() * Math.PI * 2;

      const r = Math.sqrt(Math.random()) * OCULUS_RADIUS;

      positions[i * 3] = Math.cos(a) * r;

      positions[i * 3 + 1] = randomHeight ? Math.random() * 36 : 36;

      positions[i * 3 + 2] = Math.sin(a) * r;

      speeds[i] = 12 + Math.random() * 9;
    };

    for (let i = 0; i < DROP_COUNT; i++) {
      respawn(i, true);
    }

    const rainGeometry = new THREE.BufferGeometry();

    rainGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const rain = new THREE.Points(
      rainGeometry,

      new THREE.PointsMaterial({
        color: "#d8e9ff",
        size: 0.075,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      }),
    );

    scene.add(rain);

    // ========================================
    // 5. CAMERA INITIAL POSITION
    // ========================================

    camera.position.set(10, 6, 34);

    camera.rotation.order = "YXZ";

    // ========================================
    // 6. FIRST PERSON CONTROLLER
    // ========================================

    const controls = new FirstPersonController(camera, renderer.domElement, {
      minX: -45,
      maxX: 45,
      minZ: -45,
      maxZ: 45,
    });

    controls.speed = 6;

    // ========================================
    // 7. PRAYER HANDS
    // ========================================

    const prayerHands = new THREE.Group();

    const handMaterial = new THREE.MeshStandardMaterial({
      color: "#c99b7b",
      roughness: 0.8,
    });

    // Hai lòng bàn tay tượng trưng.
    const palmGeometry = new THREE.CapsuleGeometry(0.09, 0.32, 4, 8);

    const leftHand = new THREE.Mesh(palmGeometry, handMaterial);

    leftHand.position.set(-0.075, 0, 0);
    leftHand.rotation.z = -0.12;

    const rightHand = new THREE.Mesh(palmGeometry, handMaterial);

    rightHand.position.set(0.075, 0, 0);
    rightHand.rotation.z = 0.12;

    prayerHands.add(leftHand, rightHand);

    // Đặt hai bàn tay trước camera.
    prayerHands.position.set(0, -0.48, -0.85);
    prayerHands.rotation.x = -0.25;
    prayerHands.visible = false;

    camera.add(prayerHands);

    // ========================================
    // 8. PRAYER ANIMATION VARIABLES
    // ========================================

    let prayerElapsed = -1;
    let prayerStartRotation = 0;

    // ========================================
    // 9. LOAD INTERIOR MODEL
    // ========================================

    const loadInterior = async () => {
      if (interiorLoadStarted || interior) return;

      interiorLoadStarted = true;

      setInteriorLoading(true);

      try {
        const { root } = await loadFirstAvailable([INTERIOR_MODEL_PATH]);

        if (disposed) return;

        // Chuẩn hóa kích thước model.
        // Có thể cần thay đổi giá trị này tùy model thực tế.
        prepareModel(root, 43.3);

        interior = root;

        scene.add(root);

        // Ẩn kiến trúc bên ngoài.
        if (pantheon) {
          pantheon.visible = false;
        }

        // Chuyển camera vào vị trí xuất phát.
        camera.position.copy(INTERIOR_SPAWN);

        camera.rotation.set(0, 0, 0);

        camera.rotation.order = "YXZ";

        wasInside = true;

        setInteriorLoading(false);
      } catch (error) {
        console.error("Không thể tải pantheon_interior.glb:", error);

        setInteriorLoading(false);

        setInside(false);

        interiorLoadStarted = false;
      }
    };

    // ========================================
    // 10. RETURN SCENE HANDLE
    // ========================================

    return {
      update(dt) {
        const state = live.current;

        // ------------------------------------
        // A. OCULUS EFFECTS
        // ------------------------------------

        shaft.visible = state.lookUp && !state.inside;

        rain.visible = state.lookUp && !state.inside && !reduced;

        if (rain.visible) {
          for (let i = 0; i < DROP_COUNT; i++) {
            positions[i * 3 + 1] -= speeds[i] * dt;

            if (positions[i * 3 + 1] < 0) {
              respawn(i, false);
            }
          }

          rainGeometry.attributes.position.needsUpdate = true;
        }

        // ------------------------------------
        // B. ENTER INTERIOR
        // ------------------------------------

        if (state.inside && !wasInside && !interior) {
          void loadInterior();
        }

        // ------------------------------------
        // C. RETURN TO EXTERIOR
        // ------------------------------------

        if (!state.inside && wasInside) {
          // Ẩn model nội thất.
          if (interior) {
            interior.visible = false;
          }

          // Hiện lại model bên ngoài.
          if (pantheon) {
            pantheon.visible = true;
          }

          // Trả camera về vị trí bên ngoài.
          camera.position.set(10, 6, 34);

          camera.rotation.set(0, 0, 0);

          // Ẩn bàn tay cầu nguyện.
          prayerHands.visible = false;

          // Reset trạng thái cầu nguyện.
          prayerElapsed = -1;

          wasInside = false;

          lastCanPray = false;

          setCanPray(false);

          if (state.praying) {
            setPraying(false);
          }
        }

        // ------------------------------------
        // D. UPDATE FIRST PERSON CONTROLLER
        // ------------------------------------

        controls.update(dt);

        // ------------------------------------
        // E. CHECK ALTAR DISTANCE
        // ------------------------------------

        if (state.inside && interior && wasInside) {
          const distance = camera.position.distanceTo(ALTAR_POSITION);

          const nearAltar = distance <= PRAY_DISTANCE;

          if (nearAltar !== lastCanPray) {
            lastCanPray = nearAltar;

            setCanPray(nearAltar);
          }
        }

        // ------------------------------------
        // F. PRAYER ANIMATION
        // ------------------------------------

        if (state.praying && prayerElapsed < 0 && state.inside && lastCanPray) {
          prayerElapsed = 0;

          prayerStartRotation = camera.rotation.x;

          prayerHands.visible = true;
        }

        if (prayerElapsed >= 0) {
          prayerElapsed += dt;

          // Giai đoạn 1: Cúi đầu.
          if (prayerElapsed <= 0.8) {
            const t = prayerElapsed / 0.8;

            camera.rotation.x = THREE.MathUtils.lerp(
              prayerStartRotation,
              PRAYER_HEAD_ANGLE,
              t,
            );
          }

          // Giai đoạn 2: Giữ tư thế cầu nguyện.
          else if (prayerElapsed <= 2.2) {
            camera.rotation.x = PRAYER_HEAD_ANGLE;
          }

          // Giai đoạn 3: Ngẩng đầu.
          else if (prayerElapsed <= PRAYER_DURATION) {
            const t = (prayerElapsed - 2.2) / 0.8;

            camera.rotation.x = THREE.MathUtils.lerp(
              PRAYER_HEAD_ANGLE,
              prayerStartRotation,
              t,
            );
          }

          // Giai đoạn 4: Kết thúc.
          else {
            camera.rotation.x = prayerStartRotation;

            prayerElapsed = -1;

            prayerHands.visible = false;

            setPraying(false);
          }
        }
      },

      // ========================================
      // DISPOSE
      // ========================================

      dispose() {
        disposed = true;

        controls.dispose();

        if (pantheon) {
          scene.remove(pantheon);
        }

        if (interior) {
          scene.remove(interior);
        }

        scene.remove(shaft);
        scene.remove(rain);

        camera.remove(prayerHands);

        palmGeometry.dispose();
        handMaterial.dispose();

        shaft.geometry.dispose();

        if (Array.isArray(shaft.material)) {
          shaft.material.forEach((material) => material.dispose());
        } else {
          shaft.material.dispose();
        }

        rainGeometry.dispose();

        if (Array.isArray(rain.material)) {
          rain.material.forEach((material) => material.dispose());
        } else {
          rain.material.dispose();
        }
      },
    };
  };

  // ========================================
  // 11. UI
  // ========================================

  return (
    <div>
      <ThreeCanvas init={init} />

      <div className="scene-toolbar">
        {!inside ? (
          <>
            <button
              className="button secondary"
              onClick={() => setLookUp((v) => !v)}
            >
              {lookUp
                ? "Tắt hiệu ứng Oculus"
                : "Bật hiệu ứng Oculus (Ánh sáng & Mưa)"}
            </button>

            <button
              className="button primary"
              onClick={() => setInside(true)}
              disabled={interiorLoading}
            >
              {interiorLoading
                ? "Đang tải nội thất..."
                : "Di chuyển vào bên trong"}
            </button>
          </>
        ) : (
          <>
            <button
              className="button secondary"
              onClick={() => setInside(false)}
            >
              Quay lại bên ngoài
            </button>

            {canPray && (
              <button
                className="button primary"
                onClick={() => setPraying(true)}
                disabled={praying}
              >
                {praying ? "Đang cầu nguyện..." : "Cầu nguyện"}
              </button>
            )}
          </>
        )}
      </div>

      <p className="scene-note">
        {inside
          ? "Bên trong Pantheon: Dùng WASD để di chuyển và kéo chuột để quan sát 360°. Tiến đến gần bàn thờ để thực hiện nghi thức cầu nguyện."
          : "Bên ngoài Pantheon: Nhấp chuột và kéo để nhìn xung quanh 360°. Dùng phím WASD để di chuyển tự do."}
      </p>

      <MemorialCandle slug="pantheon" onLit={() => {}} />
    </div>
  );
}
