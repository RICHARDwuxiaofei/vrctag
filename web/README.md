# VRC Tag Studio

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

生产文件全部位于 `web/dist/`，可以单独复制。无需 Python、Blender、账号、数据库、API 或常驻服务。不要直接双击 HTML；Worker 和字体需要 HTTP(S) 加载。默认字体分块约 283KB；其他原字体支持的中日英字形按需加载，同源静态请求不含用户输入。HTTP 条件缓存和 Worker 有界缓存复用分块。所有建模与导出在本机进行。原完整字体仍保留在静态资源中，但运行时不请求。

## 使用

默认 Nagikokoro / 无聊 / Online / 非好友 / 无 Pronouns / 未上传头像。好友开关仅改变主名字颜色。状态与自定义文字独立，颜色可自动、预设或自定义。None/Unlisted 彻底移除 Pronouns 网格并重新安排名称位置。

“名牌样式”卡片可选 Classic（默认，恢复初版原创几何）和 Native（拟原生非对称胶囊）。切换保留用户字段与本地头像，更新布局/材质/尺寸。JSON 版本 2 记录 styleId，可用“恢复配置 JSON”恢复；无 ID 的旧配置迁移到 Classic。未知 ID/版本和无效字段会拒绝，当前设计保留。

`styles-compare.html` 提供两套模型正面/透视/好友小字对照，图片来自 Blender；本轮浏览器实测受工具安全策略阻塞，未获得新 GUI 截图。完整状态见 `../docs/STYLES-2026-11-03.md`。

PNG / JPEG / WebP 在本机读取、居中裁切为 512 像素头像（15 MB 上限）；刷新或重置会清除。头像及默认人物占位图案只在预览显示。3MF **只包含纯色圆形基座和边框，不打印照片或人物图案**。JSON 不含头像，也不含任何账户信息。

拖动旋转、滚轮/双指缩放；视图按钮恢复正面/透视。点击导出时冻结配置快照，Worker 校验同一套实体；导出后继续编辑不改变已提交文件，双击不会重复提交。名字最多 120 字符，按样式可用文字区域（Classic 72 / Native 67 mm）等比例缩小；不支持的字符（如部分 emoji）、高度低于 2.4 mm 或异常网格会阻止导出。小字高度与矢量截线笔画估计会提示风险；后者为启发式筛查，不是最小壁厚认证或可打印保证。建议 0.4 mm 喷嘴先在切片预览检查每个字符。

## 3MF

Core 3MF，毫米单位：OPC 内容类型、根关系、模型、基材颜色、独立网格对象和一个装配 build item。底板平背朝打印床。Classic 浮雕从 Z=3 mm 开始，整体 120 × 38 × 4 mm；Native 从 Z=2.8 mm 开始，整体 118 × 40 × 3.6 mm。部件相接而不相互占据体积，是同次多材料打印设计，不是可分拆卡扣。

导入为一个对象的多个部件，检查尺寸，然后将各部件颜色映射到实际耗材。此文件不包含机器、温度、喷嘴或耗材槽位配置，不是已切片工程文件。Creality Print / OrcaSlicer 可能忽略通用基材颜色或需要手工分配；真实导入验收当前 **NOT_TESTED**，总体打印兼容性 **PARTIAL**。最新完整验收见 `../docs/STYLES-2026-11-03.md`。

默认四槽 CFS 配色允许逐部件共享耗材和四槽自定义 HEX；切片软件仍需手工对应实际槽位。“全部视觉颜色”保留原色，可能超过四种。勾选打印配色预览检查实际材料颜色；会隐藏不打印的头像照片/占位人物。

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
