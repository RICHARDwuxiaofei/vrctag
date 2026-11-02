import { test } from "node:test";
import assert from "node:assert/strict";
import { materialPlan } from "../src/materials.ts";
import { defaults, type Part } from "../src/model.ts";
const parts = [
  "Plate_Body",
  "Avatar_Frame",
  "Avatar_Back",
  "Status_Dot",
  "Name",
  "Pronouns",
  "Status_Text",
].map(
  (name, i) =>
    ({
      name,
      color: [
        "#102b2a",
        "#7b9992",
        "#385653",
        "#ff0000",
        "#ffd45d",
        "#bdcbc6",
        "#bdcbc6",
      ][i],
      vertices: [],
      triangles: [],
    }) as Part,
);
test("CFS4 keeps seven independent parts, with four material slots", () => {
  const p = materialPlan({ ...defaults, friend: true }, parts);
  assert.equal(p.palette.length, 4);
  assert.equal(p.parts.length, 7);
  assert.equal(p.parts.find((x) => x.name === "Name")?.slot, 2);
  assert.equal(p.parts.find((x) => x.name === "Status_Dot")?.slot, 3);
});
test("custom dot and filament mapping remain independent", () => {
  const p = materialPlan(
    {
      ...defaults,
      dotColor: "#123456",
      materialSlots: { Avatar_Frame: 0, Pronouns: 0 },
    },
    parts,
  );
  assert.equal(p.palette[3], "#123456");
  assert.equal(p.parts.find((x) => x.name === "Avatar_Frame")?.slot, 0);
  assert.equal(p.parts.find((x) => x.name === "Pronouns")?.slot, 0);
  assert.equal(p.parts.length, 7);
});
test("full visual palette remains opt-in and invalid slots/colors are rejected", () => {
  assert(
    materialPlan({ ...defaults, printMode: "visual" }, parts).palette.length >
      4,
  );
  assert.throws(() =>
    materialPlan({ ...defaults, materialSlots: { Name: 9 } }, parts),
  );
  assert.throws(() =>
    materialPlan({ ...defaults, filamentColors: ["x", "y", "z", "q"] }, parts),
  );
});
