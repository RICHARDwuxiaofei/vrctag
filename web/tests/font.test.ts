import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";
import { FontStore, type FontManifest } from "../src/font-store.ts";
import { buildDesign, defaults, type Base } from "../src/model.ts";
const directory = new URL("../public/assets/fonts/", import.meta.url),
  m: FontManifest = JSON.parse(
    readFileSync(new URL("manifest.json", directory), "utf8"),
  );
const buffer = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const original = opentype.parse(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
);
const parse = (b: Buffer) =>
  opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const base: Base = JSON.parse(
  readFileSync(new URL("../public/assets/base.json", import.meta.url), "utf8"),
);
test("all original supported codepoints survive the renamed OFL partitions", () => {
  const fonts = new Map(
    Object.entries(m.chunks).map(([id, c]) => [
      id,
      parse(readFileSync(new URL(c.file, directory))),
    ]),
  );
  const common = fonts.get("common")!;
  let count = 0;
  for (const [cp, index] of Object.entries(
    original.tables.cmap.glyphIndexMap,
  )) {
    if (index === 0) continue;
    const char = String.fromCodePoint(Number(cp)),
      font = common.charToGlyph(char).index
        ? common
        : fonts.get(String(Number(cp) >>> 10));
    assert(font && font.charToGlyph(char).index !== 0, cp);
    assert.equal(
      font!.charToGlyph(char).advanceWidth,
      original.charToGlyph(char).advanceWidth,
    );
    count++;
  }
  writeFileSync(
    new URL(
      "../../studio/evidence/fixes-2026-11-03/font-coverage.json",
      import.meta.url,
    ),
    JSON.stringify(
      {
        supportedCodepoints: count,
        coveragePreserved: true,
        defaultFontBytes: m.chunks.common.bytes,
      },
      null,
      2,
    ),
  );
});
test("default font loads under 500KB and repeated requests reuse cache", async () => {
  let bytes = 0,
    calls = 0;
  const request = (async (url: any) => {
    calls++;
    const b = readFileSync(
      new URL(new URL(url).pathname.split("/").pop()!, directory),
    );
    bytes += b.byteLength;
    return new Response(b);
  }) as typeof fetch;
  const store = new FontStore(new URL("https://local.invalid/fonts/"), request);
  const font = await store.forText("Nagikokoro无聊");
  assert(bytes < 500000);
  const before = calls;
  await store.forText("Nagikokoro");
  assert.equal(calls, before);
  const a = buildDesign(defaults, base, original),
    b = buildDesign(defaults, base, font);
  assert.deepEqual(b.parts, a.parts);
});
test("failed font request can retry, and uncommon CJK is loaded on demand", async () => {
  let fail = true;
  const request = (async (url: any) => {
    const file = new URL(url).pathname.split("/").pop()!;
    if (file === m.chunks.common.file && fail) {
      fail = false;
      return new Response("", { status: 503 });
    }
    return new Response(readFileSync(new URL(file, directory)));
  }) as typeof fetch;
  const store = new FontStore(new URL("https://local.invalid/fonts/"), request);
  await assert.rejects(store.forText("Nagi"));
  const f = await store.forText("鬱漢ナギ");
  for (const c of "鬱漢ナギ") assert(f.charToGlyph(c).index !== 0);
});
test("native fetch receiver stays global rather than the FontStore instance", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = function (this: unknown, url: any) {
    assert.equal(this, globalThis);
    return Promise.resolve(
      new Response(
        readFileSync(
          new URL(new URL(url).pathname.split("/").pop()!, directory),
        ),
      ),
    );
  } as typeof fetch;
  try {
    const f = await new FontStore(
      new URL("https://local.invalid/fonts/"),
    ).forText("Nagikokoro无聊");
    assert(f.charToGlyph("聊").index !== 0);
  } finally {
    globalThis.fetch = previous;
  }
});
