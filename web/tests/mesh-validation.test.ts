// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMesh, type Part, type Vec3 } from "../src/model.ts";
export function tetra(
  size: number,
  origin: Vec3 = [0, 0, 0],
  reverse = false,
): Part {
  const vertices: Vec3[] = [
    [0, 0, 0],
    [size, 0, 0],
    [0, size, 0],
    [0, 0, size],
  ].map((v) => v.map((n, k) => n + origin[k]) as Vec3);
  let triangles: Vec3[] = [
    [0, 2, 1],
    [0, 1, 3],
    [0, 3, 2],
    [1, 2, 3],
  ];
  if (reverse) triangles = triangles.map(([a, b, c]) => [a, c, b]);
  return { name: "test", color: "#ffffff", vertices, triangles };
}
export function combine(...parts: Part[]): Part {
  const result: Part = {
    name: "combined",
    color: "#ffffff",
    vertices: [],
    triangles: [],
  };
  for (const p of parts) {
    const offset = result.vertices.length;
    result.vertices.push(...p.vertices);
    result.triangles.push(
      ...p.triangles.map((t) => t.map((i) => i + offset) as Vec3),
    );
  }
  return result;
}
test("F-01: a positive exterior cannot hide an isolated inverted shell", () => {
  const r = validateMesh(combine(tetra(2), tetra(1, [5, 0, 0], true)));
  assert.equal(r.valid, false);
  assert(r.issues.some((s) => s.includes("orientation")));
});
test("nested inward cavity is legal, outward enclosed shell is not", () => {
  const cavity = combine(tetra(6), tetra(2, [1, 1, 1], true));
  assert.equal(validateMesh(cavity).valid, true);
  assert.deepEqual(
    validateMesh(cavity).shells.map((s) => s.depth),
    [0, 1],
  );
  assert.equal(
    validateMesh(combine(tetra(6), tetra(2, [1, 1, 1]))).valid,
    false,
  );
});
test("solid island within a cavity has even depth and positive volume", () => {
  assert.equal(
    validateMesh(
      combine(tetra(8), tetra(3, [1, 1, 1], true), tetra(0.2, [1.4, 1.4, 1.4])),
    ).valid,
    true,
  );
});
test("intersecting and coplanar-overlapping solid shells are rejected", () => {
  for (const offset of [
    [0.3, 0.3, 0.3],
    [0.3, 0.3, 0],
  ] as Vec3[])
    assert.equal(
      validateMesh(combine(tetra(2), tetra(2, offset))).valid,
      false,
    );
});
test("disjoint valid shells and a positive single shell remain valid", () => {
  assert(validateMesh(combine(tetra(2), tetra(1, [5, 0, 0]))).valid);
  assert(validateMesh(tetra(2)).valid);
});
test("coplanar triangles sharing an edge cannot overlap in positive area", async () => {
  const { trianglesIntersect } = await import("../src/mesh-validation.ts");
  const a: Vec3[] = [
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 0],
  ];
  assert(
    trianglesIntersect(
      a,
      [
        [2, 0, 0],
        [0, 0, 0],
        [1, 1, 0],
      ],
      [a[0], a[1]],
    ),
  );
  assert(
    !trianglesIntersect(
      a,
      [
        [2, 0, 0],
        [0, 0, 0],
        [0, -2, 0],
      ],
      [a[0], a[1]],
    ),
  );
});
