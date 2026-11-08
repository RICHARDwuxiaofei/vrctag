# Precise sizing controls — PR #3 + PR #6 integration

This branch combines the existing *real-geometry* 50–150% planar/thickness scaling (PR #3) with the **0.6 mm base text and status-dot relief** in PR #6. Neither original PR nor `main` is mutated by this integration branch.

## Input semantics

- Five direct numeric fields: **planar percentage**, **thickness percentage**, **length in mm**, **width in mm**, **thickness in mm**.
- The planar percentage drives one shared XY factor. Entering either length or width back-calculates that factor; the opposite planar dimension follows automatically. Text, status dot, profile, optional hanging ring and avatar placeholder all scale with XY.
- Thickness percent/mm drives only Z. The original base relief is 0.6 mm; at 50% Z it is **0.3 mm**, at 150% it is **0.9 mm**. Length/width are unchanged by Z edits.
- All factors clamp to 50–150%, and are retained with up to six decimal places to support **0.01 mm** dimension entry. Sliders can be used with a 0.01% step. Inputs commit on blur or Enter so typing partial numbers is never prematurely clamped; Escape cancels.
- Millimeter reference dimensions reflect the current style and the optional ring: Native's reference Y is 46.5 mm with a ring, **40 mm without**; Classic remains 52 mm either way.
- JSON stores decimal scales and old JSON without the new fields loads at 100%. Blender GLB, Bambu 3MF and Core 3MF use the same scaled `Design` geometry, not only a camera/display transform.

## Base dimensions before changing sliders

| Style | 100% complete dimensions | Base emboss relief |
| --- | --- | --- |
| Classic | 134 × 52 × **3.2 mm** | 0.6 mm |
| Native | 120 × 46.5 × **3.9 mm** | 0.6 mm |

The increased embossed relief and 3MF size scaling are thus compatible: **construct thicker text/dot first, then apply the requested XY and Z scale to all printable geometry**. No source CAD or static model artifact regeneration is required solely for the controls; the earlier PR #6 has an independent outstanding .blend/PDF rendered-evidence sync task.

## Verification required before merging

In `web/` with Node 22:

```bash
npm ci
node --import tsx --test tests/size-input.test.ts tests/size-scale.test.ts tests/raised-relief.test.ts tests/native-height.test.ts
npm run build
```

Then in a real browser check both styles and both ring states at 50%, 100%, 150%, including changing length then width, independent thickness, decimal percent, config save/restore, Core and Bambu 3MF size, Blender GLB, and narrow mobile viewport.

The GitHub-only editing session performed source/asset geometry inspection and static checks. **These Node commands and real browsers have not yet been run**; do not declare production-ready until completed.
