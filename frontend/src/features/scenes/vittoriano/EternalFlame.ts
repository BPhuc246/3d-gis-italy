import * as THREE from "three";
import { makeGlowTexture } from "../../shared/textures";
import { AUDIO } from "../../config/audioAssets";

const SPARK_COUNT = 160;
const PUFF_COUNT = 10;

type Puff = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  age: number;
  life: number;
};

// Lư hương luôn hiện. Lửa là nhóm riêng, bật tắt không ảnh hưởng lư hương.
export class EternalFlame {
  private parent: THREE.Object3D;
  private root = new THREE.Group(); // vị trí, xoay, scale chung
  private bowl = new THREE.Group(); // lư hương: luôn hiện
  private flameGroup = new THREE.Group(); // phần lửa: bật tắt

  private target = 0;
  private level = 0;
  private time = 0;

  private core: THREE.Mesh;
  private coreMat: THREE.MeshBasicMaterial;
  private light: THREE.PointLight;

  private sparks: THREE.Points;
  private sparkGeo: THREE.BufferGeometry;
  private sparkMat: THREE.PointsMaterial;
  private sparkPos = new Float32Array(SPARK_COUNT * 3);
  private sparkLife = new Float32Array(SPARK_COUNT);
  private sparkSpeed = new Float32Array(SPARK_COUNT);

  private puffs: Puff[] = [];
  private glowTex: THREE.Texture;
  private audio: HTMLAudioElement;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(
    parent: THREE.Object3D,
    position: THREE.Vector3,
    options: { scale?: number; rotationY?: number } = {},
  ) {
    this.parent = parent;
    this.root.position.copy(position);
    this.root.scale.setScalar(options.scale ?? 1);
    this.root.rotation.y = options.rotationY ?? 0;
    this.root.add(this.bowl, this.flameGroup);
    parent.add(this.root);

    this.glowTex = makeGlowTexture();

    // Lư hương: chân đế và bát đá, luôn hiện
    const stone = new THREE.MeshStandardMaterial({
      color: "#8f877a",
      roughness: 0.8,
    });
    const pedestalGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 20);
    const pedestal = new THREE.Mesh(pedestalGeo, stone);
    pedestal.position.y = 0.25;
    const bowlGeo = new THREE.CylinderGeometry(0.55, 0.35, 0.3, 24);
    const bowlMesh = new THREE.Mesh(bowlGeo, stone);
    bowlMesh.position.y = 0.65;
    for (const m of [pedestal, bowlMesh]) {
      m.castShadow = true;
      m.receiveShadow = true;
      this.bowl.add(m);
    }
    this.geometries.push(pedestalGeo, bowlGeo);
    this.materials.push(stone);
    this.bowl.visible = true;

    // Lõi lửa
    const coreGeo = new THREE.ConeGeometry(0.28, 0.9, 14);
    this.coreMat = new THREE.MeshBasicMaterial({
      color: "#ffb14a",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.core = new THREE.Mesh(coreGeo, this.coreMat);
    this.core.position.y = 1.0;
    this.core.renderOrder = 2;
    this.flameGroup.add(this.core);
    this.geometries.push(coreGeo);
    this.materials.push(this.coreMat);

    // Tia lửa
    for (let i = 0; i < SPARK_COUNT; i++) this.respawnSpark(i, true);
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.sparkPos, 3),
    );
    this.sparkMat = new THREE.PointsMaterial({
      color: "#ffd27a",
      size: 0.22,
      map: this.glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.sparks.position.y = 1.0;
    this.sparks.renderOrder = 2;
    this.flameGroup.add(this.sparks);
    this.geometries.push(this.sparkGeo);
    this.materials.push(this.sparkMat);

    // Khói: nhỏ hơn và mờ hơn để không che lư hương
    for (let i = 0; i < PUFF_COUNT; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.glowTex,
        color: "#b8b4ac",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 3;
      sprite.position.set(
        (Math.random() - 0.5) * 0.3,
        1.6 + i * 0.15,
        (Math.random() - 0.5) * 0.3,
      );
      this.flameGroup.add(sprite);
      this.puffs.push({
        sprite,
        material,
        age: (i / PUFF_COUNT) * 4,
        life: 4,
      });
      this.materials.push(material);
    }

    // Ánh sáng
    this.light = new THREE.PointLight("#ff9b3d", 0, 12, 2);
    this.light.position.set(0, 1.2, 0);
    this.flameGroup.add(this.light);

    // Tiếng lửa lặp lại
    this.audio = new Audio(AUDIO.fire);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.preload = "auto";
  }

  // Bật hoặc tắt. Gọi từ sự kiện click để trình duyệt cho phát tiếng.
  setLit(on: boolean) {
    const t = on ? 1 : 0;
    if (t === this.target) return;
    this.target = t;
    if (on) void this.audio.play().catch(() => undefined);
  }

  private respawnSpark(i: number, initial = false) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.22;
    this.sparkPos[i * 3] = Math.cos(a) * r;
    this.sparkPos[i * 3 + 1] = initial ? Math.random() * 0.9 : 0;
    this.sparkPos[i * 3 + 2] = Math.sin(a) * r;
    this.sparkSpeed[i] = 0.8 + Math.random() * 1.2;
    this.sparkLife[i] = 0.6 + Math.random() * 0.9;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    this.level += (this.target - this.level) * (1 - Math.exp(-dt * 4));
    const L = this.level;

    // Nhóm lửa chỉ ẩn khi thật sự tắt hẳn
    this.flameGroup.visible = L > 0.002;

    this.core.scale.set(
      L * (1 + 0.05 * Math.sin(t * 17)),
      L * (0.9 + 0.18 * Math.sin(t * 13) + 0.07 * Math.sin(t * 31)),
      L,
    );
    this.coreMat.opacity = 0.85 * L;
    this.light.intensity =
      L * (2.4 + 0.5 * Math.sin(t * 9) + 0.25 * Math.sin(t * 23));

    this.sparkMat.opacity = 0.9 * L;
    for (let i = 0; i < SPARK_COUNT; i++) {
      this.sparkLife[i] -= dt;
      this.sparkPos[i * 3 + 1] += this.sparkSpeed[i] * dt;
      this.sparkPos[i * 3] += Math.sin(t * 3 + i) * 0.05 * dt;
      if (this.sparkLife[i] <= 0 || this.sparkPos[i * 3 + 1] > 1.2) {
        this.respawnSpark(i);
      }
    }
    this.sparkGeo.attributes.position.needsUpdate = true;

    for (const p of this.puffs) {
      p.sprite.visible = L > 0.05;
      p.age += dt;
      if (p.age >= p.life) {
        p.age = 0;
        p.life = 3.5 + Math.random() * 2;
        p.sprite.position.set(
          (Math.random() - 0.5) * 0.3,
          1.6,
          (Math.random() - 0.5) * 0.3,
        );
      }
      const k = p.age / p.life;
      p.sprite.position.y += 0.5 * dt;
      p.sprite.position.x += 0.1 * dt;
      const s = 0.4 + k * 1.6;
      p.sprite.scale.set(s, s, 1);
      p.material.opacity = 0.25 * L * Math.sin(Math.PI * k);
    }

    this.audio.volume = Math.max(0, Math.min(1, 0.55 * L));
    if (this.target === 0 && L < 0.01 && !this.audio.paused) {
      this.audio.pause();
    }
  }

  dispose() {
    this.audio.pause();
    this.audio.src = "";
    this.parent.remove(this.root);
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.glowTex.dispose();
  }
}
