import { readFile, writeFile, copyFile } from "node:fs/promises";
const root = new URL("../../", import.meta.url);
const catalog = JSON.parse(
  await readFile(new URL("web/src/styles.catalog.json", root), "utf8"),
);
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const variants = [
  "default-front",
  "default-perspective",
  "friend-pronouns-front",
];
for (const style of catalog.styles)
  for (const variant of variants)
    await copyFile(
      new URL(
        `studio/evidence/dual-style-2026-11-03/${style.id}-${variant}.png`,
        root,
      ),
      new URL(`web/public/assets/styles/${style.id}/${variant}.png`, root),
    );
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Classic 与 Native · VRC Tag Studio</title><style>
*{box-sizing:border-box}body{margin:0;background:#17181c;color:#e5e6ec;font:16px/1.7 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:30px 20px}a{color:#c6dca7}h1{font-size:32px}h2{font-size:23px}p,small{color:#b7bac4}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:20px}article,section{background:#22242a;border:1px solid #454851;border-radius:16px;padding:20px;margin:20px 0;min-width:0}figure{margin:16px 0}img{width:100%;height:auto;display:block;background:#202126;border-radius:10px}figcaption{color:#b7bac4;font-size:13px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:7px;border-bottom:1px solid #454851}input{max-width:100%;font:inherit}.reference{display:none}button{font:inherit}code{color:#c6dca7}</style>
<main><a href="./">← 返回 VRC Tag Studio</a><h1>两种轮廓，同一份个性。</h1><p>相同的 Nagikokoro · Online · 无聊 · 无 Pronouns · 非好友。以下为 Blender 正交/透视图；打开设计器可实时旋转和导出实体。</p><div class="grid">${catalog.styles.map((s) => `<article><h2>${escape(s.name)} · ${escape(s.label)}</h2><p>${escape(s.description)}</p><p>${s.layout.size.join(" × ")} mm · 头像直径 ${s.layout.avatar.radius * 2} mm · 框厚 ${s.layout.avatar.frameWidth} mm</p>${variants.map((v, i) => `<figure><img src="assets/styles/${s.id}/${v}.png" alt="${escape(s.name)} ${["默认正面", "透视", "好友加 Pronouns 正面"][i]}"><figcaption>${["默认正面", "透视：厚度与浮雕", "Friend + They/Them，状态文字仍为无聊"][i]}</figcaption></figure>`).join("")}</article>`).join("")}</div>
<section><h2>Native 与原生参考的对照</h2><p>对话中参考截图的手工近似：主体宽高约 3:1，头像约为牌高的 80%，状态点约 18–20%。金边为说话提示，不进入实体。Native 采用 2.95:1 轮廓、80% 头像和 18% 状态点，并以左右不同半径和平滑公切线形成头像侧更饱满的连接。</p><div class="grid"><figure><img src="assets/styles/native/default-front.png" alt="Native 正交视图"><figcaption>Native 默认正交视图（非截图贴图）</figcaption></figure><figure><label for="reference">在本机载入你的参考截图作并排对照（不上传）</label><input id="reference" type="file" accept="image/png,image/jpeg,image/webp"><img class="reference" id="reference-image" alt="仅本机查看的参考截图"><figcaption id="reference-note">原截图未打包或公开分发。比例为手工近似测量，不声称精确像素复刻。</figcaption></figure></div></section>
<section><h2>差异来自几何与排版</h2><table><thead><tr><th>样式</th><th>轮廓</th><th>名字 / Pronouns</th><th>状态点</th></tr></thead><tbody>${catalog.styles.map((s) => `<tr><td>${escape(s.name)}</td><td>左右端半径 ${s.geometry.leftRadius} / ${s.geometry.rightRadius} mm</td><td>${s.layout.textRules.name.height} / ${s.layout.textRules.pronouns.height} mm</td><td>直径 ${s.layout.avatar.dotRadius * 2} mm</td></tr>`).join("")}</tbody></table><p>字高是布局上限，长文字仍会缩放。两种样式共用本地文字与四槽 3MF 引擎；照片只用于预览。切片器和实物打印尚未验收。</p></section></main>
<script src="styles-compare.js" defer></script></html>`;
await writeFile(
  new URL("web/public/styles-compare.js", root),
  "let url;const input=document.getElementById('reference'),image=document.getElementById('reference-image'),note=document.getElementById('reference-note');input.addEventListener('change',()=>{if(url)URL.revokeObjectURL(url);const file=input.files[0];image.style.display='none';if(!file)return;if(file.size>15*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){note.textContent='请选择 15MB 以内的 PNG / JPEG / WebP';return;}url=URL.createObjectURL(file);image.onload=()=>{image.style.display='block';note.textContent='图片只在当前设备显示，不进入模型或导出文件。'};image.onerror=()=>{note.textContent='无法读取图片，请换一张。';};image.src=url;});addEventListener('beforeunload',()=>{if(url)URL.revokeObjectURL(url)});",
);
await writeFile(new URL("web/public/styles-compare.html", root), html);
console.log(
  "Comparison page and real Blender views generated for",
  catalog.styles.map((s) => s.id).join(", "),
);
