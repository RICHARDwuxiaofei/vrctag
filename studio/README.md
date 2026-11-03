# Original style models

Two independently authored sources: `classic.blend` and `native.blend`, Blender 5.2.1. Units are 0.001 m/BU, mesh coordinates in mm, front +Z, horizontal +X, up +Y, flat back Z=0. No baked name geometry. Source reopening, four closed solids, positive volumes, material colors and pair intersections were checked via MCP. See [latest report](../docs/STYLES-2026-11-03.md).

Classic restores **web original** geometry from `1f7a159`, not the legacy `nametag_template.blend`. All four base parts have identical vertices and triangles to that original JSON. Native uses unequal end circles connected by common tangents, a larger recessed avatar/dot interface, thinner front relief and a different layout.

| Part / rule | Classic | Native |
| --- | --- | --- |
| Body / maximum size | 120×38×3 / 4mm | 118×40×2.8 / 3.6mm |
| Avatar center / radius | (−42,0) / 12mm | (−40,0) / 16mm |
| Frame radial width | 2mm | 0.7mm |
| Dot center / radius | (−29,−11) / 2.5mm | (−27,−10) / 3.6mm |
| Text X / usable width | −22 / 72mm | −18 / 67mm |
| Name without / with pronouns | 10 / 8mm | 11.2 / 9.4mm |
| Pronouns / status height limit | 3.7 / 4mm | 5.2 / 4.6mm |

`web/src/styles.catalog.json` is the common source of geometry, layout, colors, IDs and asset paths. `model_geometry.py` uses the same parameters as web code. GLBs explicitly export meter scale; JSON/3MF stay mm. `web/public/assets/styles/<id>/base.json` contains validation, layout and materials. Root base.json/GLB remain Classic compatibility aliases. Historical `vrc-tag-original.blend` is retained untouched.

From any cwd, pass the absolute script path as needed:

```sh
blender --background --python studio/scripts/build_model.py
# One registered style; optional --root chooses a separate output root
blender --background --python studio/scripts/build_model.py -- --style native
npm --prefix web test
blender --background --python studio/scripts/render_models.py
node studio/scripts/build_comparison.mjs
```

The CLI builder resets its own background scene; never use it to clear an unrelated live file. Live MCP uses `build_model(root, style)` to replace only the owned model collection. The renderer loads a saved source, saves neutral camera/material setup, then adds temporary text **after saving**, renders, and removes it. CLI wrappers are portable entry points but clean background shutdown is **NOT_TESTED in this iteration**; earlier environment shutdown trouble is not claimed fixed. Actual accepted source/export/render work used MCP safe mode without disabling it.

`check_styles_blender.py` uses evaluated temporary Booleans and does not save audit objects. `validate_3mf.py` independently checks package/mesh/assembly. For bounded batches:

```sh
python3 studio/scripts/audit_generated.py --directory studio/evidence/dual-style-2026-11-03 --offset 0 --stride 3
# Repeat offsets 1 and 2; all shards together cover the directory.
```

Adding a registered style makes UI cards and tests enumerate it. New geometry within this capsule/tangent family is data-only; another geometry family can provide the same Base contract without duplicating editors/exporters. Use fresh output directories/assets and preserve legacy notices. Font outlines retain their own OFL provenance; first-party license choice remains pending.

Geometry validity does not certify printing. Native thin front layers/0.7mm frame and Classic small pronouns need actual nozzle/layer slicing and test prints. Creality Print / OrcaSlicer and physical prints are NOT_TESTED. Current dual-style browser GUI acceptance is BLOCKED by tool policy; do not use historical website screenshots as current proof.
