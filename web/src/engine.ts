// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { buildDesign, type Base, type Config, type Design } from "./model";
import { export3mf } from "./export";
import type { Font } from "opentype.js";
export type StudioRequest = {
  id: number;
  type: "build" | "export";
  config: Config;
};
export type StudioResponse = {
  id: number;
  type: "build" | "export";
  key?: string;
  error?: string;
  design?: Design;
  data?: Uint8Array;
};
export function createEngine(deps: {
  loadBase: (id?: string) => Promise<Base>;
  loadFont: (text: string) => Promise<Pick<Font, "charToGlyph" | "unitsPerEm">>;
  post: (result: StudioResponse) => void;
  yieldToInput?: () => Promise<void>;
}) {
  let pendingBuild: StudioRequest | undefined,
    pendingExport: StudioRequest | undefined;
  let running: Promise<void> | undefined;
  let cached: { key: string; design: Design } | undefined;
  async function pump() {
    while (pendingBuild || pendingExport) {
      const request = pendingExport ?? pendingBuild!;
      if (request.type === "export") pendingExport = undefined;
      else pendingBuild = undefined;
      const { id, type, config } = request,
        key = JSON.stringify(config);
      try {
        const [base, font] = await Promise.all([
          deps.loadBase(config.styleId),
          deps.loadFont(
            (
              config.displayName +
              config.pronouns +
              config.customStatus
            ).normalize("NFC"),
          ),
        ]);
        if (type === "build" && pendingBuild && pendingBuild.id > id) continue;
        const design =
          cached?.key === key ? cached.design : buildDesign(config, base, font);
        cached = { key, design };
        if (type === "export")
          deps.post({ id, type, key, data: export3mf(design, config) });
        else deps.post({ id, type, key, design });
      } catch (e) {
        deps.post({
          id,
          type,
          key,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      // Yield so queued UI events can replace an obsolete pending build.
      await (deps.yieldToInput?.() ??
        new Promise<void>((resolve) => setTimeout(resolve, 0)));
    }
  }
  return {
    submit(input: StudioRequest) {
      const r = structuredClone(input);
      if (r.type === "build") pendingBuild = r;
      else if (!pendingExport) pendingExport = r;
      else {
        deps.post({
          id: r.id,
          type: r.type,
          error: "已有导出任务，请稍后再试",
        });
        return;
      }
      running ??= pump().finally(() => {
        running = undefined;
      });
    },
    whenIdle: () => running ?? Promise.resolve(),
  };
}
