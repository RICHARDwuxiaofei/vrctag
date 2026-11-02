# 历史交接与真实验收状态

**最新验收：[2026-11-03 修复报告](FIXES-2026-11-03.md)。以下保留 11-02 原始记录，不代表当前网格校验/字体/比例实现。**

验收日期：2026-11-02（Asia/Hong_Kong）。基线：24c60f0。开发分支：codex/vrc-nameplate-web。总状态：**PARTIAL** — 网页与本地多色 3MF 生成已实现和验证，切片器真实兼容性及实物打印尚未验收。

| 项目 | 状态 | 证据 / 限制 |
| --- | --- | --- |
| Git 干净基线及独立分支 | PASS | 开始时无未提交修改；未在 main 施工 |
| 旧版保留和构建隔离 | PASS | 根 Python、模板、LICENSE、ATTRIBUTION 不变；web 构建无旧版依赖 |
| Blender MCP | PASS | 5.2.1 LTS；插件协议 9，使用服务端兼容接口；未关闭 safe mode |
| 原创建模 | PASS | 4 实体 + 3 Empty，120 × 38 × 4 mm；独立解析轮廓，无旧几何 |
| Blender 源重新打开 | PASS | 实际 wm.open_mainfile 后有 4 个网格对象 |
| 实体 manifold / 法线 / 正体积 | PASS | Blender 4 部件均 0 非流形边，正体积；base.json 中保存报告 |
| GLB 读取及真实尺度 | PASS | Three GLTFLoader 实际加载；边界 0.12 × 0.004 × 0.038 m（glTF Y up） |
| 模型证据 | PASS | studio/evidence/front.png、side.png、perspective.png；基础源无烘焙名字 |
| TypeScript 与生产构建 | PASS | typecheck.txt、build.txt；构建只有 bundle 体积提示，无错误 |
| 自动测试 | PASS | 10/10；unit-tests.txt |
| 多语种名字 | PASS | Amy、长英文、小凪心、ナギココロ、Nagi_心こんにちは；单元测试和真实浏览器均检查 |
| 空 Pronouns / 自定义 Pronouns | PASS | None 不生成网格；随意 / Any、They/Them；名字中心 Y 随之移动；实际下载元数据复核 |
| 好友颜色 / 五种状态 | PASS | 单元测试确认仅 Name 变金；五种状态自动色均检查；浏览器好友+Join Me 实际下载 |
| 自定义点颜色 | PASS | 单元测试 #123456 与状态文字颜色独立；界面提供预设和本地颜色选择器 |
| 默认样例 | PASS | Nagikokoro / 无聊 / Online / 无 Pronouns / 非好友 / 无图片 |
| 浏览器下载 3MF | PASS | 实际文件复制为 browser-custom.3mf；Cua 下载事件等待超时，但文件确实保存在 Downloads，已读取校验，未用页面提示代替文件证据 |
| JSON 与重置 | PASS | 实际下载 browser-config.json；默认字段正确，重置清除头像和 Pronouns |
| 头像本地裁剪 | PASS | 本次原创 front.png 作为测试图片，经文件选择器读取；DOM 中为 data:image/png，圆形显示 |
| 头像与打印分离 | PASS | 上传前后两次实际下载的所有包内条目逐字节一致；avatar-export-comparison.json；没有图片条目 |
| 无上传 / 无后端 | PASS（代码审计） | 仅启动时 fetch 同源静态资源；头像/字段不进入 fetch，JSON 不含头像。未做系统级网络抓包 |
| 桌面 / 手机布局 | PASS | 请求 1440 × 1080、390 × 844 和 320 × 740；实际内容宽 1425、375、305（减滚动条），均 scrollWidth=clientWidth；手机预览在编辑区上方 |
| 真实手机触摸硬件 | NOT_TESTED | 浏览器窄视口 + OrbitControls；未用实体手机 |
| 静态子路径 | PASS | 生产 dist 通过纯 Python 静态 HTTP 在 /vrctag/ 实际加载；字体、Worker、模型、好友及 Pronouns 正常 |
| 3MF 包结构与网格独立复核 | PASS | Python 标准库独立解包、解析 XML、检查材料和对象引用、索引、有限数值、三角形面积、双向闭合边、正体积、包 CRC；3mf-validation.json |
| 官方 XSD / lib3mf 完整认证 | NOT_TESTED | 自写结构检查不等于标准认证 |
| Creality Print 导入 / 切片 | NOT_TESTED | 未发现已安装可执行程序或 Flatpak；未安装巨型切片软件来虚报完成 |
| OrcaSlicer 导入 / 切片 | NOT_TESTED | 同上；Core 基材颜色是否保留仍待真实测试 |
| 实物打印及最小笔画 | NOT_TESTED | 高度阈值和提示已实现；没有完整笔画厚度、自交或所有字符相交检测 |
| VPS / DNS / 生产站点 | NOT_TESTED（有意未操作） | 仅交付静态部署样例，符合用户授权范围 |

## 已定位并修复

1. 起初通用 ExtrudeGeometry 方案产生字形封面 / 侧壁异常边；改为相同双精度轮廓直接挤出，修正 Noto CFF 方向，拆分 Earcut 跳过的共线桥接顶点。未降低闭合标准。默认中日英文和自定义 Pronouns 测试现在均通过。
2. Blender GLB 没有按场景单位自动缩放；增加导出时 0.001 变换并恢复，GLTFLoader 尺度测试通过。JSON / 3MF 本就使用毫米。
3. 窄画布裁切模型；相机按画布比例自动适配。头像叠图出现 Z fighting，调整相机近裁面和仅预览头像高度。
4. 初次证据渲染使用默认相机 100 BU 远裁面，导致全透明；改为 2000 BU 并检查图片。透视图调整视野避免裁切。
5. 首个开发服务结束导致页面连接失败；改用生产构建静态服务，恢复验收。浏览器截图偶发不可用时在新测试标签页完成截图。未伪造浏览器证据。

## 下一步真实切片验收

分别在目标版本的 Creality Print 和 OrcaSlicer 导入 evidence/nagikokoro.3mf、mixed-friend-pronouns.3mf、browser-custom.3mf：核对 120 × 38 × 4 mm、单对象多部件、所有文字保留、无修复警告、颜色与耗材映射。选择实际打印机/CFS 耗材后切片，逐层检查底板与浮雕接合、0.8 mm 文字、中文薄笔画，最后试打。若切片器忽略基材颜色，手工分配各部件；本次不冒充已实现特定厂商的机器配置或槽位绑定。

已保存全部可用成果。没有 main 合并、Release 或生产上线。Git 提交和推送状态见 PROGRESS.md 及最终交接消息。
