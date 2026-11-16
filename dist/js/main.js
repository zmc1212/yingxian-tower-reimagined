// 主入口:构建场景 → 标题序列 → 滚动导览 ⇄ 地图 ⇄ 自由漫游
import * as THREE from 'three';
import { createEngine } from './engine.js';
import { createSky, applyState } from './sky.js';
import { makeMaterials } from './textures.js';
import { buildTerrain, plainHeight } from './terrain.js';
import { buildPagoda, buildTempleYard } from './buildings/pagoda.js';
import { buildTourPath, TourCamera } from './camera-path.js';
import { TourController } from './tour.js';
import { RoamController } from './freeroam.js';
import { buildMapSvg } from './map-view.js';
import { Preloader } from './preloader.js';
import { setupUI } from './ui.js';
import { CFG, DAY_STATES, groundHeight } from './config.js';

const ui = setupUI();
let engine, sky, mats, tourCam, tour, roam, mapHud, pre = null;
let qaLastChapter = -1;
const colliders = [];
const addCollider = (c) => colliders.push(c);
const updateFns = [];

// QA 参数:?qa=1 跳过循环、确定性单帧渲染;&clean=1 隐藏 HUD
const QAParams = new URLSearchParams(location.search);
const QA_MODE = QAParams.has('qa');
const QA_CLEAN = QAParams.has('clean');

function fail(msg) {
  console.error(msg);
  ui.showError(msg);
}

async function boot() {
  const canvas = document.getElementById('gl');
  try {
    engine = createEngine(canvas);
  } catch (err) {
    fail(`WebGL 初始化失败:${err.message}<br>请使用支持 WebGL2 的现代浏览器(Chrome / Edge / Firefox)。`);
    return;
  }
  sky = createSky(engine.scene);
  engine.sun = sky.sun;
  mats = makeMaterials();
  const ctx = { scene: engine.scene, mats, addCollider, updateFns };

  // ---- 构建步骤(真实进度;夜转日) ----
  pre = new Preloader({ sky, renderer: engine.renderer, ui });
  pre.loading = true;
  pre.add('黎明前的黑暗 · 光照与天穹', () => {});
  pre.add('铺展桑干平原', () => { buildTerrain(engine.scene, mats); });
  pre.add('砌筑八角石台基', () => { buildTempleYard(ctx); });
  pre.add('立柱架梁 · 五明层', () => { buildPagoda(ctx); });
  pre.add('日出 · 准备启程', () => {
    const path = buildTourPath();
    tourCam = new TourCamera(path, engine.camera, {
      groundHeight: (x, z) => groundHeight(x, z, plainHeight),
      colliders,
    });
    tour = new TourController({
      dom: canvas,
      onChapterChange: (i) => {
        if (mode !== 'tour') return;
        ui.showChapter(i);
      },
      getMode: () => mode,
      tourCam,
    });
    roam = new RoamController({
      camera: engine.camera, dom: canvas, colliders, plainFn: plainHeight,
    });
    roam.onLockChange((locked) => {
      if (!locked && mode === 'roam') ui.setRoamMode(true);
    });
    mapHud = buildMapSvg(ui.el.mapBox, { onJump: (i) => { ui.toggleMap(false); tour.jumpToChapter(i); } });
    ui.buildDots((i) => tour.jumpToChapter(i));
    buildAtmosphere();
    engine.updateFns.push(frameUpdate);
    for (const fn of updateFns) engine.updateFns.push(fn);
  });

  const startLoop = () => {
    preloaderDone();
    if (!QA_MODE) engine.loop();
  };
  pre.run(() => engine.render(), startLoop);

  applyNightStart();
}

// 空气中的浮尘(大漠沙尘)
function buildAtmosphere() {
  const N = 1100;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 700 + 60;
    pos[i * 3 + 1] = Math.random() * 50 + 1;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 900 - 40;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffe8c8, size: 0.15, transparent: true, opacity: 0.45,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  engine.atmos = pts;
  engine.scene.add(pts);
  engine.updateFns.push((dt) => {
    pts.rotation.y += dt * 0.006;
  });
}

let mode = 'preloader';

function applyNightStart() {
  engine.camera.position.set(350, 28, -430);
  engine.camera.lookAt(0, 28, 0);
  engine.camera.fov = 56;
  engine.camera.updateProjectionMatrix();
}

function preloaderDone() {
  mode = 'intro';
  pre.loading = false;
  ui.hidePreloader();
  ui.showIntro();
  if (QA_MODE) {
    if (QA_CLEAN) document.body.classList.add('qa-clean');
    enterTour();
    return;
  }
  engine.onFrame = (dt) => {
    engine.camera.position.y += Math.sin(performance.now() * 0.0002) * 0.02;
    engine.camera.rotation.z = Math.sin(performance.now() * 0.00013) * 0.004;
  };
}

function enterTour() {
  mode = 'tour';
  ui.hideIntro();
  engine.onFrame = null;
  tour.enabled = !QA_MODE;
  ui.showHud();
  ui.showChapter(0);
  ui.showScrollHint();
  applyState(sky, DAY_STATES.dawn, engine.renderer);
  if (!QA_MODE) {
    setTimeout(() => ui.hideScrollHint(), 9000);
    setTimeout(() => ui.hideChapter(), 14000);
  }
}

function frameUpdate(dt) {
  const t = engine.clock.elapsedTime;
  for (const fn of updateFns) fn(dt, t);
  if (mode === 'tour') {
    tour.update(dt, tourCam);
    if (tourCam.state) applyState(sky, tourCam.state, engine.renderer);
    if (ui.el.mapOverlay.classList.contains('show')) {
      const c = engine.camera.position;
      mapHud.update(c.x, c.z, tourCam.chapterIndex);
    }
  } else if (mode === 'roam') {
    roam.update(dt);
  }
}

