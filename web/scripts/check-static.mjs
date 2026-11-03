// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { readFile, readdir, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const dist = new URL("../dist/", import.meta.url);
// Original font remains in the source checkout for provenance/subset building/tests.
// Runtime loads only the complete partitioned font manifest/chunks.
await unlink(new URL("assets/NotoSansCJKsc-Bold.otf", dist)).catch((e) => {
  if (e.code !== "ENOENT") throw e;
});
const manifest = JSON.parse(
  await readFile(new URL("assets/fonts/manifest.json", dist), "utf8"),
);
for (const chunk of Object.values(manifest.chunks)) {
  const actual = await stat(new URL("assets/fonts/" + chunk.file, dist));
  if (actual.size !== chunk.bytes)
    throw Error("Missing/truncated runtime font chunk: " + chunk.file);
}
for (const name of [
  "licenses/PROJECT-NOTICE.txt",
  "licenses/VRC-Tag-Studio-MIT.txt",
  "licenses/CC-BY-4.0.txt",
  "licenses/CC-BY-NC-SA-4.0.txt",
  "assets/OFL-Noto.txt",
  "assets/styles/classic/base.json",
  "assets/styles/native/base.json",
  "assets/styles/classic/base.glb",
  "assets/styles/native/base.glb",
])
  await stat(new URL(name, dist));
async function scan(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    if (entry.isDirectory()) await scan(child);
    else if (
      /\.(blend|py|3mf)$/i.test(entry.name) ||
      /legacy|reference|codex-clipboard|nametag_template/i.test(entry.name)
    )
      throw Error(
        "Unexpected private/source/test artifact: " + fileURLToPath(child),
      );
  }
}
await scan(dist);
console.log(
  `Static acceptance PASS: ${Object.keys(manifest.chunks).length} runtime font chunks; no legacy/source/test packages; full 17 MB source font omitted.`,
);
