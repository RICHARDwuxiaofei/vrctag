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
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5173
```

生产文件全部位于 `web/dist/`，可以单独复制。无需 Python、Blender、账号、数据库、API 或常驻服务。不要直接双击 HTML；Worker 和字体需要 HTTP(S) 加载。首次需下载约 17 MB 的自托管 Noto CJK 字体；之后由浏览器 HTTP 缓存处理。首次加载完成后，设计和导出不再发送网络请求。

## 使用

默认 Nagikokoro / 无聊 / Online / 非好友 / 无 Pronouns / 未上传头像。好友开关仅改变主名字颜色。状态与自定义文字独立，颜色可自动、预设或自定义。None/Unlisted 彻底移除 Pronouns 网格并重新安排名称位置。

PNG / JPEG / WebP 在本机读取、居中裁切为 512 像素头像（15 MB 上限）；刷新或重置会清除。头像及默认人物占位图案只在预览显示。3MF **只包含纯色圆形基座和边框，不打印照片或人物图案**。JSON 不含头像，也不含任何账户信息。

拖动旋转、滚轮/双指缩放；视图按钮恢复正面/透视。导出时 Worker 重新使用当前配置生成并校验同一套实体。名字最多 120 字符，按 72 mm 区域等比例缩小；不支持的字符（如部分 emoji）、高度低于 2.4 mm 或异常网格会阻止导出。小于 4.5 mm 的文字提示薄笔画风险；这不是笔画宽度检测，也不是可打印保证。建议 0.4 mm 喷嘴先在切片预览检查每个字符。

## 3MF

Core 3MF，毫米单位：OPC 内容类型、根关系、模型、基材颜色、独立网格对象和一个装配 build item。底板平背朝打印床，所有浮雕从 Z=3 mm 开始，0.8/1 mm 高。整体 120 × 38 × 4 mm。部件相接而不相互占据体积，是同次多材料打印设计，不是可分拆卡扣。

导入为一个对象的多个部件，检查尺寸，然后将各部件颜色映射到实际耗材。此文件不包含机器、温度、喷嘴或耗材槽位配置，不是已切片工程文件。Creality Print / OrcaSlicer 可能忽略通用基材颜色或需要手工分配；真实导入验收当前 **NOT_TESTED**，总体打印兼容性 **PARTIAL**。详见 `../docs/ACCEPTANCE.md`。

独立校验：

```sh
# 从仓库根目录
python3 studio/scripts/validate_3mf.py studio/evidence/browser-custom.3mf
```

## 文件

- `src/model.ts`：原创文字轮廓挤出、缩放及网格校验。
- `src/studio.worker.ts`：字体、基础网格、异步建模和打包。
- `src/export.ts`：Core 3MF 生成。
- `src/Preview.tsx`：相同打印网格的 Three.js 预览，额外叠加仅预览头像。
- `public/assets/base.json`：Blender 原创网格及 layout 元数据，单位 mm。
- `public/assets/base.glb`：可独立读取的基础预览资产，glTF 单位 m；应用实际使用 JSON 以保持打印/预览相同坐标。
- `../studio/vrc-tag-original.blend`：无烘焙用户名的可编辑源。
- `../docs/STATIC_DEPLOY.md`、`SOURCES.md`：部署和许可证边界。
