// 程序化 canvas 纹理(应县木塔材质:朱红木构 / 深褐斗拱 / 石台基 / 灰瓦 / 匾额)
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, w, h, rnd, n, amp) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, s = 1 + rnd() * 2;
    const v = (rnd() - 0.5) * amp;
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v)})`;
    ctx.fillRect(x, y, s, s);
  }
}

function shade(hex, l) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(l);
  return '#' + c.getHexString();
}

// 朱红木构墙板(格扇门意象:竖棂 + 边框)
export function timberRedTexture({ size = 256, seed = 17 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#8e3220'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const x = rnd() * size;
    ctx.globalAlpha = 0.06 + rnd() * 0.1;
    ctx.fillStyle = rnd() > 0.5 ? '#a04028' : '#5e1c10';
    ctx.fillRect(x, 0, 1 + rnd() * 3, size);
  }
  ctx.globalAlpha = 1;
  // 格扇竖棂(每 32px 一扇)
  for (let x = 0; x < size; x += 32) {
    ctx.fillStyle = '#5e1c10';
    ctx.fillRect(x, 0, 3, size);
    ctx.fillStyle = '#7e2c1c';
    ctx.fillRect(x + 3, 0, 2, size);
    // 棂条
    ctx.fillStyle = '#9c3824';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 8 + i * 4.4, 6, 1.8, size - 12);
  }
  speckle(ctx, size, size, rnd, 300, 0.06);
  return tex(c);
}

// 斗拱带(深褐层叠出跳)
export function dougongTexture({ size = 256, seed = 51 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#3c2c1e'; ctx.fillRect(0, 0, size, size);
  const n = 6, w = size / n;
  for (let i = 0; i < n; i++) {
    // 栱瓣层叠
    for (let lv = 0; lv < 4; lv++) {
      const l = 0.85 + lv * 0.16;
      ctx.fillStyle = shade('#5a442c', l * 0.6);
      ctx.fillRect(i * w + 4 + lv * 3, 8 + lv * (size - 20) / 4, w - 10 - lv * 6, (size - 20) / 4 - 3);
    }
    ctx.fillStyle = '#2c2015';
    ctx.fillRect(i * w, 0, 2.5, size);
    // 泥金彩绘残迹
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#c8a04c';
    ctx.fillRect(i * w + w * 0.4, 10, 3, size - 24);
    ctx.globalAlpha = 1;
  }
  speckle(ctx, size, size, rnd, 300, 0.08);
  return tex(c, { repeat: 8 });
}

// 灰瓦
export function tileGreyTexture({ size = 256, seed = 3, base = '#5e5c56' } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const ridges = 16, rw = size / ridges;
  for (let i = 0; i < ridges; i++) {
    ctx.fillStyle = shade(base, 1.28);
    ctx.fillRect(i * rw + rw * 0.18, 0, rw * 0.28, size);
    ctx.fillStyle = shade(base, 0.7);
    ctx.fillRect(i * rw + rw * 0.74, 0, rw * 0.26, size);
  }
  ctx.globalAlpha = 0.16;
  for (let y = 0; y < size; y += 22) {
    ctx.fillStyle = '#26241e';
    ctx.fillRect(0, y, size, 2.4);
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 900, 0.08);
  return tex(c);
}

// 石台基(条石 + 风化)
export function stoneBaseTexture({ size = 256, seed = 31, base = '#9a9484' } = {}) {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(seed);
  const rows = 5, bh = size / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bh;
    for (let i = -1; i < rows; i++) {
      ctx.fillStyle = shade(base, 0.9 + rnd() * 0.2);
      ctx.fillRect(i * bh * 1.8 + off + 2, r * bh + 2, bh * 1.8 - 4, bh - 4);
    }
  }
  speckle(ctx, size, size, rnd, 900, 0.1);
  return tex(c, { repeat: 6 });
}

// 匾额(竖排汉字,canvas fillText)
export function plaqueTexture({ chars = '释迦塔', w = 96, h = 320, bg = '#6e1a10', fg = '#e8c060' } = {}) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#3c1008'; ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.fillStyle = fg;
  ctx.font = `${Math.floor(w * 0.62)}px "Songti SC","SimSun",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const n = chars.length;
  for (let i = 0; i < n; i++) {
    ctx.fillText(chars[i], w / 2, (h / (n + 1)) * (i + 1) + 4);
  }
  return tex(c);
}

// 共享材质集
export function makeMaterials() {
  const timberRed = timberRedTexture();
  const dougong = dougongTexture();
  const tileGrey = tileGreyTexture();
  const stoneBase = stoneBaseTexture();
  const std = (map, opts = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0.0, ...opts });
  const mat = (key, opts = {}) => {
    const m = std(key, opts);
    m.side = THREE.DoubleSide;
    return m;
  };
  return {
    timberRed: mat(timberRed, { roughness: 0.6 }),
    dougong: mat(dougong, { roughness: 0.8 }),
    tileGrey: mat(tileGrey, { roughness: 0.62 }),
    stoneBase: std(stoneBase, { roughness: 0.95 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x8e8a7e, roughness: 0.92 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x5e5c54, roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6a4c2e, roughness: 0.88 }),
    log: new THREE.MeshStandardMaterial({ color: 0x5a442c, roughness: 0.9 }),
    redPaint: new THREE.MeshStandardMaterial({ color: 0x8e3220, roughness: 0.55, side: THREE.DoubleSide }),
    marble: new THREE.MeshStandardMaterial({ color: 0xb0a894, roughness: 0.72 }),
    marbleFine: new THREE.MeshStandardMaterial({ color: 0xc2bca8, roughness: 0.62 }),
    brickWall: new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 0.95 }),
    brick: new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 0.95 }),
    goldTrim: new THREE.MeshStandardMaterial({ color: 0xc8a25e, roughness: 0.3, metalness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc8a25e, roughness: 0.35, metalness: 0.55 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.5, metalness: 0.7 }),
    bell: new THREE.MeshStandardMaterial({ color: 0xc8a25e, roughness: 0.3, metalness: 0.6, emissive: 0x442c08, emissiveIntensity: 0.6 }),
    robe: new THREE.MeshStandardMaterial({ color: 0xc8a04c, roughness: 0.5, metalness: 0.3 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xd8b284, roughness: 0.6 }),
    pine: new THREE.MeshStandardMaterial({ color: 0x2e4632, roughness: 1 }),
    shrub: new THREE.MeshStandardMaterial({ color: 0x707c48, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1 }),
    field: new THREE.MeshStandardMaterial({ color: 0x9a9464, roughness: 1 }),
  };
}
