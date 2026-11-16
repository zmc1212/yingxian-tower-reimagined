// 地图视图:SVG 俯视示意图(塔与塔院、导览路线、章节跳转、相机标记)
import { LAYOUT } from './config.js';
import { CHAPTERS } from './chapters.js';

const VW = 560, VH = 400, SC = 0.85, CX = 30, CZ = 0;
const wx = (x) => VW / 2 + (x - CX) * SC;
const wz = (z) => VH / 2 - (z - CZ) * SC;

export function buildMapSvg(root, { onJump }) {
  const ns = 'http://www.w3.org/2000/svg';
  root.innerHTML = '';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.classList.add('map-svg');

  const rect = (x, z, w, d, cls) => {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', wx(x - w / 2)); r.setAttribute('y', wz(z + d / 2));
    r.setAttribute('width', w * SC); r.setAttribute('height', d * SC);
    r.setAttribute('class', cls);
    svg.appendChild(r);
    return r;
  };
  const circle = (x, z, r, cls) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', wx(x)); c.setAttribute('cy', wz(z));
    c.setAttribute('r', r * SC);
    c.setAttribute('class', cls);
    svg.appendChild(c);
    return c;
  };
  const label = (x, z, text, cls = 'map-label') => {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', wx(x)); t.setAttribute('y', wz(z) + 4);
    t.setAttribute('class', cls);
    t.textContent = text;
    svg.appendChild(t);
    return t;
  };

  // 田块意象
  for (const [dx, dz, s] of [[180, -160, 70], [240, 60, 64], [120, 180, 58], [-140, -140, 62], [-200, 60, 58], [-120, 200, 56]]) {
    rect(dx, dz, s, s, 'map-hill');
  }
  // 塔基两层
  circle(0, 0, LAYOUT.tower.baseTiers[0].r, 'map-stair');
  circle(0, 0, LAYOUT.tower.baseTiers[1].r, 'map-stair');
  circle(0, 0, LAYOUT.tower.bodyR0, 'map-bldg');
  label(0, 0, '释迦塔');
  // 东西配殿
  rect(-34, 0, 16, 9, 'map-bldg');
  rect(34, 0, 16, 9, 'map-bldg');
  label(-34, -12, '配殿');
  label(34, -12, '配殿');

  // 导览路线
  const route = document.createElementNS(ns, 'polyline');
  const pts = [];
  CHAPTERS.forEach((c) => c.kfs.forEach((kf) => pts.push(`${wx(kf.p[0])},${wz(kf.p[2])}`)));
  route.setAttribute('points', pts.join(' '));
  route.setAttribute('class', 'map-route');
  svg.appendChild(route);

  // 章节热点
  const HOT = [
    { i: 0, x: 300, z: -380 }, { i: 1, x: 20, z: -34 }, { i: 2, x: -4, z: 4 },
    { i: 3, x: 20, z: -3 }, { i: 4, x: 14, z: 8 }, { i: 5, x: 12, z: -2 },
    { i: 6, x: 180, z: 130 }, { i: 7, x: 80, z: 90 },
  ];
  const hotEls = [];
  for (const h of HOT) {
    const gEl = document.createElementNS(ns, 'g');
    gEl.setAttribute('class', 'map-hot');
    gEl.addEventListener('click', () => onJump(h.i));
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', wx(h.x)); c.setAttribute('cy', wz(h.z)); c.setAttribute('r', 11);
    gEl.appendChild(c);
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', wx(h.x)); t.setAttribute('y', wz(h.z) - 15);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = CHAPTERS[h.i].title.split(' · ')[0];
    gEl.appendChild(t);
    svg.appendChild(gEl);
    hotEls.push(gEl);
  }

  // 相机标记
  const marker = document.createElementNS(ns, 'g');
  const mk = document.createElementNS(ns, 'circle');
  mk.setAttribute('r', 5);
  mk.setAttribute('class', 'map-marker');
  marker.appendChild(mk);
  svg.appendChild(marker);

  root.appendChild(svg);
  return {
    svg, marker,
    update(camX, camZ, chapterIndex) {
      mk.setAttribute('cx', wx(Math.max(-260, Math.min(320, camX))));
      mk.setAttribute('cy', wz(Math.max(-260, Math.min(260, camZ))));
      hotEls.forEach((el, i) => el.classList.toggle('active', i === chapterIndex));
    },
  };
}
