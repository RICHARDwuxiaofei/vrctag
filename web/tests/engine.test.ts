import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { createEngine, type StudioResponse } from "../src/engine.ts";
import { defaults, type Base } from "../src/model.ts";
import { styles } from "../src/styles.ts";
const raw = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
const bases = new Map(
  styles.map((s) => [
    s.id,
    JSON.parse(
      readFileSync(
        new URL("../public/assets/" + s.baseFile, import.meta.url),
        "utf8",
      ),
    ) as Base,
  ]),
);
const source = (id = styles[0].id) => Promise.resolve(bases.get(id)!);
const noYield = () => Promise.resolve();
test("queued style switches and text edits coalesce to final config", async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const results: StudioResponse[] = [];
  const engine = createEngine({
    loadBase: source,
    loadFont: async () => {
      await gate;
      return font;
    },
    post: (r) => results.push(r),
    yieldToInput: noYield,
  });
  for (let id = 1; id <= 20; id++)
    engine.submit({
      id,
      type: "build",
      config: {
        ...defaults,
        styleId: styles[id % styles.length].id,
        displayName: "Switch_" + id,
      },
    });
  release();
  await engine.whenIdle();
  assert.deepEqual(
    results.map((r) => r.id),
    [20],
  );
  assert.equal(results[0].design?.styleId, styles[20 % styles.length].id);
  assert.equal(JSON.parse(results[0].key!).displayName, "Switch_20");
});
test("export during switch uses captured style and text; later preview stays independent", async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const results: StudioResponse[] = [];
  const engine = createEngine({
    loadBase: source,
    loadFont: async () => {
      await gate;
      return font;
    },
    post: (r) => results.push(r),
    yieldToInput: noYield,
  });
  const original = {
    ...defaults,
    styleId: styles[1].id,
    displayName: "Snapshot_A",
  };
  engine.submit({ id: 1, type: "export", config: original });
  original.styleId = styles[0].id;
  original.displayName = "Changed_after_submit";
  engine.submit({
    id: 2,
    type: "build",
    config: { ...defaults, styleId: styles[0].id, displayName: "Snapshot_B" },
  });
  release();
  await engine.whenIdle();
  assert(results.every((r) => !r.error));
  const archive = unzipSync(results.find((r) => r.id === 1)!.data!);
  const metadata = JSON.parse(strFromU8(archive["Metadata/design.json"]));
  assert.equal(metadata.styleId, styles[1].id);
  assert.equal(metadata.displayName, "Snapshot_A");
  const preview = results.find((r) => r.id === 2)!;
  assert.equal(preview.design?.styleId, styles[0].id);
  assert.equal(JSON.parse(preview.key!).displayName, "Snapshot_B");
});
test("failed model resource can recover on next same-style request", async () => {
  let fail = true;
  const results: StudioResponse[] = [];
  const engine = createEngine({
    loadBase: async (id) => {
      if (fail) throw Error("simulated static resource failure");
      return source(id);
    },
    loadFont: () => Promise.resolve(font),
    post: (r) => results.push(r),
    yieldToInput: noYield,
  });
  engine.submit({ id: 1, type: "build", config: defaults });
  await engine.whenIdle();
  assert.match(results[0].error!, /simulated/);
  fail = false;
  engine.submit({ id: 2, type: "build", config: defaults });
  await engine.whenIdle();
  assert(!results[1].error);
  assert(results[1].design?.parts.length);
});
test("same-value rebuilds and repeated exports produce correctly correlated responses", async () => {
  const results: StudioResponse[] = [];
  const engine = createEngine({
    loadBase: source,
    loadFont: () => Promise.resolve(font),
    post: (r) => results.push(r),
    yieldToInput: noYield,
  });
  for (let id = 1; id <= 4; id++) {
    engine.submit({ id, type: "build", config: defaults });
    await engine.whenIdle();
  }
  assert.deepEqual(
    results.map((r) => r.id),
    [1, 2, 3, 4],
  );
  assert(results.every((r) => !r.error));
  for (let id = 5; id <= 6; id++) {
    engine.submit({ id, type: "export", config: defaults });
    await engine.whenIdle();
  }
  assert(results.find((r) => r.id === 5)?.data?.length);
  assert(results.find((r) => r.id === 6)?.data?.length);
});
