# Raised text and status dot — Classic and Native

This small change increases **Z-axis relief only** from 0.4 mm to 0.6 mm for both printable nameplates, based on printed-part feedback. Name, friend-name, Pronouns and Status Text are dynamically extruded by `web/src/model.ts` using the style's `layout.relief`. The status light is a prebuilt mesh named `Status_Dot` that must also be physically taller.

| Parameter | Classic: before → after | Native: before → after |
| --- | --- | --- |
| `layout.relief` | 0.4 → 0.6 mm | 0.4 → 0.6 mm |
| `geometry.dotTop` | 3.0 → 3.2 mm | 3.7 → 3.9 mm |
| Bottom/face surface | 2.6 mm (unchanged) | 3.3 mm (unchanged) |
| Overall printable bounds incl. hook | 134 × 52 × 3.0 → **134 × 52 × 3.2 mm** | 120 × 46.5 × 3.7 → **120 × 46.5 × 3.9 mm** |

The length, width, text layout, avatar circle, rim, hook, core/skin structure and material slot assignments are unchanged.

Updated in this PR:
- Both styles in `web/src/styles.catalog.json`.
- Both physical `web/public/assets/styles/*/base.json` files and their `Status_Dot` vertices and validation report.
- Both `web/public/assets/styles/*/base.glb` files, with the actual dot vertex Z and GLB POSITION accessor bounds changed.
- Both `thumbnail.json` files' dot height metadata.
- Classic compatibility aliases `web/public/assets/base.json`, `web/public/assets/base.glb`.
- Targeted unit tests and previous hard-coded height assertions.

**Pending Blender-source sync:** this remote GitHub edit environment has no Blender executable. The committed `studio/classic.blend`, `studio/native.blend`, demo .blend files and historical PNG render snapshots still show the previous status-dot geometry. They were deliberately not overwritten with unverified binary modifications. To synchronize in a Blender environment, regenerate **both** styles using the existing `studio/scripts/build_model.py` and review the affected tracked artifacts before committing. No other model shape changes are intended.

To smoke-test before merging:
```bash
cd web
npm ci
node --import tsx --test tests/raised-relief.test.ts tests/native-height.test.ts tests/glb.test.ts
npm run build
```
These are proposed validation commands, **not claimed as executed by this edit**. Real 0.4 mm nozzle and 0.2 mm layer-height print results still require slicing and/or physical testing.
