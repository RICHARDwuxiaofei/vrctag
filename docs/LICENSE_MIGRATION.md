# 许可证迁移报告 — 2026-11-04

本轮按仓库拥有者明确指示实施新增授权；路径清单见根 [LICENSE_SCOPE.md](../LICENSE_SCOPE.md)，第三方见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。授权范围以文件性质及例外为准，不能把根 MIT 当成所有模型的许可。

## 已实施的新增授权

| 范围 | 决定与证据 |
| --- | --- |
| 新网页 TypeScript/TSX/CSS、共享文字/Worker/校验/导出代码、测试、独立 Python/JS 建模与验收脚本 | MIT，Copyright (c) 2026 RICHARDwuxiaofei。根 LICENSE 为规范 MIT 文本；源码加 SPDX MIT，web/package.json 与锁文件根条目标记 MIT。未标记旧根 Python 或第三方代码为 MIT。 |
| Native 基础模型、GLB、JSON、图像和最早独立模型 vrc-tag-original.blend | 新增 CC BY 4.0 授权；二进制不改写，用相邻 `.license` 文件标注 SPDX。署名 RICHARDwuxiaofei — VRC Tag Studio，链接仓库与许可，注明修改。 |
| Native Nagikokoro 演示文件 | 对作者拥有的模型贡献适用 CC BY 4.0，文字使用 Noto 实际生成网格并保留来源；不声称拥有字形设计的排他权利，不重许可字体程序。 |
| 网页 Footer / 可部署许可说明 | 已显示作者、MIT、Native CC BY 4.0、Classic 例外及非 VRChat 官方产品说明；完整文本在 public/licenses/PROJECT-NOTICE.txt，随静态包分发。 |

完整许可文本分别在根 LICENSE、LICENSES/MIT.txt、LICENSES/CC-BY-4.0.txt。MIT 文本遵循 [OSI MIT](https://opensource.org/license/mit)，模型授权遵循 [CC BY 4.0 正式条款](https://creativecommons.org/licenses/by/4.0/legalcode.en)。作者只能许可其有权许可的部分；路径声明不改变第三方权利。

## Classic 单独例外

Classic 是按用户要求观察 WiseWolf 旧模板和旧生成器布局后，自行用解析公式构造的大头像/白框/黑底/黄字设计。来源记录支持“未复制旧网格、顶点、拓扑、布尔结果或旧生成器实质实现”，**不支持“相似设计必然不构成衍生作品”这一法律结论**。

因此 Classic、其演示/预览/打印样例、默认 base.json/GLB 兼容别名及目录中的 Classic 参数，没有标为无条件 CC BY 4.0。它们保守保留此前已分发的 CC BY-NC-SA 4.0 范围并明确设计权利待确认。未补造 WiseWolf 授权或取消署名。软件生成器本身 MIT 不会把生成的 Classic 模型也变成 MIT。

`web/src/styles.catalog.json` 同时含 Native 和 Classic 设计数据，采用分条目范围说明及组合 SPDX 侧文件，不将全部设计数据当作 MIT 软件。Native 与 Classic 的二进制和基础 JSON/GLB 本轮均未改写。

## 旧版与第三方

- 根 `name_tag_generator.py`、`upgrade_existing.py`、`start.cmd`、`nametag_template.blend`、ATTRIBUTION.md 和旧 README 段落保留原有 CC BY-NC-SA 4.0 范围。兼容路径不移动；legacy/README.md 与相邻 SPDX 侧文件明确例外。
- 旧根许可完整复制为 `legacy/LICENSE-before-mit.txt`，哈希应与本轮开始前一致。根 LICENSE 的修改是本轮明确授权的操作，没有抹掉旧声明。
- Noto 与重命名字体子集仍为 SIL OFL 1.1，保留原版权/全文。MIT 运行库保留自己的原作者声明，项目版权头不加到 vendored 依赖或字体。
- Blender、OrcaSlicer、3MF 插件、lib3mf 仅作为开发验证工具；可执行文件/插件代码不进仓库和静态包。Orca 测试工程嵌有上游预设数据，另外标明第三方范围，不整体重许可为 MIT/CC BY。
- 当前报告中的旧模板参考图保留 WiseWolf 署名与 NC-SA 条件，不进入网页生产资源。历史 evidence 的原版权不因新增根 MIT 而改变。

## 历史授权不可追溯撤销

此前发布的 CC BY-NC-SA 授权，对遵守条款的接收者继续有效；本次新增 MIT/CC BY 许可不会追溯撤回其已获得的权利，也不能授予第三方拥有的权利。CC 条款的不可撤销范围见 [CC BY-NC-SA 4.0 第 2(a)(1) 节及第 6 节](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en)。新版本可同时有作者有权增加的许可，但不能重写旧分发事实。

## 核实方法与边界

检查了 24c60f0 的旧文件清单、后续独立网页/建模提交和实际代码组织；旧生成器/模板与新构建依赖隔离，未见把旧代码实质实现复制进新软件的证据。Native 与初版独立模型的构造记录是无旧网格导入的新解析几何。作者已明确授权这些第一方贡献的许可变更；这不是第三方权利登记查询或法律确权。

本轮的范围检查与回归测试防止 Classic 和默认别名误标 CC BY 4.0、遗漏 OFL/第三方声明或删掉历史许可。原模型/模板/根旧 Python 字节保持不变。GitHub 通常依据默认分支显示仓库许可；本轮只更新功能分支，不修改 main，因此默认分支尚可能显示旧许可。不能为改变徽标而自动合并。

Classic 的商业/CC BY 4.0 发布仍需拥有者确认其设计是否可独立授权，必要时取得原作者许可或专业意见。当前可将明确拥有的软件与 Native 依上述范围开放，不能宣称整个混合仓库已全部变成 MIT 或可商业使用。

## GitHub 自动识别核对 — PARTIAL

功能分支远程 LICENSE 内容已与本地逐字节一致；除版权行及空白外，正文与 GitHub 官方 `/licenses/mit` 标准文本完全一致，SPDX/package 的 MIT 信息已设置。但仓库 license API 目前仍返回 **Other / NOASSERTION**，所以不能宣称 GitHub 已自动识别为 MIT；原因本轮未确认。见 [识别证据](../studio/evidence/beta-2026-11-04/github-license-recognition.json)。没有为改变徽标而修改 main 或删除模型许可例外；这是平台识别的剩余项，不改变路径级授权本身。
