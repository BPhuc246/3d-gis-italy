
import * as THREE from "three";

export class CreativeFlyController {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;

  private keys = new Set<string>();
  private euler = new THREE.Euler(0, 0, 0, "YXZ");

  speed = 10;
  boostSpeed = 30;
  sensitivity = 0.002;

  private isPointerLocked = false;

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);

    if (
      ["Space", "ShiftLeft", "ShiftRight"].includes(event.code)
    ) {
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isPointerLocked) return;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= event.movementX * this.sensitivity;
    this.euler.x -= event.movementY * this.sensitivity;

    // Không cho camera lật ngược.
    this.euler.x = THREE.MathUtils.clamp(
      this.euler.x,
      -Math.PI / 2 + 0.01,
      Math.PI / 2 - 0.01
    );

    this.camera.quaternion.setFromEuler(this.euler);
  };

  private onPointerLockChange = () => {
    this.isPointerLocked =
      document.pointerLockElement === this.element;
  };

  private onClick = () => {
    if (!this.isPointerLocked) {
      this.element.requestPointerLock();
    }
  };

  constructor(
    camera: THREE.PerspectiveCamera,
    element: HTMLElement
  ) {
    this.camera = camera;
    this.element = element;

    element.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener(
      "pointerlockchange",
      this.onPointerLockChange
    );
  }

  update(dt: number) {
    const direction = new THREE.Vector3();

    // Hướng nhìn ngang của camera.
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    const right = new THREE.Vector3()
      .crossVectors(forward, this.camera.up)
      .normalize();

    // WASD.
    if (this.keys.has("KeyW")) {
      direction.add(forward);
    }

    if (this.keys.has("KeyS")) {
      direction.sub(forward);
    }

    if (this.keys.has("KeyD")) {
      direction.add(right);
    }

    if (this.keys.has("KeyA")) {
      direction.sub(right);
    }

    // Space: bay lên.
    if (this.keys.has("Space")) {
      direction.y += 1;
    }

    // Shift: bay xuống.
    if (
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight")
    ) {
      direction.y -= 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const boost =
        this.keys.has("ControlLeft") ||
        this.keys.has("ControlRight");

      const currentSpeed = boost
        ? this.boostSpeed
        : this.speed;

      this.camera.position.addScaledVector(
        direction,
        currentSpeed * dt
      );
    }
  }

  dispose() {
    this.element.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener(
      "pointerlockchange",
      this.onPointerLockChange
    );

    if (document.pointerLockElement === this.element) {
      document.exitPointerLock();
    }

    this.keys.clear();
  }
}
