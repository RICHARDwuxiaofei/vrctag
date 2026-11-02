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

更新时替换 HTML、哈希脚本及 public assets；可为字体设置缓存，但本次字体 URL 未带版本哈希，升级字体时应改名或清理缓存。不要长期缓存 index.html。

上线前：先在目标子路径验证默认模型、中文、Pronouns 和 3MF 下载；再完成切片器验收。许可尚未由仓库拥有者最终决定，详见 SOURCES.md。
