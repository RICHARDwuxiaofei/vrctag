# Windows 发布验收记录

日期：2026-11-05（Asia/Shanghai）。最终判定 **NO-GO**。自动检查通过不代表真实 GUI、切片或打印通过。

## 工作区与版本

PASS：空目录 D:\CODE\vrctag 直接克隆，无额外嵌套目录。origin=https://github.com/RICHARDwuxiaofei/vrctag.git，分支 codex/vrc-nameplate-web。重新 fetch 确认远程起始 HEAD de4a3ecebf0b9318976554059355166be7f81974；未回退历史版本、未修改 main。克隆后工作区干净。PR #1 OPEN，base main，head 正确。GitHub CLI 认证已配置，不记录凭据。

Windows 11 专业版 10.0.26200 x64；Git 2.53.0.windows.2；Node 25.8.1；npm 11.11.0；Python 3.12.10；Steam Blender 5.2.3 LTS e13b728c6880；Chrome 156.0.8078.80；Edge 156.0.4314.58。Node 22 尚 NOT_TESTED，Pages 显式选择 22。

## 自动验证

| 项目 | 状态 | 本轮结果 |
| --- | --- | --- |
| npm ci | PASS | exit 0 |
| npm run check | PASS | exit 0 |
| npm test 初次 | FAIL | 38/39，Native 许可 LF 匹配遇到 CRLF |
| npm test 修复后 | PASS | 39/39，exit 0 |
| Classic review | PASS | 43/43，exit 0 |
| Native review | PASS | 43/43，exit 0；见 review-native.log |
| Python unittest discover | PASS | 12/12 |
| npm run build 最终 | PASS | exit 0，103 个字体块完整 |

修复仅在测试读取时规范化 CRLF，保留原授权检查强度，没有修改许可证或跳过失败测试。Git 首次 schannel AcquireCredentialsHandle 失败；单次命令使用 OpenSSL 后成功，未关闭证书校验或更改全局 Git 配置。普通执行与桌面工具出现 helper_unknown_error: setup refresh had errors；命令检查通过正常用户执行继续，Git 使用命令级 safe.directory，未修改全局信任设置。

## 真实浏览器 GUI

BLOCKED：computer-use 初始化及恢复均因桌面执行工具退出失败，另一浏览器入口同样失败。未取得真实 Chrome/Edge 操作结果、截图、Console/Network/HAR、Worker 活性和资源增长证据。用户要求的全部 20 项 GUI 检查均 NOT_TESTED，包含上传/损坏头像、颜色、竞态、移动视口、旋转和下载一致性。没有用历史报告或 Node 测试冒充 GUI。

## Blender

PARTIAL：本机 Blender 后台实际打开 studio/classic.blend、studio/native.blend；运行 check_styles 检查对象集合、单位 scale 0.001、材质线性色、锚点、正体积、零非流形边及部件相交体积。两套 PASS。演示 classic-nagikokoro.blend 和 native-nagikokoro.blend 实际重开，封闭正向文字网格通过，源文件 SHA256 不变。自动 GLB 尺寸检查通过 Classic 134×52×4 mm / Native 118×40×3.6 mm。

NOT_TESTED：真实 Blender 窗口、正面/透视截图、逐点源与前端几何一致性、外部资源完整 GUI 检查；未证明可用 3MF 扩展。没有修改任何用户 Blender 项目或保存源文件。

## 3MF 与切片

PARTIAL：Windows Node 测试重新生成多组 Core 3MF，保存在 web/test-results，含默认、friend/pronouns、混合字符、长名字和状态。12 项 Python 回归使用仓库 fixture，不能算网页下载文件验证。

BLOCKED：本机注册表、常见安装目录及 winget 清单未定位 Creality Print/OrcaSlicer；桌面操作工具故障也阻止真实验收。本轮未下载安装大型软件。七组实际网页下载 3MF、软件导入、尺寸、分件、四耗材手工映射、修复警告、文字接合、细字逐层与真实切片均 NOT_TESTED。官方 lib3mf 本轮 NOT_TESTED。既无切片成功结论，也无实物打印结论；未连接打印机或发送任务。

## 部署与许可

PARTIAL：纯静态 dist 构建通过，共 153 文件，最大 744134 字节，低于 Pages Free 20000 文件和 25 MiB/文件限制。模型 JSON/GLB、103 字体块与许可文件由内置构建检查验证；未包含 blend/py/3mf、旧 reference/legacy 包。部署清单与 SHA256 在本地 evidence/windows-20261105/dist-manifest.csv。源码检查使用本地 Worker 与相对 URL；无新增生成后端或密钥。浏览器第三方网络、HTTPS Blob、子路径和跨部署缓存仍 NOT_TESTED。

新增 web/.node-version=22、public/_headers（no-cache 重验证）及 CLOUDFLARE_PAGES_DEPLOY.md。最终构建包含配置文件。部署文档按 2026-11-05 官方文档核对；本轮没有连接 Cloudflare、改 DNS 或发布。

PASS（声明一致性）：Footer、LICENSE_SCOPE、README 与 public 许可记录保留软件 MIT / Native CC BY 4.0 / Classic CC BY-NC-SA 4.0 例外 / WiseWolf 原署名 / Noto OFL / 依赖原许可。此为范围记录一致性，不是对权属的法律裁定或商业服务授权。

## 证据、交接与发布决定

本机日志：D:\CODE\vrctag\evidence\windows-20261105（忽略目录，不纳入 Git）；生成样例：D:\CODE\vrctag\web\test-results（忽略目录）。保留首轮失败和修复后日志。无真实 GUI 截图；不能提供不存在的证据。提交仅包含小型修复、配置与文档。

NO-GO：当前不建议作为最终验收完成而合并 main，也不建议部署 Pages Beta。应先恢复真实桌面控制，补齐用户 20 项 GUI 和 7 组网页下载文件，在 Creality Print/Orca 完成真实切片；再用 Node 22 复核构建，记录 HTTPS 和缓存验收。通过后等待用户批准合并与部署。实际打印须由用户本人进行，重点确认中文/日文细字、字与底板接合、颜色及机械强度。不得自动打印、合并、Release、部署或强推。

回滚代码使用正常 revert；没有更改正式 Blender 源和切片器配置。PR 更新后最终 SHA 以 git log -1 和 PR head 为准，避免报告自引用提交哈希。

2026-11-05 后续无人值守验收更新：本文件保留为首轮历史记录；当前分项状态、Node 22、官方扩展导入、lib3mf、真实渲染和 Chrome 无头检查见 BLENDER_WINDOWS_ACCEPTANCE.md。Preview 技术准备现在 PASS，完整 GUI PARTIAL，切片/打印 NOT_TESTED；不再用首轮统一 NO-GO 否定后续通过的检查。
