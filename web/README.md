# VRC Tag Studio

> 最新授权：原创软件 MIT；当前 Classic、Native 两款模型中第一方模型和设计贡献 CC BY 4.0。历史第三方模板及参考材料仍按原有许可证处理。早期验收日志保留其历史状态。见 [许可证迁移](../docs/LICENSE_MIGRATION.md) 和根 LICENSE_SCOPE.md。

静态、浏览器本地的名牌设计工具。React + TypeScript + Vite + Three.js。新应用不读取仓库根目录的 Python 生成器或旧 Blender 模板。

## 开发与构建

需要 Node.js 22.12+（本次使用 24.18）。在仓库根目录运行：

```sh
cd web
npm ci
npm run dev
npm run check
npm test
npm run test:review
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5173
```

生产文件全部位于 `web/dist/`，可以单独复制。无需 Python、Blender、账号、数据库、API 或常驻服务。不要直接双击 HTML；Worker 和字体需要 HTTP(S) 加载。默认字体分块约 283KB；其他原字体支持的中日英字形按需加载，同源静态请求不含用户输入。HTTP 条件缓存和 Worker 有界缓存复用分块。所有建模与导出在本机进行。原完整字体保留在源码供字形测试/构建使用，生产 dist 会自动移除它。

## 使用

默认 Nagikokoro / 无聊 / Online / 非好友 / 无 Pronouns / 未上传头像。好友开关仅改变主名字颜色：Classic 默认为旧式黄色、好友为更亮金色；Native 默认为白色、好友为金色。状态与自定义文字独立，颜色可自动、预设或自定义。None/Unlisted 彻底移除 Pronouns 网格并重新安排名称位置。

“名牌样式”卡片可选 Classic / Large Avatar（默认，大头像与独立白框）和 Native（拟原生非对称胶囊）。切换保留用户字段与本地头像，更新布局/材质/尺寸。JSON 版本 2 记录 styleId，可用“恢复配置 JSON”恢复；无 ID 的旧配置迁移到 Classic。未知 ID/版本和无效字段会拒绝，当前设计保留。

`styles-compare.html` 提供两套模型正面/透视/好友小字对照，图片来自 Blender；本轮浏览器实测受工具安全策略阻塞，未获得新 GUI 截图。完整状态见 `../docs/CLASSIC-LARGE-AVATAR-2026-11-03.md`。

PNG / JPEG / WebP 在本机读取、居中裁切为 512 像素头像（15 MB 上限）；刷新或重置会清除。头像及默认人物占位图案只在预览显示。3MF **只包含纯色圆形基座和边框，不打印照片或人物图案**。JSON 不含头像，也不含任何账户信息。

拖动旋转、滚轮/双指缩放；视图按钮恢复正面/透视。点击导出时冻结配置快照，Worker 校验同一套实体；导出后继续编辑不改变已提交文件，双击不会重复提交。名字最多 120 字符，按样式可用文字区域（Classic 70 / Native 67 mm）等比例缩小；不支持的字符（如部分 emoji）、高度低于 2.4 mm 或异常网格会阻止导出。小字高度与矢量截线笔画估计会提示风险；后者为启发式筛查，不是最小壁厚认证或可打印保证。建议 0.4 mm 喷嘴先在切片预览检查每个字符。

## 文字与状态灯浮雕高度

当前 Classic 和 Native 两种样式统一采用 **0.6 mm** 的文字浮雕厚度及状态灯凸起高度（此前均为 0.4 mm）。

- Display Name（包括好友金色名字）、Pronouns 和 Status Text 在原来 XY 位置和字号的基础上，仅加高 Z 轴。
- `Status_Dot` 同样只提升顶面 Z 坐标，底面与对应底板接触面不变。
- 两款模型的平面长度、宽度、底板/内芯、边框、头像区域、挂环及材料颜色不变。
- 最高点随之增加 0.2 mm：Classic **134 × 52 × 3.2 mm**；Native **120 × 46.5 × 3.9 mm**（包括挂环）。
- 网页动态生成文字，生产基础网格、兼容别名、GLB 和缩略图均应与该尺寸一致；实际切片和喷嘴兼容性仍需在打印软件中验证。

## 尺寸调整

