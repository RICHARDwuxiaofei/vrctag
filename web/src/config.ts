// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { defaults, statuses, type Config } from "./model";
import { getStyle } from "./styles";
export function parseConfig(input: unknown): Config {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("配置必须是 JSON 对象");
  const o = input as Record<string, unknown>;
  if (
    o.schemaVersion !== undefined &&
    o.schemaVersion !== 1 &&
    o.schemaVersion !== 2
  )
    throw Error("不支持的配置版本");
  const c = { ...defaults };
  // Backwards-compatible with schema v1/v2 files without size settings.
  for (const key of ["planarScale", "thicknessScale"] as const) {
    const value = o[key];
    if (
      value !== undefined &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 50 ||
        value > 150)
    ) throw Error("缩放比例必须在 50–150% 之间");
    c[key] = value === undefined ? 100 : value as number;
  }
  if(o.hideStatus !== undefined && typeof o.hideStatus !== "boolean") throw Error("无效状态显示设置");
  if(o.hideStatus !== undefined) c.hideStatus = o.hideStatus as boolean;
  if (
    o.language !== undefined &&
    !["zh", "ja", "ko", "en"].includes(o.language as string)
  )
    throw Error("无效语言");
  if (
    o.statusMode !== undefined &&
    !["preset", "custom"].includes(o.statusMode as string)
  )
    throw Error("无效状态模式");
  if (o.language !== undefined) c.language = o.language as Config["language"];
  if (o.statusMode !== undefined)
    c.statusMode = o.statusMode as Config["statusMode"];
  if (o.hangingLoop !== undefined && typeof o.hangingLoop !== "boolean")
    throw Error("无效挂环设置");
  c.hangingLoop = (o.hangingLoop ?? true) as boolean;
  for (const field of ["displayName", "customStatus", "pronouns"] as const) {
    const value = o[field] ?? defaults[field];
    if (typeof value !== "string" || value.length > 120)
      throw Error("文字字段必须为最多 120 字符的文本");
    c[field] = value;
  }
  if (o.styleId !== undefined && typeof o.styleId !== "string")
    throw Error("无效样式 ID");
  c.styleId = getStyle(o.styleId as string | undefined).id;
  if (o.friend !== undefined && typeof o.friend !== "boolean")
    throw Error("好友设置必须为布尔值");
  c.friend = (o.friend ?? defaults.friend) as boolean;
  if (
    o.status !== undefined &&
    (typeof o.status !== "string" || !Object.hasOwn(statuses, o.status))
  )
    throw Error("无效在线状态");
  c.status = (o.status ?? defaults.status) as Config["status"];
  const color = (value: unknown, auto = false) => {
    if (
      typeof value !== "string" ||
      (!(auto && value === "auto") && !/^#[0-9a-f]{6}$/i.test(value))
    )
      throw Error("无效颜色");
    return value;
  };
  c.dotColor = color(o.dotColor ?? "auto", true);
  if (
    o.printMode !== undefined &&
    o.printMode !== "visual" &&
    o.printMode !== "cfs4"
  )
    throw Error("无效配色方案");
  c.printMode = (o.printMode ?? "cfs4") as Config["printMode"];
  if (o.filamentColors !== undefined) {
    if (!Array.isArray(o.filamentColors) || o.filamentColors.length !== 4)
      throw Error("必须有四个耗材槽");
    c.filamentColors = o.filamentColors.map((v, i) => color(v, i === 3));
  }
  if (o.materialSlots !== undefined) {
    if (
      !o.materialSlots ||
      typeof o.materialSlots !== "object" ||
      Array.isArray(o.materialSlots)
    )
      throw Error("无效部件映射");
    c.materialSlots = {};
    for (const [name, slot] of Object.entries(o.materialSlots)) {
      if (
        ![
          "Plate_Core",
          "Hanging_Loop",
          "Plate_Body",
          "Plate_Rim",
          "Avatar_Back",
          "Avatar_Frame",
          "Status_Dot",
          "Name",
          "Pronouns",
          "Status_Text",
        ].includes(name) ||
        !Number.isInteger(slot) ||
        (slot as number) < 0 ||
        (slot as number) > 3
      )
        throw Error("无效部件或槽位");
      c.materialSlots[name] = slot as number;
    }
  }
  return c;
}
export const configDocument = (c: Config) => ({
  schemaVersion: 2,
  ...c,
  styleId: getStyle(c.styleId).id,
});
