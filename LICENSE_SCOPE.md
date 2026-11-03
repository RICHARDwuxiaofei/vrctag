# Path-level license scope

This repository is **mixed-license**. Root `LICENSE` is the MIT license for the independently authored software listed below, not a blanket relicensing of every file. Copyright (c) 2026 RICHARDwuxiaofei. Third-party rights and previous grants remain in force. Effective additional grants: 2026-11-04.

| Paths / contents | Current terms |
| --- | --- |
| Independently authored `web/src/*.{ts,tsx,css}`, `web/tests/`, build/config software in `web/`, `studio/scripts/` | MIT; see root LICENSE and SPDX headers. Model/design data and third-party packages are excluded. |
| `studio/native.blend`, `studio/vrc-tag-original.blend`, `web/public/assets/styles/native/{base.json,base.glb,*.png}` | CC BY 4.0, attribution **RICHARDwuxiaofei — VRC Tag Studio**, repository https://github.com/RICHARDwuxiaofei/vrctag; indicate modifications. This is an additional grant by the first-party author. |
| `studio/classic.blend`, `web/public/assets/styles/classic/`, default compatibility aliases `web/public/assets/base.json` and `base.glb` | Existing CC BY-NC-SA 4.0 terms retained conservatively pending review of Classic's similarity to WiseWolf's large-avatar design. **No CC BY 4.0 or unrestricted-commercial grant is made for Classic.** No copying of mesh data was found; that alone does not settle design rights. |
| `web/src/styles.catalog.json` | Native design entry: CC BY 4.0. Classic design entry: existing CC BY-NC-SA 4.0 pending review. Mixed data file; not covered wholesale by software MIT. |
| `studio/demos/native-nagikokoro.blend` and current Native rendered evidence | CC BY 4.0 for first-party model contributions; actual Noto-generated glyph provenance retained. No embedded font program or user photo. |
| `studio/demos/classic-nagikokoro.blend`, Classic/mixed/legacy-reference renders and sample geometry | Existing CC BY-NC-SA 4.0 scope retained; do not infer a commercial grant from the MIT importer or generator. |
| Root `name_tag_generator.py`, `upgrade_existing.py`, `start.cmd`, `nametag_template.blend`, ATTRIBUTION.md, retained legacy README section | Legacy CC BY-NC-SA 4.0 scope and original attribution retained, **not MIT**. Files remain at their compatible historical paths; see `legacy/README.md`. |
| Noto OTF/font subsets and their manifest/derived font data | SIL OFL 1.1; original notices and renamed subset provenance retained. This migration does not relicense the font. |
| Third-party runtime libraries and notices in `web/public/licenses/` | Their respective original licenses; never relicensed under the project's author credit. |
| `studio/evidence/**` | Do not blanket relicense historical evidence. Native/initial-original model images retain author grants; Classic/legacy/mixed reference images retain the conservative NC-SA scope. Software test logs/report prose are MIT first-party documentation. Generated 3MF contains the respective model plus Noto-generated text; software MIT does not change those assets' rights. Orca-derived projects also contain upstream preset data; see their NOTICE. |

Model attribution should link the repository and CC BY 4.0 license and identify modifications. Neither VRChat nor WiseWolf endorses the project. Official logos/third-party textures are not bundled.

`legacy/LICENSE-before-mit.txt` is a byte-for-byte copy of the previous repository-wide notice. Existing CC BY-NC-SA distributions cannot be retroactively revoked for recipients complying with their terms. The new MIT and CC BY grants only exercise rights the author controls; they do not cancel earlier grants, remove WiseWolf rights or clear uncertain Classic rights. License metadata is a scope record, not legal proof of ownership. See `docs/LICENSE_MIGRATION.md`.
