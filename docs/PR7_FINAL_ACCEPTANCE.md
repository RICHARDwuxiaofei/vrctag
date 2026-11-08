# PR #7 final acceptance — 2026-11-09

Verdict: **GO for public Beta; ready for human-approved merge.** No main merge, Cloudflare account connection, deployment, DNS change or printer operation was performed.

Tested implementation commit: `ac8849b8c0b7abeaa39067d0f1d97b0ab13bac09`, on `feat/integrate-relief-and-precise-sizing`, based on `fb9160c`. The follow-up commit only adds acceptance and diagnostic documentation. PR #3 and #6 were not merged separately. See the per-file results in [acceptance/PR7_2026-11-09.json](acceptance/PR7_2026-11-09.json).

| Gate | Result | Actual evidence |
|---|---|---|
| A. Engineering | PASS | Isolated Node 22.23.4; npm ci, check, 65/65 unit tests, 17/17 specified tests, Classic 43/43 and Native 43/43 diagnostics, production build; Python 12/12 |
| B. Blender GLB download/import | PASS within tested Chrome/Blender scope | 32 real website downloads, GLB v2 headers and lengths, 32 actual Blender 5.2.3 imports, named objects, positive volumes, zero non-manifold edges/degenerate faces on printable meshes, physical XYZ dimensions and colors; embedded photo texture on avatar cases |
| C. Web sizing and 3MF | PASS | 64 real Core/Bambu downloads, independent mesh/package audit; lib3mf 2.5.0 strict reader, 64 files / zero warnings |
| D. Blender sources | PASS | Both formal sources synchronized to production JSON, reopened and vertex/face compared; demos replaced with actual web GLB meshes; both demos reopened; 8 real Blender Workbench renders |
| E. Pages readiness | GO for public Beta | Node22 build; 175 static resources served via HTTP with matching SHA256, model/font/Worker assets included, max asset 1,199,625 bytes; no Functions or server secrets |
| F. Slicing/physical print | NOT_TESTED this run | No new slicer certification or physical print claim |

## Defects corrected

1. GLB exported Z-up geometry without converting to glTF Y-up. Blender imported the print bed into XZ instead of XY. Corrected exporter rotation; the actual Blender matrix verifies X/Y footprint and Z thickness. Added a real exporter/loader regression.
2. Custom `VRC-Tag-Studio:Generator` metadata used an undeclared XML prefix. Official lib3mf reproduced the error. Bound its namespace in both 3MF modes. Strict-reader retest is clean; regression checks every custom metadata prefix.
3. Download anchor is attached before clicking; Blob URL is retained 60 seconds instead of 2 seconds. Export failures now emit the original exception to Console. These are compatibility/diagnostic improvements, not proof of fixing the unknown reporter's failure.
4. Old regressions still expected a Native white core, visible Native status by default, historical white/name colors or hook-inclusive row spacing. Updated them to the explicitly accepted design, retained positive/negative geometry and export checks. No designs were rolled back.
5. Added an explicit reduced-Z warning: 50% makes 0.6mm relief 0.3mm. Scaling is not a printability guarantee.

## Actual browser matrix

Chrome headless on Windows, using production `web/dist` at `127.0.0.1:4173`. First 24 combinations: both styles × avatar/no-avatar × hook/no-hook × uniform 50/100/150%. Friend gold names, mixed Chinese/Japanese/English, pronouns and custom status included. Four more exports cover XY 75/125% with independent Z 100%. Four exact-input exports cover both styles with target length 100.01mm or width 30.01mm and independent thickness 2.11mm. All three formats actually downloaded per case (32 GLB + 64 3MF). Browser Console/network error collection was empty on the main matrix.

Real UI checks: direct mm inputs, linked XY, independent Z, fractional 75.25%, blur, Enter, Escape restore, style-switch scale persistence, JSON export/recovery and legacy configs defaulting to 100%. Preview dimensions rounded to 0.01mm were compared to real exported bounds. Desktop and 390px screenshots captured; no horizontal overflow at 390px.

