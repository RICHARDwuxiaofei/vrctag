// Bounded diagnostics; records failures without modifying product code.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import opentype from "opentype.js";
import {
  buildDesign,
  defaults,
  statuses,
  validateMesh,
  type Config,
  type Base,
  type Part,
  type Vec3,
} from "../src/model.ts";
import { export3mf } from "../src/export.ts";
const out = new URL("../../studio/evidence/fixes-2026-11-03/", import.meta.url);
mkdirSync(out, { recursive: true });
const base: Base = JSON.parse(
  readFileSync(new URL("../public/assets/base.json", import.meta.url), "utf8"),
);
const raw = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const t = performance.now();
const font = opentype.parse(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
const fontParseMs = performance.now() - t;
const results: any[] = [];
function check(
  id: string,
  patch: Partial<Config>,
  expected: boolean,
  extra?: (d: ReturnType<typeof buildDesign>) => boolean,
) {
  const c = { ...defaults, ...patch },
    start = performance.now();
  try {
    const d = buildDesign(c, base, font);
    let bytes: Uint8Array | undefined;
    let exportError = "";
    try {
      bytes = export3mf(d, c);
    } catch (e) {
      exportError = String(e);
    }
    results.push({
      id,
      expected: expected ? "accept" : "reject",
      accepted: !!bytes,
      status: !!bytes === expected && (!extra || extra(d)) ? "PASS" : "FAIL",
      elapsedMs: +(performance.now() - start).toFixed(2),
      parts: d.parts.map((p) => p.name),
      textHeights: d.textHeights,
      errors: d.errors,
      warnings: d.warnings,
      exportError,
    });
    if (bytes) writeFileSync(new URL(id + ".3mf", out), bytes);
  } catch (e) {
    results.push({
      id,
      status: "FAIL",
      exception: String(e),
      elapsedMs: +(performance.now() - start).toFixed(2),
    });
  }
}
for (const name of [
  "Amy",
  "Nagikokoro",
  "B8@%&",
  "小凪心",
  "ナギココロ",
  "Nagi_心こんにちは",
  "随意 / Any",
  "鬱龍龜",
  "繁體中文",
  "ひらがな カタカナ",
  "A<&\"'>B",
  "é",
])
  check("text-" + results.length, { displayName: name }, true);
for (const [status, color] of Object.entries(statuses))
  for (const friend of [false, true])
    check(
      `palette-${status.replaceAll(" ", "-")}-${friend}`,
      { status: status as Config["status"], friend, customStatus: "独立文字" },
      true,
      (d) =>
        d.parts.find((p) => p.name === "Status_Dot")?.color === color &&
        d.parts.find((p) => p.name === "Name")?.color ===
          (friend ? "#ffd45d" : "#f3f6ed"),
    );
for (const pronouns of [
  "",
  "   ",
  "He/Him",
  "She/Her",
  "They/Them",
  "随意 / Any",
])
  check(
    "pronouns-" + results.length,
    { pronouns },
    true,
    (d) => d.parts.some((p) => p.name === "Pronouns") === !!pronouns.trim(),
  );
check(
  "no-status-no-pronouns",
  { customStatus: "", pronouns: "" },
  true,
  (d) =>
    !d.parts.some((p) => p.name === "Status_Text" || p.name === "Pronouns"),
);
check(
  "custom-color-independent",
  { dotColor: "#123456" },
  true,
  (d) => d.parts.find((p) => p.name === "Status_Dot")?.color === "#123456",
);
for (const [id, patch] of Object.entries({
  empty: { displayName: "" },
  whitespace: { displayName: "   " },
  emoji: { displayName: "🙂" },
  tooLong: { displayName: "A".repeat(121) },
  tooSmall: { displayName: "W".repeat(100) },
  longPronouns: { pronouns: "随".repeat(121) },
  zeroWidth: { displayName: "\u200b" },
  nonColor: { dotColor: "not-a-color" },
}))
  check(id, patch, false);
const p = buildDesign(defaults, base, font).parts[0];
const defects: Record<string, Part> = {
  open: { ...p, triangles: p.triangles.slice(1) },
  reversed: {
    ...p,
    triangles: p.triangles.map(([a, b, c]) => [a, c, b] as Vec3),
  },
  nonfinite: { ...p, vertices: [[NaN, 0, 0], ...p.vertices.slice(1)] },
  outOfRange: {
    ...p,
    triangles: [[0, 1, p.vertices.length], ...p.triangles.slice(1)],
  },
};
for (const [id, part] of Object.entries(defects)) {
  const r = validateMesh(part);
  results.push({
    id: "mesh-" + id,
    expected: "reject",
    accepted: r.valid,
    status: r.valid ? "FAIL" : "PASS",
    validation: r,
  });
}
const tetra: Part = {
  name: "probe",
  color: "#ffffff",
  vertices: [
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 0],
    [0, 0, 2],
    [5, 0, 0],
    [6, 0, 0],
    [5, 1, 0],
    [5, 0, 1],
  ],
  triangles: [
    [0, 2, 1],
    [0, 1, 3],
    [0, 3, 2],
    [1, 2, 3],
    [4, 5, 6],
    [4, 7, 5],
    [4, 6, 7],
    [5, 7, 6],
  ],
};
const probe = validateMesh(tetra);
results.push({
  id: "mesh-disconnected-inward-shell",
  expected: "reject",
  accepted: probe.valid,
  status: probe.valid ? "FAIL" : "PASS",
  validation: probe,
  scope: "Synthetic validator diagnostic; not confirmed normal UI output",
});
const result = {
  testedSourceCommit:
    process.env.SOURCE_COMMIT ??
    "unrecorded (set SOURCE_COMMIT when recording evidence)",
  date: "2026-11-03 Asia/Hong_Kong",
  fontParseMs: +fontParseMs.toFixed(2),
  summary: {
    total: results.length,
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
  },
  results,
  limits: [
    "Node timings are not browser/mobile performance measurements",
    "No slicer or printer used",
    "No self-intersection or minimum-stroke certification",
  ],
};
writeFileSync(new URL("matrix.json", out), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
// An intentionally invalid synthetic diagnostic; never a real tag.
let exploitRejected = false;
try {
  export3mf(
    { parts: [tetra], errors: [], warnings: [], textHeights: {} },
    defaults,
  );
} catch {
  exploitRejected = true;
}
if (!exploitRejected) process.exitCode = 1;

process.exitCode = result.summary.fail || !exploitRejected ? 1 : 0;
