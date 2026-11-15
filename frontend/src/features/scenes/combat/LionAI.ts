import * as THREE from "three";
import { loadFirstAvailable, prepareModel } from "../../shared/ModelLoader";
import { playSfx } from "../../shared/sfx";
import { MODEL_ASSETS } from "../../config/modelAssets";
import { AUDIO } from "../../config/audioAssets";

export type LionState =
  | "IDLE"
  | "ROAR"
  | "CHARGE"
  | "GUARD"
  | "SCRATCH"
  | "RECOVER"
  | "HURT"
  | "DEAD";

export type LionCallbacks = {
  onPlayerHit: () => void; // sư tử đánh trúng người chơi
  onPlayerBlocked: () => void; // người chơi chặn thành công
  onLionHit: () => void; // người chơi đánh trúng sư tử
  onLionGuard: () => void; // sư tử thủ, đòn của người chơi bị chặn
  onStateChange: (state: LionState) => void;
};

// Thông số (đơn vị: mét, trên mặt phẳng đấu trường)
const LION_HEIGHT = 2.2;
const SPAWN_POINT = new THREE.Vector3(0, 0, -12);
// Đổi thành Math.PI nếu sư tử quay đầu ra phía sau khi di chuyển
const MODEL_YAW_OFFSET = 0;

const IDLE_FIRST = 1.5;
const IDLE_MIN = 1.0;
const IDLE_RANDOM = 1.5;
const ROAR_TIME = 2.0; // gầm 2 giây rồi mới tông
const CHARGE_SPEED = 13;
const CHARGE_MAX_TIME = 2.0;
const CHARGE_ARRIVE = 0.6; // đã tới vị trí đích
const CHARGE_IMPACT = 1.8; // khoảng cách va chạm khi tông
const GUARD_TIME = 1.2;
const SCRATCH_TIME = 0.9;
const SCRATCH_IMPACT_AT = 0.45; // thời điểm móng vuốt chạm
const SCRATCH_REACH = 2.4;
const HURT_TIME = 0.6;
const RECOVER_TIME = 0.7;
const PLAYER_REACH = 3.2; // tầm đánh của người chơi
const PLAYER_FRONT_DOT = 0.15; // người chơi phải nhìn về phía sư tử
const HIT_COOLDOWN = 0.45;

type Gesture = {
  pitch: number;
  roll: number;
  squash: number;
  lunge: number;
  lift: number;
};
const REST_GESTURE: Gesture = {
  pitch: 0,
  roll: 0,
  squash: 1,
  lunge: 0,
  lift: 0,
};

export class LionAI {
  private scene: THREE.Scene;
  private player: THREE.PerspectiveCamera;
  private callbacks: LionCallbacks;

  arenaCenter = new THREE.Vector2(0, 0);
  arenaRadius = 16;
  // root: vị trí và hướng trong đấu trường. pivot: cử chỉ (ngửa đầu, cúi, lao, nằm xuống).
  private root = new THREE.Group();
  private pivot = new THREE.Group();
  private placeholder: THREE.Group | null = null;

  private state: LionState = "IDLE";
  private timer = 0; // đếm ngược thời gian còn lại của trạng thái
  private elapsed = 0; // thời gian đã trôi qua của trạng thái
  private hitCooldown = 0;
  private impactDone = false;
  private target = new THREE.Vector3();

  private active = false;
  private loaded = false;
  private pendingStart = false;
  private disposed = false;

  private gesture: Gesture = { ...REST_GESTURE };
  private gestureTarget: Gesture = { ...REST_GESTURE };

  constructor(
    scene: THREE.Scene,
    player: THREE.PerspectiveCamera,
    callbacks: LionCallbacks,
  ) {
    this.scene = scene;
    this.player = player;
    this.callbacks = callbacks;

    this.pivot.add(this.buildPlaceholder());
    this.root.add(this.pivot);
    this.root.position.copy(SPAWN_POINT);
    this.root.visible = false;
    this.scene.add(this.root);

    void this.loadModel();
  }

  get currentState() {
    return this.state;
  }

