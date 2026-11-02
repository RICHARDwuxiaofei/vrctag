# Original base geometry

`vrc-tag-original.blend` is editable Blender 5.2.1 source. Scene scale 0.001 m/BU: mesh coordinates represent mm. Front +Z; +X right; +Y up. The glTF export explicitly scales to meters (0.12 × 0.038 × 0.004 m); browser JSON and 3MF stay in mm.

| Part | Geometry / position | Z range (mm) |
| --- | --- | --- |
| Plate_Body | Capsule 120 × 38, end radius 19 | 0–3 |
| Avatar_Back | Radius 15, center (−41, 0), with status-dot recess | 3–3.8 |
| Avatar_Frame | Annulus inner 15 / outer 16, same center, with status-dot recess | 3–4 |
| Status_Dot | Radius 3.5, center (−29, −10) | 3–4 |
| Name_Anchor | Empty at (−19, 4.5, 3) | no printable geometry |
| Pronouns_Anchor | Empty at (−19, 0.5, 3) | no printable geometry |
| Status_Anchor | Empty at (−19, −10.5, 3) | no printable geometry |

No name is baked in. Text left edge −19, available width 69 mm, left aligned; maximum visual name height 10 mm without pronouns, or 9 mm with pronouns. Name center Y=4.5 / 9 respectively. Pronouns height 5.2 mm centered Y=0.5; custom status height 5 mm centered Y=−10.5. Uniform XY scaling fits the width; relief remains 0.8 mm independent of name size. Blank optional fields produce no mesh. No snap fits; interfaces meet exactly at Z=3 and form one multicolor print. Back is flat. No hanging hole was requested or added.

The model is built with direct analytic polygon loops, triangulated and normals recalculated in Blender. All four parts have 0 non-manifold edges and positive volume; see browser base JSON validation. Individual parts do not occupy overlapping volumes. Dynamic text occupies disjoint assigned horizontal bands, to the right of the avatar and dot. Arbitrary pathological font outlines are blocked when topology checks fail; triangle intersections and connected-shell nesting are checked; minimum feature screening is heuristic and is not manufacturing certification.

Run `blender --background --python studio/scripts/build_model.py` from any directory using an absolute script path when needed. The wrapper derives the project root from its own location; `-- --root /other/output` overrides it. It resets its background scene and writes source, GLB and JSON. `model_geometry.py` contains the reusable construction function; live MCP updates only `VRC_Tag_Original`. Never use the CLI reset wrapper inside an unrelated live scene. No legacy datablocks are loaded. GLB compression is disabled. Portable output matched mesh/metadata, but background processes did not exit cleanly in this environment: see the latest report; do not treat CLI completion as fully validated.

`evidence/front.png`, `side.png`, `perspective.png` show the blank editable base. Web screenshots show dynamically generated Nagikokoro text. `scripts/validate_3mf.py` uses standard Python only and independently verifies ZIP/XML, assembly references, topology, oriented edges, finite coordinates, positive volumes, and bounds. It does not invoke a slicer or certify manufacturability.


Latest geometry, before/after views and reopened-file checks: [2026-11-03 report](../docs/FIXES-2026-11-03.md). Original 11-02 evidence is historical. New source/JSON/GLB are synchronized.
