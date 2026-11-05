# OrcaSlicer offline test artifacts

Actual OrcaSlicer 2.4.2 CLI output, using bundled Creality K2 Plus 0.4 nozzle / 0.20 mm Standard / Generic PLA presets. This is an offline test profile, not a declaration of the owner's printer, calibration or readiness for physical printing. No printer was contacted.

Core 3MF geometry imported as one object with multiple volumes. This Orca release does not automatically preserve Core base-material name/filament assignment: initial volumes were all assigned the default extruder. The test explicitly assigned each matched volume to the source `Metadata/printing.json` slot and set the palette in the Orca project, equivalent to the documented slicer-side assignment step. Web exports remain standard Core 3MF; this is not automatic Orca/CFS project support.

Mapped project files contain actual sliced G-code and upstream preset data. They are not covered wholesale by the software MIT or first-party CC BY grant. Model contributions: Native CC BY 4.0; Classic conservative existing CC BY-NC-SA 4.0 pending design review; Noto glyph provenance retained. Upstream OrcaSlicer/preset rights and license remain unchanged: https://github.com/OrcaSlicer/OrcaSlicer/tree/v2.4.2 . See ORCA-UPSTREAM-LICENSE.txt. Tool binaries/source are not redistributed here.

Layer PNGs are mathematical plots generated from actual G-code extrusion paths (including arc interpolation), not Orca GUI screenshots. Out-of-object paths/purge towers and travel are omitted, and nominal stroke width is shown. Do not use them as proof of GUI operation, minimum-wall retention, printer compatibility or physical adhesion. GUI remains NOT_TESTED; actual CLI slicing is separately evidenced by result JSON, project G-code, filament usage and tool IDs.

The initial `classic-assigned-sliced.3mf` and similarly unqualified file names are intermediate checkpoints; current canonical files include case IDs `classic-default`, `native-default`, `classic-friend-pronouns`, `native-friend-pronouns`.
