import { getStyle } from "./styles";
import { FontStore } from "./font-store";
import { type Base } from "./model";
import { createEngine, type StudioRequest } from "./engine";
const assets = new URL("../assets/", self.location.href);
const fonts = new FontStore(new URL("fonts/", assets));
const bases = new Map<string, Promise<Base>>();
function base(styleId?: string) {
  const style = getStyle(styleId);
  if (!bases.has(style.id))
    bases.set(
      style.id,
      fetch(new URL(style.baseFile, assets), { cache: "no-cache" })
        .then((r) => {
          if (!r.ok) throw Error("基础模型加载失败，可重试");
          return r.json();
        })
        .then((source: Base) => {
          if (source.styleId !== style.id) throw Error("模型样式校验失败");
          return source;
        })
        .catch((e) => {
          bases.delete(style.id);
          throw e;
        }),
    );
  return bases.get(style.id)!;
}
const engine = createEngine({
  loadBase: base,
  loadFont: (text) => fonts.forText(text),
  post: (result) => {
    if (result.data)
      self.postMessage(result, { transfer: [result.data.buffer] });
    else self.postMessage(result);
  },
});
self.onmessage = (e: MessageEvent<StudioRequest>) => engine.submit(e.data);
