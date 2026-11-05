# Cloudflare Pages 静态部署准备

2026-11-05；PARTIAL：本地静态构建通过，未连接账号、创建项目、部署或修改 DNS。Windows GUI 与切片验收未完成；发布决定 NO-GO。

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

输出路径相对于 web，因此填写 dist，不能填写 web/dist。Pages 安装 package-lock 对应依赖；核对构建日志的 Node 版本、安装和构建退出码。源码附 web/.node-version。当前 Windows 实测 Node 25.8.1，Node 22 构建尚须 CI/Pages 验证。

不要配置 Functions、Workers 生成端点、R2、KV、D1、数据库、账号系统或服务端密钥。网页 Worker 是浏览器本地 Worker。仅分发 web/dist 内部文件。不要上传整个仓库、studio、历史证据或用户图片。

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

官方限制：Free 最多 20,000 文件，单个资源最多 25 MiB；每次构建扫描实际 dist，超限即失败，不引入 R2。构建内置检查完整字体块、两套模型、许可文件，禁止 blend/py/3mf 与 legacy/reference 文件。另保存文件列表、大小及 SHA256。人工确认无私密图片、测试数据、密钥。软件 MIT；Native CC BY 4.0；Classic CC BY-NC-SA 4.0；WiseWolf 原许可署名；Noto SIL OFL 1.1；依赖原许可。保留 licenses、OFL 与模型 .license。

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
