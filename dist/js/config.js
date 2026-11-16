// 全局配置与场景布局(单位:米;+X 东,+Z 北,+Y 上)
// 应县木塔巡礼:桑干平原 → 塔基 → 一层释迦 → 暗层斗拱 → 平坐 → 塔刹 → 九百岁 → 木痕

export const CFG = {
  skyRadius: 3000,
  fogPlain: 0.0009,
  camera: { near: 0.5, far: 7000, fov: 55 },
  quality: {
    high: { pixelRatioCap: 2, shadowMap: 2048, shadows: true, bloom: true },
    mid: { pixelRatioCap: 1.5, shadowMap: 1024, shadows: true, bloom: true },
    low: { pixelRatioCap: 1, shadowMap: 0, shadows: false, bloom: false },
  },
};

// ---- 木塔布局 ----
export const LAYOUT = {
  tower: {
    x: 0, z: 0,
    baseTiers: [{ r: 26, h: 2.1 }, { r: 21.5, h: 2.3 }],   // 石台基两层(八角)
    bodyR0: 16.5, bodyR1: 10.5,                             // 底层/顶层八边形外接半径
    floors: 5, floorH: 8.6,                                 // 明层高
    plaqueY: 6.2,
  },
  gate: { w: 5, z: -24 }, // 塔基南门(石阶)
};

// 平原高度(桑干河畔:近塔压平,远处微起伏)
export function plainHeight(x, z) {
  let h = (Math.sin(x * 0.011 + 4.7) + Math.cos(z * 0.013 + 1.3)) * 0.5
        + Math.sin(x * 0.0035 + z * 0.0041) * 1.0;
  const centerDist = Math.hypot(x, z);
  const fade = Math.min(1, Math.max(0, (centerDist - 150) / 220));
  return h * fade;
}

// 漫游平面高度:台基两层(近似圆)+ 石阶 + 平原
export function groundHeight(x, z, plainFn) {
  const d = Math.hypot(x, z);
  const T = LAYOUT.tower;
  // 石阶(南向登基)
  if (Math.abs(x) < T.baseTiers[0].r - 6 && z < -T.baseTiers[0].r + 4 && z > -T.baseTiers[0].r - 26) {
    const k = Math.min(1, Math.max(0, (-T.baseTiers[0].r - 2 - z) / 26));
    return plainHeight(x, z) + (T.baseTiers[0].h + T.baseTiers[1].h - plainHeight(x, z)) * (1 - k);
  }
  if (d < T.baseTiers[1].r) return T.baseTiers[0].h + T.baseTiers[1].h;   // 二层台
  if (d < T.baseTiers[0].r) return T.baseTiers[0].h;                       // 一层台
  return plainHeight(x, z);
}

// 时间状态预设(塞北高原天光:干爽澄澈,晨昏金)
export const DAY_STATES = {
  night: {
    az: 200, el: 40, sunColor: 0x8fa7d8, sunIntensity: 0.22,
    hemiSky: 0x2a3555, hemiGround: 0x1c1c22, hemiIntensity: 0.5, amb: 0.12,
    fogColor: 0x0d1220, fogDensity: 0.0022,
    top: 0x060a18, horizon: 0x1a2436, sunGlow: 0.12, stars: 1.0, exposure: 1.0,
  },
  dawn: {
    az: 235, el: 11, sunColor: 0xffc9a0, sunIntensity: 1.7,
    hemiSky: 0xa8b4cc, hemiGround: 0x6a6248, hemiIntensity: 0.72, amb: 0.26,
    fogColor: 0xe8d4ba, fogDensity: 0.0016,
    top: 0x8698bc, horizon: 0xf4d6ac, sunGlow: 0.72, stars: 0.05, exposure: 1.06,
  },
  morning: {
    az: 200, el: 32, sunColor: 0xfff2dc, sunIntensity: 2.7,
    hemiSky: 0xbcd4e8, hemiGround: 0x807858, hemiIntensity: 0.85, amb: 0.3,
    fogColor: 0xeee8d4, fogDensity: 0.0009,
    top: 0x8aa8d4, horizon: 0xf4e6c6, sunGlow: 0.5, stars: 0.0, exposure: 1.05,
  },
  noon: {
    az: 170, el: 60, sunColor: 0xffffff, sunIntensity: 3.1,
    hemiSky: 0xd2e4f2, hemiGround: 0x8c8c68, hemiIntensity: 0.9, amb: 0.34,
    fogColor: 0xf0eee2, fogDensity: 0.0007,
    top: 0x7ea8de, horizon: 0xeae6d2, sunGlow: 0.32, stars: 0.0, exposure: 1.02,
  },
  golden: {
    az: 258, el: 20, sunColor: 0xffd9a0, sunIntensity: 2.8,
    hemiSky: 0xc6d4e4, hemiGround: 0x8e8458, hemiIntensity: 0.85, amb: 0.3,
    fogColor: 0xf4e4c4, fogDensity: 0.0011,
    top: 0x92a6ce, horizon: 0xf8dcaa, sunGlow: 0.62, stars: 0.0, exposure: 1.06,
  },
  ember: {
    az: 240, el: 9, sunColor: 0xe09060, sunIntensity: 2.1,
    hemiSky: 0x9c8488, hemiGround: 0x50443c, hemiIntensity: 0.62, amb: 0.23,
    fogColor: 0xcc9870, fogDensity: 0.0013,
    top: 0x646290, horizon: 0xf09c62, sunGlow: 0.9, stars: 0.15, exposure: 1.12,
  },
};
