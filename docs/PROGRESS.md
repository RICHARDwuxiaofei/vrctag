# VRC Tag Studio execution log

2026-11-02, Asia/Hong_Kong. Baseline 24c60f0, clean main. Working branch codex/vrc-nameplate-web.

1. PASS: repository and legacy notices inspected; no old geometry loaded or generator code reused.
2. PASS: Blender 5.2.1 LTS connected; blank geometry scene (camera/light only). Addon protocol 9 vs server 15; use supported fallback execution. Safe mode preserved.
3. References: only Moonster Girl and Ravi_O images supplied. Missing green/Profile references; use explicit user defaults. No screenshot assets embedded.

Plan: original 120 × 38 mm capsule, 3 mm body; coplanar interfaces for relief components; +Z front, X horizontal, Y vertical. Independently authored Blender mesh feeds browser base JSON and GLB. Browser generates vector font text and exports validated closed meshes as a core 3MF assembly with base materials. No server computation.
