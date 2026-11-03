# 来源与许可证边界

## 独立原创部分

本次从无网格的 Blender 场景建立胶囊实体：自定 120 × 38 mm、3 mm 厚底板，96 段圆形头像结构及状态点。Blender 原场景只有相机/灯光，没有导入 nametag_template.blend、旧网格、旧拓扑、旧顶点、布尔结果或尺寸。未打开第三方参考模型。建模脚本保存在 studio/scripts/model_geometry.py，便携入口 studio/scripts/build_model.py，源文件为 studio/vrc-tag-original.blend。

web/src 的界面、文字挤出、网格校验、3MF 装配写入及 Worker 由本次独立实现。没有阅读或复制旧 Python 生成器的实质实现。基础网格来自本次 Blender 导出的 base.json；GLB 是同一原创几何。截图仅用于观察胶囊、头像、状态点、名字和小字的布局，没有打包任何截图、官方 Logo、人物、游戏背景或官方纹理。

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
