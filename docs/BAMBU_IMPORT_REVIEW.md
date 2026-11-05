# Bambu import investigation — 2026-11-06

Remote synchronization: local HEAD and origin/codex/vrc-nameplate-web both bb7ef4b; clean before changes. Remote licensing changes preserved.

Implemented geometry: Native body 2.8→3.3 mm; upper details and text shifted +0.5 mm, total thickness 4.1 mm. Classic white rim lowered to black face Z=2.6 mm; text and status raised to 3.4 mm. White core retained only for Classic. Source .blend, runtime JSON/GLB and dynamic thumbnails synchronized. No render, slice or print performed. Production build PASS.

Confirmed input issue: Core 3MF basematerial colors and Metadata/printing.json do not constitute Bambu's native part/extruder configuration. Official source uses Application prefix BambuStudio-, Metadata/model_settings.config part IDs/extruder (1-based), Metadata/project_settings.config and plate instances. References: https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp and https://github.com/bambulab/BambuStudio/blob/master/src/BambuStudio.cpp .

A candidate adapter is available via the explicit third export3mf argument "bambu". It preserves generator provenance, adds native part-slot and palette records and one plate. It is NOT the default webpage download. Candidate files and logs: test-exports/bambu-review (ignored).

Actual local Bambu Studio 02.02.02.56: original Core --info exits 0; candidate native import/export exits -1073741819. Adding plate metadata advances import to one plate; adding required CLI config fields advances to recognizing all four colors, but downstream processing still crashes. These trials do not demonstrate GUI success or automatic multicolor import. Partial configuration fields used for debugging were removed from the candidate. No machine, temperature, bed size, credentials, printer connection or gcode is supplied in the shipped candidate.

Status: geometry PASS (generated, build checked); Bambu auto-color compatibility PARTIAL / unresolved. Keep Core default until actual Bambu load and roundtrip confirm part-slot mappings. Next useful input is a native 3MF saved by the user's Bambu Studio using their desired printer/material setup (an empty project is sufficient if the application permits saving it; otherwise a simple cube). Inspect its archive structure, adapt only necessary import records, and verify in the same local Bambu version. Do not claim sliced or printed acceptance.

## Verified follow-up with user-saved native project

The supplied C:/Users/WXF/Downloads/vrc-tag-classic-Nagikokoro.3mf is a native Bambu Studio 02.02.02.56 project, with 475 configuration fields, Bambu Lab A1 0.4 nozzle, four PLA slots, part/extruder metadata and one plate. The original file remains untouched; extracted data is local ignored evidence only.

Added a browser-local template loader. It reads only Metadata/project_settings.config from a selected four-slot 3MF; no upload or server is used. Ordinary export remains generic. Once a template is loaded, the main download uses the Bambu adapter with the template's actual settings and replaces palette/per-part slot records with the generated model's mapping. Users can switch back to generic export. No user template or printer-specific configuration is bundled in public assets.

Final direct export3mf(..., 'bambu', profile) samples for Classic and Native both read and re-export successfully through installed Bambu Studio 02.02.02.56 (exit 0). Every named part's 1-based extruder and full color palette matched after roundtrip. Verified logs/files: test-exports/bambu-review/*-verified* and classic-bambu.3mf / native-bambu.3mf. No rendering, slicing, hardware connection or printing performed. This supersedes the earlier unresolved CLI status when no complete template was available. Browser upload/download interaction remains for user review.

## Direct export update: no template required

Removed the template requirement, upload control and browser-stored-template dependency. Bambu export now uses web/src/bambu-default.json assembled exclusively from installed BambuStudio 02.02.02.56 public system presets. Source JSON inputs and upstream license are retained under web/public/licenses/bambu-presets/ and BambuStudio-AGPL-3.0.txt; the derived JSON has a license sidecar. No user project content is bundled. The default starting preset is A1 / 0.4 mm / PLA and must be changed in Bambu Studio if users have different hardware/materials.

A clean Chrome context with no stored state and no file selection directly downloaded Classic and Native. Installed Bambu Studio read and saved both (exit 0), preserving every per-part extruder index and palette color. Logs: test-exports/bambu-review/direct-*. No rendering, slicing or printing. This replaces the earlier template workflow.


## Targeted follow-up: language menu and reduced relief

Replaced the transparent native language select with a styled globe-triggered menu. Real Chrome checks PASS: all four language selections, checked state, Escape, Arrow keys/Enter, outside dismissal. Production build PASS; no full regression suite or Blender render was run. Screenshot: test-exports/bambu-review/language-menu.png (ignored local evidence).

Status terminology checked against https://wiki.vrchat.com/wiki/Social/zh-hans and /ko: Chinese orange Ask Me = 忙碌, red legacy Busy = 请勿打扰; Korean 참가 요청 필요 / 방해 금지. English Do Not Disturb is documented at https://docs.vrchat.com/docs/patch-notes-2020 (renamed from Busy). Current Japanese primary-source/client wording remains NOT_TESTED; retained existing translations rather than claiming full four-language official parity. UI translation outside status terms has not received a native-speaker review.

Product download labels now say multicolor 3MF without vendor branding; compatibility records remain intact. Default A1 / 0.4 / PLA starting settings are still disclosed and must be changed to the actual hardware/materials in the slicer.

Matched local slicing comparison (Bambu Studio 02.02.02.56, same local reference settings): 0.8 mm relief = 12 tool changes; 0.4 mm relief = 8. Both sliced successfully. Counts extracted from actual plate_1.gcode toolchange markers. Files: relief-08-local-sliced.3mf and relief-04-sliced.3mf under test-exports/bambu-review. Local reference configuration remains ignored and is not bundled in the app. Candidate engine-generated unsliced files: classic-relief-0.8.3mf and classic-relief-0.4.3mf. Formal default remains 0.8 mm. Lower relief changes physical appearance; durability and real printing are NOT_TESTED. Counts vary with model/config/layer height and slicer settings; no hardware operation occurred.


## Enabled reduced-relief default

Classic and Native now use 0.4 mm relief for text and the status dot by default. Formal Blender sources and runtime JSON/GLB/thumbnails regenerated without rendering; production build PASS. Actual fresh-browser downloads checked: Classic total thickness 3.0 mm; Native 3.7 mm, preserving its 3.3 mm black body. Files: test-exports/bambu-review/low-relief-web-{classic,native}.3mf. This supersedes the earlier candidate-only/default-0.8 statement. The 12 to 8 tool-change comparison applies to the measured Classic configuration, not a guarantee for all exports.
