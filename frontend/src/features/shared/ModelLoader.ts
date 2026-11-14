import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export async function loadFirstAvailable(paths: readonly string[]) {
  let lastError: unknown;
  for (const path of paths) {
    try {
      const gltf = await loader.loadAsync(path);
      return { root: gltf.scene, animations: gltf.animations, path };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`Không tải được model: ${paths.join(", ")}`);
}

export function prepareModel(
  root: THREE.Object3D,
  targetHeight: number,
  options: { centerXZ?: boolean; castShadow?: boolean } = {},
) {
  const { centerXZ = true, castShadow = true } = options;
  root.updateMatrixWorld(true);

  const initialBox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  initialBox.getSize(size);
  initialBox.getCenter(center);

  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("Model GLB không có bounding box hợp lệ.");
  }

  const scale = targetHeight / size.y;
  root.scale.setScalar(scale);
  root.position.set(
    centerXZ ? -center.x * scale : 0,
    -initialBox.min.y * scale,
    centerXZ ? -center.z * scale : 0,
  );

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
  });

  root.updateMatrixWorld(true);
  return { scale, size };
}

export function makeGround(size = 180, color = "#777064") {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  return ground;
}

export function makeGate(width = 4.2, height = 3.1) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: "#51483d",
    metalness: 0.72,
    roughness: 0.42,
  });
  for (let x = -width / 2; x <= width / 2 + 0.001; x += 0.28) {
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, height, 8),
      metal,
    );
    bar.position.set(x, height / 2, 0);
    bar.castShadow = true;
    group.add(bar);
  }
  for (const y of [0.25, height - 0.25]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.15, 0.1, 0.12),
      metal,
    );
    rail.position.set(0, y, 0);
    group.add(rail);
  }
  return group;
}
