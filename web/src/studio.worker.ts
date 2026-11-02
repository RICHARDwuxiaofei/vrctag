import opentype from "opentype.js";
import { buildDesign, type Base, type Config } from "./model";
import { export3mf } from "./export";
const assets = new URL("../assets/", self.location.href);
const resources = Promise.all([
  fetch(new URL("base.json", assets)).then((r) => {
    if (!r.ok) throw Error("基础模型加载失败");
    return r.json() as Promise<Base>;
  }),
  fetch(new URL("NotoSansCJKsc-Bold.otf", assets))
    .then((r) => {
      if (!r.ok) throw Error("字体加载失败");
      return r.arrayBuffer();
    })
    .then((b) => opentype.parse(b)),
]);
self.onmessage = async (
  e: MessageEvent<{ id: number; type: "build" | "export"; config: Config }>,
) => {
  const { id, type, config } = e.data;
  try {
    const [base, font] = await resources;
    const design = buildDesign(config, base, font);
    if (type === "export") {
      const data = export3mf(design, config);
      self.postMessage({ id, type, data }, { transfer: [data.buffer] });
    } else self.postMessage({ id, type, design });
  } catch (error) {
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
