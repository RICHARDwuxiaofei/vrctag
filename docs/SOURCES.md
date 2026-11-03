# 来源与许可证边界

## 初版历史记录（不代表当前 Classic）

初版阶段从无网格的 Blender 场景建立胶囊实体：自定 120 × 38 mm、3 mm 厚底板，96 段圆形头像结构及状态点。Blender 原场景只有相机/灯光，没有导入 nametag_template.blend、旧网格、旧拓扑、旧顶点、布尔结果或尺寸。未打开第三方参考模型。建模脚本保存在 studio/scripts/model_geometry.py，便携入口 studio/scripts/build_model.py，源文件为 studio/vrc-tag-original.blend。

web/src 的界面、文字挤出、网格校验、3MF 装配写入及 Worker 由本次独立实现。初版时没有阅读或复制旧 Python 生成器的实质实现；本次更正阶段已按用户要求阅读其布局行为作参考，未复用实现。基础网格来自本次 Blender 导出的 base.json；GLB 是同一原创几何。截图仅用于观察胶囊、头像、状态点、名字和小字的布局，没有打包任何截图、官方 Logo、人物、游戏背景或官方纹理。

默认人物头像图案用浏览器二维圆/椭圆绘制，仅预览；没有使用图标包。界面字体来自设备系统字体，不打包商业系统字体。模型文字使用以下 Noto 字体。生成的字形轮廓仍来源于该字体，不应宣称所有导出顶点完全是第一方创造。

## 第一方许可尚未决定

根 LICENSE 及 ATTRIBUTION.md 字节未修改，旧桌面生成器与 WiseWolf 改编模板仍保留原有声明。新版第一方贡献的最终许可由仓库拥有者之后决定；本次没有授权删除历史声明，也没有擅自指定 MIT、CC0 或其他许可。web/NOTICE.md 说明新旧来源边界与待决定状态。独立建模是来源记录，不是法律意见或对所有权利的保证。根历史声明范围较宽，最终公开商业分发前应由拥有者统一澄清作用范围。

## 第三方运行时清单

| 资源 | 来源 | 本次锁定版本 | 许可与用途 |
| --- | --- | --- | --- |
| React / React DOM | https://github.com/facebook/react | 19.3.1 | MIT，界面 |
| scheduler | React 仓库 | 0.28.0 | MIT，React 内部依赖 |
| Three.js | https://github.com/mrdoob/three.js | 0.180.0 | MIT，显示、曲线与 Earcut 三角化 |
| opentype.js | https://github.com/opentypejs/opentype.js | 1.3.4 | MIT，读取字体轮廓 |
| tiny-inflate | https://github.com/foliojs/tiny-inflate | 1.0.3（见实际依赖清单） | MIT，opentype.js 内嵌依赖 |
| string.prototype.codepointat | https://github.com/mathiasbynens/String.prototype.codePointAt | 0.2.1（见实际依赖清单） | MIT，opentype.js 内嵌 polyfill |
| fflate | https://github.com/101arrowz/fflate | 0.8.3 | MIT，客户端 ZIP |
| Noto Sans CJK SC Bold | https://github.com/notofonts/noto-cjk/tree/main/Sans/OTF/SimplifiedChinese | 官方 OTF，2026-11-02 取得 | SIL OFL 1.1，中英日文字形；保留原件，派生子集另行重命名 |

运行时许可证副本在 web/public/licenses/，构建后也会包含；字体许可证在 web/public/assets/OFL-Noto.txt。精确解析结果见 runtime-dependencies.json 与 package-lock.json（优先于上表中内嵌依赖的说明版本）。

字体下载地址：https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf

字体 SHA-256：`b5f0d1a190a7f9b43c310a8850630af12553df32c4c050543f9059732d9b4c0a`。

2026-11-03：新增 `studio/scripts/build_font.mjs`，将全部 44,810 个原 cmap 支持码点分为 103 个按需 OTF。派生字体内部族名重命名为 `VRCStudioSubset`，保留源版权与 OFL，common 分块并非完整字体。原 OTF 未删除。来源许可证仍适用于所有派生字体，绝不覆盖第一方代码/模型。详见字体覆盖测试和 fixes-2026-11-03/font-coverage.json。

