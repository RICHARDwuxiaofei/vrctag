// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { getStyle } from "./styles";
import type { Config, Part } from "./model";
import { resolvedDot } from "./model";
export function defaultFilamentColors(c: Config): string[] {
  const style = getStyle(c.styleId);
  const profile = "printing" in style ? style.printing : undefined;
  const palette = profile?.palette ?? [
    "Plate_Body",
    "Name",
    "Friend_Name",
    "auto",
  ];
  const colors: Record<string, string> = style.colors;
  return palette.map((role) =>
    role === "auto"
      ? "auto"
      : role === "NameColor"
        ? c.friend
          ? colors.Friend_Name
          : colors.Name
        : colors[role],
  );
}
export function materialPlan(c: Config, parts: Part[]) {
  const color = (v: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(v)) throw Error("无效打印耗材颜色");
    return v.toUpperCase();
  };
  if (c.printMode === "visual") {
    const palette = [...new Set(parts.map((p) => color(p.color)))];
    return {
      mode: "visual",
      palette,
      parts: parts.map((p) => ({
        name: p.name,
        slot: palette.indexOf(color(p.color)),
        color: color(p.color),
      })),
    };
  }
  const palette = (c.filamentColors ?? defaultFilamentColors(c)).map((v, i) =>
    color(v === "auto" && i === 3 ? resolvedDot(c) : v),
  );
  if (palette.length !== 4) throw Error("四槽方案需要四个耗材颜色");
  const style = getStyle(c.styleId);
  const profile = "printing" in style ? style.printing : undefined;
  const slots: Record<string, number> = profile?.slots ?? {
    Plate_Body: 0,
    Avatar_Back: 0,
    Status_Dot: 3,
    Name: 1,
  };
  const defaultSlot = (name: string) =>
    name === "Name" && c.friend
      ? (profile?.friendNameSlot ?? 2)
      : (slots[name] ?? 1);
  return {
    mode: "cfs4",
    palette,
    parts: parts.map((p) => {
      const slot = c.materialSlots?.[p.name] ?? defaultSlot(p.name);
      if (!Number.isInteger(slot) || slot < 0 || slot > 3)
        throw Error("无效耗材槽位");
      return { name: p.name, slot, color: palette[slot] };
    }),
  };
}
