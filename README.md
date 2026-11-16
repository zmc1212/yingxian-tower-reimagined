# 应县木塔 · 重现(Yingxian Wooden Pagoda Reimagined)

基于 **Three.js** 的沉浸式 3D 网页导览:从桑干平原的晨光里走向那座黑塔,登石台基,入一层仰见十一米释迦金身,凑近看暗层里五十四种斗拱的纵横交叠,在二层平坐听八面风铎,直上塔刹铁链之下,最后在暮色里退回平原——九百岁的木塔像一位站着的老人。

> 本项目是对 [Getty「Persepolis Reimagined」](https://persepolis.getty.edu/)(Getty × Media.Monks)的**手法致敬复刻**,场景替换为山西应县佛宫寺释迦塔;全部场景由代码程序化生成,不含原作与实景的任何美术资产。姊妹项目:`../persepolis-reimagined/`、`../tiantan-reimagined/`、`../yuanmingyuan-reimagined/`、`../great-wall-reimagined/`、`../mogao-reimagined/`、`../tulou-reimagined/`、`../xuankongsi-reimagined/`。

## 体验流程

1. **夜转日 Preloader** — 场景分帧构建,夜色与浓雾随进度转为黎明
2. **标题序列** — 三行导语渐显 → 「点击进入」
3. **滚动导览(8 章)** — 序章·桑干平原 / 塔基 / 一层·释迦 / 暗层·斗拱 / 平坐 / 塔刹 / 九百岁 / 终章·木痕;每章竖排标题 + 单字印章 + 历史短文
4. **地图视图(`M`)** — 佛宫寺平面图 + 金色游览路线 + 章节热点跳转
5. **自由漫游(`F`)** — WASD + Shift 疾跑;石阶登台基,绕塔行走(塔身南门豁免),平原任意行走
6. **后处理** — bloom、暗角、胶片颗粒贯穿全程

## 场景细节

- **八角木塔**:两层八角石台基 + 五个明层(24 柱环收分 + 八面格扇墙板 + 檐下斗拱带)+ **八角斜檐**(8 扇四边形面片,檐口翘角)+ 平坐栏杆环
- **匾额**:每层南面竖排匾额(canvas fillText 真字:释迦塔 / 天下奇观 / 鬼斧神工 / 峻极神工 / 永镇金城)
- **风铎**:八角檐角铜铃随时间摆动;**塔刹**:刹杆 + 六重相轮 + 八条铁链斜拉 + 鎏金顶
- **一层大佛**:抽象金身坐像(莲座/倚坐/田相格/背光)+ 藻井阶梯环 + 暖光
- **平原**:田块肌理高度场 + 杨树林网(沿田块边线成行)+ 远山缓丘

## 运行

```bash
npm ci
npm run build:local          # 生成 dist/js/local.bundle.js(双击入口)
npm run serve                # python -m http.server 8107 --directory dist
# 打开 http://127.0.0.1:8107/ 或直接双击 dist/index.html
```

验收与 QA 截图工具见 [AGENTS.md](AGENTS.md)。

## 技术要点

| 方面 | 实现 |
| --- | --- |
| 渲染 | Three.js 0.170 + WebGL2,ACESFilmic,EffectComposer(bloom/暗角/颗粒/OutputPass) |
| 八角几何 | octEaveGeometry(自定义 BufferGeometry:8 扇檐面 + 翘角)+ 八角柱环/墙板/斗拱带 |
| 匾额 | canvas fillText 真汉字纹理(宋体竖排) |
| 相机 | P→S 弧长映射归一化(与姊妹站点同源) |
| QA | `?qa=1&clean=1` 确定性渲染钩子(`window.__persepolis`)+ CDP 截图 |

## 文件地图

```
dist/
├── index.html / style.css     # 入口与 UI
├── vendor/                    # three.module.js + addons
└── js/
    ├── main.js               # 构建编排 → 模式切换 + QA 钩子
    ├── engine.js / postfx.js / preloader.js / tour.js   # 引擎核心(与姊妹站点同源)
    ├── camera-path.js / freeroam.js / sky.js / ui.js
    ├── config.js             # 塔身布局、平原高度场、groundHeight(台基/石阶)
    ├── chapters.js           # 8 章关键帧 + 文案
    ├── textures.js           # 朱红格扇/斗拱带/灰瓦/条石/匾额(fillText)
    ├── terrain.js            # 平原网格 + 杨树林网 + 远山
    ├── columns.js            # 柱式
    ├── map-view.js           # SVG 佛宫寺平面图
    └── buildings/
        ├── hall.js / roof.js # 通用构件
        └── pagoda.js         # 八角台基/五明层/斜檐/匾额/风铎/塔刹/一层大佛/塔院
scripts/  qa/                 # 构建与截图工具(同姊妹站点)
```

## 致谢

- **原作**:J. Paul Getty Museum × Media.Monks — [Persepolis Reimagined](https://persepolis.getty.edu/)
- [three.js](https://threejs.org/)(MIT)
- 应县木塔公开史料(辽清宁二年建、五十四种斗拱、塔刹形制)
