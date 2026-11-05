# Third-party notices and exclusions

- **WiseWolf — VRC名牌吊牌**: https://makerworld.com.cn/zh/models/203011-vrcming-pai-diao-pai . Root legacy template, its adaptations and historical generator retain CC BY-NC-SA 4.0 and ATTRIBUTION.md. Classic's similar large-avatar design remains a separately identified NC-SA exception pending clarification. No claim that recomputing a mesh automatically removes derivative-work obligations.
- **Noto Sans CJK**: SIL OFL 1.1. Original font and renamed VRCStudioSubset derived chunks retain `web/public/assets/OFL-Noto.txt`, original copyright and OFL terms. Model text is generated using this font; no claim of exclusive ownership of the glyph designs is made.
- **React, React DOM, scheduler, Three.js, opentype.js, fflate and embedded runtime dependencies**: original MIT notices retained in `web/public/licenses/`. Exact versions are in `web/package-lock.json`; see `docs/SOURCES.md`. Their copyright is not replaced with the project author's.
- **Development tools**: Blender, OrcaSlicer, the Blender Extensions 3MF Import/Export addon, lib3mf, Pillow and npm development dependencies retain their original licenses. Downloaded tool binaries/source are not redistributed in the static site or repository. Verified portable tools live in a temporary isolated directory for this test. Orca-produced test projects contain upstream settings/preset data and are not covered wholesale by project MIT/CC BY; see `studio/evidence/beta-2026-11-04/orca/NOTICE.md`.
- User-uploaded images remain the user's content, processed locally, omitted from exports and repository. No VRChat official logo, third-party avatar image, account API, or game scene texture is bundled.

This project is unofficial and is not endorsed by VRChat or WiseWolf. For exact first-party/legacy path scope, see LICENSE_SCOPE.md. Prior CC BY-NC-SA grants remain available to compliant recipients; this migration does not retroactively revoke them.

## Clipper / Javascript Clipper

Runtime glyph contour repair uses clipper-lib 6.4.2 (Angus Johnson 2010-2017; Javascript port by Timo and contributors), under the Boost Software License 1.0. Source: https://github.com/junmer/clipper-lib . License text is distributed in web/public/licenses/Boost-Software-License-1.0.txt. Project MIT does not replace this license.
