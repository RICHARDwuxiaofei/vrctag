# VRC Tag Studio execution log

2026-11-02, Asia/Hong_Kong. Baseline 24c60f0, clean main. Working branch codex/vrc-nameplate-web.

1. PASS: repository and legacy notices inspected; no old geometry loaded or generator code reused.
2. PASS: Blender 5.2.1 LTS connected; blank geometry scene (camera/light only). Addon protocol 9 vs server 15; use supported fallback execution. Safe mode preserved.
3. References: only Moonster Girl and Ravi_O images supplied. Missing green/Profile references; use explicit user defaults. No screenshot assets embedded.

Plan: original 120 × 38 mm capsule, 3 mm body; coplanar interfaces for relief components; +Z front, X horizontal, Y vertical. Independently authored Blender mesh feeds browser base JSON and GLB. Browser generates vector font text and exports validated closed meshes as a core 3MF assembly with base materials. No server computation.

4. PASS: original Blender source saved and reopened; base part manifold/volume checks passed; front/side/perspective evidence saved. GLB meter conversion fixed and loader-tested.
5. PASS: React/TypeScript/Vite studio, local avatar, status/friend/pronouns controls, adaptive camera and same-mesh preview.
6. PASS: Worker-local CJK outline construction, same-vertex closed cap/wall triangulation, collinear bridge repair, unsupported/small/invalid-text export blocking.
7. PASS: local ZIP/core-3MF assembly and materials; actual browser downloads independently decoded and validated. Avatar before/after archive entries byte-identical.
8. PASS: 10/10 automated tests, TypeScript, production build, desktop/mobile GUI, actual downloaded JSON and reset. Production subpath /vrctag/ loaded with a plain static file server.
9. PASS: provenance/runtime notices, source and build isolation, deployment examples and acceptance matrix. Root legacy rights unchanged.
10. PARTIAL: all deliverables present; real Creality Print / OrcaSlicer import and physical print NOT_TESTED because software/hardware absent. No deployment or main merge.

## 2026-11-03 PR #1 修复

F-01 壳体方向/空腔/交叉检查，F-02 头像错误隔离，Blender 30mm 头像/1mm 框/7mm 状态点/5.2mm Pronouns，四槽材料映射，Worker/导出快照与本地字体分块已完成。代码检查点 974e13c。TypeScript/build PASS，单元测试 23/23，原诊断 43/43，Python 回归 6/6，独立 3MF 35/35，真实浏览器桌面/窄视口及故障恢复 PASS。

完整证据、原样 XSD 编译限制、Blender 后台退出问题及切片 NOT_TESTED 见 [修复报告](FIXES-2026-11-03.md)。保留 Draft PR，不自动合并/部署/Release。

## 2026-11-03 双样式升级

实现 Classic / Native 可扩展注册表、两套原创 Blender 源/GLB/JSON、缩略图卡片、保留字段的切换、版本 2 JSON 导出/恢复及默认 Classic 重置。修正材质偏绿和打印配色预览中的非打印头像叠图；旧壳体、错误隔离、字体、快照及四槽修复保留。

36/36 单元测试、43/43 诊断、6/6 Python 壳体回归、66/66 独立 3MF、两套 Blender 重开/几何/材质检查通过。真实浏览器 URL 被工具安全策略拒绝，本轮 GUI 和截图 BLOCKED / NOT_TESTED；无替代浏览器绕过。切片器、物理打印及真实手机仍 NOT_TESTED。详见 [双样式报告](STYLES-2026-11-03.md)。保持 Draft PR，不合并/部署/Release。

## 2026-11-03 — Classic reference correction

The owner clarified that Classic refers to the pre-web WiseWolf-origin large-avatar pendant, not the first independently made web capsule. Opened the legacy template separately with scripts disabled and rendered it without saving; inspected the old generator for layout reference only. Rebuilt Classic as an independently constructed 134×52 mm medallion/shouldered panel with a 44 mm avatar, separate white rim and yellow name. Native source/JSON/GLB and root legacy files remain byte-identical. Similarity/licensing risk is explicitly unresolved; no new license chosen.

Code checkpoints: `08ec597` (large-avatar style plus profile-driven CFS4) and `80c3ef2` (pronouns/status-dot spacing). Tests: 37 automated, 43 diagnostics per style, 6 Python regressions; real browser remains BLOCKED, slicers/printing NOT_TESTED. Current full report and three-column evidence: [Classic correction](CLASSIC-LARGE-AVATAR-2026-11-03.md). Previous Classic history report is superseded, retained as an audit trail. No merge, release or VPS changes.
