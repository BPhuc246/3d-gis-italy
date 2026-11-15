import * as THREE from "three";

type CombatCallbacks = {
  onAttack: () => void;
  onBlockChange: (blocking: boolean) => void;
};

const ATTACK_INTERVAL = 0.45;

export class CombatController {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;
  private callbacks: CombatCallbacks;

  private keys = new Set<string>();
  private enabled = false;
  private pointerLocked = false;
  private blocking = false;
  private grounded = true;
  private velocityY = 0;
  private attackCooldown = 0;
  private euler = new THREE.Euler(0, 0, 0, "YXZ");

  arenaCenter = new THREE.Vector2(0, 0);
  arenaRadius = 17;
  private readonly eyeHeight = 1.7;

  speed = 6;
  sprintSpeed = 10;
  jumpForce = 7;
  gravity = 20;
  sensitivity = 0.002;

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
    if (!this.enabled || !this.pointerLocked) return;

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
    this.pointerLocked = document.pointerLockElement === this.element;
    this.keys.clear();
    if (!this.pointerLocked) this.setBlocking(false);
  };

  private onMouseDown = (event: MouseEvent) => {
    if (!this.enabled) return;

    if (!this.pointerLocked) {
      // Lần nhấp đầu tiên chỉ để khóa chuột, không tính là đòn đánh.
      void this.element.requestPointerLock();
      return;
    }

    if (event.button === 0) {
      event.preventDefault();
      if (this.attackCooldown <= 0) {
        this.attackCooldown = ATTACK_INTERVAL;
        this.callbacks.onAttack();
      }
    }

    if (event.button === 2) {
      event.preventDefault();
      this.setBlocking(true);
    }
  };

  // Nghe ở document để nhả chuột phải ngoài canvas vẫn tắt chế độ chặn.
  private onMouseUp = (event: MouseEvent) => {
    if (event.button === 2) this.setBlocking(false);
  };

  private onWindowBlur = () => {
    this.setBlocking(false);
    this.keys.clear();
  };

  private onContextMenu = (event: Event) => {
    if (this.enabled) event.preventDefault();
  };

  constructor(
    camera: THREE.PerspectiveCamera,
    element: HTMLElement,
    callbacks: CombatCallbacks,
  ) {
    this.camera = camera;
    this.element = element;
    this.callbacks = callbacks;
    this.pointerLocked = document.pointerLockElement === element;

    element.addEventListener("mousedown", this.onMouseDown);
    element.addEventListener("contextmenu", this.onContextMenu);

    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    window.addEventListener("blur", this.onWindowBlur);
  }

  private setBlocking(value: boolean) {
    if (this.blocking === value) return;
    this.blocking = value;
    this.callbacks.onBlockChange(value);
  }

  get isBlocking() {
    return this.blocking;
  }

  get isPointerLocked() {
    return this.pointerLocked;
  }

  // Chỉ gọi khi trạng thái thật sự đổi. Gọi mỗi khung hình sẽ xóa phím và làm mất chặn.
  setEnabled(value: boolean) {
    if (this.enabled === value) return;
    this.enabled = value;
    this.keys.clear();
    this.velocityY = 0;
    this.attackCooldown = 0;
    this.setBlocking(false);
  }

  reset(position: THREE.Vector3) {
    this.camera.position.copy(position);
    this.camera.rotation.set(0, 0, 0);
    this.euler.set(0, 0, 0);
    this.velocityY = 0;
    this.grounded = true;
    this.keys.clear();
    this.setBlocking(false);
  }

  update(dt: number) {
    if (!this.enabled) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // Hướng di chuyển ngang theo camera, không bay lên xuống.
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const direction = new THREE.Vector3();
    if (this.keys.has("KeyW")) direction.add(forward);
    if (this.keys.has("KeyS")) direction.sub(forward);
    if (this.keys.has("KeyD")) direction.add(right);
    if (this.keys.has("KeyA")) direction.sub(right);

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
      const currentSpeed = sprint ? this.sprintSpeed : this.speed;
      this.camera.position.addScaledVector(direction, currentSpeed * dt);
    }

    // Nhảy: không nhảy được khi đang chặn.
    if (this.keys.has("Space") && this.grounded && !this.blocking) {
      this.velocityY = this.jumpForce;
      this.grounded = false;
    }

    this.velocityY -= this.gravity * dt;
    this.camera.position.y += this.velocityY * dt;

    if (this.camera.position.y <= this.eyeHeight) {
      this.camera.position.y = this.eyeHeight;
      this.velocityY = 0;
      this.grounded = true;
    }

    // Giới hạn trong vùng di chuyển (quanh arenaCenter, không phải gốc)
    const hx = this.camera.position.x - this.arenaCenter.x;
    const hz = this.camera.position.z - this.arenaCenter.y;
    const hd = Math.hypot(hx, hz);
    if (hd > this.arenaRadius) {
      const k = this.arenaRadius / hd;
      this.camera.position.x = this.arenaCenter.x + hx * k;
      this.camera.position.z = this.arenaCenter.y + hz * k;
    }
  }

  dispose() {
    this.element.removeEventListener("mousedown", this.onMouseDown);
    this.element.removeEventListener("contextmenu", this.onContextMenu);

    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    window.removeEventListener("blur", this.onWindowBlur);

    this.setBlocking(false);
    if (document.pointerLockElement === this.element) {
      document.exitPointerLock();
    }
    this.keys.clear();
  }
}
