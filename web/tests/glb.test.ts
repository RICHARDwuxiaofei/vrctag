// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
test("GLB loads with original parts and physical meter bounds", async () => {
  const b = readFileSync(new URL("../public/assets/base.glb", import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    "",
  );
  const parts: string[] = [];
  gltf.scene.traverse((o) => {
    if (o instanceof THREE.Mesh) parts.push(o.name);
  });
  assert.deepEqual(
    parts.sort(),
    [
      "Plate_Rim",
      "Avatar_Back",
      "Hanging_Loop",
      "Plate_Core",
      "Plate_Body",
      "Status_Dot",
    ].sort(),
  );
  const bounds = new THREE.Box3()
    .setFromObject(gltf.scene)
    .getSize(new THREE.Vector3());
  assert(Math.abs(bounds.x - 0.134) < 1e-6);
  assert(Math.abs(bounds.z - 0.052) < 1e-6);
  assert(Math.abs(bounds.y - 0.004) < 1e-6);
});
