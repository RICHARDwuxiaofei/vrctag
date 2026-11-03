// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import catalog from "./styles.catalog.json";
export type StyleDefinition = Omit<
  (typeof catalog.styles)[number],
  "colors"
> & { colors: Record<string, string> };
export const styles = catalog.styles as StyleDefinition[];
export const defaultStyleId = catalog.defaultStyleId;
export function getStyle(id: string = defaultStyleId): StyleDefinition {
  const style = styles.find((s) => s.id === id);
  if (!style) throw new Error(`不支持的名牌样式：${id}`);
  return style;
}
