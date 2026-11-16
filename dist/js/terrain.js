// 地形:桑干平原(近塔压平 + 远处缓丘)+ 杨树行/灌丛;输出 plainHeight
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './textures.js';
import { plainHeight } from './config.js';

export { plainHeight };

export function buildTerrain(scene, mats) {
  const SIZE = 4600, SEG = 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(0x9a9464), cB = new THREE.Color(0x8c8658), cC = new THREE.Color(0x707a48), cField = new THREE.Color(0xaaa26c);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = plainHeight(x, z);
    pos.setY(i, y);
    // 田块肌理(大格网)
    const field = (Math.sin(Math.floor(x / 60) * 12.9 + Math.floor(z / 60) * 7.8) * 0.5 + 0.5);
    tmp.copy(cA).lerp(cField, field * 0.5);
    tmp.lerp(cB, (Math.sin(x * 0.02 + 2.1) * 0.5 + 0.5) * 0.3);
    const deep = Math.min(1, Math.max(0, (Math.hypot(x, z) - 300) / 700));
    tmp.lerp(cC, deep * 0.45);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mats.field.clone());
  ground.material.vertexColors = true;
  ground.receiveShadow = true;
  ground.userData.noOcclude = true;
  scene.add(ground);

  buildFarHills(scene);
  buildVegetation(scene, mats);
  return { ground };
}

function hillGeometry(seed) {
  const rnd = mulberry32(seed);
  const parts = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rnd() * 0.2;
    const R = 1400 + rnd() * 400;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    const h = 90 + rnd() * 180;
    const r = h * (2.2 + rnd() * 1.0);
    const cone = new THREE.ConeGeometry(r, h, 10, 3);
    const p = cone.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const px = p.getX(k), pz = p.getZ(k);
      const n = Math.sin(px * 0.05 + i) * Math.cos(pz * 0.04 + i * 1.7);
      p.setX(k, px + n * r * 0.12);
      p.setZ(k, pz + n * r * 0.1);
    }
    cone.computeVertexNormals();
    cone.translate(x, h / 2 - 12, z);
    parts.push(cone);
  }
  return mergeGeometries(parts, false);
}

function buildFarHills(scene) {
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x707a54, roughness: 1 });
  const hills = new THREE.Mesh(hillGeometry(927), hillMat);
  hills.userData.noOcclude = true;
  scene.add(hills);
}

// ---- 植被:杨树行(农田林网)+ 灌丛 ----
function poplarGeometry(seed = 88) {
  const rnd = mulberry32(seed);
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.3, 0.45, 7.5, 7);
  trunk.translate(0, 3.7, 0);
  parts.push(trunk);
  // 杨树尖塔冠
  for (let i = 0; i < 5; i++) {
    const r = 2.2 * (1 - i * 0.15);
    const clump = new THREE.SphereGeometry(r, 6, 5);
    clump.scale(0.7, 1.25, 0.7);
    clump.translate((rnd() - 0.5) * 0.6, 5.4 + i * 2.1, (rnd() - 0.5) * 0.6);
    parts.push(clump);
  }
  return mergeGeometries(parts);
}

function shrubGeometry(seed = 199) {
  const g = new THREE.SphereGeometry(1, 6, 5);
  const p = g.attributes.position;
  const rnd = mulberry32(seed);
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) * (0.8 + rnd() * 0.5), p.getY(i) * 0.55 * (0.7 + rnd() * 0.5), p.getZ(i) * (0.8 + rnd() * 0.5));
  }
  g.computeVertexNormals();
  return g;
}

function scatterInstanced(scene, geo, mat, count, seed, place) {
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pv = new THREE.Vector3();
  const rnd = mulberry32(seed);
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 40) {
    guard++;
    const x = (rnd() - 0.5) * 3000, z = (rnd() - 0.5) * 3000;
    if (Math.abs(x) > 1450 || Math.abs(z) > 1450) continue;
    const pt = place(x, z, rnd);
    if (!pt) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
    s.set(pt.s, pt.s, pt.s);
    pv.set(x, pt.y, z);
    m.compose(pv, q, s);
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function buildVegetation(scene, mats) {
  // 杨树林网(沿田块边线成行)
  scatterInstanced(scene, poplarGeometry(), mats.pine, 220, 51, (x, z, rnd) => {
    if (Math.hypot(x, z) < 120) return null;
    const gx = Math.abs((x % 60) - 30);
    const gz = Math.abs((z % 60) - 30);
    if (gx > 2.2 && gz > 2.2) return null;
    const y = plainHeight(x, z);
    return { y: y - 0.1, s: 0.9 + rnd() * 0.7 };
  });
  // 灌丛
  scatterInstanced(scene, shrubGeometry(), mats.shrub, 160, 77, (x, z, rnd) => {
    if (Math.hypot(x, z) < 90) return null;
    const y = plainHeight(x, z);
    if (rnd() < 0.5) return { y: y - 0.1, s: 0.8 + rnd() * 1.4 };
    return null;
  });
}
