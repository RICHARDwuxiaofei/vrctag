# Cloudflare Pages 静态部署准备

2026-11-09 PR #7 当前验收：隔离 Node 22.23.4、65/65 单元测试、17/17 指定测试、双样式各 43/43；32 GLB 下载及 Blender 导入、64 份 3MF 严格验证通过。175 个静态文件逐项 HTTP/哈希核对通过。公开 Beta 技术准备 GO，等待批准合并；未实际部署，线上 HTTPS/CDN 验收 NOT_TESTED。以 [PR7_FINAL_ACCEPTANCE.md](PR7_FINAL_ACCEPTANCE.md) 为本轮结果，下面较早测试数量仅为历史记录。

2026-11-05 更新：Preview 技术准备 PASS。隔离 Node 22.23.4 构建、39/39、双样式 43/43、完整静态 HTTP 和真实 Chrome 无头冒烟通过。可以在用户授权后创建小范围 Preview；正式打印 NOT_TESTED、完整 GUI PARTIAL。未连接账号、创建项目、部署或修改 DNS。详见 BLENDER_WINDOWS_ACCEPTANCE.md。

## Dashboard 与 GitHub

获得上线批准、PR 合并并验收 main 后：Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git。授权 GitHub 时仅选择 RICHARDwuxiaofei/vrctag。创建 Pages 项目；不要选择模型生成 Worker。

| 字段 | 值 |
| --- | --- |
| Repository | RICHARDwuxiaofei/vrctag |
| Production branch | main（已批准合并的版本） |
| Framework | React (Vite)，或 None 并手填下列字段 |
| Root directory | web |
| Build command | npm run build |
| Build output directory | dist |
| Production / Preview environment | NODE_VERSION=22 |

输出路径相对于 web，因此填写 dist，不能填写 web/dist。Pages 安装 package-lock 对应依赖；核对构建日志的 Node 版本、安装和构建退出码。源码附 web/.node-version。当前 Windows 已用隔离 Node 22.23.4 实测构建及测试通过；仍需核对实际 Pages 构建日志。

Cloudflare Pages 的 GitHub 集成自带拉取代码、构建和部署流程；不需要 GitHub Actions。不要配置 Functions、Workers 生成端点、R2、KV、D1、数据库、账号系统或服务端密钥。网页 Worker 是浏览器本地 Worker。仅分发 web/dist 内部文件。不要上传整个仓库、studio、历史证据或用户图片。

## Preview 与 HTTPS

上线批准后再启用 Preview branch controls，可仅包含 codex/vrc-nameplate-web；不要将其设为生产分支。Preview 地址默认可能公开，不放私人输入。首次关联本身可能触发部署，应等批准后执行。

先在分配的 HTTPS *.pages.dev 地址验证，再添加自定义域名。检查证书正常，无混合内容。所有模型生成与 ZIP/3MF 下载在浏览器进行；在 HTTPS 下实际导出并打开 Blob 下载文件，不能用本地 HTTP 结果替代。

## 自定义域名（本轮不执行）

项目 → Custom domains → Set up a domain，先建立 Pages 域名关联。子域可由现有 DNS 提供商添加 CNAME 指向项目 pages.dev；根域需要作为该 Cloudflare 账号的 zone 并配置 nameserver。审批 DNS 变更后才执行，等待状态 Active 和证书签发，再重复下载及资源检查。不要仅添加 DNS 而漏掉 Pages 关联。

## 缓存与版本

public/_headers 在构建时复制到 dist；所有响应 no-cache，允许存储但要求重验证。当前模型 URL 无内容哈希，因此不设置 immutable，也不要启用 Cache Everything 或覆盖规则。不要启用额外 Service Worker。字体块和应用 JS 带哈希；manifest、模型 JSON/GLB 和 HTML 随一次部署整体更新。旧打开页面跨部署时仍须测试；no-cache 本身不能保证旧 JS 与新模型兼容。如出现跨版本错误，应刷新页面并回滚，不能宣称已验证无版本混用。

## 本地静态验收（无需生成后端）

在 web 执行 npm ci、npm run check、npm test、npm run test:review、npm run build。构建后可直接在本机 Python 静态文件服务器运行：python -m http.server 4173 --bind 127.0.0.1 --directory dist。打开 http://127.0.0.1:4173/。这只提供文件；无需任何模型后端。file:// 不支持正常 Worker/fetch，不可替代。停止服务器使用 Ctrl+C。

