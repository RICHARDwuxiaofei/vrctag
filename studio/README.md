# Style model sources

> 最新授权与验收：独立软件 MIT、Native/初版独立模型 CC BY 4.0；Classic 保留原 NC-SA 范围待确认。以下较早的“最终许可待定”记录只描述历史检查点。见 [许可证迁移](../docs/LICENSE_MIGRATION.md) 和根 LICENSE_SCOPE.md。

Current sources: [classic.blend](classic.blend) (**Large Avatar**, 134×52×4 mm) and [native.blend](native.blend) (**VRChat Style**, 118×40×3.6 mm). Front +Z, horizontal +X, up +Y, flat back Z=0; Blender scale 0.001 m/BU. Names/pronouns/status text remain browser-generated, not baked into sources. See [current acceptance](../docs/FINAL_BETA_REVIEW.md).

Classic was rebuilt after inspecting the WiseWolf-origin legacy template **only as a visual reference**. Its new analytic medallion/shouldered-panel outline, separate perimeter rim, 44 mm avatar, new layout and five closed base parts replace the mistaken first-web-capsule reference. No legacy mesh data is imported or reused. Similarity/design licensing risk remains unresolved; see [provenance](../docs/SOURCES.md). Native geometry/source/layout are unchanged from `8be7020`.

| Rule | Classic | Native |
| --- | --- | --- |
| Avatar diameter / radial frame | 44 / 1.5 mm | 32 / 0.7 mm |
| Body front / rim / max height | 2.6 / 3 / 4 mm | 2.8 / none / 3.6 mm |
| Status dot diameter / placement | 6 mm / before status row | 7.2 mm / by avatar |
| Name / Pronouns height cap | 10.5 / 4.8 mm | 11.2 / 5.2 mm |
| Main text / status usable width | 70 / 62.5 mm | 67 / 67 mm |
| Base printable solids | 5 | 4 |

`web/src/styles.catalog.json` supplies geometry families, layouts, colors, paths and optional CFS4 palette/part-slot profiles. The shared web editor/model/validator/exporter enumerates registered styles. New geometry families implement the same Base contract; they do not require another editor. JSON/3MF coordinates are mm; GLB uses meters. Root base JSON/GLB are current default Classic aliases. Historical `vrc-tag-original.blend` remains unchanged.

```sh
blender --background --python studio/scripts/build_model.py -- --style classic
npm --prefix web test
blender --background --python studio/scripts/render_models.py
node studio/scripts/build_comparison.mjs
# Reference-only separate session; never save over the root template
blender --background --python studio/scripts/render_legacy_reference.py
python3 studio/scripts/build_reference_comparison.py
```

Scripts resolve paths relative to this checkout. The CLI resets only its own background scene. Use separate sessions for reference rendering; live MCP work reopens the first-party file before replacing its owned geometry collection. Evidence renderer does not save Native; demo text is temporary. Original modeling used MCP; final read-only checks used isolated background processes. The historical shutdown problem is retained in earlier reports; the 2026-11-04 acceptance reopened both formal sources and both real-mesh demos in separate Blender 5.2.1 background processes and exited normally. Comparison composition requires Pillow only as a developer tool and uses the bundled OFL font; it does not alter model pixels or use AI image generation.

`check_styles_blender.py` reopens both sources and checks anchors, colors, closed positive solids and pairwise intersection volumes without saving audit objects. `audit_generated.py --directory studio/evidence/classic-large-avatar-2026-11-03 --offset 0 --stride 3` performs independent per-package checks; repeat offsets 1 and 2. Source topology checks are not slicing certification. Real GUI acceptance remains BLOCKED by browser tool policy, and Creality Print / OrcaSlicer / physical prints remain NOT_TESTED.

Formal sources are unchanged in the final cleanup. Real exported-mesh examples: [classic-nagikokoro.blend](demos/classic-nagikokoro.blend), [native-nagikokoro.blend](demos/native-nagikokoro.blend). Evidence is indexed at [evidence/INDEX.md](evidence/INDEX.md); detailed archived matrix inputs can be restored from its pinned commit before rerunning historical scripts. Check copies default to ignored `studio/generated/`; `beta_blender.py --mode check --output /tmp/vrctag-check` uses disposable output.
