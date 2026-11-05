// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file: string) =>
  readFileSync(new URL("../../" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("software MIT grant keeps legacy and other parties' rights separate", () => {
  assert(read("LICENSE").startsWith("MIT License"));
  assert(read("LICENSE").includes("Copyright (c) 2026 RICHARDwuxiaofei"));
  assert(read("legacy/LICENSE-before-mit.txt").includes('Original model: "VRC名牌吊牌" by WiseWolf'));
  assert(read("web/public/assets/OFL-Noto.txt").includes("SIL OPEN FONT LICENSE"));
  assert(read("THIRD_PARTY_NOTICES.md").includes("WiseWolf"));
  assert(read("web/public/licenses/PROJECT-NOTICE.txt").includes("not affiliated with or endorsed by VRChat"));
});

test("Classic and Native first-party model contributions both grant CC BY 4.0", () => {
  for (const file of [
    "studio/classic.blend",
    "studio/native.blend",
    "studio/vrc-tag-original.blend",
    "studio/demos/classic-nagikokoro.blend",
    "studio/demos/native-nagikokoro.blend",
    "web/public/assets/styles/classic/base.json",
    "web/public/assets/styles/native/base.json",
    "web/public/assets/styles/classic/thumbnail.json",
    "web/public/assets/styles/native/thumbnail.json",
    "web/public/assets/base.json",
    "web/public/assets/base.glb",
    "web/src/styles.catalog.json",
  ]) {
    const notice = read(file + ".license");
    assert(notice.includes("SPDX-License-Identifier: CC-BY-4.0\n"), file);
    assert(!notice.includes("SPDX-License-Identifier: CC-BY-NC-SA-4.0"), file);
  }
  assert(read("web/public/licenses/PROJECT-NOTICE.txt").includes("Classic and Native"));
  assert(read("LICENSE_SCOPE.md").includes("Historical"));
});
