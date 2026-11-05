// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState } from "react";
import { languages, type Language } from "./i18n";

export function LanguagePicker({ language, onChange }: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const options = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
  function show(index: number) {
    setOpen(true);
    requestAnimationFrame(() => options()[index]?.focus());
  }
  return <div className="language-picker" ref={root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); event.preventDefault(); }
      if (!open) return;
      const items = options(), index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "ArrowDown" ? (index + 1) % items.length
        : event.key === "ArrowUp" ? (index - 1 + items.length) % items.length
        : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
    }}>
    <button id="language" className="language-trigger" ref={trigger} type="button"
      aria-label="Language" aria-haspopup="menu" aria-expanded={open} aria-controls="language-menu"
      onClick={() => open ? setOpen(false) : show(Object.keys(languages).indexOf(language))}
      onKeyDown={event => {
        if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault(); event.stopPropagation(); show(event.key === "ArrowDown" ? 0 : 3);
        }
      }}>
      <svg className="language-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>
    </button>
    {open && <div id="language-menu" className="language-menu" role="menu" aria-label="Language">
      {Object.entries(languages).map(([id, name]) => <button key={id} type="button"
        role="menuitemradio" aria-checked={id === language} lang={id === "zh" ? "zh-CN" : id}
        onClick={() => { onChange(id as Language); setOpen(false); trigger.current?.focus(); }}>
        <span>{name}</span><span aria-hidden="true">{id === language ? "✓" : ""}</span>
      </button>)}
    </div>}
  </div>;
}
