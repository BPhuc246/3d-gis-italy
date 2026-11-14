import * as THREE from "three";

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export class FirstPersonController {
  private yaw = 0;
  private pitch = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private keys = new Set<string>();
  enabled = true;
  speed = 7;
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
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
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
  ) {
    this.camera.rotation.order = "YXZ";
    this.element.style.touchAction = "none";
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointermove", this.onPointerMove);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
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

  update(dt: number) {
    if (!this.enabled) return;

    const forward =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const side =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));

    if (forward === 0 && side === 0) return;

    const length = Math.hypot(forward, side) || 1;
    const f = forward / length;
    const s = side / length;
    const step = this.speed * dt;

    this.camera.position.x += (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * step;
    this.camera.position.z += (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * step;
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x,
      this.bounds.minX,
      this.bounds.maxX,
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z,
      this.bounds.minZ,
      this.bounds.maxZ,
    );
    this.camera.position.y = this.height;
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
