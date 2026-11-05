# 静态部署（仅交付配置，未上线）

在 web 目录执行 `npm ci && npm run build`。仅部署 dist 内部内容；不要部署仓库根目录和 node_modules。所有字体和模型由同一静态站点提供，没有外部 CDN 或生成端点。服务器只发送静态文件。

## Caddy 示例

将构建复制到你选择的独立目录，例如 /srv/vrc-tag-studio，另行审查域名与站点冲突后使用：

```caddyfile
studio.example.com {
    root * /srv/vrc-tag-studio
    encode zstd gzip
    file_server
    header X-Content-Type-Options nosniff
    header Referrer-Policy no-referrer
    header Content-Security-Policy "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
}
```

## Nginx 示例

```nginx
server {
    listen 80;
    server_name studio.example.com;
    root /srv/vrc-tag-studio;
    index index.html;
    location / { try_files $uri $uri/ =404; }
    gzip on;
    gzip_types application/javascript application/json text/css;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer;
}
```

TLS 证书按你现有方案配置。不要将示例整个覆盖到已有配置；本次未访问 VPS、修改 DNS、反向代理或任何生产文件。只需 HTTP 静态服务，不要为本项目安装后台 Blender 或数据库。

## 子路径与 GitHub Pages

Vite 使用 `base: './'`，脚本与 Worker 的模型地址相对于当前站点路径。部署到 `/vrctag/` 时保留 dist 的目录层级，用带尾斜线的 URL。无前端路由，直接静态文件即可。GitHub Pages 可将 `web/dist` 上传 Pages artifact；本次未创建/启用 Pages 或发布工作流。若使用 Jekyll，选择静态 artifact 方式或加 .nojekyll。

更新时替换 HTML、哈希脚本及 public assets；字体分块 URL 带内容哈希，可设置 public/max-age/immutable；manifest.json 和 index.html 必须可重验证，不要永久缓存。HTTP fetch 使用 no-cache 以重验证；同一 Worker 内另有有界分块缓存。保留旧哈希分块直至旧页面失效可避免升级中断。原始完整 OTF 留在源码作来源；构建检查会从 dist 移除，103 个字体块仍完整。

上线前：先在目标子路径验证默认模型、中文、Pronouns 和 3MF 下载；再完成切片器验收。许可证已按路径划分：软件 MIT，当前两种模型的第一方贡献 CC BY 4.0，历史第三方素材保留原许可；详见根 LICENSE_SCOPE.md。


双样式静态资源与 `styles-compare.html` / `styles-compare.js` 一起包含在 dist；保留 `assets/styles/<id>/` 全部目录。默认 Classic，旧配置自动迁移；上线前必须实际测试卡片切换、JSON 恢复、两种样式下载及窄屏。对照页参考图用本机 Blob URL，仅本地查看。样式 JSON 用 HTTP 重验证，更新时应连同应用哈希脚本一起原子部署，避免新旧注册表/网格混用。本轮没有操作任何生产配置。

当前 Classic 已改为 Large Avatar；生产资源只包含新的两种样式。旧 WiseWolf 参考渲染与三栏审核拼版位于 studio/evidence，不能复制到 dist 冒充新版无条件授权资源。设计许可风险与最新未完成验收见 FINAL_BETA_REVIEW.md；本轮未部署。

2026-11-04 Beta：`npm run build` 还会检查 103 个按需字体块，并从 dist 移除仅供源码/字形构建/测试使用的完整 17 MB OTF；不要自行删除源码字体。部署新版本时保留 `licenses/PROJECT-NOTICE.txt`、MIT/CC 文本和模型侧许可文件。代码 MIT 和当前模型 CC BY 4.0 分别授权；旧模板等历史第三方内容仍按原许可保存。当前真实网页 GUI 仍待验收，Orca 2.4.2 已完成 18 例离线切片但需要显式耗材映射；见 BETA_ACCEPTANCE.md。没有因此自动部署本机或 VPS。
