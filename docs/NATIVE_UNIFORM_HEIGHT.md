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

## Fedora source synchronization

Rebuilt only Native with Blender 5.2.1 LTS on Fedora. `studio/native.blend`, Native `base.json`, `base.glb`, `thumbnail.json`, and `front.png` were regenerated. The saved Blender meshes match the JSON vertices and faces, are manifold, and have positive signed volumes. The hanging loop starts at Y=20 mm, meeting the new top edge. The Native regression and production web build pass with the rebuilt assets; the regression also generates a 3MF from the current base model.

`studio/demos/native-nagikokoro.blend` and historical render snapshots remain from the older tapered geometry; they are not evidence of the corrected model. They were not regenerated from a new 3MF in this pass. Blender reported an OpenColorIO version mismatch and needed interruption during shutdown after saving the model and GLB; the saved source was reopened and checked independently. The front image was rendered with the fallback color management.

The change does not alter the Classic model, materials, CFS slot layout or existing hardware configuration. Prior print samples are historical, not evidence of this corrected Native geometry.
