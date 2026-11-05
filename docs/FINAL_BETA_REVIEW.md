# VRC Tag Studio — Beta 合并前最终验收

日期：2026-11-04。结论：**CONDITIONAL**。自动回归、正式源重开和格式复核通过，未发现核心损坏；建议先按 [网页手工清单](GUI_ACCEPTANCE_CHECKLIST.md) 完成当前构建的 GUI 检查，再决定合并和公开 Beta。未合并 main、发布 Release、部署服务器或连接打印机。

## 版本与范围

分支 `codex/vrc-nameplate-web`，[PR #1](https://github.com/RICHARDwuxiaofei/vrctag/pull/1)。上轮完整交付 **106f547440b011836195460338c99deb3a2163e6**；上一轮完整测试源码 **28def62309fdbbdf681ecf6e3775014f2434e888**。

本轮完整工程检查点 **2641fd6267be984d2ffa95fa54fe368a5c832e61**；报告日期修复及最终诊断检查点 **6680b8cdabbe27a0390b2e2a221195b2f0d20ab0**。后续提交仅补充本报告、测量和验收证据，不改变产品代码。最终交付提交的完整 SHA 以 PR 最新描述和 `git log -1 --format=%H` 为准，避免在一个提交的内容里伪造该提交自身的哈希。

产品源码、运行资产、依赖锁、正式及演示模型和全部许可文本与 `106f547…` 字节一致；该产品版本也与 `28def623…` 一致。[215 文件核对](../studio/evidence/final-beta-2026-11-04/preserved-product-and-licenses.json) 记录完整 SHA256。本轮不重新建模、不重新下载安装大型工具、不重复整批切片。

## 整理内容及大小

清理前 Git 管理文件 **956 个 / 82,266,671 字节（78.46 MiB）**；其中 evidence **708 个 / 46,933,858 字节（44.76 MiB）**。

清理后统计见下方自动记录标记及 [完整测量](../studio/evidence/final-beta-2026-11-04/repository-size.json)。统计包含本次新增报告、索引及小型日志；不把 node_modules、dist、测试缓存算成正式源码。

<!-- SIZE_SUMMARY -->
清理并纳入本轮交付后：**540 个文件 / 52,001,524 字节（49.59 MiB）**；evidence **290 个 / 16,650,437 字节（15.88 MiB）**。正式树比清理前减少 **36.8%** 逻辑字节。
<!-- /SIZE_SUMMARY -->

移除 **443 个 / 30,669,426 字节（29.25 MiB）** 历史中间产物，包括重复成功样例、详细审计分片、Blender 导出/重开副本、14 个额外切片工程和重复成功日志。保留 18 个正式源 3MF、4 个代表性切片工程、最终四张路径图及其他历史路径图、关键正面/透视和失败截图、F-01 无效壳及 F-02 损坏头像、全部正式/演示源与许可证文件。

[证据索引](../studio/evidence/INDEX.md) 提供查找/恢复方式；[清理清单](../studio/evidence/final-beta-2026-11-04/cleanup-manifest.json) 保存每条路径、原因、字节数、Git blob 与 SHA256，删除前逐项确认与固定历史提交完全一致。旧报告对被归档文件的 Markdown 链接已固定到原提交；JSON 中原运行路径仍是历史路径，不假装全部文件仍在当前树。没有删除未跟踪用户文件，没有重写历史或强推。

Git 对象库保留全部历史，因此 **clone 历史体积不会因本次删除而缩小**；新提交可能使对象库稍增。工作目录总量还包含依赖、忽略的旧副本及本次临时测试，单独记录逻辑字节与当前实际磁盘块占用，不能和正式树数字混用。

测试默认输出改到被忽略的 `web/test-results/`，Blender 检查副本进入 `studio/generated/` 或指定临时目录；取消大范围新 3MF 自动纳入规则，已跟踪的精选样例仍保留。未删减测试或修改通过预期。

## 本轮实际执行

| 项目 | 状态 | 证据 / 范围 |
| --- | --- | --- |
| npm ci | PASS | [日志](../studio/evidence/final-beta-2026-11-04/npm-ci.txt)；锁文件不变。首次沙箱子进程 EPERM 留有失败日志，普通用户授权环境重试成功，没有管理员权限 |
| TypeScript | PASS | [typecheck](../studio/evidence/final-beta-2026-11-04/typecheck.txt) |
| 自动测试 | PASS，39/39 | [unit-tests](../studio/evidence/final-beta-2026-11-04/unit-tests.txt)，覆盖 F-01/F-02 逻辑、壳体/空腔、字体、两样式、配置及调度错误恢复；不代替真实 GUI |
| test:review | PASS，Classic 43/43、Native 43/43 | [Classic](../studio/evidence/final-beta-2026-11-04/matrix-classic.json)、[Native](../studio/evidence/final-beta-2026-11-04/matrix-native.json)；日期修正后重跑，拒绝条件保持 |
| Python 回归 | PASS，12/12 | [日志](../studio/evidence/final-beta-2026-11-04/python-regressions.txt) |
| 生产构建 | PASS | [build](../studio/evidence/final-beta-2026-11-04/build.txt)，两样式 JSON/GLB、Worker、103 字体块及许可文件存在；源码完整 17 MB OTF 自动排除 |
| 精选 3MF 独立结构/逐壳体检查 | PASS，4/4 | 两样式默认与 Friend＋Pronouns；CRC/XML、mm、单装配、闭合/方向/体积、相交、材料引用、尺寸；[报告](../studio/evidence/final-beta-2026-11-04/representative-3mf-validation.json) |
| 官方 lib3mf 严格读取 | PASS，18/18，零警告 | 重用已核实来源的临时 v2.5.0 工具；[本轮报告](../studio/evidence/final-beta-2026-11-04/lib3mf-validation.json) |
| 保留源包 / 切片工程 CRC 与原始字节 | PASS，22/22 | [18 源包＋4 工程哈希](../studio/evidence/final-beta-2026-11-04/retained-3mf-hashes.json) 与上一轮交付完全一致 |
| 真实网页 GUI | BLOCKED | 沿用明确的浏览器工具安全拒绝，未换其他浏览器控制/CDP/抓取路径绕过。[记录](../studio/evidence/final-beta-2026-11-04/browser-acceptance.json)；桌面/390/320px 与全部上传/下载操作需人工完成 |

[执行版本与退出码](../studio/evidence/final-beta-2026-11-04/test-execution.json)。当前 Node.js 24.18.0、npm 11.16.0、Blender 5.2.1 LTS；无新安装系统软件。依赖安装和 Blender 仅在受限子进程问题后使用普通用户执行环境；没有 sudo。

构建仍提示约 744 kB 主 JS chunk，属于已知首载优化项，本轮不扩大重构。首次约 283 kB 字体块、其他字形按需加载，未减少中日英覆盖。静态检查未发现 `.blend/.py/.3mf`、旧模板、参考/私密/证据图片进入 dist；字体和 Worker 路径保持原有相对同源结构。源码网络调用仅加载同源资源，建模/压缩在客户端；这属于代码/构建审计，**本轮没有新的 Network 面板实测**。Caddy/Nginx 仅托管 dist，不需要 Python/Blender 后台。

## Blender 与样式

| 样式 | 正式源 | 真实导出文字演示 | 尺寸 |
| --- | --- | --- | --- |
| Classic / Large Avatar | [classic.blend](../studio/classic.blend) | [classic-nagikokoro.blend](../studio/demos/classic-nagikokoro.blend) | 134 × 52 × 4 mm |
| Native / VRChat Style | [native.blend](../studio/native.blend) | [native-nagikokoro.blend](../studio/demos/native-nagikokoro.blend) | 118 × 40 × 3.6 mm |

**PASS**：[正式源检查](../studio/evidence/final-beta-2026-11-04/blender-sources.json) 与 [演示重开](../studio/evidence/final-beta-2026-11-04/demo-reopen.json)。全部在独立后台进程实际打开并正常退出；未操作用户现场。正式 5 / 4 个基础实体、对象/锚点、0.001 m 单位、+Z 正面、材质与无外部丢失检查通过；顶点/三角形与网页 JSON 精确对应，并实际编辑恢复、导出临时副本。演示分别 7 / 6 个实体，包括真实导出的 Name、Status_Text、Status_Dot，没有以假 FONT 替代。原始 `vrc-tag-original.blend` 同样重开，文件未改。

本轮未重新渲染未变化的模型。以下保留上一轮同字节源的最终 Blender 图，**不是本轮 GUI 截图**：

| Classic | Native |
| --- | --- |
| ![Classic 正面](../studio/evidence/beta-2026-11-04/classic-front.png) | ![Native 正面](../studio/evidence/beta-2026-11-04/native-front.png) |
| ![Classic 透视](../studio/evidence/beta-2026-11-04/classic-perspective.png) | ![Native 透视](../studio/evidence/beta-2026-11-04/native-perspective.png) |

旧模板仅用于历史视觉参考，没有进入网页构建；保持来源记录和 Classic 的设计权利例外。独立计算公式与未复用网格不能证明设计层面无衍生权利风险，本轮不作额外权利承诺。

## 打印验证分级

- **结构/几何 PASS**：本轮精选 4 源包独立检查＋18 官方严格读取。历史 **116 源包** 审计由 [汇总](../studio/evidence/beta-2026-11-04/regression-audit-summary.json) 和 Beta 主矩阵保留，产品与当时测试版本无差异，未把本轮未重跑的 116 项称为新运行。
- **Blender 扩展导入 PASS（上一轮）**：两默认例，材料/部件/尺寸/文字已验证。本轮重开正式源/演示是独立检查，未再次把导入扩展当切片器。
- **OrcaSlicer 2.4.2 CLI 导入及实际切片 PASS（上一轮 18/18）**：[完整记录](../studio/evidence/beta-2026-11-04/orca-validation.json)。输入与产品未变，未重复生成。**自动耗材映射 PARTIAL，必须手工分配部件耗材**；不能把 Core 颜色等同自动 CFS 槽位。
- 默认/好友 CFS4 材料表恰为 4，所有部件 slot/pindex/color 一致，可共享槽位且仍是独立网格；Classic 白框与黄名独立，Native 名称/点色分离，尺寸核对通过。全视觉 Classic 5 / Native 7 色是可选模式，不能宣称一套四槽全部打印。
- **Creality Print、切片器 GUI 逐层预览、实物打印：NOT_TESTED**。历史路径图来自真实 G-code，不是 GUI 截图。CLI 通过不等于所有细小笔画或实际层间粘合达标。

[18 个实际源样例](../studio/evidence/beta-2026-11-04/samples/) 和 [4 个代表性切片工程](../studio/evidence/beta-2026-11-04/orca/) 保留。工程为离线验证使用的通用 PLA / K2 Plus 配置，**不要直接给自己的打印机执行其 G-code**。必须在自己的切片器选择设备、耗材、映射槽位，检查文字与底板接合、细笔画/空腔，再安排本人试打。

## 许可证最终核对

**PASS，策略未改变**。根 [LICENSE](../LICENSE)、[LICENSE_SCOPE](../LICENSE_SCOPE.md)、[THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md)、[迁移报告](LICENSE_MIGRATION.md)、模型/字体许可及旧归档均原字节保留。README 与网页 Footer 明确：软件 MIT；Native/初版模型 CC BY 4.0；**Classic CC BY-NC-SA 4.0 例外**；旧 WiseWolf 权利和署名、Noto OFL 与库原许可继续适用。历史 CC 分发不能追溯撤销。修正旧桌面 README 的 LICENSE 链接，使其指向原许可归档而非根 MIT，未改许可正文。

Classic 不能被承诺为无条件可商用模型；需要更宽授权时仍需权利确认或新的设计决定。GitHub 自动识别 NOASSERTION 属已知显示问题，按本轮要求不是阻断项，没有为了改显示去改许可结构。

## 合并与公开 Beta 结论

**CONDITIONAL**：未发现功能/格式/许可声明的新增阻断。GitHub PR 当前基线查询为 `MERGEABLE / CLEAN`，没有远程检查任务（本地通过不等于托管 CI）；推送后的最新状态在 PR 描述核对。继续保持 Draft，最终合并由拥有者决定。

公开 Beta 前需完成 [网页清单](GUI_ACCEPTANCE_CHECKLIST.md) 中的真实操作，尤其两样式切换、损坏头像后下载、导出快照、JSON 恢复与 320/390px。通过后可在 **明确 Classic 非商业例外及打印未认证** 的条件下公开 Beta。Creality、切片器 GUI 与本人试打继续列作清楚的打印验收待办；不得宣传成生产级/全切片器/实物可靠打印已认证。

本轮没有伪造新 GUI 截图，没有降低 F-01/F-02 预期或删除失败证据；全部受限事项保持明确状态。
