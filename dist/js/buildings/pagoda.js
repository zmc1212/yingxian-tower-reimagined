// 应县木塔:八角台基 + 五明层(柱环/平坐/斗拱带/八角檐)+ 匾额 + 风铎 + 铁刹 + 一层大佛
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../config.js';
import { plaqueTexture } from '../textures.js';

const OCT = 8;

// 八角斜檐面(8 扇四边形,檐口微翘角)
function octEaveGeometry(rInner, rOuter, y, drop, lift = 0.5) {
  const verts = [];
  const idx = [];
  for (let i = 0; i < OCT; i++) {
    const a0 = (i / OCT) * Math.PI * 2 + Math.PI / OCT;      // 角点
    const a1 = ((i + 1) / OCT) * Math.PI * 2 + Math.PI / OCT;
    const am = (a0 + a1) / 2;
    // 内圈(高 y)与外圈(低 y - drop);外缘角点略上翘(lift)
    verts.push(
      Math.cos(a0) * rInner, y, Math.sin(a0) * rInner,               // 0 内角
      Math.cos(am) * rInner, y, Math.sin(am) * rInner,               // 1 内中点
      Math.cos(a1) * rInner, y, Math.sin(a1) * rInner,               // 2 内角
      Math.cos(a0) * rOuter, y - drop + lift, Math.sin(a0) * rOuter, // 3 外角(翘)
      Math.cos(am) * rOuter, y - drop, Math.sin(am) * rOuter,        // 4 外中点
      Math.cos(a1) * rOuter, y - drop + lift, Math.sin(a1) * rOuter, // 5 外角(翘)
    );
    const b = i * 6;
    // 三个子三角形扇面(内角-外角-内中点 等)
    idx.push(b + 0, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// 八角风铎
function addBells(parent, mats, r, y) {
  const bells = [];
  for (let i = 0; i < OCT; i++) {
    const a = (i / OCT) * Math.PI * 2 + Math.PI / OCT;
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), mats.bell);
    bell.position.set(Math.cos(a) * (r - 0.1), y - 0.28, Math.sin(a) * (r - 0.1));
    parent.add(bell);
    bells.push(bell);
  }
  return bells;
}

export function buildPagoda(ctx) {
  const { scene, mats, addCollider, updateFns } = ctx;
  const T = LAYOUT.tower;
  const g = new THREE.Group();
  const cx = T.x, cz = T.z;

  // ---- 石台基两层(八角) ----
  let baseY = 0;
  T.baseTiers.forEach((tier, ti) => {
    const tierMesh = new THREE.Mesh(new THREE.CylinderGeometry(tier.r * 0.92, tier.r, tier.h, OCT), mats.stoneBase);
    tierMesh.position.set(cx, baseY + tier.h / 2, cz);
    tierMesh.rotation.y = Math.PI / OCT;
    tierMesh.castShadow = true; tierMesh.receiveShadow = true;
    g.add(tierMesh);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(tier.r * 0.94, tier.r * 0.94, 0.24, OCT), mats.stone);
    cap.position.set(cx, baseY + tier.h + 0.12, cz);
    cap.rotation.y = Math.PI / OCT;
    g.add(cap);
    baseY += tier.h;
  });
  const deckY = baseY; // 塔基顶面

  // 南向石阶
  const steps = [];
  const nS = 10;
  for (let k = 0; k < nS; k++) {
    const h = deckY * ((k + 1) / nS);
    const zc = -T.baseTiers[0].r - 1 - ((nS - 1 - k) * 1.9);
    const b = new THREE.BoxGeometry(7, h, 1.9);
    b.translate(cx, h / 2, zc);
    steps.push(b);
  }
  const stairMesh = new THREE.Mesh(mergeGeometries(steps, false), mats.stoneBase);
  stairMesh.castShadow = true; stairMesh.receiveShadow = true;
  g.add(stairMesh);

  // ---- 五个明层 ----
  const bells = [];
  let y = deckY;
  const eaveR0 = T.bodyR0 + 1.2;
  for (let f = 0; f < T.floors; f++) {
    const shrink = f / (T.floors - 1);
    const rBody = T.bodyR0 - (T.bodyR0 - T.bodyR1) * shrink;
    const rEave = rBody + 3.4 - shrink * 0.6;
    const fh = T.floorH - shrink * 1.2;

    // 平坐(下层屋面延伸出的环廊面): 八角环形平台
    if (f > 0) {
      const balcony = new THREE.Mesh(new THREE.CylinderGeometry(rEave * 0.94, rEave * 0.94, 0.35, OCT), mats.wood);
      balcony.position.set(cx, y + 0.1, cz);
      balcony.rotation.y = Math.PI / OCT;
      balcony.castShadow = true; balcony.receiveShadow = true;
      g.add(balcony);
      // 平坐栏杆(8 段短墙 + 柱)
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(rEave * 0.94, rEave * 0.94, 0.85, OCT, 1, true), mats.redPaint);
      rail.position.set(cx, y + 0.75, cz);
      rail.rotation.y = Math.PI / OCT;
      g.add(rail);
    }

    // 柱环(24 根,收分)
    const nCol = 24;
    const colGeo = new THREE.CylinderGeometry(0.34 - shrink * 0.06, 0.4 - shrink * 0.06, fh, 10);
    const cols = new THREE.InstancedMesh(colGeo, mats.redPaint, nCol);
    const _m = new THREE.Matrix4();
    for (let k = 0; k < nCol; k++) {
      const a = (k / nCol) * Math.PI * 2;
      _m.identity();
      _m.setPosition(cx + Math.cos(a) * (rBody - 0.5), y + fh / 2, cz + Math.sin(a) * (rBody - 0.5));
      cols.setMatrixAt(k, _m);
    }
    cols.castShadow = true; cols.receiveShadow = true;
    g.add(cols);

    // 墙板(八面格扇,南北留门)f===0 时正南开门
    const wallGeo = new THREE.CylinderGeometry(rBody - 0.9, rBody - 0.9, fh - 0.6, OCT, 1, true, f === 0 ? Math.PI + 0.32 : 0, f === 0 ? Math.PI * 2 - 0.64 : Math.PI * 2);
    const wall = new THREE.Mesh(wallGeo, mats.timberRed);
    wall.position.set(cx, y + (fh - 0.6) / 2, cz);
    wall.castShadow = true; wall.receiveShadow = true;
    g.add(wall);

    // 檐下斗拱带
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(rBody + 0.9, rBody + 0.7, 1.5, OCT, 1, true),
      mats.dougong,
    );
    band.position.set(cx, y + fh - 0.4, cz);
    band.castShadow = true;
    g.add(band);

    // 八角斜檐
    y += fh;
    const eave = new THREE.Mesh(octEaveGeometry(rBody + 0.9, rEave, y + 0.6, 1.9, 0.55), mats.tileGrey);
    eave.position.set(cx, 0, cz);
    eave.castShadow = true; eave.receiveShadow = true;
    g.add(eave);
    const eaveBand = new THREE.Mesh(new THREE.CylinderGeometry(rEave * 0.995, rEave * 0.995, 0.22, OCT), mats.redPaint);
    eaveBand.position.set(cx, y - 1.32, cz);
    eaveBand.rotation.y = Math.PI / OCT;
    g.add(eaveBand);

    // 匾额(每层南面一块)
    const texts = ['释迦塔', '天下奇观', '鬼斧神工', '峻极神工', '永镇金城'];
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 2.6, 1.1),
      new THREE.MeshStandardMaterial({ map: plaqueTexture({ chars: texts[f] }), roughness: 0.5 }),
    );
    plaque.rotation.y = Math.PI;
    plaque.position.set(cx + rEave * 0.72, y - 2.6, cz);
    plaque.rotation.y = -Math.PI / 2;
    // 朝东偏南摆放(观览面)
    plaque.rotation.y = Math.PI / 4;
    g.add(plaque);
    void texts;

    // 风铎
    bells.push(...addBells(g, mats, rEave, y - 1.4));

    y += 0.4; // 檐口垫层
  }

  // ---- 塔刹(刹杆 + 相轮 + 铁链) ----
  const topY = y + 1;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 11.5, 10), mats.iron);
  mast.position.set(cx, topY + 5.4, cz);
  mast.castShadow = true;
  g.add(mast);
  for (let i = 0; i < 6; i++) {
    const disc = new THREE.Mesh(new THREE.TorusGeometry(1.55 - i * 0.14, 0.14, 8, 28), mats.iron);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(cx, topY + 4.4 + i * 1.35, cz);
    g.add(disc);
  }
  const apex = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mats.gold);
  apex.position.set(cx, topY + 11.6, cz);
  g.add(apex);
  // 八条铁链(斜拉细杆示意)
  for (let i = 0; i < OCT; i++) {
    const a = (i / OCT) * Math.PI * 2 + Math.PI / OCT;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 9.5, 5), mats.iron);
    const rx = Math.cos(a) * (T.bodyR1 + 2.4), rz = Math.sin(a) * (T.bodyR1 + 2.4);
    chain.position.set(cx + rx / 2, topY + 6.2, cz + rz / 2);
    chain.rotation.z = Math.atan2(rx, 9.5 - 0.6) * 0.9;
    chain.rotation.x = -Math.atan2(rz, 9.5 - 0.6) * 0.9;
    g.add(chain);
  }
  // 风铎摆动
  updateFns.push((dt, t) => {
    for (let i = 0; i < bells.length; i++) {
      const bell = bells[i];
      bell.rotation.z = Math.sin(t * 2.1 + i * 1.7) * 0.18;
    }
  });

  // ---- 一层内部:释迦大像(抽象金身) + 藻井 ----
  const inR = T.bodyR0 - 0.9;
  const fy = deckY;
  // 内墙(八角,南向门洞)
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(inR - 1.4, inR - 1.4, T.floorH - 1.4, OCT, 1, true, Math.PI + 0.36, Math.PI * 2 - 0.72),
    mats.timberRed,
  );
  inner.position.set(cx, fy + (T.floorH - 1.4) / 2, cz);
  inner.receiveShadow = true;
  g.add(inner);
  // 佛(中心偏北)
  const fx = cx, fz = cz + 1.5;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 1.6, OCT), mats.gold);
  pedestal.position.set(fx, fy + 0.9, fz);
  pedestal.castShadow = true;
  g.add(pedestal);
  const knees = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.4, OCT), mats.robe);
  knees.rotation.x = Math.PI / 2;
  knees.position.set(fx, fy + 5.4, fz);
  knees.castShadow = true;
  g.add(knees);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 3.7, 5.6, 16), mats.robe);
  torso.position.set(fx, fy + 10.4, fz);
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.55, 16, 12), mats.skin);
  head.scale.set(1, 1.16, 1.05);
  head.position.set(fx, fy + 14.1, fz + 0.7);
  head.castShadow = true;
  g.add(head);
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mats.skin);
  ushnisha.position.set(fx, fy + 15.8, fz + 0.55);
  g.add(ushnisha);
  // 背光
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.24, 24), mats.gold);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(fx, fy + 11.5, fz - 2.6);
  g.add(halo);
  // 藻井(阶梯环)
  for (let k = 0; k < 3; k++) {
    const r = inR - 2.4 - k * 1.7;
    const zao = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.5, OCT, 1, true), k % 2 ? mats.dougong : mats.goldTrim);
    zao.position.set(cx, fy + T.floorH - 1.2 - k * 0.7, cz);
    zao.rotation.y = Math.PI / OCT;
    g.add(zao);
  }
  // 窟内暖光
  const lamp = new THREE.PointLight(0xffd9a0, 900, 42, 2);
  lamp.position.set(cx + 2, fy + T.floorH - 4, cz);
  g.add(lamp);
  const lampLow = new THREE.PointLight(0xffb878, 420, 30, 2);
  lampLow.position.set(cx, fy + 4, cz + 6);
  g.add(lampLow);

  scene.add(g);
  // 漫游碰撞:塔身外环(南门豁免)
  addCollider({ circle: [cx, cz, T.bodyR0 - 1.2, T.bodyR0 - 0.2], doors: [[Math.PI, 0.2]] });
  return { group: g, topY: deckY };
}

