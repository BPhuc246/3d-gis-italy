import * as THREE from "three";

export function createPrayerHands(camera: THREE.Camera) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: "#bd8d6b", roughness: 0.8 });
  const sleeve = new THREE.MeshStandardMaterial({ color: "#51483f", roughness: 0.9 });

  const armGeometry = new THREE.CapsuleGeometry(0.055, 0.34, 4, 8);
  const handGeometry = new THREE.SphereGeometry(0.085, 12, 10);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeometry, sleeve);
    arm.position.set(side * 0.13, -0.28, -0.58);
    arm.rotation.z = side * -0.48;
    group.add(arm);

    const hand = new THREE.Mesh(handGeometry, skin);
    hand.scale.set(0.78, 1.15, 0.75);
    hand.position.set(side * 0.045, -0.08, -0.76);
    group.add(hand);

    for (let finger = 0; finger < 3; finger++) {
      const digit = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018, 0.075, 3, 6),
        skin,
      );
      digit.position.set(side * (0.025 + finger * 0.022), 0.015, -0.82);
      digit.rotation.z = side * -0.08;
      group.add(digit);
    }
  }

  group.position.set(0, -0.18, 0);
  group.visible = false;
  camera.add(group);
  return {
    group,
    update(dt: number, visible: boolean) {
      group.visible = visible;
      const targetY = visible ? -0.03 : -0.35;
      group.position.y += (targetY - group.position.y) * (1 - Math.exp(-dt * 5));
    },
  };
}

export function createSymbolicCandle(camera: THREE.Camera) {
  const group = new THREE.Group();
  const holderMat = new THREE.MeshStandardMaterial({
    color: "#9b8057",
    metalness: 0.65,
    roughness: 0.4,
  });
  const waxMat = new THREE.MeshStandardMaterial({ color: "#eee5d2", roughness: 0.85 });

  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.2, 16),
    holderMat,
  );
  holder.position.y = -0.11;
  group.add(holder);

  const wax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.24, 14),
    waxMat,
  );
  wax.position.y = 0.1;
  group.add(wax);

  const flameMat = new THREE.MeshBasicMaterial({ color: "#ffb347" });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 12), flameMat);
  flame.position.y = 0.29;
  flame.visible = false;
  group.add(flame);

  const glow = new THREE.PointLight("#ffb36b", 0, 2.5, 2);
  glow.position.set(0, 0.32, 0);
  group.add(glow);

  group.position.set(0.38, -0.25, -1.25);
  camera.add(group);

  let time = 0;
  let level = 0;
  return {
    setLit(value: boolean) {
      level = value ? 1 : 0;
    },
    update(dt: number) {
      time += dt;
      flame.visible = level > 0.05;
      flame.scale.y = 1 + Math.sin(time * 11) * 0.08;
      glow.intensity = level * 0.85;
    },
  };
}
