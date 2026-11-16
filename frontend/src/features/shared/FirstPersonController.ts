import * as THREE from "three";

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export type CircleBlocker = { kind: "circle"; x: number; z: number; radius: number };
export type BoxBlocker = { kind: "box"; minX: number; maxX: number; minZ: number; maxZ: number };
export type Blocker = CircleBlocker | BoxBlocker;

export type WorldLayout = {
  floorAt: (x: number, z: number) => number;
  blockers: Blocker[];
  stepSmoothing?: number;
};

const PLAYER_RADIUS = 0.45;

export class FirstPersonController {
  private yaw = 0;
  private pitch = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private keys = new Set<string>();
  private floorY = 0;
  enabled = true;
  speed = 7;
  // Chiều cao mắt so với mặt sàn
  height = 1.65;

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.element.setPointerCapture?.(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || !this.enabled) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.yaw -= dx * 0.003;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0025, -1.35, 1.35);
    this.applyRotation();
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) return;
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
    if (target?.isContentEditable) return;
    if (
      ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)
    ) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  constructor(
    private camera: THREE.PerspectiveCamera,
    private element: HTMLElement,
    private bounds: Bounds,
    private world?: WorldLayout,
  ) {
    this.camera.rotation.order = "YXZ";
    this.element.style.touchAction = "none";
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointermove", this.onPointerMove);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.floorY = this.world
      ? this.world.floorAt(this.camera.position.x, this.camera.position.z)
      : 0;
  }

  setLook(yaw: number, pitch: number) {
    this.yaw = yaw;
    this.pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
    this.applyRotation();
  }

  setPitch(pitch: number) {
    this.pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
    this.applyRotation();
  }

  private applyRotation() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  // Đẩy người chơi ra khỏi vật cản; trả về vị trí mới
  private resolveBlockers(x: number, z: number) {
    if (!this.world) return { x, z };
    for (let pass = 0; pass < 3; pass++) {
      for (const b of this.world.blockers) {
        if (b.kind === "circle") {
          const dx = x - b.x;
          const dz = z - b.z;
          const d = Math.hypot(dx, dz);
          const min = b.radius + PLAYER_RADIUS;
          if (d < min) {
            if (d < 1e-6) {
              x = b.x + min;
            } else {
              x = b.x + (dx / d) * min;
              z = b.z + (dz / d) * min;
            }
          }
        } else {
          const minX = b.minX - PLAYER_RADIUS;
          const maxX = b.maxX + PLAYER_RADIUS;
          const minZ = b.minZ - PLAYER_RADIUS;
          const maxZ = b.maxZ + PLAYER_RADIUS;
          if (x > minX && x < maxX && z > minZ && z < maxZ) {
            const left = x - minX;
            const right = maxX - x;
            const near = z - minZ;
            const far = maxZ - z;
            const m = Math.min(left, right, near, far);
            if (m === left) x = minX;
            else if (m === right) x = maxX;
            else if (m === near) z = minZ;
            else z = maxZ;
          }
        }
      }
    }
    return { x, z };
  }

  update(dt: number) {
    if (!this.enabled) return;

    const forward =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const side =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));

    if (forward !== 0 || side !== 0) {
      const length = Math.hypot(forward, side) || 1;
      const f = forward / length;
      const s = side / length;
      const step = this.speed * dt;

      let x = this.camera.position.x + (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * step;
      let z = this.camera.position.z + (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * step;

      x = THREE.MathUtils.clamp(x, this.bounds.minX, this.bounds.maxX);
      z = THREE.MathUtils.clamp(z, this.bounds.minZ, this.bounds.maxZ);

      const resolved = this.resolveBlockers(x, z);
      x = THREE.MathUtils.clamp(resolved.x, this.bounds.minX, this.bounds.maxX);
      z = THREE.MathUtils.clamp(resolved.z, this.bounds.minZ, this.bounds.maxZ);

      this.camera.position.x = x;
      this.camera.position.z = z;
    }

    // Độ cao theo mặt sàn, nội suy để bước lên bậc mượt
    const targetFloor = this.world
      ? this.world.floorAt(this.camera.position.x, this.camera.position.z)
      : 0;
    const smooth = this.world?.stepSmoothing ?? 12;
    this.floorY += (targetFloor - this.floorY) * (1 - Math.exp(-dt * smooth));
    this.camera.position.y = this.floorY + this.height;
  }

  dispose() {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.keys.clear();
  }
}