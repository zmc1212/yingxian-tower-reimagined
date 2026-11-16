# 应县木塔 · 重现(Yingxian Wooden Pagoda Reimagined)— 站点说明

致敬复刻 Getty「Persepolis Reimagined」手法的 Three.js 沉浸式导览,场景为**山西应县佛宫寺释迦塔**:
夜转日 preloader → 标题序列 → 滚动章节导览(序章·桑干平原 → 塔基 → 一层·释迦 → 暗层·斗拱 → 平坐 → 塔刹 → 九百岁 → 终章·木痕)→ 地图跳转 → 自由漫游。全部 3D 内容程序化生成,无外部美术资产。

姊妹项目:`../persepolis-reimagined/`、`../tiantan-reimagined/`、`../yuanmingyuan-reimagined/`、`../great-wall-reimagined/`、`../mogao-reimagined/`、`../tulou-reimagined/`、`../xuankongsi-reimagined/`(同一套引擎与 QA 体系)。

## 启动方式

- **HTTP(推荐)**:项目根目录运行
  `python -m http.server 8107 --bind 127.0.0.1 --directory dist`
  然后访问 `http://127.0.0.1:8107/`(8107 为本站专用端口;8102-8106 为姊妹站点,勿混用)。
- **双击(file://)**:直接打开 `dist/index.html`,入口为 `dist/js/local.bundle.js`(IIFE 产物)。
- 页面卡住/黑屏:看 DevTools Console/Network;错误屏会给出可操作提示。

## 构建与检查

- `npm ci` — 安装依赖(three 0.170.0 精确锁定 + esbuild)。
- `npm run check` — dist/js 全模块 `node --check`。
- `npm run build:local` — 可复现生成 `dist/js/local.bundle.js`。**改动 dist/js 后必须重新执行**。
- dist/vendor/ 为 three.module.js 与所用 addons 的拷贝,供 HTTP importmap 使用。

## 验收命令

1. HTTP:打开 `http://127.0.0.1:8107/`,应看到夜转日 preloader → 三行导语「点击进入」→ 滚动推进 8 章(二层为塔内大佛视角,三四章为塔身近景),`M` 地图跳转,`F` 自由漫游,控制台无资源错误。
2. 双击:直接打开 `dist/index.html` 同样验证。
3. 确定性截图:`node qa/shot.mjs "http://127.0.0.1:8107/?qa=1&clean=1" qa/shots/tour "" 1440 900 6000`
   - 输出 `console errors: 0` 为通过;`pose:` 模式任意位姿截图;`qa/debug-eval.mjs <url> <expr>` 任意表达式调试(已禁缓存)。
4. 漫游无头验证要点:石阶登台基、台基两层行走、塔身外环碰撞(南门豁免)、平原任意行走。

## 场景取舍

- 塔身为抽象八角木构(五明层,无暗层实体;斗拱以纹理带示意),非测绘模型。
- 一层大佛为抽象金身坐像,不刻画五官;匾额为 canvas 真字(宋体竖排)。
- 无环境音效、无多语言切换(界面中文,竖排标题 + 单字印章)。
