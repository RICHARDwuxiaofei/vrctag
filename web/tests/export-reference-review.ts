import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import opentype from "opentype.js";
import { buildDesign, defaults } from "../src/model.ts";
import { export3mf } from "../src/export.ts";
const dir = new URL("../../test-exports/reference-review/", import.meta.url);
const out = new URL("samples/", dir);
mkdirSync(out, { recursive: true });
const b = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
);
for (const styleId of ["classic", "native"]) {
  const base = JSON.parse(
    readFileSync(
      new URL(`../public/assets/styles/${styleId}/base.json`, import.meta.url),
      "utf8",
    ),
  );
  for (const [id, patch] of [
    ["default-A", { statusMode: "preset", language: "zh" }],
    [
      "friend-pronouns-A",
      {
        friend: true,
        pronouns: "They/Them",
        statusMode: "preset",
        language: "en",
      },
    ],
    [
      "mixed-A",
      {
        displayName: "Nagi_心こんにちは",
        customStatus: "无聊",
        statusMode: "custom",
      },
    ],
    ["no-loop-A", { hangingLoop: false, statusMode: "preset", language: "ja" }],
    ["korean-A", { statusMode: "preset", language: "ko", status: "Ask Me" }],
  ] as const) {
    const c = { ...defaults, ...patch, styleId };
    const d = buildDesign(c, base, font);
    if (d.errors.length) throw Error(d.errors.join(";"));
    writeFileSync(new URL(`${styleId}-${id}.3mf`, out), export3mf(d, c));
    writeFileSync(
      new URL(`${styleId}-${id}-design.json`, out),
      JSON.stringify(d),
    );
  }
}
console.log("10 current production exports created");
