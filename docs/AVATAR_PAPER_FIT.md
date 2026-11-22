# Avatar photo: measured PDF paper layout

Updated 2026-11-23. The website creates **actual-size avatar photo PDFs** locally from individually cropped images (up to 1200 px per image), rather than the lower-resolution 3D preview. It supports one photo per page for calibration, densely packed sheets, and multiple different uploaded photos with automatic pagination. Images stay in the browser; no server upload is required.

## Paper sizes (actual MediaBox)

| Selector | PDF page size (mm) | Typical print-driver name |
| --- | ---: | --- |
| A4 | 210 × 297 | A4 |
| 4R (4×6 in) | 101.6 × 152.4 | 4×6 / 102×152 |
| 6 in regional | 100 × 150 | 100×150 mm (not equal to 4R) |
| 3R (3.5×5 in) | 88.9 × 127 | 3.5×5 / 89×127 |
| 5R (5×7 in) | 127 × 177.8 | 5×7 / 127×178 |

**Changing the paper size never changes the photo cutout diameter.** PDF positions use exactly `72 / 25.4` points per millimeter, and the displayed avatar dimensions come from the same `styles.catalog.json` layout and XY percent as the 3D geometry. Z thickness scaling does not change photo dimensions.

| XY percent | Classic diameter | Native nominal full-circle diameter |
| --- | ---: | ---: |
| 50% | 19.04 mm | 12.8 mm |
| 100% | **38.08 mm** | **25.6 mm** |
| 150% | 57.12 mm | 38.4 mm |

The exact-length example 80.01 mm has nominal photo diameters about 28.42 mm (Classic) and 21.34 mm (Native). **Classic's 41.6mm outer white rim is not the photo size.**

## Shape and cutting

Classic prints a circular photo. Its photo top and white rim are nominally flush at Z=2.6mm; attach paper using thin adhesive. There is no paper slot.

Native's status dot overlaps the lower right of the circle. At 100%, the dot center relative to photo center is `(10.4, -8) mm`, radius `3.52 mm`; its inward intersection is about 3.2mm. The PDF cuts out exactly the circle-minus-dot contour in vector form and draws a dashed cut guide. The notch is not merely a visual annotation. Default Native photo surface Z=3.3mm, rim top Z=3.65mm: **0.35mm** nominal clearance, or 0.175/0.35/0.525mm at 50/100/150% Z.

## Paper material and actual printing

For better photographic reproduction than plain copy paper, use **inkjet-compatible glossy, semi-gloss or luster photo paper** that is supported by your printer. A first trial of **180–230 g/m²** is reasonable, but grammage is **not** a calibrated measurement of thickness, and toner/inkjet compatibility matters. Native may protrude if paper plus adhesive exceeds the rim gap. Confirm physical fit before distributing.

1. Upload a PNG, JPEG, or WebP avatar. The original file is retained locally for PDF export; 3D/GLB preview continues to use a separate 512px crop.
2. Set the final nameplate XY scale and choose the **actual physical paper dimensions printed on the package**.
3. Choose **Single** for one centered photo per page, with a **20 mm vector calibration bar** and diameter label; choose **Multiple** for a packed sheet. One uploaded photo is repeated to fill the sheet; several uploaded photos are each used once and automatically paginated. The Native notch and cut guides are included in both modes. Packed pages omit the calibration bar if there is not enough clear space.
4. In the print dialog choose the matching page size, **Actual Size / 100%**, disable **Fit to Page** and **borderless auto-expansion**, and avoid printer-driver photo enlargement. A border is safer for accurate sizing.
5. Measure the printed 20mm bar. If it is not exactly 20mm, do not cut the avatar yet; fix printer scaling and reprint. Even a mathematically exact PDF cannot control physical printer stretch or image-print services.
6. Cut a plain-paper proof first, then photo paper. Trim only by real-world fitting; the PDF does not add an untested 0.2–0.4mm undersize tolerance. If you later rescale the model in a slicer, update the photo XY scale identically on the website.

## Validation

Earlier PDF QA exercised **5 paper sizes × 2 styles × 3 XY scales = 30 PDFs** using a real JPEG. PyMuPDF checked PDF page sizes, cut outlines, and the 20 mm calibration marks; representative pages were visually rendered. This is **historical evidence**, not a claim that all independent rendering checks were rerun after the 2026-11-22 default-size change. Source-level unit tests now cover the new Classic/Native baseline sizes and the 6/15 4R sheet layout; mixed-photo pagination is tested in `web/tests/photo-batch.test.ts`. Implementation: `web/src/photo-pdf.ts`.

**Limits:** no physical paper has been printed or glued in this release. The site's PDF maintains design dimensions, but individual printers, paper coatings, adhesives, and cutting methods remain unverified. 3MF still does not embed the photo (3D-printing colors are separate).

Reference for photo paper sizes: Epson's printer paper support documentation, which lists 4×6 at 102×152mm, 3.5×5 at 89×127mm, 5×7 at 127×178mm, and A4 at 210×297mm. Exact PDF dimensions use the underlying inch-to-mm conversion, not rounded driver labels.

## 单张 / 多张密排（当前版本）

照片 PDF 提供「单张」与「多张（铺满页面）」选项，默认选择多张。**单图会在密排模式重复铺满，多图则每张只排一次并自动分页。** PDF 使用 72/25.4 pt/mm 的真实物理尺寸计算，不会为了铺满纸张而拉伸头像。新版已将旧模型 XY 的 80% 直接作为 **当前 100%** 的基准，不需要在打印页面再额外设置 80%。

- 单张：每张上传的头像各占一页、居中放置，保留 20 mm 校准线、头像直径以及打印机按「实际尺寸/100%」打印的提示；先用该模式验证尺寸。
- 多张：上传 **一张** 头像时，在同一页按网格重复铺满；上传 **多张不同头像** 时，按上传顺序每张打印一次，超过单页容量自动分页，末页剩余照片居中排版。每张保留真实尺寸、Native 状态点缺口和裁剪虚线。
- 密排基准：最小 **1.5 mm** 页边距、头像之间 **0.5 mm** 间隙。按纸张和直径计算可排的最大完整矩形网格；将整个网格居中。如果边距不足 11 mm，为避免校准线压在照片上，则自动省略校准线，请先用单张版校准。
- 4R (101.6 × 152.4 mm)、XY 100%：Classic **2列×3行 = 6张**，各直径38.08 mm；Native **3列×5行 = 15张**，各直径25.6 mm。100×150mm 的 6 寸纸，默认也分别为 6、15 张。其他纸张及50–150%比例自动重新计算，网页实时显示预计张数。
- **注意**：紧凑模式的最外侧头像可能距离纸边只有1.5mm。不能保证所有冲印机的不可打印边距都小于这一数值。印刷必须使用真实尺寸100%，关闭填充/适应页面/无边距自动扩展；先用普通纸验证最外侧是否被裁掉。如被裁掉，改用更大纸张或单张模式。

可混排不同头像，不限于同一头像重复。头像裁剪和 PDF 生成在本地浏览器完成。**请注意**：旧版 JSON 配置中的 `planarScale` 是相对比例；从原版 134 mm Classic 基准保存的 100% 配置，在新版恢复后会对应当前 107.2 mm 的 100%。恢复旧配置后务必核实网页显示的实际毫米尺寸。