按 GUI_ACCEPTANCE_CHECKLIST.md 和本次用户 20 项清单检查两个样式、语言、头像、JSON、竞态、390/320px、3D。DevTools Preserve log 检查 Worker、103 个字体块、两套 JSON/GLB、无 404/跨域上传；保存 HAR 前移除私人数据。下载七组真实 3MF 后在 Creality Print/Orca 中验证尺寸、分件、四槽映射、细字层与真实切片。不能仅验证仓库历史样例。

在 pages.dev 和自定义域名分别重复上述项目，并检查 _headers、冷/热缓存与旧页面升级。生产站点根路径与子目录测试分开记录；相对 base='./' 不自动证明所有子路径已通过。

## 包与许可证门槛

官方限制：Free 最多 20,000 文件，单个资源最多 25 MiB；每次构建扫描实际 dist，超限即失败，不引入 R2。构建内置检查完整字体块、两套模型、许可文件，禁止 blend/py/3mf 与 legacy/reference 文件。另保存文件列表、大小及 SHA256。人工确认无私密图片、测试数据、密钥。软件 MIT；Classic 与 Native 的第一方模型贡献 CC BY 4.0；旧 WiseWolf 资源及参考图保留历史原许可与署名；Noto SIL OFL 1.1；依赖各自原许可。保留 licenses、OFL 与模型 .license。

## 回滚

保存批准的 commit、构建日志和 manifest。项目 Deployments → 选择此前成功生产部署 → Rollback to this deployment；Preview 不能作为生产回滚目标。回滚后检查 HTML、Worker、字体、两模型和下载。后续 Git 修复使用正常提交或 revert，禁止 force push。首次部署若没有旧生产部署，应暂停访问/撤下发布并修复后重建，不虚构回滚点。

## 官方依据（2026-11-05 核对）

- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/rollbacks/

## 仅 Preview 的下一步操作（需用户自行授权账号）

本轮没有访问 Cloudflare Dashboard，以下是待应用方案，不是现有账号配置的实测结果。软件 Preview 不必等待实物打印，也不要求提前合并 PR。Production branch 仍为 main，Preview branch 为 codex/vrc-nameplate-web，禁止把开发分支改成生产分支。

1. 用户登录 Cloudflare，在 Workers & Pages 的 Pages Git integration 中连接 GitHub，仅授权本仓库。不要在聊天或仓库粘贴 API token。
2. 按上表设置 web / npm run build / dist / NODE_VERSION=22（Preview 与 Production 都设置）。保存前确认这是用户批准的创建/部署动作；Dashboard 的首次 Save and Deploy 可能立即触发 main 构建，不能声称绝不会部署生产。若 main 尚无 web，则首次构建可能失败，不要通过将生产分支改为开发分支来绕过。正式 main 内容仍须按原流程审查。
3. 创建后进入 Settings → Builds & deployments → Branch control：关闭生产自动部署（保留 main），Preview 选择自定义包含 codex/vrc-nameplate-web。若界面名称变化，按官方 Branch deployment controls 文档查对应项。首次 main 构建与之后自动部署开关分别核对。
4. 对开发分支触发一次新的 Preview 构建（可通过后续正常 push；若界面支持重试对应 Preview，可重试）。确认 deployment environment 是 Preview、commit 是本轮提交，构建日志 Node 22、npm 和静态检查均成功；不要点击生产提升或合并。
5. 打开生成的 HTTPS Preview URL。Preview 地址可能任何知道 URL 的人都能访问，随机地址不等于访问控制；需要保密时再单独评估 Access，不上传私密头像和资料。无需自定义域名、DNS 或 VPS。
6. 远程依次验证默认 Nagikokoro/无聊、Classic/Native 结构、Friend/Pronouns/状态、混排/长名、头像上传移除及坏图、四槽/视觉色、JSON 往返、快速修改与重复导出、旋转缩放、桌面/390/320。检查 DevTools 网络与错误，导出七组实际 3MF。重点确认 HTTPS Blob 下载、Worker 与字体分块 200，以及无第三方上传。
7. 记录 Preview URL、commit、浏览器版本、截图和实际下载哈希。Preview 通过仅代表软件远程验收，不代表正式生产、切片或打印。需要新一轮明确批准才合并 main、启用生产自动部署或绑定域名。

官方分支控制：https://developers.cloudflare.com/pages/configuration/branch-build-controls/ 。官方说明默认提交可触发 production/preview 部署，因此账号关联不能在本轮擅自执行。静态本地及无头浏览器通过不替代部署后的 HTTPS 验收。