100% Classic: **134 × 52 × 3.2mm**. Native with hook: **120 × 46.5 × 3.9mm**; without hook: **120 × 40 × 3.9mm**. Here 40mm is the short Y dimension, not the 120mm long X dimension. Both text and status-dot relief are 0.6mm at 100%. Native body remains full black to 3.3mm; Classic retains its white core and 0.6mm black face. CFS4 remains four slots; no UI re-expansion.

## Formal source audit

Original files were preserved by Git checkpoint and ignored backup copies. Independent regeneration matched Classic exactly. Native's generated Avatar_Frame/preview surface had different Boolean triangulation (same outline/Z bounds), so that candidate was **not** used to overwrite production geometry. Instead the current runtime JSON vertices/faces were synchronized into existing source objects, preserving names, materials, units and other scene data. Reopened sources match runtime vertices/faces within float tolerance and pass closed-volume checks. Existing Node GLB checks cover static base GLB bounds and 0.6mm status relief.

Demos are default Nagikokoro / friend gold / They/Them / 无聊 / hook enabled at 100%, imported from actual webpage GLB files. They contain real text meshes; no private photo is included. Formal sources are millimeter scene units; imported demos use glTF meter transforms and have the same physical dimensions.

Real Blender images updated at `web/public/assets/styles/{classic,native}/{front,perspective}.png`. Eight source/demo front/perspective renders and a standalone gallery are local ignored evidence, not all bundled into the site.

## Feedback boundary

The original user's unspecified “cannot export” report remains **NOT_REPRODUCED**, not closed as fixed. During this run there was no unresponsive download, export error, zero-byte file or failed Blender import in the tested matrix. The reproducible axis defect above is fixed independently. Native .blend is not the browser download format: choose GLB and import via Blender File → Import → glTF 2.0. Diagnostic instructions: [BLENDER_EXPORT_DIAGNOSTICS.md](BLENDER_EXPORT_DIAGNOSTICS.md).

## Hosting and licenses

Cloudflare Git integration: repo `RICHARDwuxiaofei/vrctag`; production branch main **after approved merge**; root `web`; build `npm run build`; output `dist`; `NODE_VERSION=22`. Keep `_headers` no-cache policy for unhashed model/font catalogs and normal browser Worker. No GitHub Actions, backend model generation, VPS, Functions, R2, KV or D1 added. The package passes the current 20,000-file / 25MiB-file limits at https://developers.cloudflare.com/pages/platform/limits/ .

Actual hosted HTTPS/CDN cache and download behavior is **NOT_TESTED**, because deployment was explicitly excluded. This is an environmental verification boundary, not a known code blocker. No broad cross-browser or printer certification is claimed. Public Preview links can be publicly accessible. See CLOUDFLARE_PAGES_DEPLOY.md for dashboard configuration and rollback.

First-party software MIT; current first-party Classic/Native models CC BY 4.0. Third-party Bambu preset data retains its separate upstream license and shipped notices; fonts/dependencies/history retain their own notices. No license boundary changed in this work.

## Evidence and release decision

Full logs: `D:/CODE/vrctag/test-exports/pr7-final/` (npm-ci.log, final-check.log, final-test.log, final-test-review.log, final-review-native.log, final-targeted.log, final-build.log, browser.json, file-audit.json, lib3mf.json, blender-import.json, source-reopen.json, http.json). Downloads: its `downloads/` directory. Gallery: `D:/CODE/vrctag/test-exports/pr7-final/gallery.html`; screenshots desktop.png/mobile.png; backups backup/; raw Blender renders renders/.

Curated counts, dimensions and final-log SHA256 hashes are checked in under docs/acceptance; large local evidence is ignored. Earlier failed exploratory logs are retained, superseded by the final passing artifacts above. All software test commands were rerun after the code fixes.

**Known code blockers to this defined public Beta: 0.** PR #7 may be merged after owner approval. Original reporter reproduction, deployed HTTPS behavior and physical printing remain explicitly separate validation boundaries. Do not merge PR #3/#6 independently or call this universal printing certification.
