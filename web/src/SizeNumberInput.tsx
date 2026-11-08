// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { useEffect, useRef, useState } from "react";

type SizeNumberInputProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: "%" | "mm";
  onCommit: (value: number) => void;
};

function display(value: number, unit: "%" | "mm"): string {
  return unit === "mm" ? value.toFixed(2) : Number(value.toFixed(6)).toString();
}

/** Keep unfinished typing local; a slider/second field receives only committed numbers. */
export function SizeNumberInput({
  id, label, value, min, max, unit, onCommit,
}: SizeNumberInputProps) {
  const [draft, setDraft] = useState(() => display(value, unit));
  const [editing, setEditing] = useState(false);
  const canceled = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(display(value, unit));
  }, [value, unit, editing]);

  const commit = () => {
    if (canceled.current) {
      canceled.current = false;
      setEditing(false);
      setDraft(display(value, unit));
      return;
    }
    const trimmed = draft.trim();
    const parsed = Number(trimmed.replace(",", "."));
    if (trimmed && Number.isFinite(parsed)) {
      const bounded = Math.max(min, Math.min(max, parsed));
      if (Math.abs(bounded - value) > 0.0000001) onCommit(bounded);
    }
    setEditing(false);
    // The parent will refresh the displayed value after applying the change.
  };

  return (
    <span className="size-numeric">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        max={max}
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => {
          setEditing(true);
          event.currentTarget.select();
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            canceled.current = true;
            event.currentTarget.blur();
          }
        }}
      />
      <span aria-hidden="true">{unit}</span>
    </span>
  );
}
