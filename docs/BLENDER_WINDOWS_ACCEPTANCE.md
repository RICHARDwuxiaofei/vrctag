# Windows Blender / 3MF 无人值守验收

2026-11-05，Asia/Shanghai。本报告接续 WINDOWS_RELEASE_READINESS.md；该历史报告中的“Node 22 未测试、浏览器全部受阻、统一 NO-GO”不再代表本轮结果。没有部署或打印。

## 分项判定

| 范围 | 状态 | 决定 |
| --- | --- | --- |
| A 软件工程 | PASS | 隔离 Node 22.23.4 下 check、39/39、Classic 43/43、Native 43/43、build 均通过；Python 12/12 |
| B 当前 A 模型与 Core 3MF | PASS | 16 个新样例独立结构 / 官方 lib3mf / 官方 Blender 扩展导入均通过；白芯 B 仅为候选，最终打印厚度 PARTIAL |
| C Cloudflare Preview 技术准备 | PASS | 可以创建小范围 HTTPS Preview，需用户授权账号和实际创建；未部署 |
| D 切片与正式打印 | NOT_TESTED | 按本轮要求不安装切片器、不连接打印机；不影响软件 Preview |
| E 完整浏览器 GUI | PARTIAL | 真实 Chrome 无头冒烟 PASS，完整交互及公网 HTTPS 尚待远程验收 |

## 环境、MCP 与隔离

Windows 11 专业版 10.0.26200 x64；Git 2.53.0.windows.2；Python 3.12.10；全局 Node 25.8.1/npm 11.11.0；隔离 Node 22.23.4（nodejs.org 官方 zip，SHASUMS256 校验一致），未替换全局版本。Blender 5.2.3 LTS e13b728c6880。实际 Chrome 进程报告 156.0.8078.74（注册表显示版本可能不同）。

PASS：127.0.0.1:9876 LISTEN；Codex 配置存在 blender-mcp；正规 get_addon_status、get_scene_info、execute_blender_code 均成功。TCP、客户端配置和实际工具调用分别验证。MCP addon 1.6 / protocol 5，服务期待 15，旧版仍可读取；没有升级或修改用户配置。当前未保存 Scene 的 Cube/Camera/Light 保持不变。后台工作使用 factory-startup、disable-autoexec 和隔离 BLENDER_USER_CONFIG；没有写回用户项目。MCP 仅用于只读确认，所有导入和渲染在独立后台进程执行。

官方扩展 threemf-io 2.7.8：来自 https://extensions.blender.org/add-ons/threemf-io/ ，zip SHA256 403f2eee3f34926ea78ad67c08d96318102b02a4d82494d4dab283f51f6f2fb9。manifest 最低 Blender 4.2，5.2.3 实际执行 PASS。隔离解压并 register，使用官方公开 import_3mf API，与 operator 相同导入管线；未保存全局 addon preferences。不是“只安装成功”。官方 Windows lib3mf 2.5.0 wheel 放在 tools/python，不改全局包。

## 每文件结果

所有文件由当前 buildDesign / export3mf 真实引擎生成，默认 Nagikokoro、状态“无聊”。A 正式结构共 12 例；B 白芯 .4/.6 两样式共 4 例。cfs4-custom 是四槽自定义颜色，mixed 为中日英混排。每例保存正面、透视真实渲染。

| 文件 | 独立结构 | lib3mf strict | Blender 实际导入 | 部件数 | 尺寸 mm |
| --- | --- | --- | --- | --- | --- |
| classic-cfs4-custom-A.3mf | PASS | PASS | PASS | 7 | 134.000 × 52.000 × 4.000 |
| classic-custom-status-A.3mf | PASS | PASS | PASS | 7 | 134.000 × 52.000 × 4.000 |
| classic-default-A.3mf | PASS | PASS | PASS | 7 | 134.000 × 52.000 × 4.000 |
| classic-default-B0.4.3mf | PASS | PASS | PASS | 8 | 134.000 × 52.000 × 4.000 |
| classic-default-B0.6.3mf | PASS | PASS | PASS | 8 | 134.000 × 52.000 × 4.000 |
| classic-friend-pronouns-A.3mf | PASS | PASS | PASS | 8 | 134.000 × 52.000 × 4.000 |
| classic-long-A.3mf | PASS | PASS | PASS | 7 | 134.000 × 52.000 × 4.000 |
| classic-mixed-A.3mf | PASS | PASS | PASS | 8 | 134.000 × 52.000 × 4.000 |
| native-cfs4-custom-A.3mf | PASS | PASS | PASS | 6 | 118.000 × 40.000 × 3.600 |
| native-custom-status-A.3mf | PASS | PASS | PASS | 6 | 118.000 × 40.000 × 3.600 |
| native-default-A.3mf | PASS | PASS | PASS | 6 | 118.000 × 40.000 × 3.600 |
| native-default-B0.4.3mf | PASS | PASS | PASS | 7 | 118.000 × 40.000 × 3.600 |
| native-default-B0.6.3mf | PASS | PASS | PASS | 7 | 118.000 × 40.000 × 3.600 |
| native-friend-pronouns-A.3mf | PASS | PASS | PASS | 7 | 118.000 × 40.000 × 3.600 |
| native-long-A.3mf | PASS | PASS | PASS | 6 | 118.000 × 40.000 × 3.600 |
| native-mixed-A.3mf | PASS | PASS | PASS | 7 | 118.000 × 40.000 × 3.600 |