字体官方许可：https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE 。分发时必须保留 OFL；不将字体的许可覆盖到整个项目。

开发工具 Vite（MIT）、TypeScript（Apache-2.0）、tsx（MIT）和类型声明保留各自包许可。Playwright 测试包曾安装用于检查环境；实际 GUI 验收使用 Codex 的浏览器控制。未下载新的浏览器或切片软件。package-lock 固定全部依赖；新增资源均自托管，无第三方 CDN、分析脚本或上传端点。

3MF 结构参考官方 Core 1.4 规范：https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md 。本次手工独立实现 writer，没有复制旧生成器的 3MF 代码，也未声称得到 3MF Consortium 认证。

## 2026-11-03 双样式来源补充

Classic 从 `1f7a159` 的网页版原创生成逻辑恢复，四个部件顶点及三角形逐项相同；该历史来源是本次原创网页模型，绝非 WiseWolf 桌面模板。Native 使用独立的不同端半径/平滑公切线轮廓、头像凹口及新布局参数。共同源参数在 `web/src/styles.catalog.json`，独立源分别为 `studio/classic.blend` 和 `studio/native.blend`，资源位于 `web/public/assets/styles/<id>/`。旧 `studio/vrc-tag-original.blend` 与根第三方历史资源均保持原样。

对照页面、缩略图及六张正面/透视/好友图均为本次原创模型真实 Blender 渲染，临时演示文字来自现有 Noto 派生字体轮廓并未保存到基础源。没有新增第三方头像/贴图/Logo，未公开分发参考截图。Native 的比例来自对话截图手工近似分析，非现有网格提取，也不宣称一比一或权利认证。新第一方最终许可证仍待拥有者决定，未改变根 LICENSE 或旧许可。

模型材料现共用 sRGB HEX，由 Blender 显式转线性；中性灰替换先前青绿色底板。状态点绿色仅代表 Online。详见 [双样式验收与来源记录](STYLES-2026-11-03.md)。

## 2026-11-03 Classic 参考对象纠正（当前）

当前 `classic.blend` / Classic 网页资源已不是 `1f7a159` 的小头像胶囊。按用户明确授权，单独打开了根 `nametag_template.blend`，禁用嵌入脚本，观察物件、粗略包围尺寸、材质及 Python 生成器布局。原模板只含 White_Rim、Black_Base、Online_Status_Dot；大头像/黄色名字由旧生成器动态添加。原模板参考图没有伪造这些缺失部件，白框仅在内存中补了中性显示材质，未保存旧模板。

重建 Classic 使用自选 134×52 mm 外形、44 mm 头像、独立白色周边框和新肩部面板，圆弧/直线全部由 `model_geometry.py` 的新解析公式生成。未导入、复制、转移或重用原模板的顶点、拓扑、布尔结果、精确尺寸数据或旧 Python 实质代码。Native 的源/JSON/GLB 与 `8be7020` 字节相同。根 Python、模板、LICENSE、ATTRIBUTION.md 的哈希保持不变，证据见最新报告。

**许可风险未解决：**原作来自 [WiseWolf 的 VRC名牌吊牌](https://makerworld.com.cn/zh/models/203011-vrcming-pai-diao-pai)，旧作/改编仍有 CC BY-NC-SA 4.0 声明。大头像、白框、黑底、黄色文字的相似整体表达可能仍涉及原设计权利或衍生作品义务；从新公式写网格、尺寸不同或不复制顶点均不是自动脱离旧许可的保证。不声称忠实复刻可成为完全无约束的原创。当前只记录独立构造过程；新 Classic 的最终许可/商业使用需拥有者进一步澄清，未替拥有者选择许可证。

参考 PNG 和包含它的三栏图位于 `studio/evidence/classic-large-avatar-2026-11-03/`；参考部分保留 WiseWolf 署名、CC BY-NC-SA 4.0 和非商业/相同方式共享条件，不属于网页运行时资源或 dist。比较图中新的贡献仍待拥有者决定条款，不作额外许可授予。新版网页不读取旧模板或旧生成器。Pillow 仅用于开发时拼版，未新增浏览器依赖或字体；拼版文字仍使用现有 OFL Noto。
