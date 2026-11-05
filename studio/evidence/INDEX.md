# 验收证据索引

本次整理只精简当前 Git 树，不重写历史；不会缩小已保存的 Git 历史或已有 clone 的对象库。所有授权文本、署名、许可侧文件均保留。新的测试输出默认放入被忽略的 `web/test-results/` 或 `studio/generated/`，需要交付时再有选择地归档。

| 目的 | 保留位置 |
| --- | --- |
| 最终验收、清理清单/原始大小/Git blob/SHA256 | [final-beta-2026-11-04](final-beta-2026-11-04/) / [cleanup-manifest.json](final-beta-2026-11-04/cleanup-manifest.json) |
| 完整 Beta 结论、116 源包及 18 次切片汇总 | [Beta 报告](../../docs/BETA_ACCEPTANCE.md)、[beta-2026-11-04](beta-2026-11-04/) |
| 两样式最新正面 / 透视 | Beta 目录 `classic-front.png`、`classic-perspective.png`、`native-front.png`、`native-perspective.png` |
| 18 个正式未切片源样例 | [samples](beta-2026-11-04/samples/)；包含两样式默认、好友/小字、中日混排、长名、自定义状态、CFS4 和全视觉颜色 |
| 四个代表性已切片工程与实际路径图 | [orca](beta-2026-11-04/orca/)；每样式 default / friend-pronouns。仅供验收，需按自己的设备重新切片 |
| 官方 lib3mf / Blender 扩展 / 支撑审计 | Beta 目录 `lib3mf-validation.json`、`blender-extension-import.json`、`independent-print-audit.json` |
| 原模板 / 新 Classic / Native 三栏对照 | [正面](classic-large-avatar-2026-11-03/comparison-front.png)、[透视](classic-large-avatar-2026-11-03/comparison-perspective.png)；参考资源署名见该目录 reference/NOTICE.md |
| F-01 唯一反向壳复现 | [synthetic-inward-shell.3mf](review-2026-11-02/synthetic-inward-shell.3mf)，故意无效，不能打印 |
| F-02 损坏图片及修复前后浏览器证据 | [invalid.png](review-2026-11-02/invalid.png)、review 目录错误截图、[修复目录](fixes-2026-11-03/) 的 f02/worker/reset 截图及 browser-f02-*.3mf |
| 旧版本网页桌面 / 手机证据 | 根目录及 fixes/review 中 .jpg，均为历史截图，不能作为当前大头像双样式 GUI 通过证据 |
| 未通过尝试和恢复 | Beta `attempts-and-recovery.json`、保留的失败日志；Classic `interim/matrix-before-color-contract-update.json` |
| 字体覆盖与历史各轮测试 | fixes 的 font-coverage.json、各轮 matrix / summary / 日志仍保留 |

## 已归档中间产物

完整原始树固定在提交 **106f547440b011836195460338c99deb3a2163e6**。清单中的每个移除文件都在删除前验证了该提交的 Git blob 与当前字节相同；未移除未跟踪的用户文件。旧报告中指向移除文件的 Markdown 链接已改为固定提交链接。JSON 审计中的原路径仍表示历史运行时路径，可按清单恢复，不能据此断言文件仍位于当前树。

归档内容：多轮批量成功样例、详细审计分片、已被正式模型/演示替代的重开和导入副本、额外 14 个切片工程、重复成功日志与部分渲染中间 JSON。保留所有最终结论、截图、独特失败、18 个正式源样例及四个代表性切片工程。许可侧文件即便对应几何已归档仍保留，避免丢失分发记录。

不覆盖工作区的恢复方式（路径从 cleanup-manifest.json 复制）：

```sh
mkdir -p /tmp/vrctag-evidence-recovery
git show 106f547440b011836195460338c99deb3a2163e6:studio/evidence/beta-2026-11-04/regressions/classic-Ask-Me-false.3mf > /tmp/vrctag-evidence-recovery/example.3mf
```

先确认路径存在于清单；上述命令使用清单中真实归档文件；可替换为其他条目的路径。需要重跑历史脚本时，可另建只读参考 checkout 或将输入恢复到独立目录；不要把大批量生成物重新提交。
