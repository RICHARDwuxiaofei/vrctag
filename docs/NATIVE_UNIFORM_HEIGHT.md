# Native equal-height silhouette (2026-11-07)

The Native nameplate was unintentionally tapered: its left end radius was 20 mm (40 mm total height) while the right end radius was 18 mm (36 mm total height). The common external tangent thus sloped toward the right, making the top and bottom edges non-parallel.

## Current fix

- Left radius **20 mm**, right radius **20 mm**: an exact uniform-height capsule with horizontal top and bottom connecting lines.
- Printable body bounding box: **120 × 40 × 3.3 mm**.
- Including top hanging loop and surface details: **120 × 46.5 × 3.7 mm**.
- The hook now connects to the flat top edge, centerline at Y=20 mm.
- Existing avatar frame, name / pronouns, and status dot remain in their original positions.
- Updated the style catalog (source of truth), production `base.json`, 3D model GLB binary, and the SVG projection-data `thumbnail.json`. The runtime uses `base.json` / `thumbnail.json` directly, while Blender GLB exports are built from the live Design.
- Added a regression test that checks end heights, dimensions, mesh validity and Native GLB/3MF output.

**Outstanding for complete Blender source synchronization:** the checked-in `studio/native.blend`, `studio/demos/native-nagikokoro.blend` and historical/render PNG snapshots still depict the earlier tapered version. No Blender executable was available in this editing environment, so those binary art files were not overwritten or misrepresented as regenerated. Regenerate them in an authorized Blender environment before treating this PR as a complete source-artifact release. To regenerate production assets, run the existing `studio/scripts/build_model.py` with `--style native`; compare the result to the corrected model bounds, and update rendered image snapshots. Doing so will generate a fresh mesh triangulation but must preserve the same geometry dimensions. Do not regenerate Classic.

The change does not alter the Classic model, materials, CFS slot layout or existing hardware configuration. Prior print samples are historical, not evidence of this corrected Native geometry.
