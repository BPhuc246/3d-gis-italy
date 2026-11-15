import * as THREE from "three";

export class CreativeFlyController {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;

  private keys = new Set<string>();
  private euler = new THREE.Euler(0, 0, 0, "YXZ");

  speed = 10;
  boostSpeed = 30;
  sensitivity = 0.002;

  // Độ cao khi đi bộ (không bay)
  walkHeight = 3;
  // false: đi bộ ở độ cao walkHeight. true: bay tự do
  flying = false;

  private isPointerLocked = false;
  private enabled = true;

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) return;

    this.keys.add(event.code);

    if (["Space", "ShiftLeft", "ShiftRight"].includes(event.code)) {
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.enabled || !this.isPointerLocked) return;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= event.movementX * this.sensitivity;
    this.euler.x -= event.movementY * this.sensitivity;

    this.euler.x = THREE.MathUtils.clamp(
      this.euler.x,
      -Math.PI / 2 + 0.01,
      Math.PI / 2 - 0.01,
    );

    this.camera.quaternion.setFromEuler(this.euler);
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.element;
  };

  private onClick = () => {
    if (!this.enabled) return;

    if (!this.isPointerLocked) {
      void this.element.requestPointerLock();
    }
  };

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;

    element.addEventListener("click", this.onClick);

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);

    document.addEventListener("pointerlockchange", this.onPointerLockChange);
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    this.keys.clear();
  }

  setFlying(value: boolean) {
    this.flying = value;
    this.keys.clear();

    // Khi tắt bay, hạ camera về độ cao đi bộ ngay lập tức
    if (!value) {
      this.camera.position.y = this.walkHeight;
    }
  }

  toggleFlying(): boolean {
    this.setFlying(!this.flying);
    return this.flying;
  }

  update(dt: number) {
    if (!this.enabled) return;

    const direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    // Đi bộ: bỏ thành phần thẳng đứng để không bay khi nhìn lên/xuống
    if (!this.flying) {
      forward.y = 0;
    }
    if (forward.lengthSq() > 1e-6) {
      forward.normalize();
    }

    const right = new THREE.Vector3()
      .crossVectors(forward, this.camera.up)
      .normalize();

    if (this.keys.has("KeyW")) direction.add(forward);
    if (this.keys.has("KeyS")) direction.sub(forward);

    if (this.keys.has("KeyD")) direction.add(right);
    if (this.keys.has("KeyA")) direction.sub(right);

    if (this.flying) {
      if (this.keys.has("Space")) direction.y += 1;

      if (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) {
        direction.y -= 1;
      }
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const boost =
        this.keys.has("ControlLeft") || this.keys.has("ControlRight");

      const currentSpeed = boost ? this.boostSpeed : this.speed;

      this.camera.position.addScaledVector(direction, currentSpeed * dt);
    }

    // Đi bộ: luôn giữ độ cao cố định
    if (!this.flying) {
      this.camera.position.y = this.walkHeight;
    }
  }

  dispose() {
    this.element.removeEventListener("click", this.onClick);

    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);

    document.removeEventListener("pointerlockchange", this.onPointerLockChange);

    if (document.pointerLockElement === this.element) {
      document.exitPointerLock();
    }

    this.keys.clear();
  }
}
