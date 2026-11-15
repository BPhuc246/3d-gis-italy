import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";

import ThreeCanvas, {
  type SceneEnv,
  type SceneHandle,
} from "../shared/ThreeCanvas";
import { useLoopAudio } from "../shared/useLoopAudio";
import { CreativeFlyController } from "../shared/CreativeFlyController";
import { CombatController } from "../shared/CombatController";
import {
  loadFirstAvailable,
  makeGround,
  prepareModel,
} from "../shared/ModelLoader";
import { playSfx } from "../shared/sfx";
import { MODEL_ASSETS } from "../config/modelAssets";
import { AUDIO } from "../config/audioAssets";
import CombatUI from "./combat/CombatUI";
import { LionAI, type LionState } from "./combat/LionAI";

type CombatResult = "victory" | "defeat" | null;

const CREATIVE_HOME = new THREE.Vector3(0, 80, -10);
const START_POSITION = new THREE.Vector3(0, 20, -8);

// Đĩa tròn lơ lửng là sàn chiến đấu
const PLATFORM_CENTER = { x: 10, z: -20 };
const PLATFORM_RADIUS = 15;
const PLATFORM_THICKNESS = 0.8;
const PLATFORM_TOP = START_POSITION.y - 1.7;
const EYE_HEIGHT = 1.7;
const PLATFORM_EYE = PLATFORM_TOP + EYE_HEIGHT;

// Bức tường vô hình: người chơi và sư tử không vượt quá các bán kính này
const PLAYER_BODY_RADIUS = 0.5;
const PLAYER_WALL = PLATFORM_RADIUS - PLAYER_BODY_RADIUS;
const LION_BODY_RADIUS = 1.2;
const LION_WALL = PLATFORM_RADIUS - LION_BODY_RADIUS;

const PLAYER_HITS_TO_WIN = 5;
const LION_HITS_TO_LOSE = 2;

// Truy cập nội bộ: chiều cao mắt của bộ điều khiển chiến đấu và gốc của sư tử
type EyeHeightAccess = { eyeHeight: number };
type LionRootAccess = { root: THREE.Object3D };

// Giữ vật thể trong đĩa: nếu vượt bán kính thì kéo về biên đĩa (bức tường vô hình)
function keepOnDisc(obj: THREE.Object3D, radius: number) {
  const dx = obj.position.x - PLATFORM_CENTER.x;
  const dz = obj.position.z - PLATFORM_CENTER.z;
  const d = Math.hypot(dx, dz);
  if (d > radius && d > 1e-6) {
    const k = radius / d;
    obj.position.x = PLATFORM_CENTER.x + dx * k;
    obj.position.z = PLATFORM_CENTER.z + dz * k;
  }
}

// CSS riêng để canvas lấp đầy khung ngang, ghi đè min-height 500px trong CombatUI.css
const sceneCss = `
.colosseum-scene .three-host {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
}
.colosseum-scene canvas {
  display: block;
  width: 100%;
  height: 100%;
}
`;

// Khung ngang 16:9, tối đa 70% chiều cao màn hình
const wrapperStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, calc(70vh * 16 / 9))",
  aspectRatio: "16 / 9",
  minHeight: 300,
  margin: "0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
  borderRadius: 12,
  background: "#151312",
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

const buttonStyle: CSSProperties = {
  whiteSpace: "nowrap",
  maxWidth: "100%",
};

