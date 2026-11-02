# VRC Tag Studio execution log

2026-11-02, Asia/Hong_Kong. Baseline 24c60f0, clean main. Working branch codex/vrc-nameplate-web.

1. PASS: repository and legacy notices inspected; no old geometry loaded or generator code reused.
2. PASS: Blender 5.2.1 LTS connected; blank geometry scene (camera/light only). Addon protocol 9 vs server 15; use supported fallback execution. Safe mode preserved.
3. References: only Moonster Girl and Ravi_O images supplied. Missing green/Profile references; use explicit user defaults. No screenshot assets embedded.

Plan: original 120 × 38 mm capsule, 3 mm body; coplanar interfaces for relief components; +Z front, X horizontal, Y vertical. Independently authored Blender mesh feeds browser base JSON and GLB. Browser generates vector font text and exports validated closed meshes as a core 3MF assembly with base materials. No server computation.

4. PASS: original Blender source saved and reopened; base part manifold/volume checks passed; front/side/perspective evidence saved. GLB meter conversion fixed and loader-tested.
5. PASS: React/TypeScript/Vite studio, local avatar, status/friend/pronouns controls, adaptive camera and same-mesh preview.
6. PASS: Worker-local CJK outline construction, same-vertex closed cap/wall triangulation, collinear bridge repair, unsupported/small/invalid-text export blocking.
7. PASS: local ZIP/core-3MF assembly and materials; actual browser downloads independently decoded and validated. Avatar before/after archive entries byte-identical.
8. PASS: 10/10 automated tests, TypeScript, production build, desktop/mobile GUI, actual downloaded JSON and reset. Production subpath /vrctag/ loaded with a plain static file server.
9. PASS: provenance/runtime notices, source and build isolation, deployment examples and acceptance matrix. Root legacy rights unchanged.
10. PARTIAL: all deliverables present; real Creality Print / OrcaSlicer import and physical print NOT_TESTED because software/hardware absent. No deployment or main merge.