  // Hình tạm khi chưa có lion.glb, để vẫn chơi được
  private buildPlaceholder() {
    const fur = new THREE.MeshStandardMaterial({
      color: "#b8864a",
      roughness: 0.9,
    });
    const mane = new THREE.MeshStandardMaterial({
      color: "#5a3a1e",
      roughness: 1,
    });
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 1.1, 6, 12),
      fur,
    );
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.95, 0);
    group.add(body);

    for (const x of [-0.22, 0.22]) {
      for (const z of [-0.4, 0.4]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8),
          fur,
        );
        leg.position.set(x, 0.45, z);
        group.add(leg);
      }
    }

    const mainMane = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12),
      mane,
    );
    mainMane.position.set(0, 1.4, 0.55);
    group.add(mainMane);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), fur);
    head.position.set(0, 1.4, 0.95);
    group.add(head);

    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    this.placeholder = group;
    return group;
  }

  private async loadModel() {
    try {
      const { root } = await loadFirstAvailable(MODEL_ASSETS.lion);
      if (this.disposed) return;
      prepareModel(root, LION_HEIGHT);
      this.pivot.add(root);
      if (this.placeholder) {
        this.pivot.remove(this.placeholder);
        this.placeholder = null;
      }
    } catch (error) {
      console.warn("Không tải được lion.glb, dùng hình tạm thời:", error);
    }

    if (this.disposed) return;
    this.loaded = true;
    if (this.pendingStart) {
      this.pendingStart = false;
      this.start();
    }
  }

  start() {
    if (this.disposed) return;
    if (!this.loaded) {
      this.pendingStart = true;
      return;
    }

    this.active = true;
    this.root.visible = true;
    this.root.position.copy(SPAWN_POINT);
    this.faceTowards(this.player.position, 1, 1000);

    this.gesture = { ...REST_GESTURE };
    this.gestureTarget = { ...REST_GESTURE };
    this.hitCooldown = 0;
    this.changeState("IDLE", IDLE_FIRST);
  }

  hide() {
    this.active = false;
    this.pendingStart = false;
    this.root.visible = false;
  }

  finish(result: "victory" | "defeat") {
    this.active = false;
    if (result === "victory") this.changeState("DEAD");
  }

  // Người chơi đánh: trả về true nếu đòn trúng sư tử
  tryHit(): boolean {
    if (!this.active || !this.loaded || this.state === "DEAD") return false;
    if (this.hitCooldown > 0) return false;

    const dx = this.root.position.x - this.player.position.x;
    const dz = this.root.position.z - this.player.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > PLAYER_REACH || dist < 1e-4) return false;

    const forward = new THREE.Vector3();
    this.player.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) return false;
    forward.normalize();

    if (forward.x * (dx / dist) + forward.z * (dz / dist) < PLAYER_FRONT_DOT) {
      return false;
    }

    // Sư tử đang gầm hoặc lao thì không bị đánh trúng
    if (this.state === "ROAR" || this.state === "CHARGE") return false;

    this.hitCooldown = HIT_COOLDOWN;

    if (this.state === "GUARD") {
      this.callbacks.onLionGuard();
      return false;
    }

    // Đòn trúng: sư tử choáng và hủy đòn đang chuẩn bị (nếu có)
    this.callbacks.onLionHit();
    this.changeState("HURT", HURT_TIME);
    return true;
  }

  update(dt: number, blocking: boolean) {
    if (!this.loaded || this.disposed) return;

    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (this.active) this.tick(dt, blocking);
    this.applyGesture(dt);
  }

  private tick(dt: number, blocking: boolean) {
    this.timer -= dt;
    this.elapsed += dt;
    const player = this.player.position;

    switch (this.state) {
      case "IDLE": {
        this.faceTowards(player, dt);
        if (this.timer <= 0) this.changeState("ROAR", ROAR_TIME);
        break;
      }

      case "ROAR": {
        this.faceTowards(player, dt);
        if (this.timer <= 0) this.changeState("CHARGE", CHARGE_MAX_TIME);
        break;
      }

      case "CHARGE": {
        // Lao thẳng về vị trí người chơi đã đứng lúc bắt đầu lao
        const toTarget = new THREE.Vector3().subVectors(
          this.target,
          this.root.position,
        );
        toTarget.y = 0;
        const remaining = toTarget.length();

        this.faceTowards(this.target, dt, 10);

        if (remaining > CHARGE_ARRIVE) {
          toTarget.multiplyScalar(1 / remaining);
          this.root.position.addScaledVector(
            toTarget,
            Math.min(CHARGE_SPEED * dt, remaining),
          );
        }

        if (!this.impactDone && this.distanceToPlayer() <= CHARGE_IMPACT) {
          this.impactDone = true;
          this.landHit(blocking);
        }

        if (remaining <= CHARGE_ARRIVE || this.timer <= 0) {
          // Sau khi lao, ngẫu nhiên thủ hoặc cào
          if (Math.random() < 0.5) this.changeState("GUARD", GUARD_TIME);
          else this.changeState("SCRATCH", SCRATCH_TIME);
        }
        break;
      }

      case "GUARD": {
        this.faceTowards(player, dt);
        if (this.timer <= 0) this.changeState("RECOVER", RECOVER_TIME);
        break;
      }

      case "SCRATCH": {
        this.faceTowards(player, dt, 5);
        if (!this.impactDone && this.elapsed >= SCRATCH_IMPACT_AT) {
          this.impactDone = true;
          if (this.distanceToPlayer() <= SCRATCH_REACH) this.landHit(blocking);
        }
        if (this.timer <= 0) this.changeState("RECOVER", RECOVER_TIME);
        break;
      }

      case "HURT": {
        // Lùi nhẹ ra sau khi bị đánh
        const away = new THREE.Vector3().subVectors(this.root.position, player);
        away.y = 0;
        if (away.lengthSq() > 1e-4) {
          away.normalize();
          this.root.position.addScaledVector(away, 1.5 * dt);
        }
        if (this.timer <= 0) this.changeState("RECOVER", RECOVER_TIME);
        break;
      }

      case "RECOVER": {
        this.faceTowards(player, dt);
        if (this.timer <= 0) {
          this.changeState("IDLE", IDLE_MIN + Math.random() * IDLE_RANDOM);
        }
        break;
      }

      case "DEAD":
        break;
    }

    this.clampArena();
  }

  private landHit(blocking: boolean) {
    if (blocking) this.callbacks.onPlayerBlocked();
    else this.callbacks.onPlayerHit();
  }

  private changeState(state: LionState, duration = 0) {
    this.state = state;
    this.timer = duration;
    this.elapsed = 0;
    this.impactDone = false;

    if (state === "ROAR") playSfx(AUDIO.roar, 0.9);
    if (state === "CHARGE") this.target.copy(this.player.position).setY(0);

    this.callbacks.onStateChange(state);
  }

  private distanceToPlayer() {
    const dx = this.root.position.x - this.player.position.x;
    const dz = this.root.position.z - this.player.position.z;
    return Math.hypot(dx, dz);
  }

  // Quay mặt về một điểm theo mặt phẳng ngang. Mô hình có phía trước là +z.
  private faceTowards(point: THREE.Vector3, dt: number, rate = 7) {
    const dx = point.x - this.root.position.x;
    const dz = point.z - this.root.position.z;
    if (dx * dx + dz * dz < 1e-4) return;

    const targetYaw = Math.atan2(dx, dz) + MODEL_YAW_OFFSET;
    const delta =
      THREE.MathUtils.euclideanModulo(
        targetYaw - this.root.rotation.y + Math.PI,
        Math.PI * 2,
      ) - Math.PI;

    this.root.rotation.y += delta * Math.min(1, dt * rate);
  }

  private clampArena() {
    const dx = this.root.position.x - this.arenaCenter.x;
    const dz = this.root.position.z - this.arenaCenter.y;
    const d = Math.hypot(dx, dz);
    if (d > this.arenaRadius) {
      const k = this.arenaRadius / d;
      this.root.position.x = this.arenaCenter.x + dx * k;
      this.root.position.z = this.arenaCenter.y + dz * k;
    }
  }

  // Cử chỉ bằng xoay và co giãn của pivot, không cần animation trong file
  private setGestureTarget() {
    const t = this.gestureTarget;
    Object.assign(t, REST_GESTURE);
    const wobble = Math.sin(this.elapsed * 22);

    switch (this.state) {
      case "ROAR":
        t.pitch = -0.35 + wobble * 0.012;
        t.squash = 1.04;
        break;
      case "CHARGE":
        t.pitch = 0.14;
        t.squash = 0.97;
        break;
      case "GUARD":
        t.pitch = 0.05;
        t.squash = 0.86;
        break;
      case "SCRATCH": {
        const phase = THREE.MathUtils.clamp((this.elapsed - 0.25) / 0.45, 0, 1);
        t.pitch = 0.1;
        t.lunge = Math.sin(phase * Math.PI) * 0.9;
        break;
      }
      case "HURT":
        t.pitch = 0.12;
        t.squash = 0.94;
        t.roll = wobble * 0.08;
        break;
      case "DEAD":
        t.roll = -Math.PI / 2;
        t.lift = 0.4;
        break;
      default:
        break;
    }
  }

  private applyGesture(dt: number) {
    this.setGestureTarget();

    const k = 1 - Math.exp(-dt * 9);
    const g = this.gesture;
    const t = this.gestureTarget;

    g.pitch += (t.pitch - g.pitch) * k;
    g.roll += (t.roll - g.roll) * k;
    g.squash += (t.squash - g.squash) * k;
    g.lunge += (t.lunge - g.lunge) * k;
    g.lift += (t.lift - g.lift) * k;

    this.pivot.rotation.set(g.pitch, 0, g.roll);
    this.pivot.scale.set(1 + (1 - g.squash) * 0.5, g.squash, 1);
    this.pivot.position.set(0, g.lift, g.lunge);
  }

  dispose() {
    this.disposed = true;
    this.active = false;
    this.scene.remove(this.root);

    this.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose();
        });
        material.dispose();
      });
    });
  }
}
