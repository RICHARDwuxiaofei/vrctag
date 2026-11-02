# Original base geometry

`vrc-tag-original.blend` is editable Blender 5.2.1 source. Scene scale 0.001 m/BU: mesh coordinates represent mm. Front +Z; +X right; +Y up. The glTF export explicitly scales to meters (0.12 × 0.038 × 0.004 m); browser JSON and 3MF stay in mm.

| Part | Geometry / position | Z range (mm) |
| --- | --- | --- |
| Plate_Body | Capsule 120 × 38, end radius 19 | 0–3 |
| Avatar_Back | Radius 12, center (−42, 0) | 3–3.8 |
| Avatar_Frame | Annulus inner 12 / outer 14, same center | 3–4 |
| Status_Dot | Radius 2.5, center (−29, −11) | 3–4 |
| Name_Anchor | Empty at (−22, 4, 3) | no printable geometry |
| Pronouns_Anchor | Empty at (−22, −1.5, 3) | no printable geometry |
| Status_Anchor | Empty at (−22, −10, 3) | no printable geometry |

No name is baked in. Text left edge −22, available width 72 mm, left aligned; maximum visual name height 10 mm without pronouns, or 8 mm with pronouns. Name center Y=4 / 7 respectively. Pronouns height 3.7 mm centered Y=−1.5; custom status height 4 mm centered Y=−10.5. Uniform XY scaling fits the width; relief remains 0.8 mm independent of name size. Blank optional fields produce no mesh. No snap fits; interfaces meet exactly at Z=3 and form one multicolor print. Back is flat. No hanging hole was requested or added.

The model is built with direct analytic polygon loops, triangulated and normals recalculated in Blender. All four parts have 0 non-manifold edges and positive volume; see browser base JSON validation. Individual parts do not occupy overlapping volumes. Dynamic text occupies disjoint assigned horizontal bands, to the right of the avatar and dot. Arbitrary pathological font outlines are blocked when topology checks fail; global self-intersection / minimum feature analysis is not implemented.

`build_model.py` is the exact original construction approach, intended to run in a fresh scene. Paths target this checkout; adjust them when cloning elsewhere. Do not run it on the saved scene without first creating a separate blank file: it adds a new original collection. It prints `STUDIO_JSON:` followed by geometry and metadata; capture that JSON as web/public/assets/base.json. The source is saved through Blender operators, no legacy datablocks loaded. GLB compression is intentionally disabled; missing optional Draco/Meshopt libraries do not affect export.

`evidence/front.png`, `side.png`, `perspective.png` show the blank editable base. Web screenshots show dynamically generated Nagikokoro text. `scripts/validate_3mf.py` uses standard Python only and independently verifies ZIP/XML, assembly references, topology, oriented edges, finite coordinates, positive volumes, and bounds. It does not invoke a slicer or certify manufacturability.
