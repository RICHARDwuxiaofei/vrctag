# Classic 参考版、白芯与四语言界面

> 2026-11-05 授权补充：作者已对当前 Classic/Native 两款模型的第一方贡献增加 CC BY 4.0 授权。本文下方“许可范围未改变”表示当时历史检查点；最新范围以 `LICENSE_SCOPE.md` 为准，旧模板/参考图仍保留原许可。

2026-11-05。当前开发分支 codex/vrc-nameplate-web。用户本轮明确要求按本机 Nagikokoro_sleep.blend 的主要设计重做 Classic 并正式应用白芯结构，本文覆盖之前“白芯仅候选”的实施决定。历史证据不改写。

## 设计与源文件

实际只读打开并渲染用户提供的 C:/Users/WXF/Downloads/Nagikokoro_sleep/Nagikokoro_sleep/Nagikokoro_sleep.blend；未保存或覆盖参考文件，也未操作用户当前 Blender 场景。根据其单圈白边、圆弧右端和顶部挂环，用参数几何重建当前 Classic，不把私人模型、原文字、图片或路径打包进网站。保留当前 Classic 134×52×4 mm，参考文件自身约109×44 mm，因此是按设计关系重建而非逐顶点复制。

去掉旧 Classic 的第二个 Avatar_Frame 圆环。现在 Plate_Rim 是单个白色连续轮廓，右侧完整半圆。圆头像黑面与文字面板由同一圈白边分隔。状态点左缘对齐名字左缘，文字在点右侧，间隔1.5 mm。Classic 挂环独立为 Hanging_Loop，默认开启；关闭时从实际设计和 3MF 中删除，JSON 可恢复。环脚与顶边实体接触，所有部件正体积、闭合且无正体积相交。微小的布尔计算舍入通过小于0.001 mm 的孔边间隙消除，不放宽相交阈值。

## 正式白芯结构

两套正式 .blend、JSON、GLB、兼容 aliases 和 demo .blend 已同步更新。

- Classic 白色 Plate_Core：Z=0..2.0 mm，黑色面层 Plate_Body：Z=2.0..2.6 mm。
- Native 白色 Plate_Core：Z=0..2.2 mm，黑色面层 Plate_Body：Z=2.2..2.8 mm。
- Classic 的头像黑面也仅位于 Z=2.0..2.6 mm；Native 头像上部细节保留原形。
- 白芯/白边/挂环共用默认第二槽；黑面第一槽，名字第三槽，状态点第四槽。自定义四槽颜色和高级部件映射保留。
- 导出阶段验证核心部件存在、黑面0.6 mm、Z接触及挂环是否匹配配置；缺芯、缺黑面、间隙、重叠均有负向回归。

0.6 mm 是采用上一轮候选中较厚方案的工程起点，不是实物遮色或机械强度认证。用户明确要求本轮正式集成；实际切片与打印仍 NOT_TESTED。白边、名字和状态在上层可能与黑色同层，因此不能保证整件只换一次料，也不能声称实际耗材同比减少。没有连接打印机。

## 状态与界面语言

界面增加中文、日语、韩语、英语选择。一个状态下拉框包含五种预设＋自定义，选自定义才显示唯一文字输入框。预设文字随界面语言变化，自定义内容不被翻译或覆盖。默认中文“在线”；状态点随预设匹配第四槽，用户可直接修改四个槽的颜色，移除原先重复的状态/自定义文字/单独颜色控制区。

中文预设：在线、欢迎加入、请先询问、请勿打扰、离线。英文红色状态使用官方 Do Not Disturb（内部兼容 ID Busy 保留）。离线是名牌产品的第五种预设；VRChat 官方社交页描述四种在线状态。英文和韩文名称以官方 Wiki 为依据；中文/日语为产品翻译，不宣称逐字对应某个客户端版本。官方资料：https://wiki.vrchat.com/wiki/Social 与 https://wiki.vrchat.com/wiki/Social/ko 。

旧 JSON 的 customStatus 仍按原文字恢复，不擅自变成预设。新字段 language/statusMode/hangingLoop 可导出和恢复；Worker 请求实际的本地化文字字形，确保韩文等不是只有下拉菜单翻译。

## 修复的字形缺陷

“离”存在自接触轮廓，直接挤出会形成非流形竖边；初步端面修复又暴露3MF六位小数舍入造成极短端面退化。现在仅对检测到接触的字形使用 clipper-lib 整数多边形简化及0.01字体路径单位的微小扩张，并清理极短边，再生成一致端面/侧壁。偏移随字号缩放，远小于0.4 mm喷嘴尺度。正常字形不走修复。未换字、删测试、关闭导出验证或降低网格阈值。

新增依赖 clipper-lib 6.4.2（Boost Software License 1.0）及开发类型；锁文件和第三方声明已同步，站点分发完整 Boost 文本。项目许可范围未改变：Classic 仍保留 CC BY-NC-SA 4.0 例外，Native CC BY 4.0，软件 MIT，Noto OFL。

## 实测结果

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| 隔离 Node 22 类型检查 | PASS | check-final.log |
| 全部单元测试 | PASS | 45/45；新增6项，其中双样式×四语言×五状态真实导出 |
| Classic / Native 诊断 | PASS | 各43/43 |
| Python 网格回归 | PASS | 12/12 |
| 生产构建 | PASS | build-public-final.log，103字体块完整 |
| Blender 正式源与 JSON 一致性、部件相交 | PASS | source-check/blender-sources.json；检查阈值未放宽 |
| 新生成3MF独立结构与官方lib3mf | PASS | 10/10，零警告 |
| 官方threemf-io 2.7.8实际导入 | PASS | 10/10，Blender 5.2.3；尺寸、材质、正体积、无非流形/退化面 |
| Chrome真实页面和下载 | PASS | 两样式、四语言离线、关闭挂环；7个实际下载；零pageerror/HTTP错误/外部请求 |
| 本地静态HTTP | PASS | 请求全部生产资源并核对状态/MIME/哈希 |
| 切片 / 实物打印 | NOT_TESTED | 不安装切片器，不连接打印机 |

浏览器为独立 Chrome headless，不冒充用户手动验收。所有四语言预设都执行了实际 export3mf 的舍入后网格验证；截图包含桌面、390/320px。仍需用户在 Codex 浏览器确认外观与操作偏好。

## 文件与恢复

当前用户测试文件：D:\CODE\vrctag\test-exports\reference-review\samples；真实浏览器下载：同目录 browser；真实Blender渲染：images；画廊：index.html。test-exports 已明确加入 .gitignore，不上传 Git 或部署包。操作日志另在 evidence/classic-reference-review，亦被忽略。

回滚检查点：2617bda59677682b78e510eccdc95694b9869cb5 为本轮模型/界面修改前版本。当前源文件与运行时资源一并提交，不单独回滚其中一个。未合并 main、部署 Cloudflare、改 DNS 或创建 Release。