function enterRoam() {
  if (mode !== 'tour' && mode !== 'map') return;
  ui.toggleMap(false);
  mode = 'roam';
  tour.enabled = false;
  ui.hideChapter();
  ui.setRoamMode(true);
  roam.enter([engine.camera.position.x, groundHeight(engine.camera.position.x, engine.camera.position.z, plainHeight) + 1.8, engine.camera.position.z]);
}

function exitRoam() {
  mode = 'tour';
  ui.setRoamMode(false);
  tour.enabled = true;
  tour.setProgress(tour.P);
  ui.showChapter(tourCam.chapterIndex);
  setTimeout(() => ui.hideChapter(), 8000);
}

function bindEvents() {
  boot();
  ui.el.enterBtn.addEventListener('click', enterTour);
  ui.el.mapBtn.addEventListener('click', () => {
    const open = !ui.el.mapOverlay.classList.contains('show');
    ui.toggleMap(open);
    if (open && mode === 'tour') tour.enabled = false;
    if (!open && mode === 'tour') tour.enabled = true;
  });
  ui.el.mapClose.addEventListener('click', () => {
    ui.toggleMap(false);
    if (mode === 'tour') tour.enabled = true;
  });
  ui.el.roamBtn.addEventListener('click', () => {
    if (mode === 'roam') { exitRoam(); } else { enterRoam(); }
  });
  ui.el.roamBack.addEventListener('click', exitRoam);
  ui.el.fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && (mode === 'tour' || mode === 'map')) ui.el.mapBtn.click();
    if (e.code === 'KeyF' && (mode === 'tour' || mode === 'roam')) ui.el.roamBtn.click();
  });
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', bindEvents);
else bindEvents();

// ---- 入口加载失败的可操作错误(工作区规范) ----
window.addEventListener('error', (e) => {
  if (mode !== 'preloader' && mode !== 'intro') return;
  fail(`${e?.message || '未知错误'}<br><br>
    若以双击(file://)方式打开:请确认打开的是 <b>dist/index.html</b>,且同目录存在 js/local.bundle.js;<br>
    若通过 HTTP 访问:请运行 <code>python -m http.server 8107 --bind 127.0.0.1 --directory dist</code>。`);
});

// ---- QA 确定性钩子(验收截图用) ----
window.__persepolis = {
  get ready() { return !!(engine && (mode === 'intro' || mode === 'tour') && pre && !pre.loading); },
  async waitReady() {
    while (!(engine && (mode === 'intro' || mode === 'tour'))) await new Promise((r) => setTimeout(r, 120));
    return true;
  },
  render(ms, progress, instant = true) {
    if (!tourCam) return false;
    mode = 'tour';
    tourCam.t = ms / 1000;
    tour.setProgress(progress, instant);
    tourCam.update(tour.P, 0);
    if (tourCam.state) applyState(sky, tourCam.state, engine.renderer);
    if (engine.grain) engine.grain.uniforms.uTime.value = (ms / 1000) % 97;
    if (!QA_CLEAN) {
      const ch = tourCam.chapterIndex;
      if (qaLastChapter !== ch) { qaLastChapter = ch; ui.showChapter(ch); }
    }
    engine.render();
    return true;
  },
  chapter(i) {
    if (!tour) return false;
    tour.jumpToChapter(i);
    return true;
  },
  bounds() {
    return tourCam ? tourCam.path.boundsS : [];
  },
  sceneProbe(x, y, z) {
    if (!engine) return null;
    const hits = [];
    const p = new THREE.Vector3(x, y, z);
    engine.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
      o.updateWorldMatrix(true, false);
      if (!o.geometry || !o.geometry.boundingSphere) o.geometry?.computeBoundingSphere?.();
      const bs = o.geometry?.boundingSphere;
      if (!bs) return;
      const c = bs.clone().applyMatrix4(o.matrixWorld);
      const d = c.center.distanceTo(p) - c.radius;
      if (d < 6) hits.push({ name: o.name || o.type, dist: Math.round(d * 10) / 10 });
    });
    return hits.slice(0, 12);
  },
  renderPose(ms, pos, look, fov = 55) {
    if (!engine) return false;
    engine.camera.position.set(...pos);
    engine.camera.up.set(0, 1, 0);
    engine.camera.lookAt(...look);
    engine.camera.fov = fov;
    engine.camera.updateProjectionMatrix();
    if (engine.grain) engine.grain.uniforms.uTime.value = (ms / 1000) % 97;
    engine.render();
    return true;
  },
  roamPlace(x, z) {
    if (!roam) return false;
    enterRoam();
    roam.pointer.enabled = false;
    roam.enabled = true;
    const h = groundHeight(x, z, plainHeight);
    roam.camera.position.set(x, h + roam.eye, z);
    roam.camera.rotation.set(0, 0, 0);
    return true;
  },
  roamStep(dt) {
    if (!roam) return false;
    roam.update(dt);
    return roam.camera.position.toArray().map((v) => Math.round(v * 100) / 100);
  },
  state() {
    return {
      mode,
      progress: tour ? tour.P : 0,
      chapter: tourCam ? tourCam.chapterIndex : -1,
      colliders: colliders.length,
      tier: engine ? engine.tier : null,
      sun: tourCam && tourCam.state ? { az: Math.round(tourCam.state.az), el: Math.round(tourCam.state.el), fog: Math.round(tourCam.state.fogDensity * 10000) / 10000, stars: Math.round(tourCam.state.stars * 1000) / 1000 } : null,
      cam: engine ? engine.camera.position.toArray().map((v) => Math.round(v * 10) / 10) : null,
      fov: engine ? Math.round(engine.camera.fov) : null,
    };
  },
};