预览下方可以分别调整 **平面长宽** 和 **模型厚度**：两组比例均支持 **50–150%**，默认 100%，并同步显示真实毫米尺寸。

- 平面 X/Y 锁定比例，一起缩放名牌外廓、头像区域、名字、状态点和挂环；厚度 Z 轴则独立。
- 预览、通用和多色 3MF、Blender GLB 下载的是缩放后的**真实几何体**，而非仅修改屏幕显示。
- 比例存于 JSON 配置并支持旧配置恢复。细字和挂环在尺寸过小时可能难以打印，应先自行检查切片。
- 本功能与 Classic/Native 新增的 0.6 mm 文字和状态灯浮雕结合：先生成加厚模型，再整体缩放；150% 厚度下凸起实际为 0.9 mm，50% 则为 0.3 mm。

## 3MF

Core 3MF，毫米单位：OPC 内容类型、根关系、模型、基材颜色、独立网格对象和一个装配 build item。底板平背朝打印床。Classic 浮雕从 Z=2.6 mm 开始，整体 134 × 52 × 4 mm；Native 从 Z=2.8 mm 开始，整体 118 × 40 × 3.6 mm。部件相接而不相互占据体积，是同次多材料打印设计，不是可分拆卡扣。

导入为一个对象的多个部件，检查尺寸，然后将各部件颜色映射到实际耗材。此文件不包含机器、温度、喷嘴或耗材槽位配置，不是已切片工程文件。Creality Print / OrcaSlicer 可能忽略通用基材颜色或需要手工分配；OrcaSlicer 2.4.2 的 18 例命令行导入/显式耗材分配/切片已通过；自动耗材映射仍为 **PARTIAL**，需要手工分配。Creality Print、切片器 GUI 逐层预览与实物打印 **NOT_TESTED**。见 [最终报告](../docs/FINAL_BETA_REVIEW.md) 与 [完整 Beta 证据](../docs/BETA_ACCEPTANCE.md)。

当前网页采用简化的默认四槽 CFS 方案；以前的逐槽颜色和高级部件映射控件已按产品决定从界面移除，旧 JSON 的相关配置字段保留兼容。不同部件仍有独立材料引用；实际切片软件中可能需要手动映射耗材。照片仅用于预览，不会印在 3MF 上。

独立校验：

```sh
# 从仓库根目录
python3 studio/scripts/validate_3mf.py studio/evidence/browser-custom.3mf
```

## 文件

- `src/model.ts`：原创文字轮廓挤出、缩放及网格校验。
- `src/styles.catalog.json` / `styles.ts`：可扩展样式注册表、尺寸、材质、布局、模型路径。
- `src/config.ts`：配置校验、迁移和 JSON 恢复。
- `src/engine.ts` / `studio.worker.ts`：可测试调度引擎、字体、按样式基础网格、异步建模和打包。
- `src/export.ts`：Core 3MF 生成。
- `src/Preview.tsx`：相同打印网格的 Three.js 预览，额外叠加仅预览头像。
- `public/assets/styles/<id>/base.json`：各样式 Blender 原创网格及 layout 元数据，单位 mm；根 base.json 是 Classic 兼容别名。
- `public/assets/styles/<id>/base.glb`：各样式基础预览资产，glTF 单位 m；应用使用同源 JSON 保持打印/预览同坐标。
- `../studio/classic.blend` / `native.blend`：两套无烘焙名字的源；此前 vrc-tag-original.blend 原样保留。
- `../docs/STATIC_DEPLOY.md`、`SOURCES.md`：部署和许可证边界。

Classic 默认白芯、黑色正面、白色外缘、黄色或金色名字与状态颜色；Native 保留用户最新指定的深色全厚度主体。实际 3MF 部件与材料独立，切片端可能需要手动分配。旧模板不进入网站构建；新版两款模型的 CC BY 4.0 授权只覆盖作者拥有的权利，不为历史模板或第三方设计授予许可。

测试默认输出到被忽略的 `web/test-results/`，不会改写历史证据。可通过 `VRC_TEST_EVIDENCE_URL=file:///绝对路径/` 指定独立输出目录（末尾保留 `/`）。诊断矩阵默认 Classic；用 `REVIEW_STYLE=native npm run test:review` 检查 Native。历史大型中间产物按 [证据索引](../studio/evidence/INDEX.md) 恢复。
