# VRC Tag Studio

在自己的浏览器里设计、预览并下载多色 3MF 名牌。无需安装 Blender、登录 VRChat 或上传头像；服务器只提供静态文件。

- **Classic / Large Avatar**：大头像、白框和黄色名字，134 × 52 × 4 mm。
- **Native / VRChat Style**：深色胶囊、非好友白字 / 好友金字，118 × 40 × 3.6 mm。
- 两种样式共享名字、Pronouns、状态文字、状态点颜色、本地头像与默认四槽 CFS 配色；JSON 可保存与恢复配置。头像照片仅供预览，不转换为彩色打印。

## 本地体验

需要 Node.js 22.12+ 和 npm。在仓库根目录执行：

```sh
cd web
npm ci
npm run dev
```

打开终端显示的本地地址。默认示例为 **Nagikokoro / 无聊 / Online / 无 Pronouns**。

```sh
# 在 web 目录验证并构建
npm run check
npm test
npm run test:review
REVIEW_STYLE=native npm run test:review
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5173
```

部署只需 `web/dist/`，不需要 Python / Blender 后台。见 [完整使用说明](web/README.md) 和 [Caddy / Nginx / 子路径部署](docs/STATIC_DEPLOY.md)。

## Beta 验收与打印

[最终合并前验收](docs/FINAL_BETA_REVIEW.md) · [上一轮完整 Beta 报告](docs/BETA_ACCEPTANCE.md) · [证据索引与历史恢复](studio/evidence/INDEX.md) · [手工网页检查清单](docs/GUI_ACCEPTANCE_CHECKLIST.md)

当前简化界面使用默认四槽方案，生成的多个实体分配到至多四种材料；旧配置的高级材料字段仍保留兼容，但不再提供逐槽高级编辑 UI。**OrcaSlicer 2.4.2 已完成 18 例命令行切片，但必须手工为部件分配耗材。** Creality Print、GUI 逐层预览和实物打印仍未验证；请选自己的打印机/耗材并逐层检查细笔画与接合，勿直接执行证据工程里的 G-code。最新网页 GUI 受浏览器工具安全限制，需按清单人工确认。

## 授权

原创软件 **MIT**；当前 Classic 与 Native 两款独立重建模型中作者拥有的模型和设计贡献 **CC BY 4.0**。旧 WiseWolf 模板、历史 Python 生成器和参考图仍按原有 CC BY-NC-SA 4.0 许可及署名处理；Noto 字体和其他依赖保留各自许可。新的授权不追溯撤销历史授权，也不构成对第三方设计或商标权利的保证。本项目不是 VRChat 官方产品。

[路径级范围](LICENSE_SCOPE.md) · [第三方声明](THIRD_PARTY_NOTICES.md) · [许可证迁移报告](docs/LICENSE_MIGRATION.md) · [来源](docs/SOURCES.md)

正式源在 [studio/](studio/README.md)，可直接打开的真实文字示例在 `studio/demos/`。旧桌面生成器仍保留，新网页构建不读取它或 `nametag_template.blend`。

<details>
<summary>历史 Python + Blender 桌面版文档（保留原有版权范围）</summary>

# vrctag

Generate printable VRC-style name tags with custom text and multicolor 3MF export. No name is preset.

## Attribution and license

Adapted from **[VRC名牌吊牌 by WiseWolf](https://makerworld.com.cn/zh/models/203011-vrcming-pai-diao-pai)** under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**. Credit the original creator, use noncommercially, and distribute model adaptations under the same license. This version changes the rim, text relief and dot placement and adds automated text, multicolor export and display options. See [ATTRIBUTION.md](ATTRIBUTION.md) and [历史许可证](legacy/LICENSE-before-mit.txt). WiseWolf does not endorse this project.

## Setup

Requires Windows, Python 3 with tkinter, and Blender 4.2 or newer.

Download the repository and keep `nametag_template.blend` beside the script. Run `start.cmd` or `python name_tag_generator.py`. Select your Blender executable and output folder, enter a name and status, then click **Generate**.

Blender runs in the background without MCP. Local preferences are saved in the ignored `settings.json`. Previous exports are preserved using revision numbers.

## Multicolor printing

Open the generated **3MF as a project** in Creality Print and load filament colors. Five parts retain assembly positions and filament assignments:

| Slot | Parts | Color |
| --- | --- | --- |
| 1 | Rim and status text | White |
| 2 | Base | Black |
| 3 | Name | Yellow |
| 4 | Status dot | Based on status |

Select printer and material settings, slice and inspect the preview, then map colors to actual CFS filaments before printing. The 3MF is an unsliced project.

Statuses: `online` (green), `offline` (gray), `busy` / `dnd` (red), `away` (orange). Custom status text is supported.

**3MF only** is enabled by default and creates only the printable 3MF in the result folder. Turn it off for five STL files, an editable Blender file, mesh validation and printing instructions. STL has no colors: import all five together as parts of one object and assign filaments.

The status dot aligns with the left edge of the name and sits immediately before the status text. Text relief is 0.5 mm (half the original 1 mm). The rim has a flat top and vertical sides, without a rounded vertical profile.

Status text and dot color can be selected independently. Choose automatic matching, a status color, or a custom color with the picker / `#RRGGBB` field. VRChat-style colors from [VRCX's official status palette](https://github.com/vrcx-team/VRCX/blob/master/src/styles/globals.css): online `#2ED319`, join me `#00B8FF`, ask me `#E97C03`, busy `#C80928`.

For display use, disable **3MF only**, enable **Avatar image**, and choose a PNG, JPG, JPEG, WebP or BMP. The image is center-cropped into the circular avatar area and packed into the Blender file. View it using Material Preview. It is not converted into printable geometry or included in 3MF/STL. Transparent images are supported. The original image file is no longer needed to open the saved Blender file.

Size: approximately 109.05 × 43.84 × 3.6 mm. Designed for multicolor printing, without snap-fit joints for separate assembly. Long text shrinks automatically; inspect thin strokes in the slicing preview.

## Command line

After configuring Blender in the GUI:

```powershell
python name_tag_generator.py --name "Your name" --status online --output "D:\Tags"
```

Optional flags: `--status-color "join me"` (or `#RRGGBB`), `--full-export`, and `--icon "avatar.png"` (requires `--full-export`).

The template contains only the base, rim and dot, with a packed font supporting Chinese and Latin text. Names and status text are generated from input.

`upgrade_existing.py` creates multicolor copies of old 3MF files in model folders under the repository's parent directory, preserving originals.

</details>


当前参考式 Classic / 白芯黑面 / 可选挂环 / 四语言状态更新与测试边界见 [docs/CLASSIC_REFERENCE_REVISION.md](docs/CLASSIC_REFERENCE_REVISION.md)。
