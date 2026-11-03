import catalog from "./styles.catalog.json";
export const styles = catalog.styles;
export const defaultStyleId = catalog.defaultStyleId;
export type StyleDefinition = (typeof styles)[number];
export function getStyle(id: string = defaultStyleId): StyleDefinition {
  const style = styles.find((s) => s.id === id);
  if (!style) throw new Error(`不支持的名牌样式：${id}`);
  return style;
}