每例验证单个组件装配、四槽引用、材料 RGB、封闭有向网格、正实体体积、零非流形边、零退化面。lib3mf 无警告。Blender 导入尺寸和实体体积与源 3MF 交叉核对通过，颜色 sRGB→线性值匹配，未发现本轮插件材料丢失。Name/Pronouns/Status_Text 底面与底板上表面 Z 相等；此为几何接触检查，不是粘合强度或切片认证。独立验证不提供任意网格自相交的完备数学证明。

正式源 classic/native 通过 beta_blender.py --mode check：逐顶点与三角索引比对 runtime JSON、无缺失外部资源；只另存检查副本及 GLB，不覆盖正式源。Native compatibility source 同样检查。演示文件的真实文字网格检查在上一轮本机已完成；本轮渲染全部使用新生成并经官方扩展实际导入的 3MF。

## 真实渲染画廊

绝对路径 D:\CODE\vrctag\evidence\windows-blender-review\index.html，直接用浏览器打开即可，不需要后台。64 张真实 Blender Cycles 图：全部 16 文件各有正面/透视，默认 A/B 追加背面、侧面、实际网格剖面与展开；另有黑白诊断分件和厚度局部。黑白诊断图为材料隔离显示，不是原始配色；剖面只切检查副本。图中可能包含扩展平滑法线带来的光照变化，不代表几何鼓包。另有 4 张真实 Chrome 页面截图，明确标为页面截图，不冒充 Blender 图。

目录内 generation.json、validation.json、blender-import.json、comparison.json、candidate-regressions.json、http-static.json、browser-smoke.json 记录参数和结果，samples 存实际 3MF，images 存渲染。证据目录被 Git 忽略，不进入 dist。

## 软件与 HTTP

修复：npm test 移除 Node 22 不支持的 --test-isolation=none，保留全部测试，采用正常文件隔离；修复后 39/39。首轮 test exit 9 日志保留。两样式 review 各 43/43。check/build/Python 全通过。未重构生成器。

真实回环 HTTP 静态服务请求首页、全部 JS/Worker、两模型 JSON/GLB、字体等 153 文件；状态 200、MIME 与磁盘 SHA256 一致，最大 744134 字节；服务结束后关闭。首次 HTTP 检查与 build 并发，dist 被构建重建导致失败；按先构建后 HTTP 顺序重跑 PASS，不当作产品缺陷。构建内置排除 legacy/reference/blend/py/3mf，103 字体块和许可完整。Pages 20000 文件 / 25 MiB 单文件限制满足。

## 实际浏览器证据

使用独立 Playwright-core 和已安装 Chrome headless、临时 profile，无桌面控制与策略绕过。真实 production dist 加载，样式按钮切换、两种 Blob 3MF 下载、混排名字、Friend、They/Them 和 390/320 视口执行 PASS。零 pageerror、零 HTTP >=400、零观察到的外部请求。两个实际下载又经独立结构与 lib3mf strict 验证 PASS。Worker 由页面真实生成/下载链路间接验证；不是只请求 JS 文件。

完整 GUI 仍 PARTIAL：损坏头像、所有 Pronouns/状态、自定义颜色交互、JSON GUI 恢复、快速切换/导出竞态、旋转缩放与持续内存/GPU 增长尚未完整测试。公网 HTTPS Blob、部署缓存与自定义域名 NOT_TESTED，不用本地 HTTP 替代。交给用户通过 Preview 完成。

## Preview 与许可

纯静态技术条件 PASS，配置 Repository RICHARDwuxiaofei/vrctag、root web、build npm run build、output dist、NODE_VERSION 22。浏览器本地生成和导出；无 VPS、Functions、Workers 生成后端、R2、D1、数据库或服务器密钥。此为源码与本地配置核对，没有访问 Cloudflare 账号，不能声称已核对账号里的 Dashboard 配置。Preview 可能公开，禁止上传私密测试资料。

保留 MIT 软件、Native CC BY 4.0、Classic CC BY-NC-SA 4.0、WiseWolf 原许可署名、Noto OFL 和依赖原许可。本轮无授权范围修改。

## Git、复现与下一步

开发分支 codex/vrc-nameplate-web；本轮实现检查点 71cbc7f750c00d8763ba151b654b9735f730c800（A 正式模型未变），起始检查点 1bcbfdd906a019e309b96b0a24dc5ccb5dece87b。本报告后续提交只更新文档，最终最新 SHA 见 Git HEAD、PR #1 和交接消息，避免文件自引用哈希。PR #1 保持 OPEN，不自动合并。

复现顺序：先在 web 用隔离 Node 运行 check/test/review/build；node --import tsx tests/windows-blender-review.ts；回仓库根运行 windows_3mf_audit.py、Blender --background --factory-startup --disable-autoexec --python studio/scripts/windows_blender_review.py、windows_review_details.py、windows_candidate_regression.py、windows_review_gallery.py；最后 windows_static_audit.py 和 windows_browser_smoke.mjs。tools 下官方扩展、lib3mf、Node 和 Playwright 为本地隔离前置依赖；脚本路径固定以本仓库为准。切片器不在流程中。

推荐下一步：用户授权并创建仅用于远程验收的 Pages Preview，按 CLOUDFLARE_PAGES_DEPLOY.md 的 Preview 章节操作；完整 GUI 验收后再决定合并。白芯候选参见 WHITE_CORE_PRINT_OPTIMIZATION.md，尚未选定最终可打印层厚，不进入当前网页。未部署、改 DNS、Release、连接打印机或打印。


后续更新：用户要求正式集成白芯、参考式单边框/挂环和四语言状态；当前实现及新测试见 [CLASSIC_REFERENCE_REVISION.md](CLASSIC_REFERENCE_REVISION.md)。本文的候选状态保留为该次历史验收结论。