// 塔院辅件:东西配殿 + 牌坊 + 石狮
export function buildTempleYard(ctx) {
  const { scene, mats, addCollider } = ctx;
  const g = new THREE.Group();
  const T = LAYOUT.tower;
  // 东西配殿(小硬山)
  for (const sgn of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.7, 9), mats.stone);
    base.position.set(sgn * 34, 0.35, 0);
    base.receiveShadow = true; base.castShadow = true;
    g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(14, 3.6, 7), mats.brickWall);
    body.position.set(sgn * 34, 2.5, 0);
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);
    const profile = new THREE.Shape();
    profile.moveTo(-4.2, 0); profile.lineTo(0, 2.1); profile.lineTo(4.2, 0);
    profile.lineTo(4.2, -0.3); profile.lineTo(-4.2, -0.3); profile.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(profile, { depth: 15, bevelEnabled: false });
    roofGeo.translate(-7.5, 4.3, 0);
    const roof = new THREE.Mesh(roofGeo, mats.tileGrey);
    roof.castShadow = true;
    g.add(roof);
    addCollider({ minX: sgn * 34 - 7, maxX: sgn * 34 + 7, minZ: -3.6, maxZ: 3.6 });
  }
  // 石狮一对(抽象:坐姿块体)
  for (const sgn of [-1, 1]) {
    const lion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 2.6), mats.stoneDark);
    lion.position.set(sgn * 8, 2.1 + 1.0, -T.baseTiers[0].r + 1);
    lion.rotation.y = sgn * 0.5;
    lion.castShadow = true;
    g.add(lion);
    const headM = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), mats.stoneDark);
    headM.position.set(sgn * 8, 2.1 + 2.5, -T.baseTiers[0].r + 1 - sgn * 0.4);
    g.add(headM);
  }
  scene.add(g);
  return { group: g };
}