export default function ColosseumScene({
  audioUrl,
}: {
  audioUrl: string | null;
}) {
  const [helmetOn, setHelmetOn] = useState(false);
  const [combatMode, setCombatMode] = useState(false);
  const [playerHits, setPlayerHits] = useState(0);
  const [lionHits, setLionHits] = useState(0);
  const [blocking, setBlocking] = useState(false);
  const [lionState, setLionState] = useState<LionState>("IDLE");
  const [combatResult, setCombatResult] = useState<CombatResult>(null);
  const [combatSession, setCombatSession] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);

  const audio = useLoopAudio(audioUrl);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lionRef = useRef<LionAI | null>(null);

  // init chỉ chạy một lần, nên mọi trạng thái React mà vòng lặp 3D cần đều đi qua ref
  const live = useRef({ helmetOn, combatMode, combatResult, combatSession });
  live.current = { helmetOn, combatMode, combatResult, combatSession };

  // Điều kiện thắng thua
  useEffect(() => {
    if (!combatMode || combatResult) return;
    if (playerHits >= PLAYER_HITS_TO_WIN) setCombatResult("victory");
    else if (lionHits >= LION_HITS_TO_LOSE) setCombatResult("defeat");
  }, [playerHits, lionHits, combatMode, combatResult]);

  // Khi có kết quả: phát nhạc, cập nhật sư tử, thả chuột để bấm được nút
  useEffect(() => {
    if (!combatResult) return;
    playSfx(combatResult === "victory" ? AUDIO.victory : AUDIO.defeat, 1);
    lionRef.current?.finish(combatResult);
    if (document.pointerLockElement) document.exitPointerLock();
  }, [combatResult]);

  const init = (env: SceneEnv): SceneHandle => {
    const { scene, camera, renderer, mobile } = env;

    canvasRef.current = renderer.domElement;

    scene.background = new THREE.Color("#151312");
    scene.fog = new THREE.Fog("#151312", 60, 200);
    scene.add(new THREE.HemisphereLight("#8c8275", "#211a14", 0.6));

    const sun = new THREE.DirectionalLight("#a3978b", 1.2);
    sun.position.set(-35, 65, 30);
    sun.castShadow = !mobile;
    scene.add(sun);

    scene.add(makeGround(230, "#8c7961"));

    scene.add(camera);
    camera.position.copy(CREATIVE_HOME);
    camera.rotation.order = "YXZ";
    camera.lookAt(0, 0, 0);

    let disposed = false;
    let loadedArchitecture: THREE.Object3D | null = null;

    void loadFirstAvailable(MODEL_ASSETS.colosseum.architecture)
      .then(({ root }) => {
        if (disposed) return;
        prepareModel(root, 48);
        scene.add(root);
        loadedArchitecture = root;
      })
      .catch(() => {
        console.warn("Không tìm thấy colosseum.glb");
      });

    // Đĩa tròn lơ lửng, chỉ hiện trong chế độ chiến đấu
    const platform = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(
        PLATFORM_RADIUS,
        PLATFORM_RADIUS * 0.96,
        PLATFORM_THICKNESS,
        64,
      ),
      new THREE.MeshStandardMaterial({ color: "#b9a88a", roughness: 0.85 }),
    );
    disc.position.y = -PLATFORM_THICKNESS / 2;
    disc.castShadow = true;
    disc.receiveShadow = true;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(PLATFORM_RADIUS, 0.08, 8, 96),
      new THREE.MeshStandardMaterial({
        color: "#e0c48a",
        metalness: 0.6,
        roughness: 0.4,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    platform.add(disc, rim);
    platform.position.set(PLATFORM_CENTER.x, PLATFORM_TOP, PLATFORM_CENTER.z);
    platform.visible = false;
    scene.add(platform);

    // Mũ giác đấu gắn vào camera
    const helmetRig = new THREE.Group();
    helmetRig.position.set(0, 5, 0.05);
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
      .catch(() => {
        console.warn("Không tìm thấy gladiator_helmet.glb");
      });

    // Điều khiển
    const creative = new CreativeFlyController(camera, renderer.domElement);
    creative.speed = 10;
    creative.boostSpeed = 30;

    const combat = new CombatController(camera, renderer.domElement, {
      onAttack() {
        lionRef.current?.tryHit();
      },
      onBlockChange(value) {
        setBlocking(value);
      },
    });
    combat.setEnabled(false);

    const lion = new LionAI(scene, camera, {
      onPlayerHit() {
        setLionHits((prev) => Math.min(LION_HITS_TO_LOSE, prev + 1));
        playSfx(AUDIO.lionHitPlayer);
      },
      onPlayerBlocked() {
        playSfx(AUDIO.playerBlock);
      },
      onLionHit() {
        setPlayerHits((prev) => Math.min(PLAYER_HITS_TO_WIN, prev + 1));
        playSfx(AUDIO.playerHitLion);
      },
      onLionGuard() {
        playSfx(AUDIO.lionGuard);
      },
      onStateChange(state) {
        setLionState(state);
      },
    });
    lionRef.current = lion;

    const arenaCenter = new THREE.Vector2(PLATFORM_CENTER.x, PLATFORM_CENTER.z);
    combat.arenaCenter = arenaCenter;
    combat.arenaRadius = PLAYER_WALL;
    lion.arenaCenter = arenaCenter;
    lion.arenaRadius = LION_WALL;

    const lionRoot = () => (lion as unknown as LionRootAccess).root;

    // Theo dõi trạng thái trước đó để chỉ gọi hàm bật/tắt khi có thay đổi
    let lastSession = 0;
    let lastCombatMode = false;
    let lastFighting = false;
    let lastLocked = false;
    let helmetProgress = 0;
    const ease = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

    return {
      update(dt) {
        const state = live.current;

        if (state.combatSession !== lastSession) {
          lastSession = state.combatSession;
          // Sàn là đĩa, nên chiều cao mắt tính theo mặt đĩa
          (combat as unknown as EyeHeightAccess).eyeHeight = PLATFORM_EYE;
          combat.reset(START_POSITION);
          lion.start();
          lionRoot().position.y = PLATFORM_TOP;
        }

        if (state.combatMode !== lastCombatMode) {
          lastCombatMode = state.combatMode;
          creative.setEnabled(!state.combatMode);
          platform.visible = state.combatMode;
          if (!state.combatMode) {
            lion.hide();
            camera.position.copy(CREATIVE_HOME);
            camera.lookAt(0, 0, 0);
          }
        }

        const fighting = state.combatMode && !state.combatResult;
        if (fighting !== lastFighting) {
          lastFighting = fighting;
          combat.setEnabled(fighting);
        }

        const locked = combat.isPointerLocked;
        if (locked !== lastLocked) {
          lastLocked = locked;
          setPointerLocked(locked);
        }

        // Mất khóa chuột (ví dụ bấm Esc) thì tạm dừng cả người chơi lẫn sư tử
        const paused = fighting && !locked;

        if (fighting && !paused) combat.update(dt);
        creative.update(dt);
        lion.update(paused ? 0 : dt, combat.isBlocking);

        // Bức tường vô hình: người chơi và sư tử không ra khỏi đĩa
        if (fighting) {
          keepOnDisc(camera, PLAYER_WALL);
          keepOnDisc(lionRoot(), LION_WALL);
        }

        helmetProgress +=
          ((state.helmetOn ? 1 : 0) - helmetProgress) * ease(dt, 5);
        helmetRig.visible = helmetProgress > 0.02;
        helmetRig.position.y = 0.65 - helmetProgress * 0.78;
      },

      dispose() {
        disposed = true;
        creative.dispose();
        combat.dispose();
        lion.dispose();
        lionRef.current = null;
        camera.remove(helmetRig);
        if (loadedArchitecture) scene.remove(loadedArchitecture);
        canvasRef.current = null;
      },
    };
  };

  const startCombat = () => {
    if (combatMode && !combatResult) return;

    setPlayerHits(0);
    setLionHits(0);
    setBlocking(false);
    setLionState("IDLE");
    setCombatResult(null);
    setCombatMode(true);
    setCombatSession((prev) => prev + 1);

    playSfx(AUDIO.beep, 0.8);

    // Khóa chuột ngay trong thao tác click
    void Promise.resolve(canvasRef.current?.requestPointerLock()).catch(
      () => undefined,
    );
  };

  const exitCombat = () => {
    setCombatMode(false);
    setCombatResult(null);
    setBlocking(false);
    setPlayerHits(0);
    setLionHits(0);
    setLionState("IDLE");
    if (document.pointerLockElement) document.exitPointerLock();
  };

  return (
    <div className="colosseum-scene" style={wrapperStyle}>
      <style>{sceneCss}</style>
      <ThreeCanvas init={init} />

      <div style={controlStackStyle}>
        {!combatMode && (
          <button
            className="button secondary"
            style={buttonStyle}
            onClick={() => setHelmetOn((prev) => !prev)}
          >
            {helmetOn ? "Nâng mũ lên" : "Đội mũ giác đấu"}
          </button>
        )}

        {audio.available && audio.blocked && (
          <button
            className="button secondary"
            style={buttonStyle}
            onClick={() => void audio.play()}
          >
            🔊 Bật âm thanh đám đông
          </button>
        )}

        {audio.available && audio.playing && (
          <button
            className="button secondary"
            style={buttonStyle}
            onClick={() => void audio.pause()}
          >
            🔇 Tắt âm thanh đám đông
          </button>
        )}
      </div>

      <CombatUI
        active={combatMode}
        playerHits={playerHits}
        lionHits={lionHits}
        blocking={blocking}
        lionState={lionState}
        paused={combatMode && !combatResult && !pointerLocked}
        result={combatResult}
        onStart={startCombat}
        onRestart={startCombat}
        onExit={exitCombat}
      />

      <p
        className="scene-note"
        style={{ maxWidth: "95%", boxSizing: "border-box" }}
      >
        {combatMode
          ? "Combat Mode: WASD di chuyển · Space nhảy · Shift chạy · Chuột trái đánh · Chuột phải giữ để chặn."
          : "Creative Mode: Click màn hình để điều khiển camera · WASD di chuyển · Space bay lên · Shift bay xuống · Ctrl tăng tốc · ESC thả chuột."}
        {!audio.available
          ? " Chưa có audioUrl (feature_key: crowd_audio)."
          : ""}
      </p>
    </div>
  );
}
