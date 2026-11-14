import * as THREE from 'three';

function makeCanvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Cát đấu trường
export function makeSandTexture(repeat = 4) {
  return makeCanvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#c4a57c';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3000; i++) {
      const v = Math.floor(rand(140, 210));
      ctx.fillStyle = `rgba(${v}, ${v - 28}, ${v - 60}, ${rand(0.2, 0.5)})`;
      ctx.fillRect(rand(0, s), rand(0, s), 1.6, 1.6);
    }
  }, repeat);
}

// Lát đá theo hàng so le
export function makeStoneTexture(repeat = 3) {
  return makeCanvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#d8ccb4';
    ctx.fillRect(0, 0, s, s);
    const block = s / 4;
    ctx.strokeStyle = 'rgba(90, 75, 55, 0.45)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= s; y += block) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    for (let row = 0; row < 4; row++) {
      const offset = ((row % 2) * block) / 2;
      for (let x = offset; x <= s + block; x += block) {
        ctx.beginPath();
        ctx.moveTo(x, row * block);
        ctx.lineTo(x, (row + 1) * block);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgba(80, 66, 48, ${rand(0.05, 0.18)})`;
      ctx.fillRect(rand(0, s), rand(0, s), 2, 2);
    }
  }, repeat);
}

// Đá cẩm thạch có vân
export function makeMarbleTexture(repeat = 2) {
  return makeCanvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#e8e1d2';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 16; i++) {
      ctx.strokeStyle = `rgba(120, 108, 90, ${rand(0.08, 0.2)})`;
      ctx.lineWidth = rand(0.6, 2.2);
      ctx.beginPath();
      let x = rand(0, s);
      let y = rand(0, s);
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        const cx = x + rand(-80, 80);
        const cy = y + rand(-80, 80);
        x += rand(-90, 90);
        y += rand(-90, 90);
        ctx.quadraticCurveTo(cx, cy, x, y);
      }
      ctx.stroke();
    }
  }, repeat);
}

// Quầng sáng cho ngọn nến mô phỏng
export function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255, 240, 200, 1)');
    g.addColorStop(0.35, 'rgba(255, 200, 120, 0.55)');
    g.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}