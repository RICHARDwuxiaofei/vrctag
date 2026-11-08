# Blender GLB export — minimum failure report

The web download is a **.glb**, not native .blend. In Blender use **File → Import → glTF 2.0 (.glb/.gltf)**. Opening GLB through File → Open will not import it. Save as .blend after import. Uploaded images are preview textures, not printable relief; 3MF omits them.

1. Record the exact site URL, browser name/version, OS and Blender version. State whether this is the deployed site or localhost.
2. Try a short name with no avatar at 100%, then repeat with the failing configuration. Record style, hook state, XY/Z values and whether an avatar is used.
3. Identify the stage:
   - No response: screenshot selected format/button/loading state; check browser download list and Console.
   - “Export failed”: screenshot the visible message and the `VRC Tag Studio Blender GLB export failed` Console exception including its stack.
   - Empty/corrupt download: provide exact filename, byte size and the downloaded GLB (a synthetic non-private reproduction is preferred).
   - Import failure: provide the GLB, Blender version, import menu path and the full error/traceback.
   - Wrong appearance: screenshot the imported object, physical dimensions and Material Preview; identify missing colors, texture or wrong axis/scale. Solid viewport mode may not display image textures.
4. Browser developer tools: enable Preserve log, clear old messages, reproduce once, capture the first red Console error. On Network capture failed JS/Worker/font/model requests, status codes and URL. Do not send cookies, tokens, unrelated browsing data or private avatar photos. Request a minimal synthetic reproduction where privacy matters.
5. After a successful download a GitHub Star dialog may appear. “Later” closes it; it is not an export error.

Send the minimal report to nagikokoro2006@gmail.com. Tested reference: Chrome on Windows + Blender 5.2.3, Node22 static build. Other browser versions are not automatically covered by that result.

2026-11-09: 32 real webpage GLBs downloaded, headers validated and actually imported into Blender; current coordinate-axis defect fixed. The original unspecified reporter failure remains NOT_REPRODUCED, not claimed solved.
