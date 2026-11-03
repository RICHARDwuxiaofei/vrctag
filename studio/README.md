# Style model sources

Current sources: [classic.blend](classic.blend) (**Large Avatar**, 134×52×4 mm) and [native.blend](native.blend) (**VRChat Style**, 118×40×3.6 mm). Front +Z, horizontal +X, up +Y, flat back Z=0; Blender scale 0.001 m/BU. Names/pronouns/status text remain browser-generated, not baked into sources. See [current acceptance](../docs/CLASSIC-LARGE-AVATAR-2026-11-03.md).

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

Scripts resolve paths relative to this checkout. The CLI resets only its own background scene. Use separate sessions for reference rendering; live MCP work reopens the first-party file before replacing its owned geometry collection. Evidence renderer does not save Native; demo text is temporary. Current accepted builds/renders used MCP. These CLI wrappers' clean shutdown remains NOT_TESTED because of earlier environment shutdown trouble. Comparison composition requires Pillow only as a developer tool and uses the bundled OFL font; it does not alter model pixels or use AI image generation.

`check_styles_blender.py` reopens both sources and checks anchors, colors, closed positive solids and pairwise intersection volumes without saving audit objects. `audit_generated.py --directory studio/evidence/classic-large-avatar-2026-11-03 --offset 0 --stride 3` performs independent per-package checks; repeat offsets 1 and 2. Source topology checks are not slicing certification. Real GUI acceptance remains BLOCKED by browser tool policy, and Creality Print / OrcaSlicer / physical prints remain NOT_TESTED.
