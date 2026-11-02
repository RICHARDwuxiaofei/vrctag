import { FontStore } from "./font-store";
import opentype from "opentype.js";
import { buildDesign, type Base, type Config, type Design } from "./model";
import { export3mf } from "./export";
const assets = new URL("../assets/", self.location.href);
const fonts = new FontStore(new URL("fonts/", assets));
let basePromise: Promise<Base> | undefined;
function base() {
  return (basePromise ??= fetch(new URL("base.json", assets), {
    cache: "no-cache",
  })
    .then((r) => {
      if (!r.ok) throw Error("基础模型加载失败，可重试");
      return r.json();
    })
    .catch((e) => {
      basePromise = undefined;
      throw e;
    }));
}
type Request = { id: number; type: "build" | "export"; config: Config };
let pendingBuild: Request | undefined,
  pendingExport: Request | undefined,
  running = false;
let cached: { key: string; design: Design } | undefined;
async function pump() {
  if (running) return;
  running = true;
  try {
    while (pendingBuild || pendingExport) {
      const request = pendingExport ?? pendingBuild!;
      if (request.type === "export") pendingExport = undefined;
      else pendingBuild = undefined;
      const { id, type, config } = request,
        key = JSON.stringify(config);
      try {
        const [source, font] = await Promise.all([
          base(),
          fonts.forText(
            (
              config.displayName +
              config.pronouns +
              config.customStatus
            ).normalize("NFC"),
          ),
        ]);
        if (type === "build" && pendingBuild && pendingBuild.id > id) continue;
        const design =
          cached?.key === key
            ? cached.design
            : buildDesign(config, source, font);
        cached = { key, design };
        if (type === "export") {
          const data = export3mf(design, config);
          self.postMessage(
            { id, type, key, data },
            { transfer: [data.buffer] },
          );
        } else self.postMessage({ id, type, key, design });
      } catch (e) {
        self.postMessage({
          id,
          type,
          key,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      // Let queued input events run before deciding which build is still wanted.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    running = false;
  }
}
self.onmessage = (e: MessageEvent<Request>) => {
  const r = e.data;
  if (r.type === "build") pendingBuild = r;
  else if (!pendingExport) pendingExport = r;
  else {
    self.postMessage({
      id: r.id,
      type: r.type,
      error: "已有导出任务，请稍后再试",
    });
    return;
  }
  void pump();
};
