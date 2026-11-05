// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import opentype, { type Font } from "opentype.js";
export interface FontManifest {
  unitsPerEm: number;
  chunks: Record<string, { file: string; bytes: number; codepoints: number }>;
}
/** All original cmap entries are partitioned; no fixed Chinese/Japanese character whitelist. */
export class FontStore {
  private manifest?: Promise<FontManifest>;
  private cache = new Map<string, Promise<Font>>();
  constructor(
    private root: URL,
    private request: typeof fetch = fetch,
  ) {
    this.request = request.bind(globalThis);
  }
  private info() {
    return (this.manifest ??= this.request(
      new URL("manifest.json", this.root),
      { cache: "no-cache" },
    )
      .then((r) => {
        if (!r.ok) throw Error("字体清单加载失败，请重试");
        return r.json();
      })
      .catch((e) => {
        this.manifest = undefined;
        throw e;
      }));
  }
  private font(id: string, m: FontManifest) {
    let promise = this.cache.get(id);
    if (promise) {
      this.cache.delete(id);
      this.cache.set(id, promise);
      return promise;
    }
    promise = this.request(new URL(m.chunks[id].file, this.root), {
      cache: "no-cache",
    })
      .then((r) => {
        if (!r.ok) throw Error("字形资源加载失败，请重试");
        return r.arrayBuffer();
      })
      .then((b) => {
        const font = opentype.parse(b);
        if (font.unitsPerEm !== m.unitsPerEm) throw Error("字体单位不一致");
        return font;
      })
      .catch((e) => {
        this.cache.delete(id);
        throw e;
      });
    this.cache.set(id, promise);
    for (const key of this.cache.keys()) {
      if (this.cache.size <= 9) break;
      if (key !== "common") this.cache.delete(key);
    }
    return promise;
  }
  async forText(
    text: string,
  ): Promise<Pick<Font, "charToGlyph" | "unitsPerEm">> {
    const m = await this.info(),
      common = await this.font("common", m);
    const ids = new Set<string>();
    for (const char of text) {
      if (common.charToGlyph(char).index !== 0) continue;
      const id = String(char.codePointAt(0)! >>> 10);
      if (m.chunks[id]) ids.add(id);
    }
    const fonts = new Map(
      await Promise.all(
        [...ids].map(async (id) => [id, await this.font(id, m)] as const),
      ),
    );
    return {
      unitsPerEm: m.unitsPerEm,
      charToGlyph(char: string) {
        const glyph = common.charToGlyph(char);
        return glyph.index !== 0
          ? glyph
          : (fonts
              .get(String(char.codePointAt(0)! >>> 10))
              ?.charToGlyph(char) ?? glyph);
      },
    };
  }
}
